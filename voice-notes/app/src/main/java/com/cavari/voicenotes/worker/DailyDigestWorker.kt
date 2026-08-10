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
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import com.cavari.voicenotes.R
import com.cavari.voicenotes.data.Note
import com.cavari.voicenotes.data.NotesRepository
import com.cavari.voicenotes.transcription.NoteGrouper
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Date
import java.util.Locale

/**
 * Runs once a day, collects that day's notes, groups them by topic/project
 * via [NoteGrouper] (falling back to a plain chronological list if that
 * call fails), and writes the result to a plain-text file in the public
 * Downloads folder so it can be pasted elsewhere for analysis.
 */
class DailyDigestWorker(context: Context, params: WorkerParameters) : CoroutineWorker(context, params) {

    override suspend fun doWork(): Result {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q) {
            // Scoped storage (MediaStore.Downloads) requires API 29+.
            return Result.failure()
        }

        val (startOfDay, endOfDay) = todayRange()
        val notes = NotesRepository(applicationContext).getNotesBetween(startOfDay, endOfDay)
        if (notes.isEmpty()) return Result.success()

        val dayFormatter = SimpleDateFormat("dd.MM.yyyy", Locale.getDefault())
        val header = "Нотатки за ${dayFormatter.format(Date(startOfDay))}\n\n"
        val groupedBody = NoteGrouper().groupByTopic(notes).getOrElse { chronologicalFallback(notes) }
        val body = header + groupedBody

        val fileName = "voice-notes-${SimpleDateFormat("yyyy-MM-dd", Locale.US).format(Date(startOfDay))}.txt"
        val uri = writeToDownloads(fileName, body) ?: return Result.retry()

        showNotification(fileName, uri)
        return Result.success()
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
        val resolver = applicationContext.contentResolver
        val values = ContentValues().apply {
            put(MediaStore.Downloads.DISPLAY_NAME, fileName)
            put(MediaStore.Downloads.MIME_TYPE, "text/plain")
            put(MediaStore.Downloads.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS)
        }
        val uri = resolver.insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, values) ?: return null
        val wrote = resolver.openOutputStream(uri)?.use { it.write(content.toByteArray()) }
        return if (wrote != null) uri else null
    }

    private fun showNotification(fileName: String, uri: Uri) {
        ensureChannel()

        val openIntent = Intent(Intent.ACTION_VIEW).apply {
            setDataAndType(uri, "text/plain")
            addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
        }
        val openPendingIntent = PendingIntent.getActivity(
            applicationContext, 0, openIntent, PendingIntent.FLAG_IMMUTABLE
        )

        val shareIntent = Intent(Intent.ACTION_SEND).apply {
            type = "text/plain"
            putExtra(Intent.EXTRA_STREAM, uri)
            addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
        }
        val chooser = Intent.createChooser(shareIntent, applicationContext.getString(R.string.digest_share_title))
        val sharePendingIntent = PendingIntent.getActivity(
            applicationContext, 1, chooser, PendingIntent.FLAG_IMMUTABLE
        )

        val notification = NotificationCompat.Builder(applicationContext, CHANNEL_ID)
            .setContentTitle(applicationContext.getString(R.string.digest_notif_title))
            .setContentText(fileName)
            .setSmallIcon(R.drawable.ic_mic)
            .setContentIntent(openPendingIntent)
            .addAction(R.drawable.ic_mic, applicationContext.getString(R.string.digest_share_action), sharePendingIntent)
            .setAutoCancel(true)
            .build()

        NotificationManagerCompat.from(applicationContext).notify(NOTIFICATION_ID, notification)
    }

    private fun ensureChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                applicationContext.getString(R.string.channel_digest),
                NotificationManager.IMPORTANCE_DEFAULT
            )
            applicationContext.getSystemService(NotificationManager::class.java).createNotificationChannel(channel)
        }
    }

    companion object {
        private const val CHANNEL_ID = "digest_channel"
        private const val NOTIFICATION_ID = 3001
    }
}
