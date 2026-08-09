package com.cavari.voicenotes.recording

import android.content.Context
import android.content.Intent
import com.cavari.voicenotes.R
import com.cavari.voicenotes.data.NotesRepository
import com.cavari.voicenotes.service.RecordingForegroundService
import com.cavari.voicenotes.transcription.WhisperApiClient
import com.cavari.voicenotes.util.Haptics
import com.cavari.voicenotes.util.RecordingState
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch

/**
 * Owns a single record → (optional silence auto-stop) → transcribe → save
 * cycle. Shared by [RecordingForegroundService] (button/widget) and
 * [com.cavari.voicenotes.service.WakeWordService] (hands-free) so the
 * hands-free path never has to start a *second* foreground service —
 * Android 14 blocks starting a new microphone-type foreground service from
 * a background trigger (one service starting another), which is exactly
 * what crashed the app before this was merged into the caller's own
 * already-running foreground service.
 */
class NoteCaptureController(
    private val context: Context,
    private val scope: CoroutineScope,
    private val onPhase: (String) -> Unit,
    private val onFinished: (String) -> Unit
) {
    private val recorder = AudioRecorder(context)
    private val repository = NotesRepository(context)
    private val whisperClient = WhisperApiClient()

    private var silenceWatcherJob: Job? = null
    @Volatile private var isStopping = false

    val isRecording: Boolean get() = recorder.isRecording

    fun startRecording(autoStop: Boolean) {
        if (recorder.isRecording) return
        isStopping = false
        try {
            recorder.start()
            RecordingState.setRecording(context, true)
            broadcastState(true)
            if (autoStop) {
                Haptics.recordingStarted(context)
                silenceWatcherJob = scope.launch { watchForSilence() }
            }
        } catch (e: Exception) {
            RecordingState.setRecording(context, false)
            broadcastState(false)
            onFinished(context.getString(R.string.notif_failed, e.message ?: e.toString()))
        }
    }

    fun stopRecording() = stopAndTranscribe()

    private suspend fun watchForSilence() {
        val startTime = System.currentTimeMillis()
        var lastLoudTime = startTime
        var heardSpeech = false

        while (scope.isActive && recorder.isRecording) {
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
                Haptics.recordingAutoStopped(context)
                stopAndTranscribe()
                return
            }
        }
    }

    private fun stopAndTranscribe() {
        if (isStopping) return
        isStopping = true
        silenceWatcherJob?.cancel()
        silenceWatcherJob = null

        val file = recorder.stop()
        RecordingState.setRecording(context, false)
        broadcastState(false)
        if (file == null || !file.exists() || file.length() == 0L) {
            onFinished(context.getString(R.string.notif_too_short))
            return
        }
        onPhase(context.getString(R.string.notif_transcribing))
        scope.launch {
            val result = whisperClient.transcribe(file)
            file.delete()
            result.fold(
                onSuccess = { text ->
                    repository.saveNote(text)
                    onFinished(context.getString(R.string.notif_saved, text.take(60)))
                },
                onFailure = { error ->
                    onFinished(context.getString(R.string.notif_failed, error.message ?: error.toString()))
                }
            )
        }
    }

    private fun broadcastState(isRecording: Boolean) {
        context.sendBroadcast(
            Intent(RecordingForegroundService.ACTION_STATE_CHANGED)
                .setPackage(context.packageName)
                .putExtra(RecordingForegroundService.EXTRA_IS_RECORDING, isRecording)
        )
    }

    companion object {
        private const val POLL_INTERVAL_MS = 200L
        private const val MIN_RECORDING_MS = 700L
        private const val SILENCE_DURATION_MS = 1300L
        private const val MAX_RECORDING_MS = 60_000L
        private const val SILENCE_AMPLITUDE_THRESHOLD = 1500
    }
}
