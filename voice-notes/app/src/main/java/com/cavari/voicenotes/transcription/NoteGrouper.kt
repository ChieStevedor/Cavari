package com.cavari.voicenotes.transcription

import com.cavari.voicenotes.BuildConfig
import com.cavari.voicenotes.data.Note
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONArray
import org.json.JSONObject
import java.io.IOException
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.concurrent.TimeUnit

/**
 * Groups a day's notes by topic/project (e.g. a project name, "Todo",
 * "Ideas") using a cheap OpenAI chat model, instead of just listing them
 * in the order they were recorded.
 */
class NoteGrouper {

    private val client = OkHttpClient.Builder()
        .connectTimeout(30, TimeUnit.SECONDS)
        .readTimeout(60, TimeUnit.SECONDS)
        .writeTimeout(30, TimeUnit.SECONDS)
        .build()

    fun groupByTopic(notes: List<Note>): Result<String> {
        val apiKey = BuildConfig.OPENAI_API_KEY
        if (apiKey.isBlank()) {
            return Result.failure(IllegalStateException("OPENAI_API_KEY is not set"))
        }

        val timeFormatter = SimpleDateFormat("HH:mm", Locale.getDefault())
        val notesBlock = notes.joinToString("\n") { note ->
            "[${timeFormatter.format(Date(note.createdAt))}] ${note.text}"
        }

        val requestBody = JSONObject().apply {
            put("model", "gpt-4o-mini")
            put("temperature", 0.2)
            put(
                "messages",
                JSONArray().apply {
                    put(JSONObject().put("role", "system").put("content", SYSTEM_PROMPT))
                    put(JSONObject().put("role", "user").put("content", notesBlock))
                }
            )
        }

        val request = Request.Builder()
            .url("https://api.openai.com/v1/chat/completions")
            .addHeader("Authorization", "Bearer $apiKey")
            .post(requestBody.toString().toRequestBody("application/json".toMediaType()))
            .build()

        return try {
            client.newCall(request).execute().use { response ->
                val bodyString = response.body?.string().orEmpty()
                if (!response.isSuccessful) {
                    Result.failure(IOException("Grouping request failed ${response.code}: $bodyString"))
                } else {
                    val content = JSONObject(bodyString)
                        .getJSONArray("choices")
                        .getJSONObject(0)
                        .getJSONObject("message")
                        .getString("content")
                        .trim()
                    if (content.isEmpty()) {
                        Result.failure(IOException("Grouping returned an empty response"))
                    } else {
                        Result.success(content)
                    }
                }
            }
        } catch (e: IOException) {
            Result.failure(e)
        }
    }

    companion object {
        private val SYSTEM_PROMPT = """
            Ти впорядковуєш голосові нотатки користувача за день. Згрупуй їх за темою чи
            проєктом, який у них згадується (наприклад, конкретна назва проєкту, "Todo",
            "Ідеї", "Особисте" — обирай назви груп сам, виходячи зі змісту).

            Формат виводу — звичайний текст українською, без Markdown-розмітки крім заголовків:
            - заголовок кожної групи окремим рядком, що починається з "## "
            - під заголовком кожна нотатка з її часом на початку, текст нотатки без змін
            - порожній рядок між групами

            Не додавай нічого, крім згрупованих нотаток — без вступу чи висновку.
        """.trimIndent()
    }
}
