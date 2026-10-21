package com.deckofiron.data.history

import com.deckofiron.domain.WorkoutMode
import com.deckofiron.domain.WorkoutSummary

data class HistoryEntry(
  val id: String,
  val finishedAtEpochMs: Long,
  val mode: WorkoutMode,
  val beast: Boolean,
  val summary: WorkoutSummary,
  /** `true` once the row is stored in Supabase. */
  val isSynced: Boolean,
)

sealed interface SyncState {
  /** No Supabase URL/key in the build: history lives on the device only. */
  data object Disabled : SyncState

  data object Idle : SyncState

  data object Syncing : SyncState

  data class Synced(val atEpochMs: Long) : SyncState

  data class Failed(val reason: String) : SyncState
}

/** Persistent flags the sync needs between launches. */
interface SyncFlags {
  suspend fun isRemoteClearPending(): Boolean

  suspend fun setRemoteClearPending(pending: Boolean)
}
