package expo.modules.backgroundlogger

import android.content.Context
import android.database.Cursor
import android.database.sqlite.SQLiteDatabase
import android.util.Log
import java.io.File

object DbHelper {
    private const val TAG = "BackgroundLogger.DB"
    private var db: SQLiteDatabase? = null

    @Volatile var lastPingMs: Long? = null
    @Volatile var lastPingLatencyMs: Long? = null
    private val recentPings = mutableListOf<Long>()

    fun recordPing(ts: Long, latencyMs: Long) {
        lastPingMs = ts
        lastPingLatencyMs = latencyMs
        synchronized(recentPings) {
            recentPings.add(ts)
            if (recentPings.size > 30) recentPings.removeAt(0)
        }
    }

    fun getRecentPingMs(sinceMs: Long): List<Long> =
        synchronized(recentPings) { recentPings.filter { it >= sinceMs } }

    fun init(context: Context) {
        if (db != null) return
        val dir = File(context.applicationContext.filesDir, "SQLite")
        dir.mkdirs()
        val dbFile = File(dir, "railsignal.db")
        db = SQLiteDatabase.openOrCreateDatabase(dbFile, null).also {
            it.enableWriteAheadLogging()
            ensureSchema(it)
        }
        Log.d(TAG, "Database opened at ${dbFile.absolutePath}")
    }

    private fun ensureSchema(db: SQLiteDatabase) {
        db.execSQL("""
            CREATE TABLE IF NOT EXISTS journey (
              id            TEXT PRIMARY KEY,
              started_at    INTEGER NOT NULL,
              ended_at      INTEGER,
              reading_count INTEGER NOT NULL DEFAULT 0
            )
        """.trimIndent())
        db.execSQL("""
            CREATE TABLE IF NOT EXISTS signal_reading (
              id              TEXT PRIMARY KEY,
              journey_id      TEXT REFERENCES journey(id),
              timestamp       INTEGER NOT NULL,
              lat             REAL,
              lng             REAL,
              lat_grid        REAL,
              lng_grid        REAL,
              signal_dbm      INTEGER,
              rsrp            INTEGER,
              rsrq            INTEGER,
              sinr            REAL,
              network_type    TEXT,
              mcc             TEXT,
              mnc             TEXT,
              operator_name   TEXT,
              roaming         INTEGER,
              android_version INTEGER,
              speed_kmh       REAL,
              gps_accuracy    REAL,
              pci             INTEGER,
              earfcn          INTEGER,
              band            INTEGER,
              cqi             INTEGER,
              timing_advance  INTEGER,
              cell_count      INTEGER,
              last_ping_ms         INTEGER,
              last_ping_latency_ms INTEGER,
              upload_status   TEXT NOT NULL DEFAULT 'pending',
              uploaded_at     INTEGER
            )
        """.trimIndent())
        // Migrate existing installs: add columns that may not yet exist
        listOf(
            "sinr REAL",
            "gps_accuracy REAL",
            "pci INTEGER",
            "earfcn INTEGER",
            "band INTEGER",
            "cqi INTEGER",
            "timing_advance INTEGER",
            "cell_count INTEGER",
            "last_ping_ms INTEGER",
            "last_ping_latency_ms INTEGER",
        ).forEach { colDef ->
            try { db.execSQL("ALTER TABLE signal_reading ADD COLUMN $colDef") }
            catch (_: Exception) { /* already exists */ }
        }
        db.execSQL("CREATE INDEX IF NOT EXISTS idx_reading_journey ON signal_reading(journey_id)")
        db.execSQL("CREATE INDEX IF NOT EXISTS idx_reading_upload  ON signal_reading(upload_status)")
    }

    // ── Journey ───────────────────────────────────────────────────────────────

    fun startJourney(id: String) {
        db?.execSQL(
            "INSERT INTO journey (id, started_at) VALUES (?, ?)",
            arrayOf(id, System.currentTimeMillis())
        )
    }

    fun endJourney(id: String) {
        db?.execSQL(
            "UPDATE journey SET ended_at = ? WHERE id = ?",
            arrayOf(System.currentTimeMillis(), id)
        )
    }

    fun getJourneysByIds(ids: List<String>): List<Map<String, Any?>> {
        if (ids.isEmpty()) return emptyList()
        val placeholders = ids.joinToString(",") { "?" }
        val cursor = db?.rawQuery(
            "SELECT id, started_at, ended_at, reading_count FROM journey WHERE id IN ($placeholders)",
            ids.toTypedArray()
        ) ?: return emptyList()
        return cursor.use { it.toListOfMaps() }
    }

    // ── Readings ──────────────────────────────────────────────────────────────

