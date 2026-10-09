import React from 'react';
import { X, ExternalLink, CheckCircle2, AlertTriangle, Dumbbell } from 'lucide-react';
import { Exercise } from '../../types';
import { Language, translations } from '../../data/translations';

interface ExerciseModalProps {
  exercise: Exercise | null;
  onClose: () => void;
  lang: Language;
}

export const ExerciseModal: React.FC<ExerciseModalProps> = ({ exercise, onClose, lang }) => {
  if (!exercise) return null;
  const t = translations[lang];

  const name = lang === 'ru' ? exercise.nameRu : exercise.nameEn;
  const muscles = lang === 'ru' ? exercise.musclesRu : exercise.musclesEn;
  const cues = lang === 'ru' ? exercise.cuesRu : exercise.cuesEn;
  const mistake = lang === 'ru' ? exercise.commonMistakeRu : exercise.commonMistakeEn;

  const youtubeUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(
    exercise.youtubeQuery
  )}`;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="w-full sm:max-w-md bg-zinc-900 border border-zinc-700/80 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-zinc-800 flex items-start justify-between bg-zinc-950/60">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs uppercase font-extrabold px-2 py-0.5 rounded bg-red-950/80 border border-red-700/50 text-red-400">
                {exercise.equipment === 'KETTLEBELL' ? 'KETTLEBELL' : 'CALISTHENICS'}
              </span>
              <span className="text-xs text-zinc-400 font-semibold">Tier {exercise.tier}</span>
            </div>
            <h2 className="text-xl font-black text-white tracking-tight">{name}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-sm">
          {/* Target Muscles */}
          <div className="bg-zinc-950/70 p-3.5 rounded-2xl border border-zinc-800/80">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
              <Dumbbell className="w-3.5 h-3.5 text-red-500" />
              {t.muscles}
            </div>
            <p className="text-zinc-200 font-medium text-xs sm:text-sm">{muscles}</p>
          </div>

          {/* Technique Cues */}
          <div className="space-y-2">
            <div className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              {t.techniqueCues}
            </div>
            <ul className="space-y-2">
              {cues.map((cue, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-2.5 bg-zinc-950/40 p-2.5 rounded-xl border border-zinc-800/50 text-xs text-zinc-300 leading-relaxed"
                >
                  <span className="w-5 h-5 rounded-full bg-zinc-800 text-zinc-300 flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <span>{cue}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Common Mistake */}
          <div className="bg-amber-950/20 border border-amber-900/40 p-3.5 rounded-2xl">
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-400 mb-1">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              {t.commonMistake}
            </div>
            <p className="text-xs text-amber-200/90 leading-relaxed">{mistake}</p>
          </div>
        </div>

        {/* Action Button */}
        <div className="p-4 bg-zinc-950/80 border-t border-zinc-800">
          <a
            href={youtubeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-red-950/60 transition active:scale-98"
          >
            <ExternalLink className="w-4 h-4" />
            {t.watchYouTube}
          </a>
        </div>
      </div>
    </div>
  );
};
