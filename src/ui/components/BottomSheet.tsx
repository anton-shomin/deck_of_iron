import React from 'react';
import { X, Check, Info } from 'lucide-react';
import { Exercise, Suit, SuitLoad } from '../../types';
import { Language, translations } from '../../data/translations';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  suit: Suit;
  exercises: Exercise[];
  currentLoad: SuitLoad;
  isKettlebellMode: boolean;
  onSelectExercise: (exerciseId: string) => void;
  onUpdateLoad: (load: Partial<SuitLoad>) => void;
  onOpenInfo: (exercise: Exercise) => void;
  lang: Language;
}

export const BottomSheet: React.FC<BottomSheetProps> = ({
  isOpen,
  onClose,
  suit,
  exercises,
  currentLoad,
  isKettlebellMode,
  onSelectExercise,
  onUpdateLoad,
  onOpenInfo,
  lang,
}) => {
  if (!isOpen) return null;
  const t = translations[lang];

  // Suit header styling
  const suitMeta = {
    S: { symbol: '♠', name: t.suitSpades, color: 'text-zinc-100', border: 'border-zinc-700' },
    H: { symbol: '♥', name: t.suitHearts, color: 'text-red-500', border: 'border-red-600/40' },
    D: { symbol: '♦', name: t.suitDiamonds, color: 'text-red-500', border: 'border-red-600/40' },
    C: { symbol: '♣', name: t.suitClubs, color: 'text-zinc-100', border: 'border-zinc-700' },
  }[suit];

  const kettlebellWeights = [8, 12, 16, 20, 24, 28, 32];

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 backdrop-blur-sm p-0 animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-zinc-900 border-t border-zinc-700 rounded-t-3xl shadow-2xl flex flex-col max-h-[85vh] animate-in slide-in-from-bottom duration-300">
        {/* Drag handle / top bar */}
        <div className="pt-3 pb-2 flex justify-center">
          <div className="w-12 h-1.5 rounded-full bg-zinc-700" />
        </div>

        {/* Sheet Header */}
        <div className="px-5 pb-3 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={`text-2xl font-black ${suitMeta.color}`}>{suitMeta.symbol}</span>
            <div>
              <h3 className="text-base font-black text-white">{suitMeta.name}</h3>
              <p className="text-[11px] text-zinc-400">{t.exerciseCardChange}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Exercises List */}
        <div className="px-5 py-4 overflow-y-auto space-y-2.5 flex-1">
          {exercises.map((ex) => {
            const isSelected = ex.id === currentLoad.exerciseId;
            const exName = lang === 'ru' ? ex.nameRu : ex.nameEn;
            const muscles = lang === 'ru' ? ex.musclesRu : ex.musclesEn;

            return (
              <div
                key={ex.id}
                onClick={() => {
                  onSelectExercise(ex.id);
                  if (!isKettlebellMode) {
                    onClose();
                  }
                }}
                className={`p-3.5 rounded-2xl border transition cursor-pointer flex items-center justify-between gap-3 ${
                  isSelected
                    ? 'bg-zinc-800/90 border-red-500 shadow-md shadow-red-950/30'
                    : 'bg-zinc-950/60 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/60'
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                      Tier {ex.tier}
                    </span>
                    {ex.sideRule !== 'NONE' && (
                      <span className="text-[10px] font-bold text-amber-400 bg-amber-950/40 px-1.5 py-0.5 rounded border border-amber-800/50">
                        {ex.sideRule === 'PER_SIDE' ? '×2' : '½'}
                      </span>
                    )}
                  </div>
                  <h4 className="text-sm font-bold text-white truncate">{exName}</h4>
                  <p className="text-[11px] text-zinc-400 truncate mt-0.5">{muscles}</p>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenInfo(ex);
                    }}
                    className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition"
                    title={t.exerciseDetails}
                  >
                    <Info className="w-4 h-4 text-zinc-400" />
                  </button>
                  {isSelected && (
                    <div className="w-7 h-7 rounded-full bg-red-600 flex items-center justify-center text-white shrink-0">
                      <Check className="w-4 h-4 stroke-[3]" />
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Kettlebell Load Adjuster (Weights & Count) */}
          {isKettlebellMode && (
            <div className="mt-4 pt-3 border-t border-zinc-800 space-y-3">
              <div className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                {t.weightKg}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {kettlebellWeights.map((w) => (
                  <button
                    key={w}
                    onClick={() => onUpdateLoad({ kg: w })}
                    className={`px-3 py-1.5 rounded-xl text-xs font-extrabold border transition ${
                      currentLoad.kg === w
                        ? 'bg-red-600 border-red-500 text-white shadow-md shadow-red-950/40'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-300 hover:border-zinc-700'
                    }`}
                  >
                    {w} {lang === 'ru' ? 'кг' : 'kg'}
                  </button>
                ))}
              </div>

              <div className="text-xs font-bold uppercase tracking-wider text-zinc-300 pt-1">
                {t.bellCount}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => onUpdateLoad({ count: 1 })}
                  className={`py-2 rounded-xl text-xs font-extrabold border transition ${
                    currentLoad.count === 1
                      ? 'bg-red-600 border-red-500 text-white'
                      : 'bg-zinc-950 border-zinc-800 text-zinc-300'
                  }`}
                >
                  {t.oneBell}
                </button>
                <button
                  onClick={() => onUpdateLoad({ count: 2 })}
                  className={`py-2 rounded-xl text-xs font-extrabold border transition ${
                    currentLoad.count === 2
                      ? 'bg-red-600 border-red-500 text-white'
                      : 'bg-zinc-950 border-zinc-800 text-zinc-300'
                  }`}
                >
                  {t.twoBells}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-zinc-950 border-t border-zinc-800">
          <button
            onClick={onClose}
            className="w-full py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs uppercase tracking-wider transition active:scale-98"
          >
            {t.close}
          </button>
        </div>
      </div>
    </div>
  );
};
