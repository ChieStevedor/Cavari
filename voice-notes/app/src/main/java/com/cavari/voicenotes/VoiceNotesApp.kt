package com.cavari.voicenotes

import android.app.Application
import com.cavari.voicenotes.service.WakeWordService
import com.cavari.voicenotes.util.ListeningState

class VoiceNotesApp : Application() {
    override fun onCreate() {
        super.onCreate()
        // Resume wake-word listening if the OS killed the process while it was enabled.
        if (ListeningState.isEnabled(this)) {
            WakeWordService.start(this)
        }
    }
}
