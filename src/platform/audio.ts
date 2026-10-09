/**
 * Pure Web Audio API Synthesizer (Zero External Audio Files)
 * Generates beeps, high tone signals, card clicks, and rich resonant bell/gong.
 */

let audioCtx: AudioContext | null = null;
let soundEnabled = true;

export function initAudio(): AudioContext | null {
  if (typeof window === 'undefined') return null;

  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!audioCtx && AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  } catch (e) {
    console.warn('Web Audio API not supported or blocked:', e);
    return null;
  }
}

export function setSoundEnabled(enabled: boolean) {
  soundEnabled = enabled;
}

export function isSoundEnabled(): boolean {
  return soundEnabled;
}

/**
 * Standard short countdown beep (e.g. for seconds 3 and 2)
 */
export function playCountdownBeep(freq: number = 660, duration: number = 0.12) {
  if (!soundEnabled) return;
  const ctx = initAudio();
  if (!ctx) return;

  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, ctx.currentTime);

    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
  } catch (err) {
    // Ignore audio errors silently
  }
}

/**
 * Final 1-second countdown alert beep (higher pitch)
 */
export function playCountdownFinalBeep() {
  playCountdownBeep(980, 0.2);
}

/**
 * Resonant metallic gong/bell for completing sets, rest finish, or Red Joker plank
 */
export function playGong() {
  if (!soundEnabled) return;
  const ctx = initAudio();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.35, now);
    masterGain.gain.exponentialRampToValueAtTime(0.0001, now + 2.5);
    masterGain.connect(ctx.destination);

    // Harmonic frequencies for rich iron bell sound
    const harmonics = [220, 440, 660, 880, 1320];
    harmonics.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();

      osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq + (Math.random() * 4 - 2), now);

      const amp = 0.3 / (idx + 1);
      oscGain.gain.setValueAtTime(amp, now);
      oscGain.gain.exponentialRampToValueAtTime(0.001, now + (2.5 - idx * 0.3));

      osc.connect(oscGain);
      oscGain.connect(masterGain);

      osc.start(now);
      osc.stop(now + 2.6);
    });
  } catch (err) {
    // Ignore
  }
}

/**
 * Tactile snappy click for flipping card
 */
export function playCardDealSound() {
  if (!soundEnabled) return;
  const ctx = initAudio();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.08);

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.08);
  } catch (err) {
    // Ignore
  }
}

export const playCardSound = playCardDealSound;
export const playWorkoutCompleteSound = playGong;
