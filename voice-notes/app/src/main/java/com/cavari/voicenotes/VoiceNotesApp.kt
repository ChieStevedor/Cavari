package com.cavari.voicenotes

import android.app.Application
import com.cavari.voicenotes.util.CrashLogger
import com.cavari.voicenotes.worker.DigestScheduler

class VoiceNotesApp : Application() {
    override fun onCreate() {
        super.onCreate()
        CrashLogger.install(this)
        DigestScheduler.schedule(this)
        // Note: wake-word listening is NOT auto-resumed here. Android 14+
        // forbids starting a foreground service when the app isn't in an
        // eligible (foreground) state, and Application.onCreate() can run
        // from a background restart — that crashed the app on every kill.
        // MainActivity.onCreate() resumes it instead, since opening the app
        // is always a safe, foreground-eligible context.
    }
}
