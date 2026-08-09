package com.cavari.voicenotes.data

import android.content.Context
import kotlinx.coroutines.flow.Flow

class NotesRepository(context: Context) {
    private val dao = AppDatabase.getInstance(context).noteDao()

    fun observeNotes(): Flow<List<Note>> = dao.observeAll()

    suspend fun saveNote(text: String) {
        dao.insert(Note(text = text, createdAt = System.currentTimeMillis()))
    }

    suspend fun deleteNote(id: Long) {
        dao.deleteById(id)
    }

    suspend fun getNotesBetween(startOfDay: Long, endOfDay: Long): List<Note> =
        dao.getBetween(startOfDay, endOfDay)
}
