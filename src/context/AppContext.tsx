import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import type { Player, Score, EvaluationItem, EvaluatorName, ClubEvent, EventType, BrandingSettings } from '@/lib/types';
import { EVALUATORS, DEFAULT_BRANDING } from '@/lib/types';
import { storage } from '@/lib/storage';
import { getSupabase } from '@/lib/supabaseClient';

// ---- Notification helper ----

async function pushNotification(
  userName: string | null,
  type: string,
  title: string,
  message: string
): Promise<void> {
  const sb = getSupabase();
  if (!sb || !userName) return;
  try {
    await sb.from('notifications').insert({
      user_name: userName,
      type,
      title,
      message,
    });
  } catch {
    // notifications are best-effort — don't block the mutation
  }
}

// ---- DB row types ----

interface DbPlayer {
  id: string;
  name: string;
  positions: string[] | null;
  ea_rating: number | null;
  photo_url: string | null;
}

interface DbItem {
  id: string;
  name: string;
  order: number;
}

interface DbScore {
  id: string;
  player_id: string;
  item_id: string;
  evaluator: string;
  value: number;
}

interface DbEvent {
  id: string;
  title: string;
  event_date: string;
  event_time: string;
  type: string;
  notes: string | null;
  created_by: string | null;
}

// ---- Mappers ----

function dbToPlayer(row: DbPlayer): Player {
  return {
    id: row.id,
    name: row.name,
    positions: row.positions ?? [],
    eaRating: row.ea_rating ?? null,
    photoUrl: row.photo_url ?? null,
  };
}

function playerToDb(p: Omit<Player, 'id'>) {
  return {
    name: p.name,
    positions: p.positions,
    ea_rating: p.eaRating ?? null,
    photo_url: p.photoUrl ?? null,
  };
}

function dbToItem(row: DbItem): EvaluationItem {
  return { id: row.id, name: row.name, order: row.order };
}

function dbToScore(row: DbScore): Score {
  return {
    id: row.id,
    playerId: row.player_id,
    itemId: row.item_id,
    evaluator: row.evaluator as EvaluatorName,
    value: Number(row.value),
  };
}

function dbToEvent(row: DbEvent): ClubEvent {
  return {
    id: row.id,
    title: row.title,
    date: row.event_date,
    time: row.event_time,
    type: (row.type as EventType) || 'partido',
    notes: row.notes ?? '',
    createdBy: row.created_by,
  };
}

function eventToDb(e: Omit<ClubEvent, 'id'>) {
  return {
    title: e.title,
    event_date: e.date,
    event_time: e.time,
    type: e.type,
    notes: e.notes || null,
    created_by: e.createdBy,
  };
}

interface DbBranding {
  logo_url: string | null;
  primary_color: string;
  secondary_color: string;
  text_color: string;
}

// ---- Context ----

interface AppContextValue {
  players: Player[];
  items: EvaluationItem[];
  scores: Score[];
  events: ClubEvent[];
  session: EvaluatorName | null;
  sessionRole: 'admin' | 'dt' | null;
  setSession: (e: EvaluatorName | null) => void;
  branding: BrandingSettings;
  updateBranding: (b: BrandingSettings) => Promise<void>;
  resetBranding: () => Promise<void>;
  uploadPhoto: (file: File, fileName: string) => Promise<string | null>;
  addPlayer: (name: string, positions: string[], photoUrl?: string | null) => void;
  deletePlayer: (id: string) => void;
  updatePlayer: (id: string, name: string, positions: string[], photoUrl?: string | null) => void;
  syncPlayerEARatings: (ratings: Record<string, number>) => void;
  addItem: (name: string) => void;
  updateItem: (id: string, name: string) => void;
  deleteItem: (id: string) => void;
  setScore: (playerId: string, itemId: string, evaluator: EvaluatorName, value: number) => void;
  getScore: (playerId: string, itemId: string, evaluator: EvaluatorName) => number | null;
  addEvent: (e: Omit<ClubEvent, 'id'>) => void;
  updateEvent: (id: string, e: Omit<ClubEvent, 'id'>) => void;
  deleteEvent: (id: string) => void;
  verifyPassword: (name: EvaluatorName, password: string) => boolean;
  changePassword: (name: EvaluatorName, oldPassword: string, newPassword: string) => boolean;
  isDefaultPassword: (name: EvaluatorName) => boolean;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [players, setPlayers] = useState<Player[]>([]);
  const [items, setItems] = useState<EvaluationItem[]>([]);
  const [scores, setScores] = useState<Score[]>([]);
  const [events, setEvents] = useState<ClubEvent[]>([]);
  const [session, setSessionState] = useState<EvaluatorName | null>(null);
  const [branding, setBranding] = useState<BrandingSettings>(DEFAULT_BRANDING);

