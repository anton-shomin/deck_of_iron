import React, { useState } from 'react';
import { Play, ChevronRight, Settings2, Sparkles, Flame, HelpCircle, Dumbbell } from 'lucide-react';
import { CardMode, Exercise, Preset, SessionConfig, Suit } from '../../types';
import { Language, translations } from '../../data/translations';
import { BottomSheet } from '../components/BottomSheet';
import { ExerciseModal } from '../components/ExerciseModal';
import { calculateDeckTotalReps, calculateDeckTotalTonnage } from '../../engine/scoring';

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
  const [showAdvancedSettings, setShowAdvancedSettings] = useState<boolean>(false);

  // Suits config mapping
  const suits: { suit: Suit; symbol: string; color: string; cardBg: string }[] = [
    { suit: 'S', symbol: '♠', color: '#1a1a1a', cardBg: '#ece7db' },
    { suit: 'H', symbol: '♥', color: '#d92626', cardBg: '#ece7db' },
    { suit: 'D', symbol: '♦', color: '#d92626', cardBg: '#ece7db' },
    { suit: 'C', symbol: '♣', color: '#1a1a1a', cardBg: '#ece7db' },
  ];

  // Helper to resolve exercise for suit
  const getExerciseForSuit = (suit: Suit): Exercise | undefined => {
    const load = config.loads[suit];
    if (load && load.exerciseId) {
      const found = exercises.find((e) => e.id === load.exerciseId);
      if (found) return found;
    }
    return exercises.find((e) => e.suit === suit);
  };

  // Switch mode (Calisthenics / Kettlebell / Custom)
  const handleModeChange = (mode: CardMode) => {
    let preset: Preset | undefined;
    if (mode === 'BODY') preset = presets.find((p) => p.id === 'body_prison');
    else if (mode === 'KETTLEBELL') preset = presets.find((p) => p.id === 'kb_iron_beast');

    if (preset) {
      onChangeConfig({
        ...config,
        mode,
        loads: {
          S: { ...preset.loads.S },
          H: { ...preset.loads.H },
          D: { ...preset.loads.D },
          C: { ...preset.loads.C },
        },
      });
    } else {
      onChangeConfig({ ...config, mode });
    }
  };

  // Apply a preset
  const handleApplyPreset = (preset: Preset) => {
    onChangeConfig({
      ...config,
      mode: preset.mode,
      loads: {
        S: { ...preset.loads.S },
        H: { ...preset.loads.H },
        D: { ...preset.loads.D },
        C: { ...preset.loads.C },
      },
    });
  };

  // Total summary calculations
  const totalReps = calculateDeckTotalReps(config.aceValue, config.jokers);
  const totalTonnage =
    config.mode === 'KETTLEBELL'
      ? calculateDeckTotalTonnage(config.loads, config.aceValue)
      : 0;

  return (
    <div className="w-full max-w-md mx-auto px-4 pt-2 pb-28 space-y-4 select-none">
      {/* 1. TOP MODE SWITCHER SEGMENT */}
      <div className="bg-[#191715] p-1 rounded-2xl border border-[#2b2722] flex items-center">
        <button
          type="button"
          onClick={() => handleModeChange('BODY')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition text-center ${
            config.mode === 'BODY'
              ? 'bg-[#ece7db] text-[#141210] shadow-md font-extrabold'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          {lang === 'ru' ? 'Калистеника' : 'Calisthenics'}
        </button>
        <button
          type="button"
          onClick={() => handleModeChange('KETTLEBELL')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition text-center ${
            config.mode === 'KETTLEBELL'
              ? 'bg-[#ece7db] text-[#141210] shadow-md font-extrabold'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          {lang === 'ru' ? 'Гири' : 'Kettlebells'}
        </button>
        <button
          type="button"
          onClick={() => handleModeChange('CUSTOM')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition text-center ${
            config.mode === 'CUSTOM'
              ? 'bg-[#ece7db] text-[#141210] shadow-md font-extrabold'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          {lang === 'ru' ? 'Своя' : 'Custom'}
        </button>
      </div>

      {/* 2. PRESETS HORIZONTAL PILLS */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
        {presets.map((p) => {
          const isSelected =
            p.mode === config.mode &&
            p.loads.S.exerciseId === config.loads.S.exerciseId &&
            p.loads.H.exerciseId === config.loads.H.exerciseId &&
            p.loads.D.exerciseId === config.loads.D.exerciseId &&
            p.loads.C.exerciseId === config.loads.C.exerciseId;

          const name = lang === 'ru' ? p.nameRu : p.nameEn;

          return (
            <button
              key={p.id}
              type="button"
              onClick={() => handleApplyPreset(p)}
              className={`whitespace-nowrap px-4 py-2 rounded-full text-xs font-bold border transition ${
                isSelected
                  ? 'bg-[#e85324]/10 border-[#e85324] text-[#e85324]'
                  : 'bg-[#191715] border-[#2b2722] text-zinc-300 hover:border-zinc-700'
              }`}
            >
              {name}
            </button>
          );
        })}
      </div>

      {/* 3. EXERCISE CARDS BY SUIT */}
      <div className="space-y-3">
        {suits.map((s) => {
          const exercise = getExerciseForSuit(s.suit);
          const load = config.loads[s.suit];

          const exerciseName = exercise
            ? lang === 'ru'
              ? exercise.nameRu
              : exercise.nameEn
            : s.suit;

          const categoryName = exercise
            ? lang === 'ru'
              ? exercise.categoryRu
              : exercise.categoryEn
            : '';

          return (
            <div
              key={s.suit}
              onClick={() => setActiveSheetSuit(s.suit)}
              className="bg-[#191715] hover:bg-[#201d1a] border border-[#2b2722] rounded-2xl p-3.5 flex items-center justify-between cursor-pointer transition active:scale-[0.99]"
            >
              <div className="flex items-center gap-3.5">
                {/* Playing card suit icon badge matching design */}
                <div
                  className="w-12 h-14 rounded-xl flex items-center justify-center shadow-md font-black text-2xl"
                  style={{ backgroundColor: s.cardBg, color: s.color }}
                >
                  {s.symbol}
                </div>

                <div className="space-y-0.5">
                  <h3 className="font-display text-lg font-bold tracking-tight text-[#f2efe9] uppercase leading-tight">
                    {exerciseName}
                  </h3>
                  <p className="text-xs text-zinc-400 font-medium">
                    {categoryName}
                  </p>
                </div>
              </div>

              {/* Weight or Load Count Badge */}
              <div className="flex items-center gap-1.5">
                {config.mode === 'KETTLEBELL' && load ? (
                  <div className="bg-[#24211d] border border-[#36312a] px-3 py-1.5 rounded-xl font-display text-base font-bold text-[#f2efe9]">
                    {load.count > 1 ? `${load.count} × ${load.kg}` : `${load.kg} кг`}
                  </div>
                ) : (
                  <div className="text-zinc-500 text-xs">›</div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 4. BEAST MODE & QUICK CONFIGSUMMARY ROW */}
      <div className="bg-[#191715] border border-[#2b2722] rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-display text-lg font-bold tracking-wider text-[#f2efe9] uppercase">
              BEAST MODE
            </div>
            <p className="text-xs text-zinc-400">
              {lang === 'ru' ? 'Таймер 2 мин, короткий отдых' : '2 min timer, reduced rest'}
            </p>
          </div>

          {/* Custom Switch Toggle */}
          <button
            type="button"
            onClick={() => onChangeConfig({ ...config, beast: !config.beast })}
            className={`w-12 h-7 rounded-full p-1 transition duration-200 ease-in-out ${
              config.beast ? 'bg-[#e85324]' : 'bg-[#2b2722]'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white transition duration-200 ease-in-out transform ${
                config.beast ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Expandable Advanced Options summary line */}
        <button
          type="button"
          onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
          className="w-full pt-2 border-t border-[#2b2722] flex items-center justify-between text-xs text-zinc-400 hover:text-zinc-200 transition"
        >
          <span>
            {lang === 'ru'
              ? `Джокеры ${config.jokers} • Туз ${config.aceValue} • Отдых ${config.restSeconds} с`
              : `Jokers ${config.jokers} • Ace ${config.aceValue} • Rest ${config.restSeconds}s`}
          </span>
          <ChevronRight
            className={`w-4 h-4 transition-transform ${showAdvancedSettings ? 'rotate-90' : ''}`}
          />
        </button>

        {/* Collapsible fine settings */}
        {showAdvancedSettings && (
          <div className="pt-3 border-t border-[#2b2722] space-y-4 animate-in fade-in duration-200 text-xs">
            {/* Ace Value */}
            <div>
              <div className="text-zinc-400 font-medium mb-1.5">{t.aceValue}:</div>
              <div className="grid grid-cols-3 gap-2">
                {[1, 11, 15].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => onChangeConfig({ ...config, aceValue: val })}
                    className={`py-1.5 rounded-xl font-bold border transition ${
                      config.aceValue === val
                        ? 'bg-[#e85324] border-[#e85324] text-white'
                        : 'bg-[#24211d] border-[#36312a] text-zinc-400 hover:text-white'
                    }`}
                  >
                    {val} {t.repsShort}
                  </button>
                ))}
              </div>
            </div>

            {/* Jokers Count */}
            <div>
              <div className="text-zinc-400 font-medium mb-1.5">{t.jokersCount}:</div>
              <div className="grid grid-cols-3 gap-2">
                {[0, 1, 2].map((j) => (
                  <button
                    key={j}
                    type="button"
                    onClick={() => onChangeConfig({ ...config, jokers: j })}
                    className={`py-1.5 rounded-xl font-bold border transition ${
                      config.jokers === j
                        ? 'bg-[#e85324] border-[#e85324] text-white'
                        : 'bg-[#24211d] border-[#36312a] text-zinc-400 hover:text-white'
                    }`}
                  >
                    {j === 0 ? t.noJokers : `${j} Joker${j > 1 ? 's' : ''}`}
                  </button>
                ))}
              </div>
            </div>

            {/* Rest Timer between cards */}
            <div>
              <div className="text-zinc-400 font-medium mb-1.5">{t.restTimer}:</div>
              <div className="grid grid-cols-4 gap-1.5">
                {[0, 5, 10, 15].map((sec) => (
                  <button
                    key={sec}
                    type="button"
                    onClick={() => onChangeConfig({ ...config, restSeconds: sec })}
                    className={`py-1.5 rounded-xl font-bold border transition ${
                      config.restSeconds === sec
                        ? 'bg-[#e85324] border-[#e85324] text-white'
                        : 'bg-[#24211d] border-[#36312a] text-zinc-400 hover:text-white'
                    }`}
                  >
                    {sec === 0 ? (lang === 'ru' ? 'Off' : 'Off') : `${sec}s`}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 5. BIG RED/ORANGE CTA FIXED AT BOTTOM */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[#0e0e0e] via-[#0e0e0e]/95 to-transparent z-30">
        <div className="max-w-md mx-auto space-y-1.5 text-center">
          <button
            onClick={onStartWorkout}
            className="w-full py-4 px-6 rounded-2xl bg-[#e85324] hover:bg-[#d6471c] text-white font-display text-xl uppercase tracking-wider font-extrabold shadow-xl shadow-[#e85324]/20 flex items-center justify-center transition active:scale-[0.98]"
          >
            {t.dealDeck}
          </button>
          <p className="text-xs text-zinc-400 font-medium">
            {config.mode === 'KETTLEBELL' && totalTonnage > 0
              ? `52 карты • ${totalReps} повторений • ${totalTonnage} кг`
              : `52 карты • ${totalReps} повторений`}
          </p>
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
