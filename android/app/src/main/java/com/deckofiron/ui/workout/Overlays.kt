package com.deckofiron.ui.workout

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Pause
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material.icons.filled.SwapHoriz
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.IconButtonDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.pluralStringResource
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.deckofiron.R
import com.deckofiron.data.WorkoutCatalog
import com.deckofiron.domain.JokerColor
import com.deckofiron.domain.JokerTask
import com.deckofiron.domain.SessionConfig
import com.deckofiron.domain.reps
import com.deckofiron.domain.tonnageKg
import com.deckofiron.ui.Countdown
import com.deckofiron.ui.WorkoutOverlay
import com.deckofiron.ui.components.CountdownRing
import com.deckofiron.ui.components.PrimaryButton
import com.deckofiron.ui.components.SecondaryButton
import com.deckofiron.ui.formatNumber
import com.deckofiron.ui.jokerColorTitle
import com.deckofiron.ui.jokerTaskDescription
import com.deckofiron.ui.jokerTaskParams
import com.deckofiron.ui.jokerTaskTitle
import com.deckofiron.ui.setup.JokerTaskEditor
import com.deckofiron.ui.theme.DisplayFamily
import com.deckofiron.ui.theme.Iron

/** Full-screen scrim that swallows taps meant for the HUD underneath. */
@Composable
private fun OverlaySurface(content: @Composable () -> Unit) {
  Box(
    modifier = Modifier
      .fillMaxSize()
      .background(Iron.BgApp)
      .clickable(interactionSource = remember { MutableInteractionSource() }, indication = null, onClick = {}),
  ) {
    content()
  }
}

@Composable
fun RestOverlay(countdown: Countdown, onTogglePause: () -> Unit, onSkip: () -> Unit) {
  OverlaySurface {
    Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.fillMaxSize().padding(24.dp)) {
      Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.fillMaxWidth()) {
        Text(stringResource(R.string.rest_title), style = MaterialTheme.typography.titleMedium, color = Iron.TextMuted, modifier = Modifier.weight(1f))
        IconButton(
          onClick = onTogglePause,
          colors = IconButtonDefaults.iconButtonColors(containerColor = Iron.SurfaceDark, contentColor = Iron.TextMain),
        ) {
          if (countdown.running) {
            Icon(Icons.Filled.Pause, contentDescription = stringResource(R.string.cd_pause))
          } else {
            Icon(Icons.Filled.PlayArrow, contentDescription = stringResource(R.string.cd_resume), tint = Color(0xFF34D399))
          }
        }
      }
      Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center,
        modifier = Modifier.weight(1f),
      ) {
        CountdownRing(progress = countdown.progress, size = 240.dp) {
          Column(horizontalAlignment = Alignment.CenterHorizontally) {
            val urgent = countdown.remainingSeconds <= 3
            Text(
              text = countdown.remainingSeconds.toString(),
              fontFamily = DisplayFamily,
              fontWeight = FontWeight.Black,
              fontSize = if (urgent) 96.sp else 80.sp,
              color = if (urgent) Iron.Ember else Color.White,
            )
          }
        }
        if (!countdown.running) {
          Text(
            text = stringResource(R.string.paused).uppercase(),
            style = MaterialTheme.typography.labelLarge,
            color = Iron.Ember,
            modifier = Modifier
              .padding(top = 16.dp)
              .clip(CircleShape)
              .background(Iron.Ember.copy(alpha = 0.2f))
              .padding(horizontal = 12.dp, vertical = 4.dp),
          )
        }
      }
      SecondaryButton(text = stringResource(R.string.skip_rest), onClick = onSkip, modifier = Modifier.widthIn(max = 480.dp))
    }
  }
}

/**
 * One screen for both joker colours: the assigned task with its timer (plank, wall sit) or rep target,
 * plus an inline editor to swap the task on the spot.
 */
