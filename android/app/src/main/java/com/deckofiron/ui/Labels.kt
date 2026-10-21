package com.deckofiron.ui

import androidx.compose.runtime.Composable
import androidx.compose.runtime.ReadOnlyComposable
import androidx.compose.ui.platform.LocalConfiguration
import androidx.compose.ui.res.pluralStringResource
import androidx.compose.ui.res.stringResource
import com.deckofiron.R
import com.deckofiron.data.WorkoutCatalog
import com.deckofiron.domain.ClusterTip
import com.deckofiron.domain.Exercise
import com.deckofiron.domain.JokerColor
import com.deckofiron.domain.JokerTask
import com.deckofiron.domain.JokerTaskKind
import com.deckofiron.domain.RepBreakdown
import com.deckofiron.domain.SessionConfig
import com.deckofiron.domain.Suit
import com.deckofiron.domain.WorkoutMode
import java.text.NumberFormat
import java.util.Locale

/** UI text for domain values. Exercise data carries both languages; everything else is in strings.xml. */

@Composable
@ReadOnlyComposable
fun currentLocale(): Locale = LocalConfiguration.current.locales[0]

@Composable
@ReadOnlyComposable
fun isEnglish(): Boolean = currentLocale().language == "en"

@Composable
@ReadOnlyComposable
fun Exercise.title(): String = if (isEnglish()) nameEn else nameRu

@Composable
@ReadOnlyComposable
fun Exercise.muscles(): String = if (isEnglish()) musclesEn else musclesRu

@Composable
@ReadOnlyComposable
fun Exercise.cues(): List<String> = if (isEnglish()) cuesEn else cuesRu

@Composable
@ReadOnlyComposable
fun Exercise.mistake(): String = if (isEnglish()) commonMistakeEn else commonMistakeRu

@Composable
@ReadOnlyComposable
fun formatNumber(value: Int): String = NumberFormat.getIntegerInstance(currentLocale()).format(value)

@Composable
fun suitTitle(suit: Suit): String = stringResource(
  when (suit) {
    Suit.S -> R.string.suit_spades
    Suit.H -> R.string.suit_hearts
    Suit.D -> R.string.suit_diamonds
    Suit.C -> R.string.suit_clubs
  },
)

@Composable
fun modeTitle(mode: WorkoutMode): String = stringResource(
  when (mode) {
    WorkoutMode.BODY -> R.string.mode_body
    WorkoutMode.KETTLEBELL -> R.string.mode_kettlebell
    WorkoutMode.CUSTOM -> R.string.mode_custom
  },
)

@Composable
fun jokerColorTitle(color: JokerColor): String = stringResource(
  when (color) {
    JokerColor.RED -> R.string.joker_red
    JokerColor.BLACK -> R.string.joker_black
  },
)

@Composable
fun jokerKindTitle(kind: JokerTaskKind): String = stringResource(
  when (kind) {
    JokerTaskKind.PLANK -> R.string.joker_task_plank
    JokerTaskKind.WALL_SIT -> R.string.joker_task_wall_sit
    JokerTaskKind.BURPEES -> R.string.joker_task_burpees
    JokerTaskKind.THRUSTERS -> R.string.joker_task_thrusters
    JokerTaskKind.SUIT_REPS -> R.string.joker_task_suit_reps
  },
)

/** Full task title; suit tasks name the exercise assigned to that suit. */
@Composable
fun jokerTaskTitle(task: JokerTask, config: SessionConfig, catalog: WorkoutCatalog): String = when (task) {
  is JokerTask.Plank -> stringResource(R.string.joker_title_plank)
  is JokerTask.WallSit -> stringResource(R.string.joker_title_wall_sit)
  is JokerTask.Burpees -> stringResource(R.string.joker_title_burpees)
  is JokerTask.Thrusters -> stringResource(R.string.joker_title_thrusters)
  is JokerTask.SuitReps -> {
    val exercise = task.suit?.let { catalog.exercise(config.loads[it]?.exerciseId) }
    if (task.suit == null || exercise == null) {
      stringResource(R.string.joker_title_suit_random)
    } else {
      stringResource(R.string.joker_title_suit_reps, "${task.suit.symbol} ${exercise.title()}")
    }
  }
}

@Composable
fun jokerTaskDescription(task: JokerTask): String = stringResource(
  when (task) {
    is JokerTask.Plank -> R.string.joker_desc_plank
    is JokerTask.WallSit -> R.string.joker_desc_wall_sit
    is JokerTask.Burpees -> R.string.joker_desc_burpees
    is JokerTask.Thrusters -> R.string.joker_desc_thrusters
    is JokerTask.SuitReps -> R.string.joker_desc_suit_reps
  },
)

/** One-line parameter summary, e.g. "2 мин" or "2×24 кг • 30 повт". */
@Composable
fun jokerTaskParams(task: JokerTask): String = when (task) {
  is JokerTask.Plank -> holdLabel(task.seconds)
  is JokerTask.WallSit -> holdLabel(task.seconds)
  is JokerTask.Burpees -> stringResource(R.string.reps_short, task.reps)
  is JokerTask.Thrusters -> "${kgLabel(task.bellKg, task.bellCount)} • ${stringResource(R.string.reps_short, task.reps)}"
  is JokerTask.SuitReps -> listOfNotNull(task.suit?.symbol, stringResource(R.string.reps_short, task.reps)).joinToString(" • ")
}

/** Whole minutes as "2 мин", anything else as "1:30". */
@Composable
fun holdLabel(seconds: Int): String =
  if (seconds % 60 == 0) stringResource(R.string.minutes_value, seconds / 60) else "%d:%02d".format(seconds / 60, seconds % 60)

@Composable
fun kgLabel(kg: Int, count: Int): String =
  if (count > 1) stringResource(R.string.kg_double, kg) else stringResource(R.string.kg_value, kg.toString())

@Composable
fun restLabel(seconds: Int?): String =
  if (seconds == null) stringResource(R.string.rest_manual) else stringResource(R.string.seconds_value, seconds)

@Composable
fun repBreakdownText(breakdown: RepBreakdown): String = when (breakdown) {
  is RepBreakdown.Split -> stringResource(
    if (breakdown.isUneven) R.string.breakdown_split_uneven else R.string.breakdown_split,
    breakdown.total, breakdown.left, breakdown.right,
  )
  is RepBreakdown.PerSide -> stringResource(R.string.breakdown_per_side, breakdown.perSide, breakdown.total)
  is RepBreakdown.NavySealCycles -> stringResource(
    R.string.breakdown_navy_seal,
    pluralStringResource(R.plurals.cycles_count, breakdown.cycles, breakdown.cycles),
    pluralStringResource(R.plurals.push_ups_count, breakdown.pushUps, breakdown.pushUps),
  )
}

@Composable
fun clusterTipText(tip: ClusterTip): String {
  val parts = tip.parts.joinToString(" + ")
  return if (tip.restSeconds != null) {
    stringResource(R.string.cluster_tip, parts, tip.restSeconds)
  } else {
    stringResource(R.string.cluster_tip_no_rest, parts)
  }
}
