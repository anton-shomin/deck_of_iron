package com.deckofiron.platform

import android.content.Context
import android.os.Build
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager

enum class Haptic(val pattern: LongArray) {
  /** Card flip: 35 ms, pause 40 ms, 20 ms. */
  CARD(longArrayOf(0, 35, 40, 20)),
  COUNTDOWN(longArrayOf(0, 25)),
  GONG(longArrayOf(0, 100, 50, 150)),
}

/** Same vibration patterns as the web version's `navigator.vibrate` calls. */
class Haptics(context: Context) {
  private val vibrator: Vibrator? = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
    context.getSystemService(VibratorManager::class.java)?.defaultVibrator
  } else {
    @Suppress("DEPRECATION")
    context.getSystemService(Vibrator::class.java)
  }

  fun play(haptic: Haptic) {
    val target = vibrator?.takeIf { it.hasVibrator() } ?: return
    target.vibrate(VibrationEffect.createWaveform(haptic.pattern, -1))
  }
}
