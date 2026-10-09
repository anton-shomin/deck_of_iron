import { BlackJokerChoice, Exercise, SessionConfig, Suit } from '../types';

export interface RedJokerConfig {
  durationSeconds: number;
  labelRu: string;
  labelEn: string;
}

export interface BlackJokerTask {
  titleRu: string;
  titleEn: string;
  reps: number;
  descriptionRu: string;
  descriptionEn: string;
  weightKg?: number;
  bellCount?: number;
  isIsometricTimer?: boolean;
  timerSeconds?: number;
}

export interface BlackJokerCustomization {
  exerciseChoice?: BlackJokerChoice;
  bodyExercise?: BlackJokerChoice; // backward compatibility
  reps?: number;
  bellCount?: 1 | 2;
  weightKg?: 16 | 24 | 32;
  wallSitSeconds?: number;
  suit?: Suit;
}

export const BLACK_JOKER_KB_WEIGHTS: (16 | 24 | 32)[] = [16, 24, 32];
export const BLACK_JOKER_KB_REPS: (20 | 30 | 50 | 70 | 100)[] = [20, 30, 50, 70, 100];
export const BLACK_JOKER_BODY_REPS: (20 | 30 | 50)[] = [20, 30, 50];
export const WALL_SIT_DURATIONS: number[] = [60, 120, 300]; // 1, 2, 5 min

export function getRedJokerDurations(beast: boolean, mode: string = 'BODY'): number[] {
  if (!beast) {
    return [60];
  }
  // 1 / 2 / 5 минут для планки
  return [60, 120, 300];
}

export function getRedJokerDetails(seconds: number, lang: 'ru' | 'en' = 'ru'): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (lang === 'ru') {
    return secs === 0
      ? `Планка на предплечьях: ${mins} мин`
      : `Планка на предплечьях: ${seconds} сек`;
  }
  return secs === 0
    ? `Forearm Plank: ${mins} min`
    : `Forearm Plank: ${seconds} sec`;
}

export function getBlackJokerTask(
  config: SessionConfig,
  exercises: Exercise[],
  customOptions?: BlackJokerCustomization
): BlackJokerTask {
  const isKettlebell = config.mode === 'KETTLEBELL';

  // Determine explicit or configured exercise choice:
  // THRUSTERS, BURPEES, WALL_SIT, or SUIT_15
  const rawChoice =
    customOptions?.exerciseChoice ||
    customOptions?.bodyExercise ||
    config.jokerSettings?.blackExerciseChoice;

  // If no choice was provided and Beast Mode is OFF, default to 15 reps of suit
  if (!rawChoice && !config.beast) {
    const suits: Suit[] = ['S', 'H', 'D', 'C'];
    const chosenSuit = customOptions?.suit || suits[Math.floor(Math.random() * suits.length)];
    const load = config.loads[chosenSuit];
    const ex = exercises.find((e) => e.id === load?.exerciseId);
    const exNameRu = ex ? ex.nameRu : 'Основное упражнение';
    const exNameEn = ex ? ex.nameEn : 'Main Exercise';

    return {
      titleRu: `15 повторений: ${exNameRu}`,
      titleEn: `15 reps: ${exNameEn}`,
      reps: 15,
      descriptionRu: `Выполните 15 строгих повторений упражнения масти ${chosenSuit}`,
      descriptionEn: `Perform 15 strict reps of suit ${chosenSuit} exercise`,
      weightKg: isKettlebell ? load?.kg || 0 : 0,
      bellCount: isKettlebell ? load?.count || 1 : 1,
    };
  }

  // Active choice:
  const choice: BlackJokerChoice =
    rawChoice || (config.mode === 'KETTLEBELL' ? 'THRUSTERS' : 'BURPEES');

  if (choice === 'SUIT_15') {
    const suits: Suit[] = ['S', 'H', 'D', 'C'];
    const chosenSuit = customOptions?.suit || suits[Math.floor(Math.random() * suits.length)];
    const load = config.loads[chosenSuit];
    const ex = exercises.find((e) => e.id === load?.exerciseId);
    const exNameRu = ex ? ex.nameRu : 'Основное упражнение';
    const exNameEn = ex ? ex.nameEn : 'Main Exercise';

    return {
      titleRu: `15 повторений: ${exNameRu}`,
      titleEn: `15 reps: ${exNameEn}`,
      reps: 15,
      descriptionRu: `Выполните 15 строгих повторений упражнения масти ${chosenSuit}`,
      descriptionEn: `Perform 15 strict reps of suit ${chosenSuit} exercise`,
      weightKg: isKettlebell ? load?.kg || 0 : 0,
      bellCount: isKettlebell ? load?.count || 1 : 1,
    };
  }

  // 1) THRUSTERS (Трастеры с гирями): 1 или 2 гири, 16/24/32 кг, 20/30/50/70/100 повторений
  if (choice === 'THRUSTERS') {
    const reps = customOptions?.reps || config.jokerSettings?.blackKbReps || 30;
    const weight = customOptions?.weightKg || config.jokerSettings?.blackKbWeight || 24;
    const count = customOptions?.bellCount || config.jokerSettings?.blackKbCount || 1;

    const bellLabelRu = count === 1 ? '1 гиря' : '2 гири';
    const bellLabelEn = count === 1 ? '1 bell' : '2 bells';

    return {
      titleRu: `Трастеры с гирями (${reps} повт)`,
      titleEn: `Kettlebell Thrusters (${reps} reps)`,
      reps,
      descriptionRu: `Экстремальный вызов: ${reps} трастеров с весом ${count > 1 ? `2×${weight}` : `${weight}`} кг (${bellLabelRu})`,
      descriptionEn: `Extreme challenge: ${reps} thrusters with ${count > 1 ? `2×${weight}` : `${weight}`} kg (${bellLabelEn})`,
      weightKg: weight,
      bellCount: count,
      isIsometricTimer: false,
    };
  }

  // 2) WALL_SIT (Упражнение «стульчик» у стены): 1 / 2 / 5 минут
  if (choice === 'WALL_SIT') {
    const wallSeconds =
      customOptions?.wallSitSeconds || config.jokerSettings?.blackWallSitSeconds || 120;
    const wallMins = Math.floor(wallSeconds / 60);

    return {
      titleRu: `Упражнение «Стульчик» (${wallMins} мин)`,
      titleEn: `Wall Sit Hold (${wallMins} min)`,
      reps: wallMins,
      descriptionRu: `Классическое изометрическое (статическое) упражнение у стены: удерживайте позу сидя без опоры на стул под углом 90° в течение ${wallMins} мин`,
      descriptionEn: `Classic isometric static wall sit: hold a 90-degree seated position against a wall without a chair for ${wallMins} min`,
      weightKg: 0,
      bellCount: 1,
      isIsometricTimer: true,
      timerSeconds: wallSeconds,
    };
  }

  // 3) BURPEES: 20 / 30 / 50 reps
  const reps = customOptions?.reps || config.jokerSettings?.blackBodyReps || 30;

  return {
    titleRu: `Бёрпи (${reps} повт)`,
    titleEn: `Burpees (${reps} reps)`,
    reps,
    descriptionRu: `Экстремальный вызов: ${reps} взрывных бёрпи с касанием грудью пола`,
    descriptionEn: `Extreme challenge: ${reps} explosive chest-to-floor burpees`,
    weightKg: 0,
    bellCount: 1,
    isIsometricTimer: false,
  };
}
