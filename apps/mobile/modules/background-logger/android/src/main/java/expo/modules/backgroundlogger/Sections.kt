package expo.modules.backgroundlogger

import android.content.Context
import android.util.Log
import org.json.JSONObject
import kotlin.math.*

object Sections {
    private const val TAG = "BackgroundLogger.Sections"
    private const val THRESHOLD_M = 150.0

    data class NearbySection(val fromName: String, val toName: String)
    private data class Section(
        val fromName: String,
        val toName: String,
        val coords: List<Pair<Double, Double>>, // (lat, lng)
    )

    private var sections: List<Section> = emptyList()

    fun init(context: Context) {
        if (sections.isNotEmpty()) return
        sections = try {
            val json = context.assets.open("r11_sections.json").bufferedReader().readText()
            val features = JSONObject(json).getJSONArray("features")
            (0 until features.length()).map { i ->
                val feat = features.getJSONObject(i)
                val props = feat.getJSONObject("properties")
                val rawCoords = feat.getJSONObject("geometry").getJSONArray("coordinates")
                val coords = (0 until rawCoords.length()).map { j ->
                    val pt = rawCoords.getJSONArray(j)
                    Pair(pt.getDouble(1), pt.getDouble(0)) // (lat, lng) — GeoJSON is [lng, lat]
                }
                Section(
                    fromName = props.getString("from_stop_name"),
                    toName = props.getString("to_stop_name"),
                    coords = coords,
                )
            }
        } catch (e: Exception) {
            Log.e(TAG, "Failed to load r11_sections.json from assets", e)
            emptyList()
        }
        Log.d(TAG, "Loaded ${sections.size} sections")
    }

    fun nearest(lat: Double, lon: Double): NearbySection? {
        var best: NearbySection? = null
        var bestDist = THRESHOLD_M

        for (section in sections) {
            val d = minDistToLine(lat, lon, section.coords)
            if (d < bestDist) {
                bestDist = d
                best = NearbySection(section.fromName, section.toName)
            }
        }
        return best
    }

    private fun minDistToLine(lat: Double, lon: Double, coords: List<Pair<Double, Double>>): Double {
        var min = Double.MAX_VALUE
        for ((cLat, cLon) in coords) {
            val d = haversine(lat, lon, cLat, cLon)
            if (d < min) min = d
        }
        return min
    }

    private fun haversine(lat1: Double, lon1: Double, lat2: Double, lon2: Double): Double {
        val R = 6_371_000.0
        val dLat = (lat2 - lat1) * PI / 180
        val dLon = (lon2 - lon1) * PI / 180
        val a = sin(dLat / 2).pow(2) +
                cos(lat1 * PI / 180) * cos(lat2 * PI / 180) * sin(dLon / 2).pow(2)
        return R * 2 * atan2(sqrt(a), sqrt(1 - a))
    }
}
