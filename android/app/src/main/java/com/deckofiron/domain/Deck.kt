package com.deckofiron.domain

import kotlin.random.Random

object Deck {
  /** Jokers only go to positions 27–42 (0-based indices 26..41). */
  val JOKER_WINDOW = 26..41

  /** With two jokers at least 7 regular cards separate them, i.e. index distance ≥ 8. */
  const val MIN_JOKER_DISTANCE = 8

  fun baseDeck(aceValue: Int): List<Card.Playing> =
    Suit.entries.flatMap { suit -> Rank.entries.map { rank -> Card.Playing(suit, rank, rank.reps(aceValue)) } }

  /**
   * Shuffles the 52 cards, inserts [jokerCount] jokers inside [JOKER_WINDOW] and balances the order
   * with [Safety]. With one joker its colour is random; with two there is one of each colour.
   */
  fun create(
    aceValue: Int,
    jokerCount: Int,
    kettlebellMode: Boolean,
    jokerRules: Map<JokerColor, Suit?> = Safety.DEFAULT_JOKER_RULES,
    random: Random = Random.Default,
  ): List<Card> {
    require(jokerCount in 0..2) { "jokerCount must be 0, 1 or 2, was $jokerCount" }
    val deck = Safety.balance(baseDeck(aceValue).shuffled(random), kettlebellMode, jokerRules, random).toMutableList()

    when (jokerCount) {
      1 -> insertOne(deck, jokerRules, random)
      2 -> insertTwo(deck, jokerRules, random)
    }
    return if (jokerCount == 0) deck else Safety.balance(deck, kettlebellMode, jokerRules, random)
  }

  private fun insertOne(deck: MutableList<Card>, rules: Map<JokerColor, Suit?>, random: Random) {
    val color = if (random.nextBoolean()) JokerColor.RED else JokerColor.BLACK
    val valid = JOKER_WINDOW.filter { allowedAt(deck, it, rules[color]) }
    val index = if (valid.isNotEmpty()) valid.random(random) else JOKER_WINDOW.random(random)
    deck.add(index, Card.Joker(color))
  }

  private fun insertTwo(deck: MutableList<Card>, rules: Map<JokerColor, Suit?>, random: Random) {
    val (first, second) = if (random.nextBoolean()) {
      JokerColor.RED to JokerColor.BLACK
    } else {
      JokerColor.BLACK to JokerColor.RED
    }
    val firstRange = JOKER_WINDOW.first..(JOKER_WINDOW.last - MIN_JOKER_DISTANCE)
    val pairs = firstRange.flatMap { p1 ->
      ((p1 + MIN_JOKER_DISTANCE)..JOKER_WINDOW.last).map { p2 -> p1 to p2 }
    }
    val valid = pairs.filter { (p1, p2) -> allowedAt(deck, p1, rules[first]) && allowedAt(deck, p2, rules[second]) }
    val (pos1, pos2) = if (valid.isNotEmpty()) valid.random(random) else pairs.random(random)

    deck.add(pos1, Card.Joker(first))
    // The list grew by one, so the second slot shifts right.
    deck.add(pos2 + 1, Card.Joker(second))
  }

  private fun allowedAt(deck: List<Card>, index: Int, forbidden: Suit?): Boolean {
    val prev = deck.getOrNull(index - 1)
    return forbidden == null || !(prev is Card.Playing && prev.suit == forbidden)
  }
}
