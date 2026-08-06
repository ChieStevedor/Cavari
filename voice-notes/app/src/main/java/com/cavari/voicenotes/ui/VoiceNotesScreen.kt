package com.cavari.voicenotes.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Switch
import androidx.compose.material3.Text
import androidx.compose.material3.pulltorefresh.PullToRefreshBox
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.cavari.voicenotes.R
import com.cavari.voicenotes.data.Note
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

@Composable
fun VoiceNotesScreen(
    notes: List<Note>,
    isRecording: Boolean,
    isListening: Boolean,
    onMicClick: () -> Unit,
    onListeningToggle: () -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Spacer(Modifier.height(16.dp))
        Text(
            text = stringResource(R.string.app_name),
            fontSize = 22.sp,
            fontWeight = FontWeight.SemiBold
        )
        Spacer(Modifier.height(32.dp))

        MicButton(isRecording = isRecording, onClick = onMicClick)

        Spacer(Modifier.height(16.dp))
        Text(
            text = stringResource(if (isRecording) R.string.recording_in_progress else R.string.tap_to_record)
        )

        Spacer(Modifier.height(24.dp))
        ListeningIndicator(isListening = isListening, onToggle = onListeningToggle)

        Spacer(Modifier.height(24.dp))
        HorizontalDivider()
        Spacer(Modifier.height(8.dp))
        Text(
            text = stringResource(R.string.recent_notes),
            fontWeight = FontWeight.Medium,
            modifier = Modifier.align(Alignment.Start)
        )
        Spacer(Modifier.height(8.dp))

        var isRefreshing by remember { mutableStateOf(false) }
        val refreshScope = rememberCoroutineScope()

        // The list is already live (Room emits on every change), so there's
        // nothing to actually re-fetch — this just gives the familiar pull
        // gesture a brief, honest confirmation that the list is current.
        PullToRefreshBox(
            isRefreshing = isRefreshing,
            onRefresh = {
                isRefreshing = true
                refreshScope.launch {
                    delay(400)
                    isRefreshing = false
                }
            },
            modifier = Modifier
                .fillMaxWidth()
                .weight(1f)
        ) {
            if (notes.isEmpty()) {
                Text(
                    text = stringResource(R.string.no_notes_yet),
                    color = Color.Gray,
                    modifier = Modifier.padding(top = 16.dp)
                )
            } else {
                LazyColumn(modifier = Modifier.fillMaxSize()) {
                    items(notes, key = { it.id }) { note ->
                        NoteRow(note)
                    }
                }
            }
        }
    }
}

@Composable
fun MicButton(isRecording: Boolean, onClick: () -> Unit) {
    val backgroundColor = if (isRecording) MaterialTheme.colorScheme.error else MaterialTheme.colorScheme.primary
    Box(
        modifier = Modifier
            .size(120.dp)
            .clip(CircleShape)
            .background(backgroundColor)
            .clickable(onClick = onClick),
        contentAlignment = Alignment.Center
    ) {
        if (isRecording) {
            Box(
                modifier = Modifier
                    .size(28.dp)
                    .clip(RoundedCornerShape(4.dp))
                    .background(Color.White)
            )
        } else {
            Box(
                modifier = Modifier
                    .size(48.dp)
                    .clip(CircleShape)
                    .background(Color.White)
            )
        }
    }
}

@Composable
fun ListeningIndicator(isListening: Boolean, onToggle: () -> Unit) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Column(modifier = Modifier.weight(1f)) {
            Text(
                text = stringResource(if (isListening) R.string.listening_on else R.string.listening_off),
                fontWeight = FontWeight.Medium
            )
            Text(
                text = stringResource(R.string.listening_hint),
                fontSize = 12.sp,
                color = Color.Gray
            )
        }
        Switch(checked = isListening, onCheckedChange = { onToggle() })
    }
}

@Composable
fun NoteRow(note: Note) {
    val formatter = remember { SimpleDateFormat("dd.MM.yyyy HH:mm", Locale.getDefault()) }
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 8.dp)
    ) {
        Text(formatter.format(Date(note.createdAt)), fontSize = 12.sp, color = Color.Gray)
        Text(note.text)
        HorizontalDivider(modifier = Modifier.padding(top = 8.dp))
    }
}
