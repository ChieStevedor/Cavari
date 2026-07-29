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
import com.cavari.voicenotes.util.RecordingState
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.launch

/**
 * Handles a single record → transcribe → save cycle, whether it was started
 * from the mic button, the home screen widget, or the wake-word service.
 */
class RecordingForegroundService : Service() {

    private lateinit var recorder: AudioRecorder
    private lateinit var repository: NotesRepository
    private val whisperClient = WhisperApiClient()
    private val serviceScope = CoroutineScope(Dispatchers.IO + Job())

    override fun onCreate() {
        super.onCreate()
        recorder = AudioRecorder(this)
        repository = NotesRepository(this)
        createNotificationChannel()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            ACTION_START -> startRecording()
            ACTION_STOP -> stopRecordingAndTranscribe()
            else -> stopSelf()
        }
        return START_NOT_STICKY
    }

    private fun startRecording() {
        startForeground(NOTIFICATION_ID, buildNotification(getString(R.string.notif_recording)))
        if (recorder.isRecording) return
        try {
            recorder.start()
            RecordingState.setRecording(this, true)
            broadcastState(true)
        } catch (e: Exception) {
            RecordingState.setRecording(this, false)
            broadcastState(false)
            stopSelf()
        }
    }

    private fun stopRecordingAndTranscribe() {
        val file = recorder.stop()
        RecordingState.setRecording(this, false)
        broadcastState(false)
        if (file == null || !file.exists() || file.length() == 0L) {
            stopSelf()
            return
        }
        updateNotification(getString(R.string.notif_transcribing))
        serviceScope.launch {
            val result = whisperClient.transcribe(file)
            file.delete()
            result.onSuccess { text -> repository.saveNote(text) }
            stopSelf()
        }
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
        serviceScope.coroutineContext[Job]?.cancel()
        super.onDestroy()
    }

    override fun onBind(intent: Intent?): IBinder? = null

    companion object {
        const val ACTION_START = "com.cavari.voicenotes.action.START_RECORDING"
        const val ACTION_STOP = "com.cavari.voicenotes.action.STOP_RECORDING"
        const val ACTION_STATE_CHANGED = "com.cavari.voicenotes.action.STATE_CHANGED"
        const val EXTRA_IS_RECORDING = "extra_is_recording"
        private const val CHANNEL_ID = "recording_channel"
        private const val NOTIFICATION_ID = 1001
    }
}
