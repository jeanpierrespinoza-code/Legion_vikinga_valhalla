import { useState, useEffect, useCallback, useRef } from 'react';
import { getSupabase } from '@/lib/supabaseClient';
import type { EvaluatorName } from '@/lib/types';

export interface Notification {
  id: string;
  created_at: string;
  user_name: string;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
}

interface DbNotification {
  id: string;
  created_at: string;
  user_name: string;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
}

function dbToNotification(row: DbNotification): Notification {
  return {
    id: row.id,
    created_at: row.created_at,
    user_name: row.user_name,
    type: row.type,
    title: row.title,
    message: row.message,
    is_read: row.is_read,
  };
}

export function useNotifications(session: EvaluatorName | null) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [toast, setToast] = useState<Notification | null>(null);
  const sessionRef = useRef(session);
  sessionRef.current = session;

  // Load initial notifications
  useEffect(() => {
    if (!session) return;
    const sb = getSupabase();
    if (!sb) return;

    sb.from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50)
      .then(({ data }) => {
        if (data) {
          const mapped = (data as DbNotification[]).map(dbToNotification);
          setNotifications(mapped);
        }
      });
  }, [session]);

  // Realtime subscription
  useEffect(() => {
    if (!session) return;
    const sb = getSupabase();
    if (!sb) return;

    const channel = sb
      .channel('notifications-changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications' },
        (payload) => {
          const newNotif = dbToNotification(payload.new as DbNotification);
          // Skip own notifications
          setNotifications((prev) => [newNotif, ...prev].slice(0, 50));
          if (newNotif.user_name !== sessionRef.current) {
            setToast(newNotif);
            // Auto-dismiss toast after 5s
            setTimeout(() => setToast(null), 5000);
          }
        }
      )
      .subscribe();

    return () => {
      sb.removeChannel(channel);
    };
  }, [session]);

  // Update unread count
  useEffect(() => {
    setUnreadCount(notifications.filter((n) => !n.is_read).length);
  }, [notifications, session]);

  const markAsRead = useCallback(async (id: string) => {
    const sb = getSupabase();
    if (!sb) return;
    await sb.from('notifications').update({ is_read: true }).eq('id', id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
  }, []);

  const markAllAsRead = useCallback(async () => {
    const sb = getSupabase();
    if (!sb) return;
    const unreadIds = notifications
      .filter((n) => !n.is_read)
      .map((n) => n.id);
    if (unreadIds.length === 0) return;
    await sb.from('notifications').update({ is_read: true }).in('id', unreadIds);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  }, [notifications]);

  const dismissToast = useCallback(() => setToast(null), []);

  return { notifications, unreadCount, toast, markAsRead, markAllAsRead, dismissToast };
}
