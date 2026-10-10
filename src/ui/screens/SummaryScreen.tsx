import React, { useEffect } from 'react';
import { Exercise, SessionConfig, Suit } from '../../types';
import { Language, translations } from '../../data/translations';
import { formatDuration } from '../../engine/scoring';
import { saveWorkoutToHistory } from '../../platform/storage';
import { PrimaryButton, OutlineButton } from '../components/ui';

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

  // Save to IndexedDB/localStorage upon mounting
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

  // Suits config mapping matching design
  const suitsList: { suit: Suit; symbol: string; isRed: boolean }[] = [
    { suit: 'S', symbol: '♠', isRed: false },
    { suit: 'H', symbol: '♥', isRed: true },
    { suit: 'D', symbol: '♦', isRed: true },
    { suit: 'C', symbol: '♣', isRed: false },
  ];

  const getExerciseForSuit = (suit: Suit) => {
    const load = config.loads[suit];
    if (load) {
      const found = exercises.find((e) => e.id === load.exerciseId);
      if (found) return found;
    }
    return exercises.find((e) => e.suit === suit);
  };

  // Calculate max tonnage/reps among suits to render progress bar percentages
  const maxSuitTonnageOrReps = Math.max(
    ...suitsList.map((s) => {
      const reps = summary.suitReps[s.suit] || 0;
      const load = config.loads[s.suit];
      if (config.mode === 'KETTLEBELL' && load) {
        return reps * load.kg * load.count;
      }
      return reps;
    }),
    1
  );

  return (
    <div className="w-full max-w-md mx-auto px-4 pt-4 pb-12 space-y-6 select-none animate-in fade-in duration-300">
      {/* 1. TOP HEADER TITLE */}
      <div className="space-y-1">
        <div className="font-display text-sm font-bold tracking-widest text-[#9C9388] uppercase">
          {lang === 'ru' ? 'ТРЕНИРОВКА ЗАВЕРШЕНА' : 'WORKOUT COMPLETED'}
        </div>

        {/* Hero Metric */}
        {config.mode === 'KETTLEBELL' && summary.totalTonnageKg > 0 ? (
          <div className="pt-2">
            <div className="font-display text-7xl sm:text-8xl font-black text-[#F2EFE9] tracking-tighter leading-none flex items-baseline gap-2">
              <span>{summary.totalTonnageKg.toLocaleString()}</span>
              <span className="text-3xl sm:text-4xl text-[#E85324] font-black">
                {lang === 'ru' ? 'КГ' : 'KG'}
              </span>
            </div>
            <div className="text-xs text-[#9C9388] font-medium uppercase tracking-wider mt-1">
              {lang === 'ru' ? 'поднято за сессию' : 'lifted during session'}
            </div>
          </div>
        ) : (
          <div className="pt-2">
            <div className="font-display text-7xl sm:text-8xl font-black text-[#F2EFE9] tracking-tighter leading-none flex items-baseline gap-2">
              <span>{summary.totalReps}</span>
              <span className="text-3xl sm:text-4xl text-[#E85324] font-black">
                {lang === 'ru' ? 'ПОВТ' : 'REPS'}
              </span>
            </div>
            <div className="text-xs text-[#9C9388] font-medium uppercase tracking-wider mt-1">
              {lang === 'ru' ? 'выполнено за сессию' : 'completed during session'}
            </div>
          </div>
        )}
      </div>

      <div className="w-full h-px bg-[#2B2722]" />

      {/* 2. THREE KEY METRICS ROW */}
      <div className="grid grid-cols-3 gap-2 text-left">
        <div>
          <div className="font-display text-3xl font-black text-[#F2EFE9] tabular-nums leading-none">
            {formatDuration(summary.durationSeconds)}
          </div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-[#9C9388] mt-1">
            {lang === 'ru' ? 'ВРЕМЯ' : 'TIME'}
          </div>
        </div>

        <div>
          <div className="font-display text-3xl font-black text-[#F2EFE9] tabular-nums leading-none">
            {summary.completedCards}
          </div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-[#9C9388] mt-1">
            {lang === 'ru' ? 'КАРТЫ' : 'CARDS'}
          </div>
        </div>

        <div>
          <div className="font-display text-3xl font-black text-[#F2EFE9] tabular-nums leading-none">
            {summary.totalReps}
          </div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-[#9C9388] mt-1">
            {lang === 'ru' ? 'ПОВТОРОВ' : 'REPS'}
          </div>
        </div>
      </div>

      <div className="w-full h-px bg-[#2B2722]" />

      {/* 3. EXERCISE BREAKDOWN LIST WITH PROGRESS BARS */}
      <div className="space-y-4">
        {suitsList.map((s) => {
          const exercise = getExerciseForSuit(s.suit);
          const exerciseName = exercise
            ? lang === 'ru'
              ? exercise.nameRu
              : exercise.nameEn
            : s.suit;

          const reps = summary.suitReps[s.suit] || 0;
          const load = config.loads[s.suit];

          const valueTonnage =
            config.mode === 'KETTLEBELL' && load ? reps * load.kg * load.count : 0;

          const percent = Math.min(
            100,
            Math.round(
              ((config.mode === 'KETTLEBELL' ? valueTonnage : reps) / maxSuitTonnageOrReps) *
                100
            )
          );

          return (
            <div key={s.suit} className="space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className="text-lg font-black"
                    style={{ color: s.isRed ? '#D92626' : '#F2EFE9' }}
                  >
                    {s.symbol}
                  </span>
                  <span className="font-display text-base font-bold text-[#F2EFE9] uppercase">
                    {exerciseName}
                  </span>
                </div>

                <div className="font-display text-base font-bold text-[#F2EFE9] tabular-nums">
                  {config.mode === 'KETTLEBELL' && valueTonnage > 0
                    ? `${valueTonnage.toLocaleString()} ${lang === 'ru' ? 'кг' : 'kg'}`
                    : `${reps} ${lang === 'ru' ? 'повт' : 'reps'}`}
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full h-1.5 bg-[#1C1917] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${percent}%`,
                    backgroundColor: s.isRed ? '#E85324' : '#E8E2D5',
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* 4. ACTION BUTTONS */}
      <div className="space-y-2.5 pt-4">
        <PrimaryButton onClick={onRestart}>
          {lang === 'ru' ? 'ЕЩЁ РАЗ' : 'AGAIN'}
        </PrimaryButton>

        <OutlineButton onClick={onGoHome}>
          {lang === 'ru' ? 'НА ГЛАВНЫЙ' : 'MAIN MENU'}
        </OutlineButton>
      </div>
    </div>
  );
};
