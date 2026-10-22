package com.deckofiron.platform

import android.media.AudioAttributes
import android.media.AudioFormat
import android.media.AudioTrack
import android.util.Log
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import java.util.concurrent.ConcurrentHashMap

/** Plays [Synth] cues as sonification, so music from other apps keeps playing. */
class SoundPlayer {
  private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Default)
  private val rendered = ConcurrentHashMap<Sound, ShortArray>()

  @Volatile
  var enabled: Boolean = true

  fun play(sound: Sound) {
    if (!enabled) return
    scope.launch {
      val pcm = rendered.getOrPut(sound) { Synth.render(sound) }
      val track = try {
        buildTrack(pcm)
      } catch (e: IllegalArgumentException) {
        Log.w(TAG, "Cannot create audio track for $sound", e)
        return@launch
      } catch (e: UnsupportedOperationException) {
        Log.w(TAG, "Cannot create audio track for $sound", e)
        return@launch
      }
      try {
        track.write(pcm, 0, pcm.size)
        track.play()
        delay(pcm.size * 1000L / Synth.SAMPLE_RATE + RELEASE_MARGIN_MS)
      } catch (e: IllegalStateException) {
        Log.w(TAG, "Playback of $sound failed", e)
      } finally {
        track.release()
      }
    }
  }

  private fun buildTrack(pcm: ShortArray): AudioTrack = AudioTrack.Builder()
    .setAudioAttributes(
      AudioAttributes.Builder()
        .setUsage(AudioAttributes.USAGE_ASSISTANCE_SONIFICATION)
        .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
        .build(),
    )
    .setAudioFormat(
      AudioFormat.Builder()
        .setEncoding(AudioFormat.ENCODING_PCM_16BIT)
        .setSampleRate(Synth.SAMPLE_RATE)
        .setChannelMask(AudioFormat.CHANNEL_OUT_MONO)
        .build(),
    )
    .setTransferMode(AudioTrack.MODE_STATIC)
    .setBufferSizeInBytes(pcm.size * Short.SIZE_BYTES)
    .build()

  private companion object {
    const val TAG = "SoundPlayer"
    /** Headroom for output latency, so short beeps are not cut off on slow audio paths. */
    const val RELEASE_MARGIN_MS = 500L
  }
}
