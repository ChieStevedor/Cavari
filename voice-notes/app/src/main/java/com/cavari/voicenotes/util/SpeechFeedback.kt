package com.cavari.voicenotes.util

import android.content.Context
import android.speech.tts.TextToSpeech
import android.speech.tts.UtteranceProgressListener
import java.util.Locale

/**
 * Short spoken confirmations ("Записую" / "Запис зупинено") for the
 * hands-free wake-word flow — a vibration alone is easy to miss while
 * driving. Falls back to silently doing nothing (via [onDone] firing right
 * away) if no Ukrainian voice is installed on the device.
 */
class SpeechFeedback(context: Context) {

    private var tts: TextToSpeech? = null
    @Volatile private var isReady = false

    init {
        tts = TextToSpeech(context.applicationContext) { status ->
            val engine = tts
            isReady = status == TextToSpeech.SUCCESS && engine != null && run {
                val result = engine.setLanguage(Locale("uk"))
                result != TextToSpeech.LANG_MISSING_DATA && result != TextToSpeech.LANG_NOT_SUPPORTED
            }
        }
    }

    /** Speaks [text], invoking [onDone] once speech finishes (immediately if TTS isn't available). */
    fun speak(text: String, onDone: (() -> Unit)? = null) {
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
        engine.speak(text, TextToSpeech.QUEUE_FLUSH, null, "voice_notes_utterance")
    }

    fun shutdown() {
        tts?.stop()
        tts?.shutdown()
        tts = null
    }
}
