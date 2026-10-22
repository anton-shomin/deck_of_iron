package com.deckofiron

import android.content.Context
import android.util.Log
import com.deckofiron.data.PreferencesStore
import com.deckofiron.data.WorkoutCatalog
import com.deckofiron.data.history.AppDatabase
import com.deckofiron.data.history.HistoryRepository
import com.deckofiron.data.history.RoomLocalHistory
import com.deckofiron.data.history.SupabaseRemoteHistory
import com.deckofiron.platform.Haptics
import com.deckofiron.platform.SoundPlayer
import kotlinx.coroutines.CoroutineExceptionHandler
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob

/** Manual dependency graph, created once per process in [DeckOfIronApp]. */
class AppContainer(context: Context) {
  /**
   * Outlives screens so a history upload started on the summary screen is never cancelled.
   * Background writes must never take the app down, so failures are logged here.
   */
  val appScope = CoroutineScope(
    SupervisorJob() + Dispatchers.Default + CoroutineExceptionHandler { _, e -> Log.e("AppScope", "Background task failed", e) },
  )

  val catalog: WorkoutCatalog by lazy { WorkoutCatalog.load(context.assets) }
  val preferences = PreferencesStore(context)
  val sound = SoundPlayer()
  val haptics = Haptics(context)

  private val database by lazy { AppDatabase.create(context) }

  val history: HistoryRepository by lazy {
    val remote = if (BuildConfig.SUPABASE_URL.isNotBlank() && BuildConfig.SUPABASE_ANON_KEY.isNotBlank()) {
      SupabaseRemoteHistory(BuildConfig.SUPABASE_URL, BuildConfig.SUPABASE_ANON_KEY)
    } else {
      null
    }
    HistoryRepository(RoomLocalHistory(database.workoutHistoryDao()), remote, preferences)
  }
}
