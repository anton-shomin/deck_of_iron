import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Info, Pause, Play, LogOut, Dumbbell, Award, Flame, Skull } from 'lucide-react';
import { Card, Exercise, SessionConfig, Suit } from '../../types';
import { Language, translations } from '../../data/translations';
import { ExerciseModal } from '../components/ExerciseModal';
import { RestOverlay } from '../components/RestOverlay';
import { RedJokerModal } from '../components/RedJokerModal';
import { BlackJokerModal } from '../components/BlackJokerModal';
import { getClusterTip, getSideRuleBreakdown } from '../../engine/safety';
import { calculateCardTonnage, formatDuration, formatWeight } from '../../engine/scoring';
import { playCardDealSound, playGong } from '../../platform/audio';
import { triggerCardHaptic } from '../../platform/haptics';
import { saveActiveSession, clearActiveSession } from '../../platform/storage';

interface WorkoutHUDProps {
  deck: Card[];
  initialIndex?: number;
  initialElapsedSeconds?: number;
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
  config,
  exercises,
  onFinishWorkout,
  onQuitWorkout,
  lang,
}) => {
  const t = translations[lang];

  const [currentIndex, setCurrentIndex] = useState<number>(initialIndex);
  const [inspectExercise, setInspectExercise] = useState<Exercise | null>(null);
  const [showRestOverlay, setShowRestOverlay] = useState<boolean>(false);
  const [showJokerModal, setShowJokerModal] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [showQuitConfirm, setShowQuitConfirm] = useState<boolean>(false);

  // Time tracking using Date.now()
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(initialElapsedSeconds);
  const startTimeRef = useRef<number>(Date.now() - initialElapsedSeconds * 1000);

  // Completed metrics state
  const [completedCardsCount, setCompletedCardsCount] = useState<number>(initialIndex);
  const [totalRepsAccumulated, setTotalRepsAccumulated] = useState<number>(0);
  const [totalTonnageAccumulated, setTotalTonnageAccumulated] = useState<number>(0);
  const [jokersCompleted, setJokersCompleted] = useState<number>(0);
  const [suitRepsAccumulated, setSuitRepsAccumulated] = useState<Record<Suit, number>>({
    S: 0,
    H: 0,
    D: 0,
    C: 0,
  });

  const currentCard: Card | undefined = deck[currentIndex];

  // Map suit to exercise
  const currentExercise = currentCard?.suit
    ? exercises.find((e) => e.id === config.loads[currentCard.suit!]?.exerciseId)
    : null;

  // Timer interval
  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const elapsed = Math.floor((now - startTimeRef.current) / 1000);
      setElapsedSeconds(elapsed);
    }, 1000);

    return () => clearInterval(interval);
  }, [isPaused]);

  // Persist session to localStorage
  useEffect(() => {
    saveActiveSession({
      config,
      deck,
      currentIndex,
      startTimestamp: startTimeRef.current,
      elapsedSeconds,
    });
  }, [config, deck, currentIndex, elapsedSeconds]);

  // Handle completion of entire deck
  const handleCompleteDeck = useCallback(() => {
    clearActiveSession();
    playGong();
    onFinishWorkout({
      durationSeconds: elapsedSeconds,
      completedCards: completedCardsCount,
      totalCards: deck.length,
      totalReps: totalRepsAccumulated,
      suitReps: suitRepsAccumulated,
      totalTonnageKg: totalTonnageAccumulated,
      jokersCompleted,
    });
  }, [
    elapsedSeconds,
    completedCardsCount,
    deck.length,
    totalRepsAccumulated,
    suitRepsAccumulated,
    totalTonnageAccumulated,
    jokersCompleted,
    onFinishWorkout,
  ]);

  // Advance to next card
  const advanceCard = useCallback((jokerStats?: { reps: number; tonnageKg: number }) => {
    if (!currentCard) {
      handleCompleteDeck();
      return;
    }

    // Accumulate stats for current card
    if (currentCard.rank === 'JOKER') {
      setJokersCompleted((prev) => prev + 1);
      if (jokerStats) {
        setTotalRepsAccumulated((prev) => prev + jokerStats.reps);
        setTotalTonnageAccumulated((prev) => prev + jokerStats.tonnageKg);
      }
    } else if (currentCard.suit) {
      const reps = currentCard.reps;
      const tonnage = calculateCardTonnage(currentCard, config);
      setTotalRepsAccumulated((prev) => prev + reps);
      setSuitRepsAccumulated((prev) => ({
        ...prev,
        [currentCard.suit!]: prev[currentCard.suit!] + reps,
      }));
      setTotalTonnageAccumulated((prev) => prev + tonnage);
    }

    const nextIdx = currentIndex + 1;
    setCompletedCardsCount(nextIdx);

    playCardDealSound();
    triggerCardHaptic();

    if (nextIdx >= deck.length) {
      handleCompleteDeck();
      return;
    }

    setCurrentIndex(nextIdx);

    // If next card is a joker, open joker modal directly
    const nextCard = deck[nextIdx];
    if (nextCard && nextCard.rank === 'JOKER') {
      setShowJokerModal(true);
    }
  }, [currentCard, currentIndex, deck, config, handleCompleteDeck]);

  // User hits "DONE / NEXT CARD"
  const handleDoneClick = () => {
    if (currentCard?.rank === 'JOKER') {
      setShowJokerModal(true);
      return;
    }

    if (config.restSeconds !== null && config.restSeconds > 0) {
      setShowRestOverlay(true);
    } else {
      advanceCard();
    }
  };

  // Keyboard shortcut: Space or Enter
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (showRestOverlay || showJokerModal || inspectExercise || showQuitConfirm) return;

      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        handleDoneClick();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showRestOverlay, showJokerModal, inspectExercise, showQuitConfirm, handleDoneClick]);

  // Pause / Resume
  const togglePause = () => {
    if (!isPaused) {
      setIsPaused(true);
    } else {
      startTimeRef.current = Date.now() - elapsedSeconds * 1000;
      setIsPaused(false);
    }
  };

  const handleQuitConfirm = () => {
    clearActiveSession();
    onQuitWorkout();
  };

  if (!currentCard) {
    return null;
  }

  // Suit visual properties (Black spades/clubs, Red hearts/diamonds)
  const suitStyles: Record<
    Suit,
    { symbol: string; color: string; border: string; glow: string; bg: string }
  > = {
    S: {
      symbol: '♠',
      color: 'text-zinc-100',
      border: 'border-zinc-700/60',
      glow: 'shadow-zinc-900/60',
      bg: 'from-zinc-900 via-zinc-950 to-black',
    },
    H: {
      symbol: '♥',
      color: 'text-red-500',
      border: 'border-red-600/40',
      glow: 'shadow-red-600/20',
      bg: 'from-red-950/40 via-zinc-900 to-zinc-950',
    },
    D: {
      symbol: '♦',
      color: 'text-red-500',
      border: 'border-red-600/40',
      glow: 'shadow-red-600/20',
      bg: 'from-red-950/40 via-zinc-900 to-zinc-950',
    },
    C: {
      symbol: '♣',
      color: 'text-zinc-100',
      border: 'border-zinc-700/60',
      glow: 'shadow-zinc-900/60',
      bg: 'from-zinc-900 via-zinc-950 to-black',
    },
  };

  const currentSuitStyle = currentCard.suit ? suitStyles[currentCard.suit] : null;

  // Breakdown notes & safety
  const clusterTip = getClusterTip(currentCard, config.mode === 'KETTLEBELL', lang);
  const sideRuleNote = currentExercise
    ? getSideRuleBreakdown(currentExercise, currentCard.reps, lang)
    : null;

  const cardTonnage = calculateCardTonnage(currentCard, config);
  const currentLoad = currentCard.suit ? config.loads[currentCard.suit] : null;

  const remainingCardsCount = deck.length - currentIndex;
  const progressPercent = Math.round((currentIndex / deck.length) * 100);

  return (
    <div className="w-full max-w-md mx-auto min-h-[92vh] flex flex-col justify-between p-4 pb-20 select-none">
      {/* Top Header HUD */}
      <div className="space-y-2">
        <div className="flex items-center justify-between bg-zinc-900/90 border border-zinc-800/80 px-3 py-2 rounded-2xl backdrop-blur-md">
          {/* Elapsed Timer */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] uppercase font-bold text-zinc-400">
              {lang === 'ru' ? 'ВРЕМЯ' : 'TIME'}
            </span>
            <span className="text-sm font-black text-white tabular-nums">
              {formatDuration(elapsedSeconds)}
            </span>
          </div>

          {/* Cards Left counter */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] uppercase font-bold text-zinc-400">
              {lang === 'ru' ? 'ОСТАЛОСЬ' : 'LEFT'}
            </span>
            <span className="text-sm font-black text-red-500 tabular-nums">
              {remainingCardsCount}
            </span>
            <span className="text-[11px] text-zinc-400">
              {t.cardOf} {deck.length}
            </span>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-1">
            <button
              onClick={togglePause}
              className="p-1.5 rounded-lg bg-zinc-800 text-zinc-300 hover:text-white transition"
              title={isPaused ? t.resume : t.pause}
            >
              {isPaused ? <Play className="w-3.5 h-3.5 fill-current" /> : <Pause className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={() => setShowQuitConfirm(true)}
              className="p-1.5 rounded-lg bg-zinc-800 text-zinc-300 hover:text-red-400 transition"
              title={t.quit}
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-1.5 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800/60">
          <div
            className="h-full bg-gradient-to-r from-red-600 to-amber-500 transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Center: The Massive Playing Card */}
      <div className="my-auto py-2 flex flex-col items-center">
        {currentCard.rank === 'JOKER' ? (
          /* JOKER CARD DISPLAY */
          <div
            onClick={() => setShowJokerModal(true)}
            className={`w-full max-w-[320px] aspect-[5/7] rounded-3xl border-2 p-5 flex flex-col justify-between items-center text-center cursor-pointer shadow-2xl transition transform active:scale-98 ${
              currentCard.jokerColor === 'RED'
                ? 'bg-gradient-to-br from-red-950 via-zinc-900 to-black border-red-500/80 shadow-red-950/60'
                : 'bg-gradient-to-br from-zinc-800 via-zinc-900 to-black border-zinc-500/80 shadow-zinc-950/80'
            }`}
          >
            <div className="w-full flex justify-between items-center">
              <span className="text-xs font-black tracking-widest text-red-400">★ JOKER ★</span>
              <span className="text-xs font-black tracking-widest text-zinc-400">
                {currentCard.jokerColor}
              </span>
            </div>

            <div className="flex flex-col items-center justify-center my-auto space-y-3">
              <div
                className={`w-24 h-24 rounded-full flex items-center justify-center ${
                  currentCard.jokerColor === 'RED' ? 'bg-red-600/20 text-red-500' : 'bg-zinc-800 text-white'
                }`}
              >
                {currentCard.jokerColor === 'RED' ? (
                  <Flame className="w-14 h-14 animate-pulse" />
                ) : (
                  <Skull className="w-14 h-14" />
                )}
              </div>
              <h3 className="text-2xl font-black text-white tracking-wider">
                {currentCard.jokerColor === 'RED'
                  ? lang === 'ru'
                    ? 'КРАСНЫЙ ДЖОКЕР'
                    : 'RED JOKER'
                  : lang === 'ru'
                  ? 'ЧЁРНЫЙ ДЖОКЕР'
                  : 'BLACK JOKER'}
              </h3>
              {currentCard.jokerColor === 'RED' ? (
                <div className="space-y-1.5">
                  <p className="text-xs text-zinc-300 font-bold px-2">
                    {lang === 'ru' ? 'Статика: Планка на предплечьях' : 'Static: Forearm Plank'}
                  </p>
                  <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-red-950/80 border border-red-600/60 text-xs font-black text-red-400">
                    {(() => {
                      const sec = config.jokerSettings?.redPlankSeconds || (config.beast ? 120 : 60);
                      return sec >= 60 ? `${Math.round(sec / 60)} ${t.minutesShort}` : `${sec} ${t.secondsShort}`;
                    })()}
                  </div>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <p className="text-xs text-zinc-300 font-bold px-2 leading-relaxed">
                    {(() => {
                      const choice =
                        config.jokerSettings?.blackExerciseChoice ||
                        (config.mode === 'KETTLEBELL' ? 'THRUSTERS' : 'BURPEES');
                      if (choice === 'THRUSTERS') {
                        const count = config.jokerSettings?.blackKbCount || 1;
                        const weight = config.jokerSettings?.blackKbWeight || 24;
                        const reps = config.jokerSettings?.blackKbReps || 30;
                        return lang === 'ru'
                          ? `Трастеры: ${reps} повт (${count === 1 ? '1 гиря' : '2 гири'} × ${weight} кг)`
                          : `Thrusters: ${reps} reps (${count === 1 ? '1 bell' : '2 bells'} × ${weight} kg)`;
                      }
                      if (choice === 'WALL_SIT') {
                        const mins = (config.jokerSettings?.blackWallSitSeconds || 120) / 60;
                        return lang === 'ru'
                          ? `Стульчик у стены: ${mins} мин (выбор 1 / 2 / 5 мин)`
                          : `Wall Sit: ${mins} min (choice 1 / 2 / 5 min)`;
                      }
                      if (choice === 'BURPEES') {
                        const reps = config.jokerSettings?.blackBodyReps || 30;
                        return lang === 'ru'
                          ? `Бёрпи: ${reps} повт (выбор 20 / 30 / 50)`
                          : `Burpees: ${reps} reps (choice 20 / 30 / 50)`;
                      }
                      return lang === 'ru'
                        ? '15 повторений основного упражнения'
                        : '15 reps of main exercise';
                    })()}
                  </p>
                  <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-zinc-800 text-[11px] font-extrabold text-zinc-300 border border-zinc-700">
                    {lang === 'ru' ? '★ Трастеры / Бёрпи / Стульчик' : '★ Thrusters / Burpees / Wall Sit'}
                  </div>
                </div>
              )}
            </div>

            <div className="w-full py-2 bg-red-600/30 rounded-xl border border-red-500/50 text-xs font-black text-white uppercase tracking-wider">
              {lang === 'ru' ? 'Нажмите для старта' : 'Tap to Start'}
            </div>
          </div>
        ) : (
          /* STANDARD PLAYING CARD DISPLAY */
          <div
            className={`w-full max-w-[320px] aspect-[5/7] rounded-3xl border-2 p-5 flex flex-col justify-between bg-gradient-to-b ${
              currentSuitStyle?.bg
            } ${currentSuitStyle?.border} shadow-2xl ${
              currentSuitStyle?.glow
            } transition duration-200 relative overflow-hidden`}
          >
            {/* Top Left Rank & Suit */}
            <div className="flex items-start justify-between">
              <div className="flex flex-col items-center leading-none">
                <span className="text-3xl font-black text-white">{currentCard.rank}</span>
                <span className={`text-2xl font-black ${currentSuitStyle?.color}`}>
                  {currentSuitStyle?.symbol}
                </span>
              </div>
              {/* Info Button */}
              {currentExercise && (
                <button
                  onClick={() => setInspectExercise(currentExercise)}
                  className="p-2 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-700/60 text-zinc-300 hover:text-white transition"
                  title={t.exerciseDetails}
                >
                  <Info className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Giant Center Display */}
            <div className="flex flex-col items-center justify-center my-auto space-y-1 text-center w-full px-2">
              <span
                className={`text-5xl font-black leading-none drop-shadow-lg ${currentSuitStyle?.color}`}
              >
                {currentSuitStyle?.symbol}
              </span>

              {/* Exercise Name on Card in Large Font */}
              {currentExercise && (
                <div className="text-base sm:text-lg font-black text-white tracking-tight uppercase px-1 line-clamp-2 leading-tight drop-shadow-md my-1">
                  {lang === 'ru' ? currentExercise.nameRu : currentExercise.nameEn}
                </div>
              )}

              <div className="text-7xl sm:text-8xl font-black tracking-tighter text-white tabular-nums leading-none">
                {currentCard.reps}
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">
                {t.reps}
              </span>

              {/* Kettlebell Weight display if relevant */}
              {config.mode === 'KETTLEBELL' && currentLoad && currentLoad.kg > 0 && (
                <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-zinc-950/80 border border-zinc-800 text-xs font-bold text-amber-400 mt-1">
                  <Dumbbell className="w-3.5 h-3.5" />
                  <span>{formatWeight(currentLoad.kg, currentLoad.count, lang)}</span>
                </div>
              )}
            </div>

            {/* Bottom Right Rank & Suit mirrored */}
            <div className="flex items-end justify-between">
              <div className="text-[10px] uppercase font-bold text-zinc-400">
                DECK OF IRON
              </div>
              <div className="flex flex-col items-center leading-none transform rotate-180">
                <span className="text-3xl font-black text-white">{currentCard.rank}</span>
                <span className={`text-2xl font-black ${currentSuitStyle?.color}`}>
                  {currentSuitStyle?.symbol}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Exercise Title & Technique details under card */}
        {currentExercise && (
          <div className="w-full max-w-[320px] mt-3 space-y-1 text-center">
            <h2 className="text-lg font-black text-white tracking-tight leading-snug">
              {lang === 'ru' ? currentExercise.nameRu : currentExercise.nameEn}
            </h2>

            {/* Side rule breakdown (e.g. 8 = 4 L + 4 R) */}
            {sideRuleNote && (
              <div className="text-xs font-bold text-amber-400 bg-amber-950/30 border border-amber-900/40 rounded-xl px-2.5 py-1">
                {sideRuleNote}
              </div>
            )}

            {/* Kettlebells Cluster Break hint */}
            {clusterTip && (
              <div className="text-xs font-bold text-sky-400 bg-sky-950/30 border border-sky-900/40 rounded-xl px-2.5 py-1 flex items-center justify-center gap-1.5">
                <span>⚡</span>
                <span>{clusterTip}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom Action Section */}
      <div className="space-y-3 pt-2">
        {/* Quick HUD Metrics (Total Reps & Tonnage) */}
        <div className="flex items-center justify-between text-xs text-zinc-400 px-2 font-medium">
          <div>
            <span>{t.totalReps}: </span>
            <span className="font-bold text-white tabular-nums">{totalRepsAccumulated}</span>
          </div>
          {config.mode === 'KETTLEBELL' && (
            <div>
              <span>{t.tonnage}: </span>
              <span className="font-bold text-amber-400 tabular-nums">
                {totalTonnageAccumulated} {lang === 'ru' ? 'кг' : 'kg'}
              </span>
            </div>
          )}
        </div>

        {/* Big Done Button */}
        <button
          onClick={handleDoneClick}
          className="w-full py-4 px-6 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-black text-base uppercase tracking-wider shadow-2xl shadow-red-950/80 border border-red-500/50 flex items-center justify-center gap-2 transition active:scale-98"
        >
          <span>{t.doneNext}</span>
        </button>

        {/* Spacebar desktop tip */}
        <div className="hidden sm:block text-center text-[11px] text-zinc-400">
          {t.spacebarHint}
        </div>
      </div>

      {/* Modals & Overlays */}
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
      {showJokerModal && currentCard.rank === 'JOKER' && currentCard.jokerColor === 'RED' && (
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
      {showJokerModal && currentCard.rank === 'JOKER' && currentCard.jokerColor === 'BLACK' && (
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
          <div className="w-full max-w-sm rounded-3xl bg-zinc-900 border border-zinc-700 p-6 shadow-2xl text-zinc-100 text-center space-y-4">
            <h3 className="text-lg font-black text-white">{t.confirmQuit}</h3>
            <p className="text-xs text-zinc-300 leading-relaxed">{t.confirmQuitDesc}</p>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => setShowQuitConfirm(false)}
                className="py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-zinc-200 transition"
              >
                {t.stay}
              </button>
              <button
                onClick={handleQuitConfirm}
                className="py-3 rounded-xl bg-red-600 hover:bg-red-500 text-xs font-bold text-white transition"
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
