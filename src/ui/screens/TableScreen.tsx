import React, { useState } from 'react';
import { ChevronRight, Settings, Zap, X } from 'lucide-react';
import { Exercise, Preset, SessionConfig, Suit } from '../../types';
import { Language, translations } from '../../data/translations';
import { calculateDeckTotalReps, calculateDeckTotalTonnage } from '../../engine/scoring';
import { BottomSheet } from '../components/BottomSheet';
import { ExerciseModal } from '../components/ExerciseModal';
import { PrimaryButton, SegmentedControl, Toggle, getSuitIsRed, getSuitSymbol } from '../components/ui';

interface TableScreenProps {
  config: SessionConfig;
  onChangeConfig: (config: SessionConfig) => void;
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
  const [showSettingsSheet, setShowSettingsSheet] = useState(false);

  // Helper to find selected exercise for suit
  const getExerciseForSuit = (suit: Suit): Exercise | undefined => {
    const load = config.loads[suit];
    if (!load) return undefined;
    return exercises.find((e) => e.id === load.exerciseId);
  };

  const totalReps = calculateDeckTotalReps(config.aceValue, config.jokers);
  const totalTonnage = config.mode === 'KETTLEBELL' ? calculateDeckTotalTonnage(config.loads, config.aceValue) : 0;

  const suits: { suit: Suit; label: string }[] = [
    { suit: 'S', label: t.suitSpades },
    { suit: 'H', label: t.suitHearts },
    { suit: 'D', label: t.suitDiamonds },
    { suit: 'C', label: t.suitClubs },
  ];

  // Apply a preset
  const handleSelectPreset = (preset: Preset) => {
    onChangeConfig({
      ...config,
      mode: preset.mode,
      loads: { ...preset.loads },
    });
  };

