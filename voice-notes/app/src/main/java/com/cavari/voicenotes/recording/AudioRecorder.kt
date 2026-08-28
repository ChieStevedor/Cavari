package com.cavari.voicenotes.recording

import android.content.Context
import android.media.AudioFormat
import android.media.AudioRecord
import android.media.MediaRecorder
import java.io.File
import java.io.IOException
import kotlin.math.abs

/**
 * Continuously captures raw PCM audio and writes it into sequential WAV
 * "chunk" files, rotating to a new chunk every [CHUNK_DURATION_MS] —
 * without ever stopping the underlying [AudioRecord] capture, so there's no
 * gap in the recorded audio at chunk boundaries. This keeps long sessions
 * (e.g. an hour-long call) under Whisper's 25MB-per-request limit: each
 * ~18MB chunk is handed off for transcription as soon as it's ready,
 * instead of building one huge file for the whole session.
 */
class AudioRecorder(private val context: Context) {

    @Volatile private var isCapturing = false
    @Volatile private var lastAmplitude = 0
    private var captureThread: Thread? = null
    private var currentWriter: WavFileWriter? = null

    val isRecording: Boolean get() = isCapturing

    /** Current input loudness (0..32767), for silence detection. 0 if not recording. */
    fun getMaxAmplitude(): Int = lastAmplitude

    /** [onChunkReady] fires on a background thread each time a chunk rotates — not on the main thread. */
    fun start(onChunkReady: (File) -> Unit) {
        val minBufferSize = AudioRecord.getMinBufferSize(SAMPLE_RATE, CHANNEL_CONFIG, AUDIO_FORMAT)
        if (minBufferSize <= 0) throw IOException("AudioRecord is not supported on this device")

        val record = AudioRecord(
            MediaRecorder.AudioSource.MIC, SAMPLE_RATE, CHANNEL_CONFIG, AUDIO_FORMAT, minBufferSize * 4
        )
        if (record.state != AudioRecord.STATE_INITIALIZED) {
            record.release()
            throw IOException("Failed to initialize AudioRecord")
        }

        isCapturing = true
        record.startRecording()
        captureThread = Thread {
            captureLoop(record, minBufferSize, onChunkReady)
            record.stop()
            record.release()
        }.also { it.start() }
    }

    /** Stops capturing and returns the final (possibly partial) chunk file, or null if nothing was captured. */
    fun stop(): File? {
        isCapturing = false
        captureThread?.join(2000)
        captureThread = null
        val file = currentWriter?.finish()
        currentWriter = null
        return file
    }

    private fun captureLoop(record: AudioRecord, bufferSize: Int, onChunkReady: (File) -> Unit) {
        val buffer = ByteArray(bufferSize)
        var writer = openNewChunk()
        currentWriter = writer
        var chunkStart = System.currentTimeMillis()

        while (isCapturing) {
            val read = record.read(buffer, 0, buffer.size)
            if (read > 0) {
                writer.write(buffer, 0, read)
                updateAmplitude(buffer, read)
            }
            if (System.currentTimeMillis() - chunkStart >= CHUNK_DURATION_MS) {
                onChunkReady(writer.finish())
                writer = openNewChunk()
                currentWriter = writer
                chunkStart = System.currentTimeMillis()
            }
        }
    }

    private fun updateAmplitude(buffer: ByteArray, length: Int) {
        var max = 0
        var i = 0
        while (i + 1 < length) {
            val sample = ((buffer[i + 1].toInt() shl 8) or (buffer[i].toInt() and 0xFF)).toShort().toInt()
            val magnitude = abs(sample)
            if (magnitude > max) max = magnitude
            i += 2
        }
        lastAmplitude = max
    }

    private fun openNewChunk(): WavFileWriter {
        val file = File(context.cacheDir, "note_chunk_${System.currentTimeMillis()}.wav")
        return WavFileWriter(file, SAMPLE_RATE)
    }

    companion object {
        private const val SAMPLE_RATE = 16000
        private const val CHANNEL_CONFIG = AudioFormat.CHANNEL_IN_MONO
        private const val AUDIO_FORMAT = AudioFormat.ENCODING_PCM_16BIT

        /** ~18MB per chunk at 16kHz/mono/16-bit — comfortably under Whisper's 25MB limit. */
        const val CHUNK_DURATION_MS = 10 * 60 * 1000L
    }
}
