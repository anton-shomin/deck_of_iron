package com.deckofiron.data

import android.content.res.AssetManager
import com.deckofiron.domain.Exercise
import com.deckofiron.domain.Preset
import com.deckofiron.domain.Suit
import kotlinx.serialization.json.Json

/** Exercises and presets bundled from ../src/data (synced into assets at build time). */
class WorkoutCatalog(val exercises: List<Exercise>, val presets: List<Preset>) {

  fun exercise(id: String?): Exercise? = exercises.firstOrNull { it.id == id }

  fun exercisesFor(suit: Suit): List<Exercise> = exercises.filter { it.suit == suit }

  companion object {
    private val json = Json { ignoreUnknownKeys = true }

    fun load(assets: AssetManager): WorkoutCatalog {
      val exercises = assets.open("exercises.json").bufferedReader().use { json.decodeFromString<List<Exercise>>(it.readText()) }
      val presets = assets.open("presets.json").bufferedReader().use { json.decodeFromString<List<Preset>>(it.readText()) }
      return WorkoutCatalog(exercises, presets)
    }
  }
}
