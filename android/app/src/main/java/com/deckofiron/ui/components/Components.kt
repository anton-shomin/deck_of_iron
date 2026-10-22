package com.deckofiron.ui.components

import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsPressedAsState
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxScope
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.RowScope
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Surface
import androidx.compose.material3.Switch
import androidx.compose.material3.SwitchDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.rotate
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.deckofiron.domain.Suit
import com.deckofiron.ui.theme.DisplayFamily
import com.deckofiron.ui.theme.Iron

@Composable
fun SectionLabel(text: String, modifier: Modifier = Modifier) {
  Text(text = text, style = MaterialTheme.typography.labelSmall, color = Iron.TextSubtle, modifier = modifier)
}

/** Bordered dark panel used for every card-like block. */
@Composable
fun IronPanel(
  modifier: Modifier = Modifier,
  onClick: (() -> Unit)? = null,
  borderColor: Color = Iron.BorderSubtle,
  contentPadding: PaddingValues = PaddingValues(14.dp),
  content: @Composable ColumnScope.() -> Unit,
) {
  val shape = RoundedCornerShape(18.dp)
  Column(
    modifier = modifier
      .clip(shape)
      .background(Iron.SurfaceCard)
      .border(1.dp, borderColor, shape)
      .then(if (onClick != null) Modifier.clickable(onClick = onClick) else Modifier)
      .padding(contentPadding),
    content = content,
  )
}

/** Big ember CTA with a press-scale, the app's main action style. */
@Composable
fun PrimaryButton(
  text: String,
  onClick: () -> Unit,
  modifier: Modifier = Modifier,
  enabled: Boolean = true,
  containerColor: Color = Iron.Ember,
  leading: (@Composable RowScope.() -> Unit)? = null,
) {
  val interaction = remember { MutableInteractionSource() }
  val pressed by interaction.collectIsPressedAsState()
  val scale by animateFloatAsState(if (pressed) 0.98f else 1f, label = "press")
  Button(
    onClick = onClick,
    enabled = enabled,
    interactionSource = interaction,
    shape = RoundedCornerShape(18.dp),
    colors = ButtonDefaults.buttonColors(
      containerColor = containerColor,
      contentColor = Color.White,
      disabledContainerColor = Iron.BorderMedium,
      disabledContentColor = Iron.TextSubtle,
    ),
    contentPadding = PaddingValues(vertical = 18.dp, horizontal = 20.dp),
    modifier = modifier.fillMaxWidth().scale(scale),
  ) {
    leading?.invoke(this)
    Text(
      text = text,
      fontFamily = DisplayFamily,
      fontWeight = FontWeight.ExtraBold,
      fontSize = 20.sp,
      letterSpacing = 1.sp,
      textAlign = TextAlign.Center,
    )
  }
}

@Composable
fun SecondaryButton(text: String, onClick: () -> Unit, modifier: Modifier = Modifier) {
  OutlinedButton(
    onClick = onClick,
    shape = RoundedCornerShape(18.dp),
    border = BorderStroke(1.dp, Iron.BorderSubtle),
    colors = ButtonDefaults.outlinedButtonColors(containerColor = Iron.SurfaceDark, contentColor = Iron.TextMain),
    contentPadding = PaddingValues(vertical = 15.dp),
    modifier = modifier.fillMaxWidth(),
  ) {
    Text(text = text, style = MaterialTheme.typography.labelLarge)
  }
}

/** Small selectable pill; selected = solid ember. */
@Composable
fun OptionChip(
  label: String,
  selected: Boolean,
  onClick: () -> Unit,
  modifier: Modifier = Modifier,
  badge: String? = null,
) {
  val shape = RoundedCornerShape(12.dp)
  Row(
    verticalAlignment = Alignment.CenterVertically,
    horizontalArrangement = Arrangement.Center,
    modifier = modifier
      .heightIn(min = 40.dp)
      .clip(shape)
      .background(if (selected) Iron.Ember else Iron.BgApp)
      .border(1.dp, if (selected) Iron.Ember else Iron.BorderSubtle, shape)
      .clickable(role = Role.RadioButton, onClick = onClick)
      .padding(horizontal = 12.dp, vertical = 8.dp),
  ) {
    Text(
      text = label,
      style = MaterialTheme.typography.labelLarge,
      color = if (selected) Color.White else Iron.TextMuted,
      textAlign = TextAlign.Center,
    )
    if (badge != null) {
      Text(
        text = badge,
        fontSize = 9.sp,
        fontWeight = FontWeight.Black,
        color = if (selected) Color.White else Iron.Ember,
        modifier = Modifier.padding(start = 6.dp),
      )
    }
  }
}

