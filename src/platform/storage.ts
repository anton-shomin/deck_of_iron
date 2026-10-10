import { SessionConfig, WorkoutHistoryEntry, Card, Preset, Suit } from '../types';

const STORAGE_KEYS = {
  SETTINGS: 'deck_of_iron_settings_v1',
  ACTIVE_SESSION: 'deck_of_iron_active_session_v1',
  CUSTOM_PRESETS: 'deck_of_iron_custom_presets_v1',
  LANGUAGE: 'deck_of_iron_lang_v1',
  SOUND: 'deck_of_iron_sound_v1',
};

// Safe localStorage methods
export function safeGetItem<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue;
  try {
    const val = localStorage.getItem(key);
    if (!val) return defaultValue;
    return JSON.parse(val) as T;
  } catch (err) {
    console.warn(`Error reading ${key} from localStorage:`, err);
    return defaultValue;
  }
}

export function safeSetItem<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.warn(`Error writing ${key} to localStorage:`, err);
  }
}

export function safeRemoveItem(key: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(key);
  } catch (err) {
    console.warn(`Error removing ${key} from localStorage:`, err);
  }
}

// Active session persistence
export interface ActiveSessionBackup {
  config: SessionConfig;
  deck: Card[];
  currentIndex: number;
  startTimestamp: number;
  elapsedSeconds: number;
  totalRepsAccumulated?: number;
  totalTonnageAccumulated?: number;
  suitRepsAccumulated?: Record<Suit, number>;
  jokersCompleted?: number;
}

export function saveActiveSession(session: ActiveSessionBackup | null): void {
  if (!session) {
    safeRemoveItem(STORAGE_KEYS.ACTIVE_SESSION);
  } else {
    safeSetItem(STORAGE_KEYS.ACTIVE_SESSION, session);
  }
}

export function loadActiveSession(): ActiveSessionBackup | null {
  return safeGetItem<ActiveSessionBackup | null>(STORAGE_KEYS.ACTIVE_SESSION, null);
}

export function clearActiveSession(): void {
  safeRemoveItem(STORAGE_KEYS.ACTIVE_SESSION);
}

// Custom presets
export function loadCustomPresets(): Preset[] {
  return safeGetItem<Preset[]>(STORAGE_KEYS.CUSTOM_PRESETS, []);
}

export function saveCustomPresets(presets: Preset[]): void {
  safeSetItem(STORAGE_KEYS.CUSTOM_PRESETS, presets);
}

// Preferences
export function loadLanguage(): 'ru' | 'en' {
  return safeGetItem<'ru' | 'en'>(STORAGE_KEYS.LANGUAGE, 'ru');
}

export function saveLanguage(lang: 'ru' | 'en'): void {
  safeSetItem(STORAGE_KEYS.LANGUAGE, lang);
}

export function loadSoundPreference(): boolean {
  return safeGetItem<boolean>(STORAGE_KEYS.SOUND, true);
}

export function saveSoundPreference(enabled: boolean): void {
  safeSetItem(STORAGE_KEYS.SOUND, enabled);
}

// =================== INDEXEDDB FOR WORKOUT HISTORY ===================

const DB_NAME = 'DeckOfIronDB';
const DB_VERSION = 1;
const STORE_NAME = 'workout_history';

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !('indexedDB' in window)) {
      return reject(new Error('IndexedDB not supported'));
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveWorkoutToHistory(entry: WorkoutHistoryEntry): Promise<void> {
  try {
    const db = await openDatabase();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(entry);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (e) {
    console.warn('Failed to save workout to IndexedDB, fallback to localStorage', e);
    const existing = safeGetItem<WorkoutHistoryEntry[]>('deck_of_iron_history_fallback', []);
    existing.unshift(entry);
    safeSetItem('deck_of_iron_history_fallback', existing.slice(0, 50));
  }
}

export async function getWorkoutHistory(): Promise<WorkoutHistoryEntry[]> {
  try {
    const db = await openDatabase();
    return await new Promise<WorkoutHistoryEntry[]>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const index = store.index('timestamp');
      const req = index.openCursor(null, 'prev');
      const results: WorkoutHistoryEntry[] = [];

      req.onsuccess = (e) => {
        const cursor = (e.target as IDBRequest).result;
        if (cursor) {
          results.push(cursor.value);
          cursor.continue();
        } else {
          resolve(results);
        }
      };
      req.onerror = () => reject(req.error);
    });
  } catch (e) {
    console.warn('Failed to read from IndexedDB, using fallback', e);
    return safeGetItem<WorkoutHistoryEntry[]>('deck_of_iron_history_fallback', []);
  }
}

export async function clearWorkoutHistory(): Promise<void> {
  try {
    const db = await openDatabase();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.clear();
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch {
    // Ignore
  }
  safeRemoveItem('deck_of_iron_history_fallback');
}
