import { Card, Rank, Suit, JokerColor } from '../types';
import { balanceDeckSafety } from './safety';

export const SUITS: Suit[] = ['S', 'H', 'D', 'C'];
export const RANKS: Rank[] = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

export function getRankReps(rank: Rank, aceValue: 1 | 11 = 11): number {
  if (rank === 'A') return aceValue;
  if (['10', 'J', 'Q', 'K'].includes(rank)) return 10;
  return parseInt(rank, 10);
}

/**
 * Generates an unshuffled 52-card standard deck
 */
export function generateBaseDeck(aceValue: 1 | 11 = 11): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({
        id: `${suit}-${rank}`,
        suit,
        rank,
        reps: getRankReps(rank, aceValue),
      });
    }
  }
  return deck;
}

/**
 * Fisher-Yates shuffle
 */
export function shuffleArray<T>(array: T[], rng: () => number = Math.random): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Builds a complete game deck:
 * - 52 base cards shuffled
 * - 0, 1, or 2 Jokers inserted
 * - Jokers NEVER appear in positions 1–26 (indices 0..25)
 * - Jokers ONLY inserted in window positions 27–42 (indices 26..41)
 * - If 2 jokers: minimum 7 regular cards between them
 */
export function createDeck(options: {
  aceValue?: 1 | 11;
  jokersCount?: 0 | 1 | 2;
  rng?: () => number;
} = {}): Card[] {
  const { aceValue = 11, jokersCount = 0, rng = Math.random } = options;

  const baseDeck = generateBaseDeck(aceValue);
  const shuffledBase = balanceDeckSafety(shuffleArray(baseDeck, rng), false, rng);

  if (jokersCount === 0) {
    return shuffledBase;
  }

  // Jokers window: positions 27 to 42 (0-indexed 26 to 41)
  const MIN_POS = 26; // index 26 = position 27
  const MAX_POS = 41; // index 41 = position 42

  if (jokersCount === 1) {
    const color: JokerColor = rng() > 0.5 ? 'RED' : 'BLACK';
    const forbiddenPrevSuit: Suit = color === 'RED' ? 'C' : 'H';
    const jokerCard: Card = {
      id: `JOKER-${color}-${Date.now()}`,
      suit: null,
      rank: 'JOKER',
      reps: 0,
      jokerColor: color,
    };

    // Filter insertion positions where preceding card is not forbiddenPrevSuit
    const validPositions: number[] = [];
    for (let p = MIN_POS; p <= MAX_POS; p++) {
      if (shuffledBase[p - 1]?.suit !== forbiddenPrevSuit) {
        validPositions.push(p);
      }
    }

    const insertIndex =
      validPositions.length > 0
        ? validPositions[Math.floor(rng() * validPositions.length)]
        : MIN_POS + Math.floor(rng() * (MAX_POS - MIN_POS + 1));

    shuffledBase.splice(insertIndex, 0, jokerCard);
    return balanceDeckSafety(shuffledBase, false, rng);
  }

  // jokersCount === 2: one RED and one BLACK
  // Between two jokers: at least 7 cards, meaning |pos2 - pos1| >= 8
  const colors: JokerColor[] = rng() > 0.5 ? ['RED', 'BLACK'] : ['BLACK', 'RED'];
  const j1Forbidden: Suit = colors[0] === 'RED' ? 'C' : 'H';
  const j2Forbidden: Suit = colors[1] === 'RED' ? 'C' : 'H';

  const joker1: Card = {
    id: `JOKER-${colors[0]}-1`,
    suit: null,
    rank: 'JOKER',
    reps: 0,
    jokerColor: colors[0],
  };
  const joker2: Card = {
    id: `JOKER-${colors[1]}-2`,
    suit: null,
    rank: 'JOKER',
    reps: 0,
    jokerColor: colors[1],
  };

  // Find valid position pairs (pos1, pos2) such that:
  // pos1 in [MIN_POS, MAX_POS - 8]
  // pos2 in [pos1 + 8, MAX_POS]
  // card before pos1 != j1Forbidden
  // card before pos2 != j2Forbidden
  const validPairs: [number, number][] = [];
  const maxPos1 = MAX_POS - 8;
  for (let p1 = MIN_POS; p1 <= maxPos1; p1++) {
    if (shuffledBase[p1 - 1]?.suit === j1Forbidden) continue;
    for (let p2 = p1 + 8; p2 <= MAX_POS; p2++) {
      if (shuffledBase[p2 - 1]?.suit === j2Forbidden) continue;
      validPairs.push([p1, p2]);
    }
  }

  let pos1: number;
  let pos2: number;
  if (validPairs.length > 0) {
    const chosen = validPairs[Math.floor(rng() * validPairs.length)];
    pos1 = chosen[0];
    pos2 = chosen[1];
  } else {
    pos1 = MIN_POS + Math.floor(rng() * (maxPos1 - MIN_POS + 1));
    const minPos2 = pos1 + 8;
    pos2 = minPos2 + Math.floor(rng() * (MAX_POS - minPos2 + 1));
  }

  // Insert pos1 first, then pos2 + 1 because the array expands by 1
  shuffledBase.splice(pos1, 0, joker1);
  shuffledBase.splice(pos2 + 1, 0, joker2);

  return balanceDeckSafety(shuffledBase, false, rng);
}

export function getSideRuleNote(card: Card, exercise: { sideRule?: string }, lang: 'ru' | 'en' = 'ru'): string | null {
  if (!exercise.sideRule || exercise.sideRule === 'NONE') return null;
  if (exercise.sideRule === 'SPLIT_TOTAL') {
    const left = Math.ceil(card.reps / 2);
    const right = Math.floor(card.reps / 2);
    return lang === 'ru'
      ? `${card.reps} = ${left} левой + ${right} правой`
      : `${card.reps} = ${left} left + ${right} right`;
  }
  if (exercise.sideRule === 'EACH_SIDE') {
    return lang === 'ru'
      ? `${card.reps} на каждую сторону (${card.reps * 2} всего)`
      : `${card.reps} each side (${card.reps * 2} total)`;
  }
  return null;
}
