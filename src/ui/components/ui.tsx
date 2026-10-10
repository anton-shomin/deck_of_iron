import React from 'react';
import { Suit } from '../../types';

// Suit Symbol helper
export const getSuitSymbol = (suit: Suit | 'JOKER'): string => {
  switch (suit) {
    case 'S': return '♠';
    case 'H': return '♥';
    case 'D': return '♦';
    case 'C': return '♣';
    case 'JOKER': return '★';
    default: return '';
  }
};

export const getSuitIsRed = (suit: Suit | 'JOKER', jokerColor?: 'RED' | 'BLACK'): boolean => {
  if (suit === 'H' || suit === 'D') return true;
  if (suit === 'JOKER' && jokerColor === 'RED') return true;
  return false;
};

// 1. PLAYING CARD PRIMITIVE
interface PlayingCardProps {
  rank: string;
  suit: Suit | 'JOKER';
  jokerColor?: 'RED' | 'BLACK';
  children?: React.ReactNode;
  className?: string;
  footerTag?: React.ReactNode;
  onClick?: () => void;
}

export const PlayingCard: React.FC<PlayingCardProps> = ({
  rank,
  suit,
  jokerColor,
  children,
  className = '',
  footerTag,
  onClick,
}) => {
  const isRed = getSuitIsRed(suit, jokerColor);
  const symbol = getSuitSymbol(suit);
  const symbolColorStyle = isRed ? 'text-[#D92626]' : 'text-[#1A1A1A]';

  return (
    <div
      onClick={onClick}
      className={`relative w-full max-w-sm aspect-[5/7] rounded-3xl bg-[#E8E2D5] border-2 border-[#DCD5C6] shadow-2xl p-4 sm:p-5 flex flex-col justify-between select-none overflow-hidden ${className}`}
    >
      {/* Top Left Corner Rank & Suit */}
      <div className="flex flex-col items-center leading-none z-10 self-start">
        <span className="font-display text-2xl sm:text-3xl font-black text-[#1A1A1A] tracking-tighter">
          {rank}
        </span>
        <span className={`text-xl sm:text-2xl font-black ${symbolColorStyle}`}>
          {symbol}
        </span>
      </div>

      {/* Center Content */}
      <div className="my-auto flex flex-col items-center text-center z-10 w-full px-2">
        {children}
      </div>

      {/* Bottom Row */}
      <div className="flex items-end justify-between z-10 w-full">
        {footerTag ? (
          footerTag
        ) : (
          <div className="text-[9px] font-black uppercase tracking-widest text-[#7A7367]">
            DECK OF IRON
          </div>
        )}

        {/* Bottom Right Rank & Suit (Inverted) */}
        <div className="flex flex-col items-center leading-none transform rotate-180 self-end">
          <span className="font-display text-2xl sm:text-3xl font-black text-[#1A1A1A] tracking-tighter">
            {rank}
          </span>
          <span className={`text-xl sm:text-2xl font-black ${symbolColorStyle}`}>
            {symbol}
          </span>
        </div>
      </div>
    </div>
  );
};

// 2. PRIMARY BUTTON
interface PrimaryButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  fullWidth?: boolean;
}

export const PrimaryButton: React.FC<PrimaryButtonProps> = ({
  children,
  fullWidth = true,
  className = '',
  disabled,
  ...props
}) => {
  return (
    <button
      disabled={disabled}
      className={`${fullWidth ? 'w-full' : ''} py-4 px-6 rounded-2xl bg-[#E85324] hover:bg-[#D6471C] disabled:bg-[#38322B] disabled:text-[#7A7367] text-white font-display text-xl uppercase tracking-wider font-extrabold shadow-xl shadow-[#E85324]/20 flex items-center justify-center gap-2 transition active:scale-[0.98] ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

// 3. OUTLINE BUTTON
interface OutlineButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  fullWidth?: boolean;
}

export const OutlineButton: React.FC<OutlineButtonProps> = ({
  children,
  fullWidth = true,
  className = '',
  disabled,
  ...props
}) => {
  return (
    <button
      disabled={disabled}
      className={`${fullWidth ? 'w-full' : ''} py-3.5 px-5 rounded-2xl bg-[#1C1917] hover:bg-[#24201D] border border-[#2B2722] hover:border-[#38322B] text-[#F2EFE9] font-bold text-sm tracking-wide flex items-center justify-center gap-2 transition active:scale-[0.98] ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

// 4. CHIP / TAG
interface ChipProps {
  children: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
  className?: string;
  icon?: React.ReactNode;
}

export const Chip: React.FC<ChipProps> = ({
  children,
  active = false,
  onClick,
  className = '',
  icon,
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold border transition ${
        active
          ? 'bg-[#E85324]/15 border-[#E85324] text-[#E85324]'
          : 'bg-[#1C1917] border-[#2B2722] text-[#9C9388] hover:text-[#F2EFE9] hover:border-[#38322B]'
      } ${className}`}
    >
      {icon}
      <span>{children}</span>
    </button>
  );
};

// 5. SEGMENTED CONTROL
interface SegmentedOption<T> {
  label: string;
  value: T;
  icon?: React.ReactNode;
}

interface SegmentedControlProps<T> {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}

export function SegmentedControl<T>({
  options,
  value,
  onChange,
  className = '',
}: SegmentedControlProps<T>) {
  return (
    <div className={`bg-[#181614] p-1 rounded-2xl border border-[#2B2722] flex gap-1 ${className}`}>
      {options.map((opt, idx) => {
        const isSelected = opt.value === value;
        return (
          <button
            key={idx}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition ${
              isSelected
                ? 'bg-[#E85324] text-white shadow-md'
                : 'text-[#9C9388] hover:text-[#F2EFE9] hover:bg-[#24201D]/50'
            }`}
          >
            {opt.icon}
            <span>{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}

// 6. TOGGLE SWITCH
interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  description?: string;
  className?: string;
}

export const Toggle: React.FC<ToggleProps> = ({
  checked,
  onChange,
  label,
  description,
  className = '',
}) => {
  return (
    <div className={`flex items-center justify-between gap-3 ${className}`}>
      {(label || description) && (
        <div className="flex flex-col">
          {label && (
            <span className="font-display text-base font-bold tracking-wider text-[#F2EFE9] uppercase">
              {label}
            </span>
          )}
          {description && (
            <span className="text-xs text-[#9C9388]">{description}</span>
          )}
        </div>
      )}
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`w-12 h-7 rounded-full p-1 transition duration-200 ease-in-out shrink-0 ${
          checked ? 'bg-[#E85324]' : 'bg-[#2B2722]'
        }`}
      >
        <div
          className={`w-5 h-5 rounded-full bg-white transition duration-200 ease-in-out transform ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
};
