package com.cavari.voicenotes.transcription

import com.cavari.voicenotes.data.Note
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

/**
 * Groups a day's notes by topic/project (e.g. a project name, "Todo",
 * "Ideas") using a cheap OpenAI chat model, instead of just listing them
 * in the order they were recorded.
 */
class NoteGrouper {

    private val chatClient = ChatCompletionClient()

    fun groupByTopic(notes: List<Note>): Result<String> {
        val timeFormatter = SimpleDateFormat("HH:mm", Locale.getDefault())
        val notesBlock = notes.joinToString("\n") { note ->
            "[${timeFormatter.format(Date(note.createdAt))}] ${note.text}"
        }
        return chatClient.complete(SYSTEM_PROMPT, notesBlock)
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
