package com.cavari.voicenotes.service

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
import com.cavari.voicenotes.MainActivity
import com.cavari.voicenotes.R
import com.cavari.voicenotes.util.ListeningState
import org.json.JSONObject
import org.vosk.Model
import org.vosk.Recognizer
import org.vosk.android.RecognitionListener
import org.vosk.android.SpeechService
import org.vosk.android.StorageService
import java.io.IOException

/**
 * Runs continuously in the foreground and listens for the wake phrase
 * "Hey, Naomi" using Vosk — a free, fully offline speech engine (no account,
 * no per-use cost, no cloud calls). On detection it kicks off
 * [RecordingForegroundService] without needing the app UI open.
 *
 * Requires a small English acoustic model bundled at
 * app/src/main/assets/model-en-us/ (download from alphacephei.com/vosk/models,
 * no signup needed). See README.md.
 */
class WakeWordService : Service(), RecognitionListener {

    private var model: Model? = null
    private var speechService: SpeechService? = null

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        startForeground(NOTIFICATION_ID, buildNotification())
        loadModelAndListen()
        return START_STICKY
    }

    private fun loadModelAndListen() {
        if (speechService != null || model != null) return
        StorageService.unpack(
            this, MODEL_ASSET_DIR, "model",
            { loadedModel -> onModelLoaded(loadedModel) },
            { exception -> onInitFailure(exception) }
        )
    }

    private fun onModelLoaded(loadedModel: Model) {
        model = loadedModel
        try {
            val recognizer = Recognizer(loadedModel, SAMPLE_RATE, GRAMMAR)
            speechService = SpeechService(recognizer, SAMPLE_RATE).also {
                it.startListening(this)
            }
        } catch (e: IOException) {
            onInitFailure(e)
        }
    }

    private fun onInitFailure(e: Exception) {
        // Common cause: assets/model-en-us/ is missing or incomplete.
        ListeningState.setEnabled(this, false)
        broadcastListeningState(false)
        showFailureNotification(e.message ?: e.toString())
        stopSelf()
    }

    override fun onResult(hypothesis: String?) = checkForWakeWord(hypothesis)

    override fun onFinalResult(hypothesis: String?) = checkForWakeWord(hypothesis)

    override fun onPartialResult(hypothesis: String?) {
        // ignored — only act on finished utterances to avoid double-triggering
    }

    override fun onError(exception: Exception?) {
        onInitFailure(exception ?: IOException("Unknown recognition error"))
    }

    override fun onTimeout() {
        // no-op: startListening(this) already runs in continuous mode
    }

    private fun checkForWakeWord(hypothesis: String?) {
        val text = hypothesis?.let { runCatching { JSONObject(it).optString("text") }.getOrNull() }
        if (!text.isNullOrBlank() && text.contains("hey naomi", ignoreCase = true)) {
            onWakeWordDetected()
        }
    }

    private fun onWakeWordDetected() {
        val startIntent = Intent(this, RecordingForegroundService::class.java)
            .setAction(RecordingForegroundService.ACTION_START)
        ContextCompat.startForegroundService(this, startIntent)
    }

    private fun broadcastListeningState(isListening: Boolean) {
        sendBroadcast(
            Intent(ACTION_LISTENING_STATE_CHANGED)
                .setPackage(packageName)
                .putExtra(EXTRA_IS_LISTENING, isListening)
        )
    }

    private fun showFailureNotification(message: String) {
        val text = getString(R.string.notif_listening_failed, message)
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
        getSystemService(NotificationManager::class.java).notify(FAILURE_NOTIFICATION_ID, notification)
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
        speechService?.stop()
        speechService?.shutdown()
        speechService = null
        model?.close()
        model = null
        super.onDestroy()
    }

    override fun onBind(intent: Intent?): IBinder? = null

    companion object {
        const val ACTION_LISTENING_STATE_CHANGED = "com.cavari.voicenotes.action.LISTENING_STATE_CHANGED"
        const val EXTRA_IS_LISTENING = "extra_is_listening"
        private const val MODEL_ASSET_DIR = "model-en-us"
        private const val SAMPLE_RATE = 16000.0f
        private const val GRAMMAR = """["hey naomi", "[unk]"]"""
        private const val CHANNEL_ID = "listening_channel"
        private const val NOTIFICATION_ID = 2001
        private const val FAILURE_NOTIFICATION_ID = 2002

        fun start(context: Context) {
            ContextCompat.startForegroundService(context, Intent(context, WakeWordService::class.java))
        }

        fun stop(context: Context) {
            context.stopService(Intent(context, WakeWordService::class.java))
        }
    }
}
