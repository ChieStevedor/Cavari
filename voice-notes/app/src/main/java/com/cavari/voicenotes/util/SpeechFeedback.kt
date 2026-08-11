package com.cavari.voicenotes.util

import android.content.Context
import android.speech.tts.TextToSpeech
import android.speech.tts.UtteranceProgressListener
import java.util.Locale

/**
 * Short spoken confirmations ("Записую" / "Запис зупинено") for the
 * hands-free wake-word flow — a vibration alone is easy to miss while
 * driving. Falls back to English ("Recording" / "Recording stopped") if no
 * Ukrainian voice is installed on the device's TTS engine, so there's still
 * an audible cue either way — some engines/devices simply don't ship a
 * Ukrainian voice at all.
 */
class SpeechFeedback(context: Context) {

    private var tts: TextToSpeech? = null
    @Volatile private var isReady = false
    @Volatile private var useEnglishFallback = false

    init {
        tts = TextToSpeech(context.applicationContext) { status ->
            val engine = tts
            if (status != TextToSpeech.SUCCESS || engine == null) {
                isReady = false
                return@TextToSpeech
            }
            val ukResult = engine.setLanguage(Locale("uk"))
            if (isSupported(ukResult)) {
                useEnglishFallback = false
                isReady = true
                return@TextToSpeech
            }
            val enResult = engine.setLanguage(Locale.ENGLISH)
            useEnglishFallback = true
            isReady = isSupported(enResult)
        }
    }

    private fun isSupported(result: Int) =
        result != TextToSpeech.LANG_MISSING_DATA && result != TextToSpeech.LANG_NOT_SUPPORTED

    /**
     * Speaks [ukrainianText], or [englishFallbackText] if no Ukrainian voice
     * is available. Invokes [onDone] once speech finishes (immediately if
     * TTS isn't available at all).
     */
    fun speak(ukrainianText: String, englishFallbackText: String, onDone: (() -> Unit)? = null) {
        val engine = tts
        if (!isReady || engine == null) {
            onDone?.invoke()
            return
        }
        if (onDone != null) {
            engine.setOnUtteranceProgressListener(object : UtteranceProgressListener() {
                override fun onStart(utteranceId: String?) {}
                override fun onDone(utteranceId: String?) {
                    onDone()
                }
                @Deprecated("Deprecated in Java")
                override fun onError(utteranceId: String?) {
                    onDone()
                }
            })
        }
        val text = if (useEnglishFallback) englishFallbackText else ukrainianText
        engine.speak(text, TextToSpeech.QUEUE_FLUSH, null, "voice_notes_utterance")
    }

    fun shutdown() {
        tts?.stop()
        tts?.shutdown()
        tts = null
    }
}
