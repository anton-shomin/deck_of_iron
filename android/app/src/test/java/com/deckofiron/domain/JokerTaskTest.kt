package com.deckofiron.domain

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test
import kotlin.random.Random

/** The joker defect fix: every task on either colour, in every mode, with its own placement rule. */
class JokerTaskTest {

  private val allTasks = listOf(
    JokerTask.Plank(120),
    JokerTask.WallSit(300),
    JokerTask.Burpees(50),
    JokerTask.Thrusters(reps = 20, bellCount = 2, bellKg = 32),
    JokerTask.SuitReps(Suit.D),
  )

  @Test
  fun `any task can be assigned to either joker`() {
    for (task in allTasks) {
      for (color in JokerColor.entries) {
        assertEquals(task, JokerSettings().with(color, task).taskFor(color))
      }
    }
  }

  @Test
  fun `thrusters count tonnage even in bodyweight mode`() {
    val task = JokerTask.Thrusters(reps = 20, bellCount = 2, bellKg = 32)

    for (mode in WorkoutMode.entries) {
      assertEquals(1280, task.tonnageKg(SessionConfig(mode = mode)))
    }
    assertEquals(20, task.reps())
  }

  @Test
  fun `suit reps use the suit load only in kettlebell mode`() {
    val loads = SessionConfig.DEFAULT_LOADS + (Suit.D to SuitLoad("kb_swings", 24, 2))
    val task = JokerTask.SuitReps(Suit.D)

    assertEquals(15 * 24 * 2, task.tonnageKg(SessionConfig(mode = WorkoutMode.KETTLEBELL, loads = loads)))
    assertEquals(0, task.tonnageKg(SessionConfig(mode = WorkoutMode.BODY, loads = loads)))
  }

  @Test
  fun `timed tasks report hold seconds and no reps`() {
    assertEquals(120, JokerTask.Plank(120).holdSeconds())
    assertEquals(300, JokerTask.WallSit(300).holdSeconds())
    assertEquals(0, JokerTask.WallSit(300).reps())
    assertNull(JokerTask.Burpees().holdSeconds())
  }

  @Test
  fun `placement rules come from the task`() {
    assertEquals(Suit.C, JokerTask.Plank().forbiddenPrecedingSuit())
    assertEquals(Suit.H, JokerTask.WallSit().forbiddenPrecedingSuit())
    assertEquals(Suit.S, JokerTask.SuitReps(Suit.S).forbiddenPrecedingSuit())
    assertNull(JokerTask.Burpees().forbiddenPrecedingSuit())
    assertNull(JokerTask.Thrusters().forbiddenPrecedingSuit())
  }

  @Test
  fun `random suit is fixed when settings are resolved`() {
    val resolved = JokerSettings(red = JokerTask.SuitReps(null), black = JokerTask.Plank()).resolved(Random(3))

    assertNotNull((resolved.red as JokerTask.SuitReps).suit)
    assertEquals(JokerTask.Plank(), resolved.black)
  }

  @Test
  fun `dealt deck respects swapped joker tasks`() {
    // Wall sit on the red joker and plank on the black one: the old colour rules would be wrong here.
    val settings = JokerSettings(red = JokerTask.WallSit(), black = JokerTask.Plank())
    repeat(60) { seed ->
      val config = SessionConfig(jokerCount = 2, jokers = settings, mode = if (seed % 2 == 0) WorkoutMode.KETTLEBELL else WorkoutMode.BODY)
      val session = WorkoutSession.start(config, nowEpochMs = 0, random = Random(seed))
      val deck = session.deck

      deck.forEachIndexed { i, card ->
        val prev = deck.getOrNull(i - 1) as? Card.Playing
        if (card is Card.Joker && prev != null) {
          val forbidden = session.config.jokers.taskFor(card.color).forbiddenPrecedingSuit()
          assertTrue("seed $seed: ${card.color} joker after ${prev.suit}", prev.suit != forbidden)
        }
      }
      assertEquals(0, Safety.countViolations(deck, config.isKettlebellMode, settings.forbiddenPrecedingSuits()))
    }
  }
}
