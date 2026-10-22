package com.deckofiron.ui

import android.os.SystemClock
import android.util.Log
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.deckofiron.AppContainer
import com.deckofiron.data.WorkoutCatalog
import com.deckofiron.data.history.SyncState
import com.deckofiron.domain.Card
import com.deckofiron.domain.JokerColor
import com.deckofiron.domain.JokerTask
import com.deckofiron.domain.Preset
import com.deckofiron.domain.SessionConfig
import com.deckofiron.domain.Suit
import com.deckofiron.domain.SuitLoad
import com.deckofiron.domain.WorkoutMode
import com.deckofiron.domain.WorkoutSession
import com.deckofiron.domain.WorkoutSummary
import com.deckofiron.domain.holdSeconds
import com.deckofiron.domain.resolved
import com.deckofiron.platform.Haptic
import com.deckofiron.platform.Sound
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.CompletableDeferred
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import kotlin.math.ceil
import kotlin.random.Random

enum class Screen { SETUP, WORKOUT, SUMMARY, HISTORY }

data class Countdown(val totalSeconds: Int, val remainingSeconds: Int, val running: Boolean) {
  val isFinished: Boolean get() = remainingSeconds <= 0
  val progress: Float get() = if (totalSeconds == 0) 1f else 1f - remainingSeconds.toFloat() / totalSeconds
}

sealed interface WorkoutOverlay {
  data class Rest(val countdown: Countdown) : WorkoutOverlay

  /** [hold] is set for timed tasks (plank, wall sit). */
  data class Joker(val color: JokerColor, val task: JokerTask, val hold: Countdown?) : WorkoutOverlay
}

/** Where the finished workout ended up; tracked per workout, not from the shared sync state. */
enum class SaveStatus { SAVING, SAVED_LOCAL, SAVED_CLOUD, UPLOAD_PENDING, FAILED }

data class FinishedWorkout(
  val summary: WorkoutSummary,
  val config: SessionConfig,
  val isComplete: Boolean,
  val save: SaveStatus = SaveStatus.SAVING,
)

data class AppUiState(
  val isLoaded: Boolean = false,
  val screen: Screen = Screen.SETUP,
  val config: SessionConfig = SessionConfig(),
  val session: WorkoutSession? = null,
  val overlay: WorkoutOverlay? = null,
  /** Shown above the current overlay, which is paused (not dropped) while the dialog is open. */
  val showQuitConfirm: Boolean = false,
  val finished: FinishedWorkout? = null,
  val soundEnabled: Boolean = true,
)

/** App flow: setup → workout (rest / joker overlays) → summary, plus the history screen. */
class AppViewModel(private val container: AppContainer) : ViewModel() {
  val catalog: WorkoutCatalog get() = container.catalog

  private val _state = MutableStateFlow(AppUiState())
  val state: StateFlow<AppUiState> = _state.asStateFlow()

  private var elapsedJob: Job? = null
  private var countdownJob: Job? = null
  private var persistJob: Job? = null
  private var resumeRestAfterQuit = false

  init {
    viewModelScope.launch {
      val config = container.preferences.loadConfig() ?: SessionConfig()
      val saved = container.preferences.loadActiveSession()?.takeUnless { it.isFinished || it.deck.isEmpty() }
      _state.update {
        it.copy(
          isLoaded = true,
          config = saved?.config ?: config,
          session = saved,
          screen = if (saved != null) Screen.WORKOUT else Screen.SETUP,
        )
      }
      if (saved != null) startElapsedTimer()
    }
    viewModelScope.launch {
      container.preferences.soundEnabled.collect { enabled ->
        container.sound.enabled = enabled
        _state.update { it.copy(soundEnabled = enabled) }
      }
    }
  }

  // region Setup

  fun selectMode(mode: WorkoutMode) = updateConfig { it.withMode(mode, catalog.exercises) }

  fun applyPreset(preset: Preset) = updateConfig { it.withPreset(preset) }

  fun setLoad(suit: Suit, load: SuitLoad) = updateConfig { it.withLoad(suit, load) }

  fun setBeast(beast: Boolean) = updateConfig { it.copy(beast = beast) }

  fun setAceValue(value: Int) = updateConfig { it.copy(aceValue = value) }

  fun setJokerCount(count: Int) = updateConfig { it.copy(jokerCount = count) }

  fun setRest(seconds: Int?) = updateConfig { it.copy(restSeconds = seconds) }

  fun setJokerTask(color: JokerColor, task: JokerTask) = updateConfig { it.copy(jokers = it.jokers.with(color, task)) }

  fun toggleSound() {
    viewModelScope.launch { container.preferences.setSoundEnabled(!_state.value.soundEnabled) }
  }

  fun openHistory() = _state.update { it.copy(screen = Screen.HISTORY) }

  fun closeHistory() = _state.update { it.copy(screen = if (it.finished != null) Screen.SUMMARY else Screen.SETUP) }

  private fun updateConfig(transform: (SessionConfig) -> SessionConfig) {
    val updated = transform(_state.value.config)
    _state.update { it.copy(config = updated) }
    persist { container.preferences.saveConfig(updated) }
  }

