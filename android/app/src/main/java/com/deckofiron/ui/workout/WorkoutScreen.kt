package com.deckofiron.ui.workout

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.outlined.Info
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.IconButtonDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalView
import androidx.compose.ui.res.pluralStringResource
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.deckofiron.R
import com.deckofiron.data.WorkoutCatalog
import com.deckofiron.domain.Card
import com.deckofiron.domain.JokerColor
import com.deckofiron.domain.Scoring
import com.deckofiron.domain.WorkoutSession
import com.deckofiron.domain.clusterTip
import com.deckofiron.domain.repBreakdown
import com.deckofiron.ui.AppViewModel
import com.deckofiron.ui.WorkoutOverlay
import com.deckofiron.ui.clusterTipText
import com.deckofiron.ui.components.PlayingCardFrame
import com.deckofiron.ui.components.PrimaryButton
import com.deckofiron.ui.components.ProgressLine
import com.deckofiron.ui.exercise.ExerciseInfoSheet
import com.deckofiron.ui.formatNumber
import com.deckofiron.ui.jokerColorTitle
import com.deckofiron.ui.kgLabel
import com.deckofiron.ui.repBreakdownText
import com.deckofiron.ui.theme.DisplayFamily
import com.deckofiron.ui.theme.Iron
import com.deckofiron.ui.title

/** Workout HUD: progress, the current card, running totals and the big "Done" button. */
@Composable
fun WorkoutScreen(
  session: WorkoutSession,
  overlay: WorkoutOverlay?,
  showQuitConfirm: Boolean,
  catalog: WorkoutCatalog,
  viewModel: AppViewModel,
) {
  KeepScreenOn()
  var infoExerciseId by rememberSaveable { mutableStateOf<String?>(null) }
  val card = session.currentCard ?: return
  val config = session.config

  Box(Modifier.fillMaxSize()) {
    Column(
      horizontalAlignment = Alignment.CenterHorizontally,
      modifier = Modifier.fillMaxSize().padding(horizontal = 16.dp, vertical = 8.dp),
    ) {
      HudTopBar(session, onQuit = viewModel::requestQuit)

      Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(12.dp, Alignment.CenterVertically),
        modifier = Modifier.weight(1f).fillMaxWidth(),
      ) {
        when (card) {
          is Card.Joker -> JokerCardFace(card.color, onClick = viewModel::onDone)
          is Card.Playing -> {
            val exercise = catalog.exercise(config.loads[card.suit]?.exerciseId)
              ?: catalog.exercisesFor(card.suit).firstOrNull()
            val load = config.loads[card.suit]
            PlayingCardFrame(
              cornerLabel = card.rank.label,
              cornerSymbol = card.suit.symbol,
              symbolColor = if (card.suit.isRed) Iron.SuitRed else Iron.SuitBlack,
              onClick = viewModel::onDone,
              modifier = Modifier.weight(1f, fill = false),
              footer = {
                if (exercise != null) {
                  IconButton(
                    onClick = { infoExerciseId = exercise.id },
                    colors = IconButtonDefaults.iconButtonColors(containerColor = Iron.SuitBlack.copy(alpha = 0.08f)),
                  ) {
                    Icon(Icons.Outlined.Info, contentDescription = stringResource(R.string.cd_info), tint = Iron.SuitBlack)
                  }
                } else {
                  Text("DECK OF IRON", fontSize = 9.sp, fontWeight = FontWeight.Black, color = Iron.TextSubtle)
                }
              },
            ) {
              Text(
                text = card.reps.toString(),
                fontFamily = DisplayFamily,
                fontWeight = FontWeight.Black,
                fontSize = 104.sp,
                lineHeight = 100.sp,
                color = Iron.SuitBlack,
              )
              Text(
                text = pluralStringResource(R.plurals.reps_word, card.reps).uppercase(),
                fontSize = 10.sp,
                fontWeight = FontWeight.Black,
                letterSpacing = 2.sp,
                color = Iron.TextSubtle,
              )
              if (exercise != null) {
                Text(
                  text = exercise.title().uppercase(),
                  fontFamily = DisplayFamily,
                  fontWeight = FontWeight.Black,
                  fontSize = 24.sp,
                  lineHeight = 26.sp,
                  textAlign = TextAlign.Center,
                  color = Iron.SuitBlack,
                  modifier = Modifier.padding(top = 12.dp),
                )
              }
              if (config.isKettlebellMode && load != null && load.kg > 0) {
                val total = if (load.count > 1) " • ${stringResource(R.string.kg_value, (load.kg * load.count).toString())}" else ""
                Text(
                  text = kgLabel(load.kg, load.count) + total,
                  fontSize = 12.sp,
                  fontWeight = FontWeight.ExtraBold,
                  color = Iron.TextSubtle,
                  modifier = Modifier.padding(top = 6.dp),
                )
              }
            }
            exercise?.let { repBreakdown(it, card.reps) }?.let { InfoPill(repBreakdownText(it)) }
            clusterTip(card, config.isKettlebellMode)?.let { InfoPill(clusterTipText(it)) }
          }
        }
      }

      HudTotals(session)
      PrimaryButton(text = stringResource(R.string.done_next), onClick = viewModel::onDone, modifier = Modifier.padding(top = 12.dp))
    }

    when (overlay) {
      is WorkoutOverlay.Rest -> RestOverlay(overlay.countdown, onTogglePause = viewModel::toggleRestPause, onSkip = viewModel::skipRest)
      is WorkoutOverlay.Joker -> JokerOverlay(
        overlay = overlay,
        config = config,
        catalog = catalog,
        onToggleHold = viewModel::toggleJokerHold,
        onSwap = viewModel::swapJokerTask,
        onComplete = { viewModel.completeJoker(early = it) },
      )
      null -> Unit
    }
    if (showQuitConfirm) QuitDialog(onStay = viewModel::dismissQuit, onQuit = viewModel::confirmQuit)
  }

  catalog.exercise(infoExerciseId)?.let { ExerciseInfoSheet(it) { infoExerciseId = null } }
}

