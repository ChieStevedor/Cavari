package com.cavari.voicenotes

import android.Manifest
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.activity.viewModels
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.core.content.ContextCompat
import com.cavari.voicenotes.service.RecordingForegroundService
import com.cavari.voicenotes.service.WakeWordService
import com.cavari.voicenotes.ui.NotesViewModel
import com.cavari.voicenotes.ui.VoiceNotesScreen
import com.cavari.voicenotes.util.ListeningState
import com.cavari.voicenotes.util.RecordingState

class MainActivity : ComponentActivity() {

    private val notesViewModel: NotesViewModel by viewModels()

    private var isRecording by mutableStateOf(false)
    private var isListening by mutableStateOf(false)

    private val stateReceiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context?, intent: Intent?) {
            if (intent?.action == RecordingForegroundService.ACTION_STATE_CHANGED) {
                isRecording = intent.getBooleanExtra(RecordingForegroundService.EXTRA_IS_RECORDING, false)
            }
        }
    }

    private val permissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions()
    ) { /* user can just tap the mic again if they granted the permission */ }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        isRecording = RecordingState.isRecording(this)
        isListening = ListeningState.isEnabled(this)
        requestNeededPermissions()

        setContent {
            MaterialTheme {
                Surface(modifier = Modifier.fillMaxSize(), color = MaterialTheme.colorScheme.background) {
                    val notes by notesViewModel.notes.collectAsState()
                    VoiceNotesScreen(
                        notes = notes,
                        isRecording = isRecording,
                        isListening = isListening,
                        onMicClick = ::toggleRecording,
                        onListeningToggle = ::toggleListening
                    )
                }
            }
        }
    }

    override fun onStart() {
        super.onStart()
        val filter = IntentFilter(RecordingForegroundService.ACTION_STATE_CHANGED)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            registerReceiver(stateReceiver, filter, Context.RECEIVER_NOT_EXPORTED)
        } else {
            @Suppress("UnspecifiedRegisterReceiverFlag")
            registerReceiver(stateReceiver, filter)
        }
    }

    override fun onStop() {
        super.onStop()
        unregisterReceiver(stateReceiver)
    }

    private fun requestNeededPermissions() {
        val needed = mutableListOf(Manifest.permission.RECORD_AUDIO)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            needed += Manifest.permission.POST_NOTIFICATIONS
        }
        val missing = needed.filter {
            ContextCompat.checkSelfPermission(this, it) != PackageManager.PERMISSION_GRANTED
        }
        if (missing.isNotEmpty()) {
            permissionLauncher.launch(missing.toTypedArray())
        }
    }

    private fun toggleRecording() {
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.RECORD_AUDIO)
            != PackageManager.PERMISSION_GRANTED
        ) {
            requestNeededPermissions()
            return
        }
        val action = if (isRecording) RecordingForegroundService.ACTION_STOP else RecordingForegroundService.ACTION_START
        val intent = Intent(this, RecordingForegroundService::class.java).setAction(action)
        ContextCompat.startForegroundService(this, intent)
        isRecording = !isRecording
    }

    private fun toggleListening() {
        isListening = !isListening
        ListeningState.setEnabled(this, isListening)
        if (isListening) {
            WakeWordService.start(this)
        } else {
            WakeWordService.stop(this)
        }
    }
}