@Composable
fun JokerOverlay(
  overlay: WorkoutOverlay.Joker,
  config: SessionConfig,
  catalog: WorkoutCatalog,
  onToggleHold: () -> Unit,
  onSwap: (JokerTask) -> Unit,
  onComplete: (early: Boolean) -> Unit,
) {
  var editing by rememberSaveable { mutableStateOf(false) }
  val task = overlay.task
  val hold = overlay.hold

  OverlaySurface {
    Column(
      horizontalAlignment = Alignment.CenterHorizontally,
      modifier = Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(20.dp),
    ) {
      JokerHeader(overlay.color, config.beast)
      Spacer(Modifier.height(10.dp))
      Text(
        text = jokerTaskTitle(task, config, catalog).uppercase(),
        fontFamily = DisplayFamily,
        fontWeight = FontWeight.Black,
        fontSize = 30.sp,
        lineHeight = 32.sp,
        color = Color.White,
        textAlign = TextAlign.Center,
      )
      Text(
        text = jokerTaskDescription(task),
        style = MaterialTheme.typography.bodyMedium,
        color = Iron.TextMuted,
        textAlign = TextAlign.Center,
        modifier = Modifier.padding(top = 6.dp).widthIn(max = 360.dp),
      )

      Spacer(Modifier.height(24.dp))
      if (hold != null) HoldTimer(hold) else RepTarget(task, config)
      Spacer(Modifier.height(24.dp))

      Column(verticalArrangement = Arrangement.spacedBy(10.dp), modifier = Modifier.widthIn(max = 480.dp).fillMaxWidth()) {
        when {
          hold == null || hold.isFinished -> PrimaryButton(
            text = stringResource(R.string.complete_task),
            onClick = { onComplete(false) },
            containerColor = if (hold?.isFinished == true) Iron.Success else Iron.Ember,
            leading = { Icon(Icons.Filled.CheckCircle, contentDescription = null, modifier = Modifier.padding(end = 6.dp)) },
          )
          else -> {
            PrimaryButton(
              text = stringResource(if (hold.running) R.string.hold_pause else R.string.hold_start),
              onClick = onToggleHold,
              leading = {
                Icon(if (hold.running) Icons.Filled.Pause else Icons.Filled.PlayArrow, contentDescription = null, modifier = Modifier.padding(end = 6.dp))
              },
            )
            TextButton(onClick = { onComplete(true) }, modifier = Modifier.fillMaxWidth()) {
              Text(stringResource(R.string.complete_early), color = Iron.TextMuted)
            }
          }
        }

        TextButton(onClick = { editing = !editing }, modifier = Modifier.fillMaxWidth()) {
          Icon(Icons.Filled.SwapHoriz, contentDescription = null, tint = Iron.Ember, modifier = Modifier.padding(end = 6.dp))
          Text(stringResource(R.string.joker_swap_task), color = Iron.Ember, fontWeight = FontWeight.Bold)
        }
        AnimatedVisibility(visible = editing) {
          Column(
            modifier = Modifier
              .fillMaxWidth()
              .clip(RoundedCornerShape(18.dp))
              .background(Iron.SurfaceCard)
              .border(1.dp, Iron.BorderSubtle, RoundedCornerShape(18.dp))
              .padding(14.dp),
          ) {
            JokerTaskEditor(task = task, config = config, onChange = onSwap)
          }
        }
      }
    }
  }
}

@Composable
private fun JokerHeader(color: JokerColor, beast: Boolean) {
  val accent = if (color == JokerColor.RED) Iron.SuitRed else Iron.TextMain
  Row(
    verticalAlignment = Alignment.CenterVertically,
    horizontalArrangement = Arrangement.spacedBy(6.dp),
    modifier = Modifier
      .clip(CircleShape)
      .background(Iron.SurfaceCard)
      .border(1.dp, Iron.BorderSubtle, CircleShape)
      .padding(horizontal = 12.dp, vertical = 5.dp),
  ) {
    Text("★", color = accent, fontSize = 14.sp)
    Text(jokerColorTitle(color).uppercase(), style = MaterialTheme.typography.labelSmall, color = Iron.TextMain)
    if (beast) Text("• ${stringResource(R.string.beast_mode)}", style = MaterialTheme.typography.labelSmall, color = Iron.Ember)
  }
}

@Composable
private fun HoldTimer(hold: Countdown) {
  CountdownRing(progress = hold.progress, size = 250.dp) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
      Text(
        text = "%d:%02d".format(hold.remainingSeconds / 60, hold.remainingSeconds % 60),
        fontFamily = DisplayFamily,
        fontWeight = FontWeight.Black,
        fontSize = 64.sp,
        color = Color.White,
      )
      Text(
        text = stringResource(
          when {
            hold.isFinished -> R.string.hold_done
            hold.running -> R.string.hold_running
            else -> R.string.hold_ready
          },
        ).uppercase(),
        style = MaterialTheme.typography.labelSmall,
        color = Iron.TextMuted,
      )
    }
  }
}

@Composable
private fun RepTarget(task: JokerTask, config: SessionConfig) {
  Column(horizontalAlignment = Alignment.CenterHorizontally) {
    Text(
      text = task.reps().toString(),
      fontFamily = DisplayFamily,
      fontWeight = FontWeight.Black,
      fontSize = 110.sp,
      lineHeight = 110.sp,
      color = Color.White,
    )
    Text(
      text = pluralStringResource(R.plurals.reps_word, task.reps()).uppercase(),
      style = MaterialTheme.typography.labelSmall,
      color = Iron.TextMuted,
    )
    Text(
      text = jokerTaskParams(task),
      style = MaterialTheme.typography.titleMedium,
      color = Iron.Ember,
      modifier = Modifier.padding(top = 10.dp),
    )
    val tonnage = task.tonnageKg(config)
    if (tonnage > 0) {
      Text(
        text = "${stringResource(R.string.task_tonnage)}: ${stringResource(R.string.kg_value, formatNumber(tonnage))}",
        style = MaterialTheme.typography.bodySmall,
        color = Iron.TextMuted,
        modifier = Modifier.padding(top = 4.dp),
      )
    }
  }
}
