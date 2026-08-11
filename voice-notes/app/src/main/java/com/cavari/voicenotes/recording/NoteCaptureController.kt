package com.cavari.voicenotes.recording

import android.content.Context
import android.content.Intent
import com.cavari.voicenotes.R
import com.cavari.voicenotes.data.NotesRepository
import com.cavari.voicenotes.service.RecordingForegroundService
import com.cavari.voicenotes.transcription.DiarizedTranscriptionClient
import com.cavari.voicenotes.util.Haptics
import com.cavari.voicenotes.util.RecordingState
import com.cavari.voicenotes.util.SpeechFeedback
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.isActive
import kotlinx.coroutines.joinAll
import kotlinx.coroutines.launch
import java.io.File
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.CopyOnWriteArrayList
import java.util.concurrent.atomic.AtomicBoolean
import java.util.concurrent.atomic.AtomicInteger

/**
 * Owns a single record → (optional silence auto-stop) → transcribe → save
 * cycle. Shared by [RecordingForegroundService] (button/widget) and
 * [com.cavari.voicenotes.service.WakeWordService] (hands-free) so the
 * hands-free path never has to start a *second* foreground service —
 * Android 14 blocks starting a new microphone-type foreground service from
 * a background trigger (one service starting another), which is exactly
 * what crashed the app before this was merged into the caller's own
 * already-running foreground service.
 *
 * [AudioRecorder] rotates long recordings into ~10-minute WAV chunks
 * without ever stopping the mic — this class transcribes each chunk as
 * soon as it's ready and stitches the pieces into one note when the
 * recording stops, so a long session (e.g. an hour-long call) never hits
 * the transcription API's 25MB-per-request limit. Each chunk is diarized
 * (real voice identification, not a text-based guess) via
 * [DiarizedTranscriptionClient] — a chunk with one voice stays plain text,
 * multiple voices come back as labeled "Мовець N:" turns.
 */
class NoteCaptureController(
    private val context: Context,
    private val scope: CoroutineScope,
    private val onPhase: (String) -> Unit,
    private val onFinished: (String) -> Unit
) {
    private val recorder = AudioRecorder(context)
    private val repository = NotesRepository(context)
    private val transcriptionClient = DiarizedTranscriptionClient()
    private val speechFeedback = SpeechFeedback(context)

    private var silenceWatcherJob: Job? = null
    private var currentAutoStop = false
    @Volatile private var isStopping = false

    private val chunkResults = ConcurrentHashMap<Int, String>()
    private val chunkJobs = CopyOnWriteArrayList<Job>()
    private val nextChunkIndex = AtomicInteger(0)
    private val anyChunkFailed = AtomicBoolean(false)

    val isRecording: Boolean get() = recorder.isRecording

    fun startRecording(autoStop: Boolean) {
        if (recorder.isRecording) return
        isStopping = false
        currentAutoStop = autoStop
        chunkResults.clear()
        chunkJobs.clear()
        nextChunkIndex.set(0)
        anyChunkFailed.set(false)
        if (autoStop) {
            // Say "Записую" and wait for it to finish before opening the mic,
            // so the spoken cue itself never ends up inside the note.
            speechFeedback.speak(context.getString(R.string.tts_recording_started)) { beginRecording() }
        } else {
            beginRecording()
        }
    }

    private fun beginRecording() {
        try {
            recorder.start(onChunkReady = { chunkFile -> enqueueChunk(chunkFile) })
            RecordingState.setRecording(context, true)
            broadcastState(true)
            if (currentAutoStop) {
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

    /** Transcribes one chunk as soon as it's ready, without waiting for the recording to finish. */
    private fun enqueueChunk(file: File) {
        if (file.length() < MIN_CHUNK_BYTES) {
            file.delete()
            return
        }
        val index = nextChunkIndex.getAndIncrement()
        val job = scope.launch {
            val result = transcribeWithRetry(file)
            file.delete()
            result.fold(
                onSuccess = { text -> chunkResults[index] = text },
                onFailure = { anyChunkFailed.set(true) }
            )
            if (nextChunkIndex.get() > 1) {
                onPhase(context.getString(R.string.notif_recording_progress, chunkResults.size))
            }
        }
        chunkJobs.add(job)
    }

    /**
     * A network blip on a multi-MB chunk shouldn't sink that whole slice of
     * the conversation — keeps the file and retries a couple of times
     * before giving up.
     */
    private suspend fun transcribeWithRetry(file: File): Result<String> {
        repeat(CHUNK_MAX_ATTEMPTS - 1) {
            val result = transcriptionClient.transcribe(file)
            if (result.isSuccess) return result
            delay(CHUNK_RETRY_DELAY_MS)
        }
        return transcriptionClient.transcribe(file)
    }

    private fun stopAndTranscribe() {
        if (isStopping) return
        isStopping = true
        silenceWatcherJob?.cancel()
        silenceWatcherJob = null

        val lastChunk = recorder.stop()
        RecordingState.setRecording(context, false)
        broadcastState(false)
        if (lastChunk != null) {
            enqueueChunk(lastChunk)
        }

        if (nextChunkIndex.get() == 0) {
            onFinished(context.getString(R.string.notif_too_short))
            return
        }

        if (currentAutoStop) {
            speechFeedback.speak(context.getString(R.string.tts_recording_stopped))
        }
        onPhase(context.getString(R.string.notif_transcribing))

        scope.launch {
            chunkJobs.toList().joinAll()
            // Each chunk was diarized independently, so speaker numbering
            // isn't guaranteed to carry over across a chunk boundary in a
            // very long recording — joining with a paragraph break at
            // least keeps that seam visible rather than pretending it
            // isn't there.
            val finalText = (0 until nextChunkIndex.get())
                .mapNotNull { chunkResults[it] }
                .filter { it.isNotBlank() }
                .joinToString("\n\n")

            if (finalText.isBlank()) {
                onFinished(context.getString(R.string.notif_failed, "усі частини не вдалося розпізнати"))
                return@launch
            }

            repository.saveNote(finalText)
            val savedMessage = context.getString(R.string.notif_saved, finalText.take(60))
            val message = if (anyChunkFailed.get()) {
                savedMessage + " " + context.getString(R.string.notif_partial_failure)
            } else {
                savedMessage
            }
            onFinished(message)
        }
    }

    fun shutdown() {
        speechFeedback.shutdown()
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
        private const val SILENCE_DURATION_MS = 2000L
        private const val MAX_RECORDING_MS = 60_000L
        private const val SILENCE_AMPLITUDE_THRESHOLD = 1500

        /** Below this, a chunk is just silence/noise from a near-instant stop — not worth transcribing. */
        private const val MIN_CHUNK_BYTES = 4_000L

        private const val CHUNK_MAX_ATTEMPTS = 3
        private const val CHUNK_RETRY_DELAY_MS = 3_000L
    }
}
