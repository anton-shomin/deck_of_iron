export type Suit = 'S' | 'H' | 'D' | 'C';
export type Rank = '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'A';
export type SideRule = 'NONE' | 'SPLIT_TOTAL' | 'PER_SIDE';
export type JokerColor = 'RED' | 'BLACK';

export interface Exercise {
  id: string;
  suit: Suit;
  tier: number;
  equipment: 'BODY' | 'KETTLEBELL';
  sideRule: SideRule;
  nameRu: string;
  nameEn: string;
  musclesRu: string;
  musclesEn: string;
  cuesRu: string[];
  cuesEn: string[];
  commonMistakeRu: string;
  commonMistakeEn: string;
  youtubeQuery: string;
  specialNoteRu?: string;
  specialNoteEn?: string;
}

export interface Card {
  id: string;
  suit: Suit | null; // null for Joker
  rank: Rank | 'JOKER';
  reps: number;
  jokerColor?: JokerColor;
}

export interface SuitLoad {
  exerciseId: string;
  kg: number;
  count: number; // 1 or 2 kettlebells
}

export type BlackJokerChoice = 'THRUSTERS' | 'BURPEES' | 'WALL_SIT' | 'SUIT_15';

export interface JokerSettings {
  redPlankSeconds: number; // 60, 120, 300 (1 / 2 / 5 min)
  blackExerciseChoice: BlackJokerChoice; // 'THRUSTERS' | 'BURPEES' | 'WALL_SIT'
  blackKbCount: 1 | 2; // 1 or 2 kettlebells
  blackKbWeight: 16 | 24 | 32; // 16, 24, 32 kg
  blackKbReps: 20 | 30 | 50 | 70 | 100;
  blackBodyReps: 20 | 30 | 50;
  blackWallSitSeconds: number; // 60, 120, 300 (1 / 2 / 5 min)
}

export interface SessionConfig {
  mode: 'BODY' | 'KETTLEBELL' | 'CUSTOM';
  beast: boolean;
  jokers: 0 | 1 | 2;
  aceValue: 1 | 11;
  restSeconds: number | null; // null = manual
  loads: Record<Suit, SuitLoad>;
  jokerSettings?: JokerSettings;
}

export interface Preset {
  id: string;
  nameRu: string;
  nameEn: string;
  descRu: string;
  descEn: string;
  mode: 'BODY' | 'KETTLEBELL' | 'CUSTOM';
  loads: Record<Suit, SuitLoad>;
}

export interface WorkoutHistoryEntry {
  id: string;
  timestamp: number;
  durationSeconds: number;
  mode: 'BODY' | 'KETTLEBELL' | 'CUSTOM';
  beast: boolean;
  totalCards: number;
  completedCards: number;
  totalReps: number;
  suitReps: Record<Suit, number>;
  totalTonnageKg: number;
  jokersCompleted: number;
}
