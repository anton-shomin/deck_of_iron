package com.deckofiron.ui.setup

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.deckofiron.R
import com.deckofiron.domain.Equipment
import com.deckofiron.domain.JokerOptions
import com.deckofiron.domain.JokerTask
import com.deckofiron.domain.JokerTaskKind
import com.deckofiron.domain.SessionConfig
import com.deckofiron.domain.Suit
import com.deckofiron.domain.tonnageKg
import com.deckofiron.ui.components.OptionChip
import com.deckofiron.ui.formatNumber
import com.deckofiron.ui.holdLabel
import com.deckofiron.ui.jokerKindTitle
import com.deckofiron.ui.theme.Iron

/**
 * Picks one of the five joker tasks and its parameters. Every task is offered in every mode:
 * thrusters bring their own kettlebell settings, the others are bodyweight.
 */
@OptIn(ExperimentalLayoutApi::class)
@Composable
fun JokerTaskEditor(task: JokerTask, config: SessionConfig, onChange: (JokerTask) -> Unit, modifier: Modifier = Modifier) {
  Column(verticalArrangement = Arrangement.spacedBy(12.dp), modifier = modifier.fillMaxWidth()) {
    FlowRow(horizontalArrangement = Arrangement.spacedBy(6.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
      JokerTaskKind.entries.forEach { kind ->
        OptionChip(
          label = jokerKindTitle(kind),
          selected = task.kind == kind,
          onClick = { if (task.kind != kind) onChange(kind.defaultTask()) },
          badge = if (kind.equipment == Equipment.KETTLEBELL) stringResource(R.string.joker_kettlebell_badge) else null,
        )
      }
    }

    when (task) {
      is JokerTask.Plank -> HoldPicker(task.seconds) { onChange(task.copy(seconds = it)) }
      is JokerTask.WallSit -> HoldPicker(task.seconds) { onChange(task.copy(seconds = it)) }
      is JokerTask.Burpees -> RepsPicker(JokerOptions.BURPEE_REPS, task.reps) { onChange(task.copy(reps = it)) }
      is JokerTask.Thrusters -> ThrusterPicker(task, config, onChange)
      is JokerTask.SuitReps -> SuitPicker(task.suit) { onChange(task.copy(suit = it)) }
    }
  }
}

@Composable
private fun ParamLabel(text: String) {
  Text(text = text.uppercase(), style = MaterialTheme.typography.labelSmall, color = Iron.TextMuted)
}

@OptIn(ExperimentalLayoutApi::class)
@Composable
private fun HoldPicker(seconds: Int, onSelect: (Int) -> Unit) {
  Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
    ParamLabel(stringResource(R.string.duration))
    FlowRow(horizontalArrangement = Arrangement.spacedBy(6.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
      JokerOptions.HOLD_SECONDS.forEach { option ->
        OptionChip(label = holdLabel(option), selected = seconds == option, onClick = { onSelect(option) })
      }
    }
  }
}

@OptIn(ExperimentalLayoutApi::class)
@Composable
private fun RepsPicker(options: List<Int>, reps: Int, onSelect: (Int) -> Unit) {
  Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
    ParamLabel(stringResource(R.string.reps_label))
    FlowRow(horizontalArrangement = Arrangement.spacedBy(6.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
      options.forEach { option ->
        OptionChip(label = option.toString(), selected = reps == option, onClick = { onSelect(option) })
      }
    }
  }
}

@OptIn(ExperimentalLayoutApi::class)
@Composable
private fun ThrusterPicker(task: JokerTask.Thrusters, config: SessionConfig, onChange: (JokerTask) -> Unit) {
  Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
    ParamLabel(stringResource(R.string.bell_count))
    Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
      JokerOptions.BELL_COUNTS.forEach { count ->
        OptionChip(
          label = stringResource(if (count == 1) R.string.one_bell else R.string.two_bells),
          selected = task.bellCount == count,
          onClick = { onChange(task.copy(bellCount = count)) },
          modifier = Modifier.weight(1f),
        )
      }
    }
    ParamLabel(stringResource(R.string.kettlebell_weight))
    FlowRow(horizontalArrangement = Arrangement.spacedBy(6.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
      SessionConfig.KETTLEBELL_WEIGHTS.forEach { kg ->
        OptionChip(
          label = stringResource(R.string.kg_value, kg.toString()),
          selected = task.bellKg == kg,
          onClick = { onChange(task.copy(bellKg = kg)) },
        )
      }
    }
    RepsPicker(JokerOptions.THRUSTER_REPS, task.reps) { onChange(task.copy(reps = it)) }
    Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.fillMaxWidth()) {
      Text(
        text = stringResource(R.string.task_tonnage),
        style = MaterialTheme.typography.bodySmall,
        color = Iron.TextMuted,
        modifier = Modifier.weight(1f),
      )
      Text(
        text = stringResource(R.string.kg_value, formatNumber(task.tonnageKg(config))),
        style = MaterialTheme.typography.titleMedium,
        color = Iron.Ember,
        fontWeight = FontWeight.Bold,
      )
    }
  }
}

@OptIn(ExperimentalLayoutApi::class)
@Composable
private fun SuitPicker(suit: Suit?, onSelect: (Suit?) -> Unit) {
  Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
    ParamLabel(stringResource(R.string.suit_label))
    FlowRow(horizontalArrangement = Arrangement.spacedBy(6.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
      OptionChip(label = stringResource(R.string.suit_random), selected = suit == null, onClick = { onSelect(null) })
      Suit.entries.forEach { option ->
        OptionChip(label = option.symbol, selected = suit == option, onClick = { onSelect(option) })
      }
    }
  }
}
