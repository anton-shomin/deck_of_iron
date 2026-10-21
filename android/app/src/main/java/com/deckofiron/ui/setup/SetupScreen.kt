package com.deckofiron.ui.setup

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.KeyboardArrowRight
import androidx.compose.material.icons.filled.Bolt
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.pluralStringResource
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import com.deckofiron.R
import com.deckofiron.data.WorkoutCatalog
import com.deckofiron.domain.Exercise
import com.deckofiron.domain.JokerColor
import com.deckofiron.domain.Scoring
import com.deckofiron.domain.SessionConfig
import com.deckofiron.domain.Suit
import com.deckofiron.domain.WorkoutMode
import com.deckofiron.ui.AppViewModel
import com.deckofiron.ui.components.IronPanel
import com.deckofiron.ui.components.PrimaryButton
import com.deckofiron.ui.components.SectionLabel
import com.deckofiron.ui.components.SegmentedControl
import com.deckofiron.ui.components.SuitBadge
import com.deckofiron.ui.components.TagChip
import com.deckofiron.ui.components.ToggleRow
import com.deckofiron.ui.exercise.ExerciseInfoSheet
import com.deckofiron.ui.formatNumber
import com.deckofiron.ui.isEnglish
import com.deckofiron.ui.jokerColorTitle
import com.deckofiron.ui.jokerTaskParams
import com.deckofiron.ui.jokerTaskTitle
import com.deckofiron.ui.kgLabel
import com.deckofiron.ui.modeTitle
import com.deckofiron.ui.muscles
import com.deckofiron.ui.restLabel
import com.deckofiron.ui.theme.Iron
import com.deckofiron.ui.title

private enum class SetupSheet { DECK, JOKERS }

/** The "war table": mode, presets, suit exercises, beast mode, deck and joker settings. */
@Composable
fun SetupScreen(config: SessionConfig, catalog: WorkoutCatalog, viewModel: AppViewModel) {
  var pickerSuit by rememberSaveable { mutableStateOf<Suit?>(null) }
  var sheet by rememberSaveable { mutableStateOf<SetupSheet?>(null) }
  var infoExerciseId by rememberSaveable { mutableStateOf<String?>(null) }

  Box(Modifier.fillMaxSize()) {
    LazyColumn(
      contentPadding = PaddingValues(start = 16.dp, end = 16.dp, top = 4.dp, bottom = 150.dp),
      verticalArrangement = Arrangement.spacedBy(10.dp),
      modifier = Modifier.fillMaxSize(),
    ) {
      item { SectionLabel(stringResource(R.string.section_mode)) }
      item {
        SegmentedControl(
          options = WorkoutMode.entries.map { modeTitle(it) to it },
          selected = config.mode,
          onSelect = viewModel::selectMode,
        )
      }

      item { SectionLabel(stringResource(R.string.section_presets), Modifier.padding(top = 8.dp)) }
      item {
        val english = isEnglish()
        LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
          items(catalog.presets, key = { it.id }) { preset ->
            val selected = preset.mode == config.mode &&
              Suit.entries.all { preset.loads[it]?.exerciseId == config.loads[it]?.exerciseId }
            TagChip(
              label = if (english) preset.nameEn else preset.nameRu,
              selected = selected,
              onClick = { viewModel.applyPreset(preset) },
            )
          }
        }
      }

      item { SectionLabel(stringResource(R.string.section_exercises), Modifier.padding(top = 8.dp)) }
      items(Suit.entries, key = { it.name }) { suit ->
        SuitRow(suit, config, catalog.exercise(config.loads[suit]?.exerciseId)) { pickerSuit = suit }
      }

      item {
        IronPanel(modifier = Modifier.padding(top = 8.dp)) {
          ToggleRow(
            title = stringResource(R.string.beast_mode),
            description = stringResource(R.string.beast_mode_desc),
            checked = config.beast,
            onCheckedChange = viewModel::setBeast,
          )
          HorizontalDivider(color = Iron.BorderSubtle, modifier = Modifier.padding(vertical = 12.dp))
          SettingsLink(
            text = stringResource(
              R.string.deck_settings_summary,
              config.jokerCount,
              config.aceValue,
              restLabel(config.restSeconds),
            ),
            onClick = { sheet = SetupSheet.DECK },
          )
        }
      }

      if (config.jokerCount > 0) {
        item { SectionLabel(stringResource(R.string.section_jokers), Modifier.padding(top = 8.dp)) }
        item { JokersPanel(config, catalog) { sheet = SetupSheet.JOKERS } }
      }
    }

    DealBar(config, onDeal = viewModel::startWorkout, modifier = Modifier.align(Alignment.BottomCenter))
  }

  pickerSuit?.let { suit ->
    ExercisePickerSheet(
      suit = suit,
      config = config,
      catalog = catalog,
      onLoadChange = { viewModel.setLoad(suit, it) },
      onInfo = { infoExerciseId = it.id },
      onDismiss = { pickerSuit = null },
    )
  }
  when (sheet) {
    SetupSheet.DECK -> DeckSettingsSheet(
      config = config,
      onAceChange = viewModel::setAceValue,
      onJokerCountChange = viewModel::setJokerCount,
      onRestChange = viewModel::setRest,
      onDismiss = { sheet = null },
    )
    SetupSheet.JOKERS -> JokerSettingsSheet(config = config, onTaskChange = viewModel::setJokerTask, onDismiss = { sheet = null })
    null -> Unit
  }
  catalog.exercise(infoExerciseId)?.let { ExerciseInfoSheet(it) { infoExerciseId = null } }
}

