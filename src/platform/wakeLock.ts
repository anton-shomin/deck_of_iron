/**
 * Screen Wake Lock API wrapper
 */

let wakeLockSentinel: any = null;
let isRequested = false;

export async function requestWakeLock(): Promise<boolean> {
  if (typeof window === 'undefined' || !('wakeLock' in navigator)) {
    return false;
  }

  try {
    isRequested = true;
    if (!wakeLockSentinel) {
      wakeLockSentinel = await (navigator as any).wakeLock.request('screen');
      wakeLockSentinel.addEventListener('release', () => {
        wakeLockSentinel = null;
      });
    }
    return true;
  } catch (err) {
    console.warn('Wake Lock request failed:', err);
    return false;
  }
}

export async function releaseWakeLock(): Promise<void> {
  isRequested = false;
  if (wakeLockSentinel) {
    try {
      await wakeLockSentinel.release();
    } catch {
      // Ignore
    } finally {
      wakeLockSentinel = null;
    }
  }
}

// Automatically re-request wake lock when returning to tab
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', async () => {
    if (document.visibilityState === 'visible' && isRequested && !wakeLockSentinel) {
      await requestWakeLock();
    }
  });
}

export function isWakeLockSupported(): boolean {
  return typeof navigator !== 'undefined' && 'wakeLock' in navigator;
}
