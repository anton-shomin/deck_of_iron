package com.deckofiron.ui.history

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.deckofiron.data.history.HistoryEntry
import com.deckofiron.data.history.HistoryRepository
import com.deckofiron.data.history.SyncState
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch

/** Sync and clear run on [appScope] so leaving the screen never cuts an upload or a delete short. */
class HistoryViewModel(private val repository: HistoryRepository, private val appScope: CoroutineScope) : ViewModel() {
  /** `null` until Room answers, so the empty state does not flash before the first load. */
  val entries: StateFlow<List<HistoryEntry>?> =
    repository.entries.stateIn(viewModelScope, SharingStarted.WhileSubscribed(STOP_TIMEOUT_MS), null)

  val syncState: StateFlow<SyncState> = repository.syncState

  fun refresh() {
    appScope.launch { repository.sync() }
  }

  fun clear() {
    appScope.launch { repository.clear() }
  }

  private companion object {
    const val STOP_TIMEOUT_MS = 5_000L
  }
}
