import { Card, Rank, Suit, JokerColor } from '../types';

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
  const shuffledBase = shuffleArray(baseDeck, rng);

  if (jokersCount === 0) {
    return shuffledBase;
  }

  // Jokers window: positions 27 to 42 (0-indexed 26 to 41)
  const MIN_POS = 26; // index 26 = position 27
  const MAX_POS = 41; // index 41 = position 42

  if (jokersCount === 1) {
    const color: JokerColor = rng() > 0.5 ? 'RED' : 'BLACK';
    const jokerCard: Card = {
      id: `JOKER-${color}-${Date.now()}`,
      suit: null,
      rank: 'JOKER',
      reps: 0,
      jokerColor: color,
    };
    const insertIndex = MIN_POS + Math.floor(rng() * (MAX_POS - MIN_POS + 1));
    shuffledBase.splice(insertIndex, 0, jokerCard);
    return shuffledBase;
  }

  // jokersCount === 2: one RED and one BLACK
  // Between two jokers: at least 7 cards, meaning |pos2 - pos1| >= 8
  const colors: JokerColor[] = rng() > 0.5 ? ['RED', 'BLACK'] : ['BLACK', 'RED'];
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

  // Valid range [MIN_POS, MAX_POS].
  // Need pos1 and pos2 such that pos2 - pos1 >= 8.
  // Maximum pos1 is MAX_POS - 8.
  const maxPos1 = MAX_POS - 8;
  const pos1 = MIN_POS + Math.floor(rng() * (maxPos1 - MIN_POS + 1));
  const minPos2 = pos1 + 8;
  const pos2 = minPos2 + Math.floor(rng() * (MAX_POS - minPos2 + 1));

  // Insert pos1 first, then pos2 + 1 because the array expands by 1
  shuffledBase.splice(pos1, 0, joker1);
  shuffledBase.splice(pos2 + 1, 0, joker2);

  return shuffledBase;
}
