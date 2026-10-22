package com.deckofiron.data.history

import android.content.Context
import androidx.room.Dao
import androidx.room.Database
import androidx.room.Entity
import androidx.room.PrimaryKey
import androidx.room.Query
import androidx.room.Room
import androidx.room.RoomDatabase
import androidx.room.Upsert
import com.deckofiron.domain.Suit
import com.deckofiron.domain.WorkoutMode
import com.deckofiron.domain.WorkoutSummary
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map

/** Device-side history: the offline source of truth that is pushed to Supabase. */
interface LocalHistory {
  fun observeAll(): Flow<List<HistoryEntry>>

  suspend fun upsert(entries: List<HistoryEntry>)

  suspend fun pending(): List<HistoryEntry>

  suspend fun markSynced(ids: List<String>)

  suspend fun deleteAll()
}

@Entity(tableName = "workout_history")
data class WorkoutHistoryEntity(
  @PrimaryKey val id: String,
  val finishedAtEpochMs: Long,
  val durationSeconds: Int,
  val mode: String,
  val beast: Boolean,
  val totalCards: Int,
  val completedCards: Int,
  val totalReps: Int,
  val repsSpades: Int,
  val repsHearts: Int,
  val repsDiamonds: Int,
  val repsClubs: Int,
  val totalTonnageKg: Int,
  val jokersCompleted: Int,
  val synced: Boolean,
)

@Dao
interface WorkoutHistoryDao {
  @Query("SELECT * FROM workout_history ORDER BY finishedAtEpochMs DESC")
  fun observeAll(): Flow<List<WorkoutHistoryEntity>>

  @Query("SELECT * FROM workout_history WHERE synced = 0")
  suspend fun pending(): List<WorkoutHistoryEntity>

  @Upsert
  suspend fun upsert(entities: List<WorkoutHistoryEntity>)

  @Query("UPDATE workout_history SET synced = 1 WHERE id IN (:ids)")
  suspend fun markSynced(ids: List<String>)

  @Query("DELETE FROM workout_history")
  suspend fun deleteAll()
}

@Database(entities = [WorkoutHistoryEntity::class], version = 1)
abstract class AppDatabase : RoomDatabase() {
  abstract fun workoutHistoryDao(): WorkoutHistoryDao

  companion object {
    fun create(context: Context): AppDatabase =
      Room.databaseBuilder(context, AppDatabase::class.java, "deck_of_iron.db").build()
  }
}

class RoomLocalHistory(private val dao: WorkoutHistoryDao) : LocalHistory {
  override fun observeAll(): Flow<List<HistoryEntry>> = dao.observeAll().map { rows -> rows.map { it.toEntry() } }

  override suspend fun upsert(entries: List<HistoryEntry>) = dao.upsert(entries.map { it.toEntity() })

  override suspend fun pending(): List<HistoryEntry> = dao.pending().map { it.toEntry() }

  override suspend fun markSynced(ids: List<String>) {
    if (ids.isNotEmpty()) dao.markSynced(ids)
  }

  override suspend fun deleteAll() = dao.deleteAll()
}

internal fun WorkoutHistoryEntity.toEntry() = HistoryEntry(
  id = id,
  finishedAtEpochMs = finishedAtEpochMs,
  mode = WorkoutMode.valueOf(mode),
  beast = beast,
  summary = WorkoutSummary(
    durationSeconds = durationSeconds,
    completedCards = completedCards,
    totalCards = totalCards,
    totalReps = totalReps,
    suitReps = mapOf(Suit.S to repsSpades, Suit.H to repsHearts, Suit.D to repsDiamonds, Suit.C to repsClubs),
    totalTonnageKg = totalTonnageKg,
    jokersCompleted = jokersCompleted,
  ),
  isSynced = synced,
)

internal fun HistoryEntry.toEntity() = WorkoutHistoryEntity(
  id = id,
  finishedAtEpochMs = finishedAtEpochMs,
  durationSeconds = summary.durationSeconds,
  mode = mode.name,
  beast = beast,
  totalCards = summary.totalCards,
  completedCards = summary.completedCards,
  totalReps = summary.totalReps,
  repsSpades = summary.suitReps[Suit.S] ?: 0,
  repsHearts = summary.suitReps[Suit.H] ?: 0,
  repsDiamonds = summary.suitReps[Suit.D] ?: 0,
  repsClubs = summary.suitReps[Suit.C] ?: 0,
  totalTonnageKg = summary.totalTonnageKg,
  jokersCompleted = summary.jokersCompleted,
  synced = isSynced,
)
