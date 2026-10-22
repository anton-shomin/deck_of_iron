package com.deckofiron.platform

import kotlin.math.PI
import kotlin.math.abs
import kotlin.math.pow
import kotlin.math.sin

enum class Sound { COUNTDOWN, COUNTDOWN_FINAL, CARD, GONG }

/**
 * Renders the app's cues to 16-bit PCM, matching the web version's Web Audio synth
 * (sine beeps, a falling triangle "card flip" and a five-partial iron gong). No audio files.
 */
object Synth {
  const val SAMPLE_RATE = 44_100

  fun render(sound: Sound): ShortArray = when (sound) {
    Sound.COUNTDOWN -> beep(freq = 700.0, seconds = 0.12)
    Sound.COUNTDOWN_FINAL -> beep(freq = 980.0, seconds = 0.2)
    Sound.CARD -> cardFlip()
    Sound.GONG -> gong()
  }

  private fun beep(freq: Double, seconds: Double): ShortArray = pcm(seconds) { t ->
    sin(2 * PI * freq * t) * decay(0.2, 0.001, t, seconds)
  }

  /** Triangle wave sweeping 320 → 80 Hz over 80 ms. */
  private fun cardFlip(): ShortArray {
    val seconds = 0.08
    var phase = 0.0
    return pcm(seconds) { t ->
      val freq = 320.0 * (80.0 / 320.0).pow(t / seconds)
      phase += freq / SAMPLE_RATE
      triangle(phase) * decay(0.15, 0.001, t, seconds)
    }
  }

  private fun gong(): ShortArray {
    val partials = listOf(220.0, 440.0, 660.0, 880.0, 1320.0)
    val seconds = 2.6
    return pcm(seconds) { t ->
      val master = decay(0.35, 0.0001, t, 2.5)
      partials.foldIndexed(0.0) { i, acc, freq ->
        val decaySeconds = 2.5 - i * 0.3
        val amp = if (t < decaySeconds) decay(0.3 / (i + 1), 0.001, t, decaySeconds) else 0.0
        val phase = freq * t
        val wave = if (i % 2 == 0) sin(2 * PI * phase) else triangle(phase)
        acc + wave * amp
      } * master
    }
  }

  /** Exponential ramp from [from] to [to] over [seconds], like `exponentialRampToValueAtTime`. */
  private fun decay(from: Double, to: Double, t: Double, seconds: Double): Double =
    from * (to / from).pow((t / seconds).coerceAtMost(1.0))

  private fun triangle(phase: Double): Double {
    val frac = phase - kotlin.math.floor(phase)
    return 4 * abs(frac - 0.5) - 1
  }

  private inline fun pcm(seconds: Double, sample: (Double) -> Double): ShortArray {
    val count = (seconds * SAMPLE_RATE).toInt()
    return ShortArray(count) { n ->
      val value = sample(n.toDouble() / SAMPLE_RATE).coerceIn(-1.0, 1.0)
      (value * Short.MAX_VALUE).toInt().toShort()
    }
  }
}
