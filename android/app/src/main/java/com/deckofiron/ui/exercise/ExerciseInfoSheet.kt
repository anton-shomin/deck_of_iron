package com.deckofiron.ui.exercise

import android.net.Uri
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
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
import androidx.compose.material.icons.automirrored.filled.OpenInNew
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.FitnessCenter
import androidx.compose.material.icons.filled.WarningAmber
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.Text
import androidx.compose.material3.rememberModalBottomSheetState
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalUriHandler
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.deckofiron.R
import com.deckofiron.domain.Equipment
import com.deckofiron.domain.Exercise
import com.deckofiron.ui.components.PrimaryButton
import com.deckofiron.ui.components.SuitBadge
import com.deckofiron.ui.cues
import com.deckofiron.ui.mistake
import com.deckofiron.ui.muscles
import com.deckofiron.ui.theme.Iron
import com.deckofiron.ui.title

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ExerciseInfoSheet(exercise: Exercise, onDismiss: () -> Unit) {
  val uriHandler = LocalUriHandler.current
  ModalBottomSheet(
    onDismissRequest = onDismiss,
    sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true),
    containerColor = Iron.SurfaceCard,
  ) {
    Column(
      verticalArrangement = Arrangement.spacedBy(14.dp),
      modifier = Modifier
        .verticalScroll(rememberScrollState())
        .padding(horizontal = 20.dp)
        .navigationBarsPadding()
        .padding(bottom = 16.dp),
    ) {
      Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(12.dp)) {
        SuitBadge(exercise.suit, size = 42.dp)
        Column {
          Row(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalAlignment = Alignment.CenterVertically) {
            Text(
              text = stringResource(if (exercise.equipment == Equipment.KETTLEBELL) R.string.equipment_kettlebell else R.string.equipment_body),
              fontSize = 10.sp,
              fontWeight = FontWeight.ExtraBold,
              color = Iron.Ember,
              modifier = Modifier
                .clip(RoundedCornerShape(4.dp))
                .background(Iron.Ember.copy(alpha = 0.15f))
                .border(1.dp, Iron.Ember.copy(alpha = 0.4f), RoundedCornerShape(4.dp))
                .padding(horizontal = 6.dp, vertical = 2.dp),
            )
            Text(text = stringResource(R.string.tier, exercise.tier), style = MaterialTheme.typography.bodySmall, color = Iron.TextMuted)
          }
          Text(text = exercise.title().uppercase(), style = MaterialTheme.typography.titleLarge, color = Color.White)
        }
      }

      InfoBlock(icon = Icons.Filled.FitnessCenter, iconTint = Iron.Ember, title = stringResource(R.string.muscles)) {
        Text(text = exercise.muscles(), style = MaterialTheme.typography.bodyMedium, color = Iron.TextMain)
      }

      Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
        SheetCaption(Icons.Filled.CheckCircle, Color(0xFF34D399), stringResource(R.string.technique_cues))
        exercise.cues().forEachIndexed { index, cue ->
          Row(
            horizontalArrangement = Arrangement.spacedBy(10.dp),
            modifier = Modifier
              .fillMaxWidth()
              .clip(RoundedCornerShape(12.dp))
              .background(Iron.BgApp)
              .border(1.dp, Iron.BorderSubtle, RoundedCornerShape(12.dp))
              .padding(10.dp),
          ) {
            Box(
              contentAlignment = Alignment.Center,
              modifier = Modifier.size(22.dp).clip(CircleShape).background(Iron.SurfaceElevated),
            ) {
              Text(text = "${index + 1}", fontSize = 11.sp, fontWeight = FontWeight.Black, color = Iron.Ember)
            }
            Text(text = cue, style = MaterialTheme.typography.bodySmall, color = Iron.TextMain)
          }
        }
      }

      InfoBlock(
        icon = Icons.Filled.WarningAmber,
        iconTint = Iron.Ember,
        title = stringResource(R.string.common_mistake),
        background = Iron.Ember.copy(alpha = 0.1f),
        border = Iron.Ember.copy(alpha = 0.3f),
      ) {
        Text(text = exercise.mistake(), style = MaterialTheme.typography.bodySmall, color = Iron.TextMain)
      }

      PrimaryButton(
        text = stringResource(R.string.watch_youtube),
        onClick = { uriHandler.openUri("https://www.youtube.com/results?search_query=${Uri.encode(exercise.youtubeQuery)}") },
        leading = { Icon(Icons.AutoMirrored.Filled.OpenInNew, contentDescription = null, modifier = Modifier.padding(end = 8.dp)) },
      )
    }
  }
}

@Composable
private fun SheetCaption(icon: ImageVector, tint: Color, text: String) {
  Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
    Icon(icon, contentDescription = null, tint = tint, modifier = Modifier.size(15.dp))
    Text(text = text.uppercase(), style = MaterialTheme.typography.labelSmall, color = Iron.TextMuted)
  }
}

@Composable
private fun InfoBlock(
  icon: ImageVector,
  iconTint: Color,
  title: String,
  background: Color = Iron.BgApp,
  border: Color = Iron.BorderSubtle,
  content: @Composable () -> Unit,
) {
  Column(
    verticalArrangement = Arrangement.spacedBy(4.dp),
    modifier = Modifier
      .fillMaxWidth()
      .clip(RoundedCornerShape(16.dp))
      .background(background)
      .border(1.dp, border, RoundedCornerShape(16.dp))
      .padding(14.dp),
  ) {
    SheetCaption(icon, iconTint, title)
    content()
  }
}
