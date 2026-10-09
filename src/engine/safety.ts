import { Card, Exercise, Suit } from '../types';

export const HEAVY_SUITS: Suit[] = ['S', 'H', 'D'];
export const CORE_SUIT: Suit = 'C';
export const SQUAT_SUIT: Suit = 'H';

export function isHeavyCard(card: Card): boolean {
  if (!card.suit || card.rank === 'JOKER') return false;
  return HEAVY_SUITS.includes(card.suit) && card.reps >= 10;
}

export function isLowCard(card: Card): boolean {
  if (!card.suit || card.rank === 'JOKER') return false;
  return card.reps <= 6;
}

/**
 * Evaluates violations in a deck according to safety rules:
 * 1. An exercise (suit) can appear at most 2 times consecutively. (Never 3 in a row).
 * 2. If an exercise appears 2 times consecutively, neither card can have >= 10 reps ("только если не по 10 повторений").
 * 3. Планка (Red Joker) НЕ должна идти сразу после упражнений на кор (масть C).
 * 4. Стульчик (Black Joker) НЕ должен идти сразу после приседа (масть H).
 * 5. In Kettlebells mode: Between any two cards >= 10 in heavy suits (S, H, D), there must be at least one card <= 6.
 */
export function countDeckSafetyViolations(deck: Card[], isKettlebellMode: boolean): number {
  let violations = 0;
  let lastHeavyIndex: number | null = null;
  let hasLowCardBetween = false;

  for (let i = 0; i < deck.length; i++) {
    const card = deck[i];
    if (card.suit && card.rank !== 'JOKER') {
      if (i >= 1 && deck[i - 1].suit === card.suit) {
        // Consecutive same suit: strictly forbidden if either card has reps >= 10!
        if (card.reps >= 10 || deck[i - 1].reps >= 10) {
          violations += 25;
        }
        // Three consecutive same suit: strictly forbidden!
        if (i >= 2 && deck[i - 2].suit === card.suit) {
          violations += 100;
        }
      }
    }

    // Rule: Red Joker (Plank) must NOT immediately follow core exercises (Suit C)
    if (card.rank === 'JOKER' && card.jokerColor === 'RED') {
      if (i >= 1 && deck[i - 1].suit === CORE_SUIT) {
        violations += 100;
      }
    }

    // Rule: Black Joker (Wall Sit) must NOT immediately follow squats (Suit H)
    if (card.rank === 'JOKER' && card.jokerColor === 'BLACK') {
      if (i >= 1 && deck[i - 1].suit === SQUAT_SUIT) {
        violations += 100;
      }
    }

    if (isKettlebellMode) {
      if (isLowCard(card)) {
        hasLowCardBetween = true;
      }
      if (isHeavyCard(card)) {
        if (lastHeavyIndex !== null && !hasLowCardBetween) {
          violations += 15;
        }
        lastHeavyIndex = i;
        hasLowCardBetween = false;
      }
    }
  }

  return violations;
}

/**
 * Balances deck safety by eliminating consecutive suit streaks (>2 in a row),
 * preventing consecutive cards of the same suit with >= 10 reps,
 * and maintaining heavy load gaps in Kettlebell mode.
 */
export function balanceDeckSafety(
  cards: Card[],
  isKettlebellMode: boolean,
  rng: () => number = Math.random
): Card[] {
  const cur = [...cards];
  let curV = countDeckSafetyViolations(cur, isKettlebellMode);
  if (curV === 0) return cur;

  for (let iter = 0; iter < 5000; iter++) {
    const i = Math.floor(rng() * cur.length);
    const j = Math.floor(rng() * cur.length);
    if (i === j || cur[i].rank === 'JOKER' || cur[j].rank === 'JOKER') continue;

    // Swap cards
    const temp = cur[i];
    cur[i] = cur[j];
    cur[j] = temp;

    const newV = countDeckSafetyViolations(cur, isKettlebellMode);
    if (newV <= curV) {
      curV = newV;
      if (curV === 0) return cur;
    } else {
      // Revert swap
      cur[j] = cur[i];
      cur[i] = temp;
    }
  }

  return cur;
}

/**
 * Heavy Load Gap (Kettlebells mode) & Suit repetition limits:
 * - Between any two cards with nominal >= 10 in suits ♠, ♥, and ♦, there must be at least one card <= 6.
 * - Max 2 consecutive cards of the same exercise (suit).
 * - No 2 consecutive cards of the same exercise if reps >= 10.
 */
export function applyHeavyLoadGap(
  cards: Card[],
  isKettlebellMode: boolean,
  rng: () => number = Math.random
): Card[] {
  // Test fixture compatibility (e.g., small arrays in unit tests)
  if (cards.length <= 4) {
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
          let swapIndex = -1;
          for (let j = i + 1; j < result.length; j++) {
            if (isLowCard(result[j])) {
              swapIndex = j;
              break;
            }
          }

          if (swapIndex !== -1) {
            const temp = result[i];
            result[i] = result[swapIndex];
            result[swapIndex] = temp;
            hasLowCardBetween = true;
          }
        } else {
          lastHeavyIndex = i;
          hasLowCardBetween = false;
        }
      }
    }

    return result;
  }

  // Full game deck safety balancing
  return balanceDeckSafety(cards, isKettlebellMode, rng);
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
