import React, { useEffect } from 'react';
import { Award, RotateCcw, Home, Dumbbell, Flame, CheckCircle2 } from 'lucide-react';
import { Exercise, SessionConfig, Suit } from '../../types';
import { Language, translations } from '../../data/translations';
import { formatDuration } from '../../engine/scoring';
import { saveWorkoutToHistory } from '../../platform/storage';

interface SummaryScreenProps {
  summary: {
    durationSeconds: number;
    completedCards: number;
    totalCards: number;
    totalReps: number;
    suitReps: Record<Suit, number>;
    totalTonnageKg: number;
    jokersCompleted: number;
  };
  config: SessionConfig;
  exercises: Exercise[];
  onRestart: () => void;
  onGoHome: () => void;
  lang: Language;
}

export const SummaryScreen: React.FC<SummaryScreenProps> = ({
  summary,
  config,
  exercises,
  onRestart,
  onGoHome,
  lang,
}) => {
  const t = translations[lang];

  // Save to IndexedDB upon mounting
  useEffect(() => {
    const entry = {
      id: `workout_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: Date.now(),
      durationSeconds: summary.durationSeconds,
      mode: config.mode,
      beast: config.beast,
      totalCards: summary.totalCards,
      completedCards: summary.completedCards,
      totalReps: summary.totalReps,
      suitReps: summary.suitReps,
      totalTonnageKg: summary.totalTonnageKg,
      jokersCompleted: summary.jokersCompleted,
    };
    saveWorkoutToHistory(entry);
  }, [summary, config]);

  const suitsList: { suit: Suit; symbol: string; color: string; border: string; bg: string }[] = [
    {
      suit: 'S',
      symbol: '♠',
      color: 'text-zinc-100',
      border: 'border-zinc-700',
      bg: 'bg-zinc-950/80',
    },
    {
      suit: 'H',
      symbol: '♥',
      color: 'text-red-500',
      border: 'border-red-900/60',
      bg: 'bg-red-950/20',
    },
    {
      suit: 'D',
      symbol: '♦',
      color: 'text-red-500',
      border: 'border-red-900/60',
      bg: 'bg-red-950/20',
    },
    {
      suit: 'C',
      symbol: '♣',
      color: 'text-zinc-100',
      border: 'border-zinc-700',
      bg: 'bg-zinc-950/80',
    },
  ];

  const getExerciseForSuit = (suit: Suit) => {
    const load = config.loads[suit];
    if (load) {
      const found = exercises.find((e) => e.id === load.exerciseId);
      if (found) return found;
    }
    return exercises.find((e) => e.suit === suit);
  };

  return (
    <div className="w-full max-w-md mx-auto p-4 space-y-6 pb-20 select-none animate-in fade-in duration-300">
      {/* Header Trophy Banner */}
      <div className="text-center pt-4 space-y-2">
        <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br from-red-600 to-amber-600 flex items-center justify-center text-white shadow-2xl shadow-red-950/80 border border-red-400/40">
          <Award className="w-10 h-10" />
        </div>
        <h1 className="text-3xl font-black text-white tracking-tight">{t.congratulations}</h1>
        <p className="text-xs text-zinc-400 max-w-xs mx-auto leading-relaxed">{t.congratsDesc}</p>
        {config.beast && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-950/80 border border-red-600 text-red-400 text-xs font-bold uppercase mt-1">
            <Flame className="w-3.5 h-3.5 fill-red-500" />
            ★ BEAST MODE CLEARED
          </div>
        )}
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-zinc-900/90 border border-zinc-800 p-4 rounded-3xl text-center shadow-lg">
          <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">
            {t.sessionTime}
          </span>
          <div className="text-2xl font-black text-white mt-1 tabular-nums">
            {formatDuration(summary.durationSeconds)}
          </div>
        </div>

        <div className="bg-zinc-900/90 border border-zinc-800 p-4 rounded-3xl text-center shadow-lg">
          <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">
            {t.cardsCompleted}
          </span>
          <div className="text-2xl font-black text-red-500 mt-1 tabular-nums">
            {summary.completedCards} / {summary.totalCards}
          </div>
        </div>

        <div className="bg-zinc-900/90 border border-zinc-800 p-4 rounded-3xl text-center shadow-lg">
          <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">
            {t.totalReps}
          </span>
          <div className="text-2xl font-black text-white mt-1 tabular-nums">
            {summary.totalReps}
          </div>
        </div>

        {summary.totalTonnageKg > 0 ? (
          <div className="bg-zinc-900/90 border border-zinc-800 p-4 rounded-3xl text-center shadow-lg">
            <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">
              {t.totalTonnage}
            </span>
            <div className="text-2xl font-black text-amber-400 mt-1 tabular-nums">
              {summary.totalTonnageKg} {lang === 'ru' ? 'кг' : 'kg'}
            </div>
          </div>
        ) : (
          <div className="bg-zinc-900/90 border border-zinc-800 p-4 rounded-3xl text-center shadow-lg">
            <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">
              {t.jokersCount}
            </span>
            <div className="text-2xl font-black text-emerald-400 mt-1 tabular-nums">
              {summary.jokersCompleted}
            </div>
          </div>
        )}
      </div>

      {/* Breakdown By Exercises / Suits */}
      <div className="bg-zinc-900/80 border border-zinc-800 p-4 rounded-3xl space-y-3">
        <div className="text-xs font-bold uppercase tracking-wider text-zinc-400">
          {lang === 'ru' ? 'Повторения по упражнениям' : 'Reps by Exercise'}
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          {suitsList.map((s) => {
            const exercise = getExerciseForSuit(s.suit);
            const exerciseName = exercise
              ? lang === 'ru'
                ? exercise.nameRu
                : exercise.nameEn
              : s.suit;
            return (
              <div
                key={s.suit}
                className={`${s.bg} border ${s.border} p-3 rounded-2xl flex flex-col justify-between`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-xl font-black ${s.color}`}>{s.symbol}</span>
                  <span className="text-xl font-black text-white tabular-nums">
                    {summary.suitReps[s.suit] || 0}
                  </span>
                </div>
                <div className="text-xs font-bold text-zinc-200 mt-2 line-clamp-2 leading-tight">
                  {exerciseName}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Buttons */}
      <div className="space-y-3 pt-2">
        <button
          onClick={onRestart}
          className="w-full py-4 px-6 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-black text-sm uppercase tracking-wider shadow-2xl shadow-red-950/80 border border-red-500/40 flex items-center justify-center gap-2 transition active:scale-98"
        >
          <RotateCcw className="w-4 h-4" />
          <span>{t.workoutAgain}</span>
        </button>

        <button
          onClick={onGoHome}
          className="w-full py-3.5 px-6 rounded-2xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition active:scale-98"
        >
          <Home className="w-4 h-4" />
          <span>{t.backToTable}</span>
        </button>
      </div>
    </div>
  );
};
