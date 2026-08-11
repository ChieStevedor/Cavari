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
            Ти впорядковуєш голосові нотатки користувача за день. Віднеси кожну нотатку рівно
            до однієї категорії:

            1. "To-do list" — нотатка описує конкретну дію, яку треба зробити (завдання,
               нагадування: "треба", "не забути", "подзвонити", "купити", "зробити",
               "надіслати" тощо).
            2. Назва проєкту — нотатка явно стосується конкретного проєкту чи теми, яка
               повторюється в кількох нотатках (визнач назву проєкту з контексту й
               використовуй ту саму назву послідовно для всіх нотаток про нього).
            3. Інша логічна категорія за змістом (наприклад "Ідеї", "Особисте") — якщо це не
               завдання і не стосується конкретного проєкту.

            Якщо нотатка одночасно і завдання, і стосується проєкту — віднеси її до категорії
            проєкту, а не до "To-do list" (проєктний контекст важливіший за загальний список
            справ).

            Формат виводу — звичайний текст українською, без Markdown-розмітки крім заголовків:
            - заголовок кожної групи окремим рядком, що починається з "## "
            - під заголовком кожна нотатка з її часом на початку, текст нотатки без змін
            - порожній рядок між групами
            - якщо є категорія "To-do list", постав її першою

            Не додавай нічого, крім згрупованих нотаток — без вступу чи висновку.
        """.trimIndent()
    }
}
