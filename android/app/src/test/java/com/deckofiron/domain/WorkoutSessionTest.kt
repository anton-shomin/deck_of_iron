package com.deckofiron.domain

import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test
import kotlin.random.Random

class WorkoutSessionTest {

  private val kettlebellConfig = SessionConfig(
    mode = WorkoutMode.KETTLEBELL,
    jokerCount = 0,
    loads = mapOf(
      Suit.S to SuitLoad("kb_overhead_press", 16, 2),
      Suit.H to SuitLoad("kb_goblet_squat", 24, 1),
      Suit.D to SuitLoad("kb_deadlift", 32, 1),
      Suit.C to SuitLoad("kb_weighted_crunch", 16, 1),
    ),
  )

  @Test
  fun `card tonnage multiplies weight, reps and bell count`() {
    val king = Card.Playing(Suit.S, Rank.KING, 10)

    assertEquals(320, Scoring.cardTonnageKg(king, kettlebellConfig))
    assertEquals(0, Scoring.cardTonnageKg(king, kettlebellConfig.copy(mode = WorkoutMode.BODY)))
  }

  @Test
  fun `completing the whole deck adds up to the clean deck totals`() {
    var session = WorkoutSession.start(kettlebellConfig, nowEpochMs = 0, random = Random(5))
    while (!session.isFinished) session = session.completeCurrent()
    val summary = session.summary()

    assertEquals(380, summary.totalReps)
    assertEquals(Scoring.deckTonnageKg(kettlebellConfig), summary.totalTonnageKg)
    assertEquals(52, summary.completedCards)
    assertTrue(Suit.entries.all { summary.suitReps[it] == 95 })
  }

  @Test
  fun `joker adds the performed task stats`() {
    val config = SessionConfig(jokers = JokerSettings(red = JokerTask.Thrusters(reps = 30, bellCount = 1, bellKg = 24)))
    val session = WorkoutSession(config = config, deck = listOf(Card.Joker(JokerColor.RED)), startedAtEpochMs = 0)

    val assigned = session.completeCurrent()
    assertEquals(30, assigned.totalReps)
    assertEquals(720, assigned.totalTonnageKg)
    assertEquals(1, assigned.jokersCompleted)

    val swapped = session.completeCurrent(JokerTask.SuitReps(Suit.C))
    assertEquals(15, swapped.totalReps)
    assertEquals(15, swapped.suitReps[Suit.C])
  }

  @Test
  fun `partial workout summary counts only completed cards`() {
    var session = WorkoutSession.start(SessionConfig(jokerCount = 2), nowEpochMs = 0, random = Random(2)).tick(90)
    repeat(3) { session = session.completeCurrent() }
    val summary = session.summary()

    assertEquals(3, summary.completedCards)
    assertEquals(54, summary.totalCards)
    assertEquals(90, summary.durationSeconds)
  }
}
