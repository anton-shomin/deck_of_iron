import React, { useEffect, useState } from 'react';
import { X, Trash2, Calendar, Dumbbell, Award, Flame } from 'lucide-react';
import { WorkoutHistoryEntry } from '../../types';
import { Language, translations } from '../../data/translations';
import { getWorkoutHistory, clearWorkoutHistory } from '../../platform/storage';
import { formatDuration } from '../../engine/scoring';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({ isOpen, onClose, lang }) => {
  const [history, setHistory] = useState<WorkoutHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const t = translations[lang];

  const fetchHistory = async () => {
    setLoading(true);
    const data = await getWorkoutHistory();
    setHistory(data);
    setLoading(false);
  };

  useEffect(() => {
    if (isOpen) {
      fetchHistory();
    }
  }, [isOpen]);

  const handleClear = async () => {
    if (confirm(lang === 'ru' ? 'Очистить всю историю тренировок?' : 'Clear all workout history?')) {
      await clearWorkoutHistory();
      setHistory([]);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-[#181614] border border-[#2B2722] rounded-3xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden text-[#F2EFE9]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#2B2722] flex items-center justify-between bg-[#12100E]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#E85324]/15 text-[#E85324]">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display text-lg font-bold text-white uppercase tracking-wider">
                {t.historyTitle}
              </h2>
              <p className="text-xs text-[#9C9388]">
                {history.length}{' '}
                {lang === 'ru'
                  ? history.length === 1
                    ? 'тренировка'
                    : history.length < 5
                    ? 'тренировки'
                    : 'тренировок'
                  : 'sessions'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {history.length > 0 && (
              <button
                onClick={handleClear}
                title={t.clearHistory}
                className="p-2 rounded-xl bg-[#24201D] hover:bg-[#322D27] text-[#9C9388] hover:text-[#E85324] transition"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-[#24201D] hover:bg-[#322D27] text-[#9C9388] hover:text-white transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* History List */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-3 flex-1">
          {loading ? (
            <div className="py-12 text-center text-[#9C9388] text-sm">...</div>
          ) : history.length === 0 ? (
            <div className="py-16 text-center text-[#9C9388] text-sm space-y-2">
              <Award className="w-10 h-10 mx-auto text-[#7A7367]" />
              <p className="text-xs max-w-xs mx-auto leading-relaxed">{t.historyEmpty}</p>
            </div>
          ) : (
            history.map((item) => {
              const dateStr = new Date(item.timestamp).toLocaleDateString(
                lang === 'ru' ? 'ru-RU' : 'en-US',
                {
                  day: 'numeric',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
                }
              );

              const modeLabel =
                item.mode === 'BODY'
                  ? t.modeCalisthenics
                  : item.mode === 'KETTLEBELL'
                  ? t.modeKettlebells
                  : t.modeCustom;

              return (
                <div
                  key={item.id}
                  className="bg-[#12100E] border border-[#2B2722] rounded-2xl p-3.5 space-y-2.5"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-[#9C9388] flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-[#7A7367]" />
                      {dateStr}
                    </span>
                    <span className="font-extrabold text-[#E85324] flex items-center gap-1">
                      {item.beast && <Flame className="w-3.5 h-3.5 fill-[#E85324]" />}
                      {modeLabel}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 bg-[#181614] p-2.5 rounded-xl border border-[#2B2722] text-center">
                    <div>
                      <div className="text-[10px] uppercase font-bold text-[#9C9388]">
                        {lang === 'ru' ? 'Время' : 'Time'}
                      </div>
                      <div className="font-display text-sm font-black text-white mt-0.5">
                        {formatDuration(item.durationSeconds)}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase font-bold text-[#9C9388]">
                        {lang === 'ru' ? 'Карты' : 'Cards'}
                      </div>
                      <div className="font-display text-sm font-black text-white mt-0.5">
                        {item.completedCards} / {item.totalCards}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase font-bold text-[#9C9388]">
                        {t.totalReps}
                      </div>
                      <div className="font-display text-sm font-black text-white mt-0.5">
                        {item.totalReps}
                      </div>
                    </div>
                  </div>

                  {item.totalTonnageKg > 0 && (
                    <div className="flex items-center justify-between text-[11px] text-[#9C9388] px-1">
                      <span className="flex items-center gap-1">
                        <Dumbbell className="w-3.5 h-3.5 text-[#E85324]" />
                        <span>{t.tonnage}:</span>
                      </span>
                      <span className="font-extrabold text-[#F2EFE9]">
                        {item.totalTonnageKg.toLocaleString()} {lang === 'ru' ? 'кг' : 'kg'}
                      </span>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
