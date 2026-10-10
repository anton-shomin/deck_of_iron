import React, { useState, useEffect, useRef } from 'react';
import { Info, X } from 'lucide-react';
import { Card, Exercise, SessionConfig, Suit } from '../../types';
import { Language, translations } from '../../data/translations';
import {
  calculateCardTonnage,
  formatDuration,
  formatWeight,
} from '../../engine/scoring';
import { getSideRuleNote } from '../../engine/deck';
import { RestOverlay } from '../components/RestOverlay';
import { RedJokerModal } from '../components/RedJokerModal';
import { BlackJokerModal } from '../components/BlackJokerModal';
import { ExerciseModal } from '../components/ExerciseModal';
import { playCardSound, playWorkoutCompleteSound } from '../../platform/audio';
import { triggerHapticFeedback } from '../../platform/haptics';
import { saveActiveSession, clearActiveSession } from '../../platform/storage';
import { PlayingCard, PrimaryButton } from '../components/ui';

interface WorkoutHUDProps {
  deck: Card[];
  initialIndex?: number;
  initialElapsedSeconds?: number;
  initialStats?: {
    totalReps?: number;
    totalTonnage?: number;
    suitReps?: Record<Suit, number>;
    jokersCompleted?: number;
  };
  config: SessionConfig;
  exercises: Exercise[];
  onFinishWorkout: (summary: {
    durationSeconds: number;
    completedCards: number;
    totalCards: number;
    totalReps: number;
    suitReps: Record<Suit, number>;
    totalTonnageKg: number;
    jokersCompleted: number;
  }) => void;
  onQuitWorkout: () => void;
  lang: Language;
}

