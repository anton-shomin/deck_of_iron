import { createDeck, generateBaseDeck, getRankReps } from './deck';
import { applyHeavyLoadGap, getClusterTip, getSideRuleBreakdown } from './safety';
import { calculateCardTonnage, calculateTotalCleanDeckReps } from './scoring';
import {
  getRedJokerDurations,
  getBlackJokerTask,
  BLACK_JOKER_KB_WEIGHTS,
  BLACK_JOKER_KB_REPS,
  BLACK_JOKER_BODY_REPS,
} from './jokers';
import { Card, Exercise } from '../types';

function runTests() {
  console.log('--- Running DECK OF IRON Engine Tests ---');

  // Test 1: Clean deck has 52 unique cards and 380 reps with Ace = 11
  const cleanDeck = generateBaseDeck(11);
  if (cleanDeck.length !== 52) {
    throw new Error(`Clean deck length should be 52, got ${cleanDeck.length}`);
  }
  const uniqueIds = new Set(cleanDeck.map((c) => c.id));
  if (uniqueIds.size !== 52) {
    throw new Error(`Duplicate cards detected in base deck!`);
  }
  const totalCleanReps = cleanDeck.reduce((sum, c) => sum + c.reps, 0);
  if (totalCleanReps !== 380) {
    throw new Error(`Clean deck reps should be exactly 380, got ${totalCleanReps}`);
  }
  if (calculateTotalCleanDeckReps(11) !== 380) {
    throw new Error(`calculateTotalCleanDeckReps(11) mismatch`);
  }
  if (calculateTotalCleanDeckReps(1) !== 340) {
    throw new Error(`calculateTotalCleanDeckReps(1) mismatch`);
  }
  console.log('✓ Test 1 Passed: 52 unique cards, exactly 380 reps.');

  // Test 2: Jokers positioning and safety
  for (let i = 0; i < 50; i++) {
    const deck2Jokers = createDeck({ jokersCount: 2, aceValue: 11 });
    if (deck2Jokers.length !== 54) {
      throw new Error(`Expected 54 cards with 2 jokers, got ${deck2Jokers.length}`);
    }

    const jokerIndices: number[] = [];
    deck2Jokers.forEach((card, idx) => {
      if (card.rank === 'JOKER') {
        jokerIndices.push(idx);
      }
    });

    if (jokerIndices.length !== 2) {
      throw new Error(`Expected 2 jokers, found ${jokerIndices.length}`);
    }

    const [j1, j2] = jokerIndices;
    // Window is 27..42 (1-based), so indices 26..41 (with 1st inserted), 26..42
    if (j1 < 26) {
      throw new Error(`Joker 1 at index ${j1} is before index 26!`);
    }
    const gap = j2 - j1 - 1;
    if (gap < 7) {
      throw new Error(`Gap between jokers is ${gap}, expected at least 7!`);
    }
  }
  console.log('✓ Test 2 Passed: Jokers never in first 26 cards, window respected, >= 7 cards between them.');

  // Test 3: Side rules and Navy SEAL special note
  const navySeal: Exercise = {
    id: 'body_navy_seal_burpees',
    suit: 'S',
    tier: 5,
    equipment: 'BODY',
    sideRule: 'NONE',
    nameRu: 'Бёрпи морских котиков',
    nameEn: 'Navy SEAL Burpees',
    musclesRu: '',
    musclesEn: '',
    cuesRu: [],
    cuesEn: [],
    commonMistakeRu: '',
    commonMistakeEn: '',
    youtubeQuery: '',
  };
  const navyBreakdown = getSideRuleBreakdown(navySeal, 11, 'ru');
  if (!navyBreakdown?.includes('33 отжимания')) {
    throw new Error(`Navy SEAL breakdown should mention 33 pushups for Ace 11, got: ${navyBreakdown}`);
  }

  const pistol: Exercise = {
    ...navySeal,
    id: 'body_pistol_squats',
    sideRule: 'SPLIT_TOTAL',
  };
  const pistolBreakdownEven = getSideRuleBreakdown(pistol, 8, 'ru');
  if (pistolBreakdownEven !== '8 = 4 левая + 4 правая') {
    throw new Error(`Pistol even breakdown mismatch: ${pistolBreakdownEven}`);
  }
  const pistolBreakdownOdd = getSideRuleBreakdown(pistol, 7, 'ru');
  if (!pistolBreakdownOdd?.includes('слабая сторона +1')) {
    throw new Error(`Pistol odd breakdown mismatch: ${pistolBreakdownOdd}`);
  }

  const lunge: Exercise = {
    ...navySeal,
    id: 'body_reverse_lunge_knee',
    sideRule: 'PER_SIDE',
  };
  const lungeBreakdown = getSideRuleBreakdown(lunge, 7, 'ru');
  if (!lungeBreakdown?.includes('всего 14')) {
    throw new Error(`Lunge per side breakdown mismatch: ${lungeBreakdown}`);
  }
  console.log('✓ Test 3 Passed: Side rules and Navy SEAL notes verified.');

  // Test 4: Heavy Load Gap in Kettlebells Mode
  const testDeck: Card[] = [
    { id: '1', suit: 'S', rank: 'K', reps: 10 },
    { id: '2', suit: 'H', rank: 'A', reps: 11 }, // Heavy adjacent violation!
    { id: '3', suit: 'D', rank: '4', reps: 4 },  // Low card further down
    { id: '4', suit: 'C', rank: '10', reps: 10 },
  ];
  const safeDeck = applyHeavyLoadGap(testDeck, true);
  if (safeDeck[1].reps > 6) {
    throw new Error(`Heavy Load Gap failed to swap heavy card: ${safeDeck[1].reps}`);
  }
  if (safeDeck[1].id !== '3') {
    throw new Error(`Expected card '3' to be swapped into index 1`);
  }
  console.log('✓ Test 4 Passed: Heavy Load Gap correctly swaps heavy cards.');

  // Test 5: Cluster Break
  const tenCard: Card = { id: 'k', suit: 'S', rank: 'K', reps: 10 };
  const aceCard: Card = { id: 'a', suit: 'S', rank: 'A', reps: 11 };
  const fiveCard: Card = { id: '5', suit: 'S', rank: '5', reps: 5 };

  if (!getClusterTip(tenCard, true, 'ru')?.includes('5 + 5')) {
    throw new Error('Cluster tip for 10 missing');
  }
  if (!getClusterTip(aceCard, true, 'ru')?.includes('4 + 4 + 3')) {
    throw new Error('Cluster tip for Ace missing');
  }
  if (getClusterTip(fiveCard, true, 'ru') !== null) {
    throw new Error('Cluster tip should be null for 5');
  }
  console.log('✓ Test 5 Passed: Cluster Break tips correct.');

  // Test 6: Tonnage calculation
  const sessionConfig = {
    mode: 'KETTLEBELL' as const,
    beast: false,
    jokers: 1 as const,
    aceValue: 11 as const,
    restSeconds: 5,
    loads: {
      S: { exerciseId: 'kb_overhead_press', kg: 16, count: 2 },
      H: { exerciseId: 'kb_goblet_squat', kg: 24, count: 1 },
      D: { exerciseId: 'kb_deadlift', kg: 32, count: 1 },
      C: { exerciseId: 'kb_weighted_crunch', kg: 16, count: 1 },
    },
  };
  // S card with 10 reps, 2 bells of 16kg => 16 * 10 * 2 = 320 kg
  const tonnage = calculateCardTonnage(tenCard, sessionConfig);
  if (tonnage !== 320) {
    throw new Error(`Expected tonnage 320, got ${tonnage}`);
  }
  console.log('✓ Test 6 Passed: Tonnage calculation is accurate.');

  // Test 7: Joker Choices & Customization
  // Red Joker durations (1 / 2 / 5 min in Beast Mode)
  const redNonBeast = getRedJokerDurations(false);
  if (redNonBeast.length !== 1 || redNonBeast[0] !== 60) {
    throw new Error(`Expected Red Joker non-beast to be [60], got: ${JSON.stringify(redNonBeast)}`);
  }
  const redBeast = getRedJokerDurations(true);
  if (redBeast.join(',') !== '60,120,300') {
    throw new Error(`Expected Red Joker beast options [60, 120, 300], got: ${JSON.stringify(redBeast)}`);
  }

  // Black Joker in Kettlebells Beast mode with 2 bells x 24kg x 50 reps
  const kbBeastConfig = {
    ...sessionConfig,
    mode: 'KETTLEBELL' as const,
    beast: true,
  };
  const kbTask = getBlackJokerTask(kbBeastConfig, [], {
    bellCount: 2,
    weightKg: 24,
    reps: 50,
  });
  if (kbTask.reps !== 50 || kbTask.bellCount !== 2 || kbTask.weightKg !== 24) {
    throw new Error(`Black Joker KB task mismatch`);
  }

  // Black Joker in Calisthenics Beast mode with 50 burpees
  const bodyBeastConfig = {
    ...sessionConfig,
    mode: 'BODY' as const,
    beast: true,
  };
  const bodyTask = getBlackJokerTask(bodyBeastConfig, [], {
    reps: 50,
    bodyExercise: 'BURPEES',
  });
  if (bodyTask.reps !== 50 || !bodyTask.titleRu.includes('Бёрпи')) {
    throw new Error(`Black Joker Body task mismatch`);
  }

  // Black Joker in Calisthenics Beast mode with Wall Sit (Стульчик 2 мин = 120 сек)
  const wallSitTask = getBlackJokerTask(bodyBeastConfig, [], {
    bodyExercise: 'WALL_SIT',
    wallSitSeconds: 120,
  });
  if (!wallSitTask.titleRu.includes('Стульчик') || !wallSitTask.isIsometricTimer || wallSitTask.timerSeconds !== 120) {
    throw new Error(`Black Joker Wall Sit task mismatch`);
  }
  // Test 8: Black Joker in KETTLEBELL mode allows choosing Thrusters, Burpees, or Wall Sit
  const kbBurpeeTask = getBlackJokerTask(kbBeastConfig, [], {
    exerciseChoice: 'BURPEES',
    reps: 30,
  });
  if (kbBurpeeTask.reps !== 30 || !kbBurpeeTask.titleRu.includes('Бёрпи')) {
    throw new Error('Black Joker in KB mode failed to produce Burpees');
  }

  const kbWallSitTask = getBlackJokerTask(kbBeastConfig, [], {
    exerciseChoice: 'WALL_SIT',
    wallSitSeconds: 300,
  });
  if (!kbWallSitTask.titleRu.includes('Стульчик') || !kbWallSitTask.isIsometricTimer || kbWallSitTask.timerSeconds !== 300) {
    throw new Error('Black Joker in KB mode failed to produce Wall Sit');
  }

  const kbThrustersTask = getBlackJokerTask(kbBeastConfig, [], {
    exerciseChoice: 'THRUSTERS',
    bellCount: 2,
    weightKg: 32,
    reps: 20,
  });
  if (!kbThrustersTask.titleRu.includes('Трастеры') || kbThrustersTask.reps !== 20 || kbThrustersTask.weightKg !== 32) {
    throw new Error('Black Joker in KB mode failed to produce Thrusters');
  }
  console.log('✓ Test 8 Passed: Black Joker in Kettlebell mode successfully allows Thrusters, Burpees, and Wall Sit.');

  // Test 9: Deck repetition safety:
  // - Max 2 consecutive cards of the same exercise (suit)
  // - No consecutive cards of the same exercise if reps >= 10
  // - Heavy load gap in Kettlebell mode
  for (let trial = 0; trial < 100; trial++) {
    const isKb = trial % 2 === 0;
    const jokersCount = (trial % 3) as 0 | 1 | 2;
    const rawDeck = createDeck({ jokersCount, aceValue: 11 });
    const finalDeck = applyHeavyLoadGap(rawDeck, isKb);

    // Verify 52 + jokers cards
    const expectedLen = 52 + jokersCount;
    if (finalDeck.length !== expectedLen) {
      throw new Error(`Expected deck length ${expectedLen}, got ${finalDeck.length}`);
    }

    // Verify repetition limits
    let lastHeavyIndex: number | null = null;
    let hasLowCardBetween = false;

    for (let i = 0; i < finalDeck.length; i++) {
      const card = finalDeck[i];

      if (card.suit && card.rank !== 'JOKER') {
        if (i >= 1 && finalDeck[i - 1].suit === card.suit) {
          // Never two consecutive cards of same suit with reps >= 10
          if (card.reps >= 10 || finalDeck[i - 1].reps >= 10) {
            throw new Error(
              `Repetition violation at index ${i}: consecutive ${card.suit} with reps (${finalDeck[i - 1].reps}, ${card.reps}) >= 10`
            );
          }
          // Never 3 consecutive cards of same suit
          if (i >= 2 && finalDeck[i - 2].suit === card.suit) {
            throw new Error(`Repetition violation at index ${i}: 3 consecutive cards of suit ${card.suit}`);
          }
        }
      }

      // Plank (Red Joker) must NEVER follow Core (Suit C)
      if (card.rank === 'JOKER' && card.jokerColor === 'RED') {
        if (i >= 1 && finalDeck[i - 1].suit === 'C') {
          throw new Error(`Safety violation: Plank (Red Joker) at index ${i} came directly after Core exercise (Suit C)!`);
        }
      }

      // Wall Sit (Black Joker) must NEVER follow Squats (Suit H)
      if (card.rank === 'JOKER' && card.jokerColor === 'BLACK') {
        if (i >= 1 && finalDeck[i - 1].suit === 'H') {
          throw new Error(`Safety violation: Wall Sit (Black Joker) at index ${i} came directly after Squat exercise (Suit H)!`);
        }
      }

      if (isKb) {
        if (card.reps <= 6 && card.suit && card.rank !== 'JOKER') {
          hasLowCardBetween = true;
        }
        if (['S', 'H', 'D'].includes(card.suit || '') && card.reps >= 10) {
          if (lastHeavyIndex !== null && !hasLowCardBetween) {
            throw new Error(`Heavy Load Gap violation between indices ${lastHeavyIndex} and ${i}`);
          }
          lastHeavyIndex = i;
          hasLowCardBetween = false;
        }
      }
    }
  }
  console.log('✓ Test 9 Passed: No 3 consecutive suits, no consecutive suits with 10+ reps, and heavy load gap preserved across 100 decks.');

  console.log('ALL ENGINE TESTS PASSED SUCCESSFULLY! ✓');
}

runTests();
