package com.cavari.voicenotes.util

import android.content.Context
import android.os.Build
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager

/** Short vibration cues so the hands-free flow is felt, not just seen on screen. */
object Haptics {

    /** Single short buzz — wake word detected, recording started. */
    fun recordingStarted(context: Context) {
        vibrator(context).vibrate(VibrationEffect.createOneShot(120, VibrationEffect.DEFAULT_AMPLITUDE))
    }

    /** Two short buzzes — silence detected, recording auto-stopped. */
    fun recordingAutoStopped(context: Context) {
        val pattern = longArrayOf(0, 90, 90, 90)
        vibrator(context).vibrate(VibrationEffect.createWaveform(pattern, -1))
    }

    private fun vibrator(context: Context): Vibrator =
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            (context.getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as VibratorManager).defaultVibrator
        } else {
            @Suppress("DEPRECATION")
            context.getSystemService(Context.VIBRATOR_SERVICE) as Vibrator
        }
}
