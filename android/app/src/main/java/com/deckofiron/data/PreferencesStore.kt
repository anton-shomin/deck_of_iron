package com.deckofiron.data

import android.content.Context
import android.util.Log
import androidx.datastore.core.handlers.ReplaceFileCorruptionHandler
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.booleanPreferencesKey
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.emptyPreferences
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import com.deckofiron.data.history.SyncFlags
import com.deckofiron.domain.SessionConfig
import com.deckofiron.domain.WorkoutSession
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.catch
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.map
import java.io.IOException
import kotlinx.serialization.KSerializer
import kotlinx.serialization.SerializationException
import kotlinx.serialization.json.Json

private val Context.dataStore by preferencesDataStore(
  name = "deck_of_iron",
  // A corrupted file would otherwise throw on every launch; start over with defaults instead.
  corruptionHandler = ReplaceFileCorruptionHandler { emptyPreferences() },
)

/** Small app state: sound toggle, last deck setup, the in-progress workout and sync flags. */
class PreferencesStore(private val context: Context) : SyncFlags {
  private val json = Json { ignoreUnknownKeys = true }

  /** Disk read errors fall back to defaults rather than crashing the caller. */
  private val data: Flow<Preferences> = context.dataStore.data.catch { e ->
    if (e !is IOException) throw e
    Log.w(TAG, "Reading preferences failed, using defaults", e)
    emit(emptyPreferences())
  }

  val soundEnabled: Flow<Boolean> = data.map { it[SOUND] ?: true }

  suspend fun setSoundEnabled(enabled: Boolean) {
    context.dataStore.edit { it[SOUND] = enabled }
  }

  suspend fun loadConfig(): SessionConfig? = read(CONFIG, SessionConfig.serializer())

  suspend fun saveConfig(config: SessionConfig) = write(CONFIG, SessionConfig.serializer(), config)

  suspend fun loadActiveSession(): WorkoutSession? = read(ACTIVE_SESSION, WorkoutSession.serializer())

  suspend fun saveActiveSession(session: WorkoutSession) = write(ACTIVE_SESSION, WorkoutSession.serializer(), session)

  suspend fun clearActiveSession() {
    context.dataStore.edit { it.remove(ACTIVE_SESSION) }
  }

  override suspend fun isRemoteClearPending(): Boolean = data.first()[REMOTE_CLEAR_PENDING] ?: false

  override suspend fun setRemoteClearPending(pending: Boolean) {
    context.dataStore.edit { it[REMOTE_CLEAR_PENDING] = pending }
  }

  private suspend fun <T> read(key: Preferences.Key<String>, serializer: KSerializer<T>): T? {
    val raw = data.first()[key] ?: return null
    return try {
      json.decodeFromString(serializer, raw)
    } catch (e: SerializationException) {
      // Stored with an older schema: drop it instead of crashing on launch.
      Log.w(TAG, "Discarding unreadable ${key.name}", e)
      context.dataStore.edit { it.remove(key) }
      null
    } catch (e: IllegalArgumentException) {
      Log.w(TAG, "Discarding invalid ${key.name}", e)
      context.dataStore.edit { it.remove(key) }
      null
    }
  }

  private suspend fun <T> write(key: Preferences.Key<String>, serializer: KSerializer<T>, value: T) {
    context.dataStore.edit { it[key] = json.encodeToString(serializer, value) }
  }

  private companion object {
    const val TAG = "PreferencesStore"
    val SOUND = booleanPreferencesKey("sound_enabled")
    val CONFIG = stringPreferencesKey("session_config_v1")
    val ACTIVE_SESSION = stringPreferencesKey("active_session_v1")
    val REMOTE_CLEAR_PENDING = booleanPreferencesKey("remote_history_clear_pending")
  }
}
