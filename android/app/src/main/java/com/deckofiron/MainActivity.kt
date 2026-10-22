package com.deckofiron

import android.os.Bundle
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.appcompat.app.AppCompatActivity
import com.deckofiron.ui.DeckOfIronRoot
import com.deckofiron.ui.theme.DeckOfIronTheme

/** AppCompat (not plain ComponentActivity) so the in-app RU/EN switch can use per-app locales. */
class MainActivity : AppCompatActivity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    enableEdgeToEdge()
    super.onCreate(savedInstanceState)
    val container = (application as DeckOfIronApp).container
    setContent {
      DeckOfIronTheme {
        DeckOfIronRoot(container)
      }
    }
  }
}
