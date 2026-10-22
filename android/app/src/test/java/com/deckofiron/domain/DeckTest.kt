package com.deckofiron.domain

import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test
import kotlin.random.Random

/** Port of the deck checks from src/engine/engine.test.ts (tests 1, 2 and 9). */
class DeckTest {

  @Test
  fun `clean deck has 52 unique cards and 380 reps with ace 11`() {
    val deck = Deck.baseDeck(aceValue = 11)

    assertEquals(52, deck.size)
    assertEquals(52, deck.map { it.id }.toSet().size)
    assertEquals(380, deck.sumOf { it.reps })
    assertEquals(380, Scoring.cleanDeckReps(11))
    assertEquals(340, Scoring.cleanDeckReps(1))
  }

  @Test
  fun `two jokers stay in the window with at least 7 cards between them`() {
    repeat(50) { seed ->
      val deck = Deck.create(aceValue = 11, jokerCount = 2, kettlebellMode = false, random = Random(seed))
      val jokerIndices = deck.indices.filter { deck[it] is Card.Joker }

      assertEquals(54, deck.size)
      assertEquals(2, jokerIndices.size)
      val (j1, j2) = jokerIndices
      assertTrue("joker at $j1 is before index 26", j1 >= Deck.JOKER_WINDOW.first)
      assertTrue("gap ${j2 - j1 - 1} < 7", j2 - j1 - 1 >= 7)
      assertEquals(
        setOf(JokerColor.RED, JokerColor.BLACK),
        jokerIndices.map { (deck[it] as Card.Joker).color }.toSet(),
      )
    }
  }

  @Test
  fun `single joker lands in positions 27 to 42`() {
    repeat(50) { seed ->
      val deck = Deck.create(aceValue = 11, jokerCount = 1, kettlebellMode = false, random = Random(seed))
      val index = deck.indexOfFirst { it is Card.Joker }

      assertEquals(53, deck.size)
      assertTrue("joker at $index", index in 26..42)
    }
  }

  @Test
  fun `dealt decks satisfy every safety rule in both modes`() {
    repeat(100) { seed ->
      val kettlebell = seed % 2 == 0
      val jokerCount = seed % 3
      val deck = Deck.create(aceValue = 11, jokerCount = jokerCount, kettlebellMode = kettlebell, random = Random(seed))

      assertEquals(52 + jokerCount, deck.size)
      assertEquals("seed $seed", 0, Safety.countViolations(deck, kettlebell))
      assertNoTripleOrHeavyPair(deck)
    }
  }

  private fun assertNoTripleOrHeavyPair(deck: List<Card>) {
    deck.forEachIndexed { i, card ->
      val prev = deck.getOrNull(i - 1)
      if (card is Card.Playing && prev is Card.Playing && prev.suit == card.suit) {
        assertTrue("heavy pair at $i", card.reps < 10 && prev.reps < 10)
        val prev2 = deck.getOrNull(i - 2)
        assertTrue("triple at $i", !(prev2 is Card.Playing && prev2.suit == card.suit))
      }
    }
  }
}
