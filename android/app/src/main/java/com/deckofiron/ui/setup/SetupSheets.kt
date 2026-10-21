package com.deckofiron.ui.setup

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.outlined.Info
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.Text
import androidx.compose.material3.rememberModalBottomSheetState
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.pluralStringResource
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.deckofiron.R
import com.deckofiron.data.WorkoutCatalog
import com.deckofiron.domain.Exercise
import com.deckofiron.domain.JokerColor
import com.deckofiron.domain.JokerTask
import com.deckofiron.domain.SessionConfig
import com.deckofiron.domain.SideRule
import com.deckofiron.domain.Suit
import com.deckofiron.domain.SuitLoad
import com.deckofiron.ui.components.OptionChip
import com.deckofiron.ui.components.SecondaryButton
import com.deckofiron.ui.components.SegmentedControl
import com.deckofiron.ui.components.SuitBadge
import com.deckofiron.ui.jokerColorTitle
import com.deckofiron.ui.muscles
import com.deckofiron.ui.restLabel
import com.deckofiron.ui.suitTitle
import com.deckofiron.ui.theme.Iron
import com.deckofiron.ui.title

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun IronSheet(onDismiss: () -> Unit, content: @Composable () -> Unit) {
  ModalBottomSheet(
    onDismissRequest = onDismiss,
    sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true),
    containerColor = Iron.SurfaceCard,
  ) {
    Column(
      verticalArrangement = Arrangement.spacedBy(16.dp),
      modifier = Modifier
        .verticalScroll(rememberScrollState())
        .padding(horizontal = 20.dp)
        .navigationBarsPadding()
        .padding(bottom = 16.dp),
    ) {
      content()
      SecondaryButton(text = stringResource(R.string.close), onClick = onDismiss)
    }
  }
}

@Composable
private fun SheetTitle(text: String) {
  Text(text = text, style = MaterialTheme.typography.titleLarge, color = Iron.TextMain)
}

@Composable
private fun FieldLabel(text: String) {
  Text(text = text.uppercase(), style = MaterialTheme.typography.labelSmall, color = Iron.TextMuted)
}

/** Exercise and kettlebell load for one suit (the web `BottomSheet`). */
@OptIn(ExperimentalLayoutApi::class)
@Composable
fun ExercisePickerSheet(
  suit: Suit,
  config: SessionConfig,
  catalog: WorkoutCatalog,
  onLoadChange: (SuitLoad) -> Unit,
  onInfo: (Exercise) -> Unit,
  onDismiss: () -> Unit,
) {
  val load = config.loads[suit] ?: SessionConfig.DEFAULT_LOADS.getValue(suit)
  val options = catalog.exercisesFor(suit).filter { SessionConfig.allowedIn(config.mode, it) }

  IronSheet(onDismiss) {
    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(12.dp)) {
      SuitBadge(suit, size = 40.dp)
      Column {
        SheetTitle(suitTitle(suit).uppercase())
        Text(text = stringResource(R.string.change), style = MaterialTheme.typography.bodySmall, color = Iron.TextMuted)
      }
    }

    options.forEach { exercise ->
      ExerciseRow(
        exercise = exercise,
        selected = exercise.id == load.exerciseId,
        onClick = {
          onLoadChange(load.copy(exerciseId = exercise.id))
          if (!config.isKettlebellMode) onDismiss()
        },
        onInfo = { onInfo(exercise) },
      )
    }

    if (config.isKettlebellMode) {
      HorizontalDivider(color = Iron.BorderSubtle)
      FieldLabel(stringResource(R.string.kettlebell_weight))
      FlowRow(horizontalArrangement = Arrangement.spacedBy(6.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
        SessionConfig.KETTLEBELL_WEIGHTS.forEach { kg ->
          OptionChip(
            label = stringResource(R.string.kg_value, kg.toString()),
            selected = load.kg == kg,
            onClick = { onLoadChange(load.copy(kg = kg)) },
          )
        }
      }
      FieldLabel(stringResource(R.string.bell_count))
      Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
        listOf(1, 2).forEach { count ->
          OptionChip(
            label = stringResource(if (count == 1) R.string.one_bell else R.string.two_bells),
            selected = load.count == count,
            onClick = { onLoadChange(load.copy(count = count)) },
            modifier = Modifier.weight(1f),
          )
        }
      }
    }
  }
}