  // ---- Load everything on mount ----

  useEffect(() => {
    storage.initDefaults();
    setSessionState(storage.getSession());

    const sb = getSupabase();
    if (sb) {
      // Players
      sb.from('players').select('*').order('created_at', { ascending: true })
        .then(({ data }) => {
          if (data) {
            const mapped = (data as DbPlayer[]).map(dbToPlayer);
            setPlayers(mapped);
            storage.setPlayers(mapped);
          } else {
            setPlayers(storage.getPlayers());
          }
        });
      // Items
      sb.from('evaluation_items').select('*').order('order', { ascending: true })
        .then(({ data }) => {
          if (data) {
            const mapped = (data as DbItem[]).map(dbToItem);
            setItems(mapped);
            storage.setItems(mapped);
          } else {
            setItems(storage.getItems());
          }
        });
      // Scores
      sb.from('scores').select('*')
        .then(({ data }) => {
          if (data) {
            const mapped = (data as DbScore[]).map(dbToScore);
            setScores(mapped);
            storage.setScores(mapped);
          } else {
            setScores(storage.getScores());
          }
        });
      // Events
      sb.from('club_events').select('*').order('event_date', { ascending: true })
        .then(({ data, error }) => {
          if (!error && data) {
            const mapped = (data as DbEvent[]).map(dbToEvent);
            setEvents(mapped);
            storage.setEvents(mapped);
          } else {
            setEvents(storage.getEvents());
          }
        });
      // Branding
      sb.from('branding_settings').select('*').eq('id', 1).single()
        .then(({ data }) => {
          if (data) {
            const b = data as unknown as DbBranding;
            setBranding({
              logoUrl: b.logo_url,
              primaryColor: b.primary_color,
              secondaryColor: b.secondary_color,
              textColor: b.text_color,
            });
          }
        });
    } else {
      setPlayers(storage.getPlayers());
      setItems(storage.getItems());
      setScores(storage.getScores());
      setEvents(storage.getEvents());
    }
  }, []);