@Composable
private fun SuitRow(suit: Suit, config: SessionConfig, exercise: Exercise?, onClick: () -> Unit) {
  val load = config.loads[suit]
  IronPanel(onClick = onClick, modifier = Modifier.fillMaxWidth()) {
    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(14.dp)) {
      SuitBadge(suit)
      Column(modifier = Modifier.weight(1f)) {
        Text(
          text = (exercise?.title() ?: suit.name).uppercase(),
          style = MaterialTheme.typography.titleMedium,
          color = Iron.TextMain,
          maxLines = 2,
          overflow = TextOverflow.Ellipsis,
        )
        Text(
          text = exercise?.muscles().orEmpty(),
          style = MaterialTheme.typography.bodySmall,
          color = Iron.TextMuted,
          maxLines = 1,
          overflow = TextOverflow.Ellipsis,
        )
      }
      if (config.isKettlebellMode && load != null) {
        Text(
          text = kgLabel(load.kg, load.count),
          style = MaterialTheme.typography.titleMedium,
          color = Iron.TextMain,
          modifier = Modifier
            .clip(RoundedCornerShape(12.dp))
            .background(Iron.SurfaceElevated)
            .padding(horizontal = 12.dp, vertical = 6.dp),
        )
      } else {
        Icon(Icons.AutoMirrored.Filled.KeyboardArrowRight, contentDescription = null, tint = Iron.TextSubtle)
      }
    }
  }
}

@Composable
private fun SettingsLink(text: String, onClick: () -> Unit) {
  Row(
    verticalAlignment = Alignment.CenterVertically,
    horizontalArrangement = Arrangement.spacedBy(8.dp),
    modifier = Modifier
      .fillMaxWidth()
      .clip(RoundedCornerShape(8.dp))
      .clickable(onClick = onClick)
      .padding(vertical = 4.dp),
  ) {
    Icon(Icons.Filled.Settings, contentDescription = null, tint = Iron.Ember, modifier = Modifier.size(16.dp))
    Text(text = text, style = MaterialTheme.typography.bodySmall, color = Iron.TextMuted, modifier = Modifier.weight(1f))
    Icon(Icons.AutoMirrored.Filled.KeyboardArrowRight, contentDescription = null, tint = Iron.TextSubtle)
  }
}

@Composable
private fun JokersPanel(config: SessionConfig, catalog: WorkoutCatalog, onClick: () -> Unit) {
  IronPanel(onClick = onClick, modifier = Modifier.fillMaxWidth()) {
    JokerColor.entries.forEachIndexed { index, color ->
      if (index > 0) HorizontalDivider(color = Iron.BorderSubtle, modifier = Modifier.padding(vertical = 10.dp))
      val task = config.jokers.taskFor(color)
      Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(10.dp)) {
        JokerDot(color)
        Column(modifier = Modifier.weight(1f)) {
          Text(text = jokerColorTitle(color), style = MaterialTheme.typography.labelSmall, color = Iron.TextSubtle)
          Text(
            text = jokerTaskTitle(task, config, catalog).uppercase(),
            style = MaterialTheme.typography.titleMedium,
            color = Iron.TextMain,
            maxLines = 1,
            overflow = TextOverflow.Ellipsis,
          )
        }
        Text(text = jokerTaskParams(task), style = MaterialTheme.typography.labelLarge, color = Iron.Ember)
      }
    }
  }
}

@Composable
private fun DealBar(config: SessionConfig, onDeal: () -> Unit, modifier: Modifier = Modifier) {
  val cards = 52 + config.jokerCount
  val reps = Scoring.cleanDeckReps(config.aceValue)
  val tonnage = Scoring.deckTonnageKg(config)
  val cardsText = pluralStringResource(R.plurals.cards_count, cards, cards)
  val repsText = pluralStringResource(R.plurals.reps_count, reps, reps)
  Column(
    horizontalAlignment = Alignment.CenterHorizontally,
    modifier = modifier
      .fillMaxWidth()
      .background(Brush.verticalGradient(listOf(Color.Transparent, Iron.BgApp.copy(alpha = 0.95f), Iron.BgApp)))
      .padding(horizontal = 16.dp)
      .padding(top = 24.dp, bottom = 12.dp),
  ) {
    PrimaryButton(
      text = stringResource(R.string.deal_deck),
      onClick = onDeal,
      leading = { Icon(Icons.Filled.Bolt, contentDescription = null, modifier = Modifier.padding(end = 6.dp)) },
      modifier = Modifier.widthIn(max = 480.dp),
    )
    Spacer(Modifier.height(6.dp))
    Text(
      text = if (tonnage > 0) {
        stringResource(R.string.deck_totals_tonnage, cardsText, repsText, stringResource(R.string.kg_value, formatNumber(tonnage)))
      } else {
        stringResource(R.string.deck_totals, cardsText, repsText)
      },
      style = MaterialTheme.typography.bodySmall,
      fontWeight = FontWeight.Medium,
      color = Iron.TextMuted,
      textAlign = TextAlign.Center,
    )
  }
}
