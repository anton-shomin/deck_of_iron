package com.deckofiron.ui.history

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.CalendarMonth
import androidx.compose.material.icons.filled.CloudOff
import androidx.compose.material.icons.filled.DeleteOutline
import androidx.compose.material.icons.filled.EmojiEvents
import androidx.compose.material.icons.filled.FitnessCenter
import androidx.compose.material.icons.filled.LocalFireDepartment
import androidx.compose.material.icons.filled.Sync
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.material3.pulltorefresh.PullToRefreshBox
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
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
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import com.deckofiron.AppContainer
import com.deckofiron.R
import com.deckofiron.data.history.HistoryEntry
import com.deckofiron.data.history.SyncState
import com.deckofiron.domain.Scoring
import com.deckofiron.ui.currentLocale
import com.deckofiron.ui.formatNumber
import com.deckofiron.ui.modeTitle
import com.deckofiron.ui.theme.DisplayFamily
import com.deckofiron.ui.theme.Iron
import java.time.Instant
import java.time.ZoneId
import java.time.format.DateTimeFormatter
import java.time.format.FormatStyle

/** Separate history screen: totals, sync status with Supabase and the list of workouts. */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun HistoryScreen(container: AppContainer, onBack: () -> Unit) {
  val viewModel: HistoryViewModel = viewModel { HistoryViewModel(container.history, container.appScope) }
  val loaded by viewModel.entries.collectAsStateWithLifecycle()
  val entries = loaded.orEmpty()
  val syncState by viewModel.syncState.collectAsStateWithLifecycle()
  var confirmClear by rememberSaveable { mutableStateOf(false) }

  LaunchedEffect(Unit) { viewModel.refresh() }

  Column(Modifier.fillMaxSize()) {
    TopAppBar(
      // The root Scaffold already pads for the status bar.
      windowInsets = WindowInsets(0),
      colors = TopAppBarDefaults.topAppBarColors(containerColor = Iron.BgApp),
      title = { Text(stringResource(R.string.history_title), style = MaterialTheme.typography.titleLarge, color = Iron.TextMain) },
      navigationIcon = {
        IconButton(onClick = onBack) {
          Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = stringResource(R.string.cd_back), tint = Iron.TextMain)
        }
      },
      actions = {
        if (syncState != SyncState.Disabled) {
          IconButton(onClick = viewModel::refresh, enabled = syncState != SyncState.Syncing) {
            Icon(Icons.Filled.Sync, contentDescription = stringResource(R.string.cd_sync), tint = Iron.TextMain)
          }
        }
        if (entries.isNotEmpty()) {
          IconButton(onClick = { confirmClear = true }) {
            Icon(Icons.Filled.DeleteOutline, contentDescription = stringResource(R.string.history_clear), tint = Iron.TextMuted)
          }
        }
      },
    )

    PullToRefreshBox(
      isRefreshing = syncState == SyncState.Syncing,
      onRefresh = viewModel::refresh,
      modifier = Modifier.fillMaxSize(),
    ) {
      LazyColumn(
        contentPadding = PaddingValues(start = 16.dp, end = 16.dp, bottom = 24.dp),
        verticalArrangement = Arrangement.spacedBy(10.dp),
        modifier = Modifier.fillMaxSize(),
      ) {
        item { SyncBanner(syncState) }
        if (loaded == null) {
          // Still loading from Room.
        } else if (entries.isEmpty()) {
          item { EmptyHistory() }
        } else {
          item { Totals(entries) }
          items(entries, key = { it.id }) { HistoryCard(it, showPending = syncState != SyncState.Disabled) }
        }
      }
    }
  }

  if (confirmClear) {
    AlertDialog(
      onDismissRequest = { confirmClear = false },
      containerColor = Iron.SurfaceCard,
      title = { Text(stringResource(R.string.history_clear_title), color = Color.White) },
      text = { Text(stringResource(R.string.history_clear_desc), color = Iron.TextMuted) },
      confirmButton = {
        TextButton(onClick = {
          confirmClear = false
          viewModel.clear()
        }) { Text(stringResource(R.string.history_clear_confirm), color = Iron.Ember, fontWeight = FontWeight.Bold) }
      },
      dismissButton = {
        TextButton(onClick = { confirmClear = false }) { Text(stringResource(R.string.cancel), color = Iron.TextMain) }
      },
    )
  }
}

@Composable
private fun SyncBanner(state: SyncState) {
  val locale = currentLocale()
  val (text, tint) = when (state) {
    SyncState.Disabled -> stringResource(R.string.sync_disabled) to Iron.TextMuted
    SyncState.Idle -> stringResource(R.string.sync_idle) to Iron.TextMuted
    SyncState.Syncing -> stringResource(R.string.sync_syncing) to Iron.TextMuted
    is SyncState.Synced -> stringResource(
      R.string.sync_synced,
      DateTimeFormatter.ofLocalizedTime(FormatStyle.SHORT).withLocale(locale).format(Instant.ofEpochMilli(state.atEpochMs).atZone(ZoneId.systemDefault())),
    ) to Color(0xFF34D399)
    is SyncState.Failed -> stringResource(R.string.sync_failed, state.reason) to Iron.Ember
  }
  Text(text = text, style = MaterialTheme.typography.bodySmall, color = tint, modifier = Modifier.padding(vertical = 4.dp))
}

@Composable
private fun EmptyHistory() {
  Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.fillMaxWidth().padding(vertical = 64.dp)) {
    Icon(Icons.Filled.EmojiEvents, contentDescription = null, tint = Iron.TextSubtle, modifier = Modifier.size(44.dp))
    Text(
      text = stringResource(R.string.history_empty),
      style = MaterialTheme.typography.bodyMedium,
      color = Iron.TextMuted,
      textAlign = TextAlign.Center,
      modifier = Modifier.padding(top = 10.dp),
    )
  }
}

