package com.deckofiron.data.history

import com.deckofiron.domain.SessionConfig
import com.deckofiron.domain.Suit
import com.deckofiron.domain.WorkoutMode
import com.deckofiron.domain.WorkoutSummary
import kotlinx.coroutines.CompletableDeferred
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.launch
import kotlinx.coroutines.test.runCurrent
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test
import java.io.IOException

class HistoryRepositoryTest {

  private class FakeLocal : LocalHistory {
    val rows = MutableStateFlow<Map<String, HistoryEntry>>(emptyMap())

    override fun observeAll(): Flow<List<HistoryEntry>> =
      rows.map { all -> all.values.sortedByDescending { it.finishedAtEpochMs } }

    override suspend fun upsert(entries: List<HistoryEntry>) {
      rows.value = rows.value + entries.associateBy { it.id }
    }

    override suspend fun pending() = rows.value.values.filterNot { it.isSynced }

    override suspend fun markSynced(ids: List<String>) {
      rows.value = rows.value.mapValues { (id, e) -> if (id in ids) e.copy(isSynced = true) else e }
    }

    override suspend fun deleteAll() {
      rows.value = emptyMap()
    }
  }

  private class FakeRemote : RemoteHistory {
    val rows = mutableMapOf<String, HistoryEntry>()
    var failWith: Exception? = null
    var fetchGate: CompletableDeferred<Unit>? = null
    val calls = mutableListOf<String>()

    override suspend fun upsert(entries: List<HistoryEntry>) {
      calls += "upsert"
      failWith?.let { throw it }
      entries.forEach { rows[it.id] = it.copy(isSynced = true) }
    }

    override suspend fun fetchAll(): List<HistoryEntry> {
      calls += "fetch"
      fetchGate?.await()
      failWith?.let { throw it }
      return rows.values.toList()
    }

    override suspend fun deleteAll() {
      calls += "delete"
      failWith?.let { throw it }
      rows.clear()
    }
  }

  private class FakeFlags : SyncFlags {
    var clearPending = false
    override suspend fun isRemoteClearPending() = clearPending
    override suspend fun setRemoteClearPending(pending: Boolean) {
      clearPending = pending
    }
  }

  private val summary = WorkoutSummary(
    durationSeconds = 1500, completedCards = 53, totalCards = 53, totalReps = 410,
    suitReps = Suit.entries.associateWith { 95 }, totalTonnageKg = 0, jokersCompleted = 1,
  )

  private var nextId = 0
  private val local = FakeLocal()
  private val remote = FakeRemote()
  private val flags = FakeFlags()
  private val repository = HistoryRepository(local, remote, flags, now = { 1_000L }, newId = { "w${nextId++}" })

  @Test
  fun `recorded workout is pending until synced`() = runTest {
    repository.record(summary, SessionConfig(mode = WorkoutMode.KETTLEBELL, beast = true))

    val stored = local.rows.value.getValue("w0")
    assertFalse(stored.isSynced)
    assertEquals(WorkoutMode.KETTLEBELL, stored.mode)
    assertTrue(stored.beast)

    assertEquals(SyncState.Synced(1_000L), repository.sync())
    assertTrue(local.rows.value.getValue("w0").isSynced)
    assertEquals(setOf("w0"), remote.rows.keys)
  }

  @Test
  fun `failed upload keeps the workout pending and reports the error`() = runTest {
    remote.failWith = IOException("offline")
    repository.record(summary, SessionConfig())

    assertEquals(SyncState.Failed("offline"), repository.sync())
    assertEquals(SyncState.Failed("offline"), repository.syncState.first())
    assertFalse(local.rows.value.getValue("w0").isSynced)
  }

  @Test
  fun `failure reason keeps only the first line of the error`() = runTest {
    remote.failWith = IllegalStateException("anonymous_provider_disabled\nURL: https://x/auth/v1/signup\nHeaders: {...}")
    repository.record(summary, SessionConfig())

    assertEquals(SyncState.Failed("anonymous_provider_disabled"), repository.sync())
  }

  @Test
  fun `sync pulls rows that exist only in the cloud`() = runTest {
    remote.rows["cloud"] = HistoryEntry("cloud", 500L, WorkoutMode.BODY, false, summary, isSynced = true)

    repository.sync()

    assertTrue(local.rows.value.getValue("cloud").isSynced)
  }

  @Test
  fun `clear while offline deletes the cloud copy before the next upload`() = runTest {
    remote.rows["old"] = HistoryEntry("old", 1L, WorkoutMode.BODY, false, summary, isSynced = true)
    remote.failWith = IOException("offline")

    repository.clear()
    assertTrue(local.rows.value.isEmpty())
    assertTrue(flags.clearPending)

    remote.failWith = null
    repository.record(summary, SessionConfig())
    remote.calls.clear()
    repository.sync()

    assertEquals(listOf("delete", "upsert", "fetch"), remote.calls)
    assertEquals(setOf("w0"), remote.rows.keys)
    assertFalse(flags.clearPending)
  }

  @OptIn(ExperimentalCoroutinesApi::class)
  @Test
  fun `clearing while a sync is downloading does not bring the old rows back`() = runTest {
    val old = HistoryEntry("old", 1L, WorkoutMode.BODY, false, summary, isSynced = true)
    remote.rows["old"] = old
    local.upsert(listOf(old))
    val gate = CompletableDeferred<Unit>()
    remote.fetchGate = gate

    val syncing = launch { repository.sync() }
    runCurrent()
    val clearing = launch { repository.clear() }
    runCurrent()
    gate.complete(Unit)
    syncing.join()
    clearing.join()

    assertTrue(local.rows.value.isEmpty())
    assertTrue(remote.rows.isEmpty())
    assertFalse(flags.clearPending)
  }

  @Test
  fun `without supabase the history stays local`() = runTest {
    val offline = HistoryRepository(local, remote = null, flags = flags, newId = { "solo" })

    offline.record(summary, SessionConfig())

    assertEquals(SyncState.Disabled, offline.sync())
    assertEquals(SyncState.Disabled, offline.syncState.first())
    assertFalse(local.rows.value.getValue("solo").isSynced)
  }

  @Test
  fun `row mapping round-trips through the supabase shape`() {
    val entry = HistoryEntry("id-1", 1_760_000_000_000L, WorkoutMode.CUSTOM, true, summary, isSynced = false)
    val row = entry.toRow()

    assertEquals("2025-10-09T08:53:20Z", row.finishedAt)
    assertEquals(mapOf("S" to 95, "H" to 95, "D" to 95, "C" to 95), row.suitReps)
    assertEquals(entry.copy(isSynced = true), row.copy(finishedAt = "2025-10-09T08:53:20+00:00").toEntry())
  }
}
