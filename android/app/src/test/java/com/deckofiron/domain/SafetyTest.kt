package com.deckofiron.domain

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test
import kotlin.random.Random

class SafetyTest {

  private fun card(suit: Suit, rank: Rank) = Card.Playing(suit, rank, rank.reps(11))

  private fun exercise(id: String, sideRule: SideRule) = Exercise(
    id = id, suit = Suit.S, tier = 1, equipment = Equipment.BODY, sideRule = sideRule,
    nameRu = "", nameEn = "", musclesRu = "", musclesEn = "", cuesRu = emptyList(), cuesEn = emptyList(),
    commonMistakeRu = "", commonMistakeEn = "", youtubeQuery = "",
  )

  @Test
  fun `navy seal burpees count three push-ups per cycle`() {
    assertEquals(RepBreakdown.NavySealCycles(11, 33), repBreakdown(exercise("body_navy_seal_burpees", SideRule.NONE), 11))
  }

  @Test
  fun `split total gives the extra rep to the left side on odd totals`() {
    val pistol = exercise("body_pistol_squats", SideRule.SPLIT_TOTAL)

    assertEquals(RepBreakdown.Split(8, 4, 4), repBreakdown(pistol, 8))
    val odd = repBreakdown(pistol, 7) as RepBreakdown.Split
    assertEquals(4, odd.left)
    assertEquals(3, odd.right)
    assertTrue(odd.isUneven)
  }

  @Test
  fun `per side doubles the total`() {
    assertEquals(RepBreakdown.PerSide(7, 14), repBreakdown(exercise("body_reverse_lunge_knee", SideRule.PER_SIDE), 7))
  }

  @Test
  fun `no breakdown for regular two-sided exercises`() {
    assertNull(repBreakdown(exercise("body_pushups", SideRule.NONE), 10))
  }

  @Test
  fun `cluster tips only for 10 and 11 reps in kettlebell mode`() {
    assertEquals(ClusterTip(listOf(5, 5), 15), clusterTip(card(Suit.S, Rank.KING), kettlebellMode = true))
    assertEquals(ClusterTip(listOf(4, 4, 3), null), clusterTip(card(Suit.S, Rank.ACE), kettlebellMode = true))
    assertNull(clusterTip(card(Suit.S, Rank.FIVE), kettlebellMode = true))
    assertNull(clusterTip(card(Suit.S, Rank.KING), kettlebellMode = false))
  }

  @Test
  fun `adjacent heavy kettlebell cards are a violation and balancing fixes them`() {
    val deck = listOf(
      card(Suit.S, Rank.KING),
      card(Suit.H, Rank.ACE),
      card(Suit.D, Rank.FOUR),
      card(Suit.C, Rank.TEN),
    )

    assertEquals(15, Safety.countViolations(deck, kettlebellMode = true))
    assertEquals(0, Safety.countViolations(deck, kettlebellMode = false))
    val balanced = Safety.balance(deck, kettlebellMode = true, random = Random(1))
    assertEquals(0, Safety.countViolations(balanced, kettlebellMode = true))
    assertEquals(deck.toSet(), balanced.toSet())
  }

  @Test
  fun `joker rule follows the assigned task, not the colour`() {
    val afterSquat = listOf(card(Suit.H, Rank.TWO), Card.Joker(JokerColor.RED))
    val wallSitOnRed = JokerSettings(red = JokerTask.WallSit(), black = JokerTask.Burpees())

    assertEquals(0, Safety.countViolations(afterSquat, false, JokerSettings().forbiddenPrecedingSuits()))
    assertEquals(100, Safety.countViolations(afterSquat, false, wallSitOnRed.forbiddenPrecedingSuits()))
  }

  @Test
  fun `balancing never moves jokers`() {
    val deck = Deck.baseDeck(11).take(10) + Card.Joker(JokerColor.BLACK) + Deck.baseDeck(11).drop(10)
    val balanced = Safety.balance(deck, kettlebellMode = true, random = Random(7))

    assertEquals(Card.Joker(JokerColor.BLACK), balanced[10])
  }
}
