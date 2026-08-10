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

/**
 * Transcribes an audio chunk with OpenAI's `gpt-4o-transcribe-diarize`
 * model, which identifies actual distinct voices in the audio — not a
 * text-based guess — and returns speaker-labeled segments.
 *
 * A chunk where only one voice was detected comes back as plain text, so
 * ordinary quick notes look exactly as before. Multiple voices are grouped
 * into "Мовець N:" turns, merging consecutive segments from the same
 * speaker into one block.
 *
 * Caveat: each chunk is diarized independently (no shared memory between
 * requests), so speaker numbering isn't guaranteed to stay consistent
 * across a chunk boundary in a very long (>10 min) recording.
 */
class DiarizedTranscriptionClient {

    // Chunks can be up to ~19MB (10 min of 16kHz mono audio) — on a slow
    // mobile connection just uploading that can take well over a minute,
    // so the write/read timeouts need real headroom.
    private val client = OkHttpClient.Builder()
        .connectTimeout(30, TimeUnit.SECONDS)
        .readTimeout(3, TimeUnit.MINUTES)
        .writeTimeout(5, TimeUnit.MINUTES)
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
            .addFormDataPart("model", "gpt-4o-transcribe-diarize")
            .addFormDataPart("response_format", "diarized_json")
            .addFormDataPart("chunking_strategy", "auto")
            .addFormDataPart("language", "uk")
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
                    parseDiarizedResponse(bodyString)
                }
            }
        } catch (e: IOException) {
            Result.failure(e)
        }
    }

    private fun parseDiarizedResponse(bodyString: String): Result<String> {
        val segmentsArray = JSONObject(bodyString).optJSONArray("segments")
        if (segmentsArray == null || segmentsArray.length() == 0) {
            return Result.failure(IOException("No segments in transcription response"))
        }

        val segments = (0 until segmentsArray.length()).mapNotNull { i ->
            val obj = segmentsArray.optJSONObject(i) ?: return@mapNotNull null
            val text = obj.optString("text").trim()
            if (text.isEmpty()) null else obj.optString("speaker", "0") to text
        }
        if (segments.isEmpty()) {
            return Result.failure(IOException("Transcription returned no usable text"))
        }

        val distinctSpeakers = segments.map { it.first }.distinct()
        if (distinctSpeakers.size <= 1) {
            return Result.success(segments.joinToString(" ") { it.second })
        }

        val speakerNumbers = distinctSpeakers.withIndex().associate { (i, id) -> id to (i + 1) }
        val turns = StringBuilder()
        var currentSpeaker: String? = null
        for ((speaker, text) in segments) {
            if (speaker != currentSpeaker) {
                if (currentSpeaker != null) turns.append("\n\n")
                turns.append("Мовець ${speakerNumbers[speaker]}: ")
                currentSpeaker = speaker
            } else {
                turns.append(" ")
            }
            turns.append(text)
        }
        return Result.success(turns.toString())
    }
}
