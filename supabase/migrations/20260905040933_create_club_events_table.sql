/*
# Valhalla - Calendar Events Table

1. New Tables
- `club_events`: Club calendar events (matches, trainings, meetings, tournaments)
  - id (uuid PK)
  - title (text, not null)
  - event_date (date, not null)
  - event_time (text, not null) — HH:MM format
  - type (text, not null) — 'partido' | 'entrenamiento' | 'reunion' | 'torneo'
  - notes (text, nullable) — notes or suggested lineup
  - created_by (text, nullable) — evaluator name
  - created_at (timestamptz)

2. Security
- Single-tenant shared app (no Supabase auth). RLS enabled with anon+authenticated CRUD.
- Data is intentionally shared across all evaluators.
*/

CREATE TABLE IF NOT EXISTS club_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  event_date date NOT NULL,
  event_time text NOT NULL,
  type text NOT NULL DEFAULT 'partido',
  notes text,
  created_by text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE club_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_events" ON club_events;
CREATE POLICY "anon_select_events" ON club_events FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_events" ON club_events;
CREATE POLICY "anon_insert_events" ON club_events FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_events" ON club_events;
CREATE POLICY "anon_update_events" ON club_events FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_events" ON club_events;
CREATE POLICY "anon_delete_events" ON club_events FOR DELETE
  TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_club_events_date ON club_events(event_date);
