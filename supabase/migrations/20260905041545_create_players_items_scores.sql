/*
# Valhalla - Players, Evaluation Items, and Scores Tables

1. New Tables
- `players`: Club players with positions and EA rating
  - id (uuid PK), name, positions (text[]), ea_rating (numeric, nullable), created_at
- `evaluation_items`: Evaluation criteria (Responsabilidad, Compromiso, etc.)
  - id (uuid PK), name, "order" (int), created_at
- `scores`: Individual scores given by evaluators to players per item
  - id (uuid PK), player_id (FK), item_id (FK), evaluator (text), value (numeric), created_at

2. Security
- Single-tenant shared app. RLS enabled with anon+authenticated CRUD on all tables.
- Data is intentionally shared across all evaluators.
*/

CREATE TABLE IF NOT EXISTS players (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  positions text[] NOT NULL DEFAULT '{}',
  ea_rating numeric(4,1),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE players ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_players" ON players;
CREATE POLICY "anon_select_players" ON players FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_players" ON players;
CREATE POLICY "anon_insert_players" ON players FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_players" ON players;
CREATE POLICY "anon_update_players" ON players FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_players" ON players;
CREATE POLICY "anon_delete_players" ON players FOR DELETE
  TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS evaluation_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  "order" integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE evaluation_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_items" ON evaluation_items;
CREATE POLICY "anon_select_items" ON evaluation_items FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_items" ON evaluation_items;
CREATE POLICY "anon_insert_items" ON evaluation_items FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_items" ON evaluation_items;
CREATE POLICY "anon_update_items" ON evaluation_items FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_items" ON evaluation_items;
CREATE POLICY "anon_delete_items" ON evaluation_items FOR DELETE
  TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  item_id uuid NOT NULL REFERENCES evaluation_items(id) ON DELETE CASCADE,
  evaluator text NOT NULL,
  value numeric(4,1) NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE (player_id, item_id, evaluator)
);

ALTER TABLE scores ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_scores" ON scores;
CREATE POLICY "anon_select_scores" ON scores FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_scores" ON scores;
CREATE POLICY "anon_insert_scores" ON scores FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_scores" ON scores;
CREATE POLICY "anon_update_scores" ON scores FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_scores" ON scores;
CREATE POLICY "anon_delete_scores" ON scores FOR DELETE
  TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_scores_player ON scores(player_id);
CREATE INDEX IF NOT EXISTS idx_scores_item ON scores(item_id);
