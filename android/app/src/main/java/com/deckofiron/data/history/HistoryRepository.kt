package com.deckofiron.data.history

import com.deckofiron.domain.SessionConfig
import com.deckofiron.domain.WorkoutSummary
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import java.util.UUID

/**
 * Offline-first workout history: every workout is written locally first (pending), then pushed to
 * Supabase by [sync]. Without a configured [remote] the history simply stays on the device.
 */
class HistoryRepository(
  private val local: LocalHistory,
  private val remote: RemoteHistory?,
  private val flags: SyncFlags,
  private val now: () -> Long = System::currentTimeMillis,
  private val newId: () -> String = { UUID.randomUUID().toString() },
) {
  private val syncMutex = Mutex()
  private val _syncState = MutableStateFlow(if (remote == null) SyncState.Disabled else SyncState.Idle)

  val syncState: StateFlow<SyncState> = _syncState.asStateFlow()

  val entries: Flow<List<HistoryEntry>> = local.observeAll()

  /** Stores a finished (or stopped) workout locally; call [sync] afterwards to upload it. */
  suspend fun record(summary: WorkoutSummary, config: SessionConfig): HistoryEntry {
    val entry = HistoryEntry(
      id = newId(),
      finishedAtEpochMs = now(),
      mode = config.mode,
      beast = config.beast,
      summary = summary,
      isSynced = false,
    )
    local.upsert(listOf(entry))
    return entry
  }

  /** Pending remote clear → upload pending rows → pull the cloud copy. Safe to call concurrently. */
  suspend fun sync(): SyncState {
    val remote = remote ?: return SyncState.Disabled
    return syncMutex.withLock {
      _syncState.value = SyncState.Syncing
      val result = try {
        if (flags.isRemoteClearPending()) {
          remote.deleteAll()
          flags.setRemoteClearPending(false)
        }
        val pending = local.pending()
        if (pending.isNotEmpty()) {
          remote.upsert(pending)
          local.markSynced(pending.map { it.id })
        }
        val pendingIds = local.pending().map { it.id }.toSet()
        local.upsert(remote.fetchAll().filterNot { it.id in pendingIds })
        SyncState.Synced(now())
      } catch (e: CancellationException) {
        _syncState.value = SyncState.Idle
        throw e
      } catch (e: Exception) {
        SyncState.Failed(e.shortReason())
      }
      _syncState.value = result
      result
    }
  }

  /**
   * Clears the device copy now and the cloud copy on this or the next successful sync.
   * Holds the sync lock so a download already in flight cannot write the old rows back.
   */
  suspend fun clear(): SyncState {
    syncMutex.withLock {
      local.deleteAll()
      if (remote != null) flags.setRemoteClearPending(true)
    }
    return if (remote == null) SyncState.Disabled else sync()
  }
}

private const val MAX_REASON_LENGTH = 120

/** supabase-kt messages append the URL and request headers; the first line is the useful part. */
private fun Throwable.shortReason(): String =
  message?.lineSequence()?.firstOrNull { it.isNotBlank() }?.trim()?.take(MAX_REASON_LENGTH)
    ?: this::class.simpleName.orEmpty()
