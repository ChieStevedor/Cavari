package com.cavari.voicenotes.util

/**
 * Lets a note recording claim exclusive use of the microphone from the
 * wake-word listener, which otherwise keeps its own capture session open
 * continuously. Running both at once starves one of them of real audio on
 * most devices — the recording looks like it's happening (UI shows
 * "recording"), but the resulting file ends up nearly empty.
 *
 * A no-op when the wake-word listener isn't running (nothing registered).
 */
object MicArbiter {

    interface Pausable {
        fun pauseListening()
        fun resumeListening()
    }

    @Volatile private var current: Pausable? = null
    @Volatile private var pausedByOther = false

    fun register(listener: Pausable) {
        current = listener
    }

    fun unregister(listener: Pausable) {
        if (current === listener) current = null
    }

    /** Call before opening any other microphone capture. */
    fun pauseForExternalCapture() {
        val listener = current ?: return
        pausedByOther = true
        listener.pauseListening()
    }

    /** Call as soon as that other capture releases the mic. */
    fun resumeAfterExternalCapture() {
        if (!pausedByOther) return
        pausedByOther = false
        current?.resumeListening()
    }
}