    fun insertReading(
        id: String,
        journeyId: String?,
        timestamp: Long,
        lat: Double,
        lng: Double,
        latGrid: Double,
        lngGrid: Double,
        signalDbm: Int?,
        rsrp: Int?,
        rsrq: Int?,
        sinr: Double?,
        networkType: String?,
        mcc: String?,
        mnc: String?,
        operatorName: String?,
        roaming: Boolean,
        androidVersion: Int,
        speedKmh: Double?,
        gpsAccuracy: Double?,
        pci: Int?,
        earfcn: Int?,
        band: Int?,
        cqi: Int?,
        timingAdvance: Int?,
        cellCount: Int?,
        lastPingMs: Long?,
        lastPingLatencyMs: Long?,
    ) {
        try {
            db?.execSQL(
                """
                INSERT OR IGNORE INTO signal_reading
                  (id, journey_id, timestamp, lat, lng, lat_grid, lng_grid,
                   signal_dbm, rsrp, rsrq, sinr, network_type, mcc, mnc,
                   operator_name, roaming, android_version, speed_kmh,
                   gps_accuracy, pci, earfcn, band, cqi, timing_advance, cell_count,
                   last_ping_ms, last_ping_latency_ms)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """.trimIndent(),
                arrayOf(
                    id, journeyId, timestamp, lat, lng, latGrid, lngGrid,
                    signalDbm, rsrp, rsrq, sinr, networkType, mcc, mnc,
                    operatorName, if (roaming) 1 else 0, androidVersion, speedKmh,
                    gpsAccuracy, pci, earfcn, band, cqi, timingAdvance, cellCount,
                    lastPingMs, lastPingLatencyMs,
                )
            )
            if (journeyId != null) {
                db?.execSQL(
                    "UPDATE journey SET reading_count = reading_count + 1 WHERE id = ?",
                    arrayOf(journeyId)
                )
            }
        } catch (e: Exception) {
            Log.e(TAG, "insertReading failed", e)
        }
    }

    fun getReadingCount(): Int {
        val cursor = db?.rawQuery("SELECT COUNT(*) FROM signal_reading", null)
            ?: return 0
        return cursor.use { c -> if (c.moveToFirst()) c.getInt(0) else 0 }
    }

    fun getPendingReadingCount(): Int {
        val cursor = db?.rawQuery(
            "SELECT COUNT(*) FROM signal_reading WHERE upload_status = 'pending'", null
        ) ?: return 0
        return cursor.use { c -> if (c.moveToFirst()) c.getInt(0) else 0 }
    }

    fun getRecentReadings(sinceMs: Long): List<Map<String, Any?>> {
        val cursor = db?.rawQuery(
            "SELECT timestamp, signal_dbm FROM signal_reading WHERE timestamp > ? ORDER BY timestamp ASC",
            arrayOf(sinceMs.toString())
        ) ?: return emptyList()
        return cursor.use { it.toListOfMaps() }
    }

    fun getPendingReadings(limit: Int): List<Map<String, Any?>> {
        val cursor = db?.rawQuery(
            "SELECT * FROM signal_reading WHERE upload_status = 'pending' ORDER BY timestamp LIMIT ?",
            arrayOf(limit.toString())
        ) ?: return emptyList()
        return cursor.use { it.toListOfMaps() }
    }

    fun markUploaded(ids: List<String>) {
        if (ids.isEmpty()) return
        val placeholders = ids.joinToString(",") { "?" }
        val args = arrayOf(System.currentTimeMillis().toString(), *ids.toTypedArray())
        db?.execSQL(
            "UPDATE signal_reading SET upload_status = 'uploaded', uploaded_at = ? WHERE id IN ($placeholders)",
            args
        )
    }

    fun getAllReadings(): List<Map<String, Any?>> {
        val cursor = db?.rawQuery(
            "SELECT * FROM signal_reading ORDER BY timestamp", null
        ) ?: return emptyList()
        return cursor.use { it.toListOfMaps() }
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private fun Cursor.toListOfMaps(): List<Map<String, Any?>> {
        val result = mutableListOf<Map<String, Any?>>()
        while (moveToNext()) {
            val row = mutableMapOf<String, Any?>()
            for (i in 0 until columnCount) {
                row[getColumnName(i)] = when (getType(i)) {
                    Cursor.FIELD_TYPE_NULL -> null
                    Cursor.FIELD_TYPE_INTEGER -> getLong(i)
                    Cursor.FIELD_TYPE_FLOAT -> getDouble(i)
                    Cursor.FIELD_TYPE_STRING -> getString(i)
                    else -> null
                }
            }
            result.add(row)
        }
        return result
    }
}
