package com.deckofiron.platform

import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class SynthTest {

  @Test
  fun `cues have the web version durations`() {
    assertEquals((0.12 * Synth.SAMPLE_RATE).toInt(), Synth.render(Sound.COUNTDOWN).size)
    assertEquals((0.2 * Synth.SAMPLE_RATE).toInt(), Synth.render(Sound.COUNTDOWN_FINAL).size)
    assertEquals((0.08 * Synth.SAMPLE_RATE).toInt(), Synth.render(Sound.CARD).size)
    assertEquals((2.6 * Synth.SAMPLE_RATE).toInt(), Synth.render(Sound.GONG).size)
  }

  @Test
  fun `every cue is audible and fades out`() {
    for (sound in Sound.entries) {
      val pcm = Synth.render(sound)
      val head = pcm.take(pcm.size / 10).maxOf { kotlin.math.abs(it.toInt()) }
      val tail = pcm.takeLast(pcm.size / 20).maxOf { kotlin.math.abs(it.toInt()) }
      assertTrue("$sound too quiet: $head", head > 1000)
      assertTrue("$sound does not fade: $tail vs $head", tail < head / 4)
    }
  }
}