/** Preset-style outline pill used in horizontally scrolling rows. */
@Composable
fun TagChip(label: String, selected: Boolean, onClick: () -> Unit) {
  val shape = CircleShape
  Text(
    text = label,
    style = MaterialTheme.typography.labelLarge,
    color = if (selected) Iron.Ember else Iron.TextMuted,
    modifier = Modifier
      .clip(shape)
      .background(if (selected) Iron.Ember.copy(alpha = 0.15f) else Iron.SurfaceDark)
      .border(1.dp, if (selected) Iron.Ember else Iron.BorderSubtle, shape)
      .clickable(onClick = onClick)
      .padding(horizontal = 14.dp, vertical = 8.dp),
  )
}

@Composable
fun <T> SegmentedControl(
  options: List<Pair<String, T>>,
  selected: T,
  onSelect: (T) -> Unit,
  modifier: Modifier = Modifier,
) {
  val shape = RoundedCornerShape(16.dp)
  Row(
    horizontalArrangement = Arrangement.spacedBy(4.dp),
    modifier = modifier
      .fillMaxWidth()
      .clip(shape)
      .background(Iron.SurfaceCard)
      .border(1.dp, Iron.BorderSubtle, shape)
      .padding(4.dp),
  ) {
    options.forEach { (label, value) ->
      val isSelected = value == selected
      Box(
        contentAlignment = Alignment.Center,
        modifier = Modifier
          .weight(1f)
          .heightIn(min = 40.dp)
          .clip(RoundedCornerShape(12.dp))
          .background(if (isSelected) Iron.Ember else Color.Transparent)
          .clickable(role = Role.RadioButton) { onSelect(value) }
          .padding(horizontal = 6.dp, vertical = 8.dp),
      ) {
        Text(
          text = label,
          style = MaterialTheme.typography.labelLarge,
          color = if (isSelected) Color.White else Iron.TextMuted,
          textAlign = TextAlign.Center,
          maxLines = 1,
        )
      }
    }
  }
}

@Composable
fun ToggleRow(title: String, description: String, checked: Boolean, onCheckedChange: (Boolean) -> Unit) {
  Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.fillMaxWidth()) {
    Column(modifier = Modifier.weight(1f)) {
      Text(text = title, style = MaterialTheme.typography.titleMedium, color = Iron.TextMain)
      Text(text = description, style = MaterialTheme.typography.bodySmall, color = Iron.TextMuted)
    }
    Switch(
      checked = checked,
      onCheckedChange = onCheckedChange,
      colors = SwitchDefaults.colors(
        checkedThumbColor = Color.White,
        checkedTrackColor = Iron.Ember,
        uncheckedThumbColor = Color.White,
        uncheckedTrackColor = Iron.BorderSubtle,
        uncheckedBorderColor = Iron.BorderSubtle,
      ),
    )
  }
}

/** Bone mini-card with the suit symbol. */
@Composable
fun SuitBadge(suit: Suit, modifier: Modifier = Modifier, size: Dp = 48.dp) {
  Box(
    contentAlignment = Alignment.Center,
    modifier = modifier
      .size(width = size, height = size * 1.15f)
      .clip(RoundedCornerShape(12.dp))
      .background(Iron.CardBone)
      .border(1.dp, Iron.CardBoneDark, RoundedCornerShape(12.dp)),
  ) {
    Text(
      text = suit.symbol,
      fontSize = (size.value * 0.5f).sp,
      fontWeight = FontWeight.Black,
      color = if (suit.isRed) Iron.SuitRed else Iron.SuitBlack,
    )
  }
}

