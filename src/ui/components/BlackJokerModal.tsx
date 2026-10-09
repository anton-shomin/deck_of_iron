import React, { useState, useEffect, useRef } from 'react';
import { Skull, CheckCircle2, Zap, Dumbbell, Play, Pause, Flame } from 'lucide-react';
import { Exercise, SessionConfig, Suit, BlackJokerChoice } from '../../types';
import { Language, translations } from '../../data/translations';
import {
  getBlackJokerTask,
  BLACK_JOKER_KB_WEIGHTS,
  BLACK_JOKER_KB_REPS,
  BLACK_JOKER_BODY_REPS,
  WALL_SIT_DURATIONS,
} from '../../engine/jokers';
import { playCountdownBeep, playCountdownFinalBeep, playGong } from '../../platform/audio';
import { triggerCountdownHaptic, triggerGongHaptic } from '../../platform/haptics';

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

  // Selected exercise type: 'THRUSTERS' | 'BURPEES' | 'WALL_SIT'
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

  // Sync remaining time when user switches Wall Sit duration
  const handleSelectWallSitDuration = (sec: number) => {
    if (isWallSitRunning) return;
    setSelectedWallSitDuration(sec);
    setWallSitRemaining(sec);
    wallSitPausedTimeRef.current = sec;
    setIsWallSitFinished(false);
  };

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

  // Compute active task based on interactive choices
  const task = getBlackJokerTask(config, exercises, {
    exerciseChoice: selectedChoice,
    reps: selectedChoice === 'THRUSTERS' ? selectedKbReps : selectedBurpeeReps,
    bellCount: selectedKbCount,
    weightKg: selectedKbWeight,
    wallSitSeconds: selectedWallSitDuration,
    suit: selectedOffSuit,
  });

  const jokerTonnage =
    selectedChoice === 'THRUSTERS'
      ? selectedKbCount * selectedKbWeight * selectedKbReps
      : 0;

  const handleFinish = () => {
    playGong();
    triggerGongHaptic();
    onComplete({
      reps: task.reps,
      tonnageKg: jokerTonnage,
    });
  };

  const wallSitMins = Math.floor(wallSitRemaining / 60);
  const wallSitSecs = wallSitRemaining % 60;
  const wallSitTimeFormatted = `${wallSitMins}:${wallSitSecs.toString().padStart(2, '0')}`;
  const wallSitProgress = Math.max(
    0,
    Math.min(
      100,
      Math.round(((selectedWallSitDuration - wallSitRemaining) / selectedWallSitDuration) * 100)
    )
  );

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-between bg-zinc-950/98 p-5 text-white animate-in zoom-in-95 duration-200 overflow-y-auto">
      {/* Header */}
      <div className="w-full max-w-sm pt-2 text-center">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-700 text-zinc-300 text-xs font-black tracking-widest uppercase mb-1.5">
          <Skull className="w-4 h-4 text-zinc-200" />
          <span>{t.blackJokerTitle}</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
          {lang === 'ru' ? task.titleRu : task.titleEn}
        </h2>
        {config.beast ? (
          <p className="text-xs text-red-500 font-semibold mt-1 flex items-center justify-center gap-1">
            <Zap className="w-3.5 h-3.5 fill-red-500" />
            ★ BEAST MODE DYNAMIC
          </p>
        ) : (
          <p className="text-xs text-zinc-400 font-medium mt-1">
            {lang === 'ru' ? 'Выбор упражнения Джокера на бой' : 'Joker Challenge Selection'}
          </p>
        )}
      </div>

      {/* Main Card with interactive choices */}
      <div className="w-full max-w-sm my-auto bg-zinc-900/90 border border-zinc-800 rounded-3xl p-5 text-center space-y-4 shadow-2xl">
        {/* If Wall Sit selected, show isometric countdown timer */}
        {selectedChoice === 'WALL_SIT' ? (
          <div className="space-y-3">
            <div className="relative w-44 h-44 mx-auto flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="44"
                  className="text-zinc-950"
                  strokeWidth="7"
                  stroke="currentColor"
                  fill="transparent"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="44"
                  className="text-amber-500 transition-all duration-300 ease-linear"
                  strokeWidth="7"
                  strokeDasharray={276.46}
                  strokeDashoffset={276.46 * (1 - wallSitProgress / 100)}
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="transparent"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-black tracking-tight tabular-nums">
                  {wallSitTimeFormatted}
                </span>
                <span className="text-[10px] uppercase font-extrabold tracking-widest text-zinc-400 mt-1">
                  {isWallSitFinished
                    ? lang === 'ru'
                      ? 'ВЫПОЛНЕНО!'
                      : 'COMPLETE!'
                    : isWallSitRunning
                    ? lang === 'ru'
                      ? 'СИДИМ!'
                      : 'HOLDING!'
                    : lang === 'ru'
                    ? 'СТАРТ'
                    : 'READY'}
                </span>
              </div>
            </div>

            <div className="flex gap-2 justify-center">
              <button
                type="button"
                onClick={isWallSitRunning ? pauseWallSitTimer : startWallSitTimer}
                className={`py-2 px-4 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition ${
                  isWallSitRunning
                    ? 'bg-zinc-800 text-zinc-200 border border-zinc-700'
                    : 'bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-950'
                }`}
              >
                {isWallSitRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white" />}
                <span>
                  {isWallSitRunning
                    ? t.pause
                    : lang === 'ru'
                    ? 'Запустить стульчик'
                    : 'Start Wall Sit'}
                </span>
              </button>
            </div>
          </div>
        ) : (
          /* Standard Reps Display */
          <div className="w-20 h-20 mx-auto rounded-3xl bg-zinc-950 border border-zinc-800 flex items-center justify-center text-4xl font-black text-white shadow-inner">
            {task.reps}
          </div>
        )}

        <div>
          <span className="text-xs uppercase font-extrabold tracking-widest text-zinc-400">
            {selectedChoice === 'WALL_SIT'
              ? lang === 'ru'
                ? 'Изометрическая статика'
                : 'Isometric Hold'
              : t.totalReps}
          </span>
          <p className="text-xs text-zinc-300 mt-1.5 leading-relaxed">
            {lang === 'ru' ? task.descriptionRu : task.descriptionEn}
          </p>
        </div>

        {/* Dynamic Selector Panel - Available in BOTH Kettlebell and Calisthenics modes */}
        <div className="space-y-3 pt-3 border-t border-zinc-800 text-left">
          {/* Exercise Selector: Трастеры / Бёрпи / Стульчик (and 15 повт if Beast OFF) */}
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 block mb-1.5">
              {lang === 'ru' ? 'Выбор упражнения Джокера:' : 'Joker Exercise Selection:'}
            </label>
            <div className={`grid ${!config.beast ? 'grid-cols-4' : 'grid-cols-3'} gap-1.5`}>
              <button
                type="button"
                onClick={() => {
                  setSelectedChoice('THRUSTERS');
                  setIsWallSitRunning(false);
                }}
                className={`py-2 px-1 rounded-xl text-xs font-black border transition text-center truncate ${
                  selectedChoice === 'THRUSTERS'
                    ? 'bg-red-600 border-red-500 text-white shadow-md shadow-red-950'
                    : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white'
                }`}
              >
                {lang === 'ru' ? 'Трастеры' : 'Thrusters'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedChoice('BURPEES');
                  setIsWallSitRunning(false);
                }}
                className={`py-2 px-1 rounded-xl text-xs font-black border transition text-center truncate ${
                  selectedChoice === 'BURPEES'
                    ? 'bg-red-600 border-red-500 text-white shadow-md shadow-red-950'
                    : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white'
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
                className={`py-2 px-1 rounded-xl text-xs font-black border transition text-center truncate ${
                  selectedChoice === 'WALL_SIT'
                    ? 'bg-amber-600 border-amber-500 text-white shadow-md shadow-amber-950'
                    : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white'
                }`}
              >
                {lang === 'ru' ? 'Стульчик' : 'Wall Sit'}
              </button>
              {!config.beast && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedChoice('SUIT_15');
                    setIsWallSitRunning(false);
                  }}
                  className={`py-2 px-1 rounded-xl text-xs font-black border transition text-center truncate ${
                    selectedChoice === 'SUIT_15'
                      ? 'bg-red-600 border-red-500 text-white shadow-md shadow-red-950'
                      : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white'
                  }`}
                >
                  {lang === 'ru' ? '15 повт' : '15 reps'}
                </button>
              )}
            </div>
          </div>

          {/* If THRUSTERS selected: choice of 1/2 bells, 16/24/32 kg, 20/30/50/70/100 reps */}
          {selectedChoice === 'THRUSTERS' && (
            <div className="space-y-3 pt-1">
              {/* 1 or 2 bells */}
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 block mb-1">
                  {lang === 'ru' ? 'Число гирь на выбор:' : 'Kettlebell count:'}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedKbCount(1)}
                    className={`py-1.5 rounded-xl text-xs font-black border transition ${
                      selectedKbCount === 1
                        ? 'bg-red-600 border-red-500 text-white'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white'
                    }`}
                  >
                    {lang === 'ru' ? '1 гиря' : '1 bell'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedKbCount(2)}
                    className={`py-1.5 rounded-xl text-xs font-black border transition ${
                      selectedKbCount === 2
                        ? 'bg-red-600 border-red-500 text-white'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white'
                    }`}
                  >
                    {lang === 'ru' ? '2 гири' : '2 bells'}
                  </button>
                </div>
              </div>

              {/* Weight: 16 / 24 / 32 kg */}
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 block mb-1">
                  {lang === 'ru' ? 'Вес гири на выбор (кг):' : 'Weight (kg):'}
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {BLACK_JOKER_KB_WEIGHTS.map((w) => (
                    <button
                      key={w}
                      type="button"
                      onClick={() => setSelectedKbWeight(w)}
                      className={`py-1.5 rounded-xl text-xs font-black border transition ${
                        selectedKbWeight === w
                          ? 'bg-red-600 border-red-500 text-white'
                          : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white'
                      }`}
                    >
                      {w} {lang === 'ru' ? 'кг' : 'kg'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Reps: 20 / 30 / 50 / 70 / 100 */}
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 block mb-1">
                  {lang === 'ru' ? 'Повторения (трастеры):' : 'Thruster reps:'}
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {BLACK_JOKER_KB_REPS.map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setSelectedKbReps(r)}
                      className={`flex-1 min-w-[48px] py-1.5 rounded-xl text-xs font-black border transition ${
                        selectedKbReps === r
                          ? 'bg-red-600 border-red-500 text-white'
                          : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              {/* Live Tonnage calculation */}
              <div className="bg-zinc-950 p-2.5 rounded-xl border border-zinc-800 flex items-center justify-between text-xs">
                <span className="text-zinc-400 flex items-center gap-1 font-semibold">
                  <Dumbbell className="w-3.5 h-3.5 text-amber-500" />
                  {lang === 'ru' ? 'Тоннаж задания:' : 'Task Tonnage:'}
                </span>
                <span className="font-black text-amber-400">{jokerTonnage} kg</span>
              </div>
            </div>
          )}

          {/* If BURPEES selected: choice of 20 / 30 / 50 reps */}
          {selectedChoice === 'BURPEES' && (
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 block mb-1.5">
                {lang === 'ru' ? 'Повторения для бёрпи на выбор:' : 'Burpee Reps:'}
              </label>
              <div className="grid grid-cols-3 gap-2">
                {BLACK_JOKER_BODY_REPS.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setSelectedBurpeeReps(r)}
                    className={`py-2 rounded-xl text-xs font-black border transition ${
                      selectedBurpeeReps === r
                        ? 'bg-red-600 border-red-500 text-white'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white'
                    }`}
                  >
                    {r} {t.repsShort}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* If WALL_SIT selected: display wall sit details */}
          {selectedChoice === 'WALL_SIT' && (
            <div>
              <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                <span>{lang === 'ru' ? 'Время стульчика (задано в настройках):' : 'Wall Sit Duration (Preset):'}</span>
                <span className="text-amber-400 font-extrabold text-xs">
                  {Math.round(selectedWallSitDuration / 60)} {t.minutesShort}
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 bg-zinc-950 p-2.5 rounded-xl border border-zinc-800 leading-relaxed text-left">
                {lang === 'ru'
                  ? 'Удерживайте позу сидя у стены без опоры на стул под прямым углом 90° в коленях.'
                  : 'Hold a seated posture with back flat against a wall and knees at a 90° bend.'}
              </p>
            </div>
          )}

          {/* If SUIT_15 selected: choose suit */}
          {selectedChoice === 'SUIT_15' && (
            <div className="space-y-2 pt-1 text-left">
              <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 block mb-1">
                {lang === 'ru' ? 'Выбор масти упражнения (15 повторений):' : 'Suit Exercise (15 reps):'}
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {(['S', 'H', 'D', 'C'] as Suit[]).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setSelectedOffSuit(st)}
                    className={`py-2 rounded-xl text-sm font-black border transition ${
                      selectedOffSuit === st
                        ? 'bg-red-600 border-red-500 text-white'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white'
                    }`}
                  >
                    {st === 'S' ? '♠' : st === 'H' ? '♥' : st === 'D' ? '♦' : '♣'}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Complete Button */}
      <div className="w-full max-w-sm pb-4">
        <button
          onClick={handleFinish}
          className="w-full flex items-center justify-center gap-2 py-4 px-6 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-black text-sm uppercase tracking-wider shadow-xl shadow-red-950/60 transition active:scale-98"
        >
          <CheckCircle2 className="w-5 h-5" />
          <span>{t.completeTask}</span>
        </button>
      </div>
    </div>
  );
};
