import React, { useState } from 'react';
import { Flame, Play, Info, ChevronRight, Zap, BookmarkPlus } from 'lucide-react';
import { Exercise, SessionConfig, Suit, Preset } from '../../types';
import { Language, translations } from '../../data/translations';
import { BottomSheet } from '../components/BottomSheet';
import { ExerciseModal } from '../components/ExerciseModal';
import { calculateTotalCleanDeckReps, formatWeight } from '../../engine/scoring';

interface TableScreenProps {
  config: SessionConfig;
  onChangeConfig: (newConfig: SessionConfig) => void;
  exercises: Exercise[];
  presets: Preset[];
  onStartWorkout: () => void;
  lang: Language;
}

export const TableScreen: React.FC<TableScreenProps> = ({
  config,
  onChangeConfig,
  exercises,
  presets,
  onStartWorkout,
  lang,
}) => {
  const t = translations[lang];
  const [activeSheetSuit, setActiveSheetSuit] = useState<Suit | null>(null);
  const [inspectExercise, setInspectExercise] = useState<Exercise | null>(null);
  const [savedPresetToast, setSavedPresetToast] = useState(false);

  // Suits config (Black spades/clubs, Red hearts/diamonds)
  const suits: { id: Suit; symbol: string; title: string; color: string; border: string; bg: string }[] = [
    {
      id: 'S',
      symbol: '♠',
      title: t.suitSpades,
      color: 'text-zinc-100',
      border: 'border-zinc-700/60 hover:border-zinc-500',
      bg: 'bg-zinc-900/60',
    },
    {
      id: 'H',
      symbol: '♥',
      title: t.suitHearts,
      color: 'text-red-500',
      border: 'border-red-600/40 hover:border-red-500/70',
      bg: 'bg-red-950/20',
    },
    {
      id: 'D',
      symbol: '♦',
      title: t.suitDiamonds,
      color: 'text-red-500',
      border: 'border-red-600/40 hover:border-red-500/70',
      bg: 'bg-red-950/20',
    },
    {
      id: 'C',
      symbol: '♣',
      title: t.suitClubs,
      color: 'text-zinc-100',
      border: 'border-zinc-700/60 hover:border-zinc-500',
      bg: 'bg-zinc-900/60',
    },
  ];

  const handleApplyPreset = (preset: Preset) => {
    onChangeConfig({
      ...config,
      mode: preset.mode,
      loads: { ...preset.loads },
    });
  };

  const handleSelectMode = (mode: 'BODY' | 'KETTLEBELL' | 'CUSTOM') => {
    // If switching mode, set default matching exercises
    if (mode === 'BODY') {
      onChangeConfig({
        ...config,
        mode,
        loads: {
          S: { exerciseId: 'body_pushups', kg: 0, count: 1 },
          H: { exerciseId: 'body_squats', kg: 0, count: 1 },
          D: { exerciseId: 'body_superman', kg: 0, count: 1 },
          C: { exerciseId: 'body_crunches', kg: 0, count: 1 },
        },
      });
    } else if (mode === 'KETTLEBELL') {
      onChangeConfig({
        ...config,
        mode,
        loads: {
          S: { exerciseId: 'kb_overhead_press', kg: 16, count: 1 },
          H: { exerciseId: 'kb_goblet_squat', kg: 24, count: 1 },
          D: { exerciseId: 'kb_swings', kg: 24, count: 1 },
          C: { exerciseId: 'kb_russian_twist', kg: 16, count: 1 },
        },
      });
    } else {
      onChangeConfig({
        ...config,
        mode,
      });
    }
  };

  const cleanDeckReps = calculateTotalCleanDeckReps(config.aceValue);

  return (
    <div className="w-full max-w-md mx-auto px-4 py-4 space-y-5 pb-24">
      {/* Top Mode Segment Switcher */}
      <div className="space-y-3">
        <div className="grid grid-cols-3 p-1 rounded-2xl bg-zinc-900 border border-zinc-800 text-xs font-black">
          <button
            onClick={() => handleSelectMode('BODY')}
            className={`py-2.5 rounded-xl transition ${
              config.mode === 'BODY'
                ? 'bg-zinc-800 text-white shadow-md border border-zinc-700'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            {t.modeCalisthenics}
          </button>
          <button
            onClick={() => handleSelectMode('KETTLEBELL')}
            className={`py-2.5 rounded-xl transition ${
              config.mode === 'KETTLEBELL'
                ? 'bg-zinc-800 text-white shadow-md border border-zinc-700'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            {t.modeKettlebells}
          </button>
          <button
            onClick={() => handleSelectMode('CUSTOM')}
            className={`py-2.5 rounded-xl transition ${
              config.mode === 'CUSTOM'
                ? 'bg-zinc-800 text-white shadow-md border border-zinc-700'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            {t.modeCustom}
          </button>
        </div>

        {/* Beast Mode Toggle Card */}
        <div
          onClick={() => onChangeConfig({ ...config, beast: !config.beast })}
          className={`p-3.5 rounded-2xl border transition cursor-pointer flex items-center justify-between ${
            config.beast
              ? 'bg-gradient-to-r from-red-950/80 to-zinc-900 border-red-600/80 shadow-lg shadow-red-950/40'
              : 'bg-zinc-900/60 border-zinc-800 hover:border-zinc-700'
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`p-2.5 rounded-xl transition ${
                config.beast ? 'bg-red-600 text-white shadow-md shadow-red-900' : 'bg-zinc-800 text-zinc-400'
              }`}
            >
              <Flame className={`w-5 h-5 ${config.beast ? 'animate-pulse' : ''}`} />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-black text-sm text-white">{t.beastMode}</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-900/40 text-red-400 border border-red-800/40">
                  ★ EXTREME
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 mt-0.5">{t.beastModeDesc}</p>
            </div>
          </div>

          <div
            className={`w-12 h-7 rounded-full p-1 transition-colors duration-200 ease-in-out ${
              config.beast ? 'bg-red-600' : 'bg-zinc-800'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white transition-transform duration-200 ease-in-out ${
                config.beast ? 'transform translate-x-5' : ''
              }`}
            />
          </div>
        </div>
      </div>

      {/* Presets Carousel */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-zinc-400 px-1">
          <span>{t.quickPresets}</span>
          <span className="text-[10px] lowercase text-zinc-400">
            {presets.length} {lang === 'ru' ? 'пресетов' : 'presets'}
          </span>
        </div>
        <div className="flex gap-2.5 overflow-x-auto pb-1 pt-0.5 no-scrollbar -mx-4 px-4">
          {presets.map((preset) => {
            const name = lang === 'ru' ? preset.nameRu : preset.nameEn;
            const desc = lang === 'ru' ? preset.descRu : preset.descEn;
            const isMatch =
              config.loads.S.exerciseId === preset.loads.S.exerciseId &&
              config.loads.H.exerciseId === preset.loads.H.exerciseId &&
              config.loads.D.exerciseId === preset.loads.D.exerciseId &&
              config.loads.C.exerciseId === preset.loads.C.exerciseId;

            return (
              <button
                key={preset.id}
                onClick={() => handleApplyPreset(preset)}
                className={`min-w-[170px] max-w-[210px] p-3 rounded-2xl border text-left shrink-0 transition active:scale-98 ${
                  isMatch
                    ? 'bg-zinc-800 border-red-500 shadow-md shadow-red-950/30'
                    : 'bg-zinc-900/70 border-zinc-800 hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-black text-white truncate">{name}</span>
                  <span className="text-[9px] uppercase font-extrabold px-1.5 py-0.5 rounded bg-zinc-950 text-zinc-400 border border-zinc-800">
                    {preset.mode === 'KETTLEBELL' ? 'KB' : 'BODY'}
                  </span>
                </div>
                <p className="text-[10px] text-zinc-400 line-clamp-2 leading-relaxed">{desc}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4 Suit Tiles (War Table) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-zinc-400 px-1">
          <span>{lang === 'ru' ? 'Боевой стол (масти)' : 'War Table (Suits)'}</span>
          <span className="text-[11px] text-zinc-400 font-semibold">
            {cleanDeckReps} {t.repsShort}
          </span>
        </div>

        <div className="grid grid-cols-1 gap-2.5">
          {suits.map((s) => {
            const load = config.loads[s.id];
            const currentEx = exercises.find((e) => e.id === load.exerciseId);
            const exName = currentEx
              ? lang === 'ru'
                ? currentEx.nameRu
                : currentEx.nameEn
              : 'Unknown';

            // Cue or special note for tile
            let hint = '';
            if (currentEx?.id === 'body_navy_seal_burpees') {
              hint = lang === 'ru' ? '33 отжимания на Тузе' : '33 push-ups on Ace';
            } else if (currentEx?.sideRule === 'PER_SIDE') {
              hint = lang === 'ru' ? '×2 на каждую сторону' : '×2 per each side';
            } else if (currentEx?.sideRule === 'SPLIT_TOTAL') {
              hint = lang === 'ru' ? '½ по сторонам' : '½ split sides';
            } else if (config.mode === 'KETTLEBELL' || currentEx?.equipment === 'KETTLEBELL') {
              hint = formatWeight(load.kg, load.count, lang);
            } else {
              hint = `Tier ${currentEx?.tier || 1}`;
            }

            return (
              <div
                key={s.id}
                onClick={() => setActiveSheetSuit(s.id)}
                className={`p-3.5 rounded-2xl border transition cursor-pointer flex items-center justify-between ${s.bg} ${s.border} bg-zinc-900/60`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-10 h-10 rounded-xl bg-zinc-950 flex items-center justify-center text-2xl font-black ${s.color} border border-zinc-800 shrink-0`}>
                    {s.symbol}
                  </div>
                  <div className="min-w-0">
                    <div className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">
                      {s.title}
                    </div>
                    <div className="text-sm font-black text-white truncate mt-0.5">{exName}</div>
                    <div className="text-[11px] font-semibold text-zinc-400 truncate mt-0.5">
                      {hint}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0 ml-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (currentEx) setInspectExercise(currentEx);
                    }}
                    className="p-2 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 transition"
                    title={t.exerciseDetails}
                  >
                    <Info className="w-4 h-4" />
                  </button>
                  <div className="p-1.5 text-zinc-400">
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Deck Settings Block */}
      <div className="p-4 rounded-3xl bg-zinc-900/80 border border-zinc-800 space-y-4">
        <div className="text-xs font-bold uppercase tracking-wider text-zinc-400">
          {t.settings}
        </div>

        {/* Jokers: 0 | 1 | 2 */}
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-zinc-300">{t.jokersCount}:</span>
          <div className="flex gap-1 bg-zinc-950 p-1 rounded-xl border border-zinc-800">
            {([0, 1, 2] as const).map((num) => (
              <button
                key={num}
                onClick={() => onChangeConfig({ ...config, jokers: num })}
                className={`px-3 py-1.5 rounded-lg font-black transition ${
                  config.jokers === num
                    ? 'bg-red-600 text-white'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {num}
              </button>
            ))}
          </div>
        </div>

        {/* Ace Value: 11 | 1 */}
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-zinc-300">{t.aceNominal}:</span>
          <div className="flex gap-1 bg-zinc-950 p-1 rounded-xl border border-zinc-800">
            {([11, 1] as const).map((val) => (
              <button
                key={val}
                onClick={() => onChangeConfig({ ...config, aceValue: val })}
                className={`px-3 py-1.5 rounded-lg font-black transition ${
                  config.aceValue === val
                    ? 'bg-red-600 text-white'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {val}
              </button>
            ))}
          </div>
        </div>

        {/* Rest Interval: Manual | 5 | 10 | 15 | 20 | 30 s */}
        <div className="space-y-2 pt-1 border-t border-zinc-800/80">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-zinc-300">{t.restInterval}:</span>
            <span className="text-[11px] font-semibold text-zinc-400">
              {config.restSeconds === null ? t.manual : `${config.restSeconds} ${t.secondsShort}`}
            </span>
          </div>
          <div className="grid grid-cols-6 gap-1 bg-zinc-950 p-1 rounded-xl border border-zinc-800 text-[11px]">
            <button
              onClick={() => onChangeConfig({ ...config, restSeconds: null })}
              className={`py-1.5 rounded-lg font-bold transition text-center truncate ${
                config.restSeconds === null ? 'bg-red-600 text-white' : 'text-zinc-400'
              }`}
            >
              {lang === 'ru' ? 'Руч' : 'Man'}
            </button>
            {[5, 10, 15, 20, 30].map((s) => (
              <button
                key={s}
                onClick={() => onChangeConfig({ ...config, restSeconds: s })}
                className={`py-1.5 rounded-lg font-bold transition text-center ${
                  config.restSeconds === s ? 'bg-red-600 text-white' : 'text-zinc-400'
                }`}
              >
                {s}s
              </button>
            ))}
          </div>
        </div>

        {/* Joker Customization Panel (when jokers > 0) */}
        {config.jokers > 0 && (
          <div className="pt-3 border-t border-zinc-800/80 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                <span>★</span>
                <span>{t.jokerSettingsTitle}</span>
              </span>
              <span className="text-[10px] uppercase font-bold text-red-400 bg-red-950/60 px-2 py-0.5 rounded border border-red-900/60">
                {config.beast ? 'BEAST ON' : 'BEAST OFF'}
              </span>
            </div>

            {/* Red Joker Settings (Static Plank) */}
            <div className="bg-zinc-950/80 p-3 rounded-2xl border border-zinc-800 space-y-2">
              <div className="text-[11px] font-bold text-zinc-300 flex items-center justify-between">
                <span>{t.redJokerOption}</span>
                <span className="text-[10px] text-red-400 font-bold bg-red-950/60 px-2 py-0.5 rounded border border-red-900/60">
                  {Math.round((config.jokerSettings?.redPlankSeconds || (config.beast ? 120 : 60)) / 60)} {t.minutesShort}
                </span>
              </div>

              <div>
                <div className="text-[10px] text-zinc-400 font-medium mb-1.5 flex items-center justify-between">
                  <span>{lang === 'ru' ? 'Выбор времени планки (1 / 2 / 3 / 5 мин):' : 'Select plank duration (1 / 2 / 3 / 5 min):'}</span>
                  <span className="text-red-400 font-bold">1 / 2 / 3 / 5 {t.minutesShort}</span>
                </div>
                <div className="grid grid-cols-4 gap-1.5">
                  {[60, 120, 180, 300].map((sec) => (
                    <button
                      key={sec}
                      type="button"
                      onClick={() =>
                        onChangeConfig({
                          ...config,
                          jokerSettings: {
                            blackKbCount: config.jokerSettings?.blackKbCount || 1,
                            blackKbWeight: config.jokerSettings?.blackKbWeight || 24,
                            blackKbReps: config.jokerSettings?.blackKbReps || 30,
                            blackBodyReps: config.jokerSettings?.blackBodyReps || 30,
                            blackExerciseChoice:
                              config.jokerSettings?.blackExerciseChoice || 'BURPEES',
                            blackWallSitSeconds: config.jokerSettings?.blackWallSitSeconds || 120,
                            redPlankSeconds: sec,
                          },
                        })
                      }
                      className={`py-1.5 rounded-xl text-xs font-black border transition ${
                        (config.jokerSettings?.redPlankSeconds || (config.beast ? 120 : 60)) === sec
                          ? 'bg-red-600 border-red-500 text-white shadow-md shadow-red-950'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                      }`}
                    >
                      {sec / 60} {t.minutesShort}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Black Joker Settings (Dynamic / Challenge) */}
            <div className="bg-zinc-950/80 p-3 rounded-2xl border border-zinc-800 space-y-2.5">
              <div className="text-[11px] font-bold text-zinc-300 flex items-center justify-between">
                <span>{t.blackJokerOption}</span>
                <span className="text-[10px] text-amber-400 font-semibold bg-amber-950/40 px-2 py-0.5 rounded border border-amber-900/40">
                  {lang === 'ru' ? 'Трастеры • Бёрпи • Стульчик' : 'Thrusters • Burpees • Wall Sit'}
                </span>
              </div>

              {/* 3-way Exercise Selector: Трастеры / Бёрпи / Стульчик (available in ALL modes) */}
              <div className="space-y-2.5 text-left">
                <div>
                  <div className="text-[10px] text-zinc-400 font-medium mb-1.5 flex items-center justify-between">
                    <span>{lang === 'ru' ? 'Выбор упражнения Джокера:' : 'Joker exercise choice:'}</span>
                    <span className="text-[10px] text-zinc-500 font-bold">
                      {lang === 'ru' ? 'Доступно в Гирях и Калистенике' : 'Available in KB & Calisthenics'}
                    </span>
                  </div>
                  <div className={`grid ${!config.beast ? 'grid-cols-4' : 'grid-cols-3'} gap-1.5`}>
                    <button
                      type="button"
                      onClick={() =>
                        onChangeConfig({
                          ...config,
                          jokerSettings: {
                            redPlankSeconds: config.jokerSettings?.redPlankSeconds || 120,
                            blackKbCount: config.jokerSettings?.blackKbCount || 1,
                            blackKbWeight: config.jokerSettings?.blackKbWeight || 24,
                            blackKbReps: config.jokerSettings?.blackKbReps || 30,
                            blackBodyReps: config.jokerSettings?.blackBodyReps || 30,
                            blackWallSitSeconds: config.jokerSettings?.blackWallSitSeconds || 120,
                            blackExerciseChoice: 'THRUSTERS',
                          },
                        })
                      }
                      className={`py-1.5 rounded-xl text-xs font-black border transition truncate text-center ${
                        (config.jokerSettings?.blackExerciseChoice ||
                          (config.mode === 'KETTLEBELL' ? 'THRUSTERS' : 'BURPEES')) ===
                        'THRUSTERS'
                          ? 'bg-red-600 border-red-500 text-white shadow-md shadow-red-950'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                      }`}
                    >
                      {lang === 'ru' ? 'Трастеры' : 'Thrusters'}
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        onChangeConfig({
                          ...config,
                          jokerSettings: {
                            redPlankSeconds: config.jokerSettings?.redPlankSeconds || 120,
                            blackKbCount: config.jokerSettings?.blackKbCount || 1,
                            blackKbWeight: config.jokerSettings?.blackKbWeight || 24,
                            blackKbReps: config.jokerSettings?.blackKbReps || 30,
                            blackBodyReps: config.jokerSettings?.blackBodyReps || 30,
                            blackWallSitSeconds: config.jokerSettings?.blackWallSitSeconds || 120,
                            blackExerciseChoice: 'BURPEES',
                          },
                        })
                      }
                      className={`py-1.5 rounded-xl text-xs font-black border transition truncate text-center ${
                        (config.jokerSettings?.blackExerciseChoice ||
                          (config.mode === 'KETTLEBELL' ? 'THRUSTERS' : 'BURPEES')) === 'BURPEES'
                          ? 'bg-red-600 border-red-500 text-white shadow-md shadow-red-950'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                      }`}
                    >
                      {lang === 'ru' ? 'Бёрпи' : 'Burpees'}
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        onChangeConfig({
                          ...config,
                          jokerSettings: {
                            redPlankSeconds: config.jokerSettings?.redPlankSeconds || 120,
                            blackKbCount: config.jokerSettings?.blackKbCount || 1,
                            blackKbWeight: config.jokerSettings?.blackKbWeight || 24,
                            blackKbReps: config.jokerSettings?.blackKbReps || 30,
                            blackBodyReps: config.jokerSettings?.blackBodyReps || 30,
                            blackWallSitSeconds: config.jokerSettings?.blackWallSitSeconds || 120,
                            blackExerciseChoice: 'WALL_SIT',
                          },
                        })
                      }
                      className={`py-1.5 rounded-xl text-xs font-black border transition truncate text-center ${
                        (config.jokerSettings?.blackExerciseChoice ||
                          (config.mode === 'KETTLEBELL' ? 'THRUSTERS' : 'BURPEES')) === 'WALL_SIT'
                          ? 'bg-amber-600 border-amber-500 text-white shadow-md shadow-amber-950'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                      }`}
                    >
                      {lang === 'ru' ? 'Стульчик' : 'Wall Sit'}
                    </button>

                    {!config.beast && (
                      <button
                        type="button"
                        onClick={() =>
                          onChangeConfig({
                            ...config,
                            jokerSettings: {
                              redPlankSeconds: config.jokerSettings?.redPlankSeconds || 120,
                              blackKbCount: config.jokerSettings?.blackKbCount || 1,
                              blackKbWeight: config.jokerSettings?.blackKbWeight || 24,
                              blackKbReps: config.jokerSettings?.blackKbReps || 30,
                              blackBodyReps: config.jokerSettings?.blackBodyReps || 30,
                              blackWallSitSeconds: config.jokerSettings?.blackWallSitSeconds || 120,
                              blackExerciseChoice: 'SUIT_15',
                            },
                          })
                        }
                        className={`py-1.5 rounded-xl text-xs font-black border transition truncate text-center ${
                          config.jokerSettings?.blackExerciseChoice === 'SUIT_15'
                            ? 'bg-red-600 border-red-500 text-white shadow-md shadow-red-950'
                            : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                        }`}
                      >
                        {lang === 'ru' ? '15 повт' : '15 reps'}
                      </button>
                    )}
                  </div>
                </div>

                {/* Sub-parameters based on chosen exercise */}
                {(config.jokerSettings?.blackExerciseChoice ||
                  (config.mode === 'KETTLEBELL' ? 'THRUSTERS' : 'BURPEES')) === 'THRUSTERS' && (
                  <div className="space-y-2 pt-1 border-t border-zinc-800/80">
                    <div>
                      <div className="text-[10px] text-zinc-400 font-medium mb-1">
                        {lang === 'ru' ? 'Число гирь на выбор:' : 'Kettlebell count:'}
                      </div>
                      <div className="grid grid-cols-2 gap-1.5">
                        {([1, 2] as const).map((cnt) => (
                          <button
                            key={cnt}
                            type="button"
                            onClick={() =>
                              onChangeConfig({
                                ...config,
                                jokerSettings: {
                                  redPlankSeconds: config.jokerSettings?.redPlankSeconds || 120,
                                  blackKbWeight: config.jokerSettings?.blackKbWeight || 24,
                                  blackKbReps: config.jokerSettings?.blackKbReps || 30,
                                  blackBodyReps: config.jokerSettings?.blackBodyReps || 30,
                                  blackExerciseChoice: 'THRUSTERS',
                                  blackWallSitSeconds: config.jokerSettings?.blackWallSitSeconds || 120,
                                  blackKbCount: cnt,
                                },
                              })
                            }
                            className={`py-1 rounded-xl text-xs font-black border transition ${
                              (config.jokerSettings?.blackKbCount || 1) === cnt
                                ? 'bg-red-600 border-red-500 text-white'
                                : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                            }`}
                          >
                            {cnt === 1
                              ? lang === 'ru'
                                ? '1 гиря'
                                : '1 bell'
                              : lang === 'ru'
                              ? '2 гири'
                              : '2 bells'}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="text-[10px] text-zinc-400 font-medium mb-1">
                        {lang === 'ru' ? 'Вес гири на выбор:' : 'Weight selection:'}
                      </div>
                      <div className="grid grid-cols-3 gap-1.5">
                        {([16, 24, 32] as const).map((w) => (
                          <button
                            key={w}
                            type="button"
                            onClick={() =>
                              onChangeConfig({
                                ...config,
                                jokerSettings: {
                                  redPlankSeconds: config.jokerSettings?.redPlankSeconds || 120,
                                  blackKbCount: config.jokerSettings?.blackKbCount || 1,
                                  blackKbReps: config.jokerSettings?.blackKbReps || 30,
                                  blackBodyReps: config.jokerSettings?.blackBodyReps || 30,
                                  blackExerciseChoice: 'THRUSTERS',
                                  blackWallSitSeconds: config.jokerSettings?.blackWallSitSeconds || 120,
                                  blackKbWeight: w,
                                },
                              })
                            }
                            className={`py-1 rounded-xl text-xs font-black border transition ${
                              (config.jokerSettings?.blackKbWeight || 24) === w
                                ? 'bg-red-600 border-red-500 text-white'
                                : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                            }`}
                          >
                            {w} {lang === 'ru' ? 'кг' : 'kg'}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="text-[10px] text-zinc-400 font-medium mb-1">
                        {lang === 'ru' ? 'Повторения (трастеры):' : 'Thruster reps selection:'}
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {([20, 30, 50, 70, 100] as const).map((r) => (
                          <button
                            key={r}
                            type="button"
                            onClick={() =>
                              onChangeConfig({
                                ...config,
                                jokerSettings: {
                                  redPlankSeconds: config.jokerSettings?.redPlankSeconds || 120,
                                  blackKbCount: config.jokerSettings?.blackKbCount || 1,
                                  blackKbWeight: config.jokerSettings?.blackKbWeight || 24,
                                  blackBodyReps: config.jokerSettings?.blackBodyReps || 30,
                                  blackExerciseChoice: 'THRUSTERS',
                                  blackWallSitSeconds: config.jokerSettings?.blackWallSitSeconds || 120,
                                  blackKbReps: r,
                                },
                              })
                            }
                            className={`flex-1 min-w-[42px] py-1 rounded-xl text-xs font-black border transition ${
                              (config.jokerSettings?.blackKbReps || 30) === r
                                ? 'bg-red-600 border-red-500 text-white'
                                : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                            }`}
                          >
                            {r}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Live Tonnage calculation */}
                    <div className="bg-zinc-900/60 p-2 rounded-xl border border-zinc-800/80 flex items-center justify-between text-xs">
                      <span className="text-zinc-400 font-medium">
                        {lang === 'ru' ? 'Тоннаж задания:' : 'Task Tonnage:'}
                      </span>
                      <span className="font-black text-amber-400">
                        {(config.jokerSettings?.blackKbCount || 1) *
                          (config.jokerSettings?.blackKbWeight || 24) *
                          (config.jokerSettings?.blackKbReps || 30)}{' '}
                        kg
                      </span>
                    </div>
                  </div>
                )}

                {(config.jokerSettings?.blackExerciseChoice ||
                  (config.mode === 'KETTLEBELL' ? 'THRUSTERS' : 'BURPEES')) === 'BURPEES' && (
                  <div className="pt-1 border-t border-zinc-800/80">
                    <div className="text-[10px] text-zinc-400 font-medium mb-1">
                      {lang === 'ru' ? 'Повторения для бёрпи на выбор:' : 'Burpee reps selection:'}
                    </div>
                    <div className="grid grid-cols-3 gap-1.5">
                      {([20, 30, 50] as const).map((r) => (
                        <button
                          key={r}
                          type="button"
                          onClick={() =>
                            onChangeConfig({
                              ...config,
                              jokerSettings: {
                                redPlankSeconds: config.jokerSettings?.redPlankSeconds || 120,
                                blackKbCount: config.jokerSettings?.blackKbCount || 1,
                                blackKbWeight: config.jokerSettings?.blackKbWeight || 24,
                                blackKbReps: config.jokerSettings?.blackKbReps || 30,
                                blackExerciseChoice: 'BURPEES',
                                blackWallSitSeconds: config.jokerSettings?.blackWallSitSeconds || 120,
                                blackBodyReps: r,
                              },
                            })
                          }
                          className={`py-1 rounded-xl text-xs font-black border transition ${
                            (config.jokerSettings?.blackBodyReps || 30) === r
                              ? 'bg-red-600 border-red-500 text-white'
                              : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                          }`}
                        >
                          {r} {t.repsShort}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {(config.jokerSettings?.blackExerciseChoice ||
                  (config.mode === 'KETTLEBELL' ? 'THRUSTERS' : 'BURPEES')) === 'WALL_SIT' && (
                  <div className="pt-1 border-t border-zinc-800/80">
                    <div className="text-[10px] text-zinc-400 font-medium mb-1 flex items-center justify-between">
                      <span>{lang === 'ru' ? 'Время стульчика у стены (1 / 2 / 3 / 5 мин):' : 'Wall sit duration (1 / 2 / 3 / 5 min):'}</span>
                      <span className="text-amber-400 font-bold">1 / 2 / 3 / 5 {t.minutesShort}</span>
                    </div>
                    <div className="grid grid-cols-4 gap-1.5">
                      {[60, 120, 180, 300].map((sec) => (
                        <button
                          key={sec}
                          type="button"
                          onClick={() =>
                            onChangeConfig({
                              ...config,
                              jokerSettings: {
                                redPlankSeconds: config.jokerSettings?.redPlankSeconds || 120,
                                blackKbCount: config.jokerSettings?.blackKbCount || 1,
                                blackKbWeight: config.jokerSettings?.blackKbWeight || 24,
                                blackKbReps: config.jokerSettings?.blackKbReps || 30,
                                blackBodyReps: config.jokerSettings?.blackBodyReps || 30,
                                blackExerciseChoice: 'WALL_SIT',
                                blackWallSitSeconds: sec,
                              },
                            })
                          }
                          className={`py-1 rounded-xl text-xs font-black border transition ${
                            (config.jokerSettings?.blackWallSitSeconds || 120) === sec
                              ? 'bg-amber-600 border-amber-500 text-white shadow-md shadow-amber-950'
                              : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                          }`}
                        >
                          {sec / 60} {t.minutesShort}
                        </button>
                      ))}
                    </div>
                    <p className="text-[10px] text-zinc-400 mt-1 leading-tight">
                      {lang === 'ru'
                        ? 'Изометрическое удержание позы сидя у стены без опоры на стул под углом 90°'
                        : 'Isometric hold: seated posture against a wall without a chair at 90°'}
                    </p>
                  </div>
                )}

                {config.jokerSettings?.blackExerciseChoice === 'SUIT_15' && (
                  <div className="pt-1 border-t border-zinc-800/80">
                    <div className="text-[11px] text-zinc-400 bg-zinc-900/60 p-2 rounded-xl">
                      {lang === 'ru'
                        ? '15 повторений основного упражнения случайной масти'
                        : '15 reps of main exercise of random suit'}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Big Red Button Fixed at bottom */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-zinc-950 via-zinc-950/95 to-transparent z-30">
        <div className="max-w-md mx-auto">
          <button
            onClick={onStartWorkout}
            className="w-full py-4 px-6 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-black text-base uppercase tracking-wider shadow-2xl shadow-red-950/80 border border-red-500/40 flex items-center justify-center gap-2.5 transition active:scale-98"
          >
            <Play className="w-5 h-5 fill-white" />
            <span>{t.dealDeck}</span>
          </button>
        </div>
      </div>

      {/* Bottom Sheet for Suit Exercise & Weight selection */}
      {activeSheetSuit && (
        <BottomSheet
          isOpen={true}
          onClose={() => setActiveSheetSuit(null)}
          suit={activeSheetSuit}
          exercises={exercises.filter((e) => {
            if (config.mode === 'BODY') return e.equipment === 'BODY' && e.suit === activeSheetSuit;
            if (config.mode === 'KETTLEBELL') return e.equipment === 'KETTLEBELL' && e.suit === activeSheetSuit;
            return e.suit === activeSheetSuit;
          })}
          currentLoad={config.loads[activeSheetSuit]}
          isKettlebellMode={config.mode === 'KETTLEBELL'}
          onSelectExercise={(exerciseId) => {
            onChangeConfig({
              ...config,
              loads: {
                ...config.loads,
                [activeSheetSuit]: {
                  ...config.loads[activeSheetSuit],
                  exerciseId,
                },
              },
            });
          }}
          onUpdateLoad={(patch) => {
            onChangeConfig({
              ...config,
              loads: {
                ...config.loads,
                [activeSheetSuit]: {
                  ...config.loads[activeSheetSuit],
                  ...patch,
                },
              },
            });
          }}
          onOpenInfo={(ex) => setInspectExercise(ex)}
          lang={lang}
        />
      )}

      {/* Info Modal */}
      {inspectExercise && (
        <ExerciseModal
          exercise={inspectExercise}
          onClose={() => setInspectExercise(null)}
          lang={lang}
        />
      )}
    </div>
  );
};
