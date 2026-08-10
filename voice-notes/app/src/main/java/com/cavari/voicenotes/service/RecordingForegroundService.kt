package com.cavari.voicenotes.service

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Intent
import android.os.Build
import android.os.IBinder
import androidx.core.app.NotificationCompat
import com.cavari.voicenotes.MainActivity
import com.cavari.voicenotes.R
import com.cavari.voicenotes.recording.NoteCaptureController
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job

/**
 * Handles a single record → transcribe → save cycle started from the mic
 * button or the home screen widget — both are user-initiated triggers, so
 * starting a microphone-type foreground service here is allowed. (The
 * wake-word path does NOT use this service — see [WakeWordService].)
 */
class RecordingForegroundService : Service() {

    private val serviceScope = CoroutineScope(Dispatchers.IO + Job())
    private lateinit var controller: NoteCaptureController

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
        controller = NoteCaptureController(
            context = this,
            scope = serviceScope,
            onPhase = { text -> updateNotification(text) },
            onFinished = { text ->
                showResultNotification(text)
                stopSelf()
            }
        )
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            ACTION_START -> {
                startForeground(NOTIFICATION_ID, buildNotification(getString(R.string.notif_recording)))
                controller.startRecording(autoStop = intent.getBooleanExtra(EXTRA_AUTO_STOP, false))
            }
            ACTION_STOP -> controller.stopRecording()
            else -> stopSelf()
        }
        return START_NOT_STICKY
    }

    /** Posted as a separate, non-ongoing notification so it survives after the service stops. */
    private fun showResultNotification(text: String) {
        val openIntent = PendingIntent.getActivity(
            this, 0, Intent(this, MainActivity::class.java),
            PendingIntent.FLAG_IMMUTABLE
        )
        val notification = NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle(getString(R.string.app_name))
            .setContentText(text)
            .setStyle(NotificationCompat.BigTextStyle().bigText(text))
            .setSmallIcon(R.drawable.ic_mic)
            .setContentIntent(openIntent)
            .setAutoCancel(true)
            .build()
        getSystemService(NotificationManager::class.java).notify(RESULT_NOTIFICATION_ID, notification)
    }

    private fun buildNotification(text: String): Notification {
        val openIntent = PendingIntent.getActivity(
            this, 0, Intent(this, MainActivity::class.java),
            PendingIntent.FLAG_IMMUTABLE
        )
        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle(getString(R.string.app_name))
            .setContentText(text)
            .setSmallIcon(R.drawable.ic_mic)
            .setContentIntent(openIntent)
            .setOngoing(true)
            .build()
    }

    private fun updateNotification(text: String) {
        getSystemService(NotificationManager::class.java).notify(NOTIFICATION_ID, buildNotification(text))
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID, getString(R.string.channel_recording), NotificationManager.IMPORTANCE_LOW
            )
            getSystemService(NotificationManager::class.java).createNotificationChannel(channel)
        }
    }

    override fun onDestroy() {
        serviceScope.coroutineContext[Job]?.cancel()
        controller.shutdown()
        super.onDestroy()
    }

    override fun onBind(intent: Intent?): IBinder? = null

    companion object {
        const val ACTION_START = "com.cavari.voicenotes.action.START_RECORDING"
        const val ACTION_STOP = "com.cavari.voicenotes.action.STOP_RECORDING"
        const val ACTION_STATE_CHANGED = "com.cavari.voicenotes.action.STATE_CHANGED"
        const val EXTRA_IS_RECORDING = "extra_is_recording"

        /** Set on the ACTION_START intent to enable hands-free auto-stop-on-silence. */
        const val EXTRA_AUTO_STOP = "extra_auto_stop"

        private const val CHANNEL_ID = "recording_channel"
        private const val NOTIFICATION_ID = 1001
        private const val RESULT_NOTIFICATION_ID = 1002
    }
}
