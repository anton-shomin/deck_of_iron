/**
 * Safe Vibration / Haptic Feedback wrapper
 */

export function triggerHaptic(pattern: number | number[] = 30) {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return;

  try {
    if ('vibrate' in navigator && typeof navigator.vibrate === 'function') {
      navigator.vibrate(pattern);
    }
  } catch (e) {
    // Silently ignore in iOS Safari or restricted environments
  }
}

export function triggerCardHaptic() {
  triggerHaptic([35, 40, 20]);
}

export function triggerCountdownHaptic() {
  triggerHaptic(25);
}

export function triggerGongHaptic() {
  triggerHaptic([100, 50, 150]);
}

export function triggerHapticFeedback(type?: string) {
  if (type === 'notificationSuccess') {
    triggerGongHaptic();
  } else {
    triggerCardHaptic();
  }
}
