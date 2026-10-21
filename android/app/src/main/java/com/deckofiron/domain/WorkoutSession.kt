package com.deckofiron.domain

import kotlinx.serialization.Serializable
import kotlin.random.Random

/** Live workout state. Persisted after every card so a killed app resumes where it stopped. */
@Serializable
data class WorkoutSession(
  val config: SessionConfig,
  val deck: List<Card>,
  val startedAtEpochMs: Long,
  val currentIndex: Int = 0,
  val elapsedSeconds: Int = 0,
  val totalReps: Int = 0,
  val totalTonnageKg: Int = 0,
  val suitReps: Map<Suit, Int> = Suit.entries.associateWith { 0 },
  val jokersCompleted: Int = 0,
) {
  val currentCard: Card? get() = deck.getOrNull(currentIndex)
  val isFinished: Boolean get() = currentIndex >= deck.size
  val progress: Float get() = if (deck.isEmpty()) 0f else currentIndex.toFloat() / deck.size

  fun jokerTask(joker: Card.Joker): JokerTask = config.jokers.taskFor(joker.color)

  fun tick(seconds: Int = 1): WorkoutSession = copy(elapsedSeconds = elapsedSeconds + seconds)

  /**
   * Counts the current card and moves to the next one. For a joker, [jokerTask] is the task
   * actually performed (the player may swap the assigned task on the joker screen).
   */
  fun completeCurrent(jokerTask: JokerTask? = null): WorkoutSession {
    return when (val card = currentCard ?: return this) {
      is Card.Playing -> copy(
        currentIndex = currentIndex + 1,
        totalReps = totalReps + card.reps,
        totalTonnageKg = totalTonnageKg + Scoring.cardTonnageKg(card, config),
        suitReps = suitReps.plusReps(card.suit, card.reps),
      )
      is Card.Joker -> {
        val task = jokerTask ?: jokerTask(card)
        val reps = task.reps()
        val taskSuit = (task as? JokerTask.SuitReps)?.suit
        copy(
          currentIndex = currentIndex + 1,
          jokersCompleted = jokersCompleted + 1,
          totalReps = totalReps + reps,
          totalTonnageKg = totalTonnageKg + task.tonnageKg(config),
          suitReps = if (taskSuit != null) suitReps.plusReps(taskSuit, reps) else suitReps,
        )
      }
    }
  }

  fun summary(): WorkoutSummary = WorkoutSummary(
    durationSeconds = elapsedSeconds,
    completedCards = currentIndex.coerceAtMost(deck.size),
    totalCards = deck.size,
    totalReps = totalReps,
    suitReps = suitReps,
    totalTonnageKg = totalTonnageKg,
    jokersCompleted = jokersCompleted,
  )

  companion object {
    fun start(config: SessionConfig, nowEpochMs: Long, random: Random = Random.Default): WorkoutSession {
      val resolved = config.copy(jokers = config.jokers.resolved(random))
      val deck = Deck.create(
        aceValue = resolved.aceValue,
        jokerCount = resolved.jokerCount,
        kettlebellMode = resolved.isKettlebellMode,
        jokerRules = resolved.jokers.forbiddenPrecedingSuits(),
        random = random,
      )
      return WorkoutSession(config = resolved, deck = deck, startedAtEpochMs = nowEpochMs)
    }
  }
}

private fun Map<Suit, Int>.plusReps(suit: Suit, reps: Int): Map<Suit, Int> = this + (suit to (this[suit] ?: 0) + reps)
