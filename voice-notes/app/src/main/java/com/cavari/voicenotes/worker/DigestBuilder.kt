package com.cavari.voicenotes.worker

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.ContentValues
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.Environment
import android.provider.MediaStore
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import com.cavari.voicenotes.MainActivity
import com.cavari.voicenotes.R
import com.cavari.voicenotes.data.Note
import com.cavari.voicenotes.data.NotesRepository
import com.cavari.voicenotes.transcription.NoteGrouper
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Date
import java.util.Locale

/**
 * Builds the "today's notes, grouped by topic" digest file and *always*
 * posts a notification about the outcome — used by both the scheduled
 * 19:00 job ([DailyDigestWorker]) and the manual "Сформувати файл зараз"
 * button, so pressing the button never silently does nothing: no notes,
 * a write failure, and a general error all get their own visible message
 * instead of just the success case.
 */
class DigestBuilder(private val context: Context) {

    suspend fun build() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q) {
            // Scoped storage (MediaStore.Downloads) requires API 29+.
            notify(context.getString(R.string.digest_unsupported_android))
            return
        }

        try {
            val (startOfDay, endOfDay) = todayRange()
            val notes = NotesRepository(context).getNotesBetween(startOfDay, endOfDay)
            if (notes.isEmpty()) {
                notify(context.getString(R.string.digest_no_notes_today))
                return
            }

            val dayFormatter = SimpleDateFormat("dd.MM.yyyy", Locale.getDefault())
            val header = "Нотатки за ${dayFormatter.format(Date(startOfDay))}\n\n"
            val groupedBody = NoteGrouper().groupByTopic(notes).getOrElse { chronologicalFallback(notes) }
            val body = header + groupedBody

            val fileName = "voice-notes-${SimpleDateFormat("yyyy-MM-dd", Locale.US).format(Date(startOfDay))}.txt"
            val uri = writeToDownloads(fileName, body)
            if (uri == null) {
                notify(context.getString(R.string.digest_write_failed))
                return
            }

            notifyWithFile(fileName, uri)
        } catch (e: Exception) {
            notify(context.getString(R.string.digest_error, e.message ?: e.toString()))
        }
    }

    private fun chronologicalFallback(notes: List<Note>): String {
        val timeFormatter = SimpleDateFormat("HH:mm", Locale.getDefault())
        return buildString {
            notes.forEach { note ->
                appendLine("${timeFormatter.format(Date(note.createdAt))} — ${note.text}")
                appendLine()
            }
        }
    }

    private fun todayRange(): Pair<Long, Long> {
        val start = Calendar.getInstance().apply {
            set(Calendar.HOUR_OF_DAY, 0)
            set(Calendar.MINUTE, 0)
            set(Calendar.SECOND, 0)
            set(Calendar.MILLISECOND, 0)
        }.timeInMillis
        return start to (start + 24 * 60 * 60 * 1000L)
    }

    private fun writeToDownloads(fileName: String, content: String): Uri? {
        val resolver = context.contentResolver
        val values = ContentValues().apply {
            put(MediaStore.Downloads.DISPLAY_NAME, fileName)
            put(MediaStore.Downloads.MIME_TYPE, "text/plain")
            put(MediaStore.Downloads.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS)
        }
        val uri = resolver.insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, values) ?: return null
        val wrote = resolver.openOutputStream(uri)?.use { it.write(content.toByteArray()) }
        return if (wrote != null) uri else null
    }

    private fun notifyWithFile(fileName: String, uri: Uri) {
        ensureChannel()

        val openIntent = Intent(Intent.ACTION_VIEW).apply {
            setDataAndType(uri, "text/plain")
            addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
        }
        val openPendingIntent = PendingIntent.getActivity(context, 0, openIntent, PendingIntent.FLAG_IMMUTABLE)

        val shareIntent = Intent(Intent.ACTION_SEND).apply {
            type = "text/plain"
            putExtra(Intent.EXTRA_STREAM, uri)
            addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
        }
        val chooser = Intent.createChooser(shareIntent, context.getString(R.string.digest_share_title))
        val sharePendingIntent = PendingIntent.getActivity(context, 1, chooser, PendingIntent.FLAG_IMMUTABLE)

        val notification = NotificationCompat.Builder(context, CHANNEL_ID)
            .setContentTitle(context.getString(R.string.digest_notif_title))
            .setContentText(fileName)
            .setSmallIcon(R.drawable.ic_mic)
            .setContentIntent(openPendingIntent)
            .addAction(R.drawable.ic_mic, context.getString(R.string.digest_share_action), sharePendingIntent)
            .setAutoCancel(true)
            .build()

        NotificationManagerCompat.from(context).notify(NOTIFICATION_ID, notification)
    }

    private fun notify(text: String) {
        ensureChannel()
        val openIntent = Intent(context, MainActivity::class.java)
        val pendingIntent = PendingIntent.getActivity(context, 2, openIntent, PendingIntent.FLAG_IMMUTABLE)
        val notification = NotificationCompat.Builder(context, CHANNEL_ID)
            .setContentTitle(context.getString(R.string.app_name))
            .setContentText(text)
            .setSmallIcon(R.drawable.ic_mic)
            .setContentIntent(pendingIntent)
            .setAutoCancel(true)
            .build()
        NotificationManagerCompat.from(context).notify(NOTIFICATION_ID, notification)
    }

    private fun ensureChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID, context.getString(R.string.channel_digest), NotificationManager.IMPORTANCE_DEFAULT
            )
            context.getSystemService(NotificationManager::class.java).createNotificationChannel(channel)
        }
    }

    companion object {
        private const val CHANNEL_ID = "digest_channel"
        private const val NOTIFICATION_ID = 3001
    }
}
