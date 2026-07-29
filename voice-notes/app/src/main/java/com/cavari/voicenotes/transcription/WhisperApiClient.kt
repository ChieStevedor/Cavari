package com.cavari.voicenotes.transcription

import com.cavari.voicenotes.BuildConfig
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.MultipartBody
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.asRequestBody
import org.json.JSONObject
import java.io.File
import java.io.IOException
import java.util.concurrent.TimeUnit

/** Sends a recorded clip to OpenAI's Whisper API and returns the Ukrainian transcript. */
class WhisperApiClient {

    private val client = OkHttpClient.Builder()
        .connectTimeout(30, TimeUnit.SECONDS)
        .readTimeout(60, TimeUnit.SECONDS)
        .writeTimeout(60, TimeUnit.SECONDS)
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
            .addFormDataPart("model", "whisper-1")
            .addFormDataPart("language", "uk")
            .addFormDataPart(
                "file",
                audioFile.name,
                audioFile.asRequestBody("audio/mp4".toMediaType())
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
                    Result.failure(IOException("Whisper API error ${response.code}: $bodyString"))
                } else {
                    val text = JSONObject(bodyString).optString("text").trim()
                    if (text.isEmpty()) {
                        Result.failure(IOException("Whisper returned an empty transcript"))
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
