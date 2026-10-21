package com.deckofiron.domain

import org.junit.Assert.assertEquals
import org.junit.Test

class SessionConfigTest {

  private fun exercise(id: String, suit: Suit, equipment: Equipment) = Exercise(
    id = id, suit = suit, tier = 1, equipment = equipment, sideRule = SideRule.NONE,
    nameRu = id, nameEn = id, musclesRu = "", musclesEn = "", cuesRu = emptyList(), cuesEn = emptyList(),
    commonMistakeRu = "", commonMistakeEn = "", youtubeQuery = "",
  )

  private val catalog = Suit.entries.flatMap {
    listOf(
      exercise("body_${it.name}", it, Equipment.BODY),
      exercise("kb_${it.name}", it, Equipment.KETTLEBELL),
    )
  }

  private val bodyConfig = SessionConfig(loads = Suit.entries.associateWith { SuitLoad("body_${it.name}", 0, 1) })

  @Test
  fun `switching to kettlebells swaps in kettlebell exercises with a default weight`() {
    val kb = bodyConfig.withMode(WorkoutMode.KETTLEBELL, catalog)

    assertEquals(WorkoutMode.KETTLEBELL, kb.mode)
    Suit.entries.forEach {
      assertEquals(SuitLoad("kb_${it.name}", SessionConfig.DEFAULT_KB_KG, 1), kb.loads[it])
    }
  }

  @Test
  fun `custom mode keeps the current exercises`() {
    assertEquals(bodyConfig.loads, bodyConfig.withMode(WorkoutMode.CUSTOM, catalog).loads)
  }

  @Test
  fun `joker settings survive a mode switch`() {
    val withThrusters = bodyConfig.copy(jokers = JokerSettings(red = JokerTask.Thrusters()))

    assertEquals(withThrusters.jokers, withThrusters.withMode(WorkoutMode.KETTLEBELL, catalog).jokers)
  }
}