@Composable
private fun KeepScreenOn() {
  val view = LocalView.current
  DisposableEffect(view) {
    view.keepScreenOn = true
    onDispose { view.keepScreenOn = false }
  }
}

@Composable
private fun HudTopBar(session: WorkoutSession, onQuit: () -> Unit) {
  Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
    Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.fillMaxWidth()) {
      Row(verticalAlignment = Alignment.Bottom, modifier = Modifier.weight(1f)) {
        Text(
          text = "${session.currentIndex + 1}",
          fontFamily = DisplayFamily,
          fontWeight = FontWeight.Black,
          fontSize = 26.sp,
          color = Iron.TextMain,
        )
        Text(text = " / ${session.deck.size}", style = MaterialTheme.typography.labelLarge, color = Iron.TextMuted, modifier = Modifier.padding(bottom = 4.dp))
      }
      Text(
        text = Scoring.formatDuration(session.elapsedSeconds),
        fontFamily = DisplayFamily,
        fontWeight = FontWeight.Bold,
        fontSize = 17.sp,
        color = Iron.TextMain,
        modifier = Modifier
          .clip(CircleShape)
          .background(Iron.SurfaceCard)
          .border(1.dp, Iron.BorderSubtle, CircleShape)
          .padding(horizontal = 14.dp, vertical = 6.dp),
      )
      Box(Modifier.weight(1f), contentAlignment = Alignment.CenterEnd) {
        IconButton(
          onClick = onQuit,
          colors = IconButtonDefaults.iconButtonColors(containerColor = Iron.SurfaceDark, contentColor = Iron.TextMuted),
        ) {
          Icon(Icons.Filled.Close, contentDescription = stringResource(R.string.cd_quit))
        }
      }
    }
    ProgressLine(session.progress)
  }
}

