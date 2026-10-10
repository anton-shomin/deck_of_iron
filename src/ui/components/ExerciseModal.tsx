import React from 'react';
import { X, ExternalLink, CheckCircle2, AlertTriangle, Dumbbell } from 'lucide-react';
import { Exercise } from '../../types';
import { Language, translations } from '../../data/translations';
import { PrimaryButton, getSuitIsRed, getSuitSymbol } from './ui';

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

  const isRed = getSuitIsRed(exercise.suit);
  const symbol = getSuitSymbol(exercise.suit);

  const youtubeUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(
    exercise.youtubeQuery
  )}`;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="w-full sm:max-w-md bg-[#181614] border border-[#2B2722] rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#2B2722] flex items-start justify-between bg-[#12100E]">
          <div className="flex items-center gap-3">
            {/* Bone suit badge */}
            <div
              className="w-10 h-10 rounded-xl bg-[#E8E2D5] border border-[#DCD5C6] flex items-center justify-center font-black text-xl shadow-sm shrink-0"
              style={{ color: isRed ? '#D92626' : '#1A1A1A' }}
            >
              {symbol}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] uppercase font-extrabold px-1.5 py-0.5 rounded bg-[#E85324]/15 border border-[#E85324]/40 text-[#E85324]">
                  {exercise.equipment === 'KETTLEBELL' ? 'KETTLEBELL' : 'BODYWEIGHT'}
                </span>
                <span className="text-[10px] text-[#9C9388] font-semibold">Tier {exercise.tier}</span>
              </div>
              <h2 className="font-display text-xl font-bold text-white uppercase tracking-wider leading-none">
                {name}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-[#24201D] hover:bg-[#322D27] text-[#9C9388] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-sm">
          {/* Target Muscles */}
          <div className="bg-[#12100E] p-3.5 rounded-2xl border border-[#2B2722]">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#9C9388] mb-1">
              <Dumbbell className="w-3.5 h-3.5 text-[#E85324]" />
              <span>{t.muscles}</span>
            </div>
            <p className="text-[#F2EFE9] font-medium text-xs sm:text-sm">{muscles}</p>
          </div>

          {/* Technique Cues */}
          <div className="space-y-2">
            <div className="text-xs font-bold uppercase tracking-wider text-[#9C9388] flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>{t.techniqueCues}</span>
            </div>
            <ul className="space-y-2">
              {cues.map((cue, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-2.5 bg-[#12100E] p-2.5 rounded-xl border border-[#2B2722] text-xs text-[#F2EFE9] leading-relaxed"
                >
                  <span className="w-5 h-5 rounded-full bg-[#24201D] text-[#E85324] flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <span>{cue}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Common Mistake */}
          <div className="bg-[#E85324]/10 border border-[#E85324]/30 p-3.5 rounded-2xl">
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#E85324] mb-1">
              <AlertTriangle className="w-3.5 h-3.5 text-[#E85324]" />
              <span>{t.commonMistake}</span>
            </div>
            <p className="text-xs text-[#F2EFE9]/90 leading-relaxed">{mistake}</p>
          </div>
        </div>

        {/* Action Button */}
        <div className="p-4 bg-[#12100E] border-t border-[#2B2722]">
          <a
            href={youtubeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-[#E85324] hover:bg-[#D6471C] text-white font-display text-base uppercase font-bold tracking-wider shadow-lg shadow-[#E85324]/20 transition active:scale-98"
          >
            <ExternalLink className="w-4 h-4" />
            <span>{t.watchYouTube}</span>
          </a>
        </div>
      </div>
    </div>
  );
};
