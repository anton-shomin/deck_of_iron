package com.deckofiron.domain

import kotlinx.serialization.Serializable

@Serializable
data class SessionConfig(
  val mode: WorkoutMode = WorkoutMode.BODY,
  val beast: Boolean = false,
  val jokerCount: Int = 1,
  val aceValue: Int = 11,
  /** `null` = manual: the next card is shown right after "Done". */
  val restSeconds: Int? = 5,
  val loads: Map<Suit, SuitLoad> = DEFAULT_LOADS,
  val jokers: JokerSettings = JokerSettings(),
) {
  val isKettlebellMode: Boolean get() = mode == WorkoutMode.KETTLEBELL

  fun withPreset(preset: Preset): SessionConfig = copy(mode = preset.mode, loads = preset.loads)

  fun withLoad(suit: Suit, load: SuitLoad): SessionConfig = copy(loads = loads + (suit to load))

  /**
   * Switches the mode and swaps every suit's exercise to one the new mode allows
   * (bodyweight for BODY, kettlebell for KETTLEBELL; CUSTOM keeps the current picks).
   */
  fun withMode(newMode: WorkoutMode, catalog: List<Exercise>): SessionConfig {
    val loadsForMode = Suit.entries.associateWith { suit ->
      val current = loads[suit]
      val currentExercise = catalog.firstOrNull { it.id == current?.exerciseId }
      if (current != null && currentExercise != null && allowedIn(newMode, currentExercise)) {
        current
      } else {
        val replacement = catalog.first { it.suit == suit && allowedIn(newMode, it) }
        val isKettlebell = replacement.equipment == Equipment.KETTLEBELL
        SuitLoad(replacement.id, kg = if (isKettlebell) DEFAULT_KB_KG else 0, count = 1)
      }
    }
    return copy(mode = newMode, loads = loadsForMode)
  }

  companion object {
    const val DEFAULT_KB_KG = 16
    val ACE_VALUES = listOf(1, 11)
    val JOKER_COUNTS = listOf(0, 1, 2)
    val REST_OPTIONS: List<Int?> = listOf(null, 5, 10, 15)
    val KETTLEBELL_WEIGHTS = listOf(8, 12, 16, 20, 24, 28, 32)

    val DEFAULT_LOADS: Map<Suit, SuitLoad> = mapOf(
      Suit.S to SuitLoad("body_tyson_pushups", 0, 1),
      Suit.H to SuitLoad("body_bronson_squats", 0, 1),
      Suit.D to SuitLoad("body_wrestler_bridge", 0, 1),
      Suit.C to SuitLoad("body_v_ups", 0, 1),
    )

    fun allowedIn(mode: WorkoutMode, exercise: Exercise): Boolean = when (mode) {
      WorkoutMode.BODY -> exercise.equipment == Equipment.BODY
      WorkoutMode.KETTLEBELL -> exercise.equipment == Equipment.KETTLEBELL
      WorkoutMode.CUSTOM -> true
    }
  }
}