@Composable
private fun HudTotals(session: WorkoutSession) {
  Row(verticalAlignment = Alignment.Bottom, modifier = Modifier.fillMaxWidth().padding(horizontal = 8.dp)) {
    Column(modifier = Modifier.weight(1f)) {
      Text(text = session.totalReps.toString(), fontFamily = DisplayFamily, fontWeight = FontWeight.Black, fontSize = 30.sp, color = Iron.TextMain)
      Text(text = stringResource(R.string.reps_total).uppercase(), style = MaterialTheme.typography.labelSmall, color = Iron.TextMuted)
    }
    if (session.totalTonnageKg > 0 || session.config.isKettlebellMode) {
      Column(horizontalAlignment = Alignment.End) {
        Text(
          text = stringResource(R.string.kg_value, formatNumber(session.totalTonnageKg)),
          fontFamily = DisplayFamily,
          fontWeight = FontWeight.Black,
          fontSize = 30.sp,
          color = Iron.TextMain,
        )
        Text(text = stringResource(R.string.tonnage).uppercase(), style = MaterialTheme.typography.labelSmall, color = Iron.TextMuted)
      }
    }
  }
}

@Composable
private fun InfoPill(text: String) {
  Row(
    verticalAlignment = Alignment.CenterVertically,
    horizontalArrangement = Arrangement.spacedBy(8.dp),
    modifier = Modifier
      .clip(CircleShape)
      .background(Iron.SurfaceCard)
      .border(1.dp, Iron.BorderSubtle, CircleShape)
      .padding(horizontal = 14.dp, vertical = 7.dp),
  ) {
    Box(Modifier.size(8.dp).clip(CircleShape).background(Iron.Ember))
    Text(text = text, style = MaterialTheme.typography.labelLarge, color = Iron.TextMain)
  }
}

@Composable
private fun JokerCardFace(color: JokerColor, onClick: () -> Unit) {
  val accent = if (color == JokerColor.RED) Iron.SuitRed else Iron.TextMain
  Surface(
    onClick = onClick,
    shape = RoundedCornerShape(26.dp),
    color = Iron.SurfaceCard,
    border = BorderStroke(2.dp, Iron.Ember),
    shadowElevation = 16.dp,
    modifier = Modifier.widthIn(max = 320.dp).fillMaxWidth().aspectRatio(5f / 7f),
  ) {
    Column(verticalArrangement = Arrangement.SpaceBetween, modifier = Modifier.padding(22.dp)) {
      Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.fillMaxWidth()) {
        Text(stringResource(R.string.joker), fontFamily = DisplayFamily, fontWeight = FontWeight.Black, fontSize = 24.sp, color = Iron.Ember, modifier = Modifier.weight(1f))
        Text("★", fontSize = 22.sp, color = accent)
      }
      Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.fillMaxWidth()) {
        Text("★", fontSize = 64.sp, color = accent)
        Text(
          text = jokerColorTitle(color).uppercase(),
          fontFamily = DisplayFamily,
          fontWeight = FontWeight.Black,
          fontSize = 26.sp,
          color = Color.White,
          textAlign = TextAlign.Center,
        )
      }
      Text(
        text = stringResource(R.string.joker_tap_to_start).uppercase(),
        style = MaterialTheme.typography.labelLarge,
        color = Color.White,
        textAlign = TextAlign.Center,
        modifier = Modifier
          .fillMaxWidth()
          .clip(RoundedCornerShape(16.dp))
          .background(Iron.Ember)
          .padding(vertical = 10.dp),
      )
    }
  }
}

@Composable
private fun QuitDialog(onStay: () -> Unit, onQuit: () -> Unit) {
  AlertDialog(
    onDismissRequest = onStay,
    containerColor = Iron.SurfaceCard,
    title = { Text(stringResource(R.string.quit_title), style = MaterialTheme.typography.titleLarge, color = Color.White) },
    text = { Text(stringResource(R.string.quit_desc), style = MaterialTheme.typography.bodyMedium, color = Iron.TextMuted) },
    confirmButton = {
      TextButton(onClick = onQuit) { Text(stringResource(R.string.quit_now), color = Iron.Ember, fontWeight = FontWeight.Bold) }
    },
    dismissButton = {
      TextButton(onClick = onStay) { Text(stringResource(R.string.stay), color = Iron.TextMain) }
    },
  )
}
