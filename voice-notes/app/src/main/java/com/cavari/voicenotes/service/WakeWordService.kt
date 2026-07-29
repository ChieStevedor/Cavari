package com.cavari.voicenotes.service

import ai.picovoice.porcupine.PorcupineManager
import ai.picovoice.porcupine.PorcupineManagerCallback
import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.IBinder
import androidx.core.app.NotificationCompat
import androidx.core.content.ContextCompat
import com.cavari.voicenotes.BuildConfig
import com.cavari.voicenotes.MainActivity
import com.cavari.voicenotes.R

/**
 * Runs continuously in the foreground and listens for the custom wake phrase
 * "Hey, Naomi" via Picovoice Porcupine. On detection it kicks off
 * [RecordingForegroundService] without needing the app UI open.
 *
 * Requires PICOVOICE_ACCESS_KEY in local.properties and a custom
 * hey_naomi_android.ppn keyword file (trained for Android at
 * console.picovoice.ai) placed in app/src/main/assets/. See README.md.
 */
class WakeWordService : Service() {

    private var porcupineManager: PorcupineManager? = null

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        startForeground(NOTIFICATION_ID, buildNotification())
        startListening()
        return START_STICKY
    }

    private fun startListening() {
        if (porcupineManager != null) return
        try {
            porcupineManager = PorcupineManager.Builder()
                .setAccessKey(BuildConfig.PICOVOICE_ACCESS_KEY)
                .setKeywordPath(WAKE_WORD_ASSET)
                .setSensitivity(0.6f)
                .build(applicationContext, object : PorcupineManagerCallback {
                    override fun invoke(keywordIndex: Int) {
                        onWakeWordDetected()
                    }
                })
            porcupineManager?.start()
        } catch (e: Exception) {
            stopSelf()
        }
    }

    private fun onWakeWordDetected() {
        val startIntent = Intent(this, RecordingForegroundService::class.java)
            .setAction(RecordingForegroundService.ACTION_START)
        ContextCompat.startForegroundService(this, startIntent)
    }

    private fun buildNotification(): Notification {
        val openIntent = PendingIntent.getActivity(
            this, 0, Intent(this, MainActivity::class.java),
            PendingIntent.FLAG_IMMUTABLE
        )
        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle(getString(R.string.app_name))
            .setContentText(getString(R.string.notif_listening))
            .setSmallIcon(R.drawable.ic_mic)
            .setContentIntent(openIntent)
            .setOngoing(true)
            .build()
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID, getString(R.string.channel_listening), NotificationManager.IMPORTANCE_LOW
            )
            getSystemService(NotificationManager::class.java).createNotificationChannel(channel)
        }
    }

    override fun onDestroy() {
        porcupineManager?.stop()
        porcupineManager?.delete()
        porcupineManager = null
        super.onDestroy()
    }

    override fun onBind(intent: Intent?): IBinder? = null

    companion object {
        private const val WAKE_WORD_ASSET = "hey_naomi_android.ppn"
        private const val CHANNEL_ID = "listening_channel"
        private const val NOTIFICATION_ID = 2001

        fun start(context: Context) {
            ContextCompat.startForegroundService(context, Intent(context, WakeWordService::class.java))
        }

        fun stop(context: Context) {
            context.stopService(Intent(context, WakeWordService::class.java))
        }
    }
}
