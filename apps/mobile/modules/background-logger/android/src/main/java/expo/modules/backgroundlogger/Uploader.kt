package expo.modules.backgroundlogger

import android.util.Log
import org.json.JSONArray
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.TimeZone

object Uploader {
    private const val TAG = "BackgroundLogger.Upload"
    private const val API_BASE = "https://viesambcobertura.cat"
    private const val CHUNK_SIZE = 500

    private val iso8601 = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US).apply {
        timeZone = TimeZone.getTimeZone("UTC")
    }

    // Called from dbExecutor thread — runs synchronously.
    fun attemptUpload() {
        val rows = DbHelper.getPendingReadings(CHUNK_SIZE)
        if (rows.isEmpty()) return

        val ids = rows.mapNotNull { it["id"] as? String }
        val journeyIds = rows.mapNotNull { it["journey_id"] as? String }.distinct()
        val journeyRows = if (journeyIds.isNotEmpty()) DbHelper.getJourneysByIds(journeyIds) else emptyList()

        val payload = buildPayload(journeyRows, rows)

        try {
            val conn = URL("$API_BASE/api/v1/readings").openConnection() as HttpURLConnection
            conn.requestMethod = "POST"
            conn.setRequestProperty("Content-Type", "application/json; charset=utf-8")
            conn.doOutput = true
            conn.connectTimeout = 10_000
            conn.readTimeout = 10_000
            conn.outputStream.use { it.write(payload.toString().toByteArray(Charsets.UTF_8)) }
            val status = conn.responseCode
            conn.disconnect()

            if (status in 200..299) {
                DbHelper.markUploaded(ids)
                Log.d(TAG, "Uploaded ${ids.size} readings (HTTP $status)")
            } else {
                Log.w(TAG, "Upload rejected HTTP $status")
            }
        } catch (e: Exception) {
            Log.d(TAG, "Upload failed: ${e.message}")
        }
    }

    private fun buildPayload(
        journeys: List<Map<String, Any?>>,
        readings: List<Map<String, Any?>>,
    ): JSONObject {
        val journeyArr = JSONArray()
        journeys.forEach { j ->
            journeyArr.put(JSONObject().apply {
                put("id", j["id"])
                put("started_at", msToIso(j["started_at"] as Long))
                val endedAt = j["ended_at"] as? Long
                put("ended_at", if (endedAt != null) msToIso(endedAt) else JSONObject.NULL)
                put("platform", "android")
                put("app_version", "0.1.0")
            })
        }

        val readingArr = JSONArray()
        readings.forEach { r ->
            readingArr.put(JSONObject().apply {
                put("id", r["id"])
                putNullable("journey_id", r["journey_id"])
                put("timestamp", msToIso(r["timestamp"] as Long))
                putNullable("lat", r["lat_grid"])
                putNullable("lng", r["lng_grid"])
                putNullable("signal_dbm", r["signal_dbm"])
                putNullable("rsrp", r["rsrp"])
                putNullable("rsrq", r["rsrq"])
                putNullable("sinr", r["sinr"])
                putNullable("network_type", r["network_type"])
                putNullable("mcc", r["mcc"])
                putNullable("mnc", r["mnc"])
                putNullable("speed_kmh", r["speed_kmh"])
                putNullable("gps_accuracy", r["gps_accuracy"])
                putNullable("pci", r["pci"])
                putNullable("earfcn", r["earfcn"])
                putNullable("band", r["band"])
                putNullable("cqi", r["cqi"])
                putNullable("timing_advance", r["timing_advance"])
                putNullable("cell_count", r["cell_count"])
                putNullable("last_ping_ms", r["last_ping_ms"])
                putNullable("last_ping_latency_ms", r["last_ping_latency_ms"])
                put("platform", "android")
                put("app_version", "0.1.0")
            })
        }

        return JSONObject().apply {
            put("journeys", journeyArr)
            put("readings", readingArr)
        }
    }

    private fun msToIso(ms: Long): String = iso8601.format(Date(ms))

    private fun JSONObject.putNullable(key: String, value: Any?) {
        if (value != null) put(key, value) else put(key, JSONObject.NULL)
    }
}
