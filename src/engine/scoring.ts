import { Card, SessionConfig, Suit } from '../types';

export function calculateCardTonnage(card: Card, config: SessionConfig): number {
  if (config.mode !== 'KETTLEBELL' || !card.suit || card.rank === 'JOKER') {
    return 0;
  }
  const load = config.loads[card.suit];
  if (!load) return 0;
  return load.kg * card.reps * load.count;
}

export function calculateTotalCleanDeckReps(aceValue: 1 | 11): number {
  // 2..9 = 44 reps
  // 10, J, Q, K = 40 reps
  // Ace = aceValue (11 or 1)
  // Per suit = 44 + 40 + aceValue = 84 + aceValue
  // Total 4 suits = 4 * (84 + aceValue)
  // With Ace=11 => 4 * 95 = 380
  return 4 * (44 + 40 + aceValue);
}

export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function formatWeight(kg: number, count: number, lang: 'ru' | 'en' = 'ru'): string {
  if (count <= 1) {
    return `${kg} ${lang === 'ru' ? 'кг' : 'kg'}`;
  }
  return `2×${kg} ${lang === 'ru' ? 'кг' : 'kg'}`;
}

export function calculateProgressStats(
  cards: Card[],
  currentIndex: number,
  config: SessionConfig
) {
  const completedCards = cards.slice(0, currentIndex);
  const currentCard = cards[currentIndex] || null;
  const remainingCardsCount = Math.max(0, cards.length - currentIndex);

  const suitReps: Record<Suit, number> = {
    S: 0,
    H: 0,
    D: 0,
    C: 0,
  };

  let totalReps = 0;
  let totalTonnageKg = 0;
  let jokersCompleted = 0;

  for (const card of completedCards) {
    if (card.rank === 'JOKER') {
      jokersCompleted++;
      continue;
    }
    if (card.suit) {
      suitReps[card.suit] += card.reps;
      totalReps += card.reps;
      totalTonnageKg += calculateCardTonnage(card, config);
    }
  }

  const percent = cards.length > 0 ? Math.round((currentIndex / cards.length) * 100) : 0;

  return {
    totalCards: cards.length,
    completedCardsCount: completedCards.length,
    remainingCardsCount,
    percent,
    currentCard,
    totalReps,
    suitReps,
    totalTonnageKg,
    jokersCompleted,
  };
}
