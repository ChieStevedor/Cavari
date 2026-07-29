package com.cavari.voicenotes.recording

import android.content.Context
import android.media.MediaRecorder
import android.os.Build
import java.io.File
import java.io.IOException

/**
 * Records microphone input straight to an AAC/.m4a file — a format the
 * Whisper API accepts directly, so no extra encoding step is needed before
 * upload.
 */
class AudioRecorder(private val context: Context) {

    private var recorder: MediaRecorder? = null
    private var outputFile: File? = null

    val isRecording: Boolean get() = recorder != null

    fun start(): File {
        val file = File(context.cacheDir, "note_${System.currentTimeMillis()}.m4a")
        val mr = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            MediaRecorder(context)
        } else {
            @Suppress("DEPRECATION")
            MediaRecorder()
        }
        try {
            mr.apply {
                setAudioSource(MediaRecorder.AudioSource.MIC)
                setOutputFormat(MediaRecorder.OutputFormat.MPEG_4)
                setAudioEncoder(MediaRecorder.AudioEncoder.AAC)
                setAudioEncodingBitRate(96000)
                setAudioSamplingRate(44100)
                setOutputFile(file.absolutePath)
                prepare()
                start()
            }
        } catch (e: IOException) {
            mr.release()
            throw e
        }
        recorder = mr
        outputFile = file
        return file
    }

    /** Stops the current recording and returns the finished file, or null if nothing was recording. */
    fun stop(): File? {
        val file = outputFile
        try {
            recorder?.apply {
                stop()
                release()
            }
        } catch (e: RuntimeException) {
            // stop() throws if called too soon after start(); treat as no usable recording.
            file?.delete()
            recorder = null
            outputFile = null
            return null
        }
        recorder = null
        outputFile = null
        return file
    }

    fun cancel() {
        try {
            recorder?.apply {
                stop()
                release()
            }
        } catch (e: RuntimeException) {
            // ignore — we're discarding the file anyway
        }
        recorder = null
        outputFile?.delete()
        outputFile = null
    }
}
