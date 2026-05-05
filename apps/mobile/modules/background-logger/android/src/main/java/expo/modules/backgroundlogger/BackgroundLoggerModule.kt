package expo.modules.backgroundlogger

import android.content.Intent
import android.os.Build
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class BackgroundLoggerModule : Module() {
    private val context get() = requireNotNull(appContext.reactContext)

    override fun definition() = ModuleDefinition {
        Name("BackgroundLogger")

        OnCreate {
            DbHelper.init(context)
        }

        // ── Service control ───────────────────────────────────────────────────

        Function("start") { journeyId: String ->
            val intent = Intent(context, LocationService::class.java).apply {
                action = LocationService.ACTION_START
                putExtra(LocationService.EXTRA_JOURNEY_ID, journeyId)
            }
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(intent)
            } else {
                context.startService(intent)
            }
        }

        Function("stop") {
            val intent = Intent(context, LocationService::class.java).apply {
                action = LocationService.ACTION_STOP
            }
            context.startService(intent)
        }

        Function("isRunning") {
            LocationService.isRunning
        }

        // ── Journey ───────────────────────────────────────────────────────────

        AsyncFunction("startJourney") { id: String ->
            DbHelper.startJourney(id)
        }

        AsyncFunction("endJourney") { id: String ->
            DbHelper.endJourney(id)
        }

        AsyncFunction("getJourneysByIds") { ids: List<String> ->
            DbHelper.getJourneysByIds(ids)
        }

        // ── Readings ──────────────────────────────────────────────────────────

        AsyncFunction("getReadingCount") {
            DbHelper.getReadingCount()
        }

        AsyncFunction("getPendingReadingCount") {
            DbHelper.getPendingReadingCount()
        }

        AsyncFunction("getLastPingMs") {
            DbHelper.lastPingMs
        }

        AsyncFunction("getRecentPingMs") { sinceMs: Double ->
            DbHelper.getRecentPingMs(sinceMs.toLong())
        }

        AsyncFunction("setLastPingMs") { ts: Double, latencyMs: Double ->
            DbHelper.recordPing(ts.toLong(), latencyMs.toLong())
        }

        AsyncFunction("getRecentReadings") { sinceMs: Double ->
            DbHelper.getRecentReadings(sinceMs.toLong())
        }

        AsyncFunction("getPendingReadings") { limit: Int ->
            DbHelper.getPendingReadings(limit)
        }

        AsyncFunction("markUploaded") { ids: List<String> ->
            DbHelper.markUploaded(ids)
        }

        AsyncFunction("getAllReadings") {
            DbHelper.getAllReadings()
        }
    }
}
