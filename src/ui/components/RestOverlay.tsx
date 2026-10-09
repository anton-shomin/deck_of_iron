import React, { useEffect, useState, useRef } from 'react';
import { FastForward, Pause, Play } from 'lucide-react';
import { playCountdownBeep, playCountdownFinalBeep, playGong } from '../../platform/audio';
import { triggerCountdownHaptic, triggerGongHaptic } from '../../platform/haptics';
import { Language, translations } from '../../data/translations';

interface RestOverlayProps {
  totalSeconds: number;
  onFinish: () => void;
  onSkip: () => void;
  lang: Language;
}

export const RestOverlay: React.FC<RestOverlayProps> = ({
  totalSeconds,
  onFinish,
  onSkip,
  lang,
}) => {
  const t = translations[lang];
  const [remaining, setRemaining] = useState<number>(totalSeconds);
  const [isPaused, setIsPaused] = useState<boolean>(false);

  // Store start reference based on Date.now()
  const endTimeRef = useRef<number>(Date.now() + totalSeconds * 1000);
  const pausedTimeRemainingRef = useRef<number>(totalSeconds);
  const beepedSecondsRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const timeLeft = Math.max(0, Math.ceil((endTimeRef.current - now) / 1000));
      setRemaining(timeLeft);

      // Play beeps at exactly 3, 2, 1 seconds
      if (timeLeft <= 3 && timeLeft > 0 && !beepedSecondsRef.current.has(timeLeft)) {
        beepedSecondsRef.current.add(timeLeft);
        if (timeLeft === 1) {
          playCountdownFinalBeep();
        } else {
          playCountdownBeep(720);
        }
        triggerCountdownHaptic();
      }

      if (timeLeft <= 0) {
        clearInterval(interval);
        playGong();
        triggerGongHaptic();
        onFinish();
      }
    }, 100);

    return () => clearInterval(interval);
  }, [isPaused, onFinish]);

  const togglePause = () => {
    if (!isPaused) {
      pausedTimeRemainingRef.current = remaining;
      setIsPaused(true);
    } else {
      endTimeRef.current = Date.now() + pausedTimeRemainingRef.current * 1000;
      setIsPaused(false);
    }
  };

  const progressPercent = Math.max(
    0,
    Math.min(100, Math.round(((totalSeconds - remaining) / totalSeconds) * 100))
  );

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-between bg-zinc-950/95 backdrop-blur-md p-6 text-white animate-in fade-in duration-150">
      {/* Top Bar */}
      <div className="w-full max-w-sm flex items-center justify-between pt-4">
        <span className="text-xs uppercase font-extrabold tracking-widest text-zinc-400">
          {t.restTime}
        </span>
        <button
          onClick={togglePause}
          className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white transition"
        >
          {isPaused ? <Play className="w-4 h-4 text-emerald-400" /> : <Pause className="w-4 h-4" />}
        </button>
      </div>

      {/* Center Huge Countdown Ring */}
      <div className="relative flex flex-col items-center justify-center my-auto">
        {/* Subtle Ring */}
        <div className="relative w-56 h-56 sm:w-64 sm:h-64 flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="44"
              className="text-zinc-800"
              strokeWidth="6"
              stroke="currentColor"
              fill="transparent"
            />
            <circle
              cx="50"
              cy="50"
              r="44"
              className="text-red-600 transition-all duration-300 ease-linear"
              strokeWidth="6"
              strokeDasharray={276.46}
              strokeDashoffset={276.46 * (1 - progressPercent / 100)}
              strokeLinecap="round"
              stroke="currentColor"
              fill="transparent"
            />
          </svg>

          {/* Numbers inside */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span
              className={`font-black tracking-tighter tabular-nums select-none transition-transform ${
                remaining <= 3 ? 'text-8xl text-red-500 scale-110' : 'text-7xl sm:text-8xl text-white'
              }`}
            >
              {remaining}
            </span>
            <span className="text-xs font-bold uppercase tracking-widest text-zinc-400 mt-1">
              {t.secondsShort}
            </span>
          </div>
        </div>

        {isPaused && (
          <div className="mt-4 px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-bold uppercase tracking-wider">
            {t.pause}
          </div>
        )}
      </div>

      {/* Bottom Skip Button */}
      <div className="w-full max-w-sm pb-6">
        <button
          onClick={onSkip}
          className="w-full flex items-center justify-center gap-2 py-4 px-6 rounded-2xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 text-white font-extrabold text-sm uppercase tracking-wider shadow-lg transition active:scale-98"
        >
          <span>{t.skipRest}</span>
          <FastForward className="w-4 h-4 text-red-400" />
        </button>
      </div>
    </div>
  );
};
