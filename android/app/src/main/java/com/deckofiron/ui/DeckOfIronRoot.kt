package com.deckofiron.ui

import androidx.activity.compose.BackHandler
import androidx.appcompat.app.AppCompatDelegate
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.VolumeOff
import androidx.compose.material.icons.automirrored.filled.VolumeUp
import androidx.compose.material.icons.filled.History
import androidx.compose.material3.CenterAlignedTopAppBar
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.withStyle
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.core.os.LocaleListCompat
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import com.deckofiron.AppContainer
import com.deckofiron.R
import com.deckofiron.ui.history.HistoryScreen
import com.deckofiron.ui.setup.SetupScreen
import com.deckofiron.ui.summary.SummaryScreen
import com.deckofiron.ui.theme.DisplayFamily
import com.deckofiron.ui.theme.Iron
import com.deckofiron.ui.workout.WorkoutScreen

@Composable
fun DeckOfIronRoot(container: AppContainer) {
  val viewModel: AppViewModel = viewModel { AppViewModel(container) }
  val state by viewModel.state.collectAsStateWithLifecycle()
  if (!state.isLoaded) {
    Box(Modifier.fillMaxSize())
    return
  }

  BackHandler(enabled = state.screen != Screen.SETUP) {
    when (state.screen) {
      Screen.WORKOUT -> if (state.showQuitConfirm) viewModel.dismissQuit() else viewModel.requestQuit()
      Screen.HISTORY -> viewModel.closeHistory()
      Screen.SUMMARY -> viewModel.goHome()
      Screen.SETUP -> Unit
    }
  }

  val showTopBar = state.screen == Screen.SETUP || state.screen == Screen.SUMMARY
  Scaffold(
    containerColor = Iron.BgApp,
    topBar = {
      if (showTopBar) {
        IronTopBar(
          soundEnabled = state.soundEnabled,
          onToggleSound = viewModel::toggleSound,
          onOpenHistory = viewModel::openHistory,
        )
      }
    },
  ) { padding ->
    Box(Modifier.fillMaxSize().padding(padding)) {
      when (state.screen) {
        Screen.SETUP -> SetupScreen(state.config, viewModel.catalog, viewModel)
        Screen.WORKOUT -> state.session?.let {
          WorkoutScreen(it, state.overlay, state.showQuitConfirm, viewModel.catalog, viewModel)
        }
        Screen.SUMMARY -> state.finished?.let {
          SummaryScreen(it, viewModel.catalog, onAgain = viewModel::startWorkout, onHome = viewModel::goHome)
        }
        Screen.HISTORY -> HistoryScreen(container, onBack = viewModel::closeHistory)
      }
    }
  }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun IronTopBar(soundEnabled: Boolean, onToggleSound: () -> Unit, onOpenHistory: () -> Unit) {
  val english = isEnglish()
  CenterAlignedTopAppBar(
    colors = TopAppBarDefaults.topAppBarColors(containerColor = Iron.BgApp),
    title = {
      Text(
        text = buildAnnotatedString {
          append("DECK OF ")
          withStyle(SpanStyle(color = Iron.Ember)) { append("IRON") }
        },
        fontFamily = DisplayFamily,
        fontWeight = FontWeight.Black,
        fontSize = 22.sp,
        letterSpacing = 1.5.sp,
        color = Iron.TextMain,
      )
    },
    navigationIcon = {
      val languageLabel = stringResource(R.string.cd_language)
      TextButton(
        onClick = {
          val next = if (english) "ru" else "en"
          AppCompatDelegate.setApplicationLocales(LocaleListCompat.forLanguageTags(next))
        },
        modifier = Modifier
          .padding(start = 4.dp)
          .semantics { contentDescription = languageLabel },
      ) {
        Text(
          text = if (english) "EN" else "RU",
          fontWeight = FontWeight.Black,
          color = Iron.TextMain,
          modifier = Modifier
            .border(1.dp, Iron.BorderMedium, RoundedCornerShape(8.dp))
            .padding(horizontal = 8.dp, vertical = 3.dp),
        )
      }
    },
    actions = {
      IconButton(onClick = onToggleSound) {
        Icon(
          imageVector = if (soundEnabled) Icons.AutoMirrored.Filled.VolumeUp else Icons.AutoMirrored.Filled.VolumeOff,
          contentDescription = stringResource(if (soundEnabled) R.string.cd_sound_on else R.string.cd_sound_off),
          tint = if (soundEnabled) Iron.TextMain else Iron.TextSubtle,
        )
      }
      IconButton(onClick = onOpenHistory) {
        Icon(Icons.Filled.History, contentDescription = stringResource(R.string.cd_history), tint = Iron.TextMain)
      }
    },
  )
}
