package com.deckofiron

import android.app.Application

class DeckOfIronApp : Application() {
  lateinit var container: AppContainer
    private set

  override fun onCreate() {
    super.onCreate()
    container = AppContainer(this)
  }
}
