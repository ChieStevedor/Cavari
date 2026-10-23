package com.cavari.voicenotes.worker

import android.content.Context
import androidx.work.ExistingPeriodicWorkPolicy
import androidx.work.PeriodicWorkRequestBuilder
import androidx.work.WorkManager
import java.util.Calendar
import java.util.concurrent.TimeUnit

/**
 * Schedules [DailyDigestWorker] to run once a day around [TARGET_HOUR] local
 * time. Only for the background schedule — a manual "run now" trigger
 * should call [DigestBuilder] directly instead of going through WorkManager,
 * since background work can be silently deferred by battery management
 * (observed on this device) with no way to tell the user it happened.
 */
object DigestScheduler {
    private const val WORK_NAME = "daily_notes_digest"
    private const val TARGET_HOUR = 19

    fun schedule(context: Context) {
        val request = PeriodicWorkRequestBuilder<DailyDigestWorker>(24, TimeUnit.HOURS)
            .setInitialDelay(millisUntilNextRun(), TimeUnit.MILLISECONDS)
            .build()
        WorkManager.getInstance(context).enqueueUniquePeriodicWork(
            WORK_NAME, ExistingPeriodicWorkPolicy.UPDATE, request
        )
    }

    private fun millisUntilNextRun(): Long {
        val now = Calendar.getInstance()
        val target = Calendar.getInstance().apply {
            set(Calendar.HOUR_OF_DAY, TARGET_HOUR)
            set(Calendar.MINUTE, 0)
            set(Calendar.SECOND, 0)
            set(Calendar.MILLISECOND, 0)
        }
        if (!target.after(now)) {
            target.add(Calendar.DAY_OF_YEAR, 1)
        }
        return target.timeInMillis - now.timeInMillis
    }
}
