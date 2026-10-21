package com.deckofiron.ui.summary

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Cloud
import androidx.compose.material.icons.filled.CloudOff
import androidx.compose.material.icons.filled.CloudSync
import androidx.compose.material.icons.filled.ErrorOutline
import androidx.compose.material.icons.filled.PhoneAndroid
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.deckofiron.R
import com.deckofiron.data.WorkoutCatalog
import com.deckofiron.domain.Scoring
import com.deckofiron.domain.Suit
import com.deckofiron.ui.FinishedWorkout
import com.deckofiron.ui.SaveStatus
import com.deckofiron.ui.components.PrimaryButton
import com.deckofiron.ui.components.ProgressLine
import com.deckofiron.ui.components.SecondaryButton
import com.deckofiron.ui.formatNumber
import com.deckofiron.ui.theme.DisplayFamily
import com.deckofiron.ui.theme.Iron
import com.deckofiron.ui.title

@Composable
fun SummaryScreen(
  finished: FinishedWorkout,
  catalog: WorkoutCatalog,
  onAgain: () -> Unit,
  onHome: () -> Unit,
) {
  val summary = finished.summary
  val config = finished.config
  val showTonnage = summary.totalTonnageKg > 0

  Column(
    verticalArrangement = Arrangement.spacedBy(20.dp),
    modifier = Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(horizontal = 16.dp, vertical = 12.dp),
  ) {
    Column {
      Text(
        text = stringResource(if (finished.isComplete) R.string.workout_completed else R.string.workout_stopped),
        style = MaterialTheme.typography.titleMedium,
        color = Iron.TextMuted,
      )
      Row(verticalAlignment = Alignment.Bottom, horizontalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.padding(top = 8.dp)) {
        Text(
          text = if (showTonnage) formatNumber(summary.totalTonnageKg) else summary.totalReps.toString(),
          fontFamily = DisplayFamily,
          fontWeight = FontWeight.Black,
          fontSize = 80.sp,
          lineHeight = 80.sp,
          color = Iron.TextMain,
        )
        Text(
          text = stringResource(if (showTonnage) R.string.kg_upper else R.string.reps_upper),
          fontFamily = DisplayFamily,
          fontWeight = FontWeight.Black,
          fontSize = 32.sp,
          color = Iron.Ember,
          modifier = Modifier.padding(bottom = 10.dp),
        )
      }
      Text(
        text = stringResource(if (showTonnage) R.string.lifted_caption else R.string.completed_caption).uppercase(),
        style = MaterialTheme.typography.labelSmall,
        color = Iron.TextMuted,
      )
      SaveStatusLine(finished.save)
    }

    HorizontalDivider(color = Iron.BorderSubtle)
    Row(modifier = Modifier.fillMaxWidth()) {
      Metric(Scoring.formatDuration(summary.durationSeconds), stringResource(R.string.metric_time), Modifier.weight(1f))
      Metric("${summary.completedCards}/${summary.totalCards}", stringResource(R.string.metric_cards), Modifier.weight(1f))
      Metric(summary.totalReps.toString(), stringResource(R.string.metric_reps), Modifier.weight(1f))
      Metric(summary.jokersCompleted.toString(), stringResource(R.string.metric_jokers), Modifier.weight(0.8f))
    }
    HorizontalDivider(color = Iron.BorderSubtle)

    val values = Suit.entries.associateWith { suit ->
      val reps = summary.suitReps[suit] ?: 0
      val load = config.loads[suit]
      if (config.isKettlebellMode && load != null) reps * load.kg * load.count else reps
    }
    val max = (values.values.maxOrNull() ?: 0).coerceAtLeast(1)
    Column(verticalArrangement = Arrangement.spacedBy(14.dp)) {
      Suit.entries.forEach { suit ->
        val exercise = catalog.exercise(config.loads[suit]?.exerciseId)
        val value = values.getValue(suit)
        Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
          Row(verticalAlignment = Alignment.CenterVertically) {
            Text(suit.symbol, fontSize = 18.sp, fontWeight = FontWeight.Black, color = if (suit.isRed) Iron.SuitRed else Iron.TextMain)
            Text(
              text = (exercise?.title() ?: suit.name).uppercase(),
              style = MaterialTheme.typography.titleMedium,
              color = Iron.TextMain,
              maxLines = 1,
              overflow = TextOverflow.Ellipsis,
              modifier = Modifier.weight(1f).padding(start = 8.dp),
            )
            Text(
              text = if (config.isKettlebellMode) {
                stringResource(R.string.kg_value, formatNumber(value))
              } else {
                stringResource(R.string.reps_short, value)
              },
              style = MaterialTheme.typography.titleMedium,
              color = Iron.TextMain,
            )
          }
          ProgressLine(
            progress = value.toFloat() / max,
            color = if (suit.isRed) Iron.Ember else Iron.CardBone,
            track = Iron.SurfaceDark,
          )
        }
      }
    }

    Column(verticalArrangement = Arrangement.spacedBy(10.dp), modifier = Modifier.padding(top = 8.dp)) {
      PrimaryButton(text = stringResource(R.string.again), onClick = onAgain)
      SecondaryButton(text = stringResource(R.string.main_menu), onClick = onHome)
    }
  }
}

@Composable
private fun Metric(value: String, label: String, modifier: Modifier = Modifier) {
  Column(modifier = modifier) {
    Text(value, fontFamily = DisplayFamily, fontWeight = FontWeight.Black, fontSize = 26.sp, color = Iron.TextMain, maxLines = 1)
    Text(label, style = MaterialTheme.typography.labelSmall, color = Iron.TextMuted, maxLines = 1)
  }
}

@Composable
private fun SaveStatusLine(status: SaveStatus) {
  val (icon, text, tint) = when (status) {
    SaveStatus.SAVING -> Triple(Icons.Filled.CloudSync, stringResource(R.string.summary_saving), Iron.TextMuted)
    SaveStatus.SAVED_LOCAL -> Triple(Icons.Filled.PhoneAndroid, stringResource(R.string.summary_saved_local), Iron.TextMuted)
    SaveStatus.SAVED_CLOUD -> Triple(Icons.Filled.Cloud, stringResource(R.string.summary_saved_cloud), Color(0xFF34D399))
    SaveStatus.UPLOAD_PENDING -> Triple(Icons.Filled.CloudOff, stringResource(R.string.summary_save_failed), Iron.Ember)
    SaveStatus.FAILED -> Triple(Icons.Filled.ErrorOutline, stringResource(R.string.summary_not_saved), Iron.SuitRed)
  }
  Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp), modifier = Modifier.padding(top = 10.dp)) {
    Icon(icon, contentDescription = null, tint = tint, modifier = Modifier.size(16.dp))
    Text(text, style = MaterialTheme.typography.bodySmall, color = tint)
  }
}
