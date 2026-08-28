package com.cavari.voicenotes.util

import android.content.Context

/** Tiny persisted flag so the widget knows whether a recording is in progress across process restarts. */
object RecordingState {
    private const val PREFS = "recording_state"
    private const val KEY_RECORDING = "is_recording"

    fun isRecording(context: Context): Boolean =
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).getBoolean(KEY_RECORDING, false)

    fun setRecording(context: Context, value: Boolean) {
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit().putBoolean(KEY_RECORDING, value).apply()
    }
}
