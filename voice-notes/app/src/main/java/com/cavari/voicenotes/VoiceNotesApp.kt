package com.cavari.voicenotes

import android.app.Application
import com.cavari.voicenotes.service.WakeWordService
import com.cavari.voicenotes.util.ListeningState
import com.cavari.voicenotes.worker.DigestScheduler

class VoiceNotesApp : Application() {
    override fun onCreate() {
        super.onCreate()
        DigestScheduler.schedule(this)
        // Resume wake-word listening if the OS killed the process while it was enabled.
        if (ListeningState.isEnabled(this)) {
            WakeWordService.start(this)
        }
    }
}