/** Bone playing card with mirrored corner indices, the web `PlayingCard` primitive. */
@Composable
fun PlayingCardFrame(
  cornerLabel: String,
  cornerSymbol: String,
  symbolColor: Color,
  modifier: Modifier = Modifier,
  onClick: (() -> Unit)? = null,
  footer: @Composable RowScope.() -> Unit = {},
  content: @Composable ColumnScope.() -> Unit,
) {
  val shape = RoundedCornerShape(26.dp)
  Surface(
    shape = shape,
    color = Iron.CardBone,
    border = BorderStroke(2.dp, Iron.CardBoneDark),
    shadowElevation = 16.dp,
    modifier = modifier
      .widthIn(max = 340.dp)
      .fillMaxWidth()
      .aspectRatio(5f / 7f)
      .then(if (onClick != null) Modifier.clip(shape).clickable(onClick = onClick) else Modifier),
  ) {
    Box(modifier = Modifier.padding(18.dp)) {
      CornerIndex(cornerLabel, cornerSymbol, symbolColor, Modifier.align(Alignment.TopStart))
      Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center,
        modifier = Modifier.align(Alignment.Center).fillMaxWidth(),
        content = content,
      )
      Row(
        verticalAlignment = Alignment.Bottom,
        modifier = Modifier.align(Alignment.BottomStart).fillMaxWidth(),
      ) {
        footer()
        Box(modifier = Modifier.weight(1f))
        CornerIndex(cornerLabel, cornerSymbol, symbolColor, Modifier.rotate(180f))
      }
    }
  }
}

@Composable
private fun CornerIndex(label: String, symbol: String, symbolColor: Color, modifier: Modifier = Modifier) {
  Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = modifier) {
    Text(text = label, fontFamily = DisplayFamily, fontWeight = FontWeight.Black, fontSize = 28.sp, lineHeight = 28.sp, color = Iron.SuitBlack)
    Text(text = symbol, fontWeight = FontWeight.Black, fontSize = 22.sp, lineHeight = 22.sp, color = symbolColor)
  }
}

/** Circular progress ring with centred content, used by rest and joker timers. */
@Composable
fun CountdownRing(
  progress: Float,
  modifier: Modifier = Modifier,
  size: Dp = 260.dp,
  content: @Composable BoxScope.() -> Unit,
) {
  val animated by animateFloatAsState(progress.coerceIn(0f, 1f), label = "ring")
  Box(contentAlignment = Alignment.Center, modifier = modifier.size(size)) {
    Canvas(modifier = Modifier.size(size)) {
      val stroke = this.size.minDimension * 0.06f
      val style = Stroke(width = stroke, cap = StrokeCap.Round)
      val inset = stroke / 2
      val arcSize = androidx.compose.ui.geometry.Size(this.size.width - stroke, this.size.height - stroke)
      val topLeft = androidx.compose.ui.geometry.Offset(inset, inset)
      drawArc(Iron.BorderSubtle, 0f, 360f, useCenter = false, topLeft = topLeft, size = arcSize, style = style)
      drawArc(Iron.Ember, -90f, 360f * animated, useCenter = false, topLeft = topLeft, size = arcSize, style = style)
    }
    content()
  }
}

/** Thin ember progress bar. */
@Composable
fun ProgressLine(progress: Float, modifier: Modifier = Modifier, color: Color = Iron.Ember, track: Color = Iron.BorderSubtle) {
  val animated by animateFloatAsState(progress.coerceIn(0f, 1f), label = "progress")
  Box(
    modifier = modifier
      .fillMaxWidth()
      .heightIn(min = 6.dp, max = 6.dp)
      .clip(CircleShape)
      .background(track),
  ) {
    Box(
      modifier = Modifier
        .fillMaxWidth(animated)
        .heightIn(min = 6.dp, max = 6.dp)
        .clip(CircleShape)
        .background(color),
    )
  }
}
