import React, { useEffect, useState, useRef } from 'react';
import { Play, Pause, CheckCircle2, Flame } from 'lucide-react';
import { playCountdownBeep, playCountdownFinalBeep, playGong } from '../../platform/audio';
import { triggerCountdownHaptic, triggerGongHaptic } from '../../platform/haptics';
import { Language, translations } from '../../data/translations';
import { getRedJokerDurations } from '../../engine/jokers';

interface RedJokerModalProps {
  beast: boolean;
  initialDuration?: number;
  onComplete: () => void;
  lang: Language;
}

export const RedJokerModal: React.FC<RedJokerModalProps> = ({
  beast,
  initialDuration,
  onComplete,
  lang,
}) => {
  const t = translations[lang];
  const selectedDuration = initialDuration || (beast ? 120 : 60);
  const [remaining, setRemaining] = useState<number>(selectedDuration);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isFinished, setIsFinished] = useState<boolean>(false);

  const endTimeRef = useRef<number>(0);
  const pausedTimeRef = useRef<number>(selectedDuration);
  const beepedSecondsRef = useRef<Set<number>>(new Set());

  const startTimer = () => {
    endTimeRef.current = Date.now() + remaining * 1000;
    setIsRunning(true);
    beepedSecondsRef.current.clear();
  };

  const pauseTimer = () => {
    pausedTimeRef.current = remaining;
    setIsRunning(false);
  };

  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const timeLeft = Math.max(0, Math.ceil((endTimeRef.current - now) / 1000));
      setRemaining(timeLeft);

      if (timeLeft <= 3 && timeLeft > 0 && !beepedSecondsRef.current.has(timeLeft)) {
        beepedSecondsRef.current.add(timeLeft);
        if (timeLeft === 1) {
          playCountdownFinalBeep();
        } else {
          playCountdownBeep(700);
        }
        triggerCountdownHaptic();
      }

      if (timeLeft <= 0) {
        clearInterval(interval);
        setIsRunning(false);
        setIsFinished(true);
        playGong();
        triggerGongHaptic();
      }
    }, 100);

    return () => clearInterval(interval);
  }, [isRunning]);

  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  const timeFormatted = `${mins}:${secs.toString().padStart(2, '0')}`;

  const progress = Math.max(
    0,
    Math.min(100, Math.round(((selectedDuration - remaining) / selectedDuration) * 100))
  );

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-between bg-zinc-950/98 p-6 text-white animate-in zoom-in-95 duration-200">
      {/* Top Header */}
      <div className="w-full max-w-sm pt-4 text-center">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-950/80 border border-red-600/60 text-red-400 text-xs font-black tracking-widest uppercase mb-2">
          <Flame className="w-4 h-4 fill-red-500 text-red-500 animate-pulse" />
          <span>{t.redJokerTitle}</span>
        </div>
        <h2 className="text-2xl font-black text-white tracking-tight">
          {lang === 'ru' ? 'Планка на предплечьях' : 'Forearm Plank'}
        </h2>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-950/80 border border-red-600/60 text-xs font-black text-red-400 mt-2">
          <span>{selectedDuration >= 60 ? `${Math.round(selectedDuration / 60)} ${t.minutesShort}` : `${selectedDuration} ${t.secondsShort}`}</span>
          {beast && <span>• BEAST MODE</span>}
        </div>
      </div>

      {/* Massive Timer Ring */}
      <div className="relative flex flex-col items-center justify-center my-auto">
        <div className="relative w-64 h-64 sm:w-72 sm:h-72 flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="44"
              className="text-zinc-900"
              strokeWidth="6"
              stroke="currentColor"
              fill="transparent"
            />
            <circle
              cx="50"
              cy="50"
              r="44"
              className="text-red-500 transition-all duration-300 ease-linear"
              strokeWidth="6"
              strokeDasharray={276.46}
              strokeDashoffset={276.46 * (1 - progress / 100)}
              strokeLinecap="round"
              stroke="currentColor"
              fill="transparent"
            />
          </svg>

          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-6xl sm:text-7xl font-black tracking-tighter tabular-nums select-none">
              {timeFormatted}
            </span>
            <span className="text-xs uppercase font-extrabold tracking-widest text-zinc-400 mt-2">
              {isFinished
                ? t.plankDone
                : isRunning
                ? lang === 'ru'
                  ? 'Держи форму!'
                  : 'Hold Tight!'
                : lang === 'ru'
                ? 'Готов к старту'
                : 'Ready'}
            </span>
          </div>
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="w-full max-w-sm pb-6 space-y-3">
        {!isFinished ? (
          <button
            onClick={isRunning ? pauseTimer : startTimer}
            className={`w-full flex items-center justify-center gap-2 py-4 px-6 rounded-2xl font-black text-sm uppercase tracking-wider shadow-xl transition active:scale-98 ${
              isRunning
                ? 'bg-zinc-900 border border-zinc-700 text-zinc-200'
                : 'bg-red-600 hover:bg-red-500 text-white shadow-red-950/60'
            }`}
          >
            {isRunning ? (
              <>
                <Pause className="w-5 h-5" />
                <span>{t.pause}</span>
              </>
            ) : (
              <>
                <Play className="w-5 h-5 fill-white" />
                <span>{t.startPlank}</span>
              </>
            )}
          </button>
        ) : (
          <button
            onClick={onComplete}
            className="w-full flex items-center justify-center gap-2 py-4 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm uppercase tracking-wider shadow-xl shadow-emerald-950/60 transition active:scale-98"
          >
            <CheckCircle2 className="w-5 h-5" />
            <span>{t.completeTask}</span>
          </button>
        )}

        {/* Premature finish / pass button if needed */}
        {!isFinished && (
          <button
            onClick={() => {
              playGong();
              onComplete();
            }}
            className="w-full text-center text-xs font-semibold text-zinc-400 hover:text-zinc-200 transition py-1"
          >
            {lang === 'ru' ? 'Зачесть досрочно' : 'Complete Early'}
          </button>
        )}
      </div>
    </div>
  );
};
