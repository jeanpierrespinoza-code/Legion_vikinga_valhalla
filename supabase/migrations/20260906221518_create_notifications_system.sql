/*
# Valhalla - Notifications System

1. New Tables
- `notifications`: Records changes made by team members
  - id (uuid PK), created_at, user_name (who made the change), type, title, message, is_read

2. RLS
- Single-tenant shared app. All evaluators can see and manage all notifications.
- CRUD for anon + authenticated.

3. Triggers
- After INSERT/UPDATE/DELETE on players, evaluation_items, club_events
- Creates a notification row describing the change
*/

CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  user_name text NOT NULL,
  type text NOT NULL DEFAULT 'info',
  title text NOT NULL,
  message text NOT NULL,
  is_read boolean NOT NULL DEFAULT false
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_notifications" ON notifications;
CREATE POLICY "anon_select_notifications" ON notifications FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_notifications" ON notifications;
CREATE POLICY "anon_insert_notifications" ON notifications FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_notifications" ON notifications;
CREATE POLICY "anon_update_notifications" ON notifications FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_notifications" ON notifications;
CREATE POLICY "anon_delete_notifications" ON notifications FOR DELETE
  TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);

-- Helper function: insert notification (callable from triggers)
CREATE OR REPLACE FUNCTION fn_create_notification(
  p_user_name text,
  p_type text,
  p_title text,
  p_message text
) RETURNS void AS $$
BEGIN
  INSERT INTO notifications (user_name, type, title, message)
  VALUES (p_user_name, p_type, p_title, p_message);
END;
$$ LANGUAGE plpgsql;

-- ---- Players triggers ----

CREATE OR REPLACE FUNCTION fn_notify_player_change() RETURNS trigger AS $$
DECLARE
  v_user_name text;
  v_action text;
  v_title text;
  v_message text;
BEGIN
  -- Determine actor from session variable (set by app before mutations)
  v_user_name := COALESCE(current_setting('app.user_name', true), 'Sistema');

  IF TG_OP = 'INSERT' THEN
    v_action := 'player_added';
    v_title := 'Jugador agregado';
    v_message := COALESCE(NEW.name, 'Nuevo jugador') || ' fue añadido a la plantilla';
  ELSIF TG_OP = 'UPDATE' THEN
    v_action := 'player_updated';
    v_title := 'Jugador actualizado';
    v_message := COALESCE(NEW.name, 'Jugador') || ' fue modificado';
  ELSIF TG_OP = 'DELETE' THEN
    v_action := 'player_deleted';
    v_title := 'Jugador eliminado';
    v_message := COALESCE(OLD.name, 'Jugador') || ' fue eliminado de la plantilla';
  END IF;

  PERFORM fn_create_notification(v_user_name, v_action, v_title, v_message);
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_notify_player_insert ON players;
DROP TRIGGER IF EXISTS trg_notify_player_update ON players;
DROP TRIGGER IF EXISTS trg_notify_player_delete ON players;

CREATE TRIGGER trg_notify_player_insert AFTER INSERT ON players
  FOR EACH ROW EXECUTE FUNCTION fn_notify_player_change();
CREATE TRIGGER trg_notify_player_update AFTER UPDATE ON players
  FOR EACH ROW EXECUTE FUNCTION fn_notify_player_change();
CREATE TRIGGER trg_notify_player_delete AFTER DELETE ON players
  FOR EACH ROW EXECUTE FUNCTION fn_notify_player_change();

-- ---- Evaluation items triggers ----

CREATE OR REPLACE FUNCTION fn_notify_item_change() RETURNS trigger AS $$
DECLARE
  v_user_name text;
  v_action text;
  v_title text;
  v_message text;
BEGIN
  v_user_name := COALESCE(current_setting('app.user_name', true), 'Sistema');

  IF TG_OP = 'INSERT' THEN
    v_action := 'item_added';
    v_title := 'Ítem de evaluación creado';
    v_message := COALESCE(NEW.name, 'Nuevo ítem') || ' fue añadido a los criterios';
  ELSIF TG_OP = 'UPDATE' THEN
    v_action := 'item_updated';
    v_title := 'Ítem actualizado';
    v_message := COALESCE(NEW.name, 'Ítem') || ' fue modificado';
  ELSIF TG_OP = 'DELETE' THEN
    v_action := 'item_deleted';
    v_title := 'Ítem eliminado';
    v_message := COALESCE(OLD.name, 'Ítem') || ' fue eliminado de los criterios';
  END IF;

  PERFORM fn_create_notification(v_user_name, v_action, v_title, v_message);
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_notify_item_insert ON evaluation_items;
DROP TRIGGER IF EXISTS trg_notify_item_update ON evaluation_items;
DROP TRIGGER IF EXISTS trg_notify_item_delete ON evaluation_items;

CREATE TRIGGER trg_notify_item_insert AFTER INSERT ON evaluation_items
  FOR EACH ROW EXECUTE FUNCTION fn_notify_item_change();
CREATE TRIGGER trg_notify_item_update AFTER UPDATE ON evaluation_items
  FOR EACH ROW EXECUTE FUNCTION fn_notify_item_change();
CREATE TRIGGER trg_notify_item_delete AFTER DELETE ON evaluation_items
  FOR EACH ROW EXECUTE FUNCTION fn_notify_item_change();

-- ---- Club events triggers ----

CREATE OR REPLACE FUNCTION fn_notify_event_change() RETURNS trigger AS $$
DECLARE
  v_user_name text;
  v_action text;
  v_title text;
  v_message text;
BEGIN
  v_user_name := COALESCE(current_setting('app.user_name', true), 'Sistema');

  IF TG_OP = 'INSERT' THEN
    v_action := 'event_added';
    v_title := 'Evento creado';
    v_message := COALESCE(NEW.title, 'Nuevo evento') || ' fue añadido al calendario';
  ELSIF TG_OP = 'UPDATE' THEN
    v_action := 'event_updated';
    v_title := 'Evento actualizado';
    v_message := COALESCE(NEW.title, 'Evento') || ' fue modificado';
  ELSIF TG_OP = 'DELETE' THEN
    v_action := 'event_deleted';
    v_title := 'Evento eliminado';
    v_message := COALESCE(OLD.title, 'Evento') || ' fue eliminado del calendario';
  END IF;

  PERFORM fn_create_notification(v_user_name, v_action, v_title, v_message);
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_notify_event_insert ON club_events;
DROP TRIGGER IF EXISTS trg_notify_event_update ON club_events;
DROP TRIGGER IF EXISTS trg_notify_event_delete ON club_events;

CREATE TRIGGER trg_notify_event_insert AFTER INSERT ON club_events
  FOR EACH ROW EXECUTE FUNCTION fn_notify_event_change();
CREATE TRIGGER trg_notify_event_update AFTER UPDATE ON club_events
  FOR EACH ROW EXECUTE FUNCTION fn_notify_event_change();
CREATE TRIGGER trg_notify_event_delete AFTER DELETE ON club_events
  FOR EACH ROW EXECUTE FUNCTION fn_notify_event_change();
