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
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-700 rounded-3xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/60">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-red-600/20 text-red-500">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-white">{t.historyTitle}</h2>
              <p className="text-xs text-zinc-400">
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
                className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-red-400 transition"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* History List */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-3 flex-1">
          {loading ? (
            <div className="py-12 text-center text-zinc-400 text-sm">...</div>
          ) : history.length === 0 ? (
            <div className="py-16 text-center text-zinc-400 text-sm space-y-2">
              <Award className="w-10 h-10 mx-auto text-zinc-400" />
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
                  className="bg-zinc-950/70 border border-zinc-800 rounded-2xl p-3.5 space-y-2.5"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-zinc-400 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                      {dateStr}
                    </span>
                    <span className="font-extrabold text-red-400 flex items-center gap-1">
                      {item.beast && <Flame className="w-3.5 h-3.5 fill-red-500" />}
                      {modeLabel}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 bg-zinc-900/60 p-2.5 rounded-xl border border-zinc-800/80 text-center">
                    <div>
                      <div className="text-[10px] uppercase font-bold text-zinc-400">
                        {lang === 'ru' ? 'Время' : 'Time'}
                      </div>
                      <div className="text-xs font-black text-white mt-0.5">
                        {formatDuration(item.durationSeconds)}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase font-bold text-zinc-400">
                        {lang === 'ru' ? 'Карты' : 'Cards'}
                      </div>
                      <div className="text-xs font-black text-white mt-0.5">
                        {item.completedCards} / {item.totalCards}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase font-bold text-zinc-400">
                        {t.totalReps}
                      </div>
                      <div className="text-xs font-black text-white mt-0.5">
                        {item.totalReps}
                      </div>
                    </div>
                  </div>

                  {item.totalTonnageKg > 0 && (
                    <div className="flex items-center justify-between text-[11px] text-zinc-400 px-1">
                      <span className="flex items-center gap-1">
                        <Dumbbell className="w-3.5 h-3.5 text-amber-500" />
                        {t.tonnage}:
                      </span>
                      <span className="font-extrabold text-zinc-200">
                        {item.totalTonnageKg} {lang === 'ru' ? 'кг' : 'kg'}
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
