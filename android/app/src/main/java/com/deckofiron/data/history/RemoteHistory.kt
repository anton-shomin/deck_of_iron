package com.deckofiron.data.history

import com.deckofiron.domain.Suit
import com.deckofiron.domain.WorkoutMode
import com.deckofiron.domain.WorkoutSummary
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import java.time.Instant
import java.time.OffsetDateTime

/** Cloud copy of the history (Supabase table `public.workout_history`, see supabase/migrations). */
interface RemoteHistory {
  suspend fun upsert(entries: List<HistoryEntry>)

  suspend fun fetchAll(): List<HistoryEntry>

  /** Deletes every row of the signed-in user. */
  suspend fun deleteAll()
}

/** Row of `public.workout_history`; `user_id` is filled by the column default `auth.uid()`. */
@Serializable
data class WorkoutHistoryRow(
  val id: String,
  @SerialName("finished_at") val finishedAt: String,
  @SerialName("duration_seconds") val durationSeconds: Int,
  val mode: String,
  val beast: Boolean,
  @SerialName("total_cards") val totalCards: Int,
  @SerialName("completed_cards") val completedCards: Int,
  @SerialName("total_reps") val totalReps: Int,
  @SerialName("suit_reps") val suitReps: Map<String, Int>,
  @SerialName("total_tonnage_kg") val totalTonnageKg: Int,
  @SerialName("jokers_completed") val jokersCompleted: Int,
)

fun HistoryEntry.toRow() = WorkoutHistoryRow(
  id = id,
  finishedAt = Instant.ofEpochMilli(finishedAtEpochMs).toString(),
  durationSeconds = summary.durationSeconds,
  mode = mode.name,
  beast = beast,
  totalCards = summary.totalCards,
  completedCards = summary.completedCards,
  totalReps = summary.totalReps,
  suitReps = summary.suitReps.mapKeys { it.key.name },
  totalTonnageKg = summary.totalTonnageKg,
  jokersCompleted = summary.jokersCompleted,
)

/** Postgres returns `+00:00` offsets, so parse as an offset date-time rather than an `Instant`. */
fun WorkoutHistoryRow.toEntry() = HistoryEntry(
  id = id,
  finishedAtEpochMs = OffsetDateTime.parse(finishedAt).toInstant().toEpochMilli(),
  mode = WorkoutMode.valueOf(mode),
  beast = beast,
  summary = WorkoutSummary(
    durationSeconds = durationSeconds,
    completedCards = completedCards,
    totalCards = totalCards,
    totalReps = totalReps,
    suitReps = Suit.entries.associateWith { suitReps[it.name] ?: 0 },
    totalTonnageKg = totalTonnageKg,
    jokersCompleted = jokersCompleted,
  ),
  isSynced = true,
)