@Composable
private fun ExerciseRow(exercise: Exercise, selected: Boolean, onClick: () -> Unit, onInfo: () -> Unit) {
  val shape = RoundedCornerShape(16.dp)
  Row(
    verticalAlignment = Alignment.CenterVertically,
    modifier = Modifier
      .fillMaxWidth()
      .clip(shape)
      .background(if (selected) Iron.SurfaceElevated else Iron.BgApp)
      .border(1.dp, if (selected) Iron.Ember else Iron.BorderSubtle, shape)
      .clickable(onClick = onClick)
      .padding(start = 14.dp, top = 12.dp, bottom = 12.dp, end = 6.dp),
  ) {
    Column(modifier = Modifier.weight(1f)) {
      Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
        Pill(stringResource(R.string.tier, exercise.tier), Iron.TextMain, Iron.BorderSubtle)
        if (exercise.sideRule != SideRule.NONE) {
          Pill(if (exercise.sideRule == SideRule.PER_SIDE) "×2" else "½", Iron.Ember, Iron.Ember.copy(alpha = 0.12f))
        }
      }
      Text(
        text = exercise.title().uppercase(),
        style = MaterialTheme.typography.titleMedium,
        color = Color.White,
        maxLines = 1,
        overflow = TextOverflow.Ellipsis,
        modifier = Modifier.padding(top = 4.dp),
      )
      Text(text = exercise.muscles(), style = MaterialTheme.typography.bodySmall, color = Iron.TextMuted, maxLines = 1, overflow = TextOverflow.Ellipsis)
    }
    IconButton(onClick = onInfo) {
      Icon(Icons.Outlined.Info, contentDescription = stringResource(R.string.cd_info), tint = Iron.TextMuted)
    }
    if (selected) {
      Box(
        contentAlignment = Alignment.Center,
        modifier = Modifier.padding(end = 6.dp).size(26.dp).clip(CircleShape).background(Iron.Ember),
      ) {
        Icon(Icons.Filled.Check, contentDescription = null, tint = Color.White, modifier = Modifier.size(16.dp))
      }
    }
  }
}

@Composable
private fun Pill(text: String, color: Color, background: Color) {
  Text(
    text = text,
    fontSize = 10.sp,
    fontWeight = FontWeight.ExtraBold,
    color = color,
    modifier = Modifier.clip(RoundedCornerShape(4.dp)).background(background).padding(horizontal = 6.dp, vertical = 2.dp),
  )
}

/** Ace value, joker count and rest interval. */
@Composable
fun DeckSettingsSheet(
  config: SessionConfig,
  onAceChange: (Int) -> Unit,
  onJokerCountChange: (Int) -> Unit,
  onRestChange: (Int?) -> Unit,
  onDismiss: () -> Unit,
) {
  IronSheet(onDismiss) {
    SheetTitle(stringResource(R.string.deck_settings_title))
    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
      FieldLabel(stringResource(R.string.ace_value))
      SegmentedControl(
        options = SessionConfig.ACE_VALUES.map { pluralStringResource(R.plurals.reps_count, it, it) to it },
        selected = config.aceValue,
        onSelect = onAceChange,
      )
    }
    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
      FieldLabel(stringResource(R.string.jokers_count))
      SegmentedControl(options = SessionConfig.JOKER_COUNTS.map { it.toString() to it }, selected = config.jokerCount, onSelect = onJokerCountChange)
    }
    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
      FieldLabel(stringResource(R.string.rest_interval))
      SegmentedControl(options = SessionConfig.REST_OPTIONS.map { restLabel(it) to it }, selected = config.restSeconds, onSelect = onRestChange)
    }
  }
}

/** Both joker slots: any of the five tasks on either colour. */
@Composable
fun JokerSettingsSheet(config: SessionConfig, onTaskChange: (JokerColor, JokerTask) -> Unit, onDismiss: () -> Unit) {
  IronSheet(onDismiss) {
    SheetTitle(stringResource(R.string.joker_settings_title))
    Text(text = stringResource(R.string.joker_settings_hint), style = MaterialTheme.typography.bodySmall, color = Iron.TextMuted)
    if (config.jokerCount == 1) {
      Text(text = stringResource(R.string.joker_one_random_hint), style = MaterialTheme.typography.bodySmall, color = Iron.TextSubtle)
    }
    JokerColor.entries.forEach { color ->
      Column(
        verticalArrangement = Arrangement.spacedBy(10.dp),
        modifier = Modifier
          .fillMaxWidth()
          .clip(RoundedCornerShape(18.dp))
          .background(Iron.BgApp)
          .border(1.dp, Iron.BorderSubtle, RoundedCornerShape(18.dp))
          .padding(14.dp),
      ) {
        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
          JokerDot(color)
          Text(text = jokerColorTitle(color).uppercase(), style = MaterialTheme.typography.titleMedium, color = Iron.TextMain)
        }
        JokerTaskEditor(task = config.jokers.taskFor(color), config = config, onChange = { onTaskChange(color, it) })
      }
    }
  }
}

@Composable
fun JokerDot(color: JokerColor, modifier: Modifier = Modifier) {
  Box(
    modifier = modifier
      .size(12.dp)
      .clip(CircleShape)
      .background(if (color == JokerColor.RED) Iron.SuitRed else Iron.CardBone)
      .border(1.dp, Iron.BorderMedium, CircleShape),
  )
}