  // endregion

  // region Workout

  fun startWorkout() {
    val session = WorkoutSession.start(_state.value.config, nowEpochMs = System.currentTimeMillis())
    cancelCountdown()
    _state.update { it.copy(screen = Screen.WORKOUT, session = session, overlay = null, showQuitConfirm = false, finished = null) }
    feedback(Sound.CARD, Haptic.CARD)
    persistSession()
    startElapsedTimer()
  }

  /** "Done" on the current card: open the joker, start the rest timer or go straight to the next card. */
  fun onDone() {
    val state = _state.value
    val session = state.session ?: return
    if (state.overlay != null || state.showQuitConfirm) return
    when (val card = session.currentCard ?: return) {
      is Card.Joker -> {
        val task = session.jokerTask(card)
        _state.update { it.copy(overlay = WorkoutOverlay.Joker(card.color, task, holdFor(task))) }
      }
      is Card.Playing -> {
        val rest = state.config.restSeconds
        if (rest != null && rest > 0) startRest(rest) else advance()
      }
    }
  }

  fun toggleRestPause() {
    val rest = _state.value.overlay as? WorkoutOverlay.Rest ?: return
    if (rest.countdown.running) {
      cancelCountdown()
      _state.update { it.copy(overlay = rest.copy(countdown = rest.countdown.copy(running = false))) }
    } else {
      runRestCountdown(rest.countdown)
    }
  }

  fun skipRest() {
    if (_state.value.overlay !is WorkoutOverlay.Rest) return
    cancelCountdown()
    _state.update { it.copy(overlay = null) }
    advance()
  }

  fun toggleJokerHold() {
    val joker = _state.value.overlay as? WorkoutOverlay.Joker ?: return
    val hold = joker.hold ?: return
    if (hold.isFinished) return
    if (hold.running) {
      cancelCountdown()
      _state.update { it.copy(overlay = joker.copy(hold = hold.copy(running = false))) }
    } else {
      runCountdown(
        from = hold,
        onUpdate = { next -> _state.update { s -> (s.overlay as? WorkoutOverlay.Joker)?.let { s.copy(overlay = it.copy(hold = next)) } ?: s } },
        onFinish = {},
      )
    }
  }

  /**
   * Replace the assigned task on the joker screen; the assignment in settings stays as it was.
   * A "random suit" pick is drawn right away so the player sees which exercise to do.
   */
  fun swapJokerTask(task: JokerTask) {
    val joker = _state.value.overlay as? WorkoutOverlay.Joker ?: return
    cancelCountdown()
    val resolved = task.resolved(Random.Default)
    _state.update { it.copy(overlay = joker.copy(task = resolved, hold = holdFor(resolved))) }
  }

  fun completeJoker(early: Boolean = false) {
    val joker = _state.value.overlay as? WorkoutOverlay.Joker ?: return
    cancelCountdown()
    if (early) feedback(Sound.GONG, Haptic.GONG)
    _state.update { it.copy(overlay = null) }
    advance(joker.task)
  }

  /** Opens the quit dialog and pauses a running rest or joker timer underneath it. */
  fun requestQuit() {
    val state = _state.value
    if (state.screen != Screen.WORKOUT || state.showQuitConfirm) return
    cancelCountdown()
    val paused = when (val overlay = state.overlay) {
      is WorkoutOverlay.Rest -> overlay.copy(countdown = overlay.countdown.copy(running = false))
      is WorkoutOverlay.Joker -> overlay.copy(hold = overlay.hold?.copy(running = false))
      null -> null
    }
    resumeRestAfterQuit = (state.overlay as? WorkoutOverlay.Rest)?.countdown?.running == true
    _state.update { it.copy(overlay = paused, showQuitConfirm = true) }
  }

  /** "Keep going": an interrupted rest continues by itself; a joker hold waits for its Start button. */
  fun dismissQuit() {
    if (!_state.value.showQuitConfirm) return
    _state.update { it.copy(showQuitConfirm = false) }
    val rest = _state.value.overlay as? WorkoutOverlay.Rest
    if (resumeRestAfterQuit && rest != null) runRestCountdown(rest.countdown)
    resumeRestAfterQuit = false
  }

  /** Stopping early still records the cards done so far; an untouched deck is simply discarded. */
  fun confirmQuit() {
    val session = _state.value.session ?: return
    if (session.currentIndex > 0) {
      finishWorkout(session, isComplete = false)
    } else {
      elapsedJob?.cancel()
      cancelCountdown()
      persist { container.preferences.clearActiveSession() }
      _state.update { it.copy(screen = Screen.SETUP, session = null, overlay = null, showQuitConfirm = false) }
    }
  }

  fun goHome() = _state.update { it.copy(screen = Screen.SETUP, finished = null) }

  private fun advance(jokerTask: JokerTask? = null) {
    val session = _state.value.session ?: return
    val next = session.completeCurrent(jokerTask)
    if (next.isFinished) {
      finishWorkout(next, isComplete = true)
      return
    }
    _state.update { it.copy(session = next) }
    feedback(Sound.CARD, Haptic.CARD)
    persistSession()
  }

