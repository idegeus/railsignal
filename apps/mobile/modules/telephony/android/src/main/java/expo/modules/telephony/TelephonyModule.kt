package expo.modules.telephony

import android.content.Context
import android.os.Build
import android.telephony.*
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class TelephonyModule : Module() {
    private val context get() = requireNotNull(appContext.reactContext)

    override fun definition() = ModuleDefinition {
        Name("Telephony")

        // Returns SignalInfo synchronously.
        // Requires READ_PHONE_STATE permission — caller must check before invoking.
        Function("getSignalInfo") {
            getSignalInfo()
        }
    }

    private fun getSignalInfo(): Map<String, Any?> {
        val tm = context.getSystemService(Context.TELEPHONY_SERVICE) as TelephonyManager

        val cells = try { tm.allCellInfo } catch (_: SecurityException) { null }
        val registeredCell = cells?.firstOrNull { it.isRegistered }

        val signalDbm = readSignalDbm(registeredCell)
        val rsrp = readRsrp(registeredCell)
        val rsrq = readRsrq(registeredCell)
        // Derive RAT from the registered cell — reliable even when data goes over WiFi.
        val networkType = cellInfoToNetworkType(registeredCell)
            ?: resolveNetworkTypeFallback(tm)

        val operator = tm.networkOperator ?: ""
        val mcc = if (operator.length >= 3) operator.substring(0, 3) else null
        val mnc = if (operator.length > 3) operator.substring(3) else null
        val operatorName = tm.networkOperatorName?.takeIf { it.isNotBlank() }

        return mapOf(
            "signalDbm" to signalDbm,
            "rsrp" to rsrp,
            "rsrq" to rsrq,
            "networkType" to networkType,
            "mcc" to mcc,
            "mnc" to mnc,
            "operatorName" to operatorName,
            "roaming" to tm.isNetworkRoaming,
            "androidVersion" to Build.VERSION.SDK_INT,
        )
    }

    private fun readSignalDbm(cell: android.telephony.CellInfo?): Int? {
        if (cell == null) return null
        return try {
            val dbm: Int? = when (cell) {
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
                    (cell.cellSignalStrength as CellSignalStrengthNr).ssRsrp.takeIf { it != Int.MAX_VALUE }
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
                    (cell.cellSignalStrength as CellSignalStrengthNr).ssRsrq.takeIf { it != Int.MAX_VALUE }
                else null
                else -> null
            }
        } catch (_: Exception) { null }
    }

    private fun cellInfoToNetworkType(cell: android.telephony.CellInfo?): String? {
        return when (cell) {
            is CellInfoNr -> "5G"
            is CellInfoLte -> "4G"
            is CellInfoWcdma -> "3G"
            is CellInfoGsm -> "2G"
            else -> null
        }
    }

    // Only used if allCellInfo gives us nothing registered.
    private fun resolveNetworkTypeFallback(tm: TelephonyManager): String {
        val type = try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N)
                tm.dataNetworkType
            else
                @Suppress("DEPRECATION") tm.networkType
        } catch (_: SecurityException) {
            return "unknown"
        }
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
