package com.cavari.voicenotes.util

import android.content.Context

/** Persists whether the user has turned the "Hey, Naomi" wake-word listener on. */
object ListeningState {
    private const val PREFS = "listening_state"
    private const val KEY_ENABLED = "is_enabled"

    fun isEnabled(context: Context): Boolean =
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).getBoolean(KEY_ENABLED, false)

    fun setEnabled(context: Context, value: Boolean) {
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit().putBoolean(KEY_ENABLED, value).apply()
    }
}
