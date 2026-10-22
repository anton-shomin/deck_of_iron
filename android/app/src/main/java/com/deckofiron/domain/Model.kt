package com.deckofiron.domain

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

/** Suit = exercise slot. Symbols carry U+FE0E so Android draws text glyphs in our colours, not emoji. */
@Serializable
enum class Suit(val symbol: String, val isRed: Boolean) {
  S("♠︎", false),
  H("♥︎", true),
  D("♦︎", true),
  C("♣︎", false),
}

@Serializable
enum class Rank(val label: String) {
  TWO("2"), THREE("3"), FOUR("4"), FIVE("5"), SIX("6"), SEVEN("7"), EIGHT("8"), NINE("9"),
  TEN("10"), JACK("J"), QUEEN("Q"), KING("K"), ACE("A");

  /** Rank → reps: 2–9 face value, 10/J/Q/K = 10, Ace = [aceValue]. */
  fun reps(aceValue: Int): Int = when (this) {
    ACE -> aceValue
    TEN, JACK, QUEEN, KING -> 10
    else -> label.toInt()
  }
}

@Serializable
enum class JokerColor { RED, BLACK }

@Serializable
sealed interface Card {
  val id: String

  @Serializable
  @SerialName("playing")
  data class Playing(val suit: Suit, val rank: Rank, val reps: Int) : Card {
    override val id: String get() = "${suit.name}-${rank.label}"
  }

  @Serializable
  @SerialName("joker")
  data class Joker(val color: JokerColor) : Card {
    override val id: String get() = "JOKER-${color.name}"
  }
}

@Serializable
enum class WorkoutMode { BODY, KETTLEBELL, CUSTOM }

@Serializable
enum class Equipment { BODY, KETTLEBELL }

@Serializable
enum class SideRule { NONE, SPLIT_TOTAL, PER_SIDE }

@Serializable
data class Exercise(
  val id: String,
  val suit: Suit,
  val tier: Int,
  val equipment: Equipment,
  val sideRule: SideRule,
  val nameRu: String,
  val nameEn: String,
  val musclesRu: String,
  val musclesEn: String,
  val cuesRu: List<String>,
  val cuesEn: List<String>,
  val commonMistakeRu: String,
  val commonMistakeEn: String,
  val youtubeQuery: String,
  val specialNoteRu: String? = null,
  val specialNoteEn: String? = null,
)

@Serializable
data class SuitLoad(val exerciseId: String, val kg: Int, val count: Int)

@Serializable
data class Preset(
  val id: String,
  val nameRu: String,
  val nameEn: String,
  val descRu: String,
  val descEn: String,
  val mode: WorkoutMode,
  val loads: Map<Suit, SuitLoad>,
)

/** Final stats of one workout; the same shape is stored locally and in Supabase. */
@Serializable
data class WorkoutSummary(
  val durationSeconds: Int,
  val completedCards: Int,
  val totalCards: Int,
  val totalReps: Int,
  val suitReps: Map<Suit, Int>,
  val totalTonnageKg: Int,
  val jokersCompleted: Int,
)