export const WorkoutHUD: React.FC<WorkoutHUDProps> = ({
  deck,
  initialIndex = 0,
  initialElapsedSeconds = 0,
  initialStats,
  config,
  exercises,
  onFinishWorkout,
  onQuitWorkout,
  lang,
}) => {
  const t = translations[lang];

  // Active session tracking state
  const [currentIndex, setCurrentIndex] = useState<number>(initialIndex);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(initialElapsedSeconds);
  const [showRestOverlay, setShowRestOverlay] = useState<boolean>(false);
  const [showJokerModal, setShowJokerModal] = useState<boolean>(false);
  const [inspectExercise, setInspectExercise] = useState<Exercise | null>(null);
  const [showQuitConfirm, setShowQuitConfirm] = useState<boolean>(false);

  // Accumulated stats tracking
  const [accumulatedReps, setAccumulatedReps] = useState<number>(
    initialStats?.totalReps || 0
  );
  const [accumulatedTonnage, setAccumulatedTonnage] = useState<number>(
    initialStats?.totalTonnage || 0
  );
  const [accumulatedSuitReps, setAccumulatedSuitReps] = useState<Record<Suit, number>>(
    initialStats?.suitReps || { S: 0, H: 0, D: 0, C: 0 }
  );
  const [accumulatedJokers, setAccumulatedJokers] = useState<number>(
    initialStats?.jokersCompleted || 0
  );

  // Timer interval reference
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Current Card & Exercise
  const currentCard = deck[currentIndex] || null;

  const currentExercise = React.useMemo(() => {
    if (!currentCard || !currentCard.suit) return null;
    const load = config.loads[currentCard.suit];
    if (load && load.exerciseId) {
      const found = exercises.find((e) => e.id === load.exerciseId);
      if (found) return found;
    }
    return exercises.find((e) => e.suit === currentCard.suit) || null;
  }, [currentCard, config.loads, exercises]);

  const currentLoad = currentCard?.suit ? config.loads[currentCard.suit] : null;

  // Active Side Rules & Notes
  const sideRuleNote = React.useMemo(() => {
    if (!currentCard || !currentExercise) return null;
    return getSideRuleNote(currentCard, currentExercise, lang);
  }, [currentCard, currentExercise, lang]);

  // Main Session Elapsed Timer
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Save progress on card flip
  useEffect(() => {
    saveActiveSession({
      config,
      deck,
      currentIndex,
      startTimestamp: Date.now() - elapsedSeconds * 1000,
      elapsedSeconds,
      totalRepsAccumulated: accumulatedReps,
      totalTonnageAccumulated: accumulatedTonnage,
      suitRepsAccumulated: accumulatedSuitReps,
      jokersCompleted: accumulatedJokers,
    });
  }, [
    currentIndex,
    elapsedSeconds,
    accumulatedReps,
    accumulatedTonnage,
    accumulatedSuitReps,
    accumulatedJokers,
    config,
    deck,
  ]);

  // Handle card advancement
  const advanceCard = (jokerStatsExtra?: { reps?: number; tonnageKg?: number }) => {
    if (!currentCard) return;

    let cardReps = 0;
    let cardTonnage = 0;

    if (currentCard.rank === 'JOKER') {
      setAccumulatedJokers((prev) => prev + 1);
      if (jokerStatsExtra) {
        cardReps = jokerStatsExtra.reps || 0;
        cardTonnage = jokerStatsExtra.tonnageKg || 0;
      }
    } else if (currentCard.suit) {
      cardReps = currentCard.reps;
      cardTonnage = calculateCardTonnage(currentCard, config);

      setAccumulatedSuitReps((prev) => ({
        ...prev,
        [currentCard.suit!]: (prev[currentCard.suit!] || 0) + cardReps,
      }));
    }

    setAccumulatedReps((prev) => prev + cardReps);
    setAccumulatedTonnage((prev) => prev + cardTonnage);

    const nextIndex = currentIndex + 1;

    // Check if workout completed
    if (nextIndex >= deck.length) {
      clearActiveSession();
      playWorkoutCompleteSound();
      triggerHapticFeedback('SUCCESS');

      onFinishWorkout({
        durationSeconds: elapsedSeconds,
        completedCards: deck.length,
        totalCards: deck.length,
        totalReps: accumulatedReps + cardReps,
        suitReps: currentCard.suit
          ? {
              ...accumulatedSuitReps,
              [currentCard.suit]: (accumulatedSuitReps[currentCard.suit] || 0) + cardReps,
            }
          : accumulatedSuitReps,
        totalTonnageKg: accumulatedTonnage + cardTonnage,
        jokersCompleted: currentCard.rank === 'JOKER' ? accumulatedJokers + 1 : accumulatedJokers,
      });
      return;
    }

    playCardSound();
    triggerHapticFeedback('MEDIUM');

    setCurrentIndex(nextIndex);
  };

  // Handle "ГОТОВО" button tap
  const handleDoneClick = () => {
    if (!currentCard) return;

    if (currentCard.rank === 'JOKER') {
      setShowJokerModal(true);
      return;
    }

    if (config.restSeconds && config.restSeconds > 0) {
      setShowRestOverlay(true);
    } else {
      advanceCard();
    }
  };

  // Handle quit confirm
  const handleQuitConfirm = () => {
    clearActiveSession();
    onQuitWorkout();
  };

  const progressPercent = deck.length > 0 ? Math.round((currentIndex / deck.length) * 100) : 0;

  return (
    <div className="flex-1 max-w-md w-full mx-auto px-4 pt-2 pb-6 flex flex-col justify-between select-none">
      {/* 1. TOP STATUS BAR (PROGRESS & TIMER) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          {/* Card counter */}
          <div className="flex items-center gap-2">
            <span className="font-display text-2xl font-black text-[#F2EFE9] tracking-wider tabular-nums">
              {currentIndex + 1}
            </span>
            <span className="text-xs text-[#9C9388] font-bold">/ {deck.length}</span>
          </div>

          {/* Timer Display */}
          <div className="bg-[#181614] border border-[#2B2722] px-3.5 py-1.5 rounded-full font-display text-base font-bold text-[#F2EFE9] tabular-nums">
            {formatDuration(elapsedSeconds)}
          </div>

          {/* Quit Button */}
          <button
            onClick={() => setShowQuitConfirm(true)}
            className="w-9 h-9 rounded-xl bg-[#1C1917] hover:bg-[#24201D] border border-[#2B2722] text-[#9C9388] hover:text-white flex items-center justify-center transition active:scale-95"
            aria-label="Quit workout"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-1.5 bg-[#2B2722] rounded-full overflow-hidden">
          <div
            className="h-full bg-[#E85324] transition-all duration-300 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* 2. MAIN PLAYING CARD AREA */}
      <div className="my-auto py-3 flex flex-col items-center space-y-3">
        {currentCard?.rank === 'JOKER' ? (
          /* JOKER CARD DISPLAY */
          <div
            onClick={handleDoneClick}
            className="w-full max-w-[310px] aspect-[5/7] rounded-3xl bg-[#181614] border-2 border-[#E85324] p-6 flex flex-col justify-between shadow-2xl text-center cursor-pointer active:scale-[0.98] transition"
          >
            <div className="flex items-center justify-between">
              <span className="font-display text-2xl font-black text-[#E85324]">JOKER</span>
              <span className="text-xl">★</span>
            </div>
            <div className="my-auto space-y-2">
              <div className="text-6xl">★</div>
              <h2 className="font-display text-2xl font-black text-white uppercase">
                {currentCard.jokerColor === 'RED'
                  ? lang === 'ru'
                    ? 'КРАСНЫЙ ДЖОКЕР'
                    : 'RED JOKER'
                  : lang === 'ru'
                  ? 'ЧЁРНЫЙ ДЖОКЕР'
                  : 'BLACK JOKER'}
              </h2>
            </div>
            <div className="py-2.5 bg-[#E85324] rounded-2xl text-xs font-bold text-white uppercase tracking-wider">
              {lang === 'ru' ? 'Нажмите для старта' : 'Tap to Start'}
            </div>
          </div>
        ) : (
          /* STANDARD PLAYING CARD PRIMITIVE */
          <PlayingCard
            rank={currentCard?.rank || ''}
            suit={currentCard?.suit || 'S'}
            onClick={handleDoneClick}
            className="cursor-pointer active:scale-[0.98] transition"
            footerTag={
              currentExercise ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setInspectExercise(currentExercise);
                  }}
                  className="p-1.5 rounded-lg bg-[#1A1A1A]/10 hover:bg-[#1A1A1A]/20 text-[#1A1A1A] transition"
                  title={t.exerciseDetails}
                >
                  <Info className="w-4 h-4" />
                </button>
              ) : undefined
            }
          >
            {/* Giant Reps Number */}
            <div className="font-display text-8xl sm:text-9xl font-black tracking-tighter text-[#1A1A1A] leading-none tabular-nums">
              {currentCard?.reps}
            </div>

            {/* Reps Subtitle */}
            <div className="text-[10px] font-black uppercase tracking-widest text-[#7A7367] mt-1">
              {t.reps}
            </div>

            {/* Exercise Name */}
            {currentExercise && (
              <div className="font-display text-2xl font-black text-[#1A1A1A] uppercase tracking-wide pt-3 leading-none">
                {lang === 'ru' ? currentExercise.nameRu : currentExercise.nameEn}
              </div>
            )}

            {/* Kettlebell Weight Breakdown */}
            {config.mode === 'KETTLEBELL' && currentLoad && currentLoad.kg > 0 && (
              <div className="text-xs font-extrabold text-[#7A7367] pt-1.5">
                {formatWeight(currentLoad.kg, currentLoad.count, lang)}
                {currentLoad.count > 1 ? ` • ${currentLoad.kg * currentLoad.count} ${lang === 'ru' ? 'кг' : 'kg'}` : ''}
              </div>
            )}
          </PlayingCard>
        )}

        {/* Side Rule Pill Tag */}
        {sideRuleNote && (
          <div className="bg-[#181614] border border-[#2B2722] rounded-full px-3.5 py-1.5 flex items-center gap-2 text-xs font-bold text-[#F2EFE9] max-w-sm text-center">
            <span className="w-2 h-2 rounded-full bg-[#E85324] shrink-0" />
            <span className="truncate">{sideRuleNote}</span>
          </div>
        )}
      </div>

      {/* 3. BOTTOM STATS & BIG ORANGE CTA BUTTON */}
      <div className="space-y-3 pt-1">
        {/* Bottom stats counters */}
        <div className="flex items-center justify-between px-2">
          <div>
            <div className="font-display text-3xl font-black text-[#F2EFE9] tabular-nums leading-none">
              {accumulatedReps}
            </div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-[#9C9388] mt-0.5">
              {t.reps}
            </div>
          </div>

          {config.mode === 'KETTLEBELL' && (
            <div className="text-right">
              <div className="font-display text-3xl font-black text-[#F2EFE9] tabular-nums leading-none">
                {accumulatedTonnage.toLocaleString()}{' '}
                <span className="text-base text-[#9C9388] font-bold">
                  {lang === 'ru' ? 'кг' : 'kg'}
                </span>
              </div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-[#9C9388] mt-0.5">
                {t.tonnage}
              </div>
            </div>
          )}
        </div>

        {/* Big Ember CTA Button */}
        <PrimaryButton onClick={handleDoneClick}>
          <span>{t.doneNext}</span>
        </PrimaryButton>
      </div>

      {/* Rest Overlay */}
      {showRestOverlay && config.restSeconds && (
        <RestOverlay
          totalSeconds={config.restSeconds}
          onFinish={() => {
            setShowRestOverlay(false);
            advanceCard();
          }}
          onSkip={() => {
            setShowRestOverlay(false);
            advanceCard();
          }}
          lang={lang}
        />
      )}

      {/* Red Joker Modal */}
      {showJokerModal && currentCard?.rank === 'JOKER' && currentCard.jokerColor === 'RED' && (
        <RedJokerModal
          beast={config.beast}
          initialDuration={
            config.jokerSettings?.redPlankSeconds || (config.beast ? 120 : 60)
          }
          onComplete={() => {
            setShowJokerModal(false);
            advanceCard();
          }}
          lang={lang}
        />
      )}

      {/* Black Joker Modal */}
      {showJokerModal && currentCard?.rank === 'JOKER' && currentCard.jokerColor === 'BLACK' && (
        <BlackJokerModal
          config={config}
          exercises={exercises}
          onComplete={(stats) => {
            setShowJokerModal(false);
            advanceCard(stats);
          }}
          lang={lang}
        />
      )}

      {/* Exercise Info Modal */}
      {inspectExercise && (
        <ExerciseModal
          exercise={inspectExercise}
          onClose={() => setInspectExercise(null)}
          lang={lang}
        />
      )}

      {/* Quit Confirmation Dialog */}
      {showQuitConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-sm rounded-3xl bg-[#181614] border border-[#2B2722] p-6 shadow-2xl text-[#F2EFE9] text-center space-y-4">
            <h3 className="font-display text-xl font-bold text-white uppercase tracking-wider">
              {t.confirmQuit}
            </h3>
            <p className="text-xs text-[#9C9388] leading-relaxed">{t.confirmQuitDesc}</p>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => setShowQuitConfirm(false)}
                className="py-3.5 rounded-2xl bg-[#24201D] hover:bg-[#322D27] text-xs font-bold text-[#F2EFE9] transition"
              >
                {t.stay}
              </button>
              <button
                onClick={handleQuitConfirm}
                className="py-3.5 rounded-2xl bg-[#E85324] hover:bg-[#D6471C] text-xs font-bold text-white transition shadow-lg shadow-[#E85324]/20"
              >
                {t.finishNow}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