  return (
    <div className="flex-1 max-w-md w-full mx-auto px-4 pt-3 pb-28 space-y-4">
      {/* 1. PRESETS HORIZONTAL SCROLL CHIPS */}
      <div className="space-y-1.5">
        <div className="text-[11px] font-bold uppercase tracking-widest text-[#7A7367]">
          {lang === 'ru' ? 'ГОТОВЫЕ ПРОГРАММЫ' : 'PRESETS'}
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {presets.map((p) => {
            const isSelected =
              p.mode === config.mode &&
              p.loads.S.exerciseId === config.loads.S?.exerciseId &&
              p.loads.H.exerciseId === config.loads.H?.exerciseId &&
              p.loads.D.exerciseId === config.loads.D?.exerciseId &&
              p.loads.C.exerciseId === config.loads.C?.exerciseId;

            const name = lang === 'ru' ? p.nameRu : p.nameEn;

            return (
              <button
                key={p.id}
                type="button"
                onClick={() => handleSelectPreset(p)}
                className={`whitespace-nowrap px-3.5 py-1.5 rounded-full text-xs font-bold border transition ${
                  isSelected
                    ? 'bg-[#E85324]/15 border-[#E85324] text-[#E85324]'
                    : 'bg-[#1C1917] border-[#2B2722] text-[#9C9388] hover:text-[#F2EFE9] hover:border-[#38322B]'
                }`}
              >
                {name}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. EXERCISE CARDS BY SUIT */}
      <div className="space-y-2.5">
        <div className="text-[11px] font-bold uppercase tracking-widest text-[#7A7367]">
          {lang === 'ru' ? 'УПРАЖНЕНИЯ ПО МАСТЯМ' : 'EXERCISES BY SUIT'}
        </div>

        {suits.map(({ suit, label }) => {
          const exercise = getExerciseForSuit(suit);
          const load = config.loads[suit];
          const isRed = getSuitIsRed(suit);
          const symbol = getSuitSymbol(suit);

          const exerciseName = exercise
            ? lang === 'ru'
              ? exercise.nameRu
              : exercise.nameEn
            : label;

          const muscles = exercise
            ? lang === 'ru'
              ? exercise.musclesRu
              : exercise.musclesEn
            : '';

          return (
            <div
              key={suit}
              onClick={() => setActiveSheetSuit(suit)}
              className="bg-[#181614] hover:bg-[#1C1917] border border-[#2B2722] rounded-2xl p-3.5 flex items-center justify-between cursor-pointer transition active:scale-[0.99] shadow-md"
            >
              <div className="flex items-center gap-3.5">
                {/* Bone card suit badge */}
                <div
                  className="w-12 h-14 rounded-xl bg-[#E8E2D5] border border-[#DCD5C6] flex items-center justify-center font-black text-2xl shadow-sm shrink-0"
                  style={{ color: isRed ? '#D92626' : '#1A1A1A' }}
                >
                  {symbol}
                </div>

                <div className="space-y-0.5">
                  <h3 className="font-display text-lg font-bold tracking-tight text-[#F2EFE9] uppercase leading-tight">
                    {exerciseName}
                  </h3>
                  <p className="text-xs text-[#9C9388] font-medium truncate max-w-[180px]">
                    {muscles}
                  </p>
                </div>
              </div>

              {/* Weight or Chevron Badge */}
              <div className="flex items-center gap-1.5">
                {config.mode === 'KETTLEBELL' && load ? (
                  <div className="bg-[#24201D] border border-[#38322B] px-3 py-1.5 rounded-xl font-display text-base font-bold text-[#F2EFE9]">
                    {load.count > 1 ? `${load.count} × ${load.kg} кг` : `${load.kg} кг`}
                  </div>
                ) : (
                  <div className="text-[#7A7367] text-lg font-bold">›</div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. BEAST MODE & CONFIG SUMMARY CARD */}
      <div className="bg-[#181614] border border-[#2B2722] rounded-2xl p-4 space-y-3">
        <Toggle
          checked={config.beast}
          onChange={(beast) => onChangeConfig({ ...config, beast })}
          label="BEAST MODE"
          description={
            lang === 'ru' ? 'Таймер 2 мин, короткий отдых' : '2 min timer, reduced rest'
          }
        />

        {/* Summary Line under Beast Mode that opens Settings Sheet */}
        <button
          type="button"
          onClick={() => setShowSettingsSheet(true)}
          className="w-full pt-3 border-t border-[#2B2722] flex items-center justify-between text-xs text-[#9C9388] hover:text-[#F2EFE9] transition text-left"
        >
          <div className="flex items-center gap-2">
            <Settings className="w-3.5 h-3.5 text-[#E85324]" />
            <span>
              {lang === 'ru'
                ? `Джокеры: ${config.jokers} • Туз: ${config.aceValue} • Отдых: ${config.restSeconds ?? 0}с`
                : `Jokers: ${config.jokers} • Ace: ${config.aceValue} • Rest: ${config.restSeconds ?? 0}s`}
            </span>
          </div>
          <ChevronRight className="w-4 h-4 text-[#7A7367]" />
        </button>
      </div>

      {/* 4. BOTTOM FIXED CTA BUTTON */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[#12100E] via-[#12100E]/95 to-transparent z-30">
        <div className="max-w-md mx-auto space-y-1.5 text-center">
          <PrimaryButton onClick={onStartWorkout}>
            <Zap className="w-5 h-5 fill-current" />
            <span>{t.dealDeck}</span>
          </PrimaryButton>

          <p className="text-xs text-[#9C9388] font-medium">
            {config.mode === 'KETTLEBELL' && totalTonnage > 0
              ? `52 карты • ${totalReps} повторений • ${totalTonnage.toLocaleString()} кг`
              : `52 карты • ${totalReps} повторений`}
          </p>
        </div>
      </div>

      {/* Bottom Sheet for Exercise & Weight selection */}
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

      {/* Advanced Settings Sheet (Opened from summary line) */}
      {showSettingsSheet && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 backdrop-blur-sm p-0 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-[#181614] border-t border-[#2B2722] rounded-t-3xl shadow-2xl p-5 space-y-5 animate-in slide-in-from-bottom duration-300 max-h-[85vh] overflow-y-auto">
            {/* Top Drag Bar & Close */}
            <div className="flex items-center justify-between pb-2 border-b border-[#2B2722]">
              <div className="font-display text-lg font-bold uppercase tracking-wider text-[#F2EFE9] flex items-center gap-2">
                <Settings className="w-5 h-5 text-[#E85324]" />
                <span>{lang === 'ru' ? 'НАСТРОЙКИ КОЛОДЫ' : 'DECK SETTINGS'}</span>
              </div>
              <button
                onClick={() => setShowSettingsSheet(false)}
                className="p-1.5 rounded-full bg-[#24201D] hover:bg-[#322D27] text-[#9C9388] transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Ace Value Option */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-[#9C9388]">
                {t.aceNominal}
              </label>
              <SegmentedControl<1 | 11>
                options={[
                  { label: `1 ${t.repsShort}`, value: 1 },
                  { label: `11 ${t.repsShort}`, value: 11 },
                ]}
                value={config.aceValue}
                onChange={(aceValue) => onChangeConfig({ ...config, aceValue })}
              />
            </div>

            {/* Jokers Count Option */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-[#9C9388]">
                {t.jokersCount}
              </label>
              <SegmentedControl<0 | 1 | 2>
                options={[
                  { label: '0', value: 0 },
                  { label: '1 Joker', value: 1 },
                  { label: '2 Jokers', value: 2 },
                ]}
                value={config.jokers}
                onChange={(jokers) => onChangeConfig({ ...config, jokers })}
              />
            </div>

            {/* Rest Timer Option */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-[#9C9388]">
                {t.restInterval}
              </label>
              <SegmentedControl<number | null>
                options={[
                  { label: 'Off', value: null },
                  { label: '5s', value: 5 },
                  { label: '10s', value: 10 },
                  { label: '15s', value: 15 },
                ]}
                value={config.restSeconds}
                onChange={(restSeconds) => onChangeConfig({ ...config, restSeconds })}
              />
            </div>

            {/* Red Joker Plank Duration */}
            {config.jokers > 0 && (
              <div className="space-y-2 pt-2 border-t border-[#2B2722]">
                <label className="text-xs font-bold uppercase tracking-wider text-[#9C9388]">
                  {lang === 'ru' ? 'Красный Джокер: Планка' : 'Red Joker: Plank Duration'}
                </label>
                <SegmentedControl<number>
                  options={[
                    { label: '60s', value: 60 },
                    { label: '90s', value: 90 },
                    { label: '120s', value: 120 },
                    { label: '180s', value: 180 },
                  ]}
                  value={config.jokerSettings?.redPlankSeconds || (config.beast ? 120 : 60)}
                  onChange={(sec) =>
                    onChangeConfig({
                      ...config,
                      jokerSettings: {
                        ...config.jokerSettings,
                        redPlankSeconds: sec,
                        blackExerciseChoice: config.jokerSettings?.blackExerciseChoice || 'BURPEES',
                        blackKbCount: config.jokerSettings?.blackKbCount || 1,
                        blackKbWeight: config.jokerSettings?.blackKbWeight || 24,
                        blackKbReps: config.jokerSettings?.blackKbReps || 30,
                        blackBodyReps: config.jokerSettings?.blackBodyReps || 30,
                        blackWallSitSeconds: config.jokerSettings?.blackWallSitSeconds || 120,
                      },
                    })
                  }
                />
              </div>
            )}

            {/* Close CTA */}
            <button
              onClick={() => setShowSettingsSheet(false)}
              className="w-full py-3.5 rounded-2xl bg-[#24201D] hover:bg-[#322D27] text-white font-bold text-xs uppercase tracking-wider transition active:scale-98 mt-3"
            >
              {t.close}
            </button>
          </div>
        </div>
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
