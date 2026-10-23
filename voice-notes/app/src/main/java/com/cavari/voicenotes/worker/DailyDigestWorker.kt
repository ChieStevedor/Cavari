package com.cavari.voicenotes.worker

import android.content.Context
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters

/** Scheduled (19:00) entry point — actual work lives in [DigestBuilder], shared with the manual button. */
class DailyDigestWorker(context: Context, params: WorkerParameters) : CoroutineWorker(context, params) {
    override suspend fun doWork(): Result {
        DigestBuilder(applicationContext).build()
        return Result.success()
    }
}
