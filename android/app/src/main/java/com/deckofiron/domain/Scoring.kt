package com.deckofiron.domain

object Scoring {
  /** Reps of all 52 cards (jokers excluded): per suit 2..9 = 44, 10/J/Q/K = 40, plus the ace. */
  fun cleanDeckReps(aceValue: Int): Int = Suit.entries.size * (44 + 40 + aceValue)

  /** Only kettlebell mode counts tonnage for regular cards. */
  fun cardTonnageKg(card: Card, config: SessionConfig): Int {
    if (!config.isKettlebellMode || card !is Card.Playing) return 0
    val load = config.loads[card.suit] ?: return 0
    return load.kg * card.reps * load.count
  }

  fun deckTonnageKg(config: SessionConfig): Int {
    if (!config.isKettlebellMode) return 0
    val repsPerSuit = 44 + 40 + config.aceValue
    return config.loads.values.sumOf { repsPerSuit * it.kg * it.count }
  }

  fun formatDuration(seconds: Int): String {
    val safe = seconds.coerceAtLeast(0)
    return "%02d:%02d".format(safe / 60, safe % 60)
  }

  /** "MM:SS" under an hour, "H:MM:SS" from an hour on (history totals). */
  fun formatLongDuration(seconds: Int): String {
    val safe = seconds.coerceAtLeast(0)
    return if (safe < 3600) formatDuration(safe) else "%d:%02d:%02d".format(safe / 3600, safe % 3600 / 60, safe % 60)
  }
}
