package expo.modules.backgroundlogger

import android.content.Context
import android.util.Log
import org.json.JSONObject
import kotlin.math.*

object Stations {
    private const val TAG = "BackgroundLogger.Stations"

    data class Nearest(val name: String, val distanceMetres: Double)
    private data class Station(val name: String, val lat: Double, val lon: Double)

    private var stations: List<Station> = emptyList()

    fun init(context: Context) {
        if (stations.isNotEmpty()) return
        stations = try {
            val json = context.assets.open("r11_stations.json").bufferedReader().readText()
            val features = JSONObject(json).getJSONArray("features")
            (0 until features.length()).map { i ->
                val props = features.getJSONObject(i).getJSONObject("properties")
                Station(
                    name = props.getString("stop_name"),
                    lat = props.getDouble("stop_lat"),
                    lon = props.getDouble("stop_lon"),
                )
            }
        } catch (e: Exception) {
            Log.e(TAG, "Failed to load r11_stations.json from assets", e)
            emptyList()
        }
        Log.d(TAG, "Loaded ${stations.size} stations")
    }

    fun nearest(lat: Double, lon: Double): Nearest {
        var bestName = ""
        var bestDist = Double.MAX_VALUE
        for (s in stations) {
            val d = haversine(lat, lon, s.lat, s.lon)
            if (d < bestDist) {
                bestDist = d
                bestName = s.name
            }
        }
        return Nearest(bestName, bestDist)
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
