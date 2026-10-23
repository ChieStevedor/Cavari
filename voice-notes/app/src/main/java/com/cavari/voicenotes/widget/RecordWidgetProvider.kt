package com.cavari.voicenotes.widget

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.widget.RemoteViews
import androidx.core.content.ContextCompat
import com.cavari.voicenotes.R
import com.cavari.voicenotes.service.RecordingForegroundService
import com.cavari.voicenotes.util.RecordingState

/** A single home-screen button that starts/stops a recording without opening the app. */
class RecordWidgetProvider : AppWidgetProvider() {

    override fun onUpdate(context: Context, appWidgetManager: AppWidgetManager, appWidgetIds: IntArray) {
        appWidgetIds.forEach { id -> updateWidget(context, appWidgetManager, id) }
    }

    override fun onReceive(context: Context, intent: Intent) {
        super.onReceive(context, intent)
        when (intent.action) {
            ACTION_TOGGLE -> {
                val isRecording = RecordingState.isRecording(context)
                val action = if (isRecording) {
                    RecordingForegroundService.ACTION_STOP
                } else {
                    RecordingForegroundService.ACTION_START
                }
                val serviceIntent = Intent(context, RecordingForegroundService::class.java).setAction(action)
                ContextCompat.startForegroundService(context, serviceIntent)
                RecordingState.setRecording(context, !isRecording)
                refreshAllWidgets(context)
            }
            RecordingForegroundService.ACTION_STATE_CHANGED -> {
                val isRecording = intent.getBooleanExtra(RecordingForegroundService.EXTRA_IS_RECORDING, false)
                RecordingState.setRecording(context, isRecording)
                refreshAllWidgets(context)
            }
        }
    }

    private fun refreshAllWidgets(context: Context) {
        val manager = AppWidgetManager.getInstance(context)
        val ids = manager.getAppWidgetIds(ComponentName(context, RecordWidgetProvider::class.java))
        ids.forEach { updateWidget(context, manager, it) }
    }

    private fun updateWidget(context: Context, manager: AppWidgetManager, widgetId: Int) {
        val isRecording = RecordingState.isRecording(context)
        val views = RemoteViews(context.packageName, R.layout.widget_record)
        views.setImageViewResource(
            R.id.widget_button,
            if (isRecording) R.drawable.ic_stop else R.drawable.ic_mic
        )
        val toggleIntent = Intent(context, RecordWidgetProvider::class.java).setAction(ACTION_TOGGLE)
        val pendingIntent = PendingIntent.getBroadcast(
            context, 0, toggleIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        views.setOnClickPendingIntent(R.id.widget_button, pendingIntent)
        manager.updateAppWidget(widgetId, views)
    }

    companion object {
        const val ACTION_TOGGLE = "com.cavari.voicenotes.action.WIDGET_TOGGLE"
    }
}
