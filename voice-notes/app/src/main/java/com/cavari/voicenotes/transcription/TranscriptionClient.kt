package com.cavari.voicenotes.transcription

import java.io.File

/** Common shape for [DiarizedTranscriptionClient] and [MiniTranscriptionClient]. */
interface TranscriptionClient {
    fun transcribe(audioFile: File): Result<String>
}
