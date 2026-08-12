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
import com.cavari.voicenotes.recording.NoteCaptureController
import com.cavari.voicenotes.util.ListeningState
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
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
 * no per-use cost, no cloud calls).
 *
 * On detection it records and saves the note *itself*, via
 * [NoteCaptureController], instead of starting a second foreground service.
 * Android 14 blocks one background service from starting another
 * microphone-type foreground service — that's exactly what used to crash
 * the app here (it briefly tried to launch [RecordingForegroundService]).
 * Since this service is already a running, legitimate microphone
 * foreground service, doing the recording work directly avoids that
 * restriction entirely.
 *
 * Requires a small English acoustic model bundled at
 * app/src/main/assets/model-en-us/ (download from alphacephei.com/vosk/models,
 * no signup needed). See README.md.
 */
class WakeWordService : Service(), RecognitionListener {

    private var model: Model? = null
    private var speechService: SpeechService? = null

    private val serviceScope = CoroutineScope(Dispatchers.IO + Job())
    private lateinit var captureController: NoteCaptureController

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
        captureController = NoteCaptureController(
            context = this,
            scope = serviceScope,
            onPhase = { text -> updateOngoingNotification(text) },
            onFinished = { text ->
                showResultNotification(text)
                updateOngoingNotification(getString(R.string.notif_listening))
                speechService?.startListening(this)
            }
        )
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        startForeground(NOTIFICATION_ID, buildNotification(getString(R.string.notif_listening)))
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
            // Adds per-word confidence to the result JSON, so a match can be
            // rejected unless the model was actually confident about it —
            // English acoustic models (this one included) otherwise force-fit
            // ordinary English speech into "hey naomi" too eagerly, since the
            // grammar only allows that phrase or "[unk]" as outputs.
            recognizer.setWords(true)
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
        if (captureController.isRecording) return
        val json = hypothesis?.let { runCatching { JSONObject(it) }.getOrNull() } ?: return
        val text = json.optString("text")
        if (text.isNullOrBlank() || !text.contains("hey naomi", ignoreCase = true)) return
        if (isConfidentMatch(json)) {
            onWakeWordDetected()
        }
    }

    /**
     * Requires every recognized word to individually clear a confidence bar
     * before treating "hey naomi" as real, instead of accepting the grammar
     * match on its own. Falls back to accepting the match if the response
     * doesn't include per-word confidence for some reason.
     */
    private fun isConfidentMatch(json: JSONObject): Boolean {
        val words = json.optJSONArray("result") ?: return true
        if (words.length() == 0) return true
        for (i in 0 until words.length()) {
            val confidence = words.optJSONObject(i)?.optDouble("conf", 0.0) ?: 0.0
            if (confidence < WAKE_WORD_MIN_CONFIDENCE) return false
        }
        return true
    }

    private fun onWakeWordDetected() {
        // Free the mic from Vosk before MediaRecorder grabs it; resumed in
        // the controller's onFinished callback once the note is saved.
        speechService?.stop()
        captureController.startRecording(autoStop = true)
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

    /** Separate, non-ongoing notification for a finished capture (saved/failed/too short). */
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

    private fun updateOngoingNotification(text: String) {
        getSystemService(NotificationManager::class.java).notify(NOTIFICATION_ID, buildNotification(text))
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
        serviceScope.coroutineContext[Job]?.cancel()
        captureController.shutdown()
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

        /** Minimum per-word confidence (0..1) required to accept a "hey naomi" match. */
        private const val WAKE_WORD_MIN_CONFIDENCE = 0.6

        private const val CHANNEL_ID = "listening_channel"
        private const val NOTIFICATION_ID = 2001
        private const val FAILURE_NOTIFICATION_ID = 2002
        private const val RESULT_NOTIFICATION_ID = 2003

        fun start(context: Context) {
            ContextCompat.startForegroundService(context, Intent(context, WakeWordService::class.java))
        }

        fun stop(context: Context) {
            context.stopService(Intent(context, WakeWordService::class.java))
        }
    }
}
