import type { Player, Score, EvaluationItem, EvaluatorName, ClubEvent } from './types';
import { DEFAULT_PASSWORD, EVALUATORS } from './types';

const KEYS = {
  players: 'valhalla_players',
  items: 'valhalla_items',
  scores: 'valhalla_scores',
  session: 'valhalla_session',
  passwords: 'valhalla_passwords',
  events: 'valhalla_events',
  lastSync: 'valhalla_last_sync',
} as const;

export const DEFAULT_ITEMS: Omit<EvaluationItem, 'id'>[] = [
  { name: 'Responsabilidad', order: 1 },
  { name: 'Compromiso', order: 2 },
  { name: 'Puntualidad', order: 3 },
  { name: 'Comunicación', order: 4 },
  { name: 'Trabajo en Equipo', order: 5 },
  { name: 'Actitud', order: 6 },
];

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore quota errors */
  }
}

function simpleHash(str: string): string {
  let hash = 0;
  const salt = 'valhalla_odin_2024';
  const combined = str + salt;
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return String(hash);
}

export const storage = {
  getPlayers: (): Player[] => {
    const raw = read<unknown[]>(KEYS.players, []);
    return raw.map((p) => {
      const obj = p as Record<string, unknown>;
      const positions = Array.isArray(obj['positions']) ? obj['positions'] as string[] : (obj['position'] ? [obj['position'] as string] : []);
      const eaRating = obj['eaRating'] !== undefined ? obj['eaRating'] as number | null : null;
      return {
        id: obj['id'] as string,
        name: obj['name'] as string,
        positions,
        eaRating,
        photoUrl: obj['photoUrl'] !== undefined ? obj['photoUrl'] as string | null : null,
      };
    });
  },
  setPlayers: (p: Player[]) => write(KEYS.players, p),

  getItems: (): EvaluationItem[] => read<EvaluationItem[]>(KEYS.items, []),
  setItems: (i: EvaluationItem[]) => write(KEYS.items, i),

  getScores: (): Score[] => read<Score[]>(KEYS.scores, []),
  setScores: (s: Score[]) => write(KEYS.scores, s),

  getSession: (): EvaluatorName | null => read<EvaluatorName | null>(KEYS.session, null),
  setSession: (e: EvaluatorName | null) => write(KEYS.session, e),

  getEvents: (): ClubEvent[] => read<ClubEvent[]>(KEYS.events, []),
  setEvents: (e: ClubEvent[]) => write(KEYS.events, e),

  getLastSync: (): string | null => read<string | null>(KEYS.lastSync, null),
  setLastSync: (t: string) => write(KEYS.lastSync, t),

  getPasswords: (): Record<string, string> => read<Record<string, string>>(KEYS.passwords, {}),
  getPassword: (name: EvaluatorName): string => {
    const passwords = read<Record<string, string>>(KEYS.passwords, {});
    return passwords[name] ?? simpleHash(DEFAULT_PASSWORD);
  },
  setPassword: (name: EvaluatorName, password: string) => {
    const passwords = read<Record<string, string>>(KEYS.passwords, {});
    passwords[name] = simpleHash(password);
    write(KEYS.passwords, passwords);
  },
  verifyPassword: (name: EvaluatorName, password: string): boolean => {
    const passwords = read<Record<string, string>>(KEYS.passwords, {});
    const stored = passwords[name] ?? simpleHash(DEFAULT_PASSWORD);
    return simpleHash(password) === stored;
  },
  isDefaultPassword: (name: EvaluatorName): boolean => {
    const passwords = read<Record<string, string>>(KEYS.passwords, {});
    return !passwords[name];
  },

  initDefaults: () => {
    if (localStorage.getItem(KEYS.items) === null) {
      const items: EvaluationItem[] = DEFAULT_ITEMS.map((it) => ({
        ...it,
        id: crypto.randomUUID(),
      }));
      write(KEYS.items, items);
    }
    const passwords = read<Record<string, string>>(KEYS.passwords, {});
    let changed = false;
    for (const ev of EVALUATORS) {
      if (!passwords[ev.name]) {
        passwords[ev.name] = simpleHash(DEFAULT_PASSWORD);
        changed = true;
      }
    }
    if (changed) write(KEYS.passwords, passwords);
  },
};
