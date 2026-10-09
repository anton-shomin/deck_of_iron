import React, { useState, useEffect } from 'react';
import exercisesData from './data/exercises.json';
import presetsData from './data/presets.json';
import { Card, Exercise, Preset, SessionConfig, Suit } from './types';
import { Language, translations } from './data/translations';
import { Navbar } from './ui/components/Navbar';
import { TableScreen } from './ui/screens/TableScreen';
import { WorkoutHUD } from './ui/screens/WorkoutHUD';
import { SummaryScreen } from './ui/screens/SummaryScreen';
import { HistoryModal } from './ui/components/HistoryModal';
import { OfflineIndicator } from './ui/components/OfflineIndicator';
import { createDeck } from './engine/deck';
import { applyHeavyLoadGap } from './engine/safety';
import { requestWakeLock, releaseWakeLock, isWakeLockSupported } from './platform/wakeLock';
import { initAudio, setSoundEnabled, isSoundEnabled } from './platform/audio';
import {
  loadActiveSession,
  clearActiveSession,
  loadLanguage,
  saveLanguage,
  loadSoundPreference,
  saveSoundPreference,
} from './platform/storage';

const exercises: Exercise[] = exercisesData as Exercise[];
const basePresets: Preset[] = presetsData as Preset[];

const DEFAULT_CONFIG: SessionConfig = {
  mode: 'BODY',
  beast: false,
  jokers: 1,
  aceValue: 11,
  restSeconds: 5,
  loads: {
    S: { exerciseId: 'body_tyson_pushups', kg: 0, count: 1 },
    H: { exerciseId: 'body_bronson_squats', kg: 0, count: 1 },
    D: { exerciseId: 'body_wrestler_bridge', kg: 0, count: 1 },
    C: { exerciseId: 'body_v_ups', kg: 0, count: 1 },
  },
  jokerSettings: {
    redPlankSeconds: 120,
    blackExerciseChoice: 'BURPEES',
    blackKbCount: 1,
    blackKbWeight: 24,
    blackKbReps: 30,
    blackBodyReps: 30,
    blackWallSitSeconds: 120,
  },
};

export default function App() {
  const [lang, setLang] = useState<Language>(() => loadLanguage());
  const [soundOn, setSoundOn] = useState<boolean>(() => loadSoundPreference());
  const [isWakeLockOn, setIsWakeLockOn] = useState<boolean>(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);

  // App screens: TABLE, WORKOUT, SUMMARY
  const [currentScreen, setCurrentScreen] = useState<'TABLE' | 'WORKOUT' | 'SUMMARY'>('TABLE');

  // Config & Active workout state
  const [config, setConfig] = useState<SessionConfig>(DEFAULT_CONFIG);
  const [activeDeck, setActiveDeck] = useState<Card[]>([]);
  const [workoutStartIndex, setWorkoutStartIndex] = useState<number>(0);
  const [workoutInitialSeconds, setWorkoutInitialSeconds] = useState<number>(0);

  // Completed workout summary
  const [workoutSummary, setWorkoutSummary] = useState<{
    durationSeconds: number;
    completedCards: number;
    totalCards: number;
    totalReps: number;
    suitReps: Record<Suit, number>;
    totalTonnageKg: number;
    jokersCompleted: number;
  } | null>(null);

  // Sound preference sync
  useEffect(() => {
    setSoundEnabled(soundOn);
    saveSoundPreference(soundOn);
  }, [soundOn]);

  // Language sync
  const toggleLanguage = () => {
    const nextLang = lang === 'ru' ? 'en' : 'ru';
    setLang(nextLang);
    saveLanguage(nextLang);
    document.documentElement.lang = nextLang;
  };

  const toggleSound = () => {
    setSoundOn((prev) => !prev);
  };

  // Restore existing workout session from localStorage if present
  useEffect(() => {
    const saved = loadActiveSession();
    if (saved && saved.deck && saved.deck.length > 0 && saved.currentIndex < saved.deck.length) {
      setConfig(saved.config);
      setActiveDeck(saved.deck);
      setWorkoutStartIndex(saved.currentIndex);
      setWorkoutInitialSeconds(saved.elapsedSeconds);
      setCurrentScreen('WORKOUT');
      requestWakeLock().then(setIsWakeLockOn);
    }
  }, []);

  // Handle start workout
  const handleStartWorkout = async () => {
    // Unlock Web Audio API on first user gesture
    initAudio();

    // Request Screen Wake Lock
    const wakeLockSuccess = await requestWakeLock();
    setIsWakeLockOn(wakeLockSuccess);

    // Create deck with Jokers positioning and safety
    const rawDeck = createDeck({
      aceValue: config.aceValue,
      jokersCount: config.jokers,
    });

    // Apply safety gap for Kettlebells mode
    const finalDeck = applyHeavyLoadGap(rawDeck, config.mode === 'KETTLEBELL');

    setActiveDeck(finalDeck);
    setWorkoutStartIndex(0);
    setWorkoutInitialSeconds(0);
    setCurrentScreen('WORKOUT');
  };

  // Handle workout completion
  const handleFinishWorkout = (summary: {
    durationSeconds: number;
    completedCards: number;
    totalCards: number;
    totalReps: number;
    suitReps: Record<Suit, number>;
    totalTonnageKg: number;
    jokersCompleted: number;
  }) => {
    releaseWakeLock();
    setIsWakeLockOn(false);
    setWorkoutSummary(summary);
    setCurrentScreen('SUMMARY');
  };

  // Handle quitting workout
  const handleQuitWorkout = () => {
    releaseWakeLock();
    setIsWakeLockOn(false);
    clearActiveSession();
    setCurrentScreen('TABLE');
  };

  // Handle restart workout from summary
  const handleRestartWorkout = () => {
    handleStartWorkout();
  };

  // Handle go home from summary
  const handleGoHome = () => {
    setCurrentScreen('TABLE');
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-red-600 selection:text-white">
      {/* Universal Sticky Header */}
      <Navbar
        lang={lang}
        onToggleLang={toggleLanguage}
        soundEnabled={soundOn}
        onToggleSound={toggleSound}
        isWakeLockOn={isWakeLockOn}
        onOpenHistory={() => setIsHistoryOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col">
        {currentScreen === 'TABLE' && (
          <TableScreen
            config={config}
            onChangeConfig={setConfig}
            exercises={exercises}
            presets={basePresets}
            onStartWorkout={handleStartWorkout}
            lang={lang}
          />
        )}

        {currentScreen === 'WORKOUT' && activeDeck.length > 0 && (
          <WorkoutHUD
            deck={activeDeck}
            initialIndex={workoutStartIndex}
            initialElapsedSeconds={workoutInitialSeconds}
            config={config}
            exercises={exercises}
            onFinishWorkout={handleFinishWorkout}
            onQuitWorkout={handleQuitWorkout}
            lang={lang}
          />
        )}

        {currentScreen === 'SUMMARY' && workoutSummary && (
          <SummaryScreen
            summary={workoutSummary}
            config={config}
            exercises={exercises}
            onRestart={handleRestartWorkout}
            onGoHome={handleGoHome}
            lang={lang}
          />
        )}
      </main>

      {/* Workout History Modal */}
      <HistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        lang={lang}
      />

      {/* Offline Status Toast */}
      <OfflineIndicator lang={lang} />
    </div>
  );
}
