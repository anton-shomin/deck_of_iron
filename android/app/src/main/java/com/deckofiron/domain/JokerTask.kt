package com.deckofiron.domain

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import kotlin.random.Random

/**
 * A joker challenge. Any task can be assigned to either joker colour in any workout mode:
 * the colour only says which slot of [JokerSettings] the task comes from.
 */
@Serializable
sealed interface JokerTask {
  val kind: JokerTaskKind

  /** Timed isometric forearm plank. */
  @Serializable
  @SerialName("plank")
  data class Plank(val seconds: Int = 60) : JokerTask {
    override val kind: JokerTaskKind get() = JokerTaskKind.PLANK
  }

  /** Timed isometric wall sit. */
  @Serializable
  @SerialName("wall_sit")
  data class WallSit(val seconds: Int = 120) : JokerTask {
    override val kind: JokerTaskKind get() = JokerTaskKind.WALL_SIT
  }

  @Serializable
  @SerialName("burpees")
  data class Burpees(val reps: Int = 30) : JokerTask {
    override val kind: JokerTaskKind get() = JokerTaskKind.BURPEES
  }

  @Serializable
  @SerialName("thrusters")
  data class Thrusters(val reps: Int = 30, val bellCount: Int = 1, val bellKg: Int = 24) : JokerTask {
    override val kind: JokerTaskKind get() = JokerTaskKind.THRUSTERS
  }

  /** 15 reps of the exercise assigned to [suit]; `null` = suit drawn at random when the deck is dealt. */
  @Serializable
  @SerialName("suit_reps")
  data class SuitReps(val suit: Suit? = null, val reps: Int = SUIT_REPS) : JokerTask {
    override val kind: JokerTaskKind get() = JokerTaskKind.SUIT_REPS
  }

  companion object {
    const val SUIT_REPS = 15
  }
}

enum class JokerTaskKind(val equipment: Equipment) {
  PLANK(Equipment.BODY),
  WALL_SIT(Equipment.BODY),
  BURPEES(Equipment.BODY),
  THRUSTERS(Equipment.KETTLEBELL),
  SUIT_REPS(Equipment.BODY);

  fun defaultTask(): JokerTask = when (this) {
    PLANK -> JokerTask.Plank()
    WALL_SIT -> JokerTask.WallSit()
    BURPEES -> JokerTask.Burpees()
    THRUSTERS -> JokerTask.Thrusters()
    SUIT_REPS -> JokerTask.SuitReps()
  }
}

object JokerOptions {
  val HOLD_SECONDS = listOf(60, 90, 120, 180, 300)
  val BURPEE_REPS = listOf(20, 30, 50)
  val THRUSTER_REPS = listOf(20, 30, 50, 70, 100)
  val BELL_COUNTS = listOf(1, 2)
}

@Serializable
data class JokerSettings(
  val red: JokerTask = JokerTask.Plank(seconds = 60),
  val black: JokerTask = JokerTask.Burpees(reps = 30),
) {
  fun taskFor(color: JokerColor): JokerTask = when (color) {
    JokerColor.RED -> red
    JokerColor.BLACK -> black
  }

  fun with(color: JokerColor, task: JokerTask): JokerSettings = when (color) {
    JokerColor.RED -> copy(red = task)
    JokerColor.BLACK -> copy(black = task)
  }

  /** Fixes "random suit" tasks to a concrete suit so the dealt deck can respect their placement rule. */
  fun resolved(random: Random): JokerSettings = copy(red = red.resolved(random), black = black.resolved(random))

  /** Suit that must not directly precede each joker (see [Safety]). */
  fun forbiddenPrecedingSuits(): Map<JokerColor, Suit?> = JokerColor.entries.associateWith {
    taskFor(it).forbiddenPrecedingSuit()
  }
}

fun JokerTask.resolved(random: Random): JokerTask =
  if (this is JokerTask.SuitReps && suit == null) copy(suit = Suit.entries.random(random)) else this

/**
 * Placement rule for a joker: a plank never directly after core work (♣),
 * a wall sit never directly after squats (♥), and "15 reps of suit X" never right after an X card.
 */
fun JokerTask.forbiddenPrecedingSuit(): Suit? = when (this) {
  is JokerTask.Plank -> Suit.C
  is JokerTask.WallSit -> Suit.H
  is JokerTask.SuitReps -> suit
  is JokerTask.Burpees, is JokerTask.Thrusters -> null
}

/** Hold time for timed tasks, `null` for rep-based ones. */
fun JokerTask.holdSeconds(): Int? = when (this) {
  is JokerTask.Plank -> seconds
  is JokerTask.WallSit -> seconds
  is JokerTask.Burpees, is JokerTask.Thrusters, is JokerTask.SuitReps -> null
}

fun JokerTask.reps(): Int = when (this) {
  is JokerTask.Plank, is JokerTask.WallSit -> 0
  is JokerTask.Burpees -> reps
  is JokerTask.Thrusters -> reps
  is JokerTask.SuitReps -> reps
}

/** Thrusters always count their kettlebells; suit reps follow the suit's load in kettlebell mode only. */
fun JokerTask.tonnageKg(config: SessionConfig): Int = when (this) {
  is JokerTask.Thrusters -> reps * bellKg * bellCount
  is JokerTask.SuitReps -> {
    val load = suit?.let { config.loads[it] }
    if (config.mode == WorkoutMode.KETTLEBELL && load != null) reps * load.kg * load.count else 0
  }
  is JokerTask.Plank, is JokerTask.WallSit, is JokerTask.Burpees -> 0
}
