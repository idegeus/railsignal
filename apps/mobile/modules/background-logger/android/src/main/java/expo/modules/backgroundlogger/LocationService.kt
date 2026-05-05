package expo.modules.backgroundlogger

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.IBinder
import android.os.Looper
import android.telephony.*
import android.util.Log
import com.google.android.gms.location.*
import java.util.UUID
import java.util.concurrent.Executors
import kotlin.math.*

class LocationService : Service() {

    companion object {
        private const val TAG = "BackgroundLogger"
        const val ACTION_START = "expo.modules.backgroundlogger.START"
        const val ACTION_STOP = "expo.modules.backgroundlogger.STOP"
        const val EXTRA_JOURNEY_ID = "journey_id"
        private const val NOTIFICATION_ID = 9001
        private const val CHANNEL_ID = "railsignal_tracking"
        private const val PING_URL = "https://clients3.google.com/generate_204"
        @Volatile var isRunning = false
    }

    private lateinit var fusedLocationClient: FusedLocationProviderClient
    private lateinit var locationCallback: LocationCallback
    private var journeyId: String? = null
    private val dbExecutor = Executors.newSingleThreadExecutor()

    private var lastSignalDbm: Int? = null
    private var lastNetworkType: String? = null
    private var lastSection: Sections.NearbySection? = null
    private var lastStationName: String? = null

