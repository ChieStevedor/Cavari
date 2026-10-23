package com.cavari.voicenotes.data

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.Query
import kotlinx.coroutines.flow.Flow

@Dao
interface NoteDao {
    @Insert
    suspend fun insert(note: Note): Long

    @Query("SELECT * FROM notes ORDER BY createdAt DESC")
    fun observeAll(): Flow<List<Note>>

    @Query("SELECT * FROM notes WHERE createdAt >= :startOfDay AND createdAt < :endOfDay ORDER BY createdAt ASC")
    suspend fun getBetween(startOfDay: Long, endOfDay: Long): List<Note>

    @Query("DELETE FROM notes WHERE id = :id")
    suspend fun deleteById(id: Long)
}