  /**
   * Records the workout before the saved session is cleared, in the same write chain: if the
   * process dies in between, the session is still there to resume instead of being lost.
   */
  private fun finishWorkout(session: WorkoutSession, isComplete: Boolean) {
    elapsedJob?.cancel()
    cancelCountdown()
    val summary = session.summary()
    if (isComplete) feedback(Sound.GONG, Haptic.GONG)
    _state.update {
      it.copy(
        screen = Screen.SUMMARY,
        session = null,
        overlay = null,
        showQuitConfirm = false,
        finished = FinishedWorkout(summary, session.config, isComplete),
      )
    }

    val recorded = CompletableDeferred<Boolean>()
    persist {
      val ok = try {
        container.history.record(summary, session.config)
        true
      } catch (e: CancellationException) {
        throw e
      } catch (e: Exception) {
        Log.e(TAG, "Saving the workout failed", e)
        false
      }
      if (ok) container.preferences.clearActiveSession()
      recorded.complete(ok)
    }
    container.appScope.launch {
      val status = if (!recorded.await()) {
        SaveStatus.FAILED
      } else {
        when (container.history.sync()) {
          SyncState.Disabled -> SaveStatus.SAVED_LOCAL
          is SyncState.Synced -> SaveStatus.SAVED_CLOUD
          else -> SaveStatus.UPLOAD_PENDING
        }
      }
      _state.update { s ->
        val finished = s.finished?.takeIf { it.summary === summary } ?: return@update s
        s.copy(finished = finished.copy(save = status))
      }
    }
  }

  private fun startRest(seconds: Int) = runRestCountdown(Countdown(seconds, seconds, running = true))

  private fun runRestCountdown(from: Countdown) = runCountdown(
    from = from,
    onUpdate = { next -> _state.update { it.copy(overlay = WorkoutOverlay.Rest(next)) } },
    onFinish = {
      _state.update { it.copy(overlay = null) }
      advance()
    },
  )

  /** Wall-clock countdown with beeps on 3-2-1 and a gong at zero, as in the web version. */
  private fun runCountdown(from: Countdown, onUpdate: (Countdown) -> Unit, onFinish: () -> Unit) {
    cancelCountdown()
    val endAt = SystemClock.elapsedRealtime() + from.remainingSeconds * 1000L
    val beeped = mutableSetOf<Int>()
    countdownJob = viewModelScope.launch {
      while (true) {
        val left = ceil((endAt - SystemClock.elapsedRealtime()) / 1000.0).toInt().coerceAtLeast(0)
        onUpdate(from.copy(remainingSeconds = left, running = left > 0))
        if (left in 1..BEEP_FROM_SECONDS && beeped.add(left)) {
          feedback(if (left == 1) Sound.COUNTDOWN_FINAL else Sound.COUNTDOWN, Haptic.COUNTDOWN)
        }
        if (left == 0) {
          feedback(Sound.GONG, Haptic.GONG)
          onFinish()
          break
        }
        delay(TICK_MS)
      }
    }
  }

  private fun cancelCountdown() {
    countdownJob?.cancel()
    countdownJob = null
  }

  private fun holdFor(task: JokerTask): Countdown? = task.holdSeconds()?.let { Countdown(it, it, running = false) }

  /** Elapsed time follows the real-time clock, so time with the screen off or the app paused still counts. */
  private fun startElapsedTimer() {
    elapsedJob?.cancel()
    val base = _state.value.session?.elapsedSeconds ?: return
    val startedAt = SystemClock.elapsedRealtime()
    elapsedJob = viewModelScope.launch {
      var lastPersisted = base
      while (true) {
        delay(ELAPSED_TICK_MS)
        if (_state.value.session == null) break
        val elapsed = base + ((SystemClock.elapsedRealtime() - startedAt) / 1000).toInt()
        _state.update { s -> s.copy(session = s.session?.copy(elapsedSeconds = elapsed)) }
        if (elapsed - lastPersisted >= PERSIST_EVERY_SECONDS) {
          persistSession()
          lastPersisted = elapsed
        }
      }
    }
  }

  private fun persistSession() {
    val session = _state.value.session ?: return
    persist { container.preferences.saveActiveSession(session) }
  }

  /** Runs writes one after another on the app scope, so a late save can never resurrect a cleared session. */
  private fun persist(write: suspend () -> Unit) {
    val previous = persistJob
    persistJob = container.appScope.launch {
      previous?.join()
      write()
    }
  }

  private fun feedback(sound: Sound, haptic: Haptic) {
    container.sound.play(sound)
    container.haptics.play(haptic)
  }

  // endregion

  override fun onCleared() {
    persistSession()
    super.onCleared()
  }

  private companion object {
    const val TAG = "AppViewModel"
    const val TICK_MS = 100L
    const val ELAPSED_TICK_MS = 250L
    const val BEEP_FROM_SECONDS = 3
    const val PERSIST_EVERY_SECONDS = 5
  }
}
