package com.deckofiron.data.history

import io.github.jan.supabase.SupabaseClient
import io.github.jan.supabase.auth.Auth
import io.github.jan.supabase.auth.auth
import io.github.jan.supabase.createSupabaseClient
import io.github.jan.supabase.postgrest.Postgrest
import io.github.jan.supabase.postgrest.from
import io.github.jan.supabase.postgrest.query.Order

/**
 * Supabase-backed history. Users are signed in anonymously on first use, and row level security
 * on `workout_history` limits every request to the signed-in user's rows.
 */
class SupabaseRemoteHistory(url: String, anonKey: String) : RemoteHistory {
  private val client: SupabaseClient = createSupabaseClient(supabaseUrl = url, supabaseKey = anonKey) {
    install(Auth)
    install(Postgrest)
  }

  override suspend fun upsert(entries: List<HistoryEntry>) {
    if (entries.isEmpty()) return
    ensureSignedIn()
    client.from(TABLE).upsert(entries.map { it.toRow() }) {
      onConflict = "id"
      // Columns missing from the payload (user_id, created_at) keep their database defaults.
      defaultToNull = false
    }
  }

  override suspend fun fetchAll(): List<HistoryEntry> {
    ensureSignedIn()
    return client.from(TABLE)
      .select {
        order("finished_at", Order.DESCENDING)
        limit(FETCH_LIMIT)
      }
      .decodeList<WorkoutHistoryRow>()
      .map { it.toEntry() }
  }

  override suspend fun deleteAll() {
    val userId = ensureSignedIn()
    client.from(TABLE).delete {
      filter { eq("user_id", userId) }
    }
  }

  /** Waits for the stored session to load and signs in anonymously when there is none. */
  private suspend fun ensureSignedIn(): String {
    val auth = client.auth
    auth.awaitInitialization()
    if (auth.currentSessionOrNull() == null) auth.signInAnonymously()
    return checkNotNull(auth.currentUserOrNull()?.id) { "Supabase sign-in returned no user" }
  }

  private companion object {
    const val TABLE = "workout_history"
    const val FETCH_LIMIT = 1000L
  }
}
