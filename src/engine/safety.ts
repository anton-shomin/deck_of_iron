import { Card, Exercise, Suit } from '../types';

export const HEAVY_SUITS: Suit[] = ['S', 'H', 'D'];

export function isHeavyCard(card: Card): boolean {
  if (!card.suit || card.rank === 'JOKER') return false;
  return HEAVY_SUITS.includes(card.suit) && card.reps >= 10;
}

export function isLowCard(card: Card): boolean {
  if (!card.suit || card.rank === 'JOKER') return false;
  return card.reps <= 6;
}

/**
 * Heavy Load Gap (Kettlebells mode):
 * Between any two cards with nominal >= 10 in suits ♠, ♥, and ♦,
 * there must be at least one card with nominal <= 6.
 * If the next card violates this, swap it with the closest card <= 6 further down in the deck.
 */
export function applyHeavyLoadGap(cards: Card[], isKettlebellMode: boolean): Card[] {
  if (!isKettlebellMode) {
    return cards;
  }

  const result = [...cards];
  let lastHeavyIndex: number | null = null;
  let hasLowCardBetween = false;

  for (let i = 0; i < result.length; i++) {
    const card = result[i];

    if (isLowCard(card)) {
      hasLowCardBetween = true;
    }

    if (isHeavyCard(card)) {
      if (lastHeavyIndex !== null && !hasLowCardBetween) {
        // Violation: heavy card immediately follows another heavy card without any <= 6 card between them.
        // Find closest card <= 6 further down
        let swapIndex = -1;
        for (let j = i + 1; j < result.length; j++) {
          if (isLowCard(result[j])) {
            swapIndex = j;
            break;
          }
        }

        if (swapIndex !== -1) {
          // Swap card at i with card at swapIndex
          const temp = result[i];
          result[i] = result[swapIndex];
          result[swapIndex] = temp;

          // Now result[i] is a low card!
          hasLowCardBetween = true;
        }
      } else {
        // First heavy card, or safe sequence
        lastHeavyIndex = i;
        hasLowCardBetween = false;
      }
    }
  }

  return result;
}

/**
 * Cluster Break (Kettlebells mode)
 */
export function getClusterTip(
  card: Card,
  isKettlebellMode: boolean,
  lang: 'ru' | 'en' = 'ru'
): string | null {
  if (!isKettlebellMode || card.rank === 'JOKER') return null;

  if (card.reps === 10) {
    return lang === 'ru'
      ? 'Кластер: 5 + 5 (отдых 15 с)'
      : 'Cluster: 5 + 5 (15s rest)';
  }

  if (card.reps === 11) {
    return lang === 'ru'
      ? 'Кластер: 4 + 4 + 3'
      : 'Cluster: 4 + 4 + 3';
  }

  return null;
}

/**
 * Side Rule breakdown & special exercise notes
 */
export function getSideRuleBreakdown(
  exercise: Exercise,
  reps: number,
  lang: 'ru' | 'en' = 'ru'
): string | null {
  if (exercise.id === 'body_navy_seal_burpees') {
    return lang === 'ru'
      ? `${reps} ${reps === 1 ? 'цикл' : reps < 5 ? 'цикла' : 'циклов'} (${reps * 3} отжимания)`
      : `${reps} ${reps === 1 ? 'cycle' : 'cycles'} (${reps * 3} push-ups)`;
  }

  if (exercise.sideRule === 'SPLIT_TOTAL') {
    if (reps % 2 === 0) {
      const half = reps / 2;
      return lang === 'ru'
        ? `${reps} = ${half} левая + ${half} правая`
        : `${reps} = ${half} left + ${half} right`;
    } else {
      const more = Math.ceil(reps / 2);
      const less = Math.floor(reps / 2);
      return lang === 'ru'
        ? `${reps} = ${more} левая + ${less} правая (слабая сторона +1)`
        : `${reps} = ${more} left + ${less} right (weaker side +1)`;
    }
  }

  if (exercise.sideRule === 'PER_SIDE') {
    const total = reps * 2;
    return lang === 'ru'
      ? `${reps} на каждую сторону (всего ${total})`
      : `${reps} per side (${total} total)`;
  }

  return null;
}
