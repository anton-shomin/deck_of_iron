import React, { useState, useEffect, useRef } from 'react';
import { Info, Volume2, X } from 'lucide-react';
import { Card, Exercise, SessionConfig, Suit } from '../../types';
import { Language, translations } from '../../data/translations';
import {
  calculateCardTonnage,
  calculateProgressStats,
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

  // Suits design properties
  const suitStyles: Record<Suit, { symbol: string; isRed: boolean }> = {
    S: { symbol: '♠', isRed: false },
    H: { symbol: '♥', isRed: true },
    D: { symbol: '♦', isRed: true },
    C: { symbol: '♣', isRed: false },
  };

  const currentSuitStyle = currentCard && currentCard.suit ? suitStyles[currentCard.suit] : null;

  // Run Workout Timer
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Check if current card is Joker on load or transition
  useEffect(() => {
    if (currentCard && currentCard.rank === 'JOKER') {
      setShowJokerModal(true);
    }
  }, [currentIndex, currentCard]);

  // Save session state to localStorage
  useEffect(() => {
    if (currentIndex < deck.length) {
      saveActiveSession({
        config,
        deck,
        currentIndex,
        elapsedSeconds,
        totalRepsAccumulated: accumulatedReps,
        totalTonnageAccumulated: accumulatedTonnage,
        suitRepsAccumulated: accumulatedSuitReps,
        jokersCompleted: accumulatedJokers,
      });
    }
  }, [
    currentIndex,
    elapsedSeconds,
    accumulatedReps,
    accumulatedTonnage,
    accumulatedSuitReps,
    accumulatedJokers,
    deck,
    config,
  ]);

  // Handle advancing to next card
  const advanceCard = (jokerAddStats?: { reps: number; tonnageKg: number }) => {
    playCardSound();
    triggerHapticFeedback('impactLight');

    // Accumulate stats for card being completed
    if (currentCard) {
      if (currentCard.rank === 'JOKER') {
        setAccumulatedJokers((prev) => prev + 1);
        if (jokerAddStats) {
          setAccumulatedReps((prev) => prev + jokerAddStats.reps);
          setAccumulatedTonnage((prev) => prev + jokerAddStats.tonnageKg);
        }
      } else if (currentCard.suit) {
        setAccumulatedReps((prev) => prev + currentCard.reps);
        setAccumulatedSuitReps((prev) => ({
          ...prev,
          [currentCard.suit!]: (prev[currentCard.suit!] || 0) + currentCard.reps,
        }));
        setAccumulatedTonnage((prev) => prev + calculateCardTonnage(currentCard, config));
      }
    }

    const nextIndex = currentIndex + 1;

    // Check if workout completed
    if (nextIndex >= deck.length) {
      if (timerRef.current) clearInterval(timerRef.current);
      playWorkoutCompleteSound();
      triggerHapticFeedback('notificationSuccess');
      clearActiveSession();

      const finalReps = accumulatedReps + (currentCard?.suit ? currentCard.reps : 0) + (jokerAddStats?.reps || 0);
      const finalTonnage = accumulatedTonnage + (currentCard ? calculateCardTonnage(currentCard, config) : 0) + (jokerAddStats?.tonnageKg || 0);
      const finalSuitReps = { ...accumulatedSuitReps };
      if (currentCard?.suit) {
        finalSuitReps[currentCard.suit] = (finalSuitReps[currentCard.suit] || 0) + currentCard.reps;
      }

      onFinishWorkout({
        durationSeconds: elapsedSeconds,
        completedCards: deck.length,
        totalCards: deck.length,
        totalReps: finalReps,
        suitReps: finalSuitReps,
        totalTonnageKg: finalTonnage,
        jokersCompleted: accumulatedJokers + (currentCard?.rank === 'JOKER' ? 1 : 0),
      });
    } else {
      setCurrentIndex(nextIndex);
    }
  };

  // Main Action: Click DONE
  const handleDoneClick = () => {
    if (currentCard?.rank === 'JOKER') {
      setShowJokerModal(true);
      return;
    }

    // Check if rest timer enabled
    if (config.restSeconds && config.restSeconds > 0) {
      setShowRestOverlay(true);
    } else {
      advanceCard();
    }
  };

  // Keyboard shortcut: Spacebar or Enter to complete card
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.code === 'Space' || e.code === 'Enter') &&
        !showRestOverlay &&
        !showJokerModal &&
        !inspectExercise &&
        !showQuitConfirm
      ) {
        e.preventDefault();
        handleDoneClick();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showRestOverlay, showJokerModal, inspectExercise, showQuitConfirm, currentCard]);

  const handleQuitConfirm = () => {
    setShowQuitConfirm(false);
    clearActiveSession();
    onQuitWorkout();
  };

  // Side rule note
  const sideRuleNote = currentCard && currentExercise ? getSideRuleNote(currentCard, currentExercise, lang) : null;

  // Kettlebells cluster break note
  const getClusterTip = (): string | null => {
    if (config.mode !== 'KETTLEBELL' || !currentCard || currentCard.reps < 8) return null;
    if (currentCard.reps === 10) return lang === 'ru' ? 'Кластер 5 + 5 • отдых 15 с' : 'Cluster 5 + 5 • rest 15s';
    if (currentCard.reps === 11) return lang === 'ru' ? 'Кластер 4 + 4 + 3 • отдых 15 с' : 'Cluster 4 + 4 + 3 • rest 15s';
    if (currentCard.reps >= 12) return lang === 'ru' ? 'Разбейте на сеты по 4-5 повт' : 'Split into sets of 4-5 reps';
    return null;
  };

  const clusterTip = getClusterTip();
  const currentLoad = currentCard?.suit ? config.loads[currentCard.suit] : null;

  // Progress percentage line
  const progressPercent = Math.round(((currentIndex + 1) / deck.length) * 100);

  return (
    <div className="w-full max-w-md mx-auto px-4 pt-2 pb-6 min-h-[calc(100vh-60px)] flex flex-col justify-between select-none">
      {/* 1. TOP STATUS HEADER WITH TIMER & PROGRESS BAR */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          {/* Card counter display: 17 / 52 */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowQuitConfirm(true)}
              className="p-1.5 rounded-xl bg-[#191715] hover:bg-[#25221d] border border-[#2b2722] text-zinc-400 hover:text-white transition"
              title={t.confirmQuit}
            >
              <X className="w-4 h-4" />
            </button>
            <span className="font-display text-2xl font-black text-[#f2efe9] tracking-wider">
              {currentIndex + 1} <span className="text-zinc-500 font-bold">/ {deck.length}</span>
            </span>
          </div>

          {/* Live Timer: 12:41 */}
          <div className="font-display text-2xl font-black text-[#f2efe9] tracking-wider tabular-nums">
            {formatDuration(elapsedSeconds)}
          </div>
        </div>

        {/* Progress bar line matching design */}
        <div className="w-full h-1 bg-[#1c1a17] rounded-full overflow-hidden">
          <div
            className="h-full bg-[#e85324] transition-all duration-300 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* 2. MAIN CARD AREA */}
      <div className="my-auto py-4 flex flex-col items-center space-y-4">
        {currentCard?.rank === 'JOKER' ? (
          /* JOKER CARD DISPLAY */
          <div className="w-full max-w-[300px] aspect-[5/7] rounded-3xl bg-[#181614] border-2 border-[#e85324] p-6 flex flex-col justify-between shadow-2xl text-center">
            <div className="flex items-center justify-between">
              <span className="font-display text-2xl font-black text-[#e85324]">JOKER</span>
              <span className="text-xl">🃏</span>
            </div>
            <div className="my-auto space-y-2">
              <div className="text-6xl">🃏</div>
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
            <div className="py-2.5 bg-[#e85324] rounded-xl text-xs font-bold text-white uppercase">
              {lang === 'ru' ? 'Нажмите для старта' : 'Tap to Start'}
            </div>
          </div>
        ) : (
          /* STANDARD PLAYING CARD MATCHING DESIGNS SPEC */
          <div
            onClick={handleDoneClick}
            className="w-full max-w-[310px] aspect-[5/7] rounded-3xl bg-[#ece7db] text-[#1a1a1a] p-5 flex flex-col justify-between shadow-2xl relative overflow-hidden cursor-pointer active:scale-[0.98] transition"
          >
            {/* Suit Watermark in card background */}
            <div className="absolute inset-0 flex items-center justify-center opacity-[0.06] pointer-events-none text-[180px] font-black select-none">
              {currentSuitStyle?.symbol}
            </div>

            {/* Top Left Rank & Suit */}
            <div className="flex items-start justify-between z-10">
              <div className="flex flex-col items-center leading-none">
                <span className="font-display text-3xl font-black text-[#1a1a1a]">
                  {currentCard?.rank}
                </span>
                <span
                  className="text-2xl font-black"
                  style={{ color: currentSuitStyle?.isRed ? '#d92626' : '#1a1a1a' }}
                >
                  {currentSuitStyle?.symbol}
                </span>
              </div>

              {/* Exercise detail info icon */}
              {currentExercise && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setInspectExercise(currentExercise);
                  }}
                  className="p-2 rounded-xl bg-black/5 hover:bg-black/10 text-[#1a1a1a] transition"
                  title={t.exerciseDetails}
                >
                  <Info className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Center Content of Card */}
            <div className="my-auto flex flex-col items-center text-center z-10 space-y-0.5">
              {/* Giant Reps Number: 11 */}
              <div className="font-display text-8xl font-black tracking-tighter text-[#1a1a1a] leading-none tabular-nums">
                {currentCard?.reps}
              </div>

              {/* Subtitle label: ПОВТОРЕНИЙ */}
              <div className="text-[10px] font-black uppercase tracking-widest text-[#5e584f]">
                {t.reps}
              </div>

              {/* Exercise Name: Z-PRESS */}
              {currentExercise && (
                <div className="font-display text-2xl font-black text-[#1a1a1a] uppercase tracking-wide pt-2 leading-none">
                  {lang === 'ru' ? currentExercise.nameRu : currentExercise.nameEn}
                </div>
              )}

              {/* Weight Breakdown: 2 × 24 кг • 48 кг */}
              {config.mode === 'KETTLEBELL' && currentLoad && currentLoad.kg > 0 && (
                <div className="text-xs font-extrabold text-[#5e584f] pt-1">
                  {formatWeight(currentLoad.kg, currentLoad.count, lang)}
                  {currentLoad.count > 1 ? ` • ${currentLoad.kg * currentLoad.count} ${lang === 'ru' ? 'кг' : 'kg'}` : ''}
                </div>
              )}
            </div>

            {/* Bottom Right Rank & Suit (Mirrored) */}
            <div className="flex items-end justify-between z-10">
              <div className="text-[9px] font-black uppercase tracking-widest text-[#7a7367]">
                DECK OF IRON
              </div>
              <div className="flex flex-col items-center leading-none transform rotate-180">
                <span className="font-display text-3xl font-black text-[#1a1a1a]">
                  {currentCard?.rank}
                </span>
                <span
                  className="text-2xl font-black"
                  style={{ color: currentSuitStyle?.isRed ? '#d92626' : '#1a1a1a' }}
                >
                  {currentSuitStyle?.symbol}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Cluster / Side Rule Pill Tag matching design image */}
        {(clusterTip || sideRuleNote) && (
          <div className="bg-[#191715] border border-[#2b2722] rounded-full px-3.5 py-1.5 flex items-center gap-2 text-xs font-bold text-[#f2efe9]">
            <span className="w-2 h-2 rounded-full bg-[#e85324]" />
            <span>{clusterTip || sideRuleNote}</span>
          </div>
        )}
      </div>

      {/* 3. BOTTOM STATS AND BIG ORANGE "ГОТОВО" BUTTON */}
      <div className="space-y-4 pt-2">
        {/* Bottom stats counters matching design */}
        <div className="flex items-center justify-between px-2">
          <div>
            <div className="font-display text-3xl font-black text-[#f2efe9] tabular-nums leading-none">
              {accumulatedReps}
            </div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mt-0.5">
              {t.reps}
            </div>
          </div>

          {config.mode === 'KETTLEBELL' && (
            <div className="text-right">
              <div className="font-display text-3xl font-black text-[#f2efe9] tabular-nums leading-none">
                {accumulatedTonnage.toLocaleString()}{' '}
                <span className="text-base text-zinc-400 font-bold">
                  {lang === 'ru' ? 'кг' : 'kg'}
                </span>
              </div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mt-0.5">
                {t.tonnage}
              </div>
            </div>
          )}
        </div>

        {/* Big Orange "ГОТОВО" CTA button matching design image */}
        <button
          onClick={handleDoneClick}
          className="w-full py-4 px-6 rounded-2xl bg-[#e85324] hover:bg-[#d6471c] text-white font-display text-2xl uppercase tracking-wider font-extrabold shadow-xl shadow-[#e85324]/20 flex items-center justify-center transition active:scale-[0.98]"
        >
          {t.doneNext}
        </button>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl bg-[#181614] border border-[#2e2a24] p-5 shadow-2xl text-[#f2efe9] text-center space-y-4">
            <h3 className="font-display text-xl font-black text-white uppercase">{t.confirmQuit}</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">{t.confirmQuitDesc}</p>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => setShowQuitConfirm(false)}
                className="py-3 rounded-xl bg-[#26221d] hover:bg-[#322d27] text-xs font-bold text-zinc-300 transition"
              >
                {t.stay}
              </button>
              <button
                onClick={handleQuitConfirm}
                className="py-3 rounded-xl bg-[#e85324] hover:bg-[#d6471c] text-xs font-bold text-white transition"
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