  // Apply branding CSS variables
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--color-primary', branding.primaryColor);
    root.style.setProperty('--color-secondary', branding.secondaryColor);
    root.style.setProperty('--color-text', branding.textColor);
  }, [branding]);

  // ---- Helpers ----

  const persistPlayersLocal = useCallback((p: Player[]) => {
    setPlayers(p);
    storage.setPlayers(p);
  }, []);

  const persistItemsLocal = useCallback((i: EvaluationItem[]) => {
    setItems(i);
    storage.setItems(i);
  }, []);

  const persistScoresLocal = useCallback((s: Score[]) => {
    setScores(s);
    storage.setScores(s);
  }, []);

  const persistEventsLocal = useCallback((e: ClubEvent[]) => {
    setEvents(e);
    storage.setEvents(e);
  }, []);

  const refreshScores = useCallback(async () => {
    const sb = getSupabase();
    if (!sb) return;
    const { data } = await sb.from('scores').select('*');
    if (data) {
      const mapped = (data as DbScore[]).map(dbToScore);
      persistScoresLocal(mapped);
    }
  }, [persistScoresLocal]);

  const setSession = useCallback((e: EvaluatorName | null) => {
    setSessionState(e);
    storage.setSession(e);
  }, []);

  const sessionRole = session
    ? EVALUATORS.find((ev) => ev.name === session)?.role ?? null
    : null;

  // ---- Players ----

  const addPlayer = useCallback(
    async (name: string, positions: string[], photoUrl?: string | null) => {
      const sb = getSupabase();
      const newPlayer: Player = {
        id: crypto.randomUUID(),
        name,
        positions: positions.slice(0, 3),
        eaRating: null,
        photoUrl: photoUrl ?? null,
      };
      if (sb) {
        const { data, error } = await sb
          .from('players')
          .insert(playerToDb(newPlayer))
          .select('*')
          .single();
        if (!error && data) {
          const mapped = dbToPlayer(data as DbPlayer);
          persistPlayersLocal([...players, mapped]);
          await pushNotification(session, 'player_added', 'Jugador agregado', `${name} fue añadido a la plantilla`);
          return;
        }
      }
      persistPlayersLocal([...players, newPlayer]);
    },
    [players, persistPlayersLocal, session]
  );

  const deletePlayer = useCallback(
    async (id: string) => {
      const sb = getSupabase();
      const playerName = players.find((p) => p.id === id)?.name ?? 'Jugador';
      if (sb) {
        await sb.from('scores').delete().eq('player_id', id);
        const { error } = await sb.from('players').delete().eq('id', id);
        if (!error) {
          persistPlayersLocal(players.filter((p) => p.id !== id));
          persistScoresLocal(scores.filter((s) => s.playerId !== id));
          await pushNotification(session, 'player_deleted', 'Jugador eliminado', `${playerName} fue eliminado de la plantilla`);
          return;
        }
      }
      persistPlayersLocal(players.filter((p) => p.id !== id));
      persistScoresLocal(scores.filter((s) => s.playerId !== id));
    },
    [players, scores, persistPlayersLocal, persistScoresLocal]
  );

  const updatePlayer = useCallback(
    async (id: string, name: string, positions: string[], photoUrl?: string | null) => {
      const sb = getSupabase();
      const updated: Partial<Player> = { name, positions: positions.slice(0, 3) };
      if (photoUrl !== undefined) updated.photoUrl = photoUrl;
      const dbUpdate: Record<string, unknown> = { name, positions: positions.slice(0, 3) };
      if (photoUrl !== undefined) dbUpdate.photo_url = photoUrl;
      if (sb) {
        const { error } = await sb.from('players').update(dbUpdate).eq('id', id);
        if (!error) {
          persistPlayersLocal(
            players.map((p) => (p.id === id ? { ...p, ...updated } : p))
          );
          await pushNotification(session, 'player_updated', 'Jugador actualizado', `${name} fue modificado`);
          return;
        }
      }
      persistPlayersLocal(
        players.map((p) => (p.id === id ? { ...p, ...updated } : p))
      );
    },
    [players, persistPlayersLocal, session]
  );

  const syncPlayerEARatings = useCallback(
    async (ratings: Record<string, number>) => {
      const sb = getSupabase();
      if (sb) {
        for (const [name, rating] of Object.entries(ratings)) {
          const existing = players.find(
            (p) => p.name.toLowerCase() === name.toLowerCase()
          );
          if (existing) {
            await sb
              .from('players')
              .update({ ea_rating: rating })
              .eq('id', existing.id);
          } else {
            const newPlayer: Player = {
              id: crypto.randomUUID(),
              name,
              positions: [],
              eaRating: rating,
            };
            await sb.from('players').insert(playerToDb(newPlayer));
          }
        }
        // Refresh from DB
        const { data } = await sb.from('players').select('*').order('created_at', { ascending: true });
        if (data) {
          const mapped = (data as DbPlayer[]).map(dbToPlayer);
          persistPlayersLocal(mapped);
        }
        storage.setLastSync(new Date().toISOString());
        return;
      }
      // localStorage fallback
      const updated = [...players];
      const existingNames = new Set(updated.map((p) => p.name.toLowerCase()));
      for (const [name, rating] of Object.entries(ratings)) {
        const found = updated.find((p) => p.name.toLowerCase() === name.toLowerCase());
        if (found) {
          found.eaRating = rating;
        } else if (!existingNames.has(name.toLowerCase())) {
          updated.push({
            id: crypto.randomUUID(),
            name,
            positions: [],
            eaRating: rating,
          });
          existingNames.add(name.toLowerCase());
        }
      }
      persistPlayersLocal(updated);
      storage.setLastSync(new Date().toISOString());
    },
    [players, persistPlayersLocal]
  );

  // ---- Items ----

  const addItem = useCallback(
    async (name: string) => {
      const sb = getSupabase();
      const order = items.length > 0 ? Math.max(...items.map((i) => i.order)) + 1 : 1;
      const newItem: EvaluationItem = { id: crypto.randomUUID(), name, order };
      if (sb) {
        const { data, error } = await sb
          .from('evaluation_items')
          .insert({ name, order })
          .select('*')
          .single();
        if (!error && data) {
          const mapped = dbToItem(data as DbItem);
          persistItemsLocal([...items, mapped]);
          await pushNotification(session, 'item_added', 'Ítem creado', `${name} fue añadido a los criterios de evaluación`);
          return;
        }
      }
      persistItemsLocal([...items, newItem]);
    },
    [items, persistItemsLocal]
  );

  const updateItem = useCallback(
    async (id: string, name: string) => {
      const sb = getSupabase();
      if (sb) {
        const { error } = await sb.from('evaluation_items').update({ name }).eq('id', id);
        if (!error) {
          persistItemsLocal(items.map((i) => (i.id === id ? { ...i, name } : i)));
          await pushNotification(session, 'item_updated', 'Ítem actualizado', `${name} fue modificado`);
          return;
        }
      }
      persistItemsLocal(items.map((i) => (i.id === id ? { ...i, name } : i)));
    },
    [items, persistItemsLocal]
  );

  const deleteItem = useCallback(
    async (id: string) => {
      const sb = getSupabase();
      const itemName = items.find((i) => i.id === id)?.name ?? 'Ítem';
      if (sb) {
        await sb.from('scores').delete().eq('item_id', id);
        const { error } = await sb.from('evaluation_items').delete().eq('id', id);
        if (!error) {
          persistItemsLocal(items.filter((i) => i.id !== id));
          persistScoresLocal(scores.filter((s) => s.itemId !== id));
          await pushNotification(session, 'item_deleted', 'Ítem eliminado', `${itemName} fue eliminado de los criterios`);
          return;
        }
      }
      persistItemsLocal(items.filter((i) => i.id !== id));
      persistScoresLocal(scores.filter((s) => s.itemId !== id));
    },
    [items, scores, persistItemsLocal, persistScoresLocal]
  );

  // ---- Scores ----

  const setScore = useCallback(
    async (playerId: string, itemId: string, evaluator: EvaluatorName, value: number) => {
      const sb = getSupabase();
      const existing = scores.find(
        (s) =>
          s.playerId === playerId && s.itemId === itemId && s.evaluator === evaluator
      );
      if (sb) {
        if (existing) {
          const { error } = await sb
            .from('scores')
            .update({ value })
            .eq('id', existing.id);
          if (!error) {
            persistScoresLocal(
              scores.map((s) => (s.id === existing.id ? { ...s, value } : s))
            );
            return;
          }
        } else {
          const { data, error } = await sb
            .from('scores')
            .insert({ player_id: playerId, item_id: itemId, evaluator, value })
            .select('*')
            .single();
          if (!error && data) {
            const mapped = dbToScore(data as DbScore);
            persistScoresLocal([...scores, mapped]);
            return;
          }
        }
      }
      // localStorage fallback
      if (existing) {
        persistScoresLocal(scores.map((s) => (s.id === existing.id ? { ...s, value } : s)));
      } else {
        persistScoresLocal([
          ...scores,
          { id: crypto.randomUUID(), playerId, itemId, evaluator, value },
        ]);
      }
    },
    [scores, persistScoresLocal]
  );

  const getScore = useCallback(
    (playerId: string, itemId: string, evaluator: EvaluatorName) => {
      const s = scores.find(
        (sc) =>
          sc.playerId === playerId && sc.itemId === itemId && sc.evaluator === evaluator
      );
      return s ? s.value : null;
    },
    [scores]
  );

  // ---- Events ----

  const addEvent = useCallback(
    async (e: Omit<ClubEvent, 'id'>) => {
      const sb = getSupabase();
      if (sb) {
        const { data, error } = await sb.from('club_events').insert(eventToDb(e)).select('*').single();
        if (!error && data) {
          persistEventsLocal([...events, dbToEvent(data as DbEvent)]);
          await pushNotification(session, 'event_added', 'Evento creado', `${e.title} fue añadido al calendario`);
          return;
        }
      }
      persistEventsLocal([...events, { ...e, id: crypto.randomUUID() }]);
    },
    [events, persistEventsLocal]
  );

  const updateEvent = useCallback(
    async (id: string, e: Omit<ClubEvent, 'id'>) => {
      const sb = getSupabase();
      if (sb) {
        const { error } = await sb.from('club_events').update(eventToDb(e)).eq('id', id);
        if (!error) {
          const { data } = await sb.from('club_events').select('*').order('event_date', { ascending: true });
          if (data) {
            persistEventsLocal((data as DbEvent[]).map(dbToEvent));
          }
          await pushNotification(session, 'event_updated', 'Evento actualizado', `${e.title} fue modificado`);
          return;
        }
      }
      persistEventsLocal(events.map((ev) => (ev.id === id ? { ...e, id } : ev)));
    },
    [events, persistEventsLocal]
  );

  const deleteEvent = useCallback(
    async (id: string) => {
      const sb = getSupabase();
      const eventTitle = events.find((ev) => ev.id === id)?.title ?? 'Evento';
      if (sb) {
        const { error } = await sb.from('club_events').delete().eq('id', id);
        if (!error) {
          persistEventsLocal(events.filter((ev) => ev.id !== id));
          await pushNotification(session, 'event_deleted', 'Evento eliminado', `${eventTitle} fue eliminado del calendario`);
          return;
        }
      }
      persistEventsLocal(events.filter((ev) => ev.id !== id));
    },
    [events, persistEventsLocal]
  );

  // ---- Passwords ----

  const uploadPhoto = useCallback(async (file: File, fileName: string): Promise<string | null> => {
    const sb = getSupabase();
    if (!sb) return null;
    const { error: upErr } = await sb.storage
      .from('media')
      .upload(fileName, file, { upsert: true });
    if (upErr) return null;
    const { data } = sb.storage.from('media').getPublicUrl(fileName);
    return data.publicUrl;
  }, []);

  const updateBranding = useCallback(async (b: BrandingSettings) => {
    setBranding(b);
    const sb = getSupabase();
    if (!sb) return;
    await sb.from('branding_settings').update({
      logo_url: b.logoUrl,
      primary_color: b.primaryColor,
      secondary_color: b.secondaryColor,
      text_color: b.textColor,
    }).eq('id', 1);
  }, []);

  const resetBranding = useCallback(async () => {
    setBranding(DEFAULT_BRANDING);
    const sb = getSupabase();
    if (!sb) return;
    await sb.from('branding_settings').update({
      logo_url: null,
      primary_color: DEFAULT_BRANDING.primaryColor,
      secondary_color: DEFAULT_BRANDING.secondaryColor,
      text_color: DEFAULT_BRANDING.textColor,
    }).eq('id', 1);
  }, []);

  const verifyPassword = useCallback(
    (name: EvaluatorName, password: string) => storage.verifyPassword(name, password),
    []
  );

  const changePassword = useCallback(
    (name: EvaluatorName, oldPassword: string, newPassword: string) => {
      if (!storage.verifyPassword(name, oldPassword)) return false;
      storage.setPassword(name, newPassword);
      return true;
    },
    []
  );

  const isDefaultPassword = useCallback(
    (name: EvaluatorName) => storage.isDefaultPassword(name),
    []
  );

  return (
    <AppContext.Provider
      value={{
        players,
        items,
        scores,
        events,
        session,
        sessionRole,
        setSession,
        addPlayer,
        deletePlayer,
        updatePlayer,
        syncPlayerEARatings,
        addItem,
        updateItem,
        deleteItem,
        setScore,
        getScore,
        addEvent,
        updateEvent,
        deleteEvent,
        verifyPassword,
        changePassword,
        isDefaultPassword,
        branding,
        updateBranding,
        resetBranding,
        uploadPhoto,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
