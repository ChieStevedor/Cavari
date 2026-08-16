package com.cavari.voicenotes.transcription

import com.cavari.voicenotes.BuildConfig
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.MultipartBody
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.asRequestBody
import java.io.File
import java.io.IOException
import java.util.concurrent.TimeUnit

/**
 * Transcribes an audio chunk with OpenAI's `gpt-4o-mini-transcribe` model —
 * about half the price of `gpt-4o-transcribe-diarize` (used by
 * [DiarizedTranscriptionClient]), but with no speaker identification.
 *
 * Used only for wake-word ("Hey, Naomi") notes: those are always short,
 * single-speaker voice memos capped at a minute, so diarization would be
 * wasted cost. Button-triggered recordings (which can be long, multi-speaker
 * dialogues) keep using the diarized model.
 */
class MiniTranscriptionClient {

    private val client = OkHttpClient.Builder()
        .connectTimeout(30, TimeUnit.SECONDS)
        .readTimeout(1, TimeUnit.MINUTES)
        .writeTimeout(1, TimeUnit.MINUTES)
        .build()

    fun transcribe(audioFile: File): Result<String> {
        val apiKey = BuildConfig.OPENAI_API_KEY
        if (apiKey.isBlank()) {
            return Result.failure(
                IllegalStateException("OPENAI_API_KEY is not set — add it to local.properties")
            )
        }

        val body = MultipartBody.Builder()
            .setType(MultipartBody.FORM)
            .addFormDataPart("model", "gpt-4o-mini-transcribe")
            .addFormDataPart("response_format", "text")
            .addFormDataPart(
                "file",
                audioFile.name,
                audioFile.asRequestBody("audio/wav".toMediaType())
            )
            .build()

        val request = Request.Builder()
            .url("https://api.openai.com/v1/audio/transcriptions")
            .addHeader("Authorization", "Bearer $apiKey")
            .post(body)
            .build()

        return try {
            client.newCall(request).execute().use { response ->
                val bodyString = response.body?.string().orEmpty()
                if (!response.isSuccessful) {
                    Result.failure(IOException("Transcription API error ${response.code}: $bodyString"))
                } else {
                    val text = bodyString.trim()
                    if (text.isEmpty()) {
                        Result.failure(IOException("Transcription returned no usable text"))
                    } else {
                        Result.success(text)
                    }
                }
            }
        } catch (e: IOException) {
            Result.failure(e)
        }
    }
}
