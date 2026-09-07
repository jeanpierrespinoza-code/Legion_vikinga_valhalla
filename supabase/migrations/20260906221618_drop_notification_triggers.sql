-- Drop trigger-based notifications (will be handled by app for reliable user attribution)
DROP TRIGGER IF EXISTS trg_notify_player_insert ON players;
DROP TRIGGER IF EXISTS trg_notify_player_update ON players;
DROP TRIGGER IF EXISTS trg_notify_player_delete ON players;
DROP TRIGGER IF EXISTS trg_notify_item_insert ON evaluation_items;
DROP TRIGGER IF EXISTS trg_notify_item_update ON evaluation_items;
DROP TRIGGER IF EXISTS trg_notify_item_delete ON evaluation_items;
DROP TRIGGER IF EXISTS trg_notify_event_insert ON club_events;
DROP TRIGGER IF EXISTS trg_notify_event_update ON club_events;
DROP TRIGGER IF EXISTS trg_notify_event_delete ON club_events;

DROP FUNCTION IF EXISTS fn_notify_player_change();
DROP FUNCTION IF EXISTS fn_notify_item_change();
DROP FUNCTION IF EXISTS fn_notify_event_change();
DROP FUNCTION IF EXISTS fn_create_notification(text, text, text, text);