    override fun onCreate() {
        super.onCreate()
        fusedLocationClient = LocationServices.getFusedLocationProviderClient(this)
        DbHelper.init(this)
        Stations.init(this)
        Sections.init(this)
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            ACTION_START -> {
                journeyId = intent.getStringExtra(EXTRA_JOURNEY_ID)
                Log.d(TAG, "Starting with journeyId=$journeyId")
                isRunning = true
                startForegroundService()
                startLocationUpdates()
            }
            ACTION_STOP -> {
                Log.d(TAG, "Stop command received")
                isRunning = false
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                    stopForeground(STOP_FOREGROUND_REMOVE)
                } else {
                    @Suppress("DEPRECATION")
                    stopForeground(true)
                }
                stopSelf()
            }
        }
        return START_NOT_STICKY
    }

    override fun onDestroy() {
        isRunning = false
        try { fusedLocationClient.removeLocationUpdates(locationCallback) } catch (_: Exception) {}
        dbExecutor.shutdown()
        super.onDestroy()
    }

    override fun onBind(intent: Intent?): IBinder? = null

    private fun startForegroundService() {
        createNotificationChannel()
        val notification = buildNotification("Logging signal quality…")
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
            startForeground(NOTIFICATION_ID, notification, android.content.pm.ServiceInfo.FOREGROUND_SERVICE_TYPE_LOCATION)
        } else {
            startForeground(NOTIFICATION_ID, notification)
        }
    }

    private fun startLocationUpdates() {
        val request = LocationRequest.Builder(Priority.PRIORITY_HIGH_ACCURACY, 10_000L)
            .setMinUpdateIntervalMillis(8_000L)
            .setWaitForAccurateLocation(false)
            .build()

        locationCallback = object : LocationCallback() {
            override fun onLocationResult(result: LocationResult) {
                result.lastLocation?.let { onLocation(it) }
            }
        }

        try {
            fusedLocationClient.requestLocationUpdates(
                request,
                locationCallback,
                Looper.getMainLooper(),
            )
        } catch (e: SecurityException) {
            Log.e(TAG, "Location permission denied, stopping service", e)
            stopSelf()
        }
    }

    private fun onLocation(loc: android.location.Location) {
        val signal = readSignalInfo()
        lastSignalDbm = signal.signalDbm
        lastNetworkType = signal.networkType

        val speedKmh = if (loc.hasSpeed() && loc.speed >= 0f) loc.speed * 3.6 else null

        val gridDeg = 0.00045
        val latGrid = (loc.latitude / gridDeg).roundToLong() * gridDeg
        val lngGrid = (loc.longitude / gridDeg).roundToLong() * gridDeg

        lastSection = Sections.nearest(loc.latitude, loc.longitude)
        val nearest = Stations.nearest(loc.latitude, loc.longitude)
        lastStationName = if (lastSection == null && nearest.distanceMetres < 1500.0) nearest.name else null

        val gpsAccuracy = if (loc.hasAccuracy()) loc.accuracy.toDouble() else null

        val readingId = UUID.randomUUID().toString()
        val ts = System.currentTimeMillis()
        val jid = journeyId
        dbExecutor.execute {
            DbHelper.insertReading(
                id            = readingId,
                journeyId     = jid,
                timestamp     = ts,
                lat           = loc.latitude,
                lng           = loc.longitude,
                latGrid       = latGrid,
                lngGrid       = lngGrid,
                signalDbm     = signal.signalDbm,
                rsrp          = signal.rsrp,
                rsrq          = signal.rsrq,
                sinr          = signal.sinr,
                networkType   = signal.networkType,
                mcc           = signal.mcc,
                mnc           = signal.mnc,
                operatorName  = signal.operatorName,
                roaming       = signal.roaming,
                androidVersion = Build.VERSION.SDK_INT,
                speedKmh      = speedKmh,
                gpsAccuracy   = gpsAccuracy,
                pci           = signal.pci,
                earfcn        = signal.earfcn,
                band          = signal.band,
                cqi           = signal.cqi,
                timingAdvance = signal.timingAdvance,
                cellCount     = signal.cellCount,
                lastPingMs        = DbHelper.lastPingMs,
                lastPingLatencyMs = DbHelper.lastPingLatencyMs,
            )
            Log.d(TAG, "Reading inserted — ${signal.signalDbm} dBm ${signal.networkType} pci=${signal.pci} band=${signal.band}")
        }

        doPing()
        updateNotification()
    }

    private fun doPing() {
        dbExecutor.execute {
            try {
                val conn = java.net.URL(PING_URL).openConnection()
                    as java.net.HttpURLConnection
                conn.requestMethod = "HEAD"
                conn.connectTimeout = 5_000
                conn.readTimeout = 5_000
                val t0 = System.currentTimeMillis()
                val ok = conn.responseCode in 200..299
                val latencyMs = System.currentTimeMillis() - t0
                conn.disconnect()
                if (ok) {
                    DbHelper.recordPing(System.currentTimeMillis(), latencyMs)
                    Uploader.attemptUpload()
                }
            } catch (_: Exception) {}
        }
    }

    private fun updateNotification() {
        val nm = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        nm.notify(NOTIFICATION_ID, buildNotification(notificationBody()))
    }

    private fun notificationBody(): String {
        val signalPart = if (lastSignalDbm != null)
            "${lastSignalDbm} dBm${if (lastNetworkType != null) " ($lastNetworkType)" else ""}"
        else
            "Logging signal quality…"
        val locationPart = when {
            lastSection != null -> " · ${lastSection!!.fromName} → ${lastSection!!.toName}"
            lastStationName != null -> " · Near $lastStationName"
            else -> ""
        }
        return "$signalPart$locationPart"
    }

    private fun buildNotification(body: String): Notification {
        val iconResId = applicationContext.resources
            .getIdentifier("notification_icon", "drawable", applicationContext.packageName)
            .takeIf { it != 0 } ?: android.R.drawable.ic_menu_mylocation

        val openApp = packageManager.getLaunchIntentForPackage(packageName)
            ?.apply { flags = Intent.FLAG_ACTIVITY_SINGLE_TOP }
        val tapIntent = PendingIntent.getActivity(
            this, 0, openApp,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
        )

        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            Notification.Builder(this, CHANNEL_ID)
                .setContentTitle("Vies amb Cobertura")
                .setContentText(body)
                .setSmallIcon(iconResId)
                .setContentIntent(tapIntent)
                .setOngoing(true)
                .setOnlyAlertOnce(true)
                .apply {
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                        setForegroundServiceBehavior(Notification.FOREGROUND_SERVICE_IMMEDIATE)
                    }
                }
                .build()
        } else {
            @Suppress("DEPRECATION")
            Notification.Builder(this)
                .setContentTitle("Vies amb Cobertura")
                .setContentText(body)
                .setSmallIcon(iconResId)
                .setContentIntent(tapIntent)
                .setOngoing(true)
                .setOnlyAlertOnce(true)
                .build()
        }
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "Signal tracking",
                NotificationManager.IMPORTANCE_LOW,
            ).apply {
                description = "Active journey signal recording"
                setShowBadge(false)
            }
            val nm = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            nm.createNotificationChannel(channel)
        }
    }

    // ── Signal reading ────────────────────────────────────────────────────────

    private data class SignalInfo(
        val signalDbm: Int?,
        val rsrp: Int?,
        val rsrq: Int?,
        val sinr: Double?,
        val networkType: String?,
        val mcc: String?,
        val mnc: String?,
        val operatorName: String?,
        val roaming: Boolean,
        val pci: Int?,
        val earfcn: Int?,
        val band: Int?,
        val cqi: Int?,
        val timingAdvance: Int?,
        val cellCount: Int?,
    )

    private fun readSignalInfo(): SignalInfo {
        val tm = getSystemService(Context.TELEPHONY_SERVICE) as TelephonyManager
        val cells = try { tm.allCellInfo } catch (_: SecurityException) { null }
        val registered = cells?.firstOrNull { it.isRegistered }

        val operator = tm.networkOperator ?: ""
        return SignalInfo(
            signalDbm    = readSignalDbm(registered),
            rsrp         = readRsrp(registered),
            rsrq         = readRsrq(registered),
            sinr         = readSinr(registered),
            networkType  = cellInfoToNetworkType(registered) ?: resolveNetworkTypeFallback(tm),
            mcc          = if (operator.length >= 3) operator.substring(0, 3) else null,
            mnc          = if (operator.length > 3) operator.substring(3) else null,
            operatorName = tm.networkOperatorName?.takeIf { it.isNotBlank() },
            roaming      = tm.isNetworkRoaming,
            pci          = readPci(registered),
            earfcn       = readEarfcn(registered),
            band         = readBand(registered),
            cqi          = readCqi(registered),
            timingAdvance = readTimingAdvance(registered),
            cellCount    = cells?.size,
        )
    }

    private fun readSignalDbm(cell: android.telephony.CellInfo?): Int? {
        if (cell == null) return null
        return try {
            val dbm = when (cell) {
                is CellInfoLte -> cell.cellSignalStrength.dbm
                is CellInfoNr -> if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q)
                    cell.cellSignalStrength.dbm else null
                is CellInfoWcdma -> cell.cellSignalStrength.dbm
                is CellInfoGsm -> cell.cellSignalStrength.dbm
                else -> null
            }
            dbm?.takeIf { it != Int.MAX_VALUE }
        } catch (_: Exception) { null }
    }

    private fun readRsrp(cell: android.telephony.CellInfo?): Int? {
        if (cell == null) return null
        return try {
            when (cell) {
                is CellInfoLte -> cell.cellSignalStrength.rsrp.takeIf { it != Int.MAX_VALUE }
                is CellInfoNr -> if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q)
                    (cell.cellSignalStrength as CellSignalStrengthNr).ssRsrp
                        .takeIf { it != Int.MAX_VALUE }
                else null
                else -> null
            }
        } catch (_: Exception) { null }
    }

    private fun readRsrq(cell: android.telephony.CellInfo?): Int? {
        if (cell == null) return null
        return try {
            when (cell) {
                is CellInfoLte -> cell.cellSignalStrength.rsrq.takeIf { it != Int.MAX_VALUE }
                is CellInfoNr -> if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q)
                    (cell.cellSignalStrength as CellSignalStrengthNr).ssRsrq
                        .takeIf { it != Int.MAX_VALUE }
                else null
                else -> null
            }
        } catch (_: Exception) { null }
    }

    // LTE rssnr is in 0.1 dB units (range -200..300 → -20..+30 dB); NR ssSinr is already dB.
    private fun readSinr(cell: android.telephony.CellInfo?): Double? {
        if (cell == null) return null
        return try {
            when (cell) {
                is CellInfoLte -> {
                    val v = cell.cellSignalStrength.rssnr
                    if (v != Int.MAX_VALUE) v / 10.0 else null
                }
                is CellInfoNr -> if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                    val v = (cell.cellSignalStrength as CellSignalStrengthNr).ssSinr
                    if (v != Int.MAX_VALUE) v.toDouble() else null
                } else null
                else -> null
            }
        } catch (_: Exception) { null }
    }

    private fun readPci(cell: android.telephony.CellInfo?): Int? {
        if (cell == null) return null
        return try {
            val v = when (cell) {
                is CellInfoLte   -> cell.cellIdentity.pci
                is CellInfoNr    -> if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q)
                    (cell.cellIdentity as CellIdentityNr).pci else null
                is CellInfoWcdma -> cell.cellIdentity.psc
                else -> null
            }
            v?.takeIf { it != Int.MAX_VALUE }
        } catch (_: Exception) { null }
    }

    private fun readEarfcn(cell: android.telephony.CellInfo?): Int? {
        if (cell == null) return null
        return try {
            val v = when (cell) {
                is CellInfoLte -> cell.cellIdentity.earfcn
                is CellInfoNr  -> if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q)
                    (cell.cellIdentity as CellIdentityNr).nrarfcn else null
                else -> null
            }
            v?.takeIf { it != Int.MAX_VALUE }
        } catch (_: Exception) { null }
    }

    private fun readBand(cell: android.telephony.CellInfo?): Int? {
        if (cell == null || Build.VERSION.SDK_INT < Build.VERSION_CODES.R) return null
        return try {
            when (cell) {
                is CellInfoLte -> cell.cellIdentity.bands.firstOrNull()
                is CellInfoNr  -> (cell.cellIdentity as CellIdentityNr).bands.firstOrNull()
                else -> null
            }
        } catch (_: Exception) { null }
    }

    private fun readCqi(cell: android.telephony.CellInfo?): Int? {
        if (cell == null) return null
        return try {
            when (cell) {
                is CellInfoLte -> cell.cellSignalStrength.cqi.takeIf { it != Int.MAX_VALUE }
                else -> null
            }
        } catch (_: Exception) { null }
    }

    private fun readTimingAdvance(cell: android.telephony.CellInfo?): Int? {
        if (cell == null) return null
        return try {
            val v = when (cell) {
                is CellInfoLte -> cell.cellSignalStrength.timingAdvance
                is CellInfoGsm -> cell.cellSignalStrength.timingAdvance
                else -> null
            }
            v?.takeIf { it != Int.MAX_VALUE }
        } catch (_: Exception) { null }
    }

    private fun cellInfoToNetworkType(cell: android.telephony.CellInfo?): String? = when (cell) {
        is CellInfoNr -> "5G"
        is CellInfoLte -> "4G"
        is CellInfoWcdma -> "3G"
        is CellInfoGsm -> "2G"
        else -> null
    }

    private fun resolveNetworkTypeFallback(tm: TelephonyManager): String {
        val type = try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) tm.dataNetworkType
            else @Suppress("DEPRECATION") tm.networkType
        } catch (_: SecurityException) { return "unknown" }
        return when (type) {
            TelephonyManager.NETWORK_TYPE_NR -> "5G"
            TelephonyManager.NETWORK_TYPE_LTE -> "4G"
            TelephonyManager.NETWORK_TYPE_HSDPA,
            TelephonyManager.NETWORK_TYPE_HSUPA,
            TelephonyManager.NETWORK_TYPE_HSPA,
            TelephonyManager.NETWORK_TYPE_HSPAP,
            TelephonyManager.NETWORK_TYPE_UMTS -> "3G"
            TelephonyManager.NETWORK_TYPE_EDGE,
            TelephonyManager.NETWORK_TYPE_GPRS -> "2G"
            else -> "none"
        }
    }
}
