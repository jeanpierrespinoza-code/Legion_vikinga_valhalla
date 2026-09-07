import { useState, useRef, useEffect } from 'react';
import { Bell, Check, X, UserPlus, UserCog, UserMinus, ListPlus, Pencil, Trash2, CalendarPlus, CalendarCog, CalendarMinus } from 'lucide-react';
import type { Notification } from '@/lib/useNotifications';

const TYPE_ICONS: Record<string, typeof Bell> = {
  player_added: UserPlus,
  player_updated: UserCog,
  player_deleted: UserMinus,
  item_added: ListPlus,
  item_updated: Pencil,
  item_deleted: Trash2,
  event_added: CalendarPlus,
  event_updated: CalendarCog,
  event_deleted: CalendarMinus,
};

function timeAgo(iso: string): string {
  const now = Date.now();
  const then = new Date(iso).getTime();
  const diff = Math.floor((now - then) / 1000);
  if (diff < 60) return 'hace un momento';
  if (diff < 3600) return `hace ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `hace ${Math.floor(diff / 3600)} h`;
  return `hace ${Math.floor(diff / 86400)} d`;
}

interface NotificationBellProps {
  notifications: Notification[];
  unreadCount: number;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  currentUserName: string | null;
}

export function NotificationBell({
  notifications,
  unreadCount,
  onMarkAsRead,
  onMarkAllAsRead,
  currentUserName,
}: NotificationBellProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-lg bg-slate-900/60 border border-slate-700/40 hover:border-amber-700/40 transition-colors"
        title="Notificaciones"
      >
        <Bell size={20} className="text-slate-400 hover:text-amber-400 transition-colors" />
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 px-1.5 rounded-full bg-red-600 text-white text-[11px] font-bold flex items-center justify-center animate-scale-in shadow-lg shadow-red-900/40 ring-2 ring-slate-950">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-slate-900 border border-amber-900/40 rounded-2xl shadow-2xl overflow-hidden animate-scale-in z-50">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-800/40">
            <h3 className="font-viking text-sm font-bold text-amber-400 flex items-center gap-2">
              <Bell size={16} />
              Notificaciones
            </h3>
            {unreadCount > 0 && (
              <button
                onClick={onMarkAllAsRead}
                className="text-xs text-amber-400 hover:text-amber-300 font-medium flex items-center gap-1 transition-colors"
              >
                <Check size={12} />
                Marcar todas leídas
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-96 overflow-y-auto scrollbar-thin">
            {notifications.length === 0 ? (
              <div className="py-12 text-center">
                <Bell size={32} className="mx-auto text-slate-700 mb-2" />
                <p className="text-slate-600 text-sm">No hay notificaciones</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-800/60">
                {notifications.map((n) => {
                  const Icon = TYPE_ICONS[n.type] ?? Bell;
                  const isOwn = n.user_name === currentUserName;
                  return (
                    <button
                      key={n.id}
                      onClick={() => {
                        if (!n.is_read) onMarkAsRead(n.id);
                      }}
                      className={`w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-slate-800/40 transition-colors ${
                        !n.is_read ? 'bg-amber-950/20' : ''
                      }`}
                    >
                      <div
                        className={`flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center ${
                          n.type.includes('deleted')
                            ? 'bg-red-950/40 border border-red-800/40'
                            : n.type.includes('added') || n.type.includes('created')
                            ? 'bg-emerald-950/40 border border-emerald-800/40'
                            : 'bg-amber-950/40 border border-amber-800/40'
                        }`}
                      >
                        <Icon size={16} className={
                          n.type.includes('deleted') ? 'text-red-400'
                          : n.type.includes('added') || n.type.includes('created') ? 'text-emerald-400'
                          : 'text-amber-400'
                        } />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-slate-200 truncate">{n.title}</p>
                          {!n.is_read && (
                            <span className="w-2 h-2 rounded-full bg-amber-500 flex-shrink-0" />
                          )}
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">{n.message}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] text-slate-600">{timeAgo(n.created_at)}</span>
                          <span className="text-[10px] text-amber-600/70">·</span>
                          <span className={`text-[10px] ${isOwn ? 'text-slate-600' : 'text-amber-500/70'}`}>
                            {isOwn ? 'Tú' : n.user_name}
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

interface NotificationToastProps {
  notification: Notification;
  onDismiss: () => void;
}

export function NotificationToast({ notification, onDismiss }: NotificationToastProps) {
  const Icon = TYPE_ICONS[notification.type] ?? Bell;

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm animate-scale-in">
      <div className="bg-slate-900 border border-amber-700/40 rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-start gap-3 p-4">
          <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-amber-950/40 border border-amber-800/40 flex items-center justify-center">
            <Icon size={18} className="text-amber-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-amber-300">{notification.title}</p>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">{notification.message}</p>
            <p className="text-[10px] text-amber-500/70 mt-1">
              {notification.user_name} · {timeAgo(notification.created_at)}
            </p>
          </div>
          <button
            onClick={onDismiss}
            className="flex-shrink-0 text-slate-500 hover:text-slate-300 transition-colors"
          >
            <X size={16} />
          </button>
        </div>
        <div className="h-1 bg-amber-600/30 animate-pulse" />
      </div>
    </div>
  );
}
