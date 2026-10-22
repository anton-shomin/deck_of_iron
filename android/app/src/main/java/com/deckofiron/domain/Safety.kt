package com.deckofiron.domain

import kotlin.random.Random

/**
 * Card-order safety rules. Each rule adds a weighted penalty; [balance] swaps cards
 * until the penalty is zero (or the iteration budget runs out):
 * 1. never 3 cards of the same suit in a row (100);
 * 2. no 2 same-suit cards in a row when either has ≥10 reps (25);
 * 3. a joker never directly after its task's forbidden suit (100), see [forbiddenPrecedingSuit];
 * 4. kettlebell mode: at least one card with ≤6 reps between heavy ♠/♥/♦ cards with ≥10 reps (15).
 */
object Safety {
  private val HEAVY_SUITS = setOf(Suit.S, Suit.H, Suit.D)
  private const val HEAVY_REPS = 10
  private const val LOW_REPS = 6
  private const val MAX_SWAPS = 5000

  private const val PENALTY_TRIPLE = 100
  private const val PENALTY_HEAVY_PAIR = 25
  private const val PENALTY_JOKER = 100
  private const val PENALTY_HEAVY_GAP = 15

  /** Legacy colour rules: red = plank (not after ♣), black = wall sit (not after ♥). */
  val DEFAULT_JOKER_RULES: Map<JokerColor, Suit?> = mapOf(JokerColor.RED to Suit.C, JokerColor.BLACK to Suit.H)

  fun isHeavy(card: Card): Boolean =
    card is Card.Playing && card.suit in HEAVY_SUITS && card.reps >= HEAVY_REPS

  fun isLow(card: Card): Boolean = card is Card.Playing && card.reps <= LOW_REPS

  fun countViolations(
    deck: List<Card>,
    kettlebellMode: Boolean,
    jokerRules: Map<JokerColor, Suit?> = DEFAULT_JOKER_RULES,
  ): Int {
    var violations = 0
    var lastHeavySeen = false
    var lowSinceHeavy = false

    deck.forEachIndexed { i, card ->
      val prev = deck.getOrNull(i - 1)
      when (card) {
        is Card.Playing -> if (prev is Card.Playing && prev.suit == card.suit) {
          if (card.reps >= HEAVY_REPS || prev.reps >= HEAVY_REPS) violations += PENALTY_HEAVY_PAIR
          val prev2 = deck.getOrNull(i - 2)
          if (prev2 is Card.Playing && prev2.suit == card.suit) violations += PENALTY_TRIPLE
        }
        is Card.Joker -> {
          val forbidden = jokerRules[card.color]
          if (forbidden != null && prev is Card.Playing && prev.suit == forbidden) violations += PENALTY_JOKER
        }
      }

      if (kettlebellMode) {
        if (isLow(card)) lowSinceHeavy = true
        if (isHeavy(card)) {
          if (lastHeavySeen && !lowSinceHeavy) violations += PENALTY_HEAVY_GAP
          lastHeavySeen = true
          lowSinceHeavy = false
        }
      }
    }
    return violations
  }

  /** Random-swap search that never moves jokers and never accepts a worse order. */
  fun balance(
    cards: List<Card>,
    kettlebellMode: Boolean,
    jokerRules: Map<JokerColor, Suit?> = DEFAULT_JOKER_RULES,
    random: Random = Random.Default,
  ): List<Card> {
    val deck = cards.toMutableList()
    var current = countViolations(deck, kettlebellMode, jokerRules)
    if (current == 0 || deck.size < 2) return deck

    repeat(MAX_SWAPS) {
      val i = random.nextInt(deck.size)
      val j = random.nextInt(deck.size)
      if (i == j || deck[i] is Card.Joker || deck[j] is Card.Joker) return@repeat

      deck.swap(i, j)
      val next = countViolations(deck, kettlebellMode, jokerRules)
      if (next <= current) {
        current = next
        if (current == 0) return deck
      } else {
        deck.swap(i, j)
      }
    }
    return deck
  }

  private fun MutableList<Card>.swap(i: Int, j: Int) {
    val tmp = this[i]
    this[i] = this[j]
    this[j] = tmp
  }
}

/** Kettlebell cluster set suggestion: 10 = 5+5 with 15 s rest, 11 = 4+4+3. */
data class ClusterTip(val parts: List<Int>, val restSeconds: Int?)

fun clusterTip(card: Card, kettlebellMode: Boolean): ClusterTip? {
  if (!kettlebellMode || card !is Card.Playing) return null
  return when (card.reps) {
    10 -> ClusterTip(listOf(5, 5), restSeconds = 15)
    11 -> ClusterTip(listOf(4, 4, 3), restSeconds = null)
    else -> null
  }
}

/** How a card's reps are split for one-sided exercises. */
sealed interface RepBreakdown {
  /** SPLIT_TOTAL: the total is shared; on odd totals the weaker (left) side gets the extra rep. */
  data class Split(val total: Int, val left: Int, val right: Int) : RepBreakdown {
    val isUneven: Boolean get() = left != right
  }

  /** PER_SIDE: the card's reps are done on each side. */
  data class PerSide(val perSide: Int, val total: Int) : RepBreakdown

  /** Navy SEAL burpee: every cycle includes 3 push-ups. */
  data class NavySealCycles(val cycles: Int, val pushUps: Int) : RepBreakdown
}

private const val NAVY_SEAL_BURPEES_ID = "body_navy_seal_burpees"
private const val NAVY_SEAL_PUSHUPS_PER_CYCLE = 3

fun repBreakdown(exercise: Exercise, reps: Int): RepBreakdown? = when {
  exercise.id == NAVY_SEAL_BURPEES_ID -> RepBreakdown.NavySealCycles(reps, reps * NAVY_SEAL_PUSHUPS_PER_CYCLE)
  exercise.sideRule == SideRule.SPLIT_TOTAL -> RepBreakdown.Split(reps, left = (reps + 1) / 2, right = reps / 2)
  exercise.sideRule == SideRule.PER_SIDE -> RepBreakdown.PerSide(reps, reps * 2)
  else -> null
}
