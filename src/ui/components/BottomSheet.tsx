import React from 'react';
import { X, Check, Info } from 'lucide-react';
import { Exercise, Suit, SuitLoad } from '../../types';
import { Language, translations } from '../../data/translations';
import { getSuitIsRed, getSuitSymbol } from './ui';

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

  const isRed = getSuitIsRed(suit);
  const symbol = getSuitSymbol(suit);

  const suitName = {
    S: t.suitSpades,
    H: t.suitHearts,
    D: t.suitDiamonds,
    C: t.suitClubs,
  }[suit];

  const kettlebellWeights = [8, 12, 16, 20, 24, 28, 32];

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 backdrop-blur-sm p-0 animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-[#181614] border-t border-[#2B2722] rounded-t-3xl shadow-2xl flex flex-col max-h-[85vh] animate-in slide-in-from-bottom duration-300">
        {/* Drag handle */}
        <div className="pt-3 pb-2 flex justify-center">
          <div className="w-12 h-1.5 rounded-full bg-[#2B2722]" />
        </div>

        {/* Sheet Header */}
        <div className="px-5 pb-3 border-b border-[#2B2722] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl bg-[#E8E2D5] border border-[#DCD5C6] flex items-center justify-center font-black text-xl shadow-sm shrink-0"
              style={{ color: isRed ? '#D92626' : '#1A1A1A' }}
            >
              {symbol}
            </div>
            <div>
              <h3 className="font-display text-lg font-bold text-[#F2EFE9] uppercase leading-tight">
                {suitName}
              </h3>
              <p className="text-[11px] text-[#9C9388]">{t.exerciseCardChange}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-[#24201D] hover:bg-[#322D27] text-[#9C9388] transition"
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
                    ? 'bg-[#24201D] border-[#E85324] shadow-md'
                    : 'bg-[#12100E] border-[#2B2722] hover:border-[#38322B] hover:bg-[#1C1917]'
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-[#2B2722] text-[#F2EFE9]">
                      Tier {ex.tier}
                    </span>
                    {ex.sideRule !== 'NONE' && (
                      <span className="text-[10px] font-bold text-[#E85324] bg-[#E85324]/10 px-1.5 py-0.5 rounded border border-[#E85324]/30">
                        {ex.sideRule === 'PER_SIDE' ? '×2' : '½'}
                      </span>
                    )}
                  </div>
                  <h4 className="font-display text-base font-bold text-white truncate uppercase tracking-wide">
                    {exName}
                  </h4>
                  <p className="text-[11px] text-[#9C9388] truncate mt-0.5">{muscles}</p>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenInfo(ex);
                    }}
                    className="p-2 rounded-xl bg-[#2B2722] hover:bg-[#38322B] text-[#9C9388] hover:text-white transition"
                    title={t.exerciseDetails}
                  >
                    <Info className="w-4 h-4 text-[#9C9388]" />
                  </button>
                  {isSelected && (
                    <div className="w-7 h-7 rounded-full bg-[#E85324] flex items-center justify-center text-white shrink-0">
                      <Check className="w-4 h-4 stroke-[3]" />
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Kettlebell Weight & Bell Count Selection */}
          {isKettlebellMode && (
            <div className="mt-4 pt-3 border-t border-[#2B2722] space-y-3">
              <div className="text-xs font-bold uppercase tracking-wider text-[#9C9388]">
                {t.weightKg}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {kettlebellWeights.map((w) => (
                  <button
                    key={w}
                    onClick={() => onUpdateLoad({ kg: w })}
                    className={`px-3 py-1.5 rounded-xl text-xs font-extrabold border transition ${
                      currentLoad.kg === w
                        ? 'bg-[#E85324] border-[#E85324] text-white shadow-md'
                        : 'bg-[#12100E] border-[#2B2722] text-[#9C9388] hover:border-[#38322B]'
                    }`}
                  >
                    {w} {lang === 'ru' ? 'кг' : 'kg'}
                  </button>
                ))}
              </div>

              <div className="text-xs font-bold uppercase tracking-wider text-[#9C9388] pt-1">
                {t.bellCount}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => onUpdateLoad({ count: 1 })}
                  className={`py-2 rounded-xl text-xs font-extrabold border transition ${
                    currentLoad.count === 1
                      ? 'bg-[#E85324] border-[#E85324] text-white'
                      : 'bg-[#12100E] border-[#2B2722] text-[#9C9388]'
                  }`}
                >
                  {t.oneBell}
                </button>
                <button
                  onClick={() => onUpdateLoad({ count: 2 })}
                  className={`py-2 rounded-xl text-xs font-extrabold border transition ${
                    currentLoad.count === 2
                      ? 'bg-[#E85324] border-[#E85324] text-white'
                      : 'bg-[#12100E] border-[#2B2722] text-[#9C9388]'
                  }`}
                >
                  {t.twoBells}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#12100E] border-t border-[#2B2722]">
          <button
            onClick={onClose}
            className="w-full py-3.5 rounded-2xl bg-[#24201D] hover:bg-[#322D27] text-white font-bold text-xs uppercase tracking-wider transition active:scale-98"
          >
            {t.close}
          </button>
        </div>
      </div>
    </div>
  );
};
