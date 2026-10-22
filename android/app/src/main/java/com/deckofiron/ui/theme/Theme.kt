package com.deckofiron.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Typography
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.DeviceFontFamilyName
import androidx.compose.ui.text.font.Font
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp

/** Design tokens from the web app's `@theme` block (src/index.css). */
object Iron {
  val BgApp = Color(0xFF12100E)
  val SurfaceDark = Color(0xFF1C1917)
  val SurfaceCard = Color(0xFF181614)
  val SurfaceElevated = Color(0xFF24201D)
  val BorderSubtle = Color(0xFF2B2722)
  val BorderMedium = Color(0xFF38322B)
  val Ember = Color(0xFFE85324)
  val EmberHover = Color(0xFFD6471C)
  val CardBone = Color(0xFFE8E2D5)
  val CardBoneDark = Color(0xFFDCD5C6)
  val SuitRed = Color(0xFFD92626)
  val SuitBlack = Color(0xFF1A1A1A)
  val TextMain = Color(0xFFF2EFE9)
  val TextMuted = Color(0xFF9C9388)
  val TextSubtle = Color(0xFF7A7367)
  val Success = Color(0xFF059669)
}

/**
 * Fira Sans Extra Condensed is only shipped as woff2 in the web build, so the display face falls
 * back to the platform's condensed sans (Roboto Condensed).
 */
val DisplayFamily = FontFamily(
  Font(DeviceFontFamilyName("sans-serif-condensed"), FontWeight.Bold),
  Font(DeviceFontFamilyName("sans-serif-condensed"), FontWeight.ExtraBold),
  Font(DeviceFontFamilyName("sans-serif-condensed"), FontWeight.Black),
)

private val colors = darkColorScheme(
  primary = Iron.Ember,
  onPrimary = Color.White,
  secondary = Iron.CardBone,
  onSecondary = Iron.SuitBlack,
  background = Iron.BgApp,
  onBackground = Iron.TextMain,
  surface = Iron.SurfaceCard,
  onSurface = Iron.TextMain,
  surfaceVariant = Iron.SurfaceDark,
  onSurfaceVariant = Iron.TextMuted,
  surfaceContainer = Iron.SurfaceCard,
  surfaceContainerHigh = Iron.SurfaceElevated,
  surfaceContainerLow = Iron.SurfaceDark,
  outline = Iron.BorderSubtle,
  outlineVariant = Iron.BorderMedium,
  error = Iron.SuitRed,
)

private val typography = Typography(
  displayLarge = TextStyle(fontFamily = DisplayFamily, fontWeight = FontWeight.Black, fontSize = 96.sp, lineHeight = 96.sp),
  displayMedium = TextStyle(fontFamily = DisplayFamily, fontWeight = FontWeight.Black, fontSize = 64.sp, lineHeight = 64.sp),
  headlineMedium = TextStyle(fontFamily = DisplayFamily, fontWeight = FontWeight.Black, fontSize = 30.sp, lineHeight = 32.sp),
  titleLarge = TextStyle(fontFamily = DisplayFamily, fontWeight = FontWeight.Bold, fontSize = 22.sp, lineHeight = 24.sp, letterSpacing = 0.5.sp),
  titleMedium = TextStyle(fontFamily = DisplayFamily, fontWeight = FontWeight.Bold, fontSize = 18.sp, lineHeight = 20.sp),
  bodyMedium = TextStyle(fontSize = 14.sp, lineHeight = 20.sp),
  bodySmall = TextStyle(fontSize = 12.sp, lineHeight = 16.sp),
  labelLarge = TextStyle(fontSize = 13.sp, fontWeight = FontWeight.Bold, letterSpacing = 0.5.sp),
  labelSmall = TextStyle(fontSize = 11.sp, fontWeight = FontWeight.Bold, letterSpacing = 1.5.sp),
)

@Composable
fun DeckOfIronTheme(content: @Composable () -> Unit) {
  MaterialTheme(colorScheme = colors, typography = typography, content = content)
}
