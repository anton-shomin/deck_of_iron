import React, { useState, useEffect, useRef } from 'react';
import { Skull, CheckCircle2, Dumbbell, Play, Pause } from 'lucide-react';
import { Exercise, SessionConfig, Suit, BlackJokerChoice } from '../../types';
import { Language, translations } from '../../data/translations';
import {
  BLACK_JOKER_KB_WEIGHTS,
  BLACK_JOKER_KB_REPS,
  BLACK_JOKER_BODY_REPS,
  WALL_SIT_DURATIONS,
} from '../../engine/jokers';
import { playCountdownBeep, playCountdownFinalBeep, playGong } from '../../platform/audio';
import { triggerCountdownHaptic, triggerGongHaptic } from '../../platform/haptics';
import { PrimaryButton } from './ui';

interface BlackJokerModalProps {
  config: SessionConfig;
  exercises: Exercise[];
  onComplete: (jokerStats?: { reps: number; tonnageKg: number }) => void;
  lang: Language;
}

export const BlackJokerModal: React.FC<BlackJokerModalProps> = ({
  config,
  exercises,
  onComplete,
  lang,
}) => {
  const t = translations[lang];

  // Selected exercise type: 'THRUSTERS' | 'BURPEES' | 'WALL_SIT' | 'SUIT_15'
  const [selectedChoice, setSelectedChoice] = useState<BlackJokerChoice>(
    config.jokerSettings?.blackExerciseChoice ||
      (config.mode === 'KETTLEBELL' ? 'THRUSTERS' : 'BURPEES')
  );

  // Kettlebell Thrusters parameters
  const [selectedKbCount, setSelectedKbCount] = useState<1 | 2>(
    config.jokerSettings?.blackKbCount || 1
  );
  const [selectedKbWeight, setSelectedKbWeight] = useState<16 | 24 | 32>(
    config.jokerSettings?.blackKbWeight || 24
  );
  const [selectedKbReps, setSelectedKbReps] = useState<number>(
    config.jokerSettings?.blackKbReps || 30
  );

  // Burpees reps: 20 / 30 / 50
  const [selectedBurpeeReps, setSelectedBurpeeReps] = useState<number>(
    config.jokerSettings?.blackBodyReps || 30
  );

  // Wall Sit duration: 1 / 2 / 5 min (60, 120, 300 s)
  const [selectedWallSitDuration, setSelectedWallSitDuration] = useState<number>(
    config.jokerSettings?.blackWallSitSeconds || 120
  );

  // Wall Sit live countdown timer
  const [wallSitRemaining, setWallSitRemaining] = useState<number>(selectedWallSitDuration);
  const [isWallSitRunning, setIsWallSitRunning] = useState<boolean>(false);
  const [isWallSitFinished, setIsWallSitFinished] = useState<boolean>(false);
  const wallSitEndTimeRef = useRef<number>(0);
  const wallSitPausedTimeRef = useRef<number>(selectedWallSitDuration);
  const wallSitBeepedSecondsRef = useRef<Set<number>>(new Set());

  // Beast Mode OFF suit selection
  const [selectedOffSuit, setSelectedOffSuit] = useState<Suit>('S');

  const startWallSitTimer = () => {
    wallSitEndTimeRef.current = Date.now() + wallSitRemaining * 1000;
    setIsWallSitRunning(true);
    wallSitBeepedSecondsRef.current.clear();
  };

  const pauseWallSitTimer = () => {
    wallSitPausedTimeRef.current = wallSitRemaining;
    setIsWallSitRunning(false);
  };

  useEffect(() => {
    if (!isWallSitRunning) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const timeLeft = Math.max(0, Math.ceil((wallSitEndTimeRef.current - now) / 1000));
      setWallSitRemaining(timeLeft);

      if (timeLeft <= 3 && timeLeft > 0 && !wallSitBeepedSecondsRef.current.has(timeLeft)) {
        wallSitBeepedSecondsRef.current.add(timeLeft);
        if (timeLeft === 1) {
          playCountdownFinalBeep();
        } else {
          playCountdownBeep(700);
        }
        triggerCountdownHaptic();
      }

      if (timeLeft <= 0) {
        clearInterval(interval);
        setIsWallSitRunning(false);
        setIsWallSitFinished(true);
        playGong();
        triggerGongHaptic();
      }
    }, 100);

    return () => clearInterval(interval);
  }, [isWallSitRunning]);

  // Calculate stats based on selection
  let jokerReps = 0;
  let jokerTonnage = 0;

  if (selectedChoice === 'THRUSTERS') {
    jokerReps = selectedKbReps;
    jokerTonnage = selectedKbWeight * selectedKbCount * selectedKbReps;
  } else if (selectedChoice === 'BURPEES') {
    jokerReps = selectedBurpeeReps;
    jokerTonnage = 0;
  } else if (selectedChoice === 'WALL_SIT') {
    jokerReps = 0;
    jokerTonnage = 0;
  } else if (selectedChoice === 'SUIT_15') {
    jokerReps = 15;
    const suitLoad = config.loads[selectedOffSuit];
    if (config.mode === 'KETTLEBELL' && suitLoad) {
      jokerTonnage = suitLoad.kg * suitLoad.count * 15;
    }
  }

  const handleFinish = () => {
    onComplete({ reps: jokerReps, tonnageKg: jokerTonnage });
  };

  const mins = Math.floor(wallSitRemaining / 60);
  const secs = wallSitRemaining % 60;
  const wallSitFormatted = `${mins}:${secs.toString().padStart(2, '0')}`;

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-between bg-[#12100E]/98 p-5 text-[#F2EFE9] animate-in zoom-in-95 duration-200 overflow-y-auto">
      {/* Top Header */}
      <div className="w-full max-w-sm pt-2 text-center">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#181614] border border-[#2B2722] text-[#F2EFE9] text-xs font-black tracking-widest uppercase mb-2">
          <Skull className="w-4 h-4 text-[#E85324]" />
          <span>{t.blackJokerTitle}</span>
        </div>
        <h2 className="font-display text-3xl font-black text-white tracking-wider uppercase">
          {lang === 'ru' ? 'ЧЁРНЫЙ ДЖОКЕР' : 'BLACK JOKER'}
        </h2>
        <p className="text-xs text-[#9C9388] mt-1">
          {lang === 'ru'
            ? 'Выберите одно из заданий для прохождения'
            : 'Select one challenge task to execute'}
        </p>
      </div>

      {/* Main Choice Box */}
      <div className="w-full max-w-sm my-auto py-3 space-y-4">
        <div className="bg-[#181614] border border-[#2B2722] rounded-3xl p-4 space-y-4 shadow-2xl">
          {/* Option Selector Buttons */}
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-[#9C9388] block mb-2">
              {lang === 'ru' ? 'Выберите задание:' : 'Select Challenge:'}
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {config.mode === 'KETTLEBELL' && (
                <button
                  type="button"
                  onClick={() => setSelectedChoice('THRUSTERS')}
                  className={`py-2 px-1 rounded-xl text-xs font-bold border transition text-center truncate ${
                    selectedChoice === 'THRUSTERS'
                      ? 'bg-[#E85324] border-[#E85324] text-white shadow-md'
                      : 'bg-[#12100E] border-[#2B2722] text-[#9C9388] hover:text-white'
                  }`}
                >
                  {lang === 'ru' ? 'Трастеры' : 'Thrusters'}
                </button>
              )}
              <button
                type="button"
                onClick={() => setSelectedChoice('BURPEES')}
                className={`py-2 px-1 rounded-xl text-xs font-bold border transition text-center truncate ${
                  selectedChoice === 'BURPEES'
                    ? 'bg-[#E85324] border-[#E85324] text-white shadow-md'
                    : 'bg-[#12100E] border-[#2B2722] text-[#9C9388] hover:text-white'
                }`}
              >
                {lang === 'ru' ? 'Бёрпи' : 'Burpees'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedChoice('WALL_SIT');
                  setWallSitRemaining(selectedWallSitDuration);
                  setIsWallSitRunning(false);
                  setIsWallSitFinished(false);
                }}
                className={`py-2 px-1 rounded-xl text-xs font-bold border transition text-center truncate ${
                  selectedChoice === 'WALL_SIT'
                    ? 'bg-[#E85324] border-[#E85324] text-white shadow-md'
                    : 'bg-[#12100E] border-[#2B2722] text-[#9C9388] hover:text-white'
                }`}
              >
                {lang === 'ru' ? 'Стульчик' : 'Wall Sit'}
              </button>
            </div>
          </div>

          {/* THRUSTERS OPTIONS */}
          {selectedChoice === 'THRUSTERS' && (
            <div className="space-y-3 pt-1">
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-[#9C9388] block mb-1">
                  {lang === 'ru' ? 'Число гирь:' : 'Kettlebell count:'}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedKbCount(1)}
                    className={`py-1.5 rounded-xl text-xs font-bold border transition ${
                      selectedKbCount === 1
                        ? 'bg-[#E85324] border-[#E85324] text-white'
                        : 'bg-[#12100E] border-[#2B2722] text-[#9C9388]'
                    }`}
                  >
                    {lang === 'ru' ? '1 гиря' : '1 bell'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedKbCount(2)}
                    className={`py-1.5 rounded-xl text-xs font-bold border transition ${
                      selectedKbCount === 2
                        ? 'bg-[#E85324] border-[#E85324] text-white'
                        : 'bg-[#12100E] border-[#2B2722] text-[#9C9388]'
                    }`}
                  >
                    {lang === 'ru' ? '2 гири' : '2 bells'}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-[#9C9388] block mb-1">
                  {lang === 'ru' ? 'Вес гири (кг):' : 'Weight (kg):'}
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {BLACK_JOKER_KB_WEIGHTS.map((w) => (
                    <button
                      key={w}
                      type="button"
                      onClick={() => setSelectedKbWeight(w)}
                      className={`py-1.5 rounded-xl text-xs font-bold border transition ${
                        selectedKbWeight === w
                          ? 'bg-[#E85324] border-[#E85324] text-white'
                          : 'bg-[#12100E] border-[#2B2722] text-[#9C9388]'
                      }`}
                    >
                      {w} {lang === 'ru' ? 'кг' : 'kg'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-[#9C9388] block mb-1">
                  {lang === 'ru' ? 'Повторения:' : 'Reps:'}
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {BLACK_JOKER_KB_REPS.map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setSelectedKbReps(r)}
                      className={`flex-1 min-w-[48px] py-1.5 rounded-xl text-xs font-bold border transition ${
                        selectedKbReps === r
                          ? 'bg-[#E85324] border-[#E85324] text-white'
                          : 'bg-[#12100E] border-[#2B2722] text-[#9C9388]'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-[#12100E] p-3 rounded-2xl border border-[#2B2722] flex items-center justify-between text-xs">
                <span className="text-[#9C9388] flex items-center gap-1.5 font-bold">
                  <Dumbbell className="w-4 h-4 text-[#E85324]" />
                  <span>{lang === 'ru' ? 'Тоннаж задания:' : 'Task Tonnage:'}</span>
                </span>
                <span className="font-display text-base font-bold text-[#E85324]">{jokerTonnage} kg</span>
              </div>
            </div>
          )}

          {/* BURPEES OPTIONS */}
          {selectedChoice === 'BURPEES' && (
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-[#9C9388] block mb-2">
                {lang === 'ru' ? 'Повторения для бёрпи:' : 'Burpee Reps:'}
              </label>
              <div className="grid grid-cols-3 gap-2">
                {BLACK_JOKER_BODY_REPS.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setSelectedBurpeeReps(r)}
                    className={`py-2.5 rounded-xl text-xs font-bold border transition ${
                      selectedBurpeeReps === r
                        ? 'bg-[#E85324] border-[#E85324] text-white'
                        : 'bg-[#12100E] border-[#2B2722] text-[#9C9388]'
                    }`}
                  >
                    {r} {t.repsShort}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* WALL SIT OPTIONS & TIMER */}
          {selectedChoice === 'WALL_SIT' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-[#9C9388]">
                <span>{lang === 'ru' ? 'Время стульчика:' : 'Wall Sit Duration:'}</span>
                <span className="text-[#E85324] font-bold text-xs">
                  {Math.round(selectedWallSitDuration / 60)} {t.minutesShort}
                </span>
              </div>

              {/* Countdown display */}
              <div className="bg-[#12100E] p-4 rounded-2xl border border-[#2B2722] text-center space-y-2">
                <div className="font-display text-5xl font-black text-white tabular-nums">
                  {wallSitFormatted}
                </div>
                <button
                  type="button"
                  onClick={isWallSitRunning ? pauseWallSitTimer : startWallSitTimer}
                  className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider border transition inline-flex items-center gap-1.5 ${
                    isWallSitRunning
                      ? 'bg-[#24201D] border-[#38322B] text-white'
                      : 'bg-[#E85324] border-[#E85324] text-white'
                  }`}
                >
                  {isWallSitRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-white" />}
                  <span>{isWallSitRunning ? t.pause : lang === 'ru' ? 'Старт таймера' : 'Start Timer'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Complete Button */}
      <div className="w-full max-w-sm pb-4">
        <PrimaryButton onClick={handleFinish}>
          <CheckCircle2 className="w-5 h-5" />
          <span>{t.completeTask}</span>
        </PrimaryButton>
      </div>
    </div>
  );
};
