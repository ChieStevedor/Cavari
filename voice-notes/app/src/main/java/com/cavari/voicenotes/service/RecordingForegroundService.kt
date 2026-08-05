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
import com.cavari.voicenotes.data.NotesRepository
import com.cavari.voicenotes.recording.AudioRecorder
import com.cavari.voicenotes.transcription.WhisperApiClient
import com.cavari.voicenotes.util.Haptics
import com.cavari.voicenotes.util.RecordingState
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch

/**
 * Handles a single record → transcribe → save cycle, whether it was started
 * from the mic button, the home screen widget, or the wake-word service.
 *
 * When started with [EXTRA_AUTO_STOP] (the wake-word path), it doesn't wait
 * for an explicit ACTION_STOP — it watches the mic's input level and stops
 * itself after a few seconds of silence, so the whole "Hey, Naomi → note
 * saved" flow needs no screen interaction at all.
 */
class RecordingForegroundService : Service() {

    private lateinit var recorder: AudioRecorder
    private lateinit var repository: NotesRepository
    private val whisperClient = WhisperApiClient()
    private val serviceScope = CoroutineScope(Dispatchers.IO + Job())

    private var silenceWatcherJob: Job? = null

    /** Guards against the silence watcher and an explicit ACTION_STOP racing each other. */
    @Volatile private var isStopping = false

    override fun onCreate() {
        super.onCreate()
        recorder = AudioRecorder(this)
        repository = NotesRepository(this)
        createNotificationChannel()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            ACTION_START -> startRecording(autoStop = intent.getBooleanExtra(EXTRA_AUTO_STOP, false))
            ACTION_STOP -> stopRecordingAndTranscribe()
            else -> stopSelf()
        }
        return START_NOT_STICKY
    }

    private fun startRecording(autoStop: Boolean) {
        startForeground(NOTIFICATION_ID, buildNotification(getString(R.string.notif_recording)))
        if (recorder.isRecording) return
        isStopping = false
        try {
            recorder.start()
            RecordingState.setRecording(this, true)
            broadcastState(true)
            if (autoStop) {
                Haptics.recordingStarted(this)
                silenceWatcherJob = serviceScope.launch { watchForSilence() }
            }
        } catch (e: Exception) {
            RecordingState.setRecording(this, false)
            broadcastState(false)
            stopSelf()
        }
    }

    /** Polls mic loudness; auto-stops once speech was heard and then trails off into silence. */
    private suspend fun watchForSilence() {
        val startTime = System.currentTimeMillis()
        var lastLoudTime = startTime
        var heardSpeech = false

        while (serviceScope.isActive && recorder.isRecording) {
            delay(POLL_INTERVAL_MS)
            val now = System.currentTimeMillis()
            val elapsed = now - startTime

            if (recorder.getMaxAmplitude() > SILENCE_AMPLITUDE_THRESHOLD) {
                heardSpeech = true
                lastLoudTime = now
            }

            val shouldStopForSilence = heardSpeech &&
                elapsed >= MIN_RECORDING_MS &&
                (now - lastLoudTime) >= SILENCE_DURATION_MS
            val shouldStopForMaxDuration = elapsed >= MAX_RECORDING_MS

            if (shouldStopForSilence || shouldStopForMaxDuration) {
                Haptics.recordingAutoStopped(this)
                stopRecordingAndTranscribe()
                return
            }
        }
    }

    private fun stopRecordingAndTranscribe() {
        if (isStopping) return
        isStopping = true
        silenceWatcherJob?.cancel()
        silenceWatcherJob = null

        val file = recorder.stop()
        RecordingState.setRecording(this, false)
        broadcastState(false)
        if (file == null || !file.exists() || file.length() == 0L) {
            showResultNotification(getString(R.string.notif_too_short))
            stopSelf()
            return
        }
        updateNotification(getString(R.string.notif_transcribing))
        serviceScope.launch {
            val result = whisperClient.transcribe(file)
            file.delete()
            result.fold(
                onSuccess = { text ->
                    repository.saveNote(text)
                    showResultNotification(getString(R.string.notif_saved, text.take(60)))
                },
                onFailure = { error ->
                    showResultNotification(getString(R.string.notif_failed, error.message ?: error.toString()))
                }
            )
            stopSelf()
        }
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

    private fun broadcastState(isRecording: Boolean) {
        sendBroadcast(
            Intent(ACTION_STATE_CHANGED)
                .setPackage(packageName)
                .putExtra(EXTRA_IS_RECORDING, isRecording)
        )
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
        silenceWatcherJob?.cancel()
        serviceScope.coroutineContext[Job]?.cancel()
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

        private const val POLL_INTERVAL_MS = 200L
        private const val MIN_RECORDING_MS = 700L
        private const val SILENCE_DURATION_MS = 2500L
        private const val MAX_RECORDING_MS = 60_000L
        private const val SILENCE_AMPLITUDE_THRESHOLD = 1500
    }
}
