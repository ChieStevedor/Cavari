package com.cavari.voicenotes.transcription

/**
 * Reformats a long transcript (e.g. a call or in-person conversation) into
 * readable turns, best-effort labeling who's speaking based on context.
 *
 * Whisper's plain transcription has no real speaker information — this is
 * an educated guess from an LLM reading the text, not true diarization.
 * Good enough for a two-person conversation; not guaranteed perfect.
 */
class DialogueFormatter {

    private val chatClient = ChatCompletionClient()

    fun format(rawText: String): Result<String> = chatClient.complete(SYSTEM_PROMPT, rawText)

    companion object {
        private val SYSTEM_PROMPT = """
            Ти форматуєш розшифровку запису розмови українською для зручного читання.

            Якщо в тексті очевидно є діалог двох чи більше людей — розбий його на репліки,
            кожну репліку постав з нового рядка, познач мовця як "Мовець 1:", "Мовець 2:" і
            так далі (використовуй ті самі номери послідовно для того самого голосу,
            наскільки можеш визначити зі змісту й манери мовлення).

            Якщо це монолог однієї людини — просто розбий на природні абзаци, без позначок
            мовця.

            Дуже важливо: не змінюй, не скорочуй і не переказуй сам текст — лише додай
            структуру (розбиття на репліки/абзаци і позначки мовця). Виведи тільки
            відформатований текст, без жодних коментарів від себе.
        """.trimIndent()
    }
}