@Composable
private fun Totals(entries: List<HistoryEntry>) {
  val reps = entries.sumOf { it.summary.totalReps }
  val tonnage = entries.sumOf { it.summary.totalTonnageKg }
  val seconds = entries.sumOf { it.summary.durationSeconds }
  Column(
    modifier = Modifier
      .fillMaxWidth()
      .clip(RoundedCornerShape(18.dp))
      .background(Iron.SurfaceCard)
      .border(1.dp, Iron.BorderSubtle, RoundedCornerShape(18.dp))
      .padding(16.dp),
  ) {
    Text(
      text = pluralStringResource(R.plurals.workouts_count, entries.size, entries.size).uppercase(),
      fontFamily = DisplayFamily,
      fontWeight = FontWeight.Black,
      fontSize = 28.sp,
      color = Iron.TextMain,
    )
    Row(modifier = Modifier.fillMaxWidth().padding(top = 10.dp)) {
      TotalCell(formatNumber(reps), stringResource(R.string.history_total_reps), Modifier.weight(1f))
      TotalCell(stringResource(R.string.kg_value, formatNumber(tonnage)), stringResource(R.string.history_total_tonnage), Modifier.weight(1f))
      TotalCell(Scoring.formatLongDuration(seconds), stringResource(R.string.history_total_time), Modifier.weight(1f))
    }
  }
}

@Composable
private fun TotalCell(value: String, label: String, modifier: Modifier) {
  Column(modifier = modifier) {
    Text(value, fontFamily = DisplayFamily, fontWeight = FontWeight.Black, fontSize = 20.sp, color = Iron.Ember, maxLines = 1)
    Text(label.uppercase(), style = MaterialTheme.typography.labelSmall, color = Iron.TextMuted)
  }
}

@Composable
private fun HistoryCard(entry: HistoryEntry, showPending: Boolean) {
  val locale = currentLocale()
  val date = remember(entry.finishedAtEpochMs, locale) {
    DateTimeFormatter.ofLocalizedDateTime(FormatStyle.MEDIUM, FormatStyle.SHORT)
      .withLocale(locale)
      .format(Instant.ofEpochMilli(entry.finishedAtEpochMs).atZone(ZoneId.systemDefault()))
  }
  val summary = entry.summary
  Column(
    verticalArrangement = Arrangement.spacedBy(10.dp),
    modifier = Modifier
      .fillMaxWidth()
      .clip(RoundedCornerShape(18.dp))
      .background(Iron.BgApp)
      .border(1.dp, Iron.BorderSubtle, RoundedCornerShape(18.dp))
      .padding(14.dp),
  ) {
    Row(verticalAlignment = Alignment.CenterVertically) {
      Icon(Icons.Filled.CalendarMonth, contentDescription = null, tint = Iron.TextSubtle, modifier = Modifier.size(15.dp))
      Text(date, style = MaterialTheme.typography.bodySmall, color = Iron.TextMuted, modifier = Modifier.padding(start = 6.dp).weight(1f))
      if (showPending && !entry.isSynced) {
        Icon(Icons.Filled.CloudOff, contentDescription = stringResource(R.string.history_pending), tint = Iron.TextSubtle, modifier = Modifier.size(15.dp).padding(end = 2.dp))
      }
      if (entry.beast) Icon(Icons.Filled.LocalFireDepartment, contentDescription = null, tint = Iron.Ember, modifier = Modifier.size(16.dp))
      Text(modeTitle(entry.mode), style = MaterialTheme.typography.labelLarge, color = Iron.Ember, modifier = Modifier.padding(start = 4.dp))
    }
    Row(
      modifier = Modifier
        .fillMaxWidth()
        .clip(RoundedCornerShape(12.dp))
        .background(Iron.SurfaceCard)
        .border(1.dp, Iron.BorderSubtle, RoundedCornerShape(12.dp))
        .padding(vertical = 10.dp),
    ) {
      CardStat(stringResource(R.string.metric_time), Scoring.formatDuration(summary.durationSeconds), Modifier.weight(1f))
      CardStat(stringResource(R.string.metric_cards), stringResource(R.string.history_cards, summary.completedCards, summary.totalCards), Modifier.weight(1f))
      CardStat(stringResource(R.string.metric_reps), summary.totalReps.toString(), Modifier.weight(1f))
    }
    if (summary.totalTonnageKg > 0) {
      Row(verticalAlignment = Alignment.CenterVertically) {
        Icon(Icons.Filled.FitnessCenter, contentDescription = null, tint = Iron.Ember, modifier = Modifier.size(15.dp))
        Text(stringResource(R.string.tonnage), style = MaterialTheme.typography.bodySmall, color = Iron.TextMuted, modifier = Modifier.padding(start = 6.dp).weight(1f))
        Text(stringResource(R.string.kg_value, formatNumber(summary.totalTonnageKg)), style = MaterialTheme.typography.labelLarge, color = Iron.TextMain)
      }
    }
  }
}

@Composable
private fun CardStat(label: String, value: String, modifier: Modifier) {
  Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = modifier) {
    Text(label, style = MaterialTheme.typography.labelSmall, color = Iron.TextMuted)
    Box(Modifier.padding(top = 2.dp)) {
      Text(value, fontFamily = DisplayFamily, fontWeight = FontWeight.Black, fontSize = 16.sp, color = Color.White)
    }
  }
}
