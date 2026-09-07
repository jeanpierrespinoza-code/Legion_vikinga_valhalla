import { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { EVENT_TYPE_LABELS, type ClubEvent, type EventType } from '@/lib/types';
import { Calendar, Plus, Pencil, Trash2, X, ChevronLeft, ChevronRight, Shield, Activity, Users, Trophy, Clock, AlignLeft } from 'lucide-react';

const WEEKDAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

const ICON_MAP: Record<string, typeof Shield> = {
  shield: Shield,
  activity: Activity,
  users: Users,
  trophy: Trophy,
};

function pad(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

function formatDate(d: string): string {
  const parts = d.split('-');
  if (parts.length !== 3) return d;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

interface EventForm {
  title: string;
  date: string;
  time: string;
  type: EventType;
  notes: string;
}

const EMPTY_FORM: EventForm = {
  title: '',
  date: new Date().toISOString().slice(0, 10),
  time: '20:00',
  type: 'partido',
  notes: '',
};

export function CalendarPanel() {
  const { events, session, addEvent, updateEvent, deleteEvent } = useApp();
  const [cursor, setCursor] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<EventForm>(EMPTY_FORM);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'month' | 'list'>('month');

  const eventsByDate = useMemo(() => {
    const map: Record<string, ClubEvent[]> = {};
    for (const ev of events) {
      if (!map[ev.date]) map[ev.date] = [];
      map[ev.date].push(ev);
    }
    for (const key of Object.keys(map)) {
      map[key].sort((a, b) => a.time.localeCompare(b.time));
    }
    return map;
  }, [events]);

  const upcomingEvents = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return [...events]
      .filter((e) => e.date >= today)
      .sort((a, b) => (a.date === b.date ? a.time.localeCompare(b.time) : a.date.localeCompare(b.date)));
  }, [events]);

  const calendarDays = useMemo(() => {
    const firstDay = new Date(cursor.year, cursor.month, 1);
    const lastDay = new Date(cursor.year, cursor.month + 1, 0);
    const startWeekday = (firstDay.getDay() + 6) % 7;
    const totalDays = lastDay.getDate();

    const cells: { day: number | null; dateStr: string | null }[] = [];
    for (let i = 0; i < startWeekday; i++) {
      cells.push({ day: null, dateStr: null });
    }
    for (let d = 1; d <= totalDays; d++) {
      const dateStr = `${cursor.year}-${pad(cursor.month + 1)}-${pad(d)}`;
      cells.push({ day: d, dateStr });
    }
    while (cells.length % 7 !== 0) {
      cells.push({ day: null, dateStr: null });
    }
    return cells;
  }, [cursor]);

  const todayStr = new Date().toISOString().slice(0, 10);

  const prevMonth = () => {
    setCursor((c) => {
      const m = c.month - 1;
      return m < 0 ? { year: c.year - 1, month: 11 } : { year: c.year, month: m };
    });
  };

  const nextMonth = () => {
    setCursor((c) => {
      const m = c.month + 1;
      return m > 11 ? { year: c.year + 1, month: 0 } : { year: c.year, month: m };
    });
  };

  const goToday = () => {
    const now = new Date();
    setCursor({ year: now.getFullYear(), month: now.getMonth() });
  };

  const openNewEvent = (dateStr?: string) => {
    setEditingId(null);
    setForm({
      ...EMPTY_FORM,
      date: dateStr ?? EMPTY_FORM.date,
    });
    setShowForm(true);
  };

  const openEditEvent = (ev: ClubEvent) => {
    setEditingId(ev.id);
    setForm({
      title: ev.title,
      date: ev.date,
      time: ev.time,
      type: ev.type,
      notes: ev.notes,
    });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
  };

  const handleSubmit = () => {
    if (!form.title.trim()) return;
    const payload = {
      title: form.title.trim(),
      date: form.date,
      time: form.time,
      type: form.type,
      notes: form.notes.trim(),
      createdBy: session,
    };
    if (editingId) {
      updateEvent(editingId, payload);
    } else {
      addEvent(payload);
    }
    closeForm();
  };

  const handleDelete = (id: string) => {
    deleteEvent(id);
    if (editingId === id) closeForm();
  };

  const dayEvents = selectedDate ? eventsByDate[selectedDate] ?? [] : [];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <Calendar className="text-amber-400" size={28} />
          <div>
            <h2 className="font-viking text-xl font-bold text-amber-400">Calendario del Club</h2>
            <p className="text-slate-500 text-sm">Próximos eventos, partidos y entrenamientos</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-slate-900/60 rounded-lg p-1 border border-slate-700/40">
            <button
              onClick={() => setViewMode('month')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                viewMode === 'month' ? 'bg-amber-600/20 text-amber-300' : 'text-slate-400 hover:text-amber-400'
              }`}
            >
              Mes
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                viewMode === 'list' ? 'bg-amber-600/20 text-amber-300' : 'text-slate-400 hover:text-amber-400'
              }`}
            >
              Listado
            </button>
          </div>
          <button
            onClick={() => openNewEvent()}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-600 text-slate-900 font-semibold text-sm hover:bg-amber-500 transition-colors shadow-lg shadow-amber-900/20"
          >
            <Plus size={16} />
            Nuevo Evento
          </button>
        </div>
      </div>

      {viewMode === 'month' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-slate-900/40 border border-slate-700/40 rounded-2xl p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={prevMonth}
                className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-amber-400 transition-colors"
              >
                <ChevronLeft size={20} />
              </button>
              <div className="text-center">
                <h3 className="font-viking text-lg font-bold text-amber-300">
                  {MONTHS[cursor.month]} {cursor.year}
                </h3>
                <button
                  onClick={goToday}
                  className="text-xs text-slate-500 hover:text-amber-400 transition-colors mt-0.5"
                >
                  Ir a hoy
                </button>
              </div>
              <button
                onClick={nextMonth}
                className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-amber-400 transition-colors"
              >
                <ChevronRight size={20} />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1 mb-2">
              {WEEKDAYS.map((d) => (
                <div key={d} className="text-center text-xs font-semibold text-slate-500 py-2">
                  {d}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((cell, i) => {
                if (!cell.dateStr) {
                  return <div key={i} className="aspect-square" />;
                }
                const dayEvents = eventsByDate[cell.dateStr] ?? [];
                const isToday = cell.dateStr === todayStr;
                const isSelected = cell.dateStr === selectedDate;
                return (
                  <button
                    key={i}
                    onClick={() => setSelectedDate(cell.dateStr)}
                    className={`aspect-square rounded-lg border p-1 sm:p-1.5 transition-all duration-200 flex flex-col items-center text-center ${
                      isSelected
                        ? 'border-amber-600 bg-amber-950/40'
                        : isToday
                        ? 'border-amber-800/50 bg-amber-950/20'
                        : 'border-slate-800 hover:border-slate-600 bg-slate-900/30'
                    }`}
                  >
                    <span
                      className={`text-xs sm:text-sm font-medium ${
                        isToday ? 'text-amber-400 font-bold' : 'text-slate-300'
                      }`}
                    >
                      {cell.day}
                    </span>
                    {dayEvents.length > 0 && (
                      <div className="flex gap-0.5 mt-auto flex-wrap justify-center">
                        {dayEvents.slice(0, 3).map((ev) => {
                          const cfg = EVENT_TYPE_LABELS[ev.type];
                          return (
                            <span
                              key={ev.id}
                              className={`w-1.5 h-1.5 rounded-full ${
                                ev.type === 'partido' ? 'bg-red-500'
                                  : ev.type === 'entrenamiento' ? 'bg-emerald-500'
                                  : ev.type === 'reunion' ? 'bg-amber-500'
                                  : 'bg-blue-500'
                              }`}
                              title={cfg.label}
                            />
                          );
                        })}
                        {dayEvents.length > 3 && (
                          <span className="text-[8px] text-slate-500">+{dayEvents.length - 3}</span>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="mt-4 flex flex-wrap gap-3 pt-3 border-t border-slate-800">
              {(Object.keys(EVENT_TYPE_LABELS) as EventType[]).map((t) => {
                const cfg = EVENT_TYPE_LABELS[t];
                const Icon = ICON_MAP[cfg.icon] ?? Shield;
                return (
                  <div key={t} className="flex items-center gap-1.5 text-xs text-slate-400">
                    <Icon size={12} className={cfg.color} />
                    {cfg.label}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-slate-900/40 border border-slate-700/40 rounded-2xl p-4 sm:p-6">
            {selectedDate ? (
              <>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-viking text-base font-bold text-amber-300">
                      {formatDate(selectedDate)}
                    </h3>
                    <p className="text-xs text-slate-500">
                      {dayEvents.length} evento{dayEvents.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <button
                    onClick={() => openNewEvent(selectedDate)}
                    className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-amber-400 transition-colors"
                    title="Añadir evento"
                  >
                    <Plus size={18} />
                  </button>
                </div>
                {dayEvents.length === 0 ? (
                  <p className="text-slate-600 text-sm text-center py-8">
                    No hay eventos para este día
                  </p>
                ) : (
                  <div className="space-y-3">
                    {dayEvents.map((ev) => {
                      const cfg = EVENT_TYPE_LABELS[ev.type];
                      const Icon = ICON_MAP[cfg.icon] ?? Shield;
                      return (
                        <div
                          key={ev.id}
                          className={`group rounded-xl border ${cfg.border} ${cfg.bg} p-3 hover:scale-[1.02] transition-transform cursor-pointer`}
                          onClick={() => openEditEvent(ev)}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <Icon size={16} className={`${cfg.color} flex-shrink-0`} />
                              <span className={`text-xs font-semibold ${cfg.color}`}>
                                {cfg.label}
                              </span>
                            </div>
                            <span className="text-xs text-slate-500 flex items-center gap-1 flex-shrink-0">
                              <Clock size={12} />
                              {ev.time}
                            </span>
                          </div>
                          <p className="text-sm font-medium text-slate-200 mt-1.5 truncate">
                            {ev.title}
                          </p>
                          {ev.notes && (
                            <p className="text-xs text-slate-500 mt-1 line-clamp-2">{ev.notes}</p>
                          )}
                          <div className="flex gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={(e) => { e.stopPropagation(); openEditEvent(ev); }}
                              className="text-xs text-slate-400 hover:text-amber-400 flex items-center gap-1"
                            >
                              <Pencil size={12} /> Editar
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleDelete(ev.id); }}
                              className="text-xs text-slate-400 hover:text-red-400 flex items-center gap-1"
                            >
                              <Trash2 size={12} /> Eliminar
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            ) : (
              <>
                <h3 className="font-viking text-base font-bold text-amber-300 mb-4">
                  Próximos Eventos
                </h3>
                {upcomingEvents.length === 0 ? (
                  <p className="text-slate-600 text-sm text-center py-8">
                    No hay eventos próximos. Crea el primero.
                  </p>
                ) : (
                  <div className="space-y-3 max-h-[500px] overflow-y-auto scrollbar-thin">
                    {upcomingEvents.slice(0, 15).map((ev) => {
                      const cfg = EVENT_TYPE_LABELS[ev.type];
                      const Icon = ICON_MAP[cfg.icon] ?? Shield;
                      return (
                        <div
                          key={ev.id}
                          className={`group rounded-xl border ${cfg.border} ${cfg.bg} p-3 cursor-pointer hover:scale-[1.02] transition-transform`}
                          onClick={() => openEditEvent(ev)}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <Icon size={14} className={cfg.color} />
                            <span className={`text-xs font-semibold ${cfg.color}`}>{cfg.label}</span>
                            <span className="text-xs text-slate-500 ml-auto flex items-center gap-1">
                              <Clock size={11} />
                              {ev.time}
                            </span>
                          </div>
                          <p className="text-sm font-medium text-slate-200 truncate">{ev.title}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{formatDate(ev.date)}</p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-slate-900/40 border border-slate-700/40 rounded-2xl p-4 sm:p-6">
          <h3 className="font-viking text-base font-bold text-amber-300 mb-4">
            Todos los Eventos
          </h3>
          {upcomingEvents.length === 0 ? (
            <p className="text-slate-600 text-sm text-center py-12">
              No hay eventos próximos. Haz clic en "Nuevo Evento" para crear uno.
            </p>
          ) : (
            <div className="space-y-3">
              {upcomingEvents.map((ev) => {
                const cfg = EVENT_TYPE_LABELS[ev.type];
                const Icon = ICON_MAP[cfg.icon] ?? Shield;
                return (
                  <div
                    key={ev.id}
                    className={`group flex items-start gap-3 rounded-xl border ${cfg.border} ${cfg.bg} p-4 cursor-pointer hover:scale-[1.01] transition-transform`}
                    onClick={() => openEditEvent(ev)}
                  >
                    <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${cfg.bg} border ${cfg.border}`}>
                      <Icon size={18} className={cfg.color} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-xs font-semibold ${cfg.color}`}>{cfg.label}</span>
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                          <Clock size={11} /> {ev.time}
                        </span>
                        <span className="text-xs text-slate-500">{formatDate(ev.date)}</span>
                      </div>
                      <p className="text-sm font-medium text-slate-200 mt-1">{ev.title}</p>
                      {ev.notes && (
                        <p className="text-xs text-slate-500 mt-1 flex items-start gap-1">
                          <AlignLeft size={12} className="flex-shrink-0 mt-0.5" />
                          {ev.notes}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                      <button
                        onClick={(e) => { e.stopPropagation(); openEditEvent(ev); }}
                        className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-amber-400"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(ev.id); }}
                        className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-red-400"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {showForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
          onClick={closeForm}
        >
          <div
            className="bg-slate-900 border border-amber-900/40 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-5 border-b border-slate-800">
              <h3 className="font-viking text-lg font-bold text-amber-400">
                {editingId ? 'Editar Evento' : 'Nuevo Evento'}
              </h3>
              <button
                onClick={closeForm}
                className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-amber-400 uppercase tracking-wide mb-1.5">
                  Título del Evento
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Ej: Fecha de Liga Oficial vs Rivales FC"
                  className="w-full bg-slate-800/60 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-600 transition-colors"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-amber-400 uppercase tracking-wide mb-1.5">
                    Fecha
                  </label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    className="w-full bg-slate-800/60 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-amber-600 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-amber-400 uppercase tracking-wide mb-1.5">
                    Hora
                  </label>
                  <input
                    type="time"
                    value={form.time}
                    onChange={(e) => setForm({ ...form, time: e.target.value })}
                    className="w-full bg-slate-800/60 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-amber-600 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-amber-400 uppercase tracking-wide mb-1.5">
                  Tipo de Evento
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {(Object.keys(EVENT_TYPE_LABELS) as EventType[]).map((t) => {
                    const cfg = EVENT_TYPE_LABELS[t];
                    const Icon = ICON_MAP[cfg.icon] ?? Shield;
                    return (
                      <button
                        key={t}
                        onClick={() => setForm({ ...form, type: t })}
                        className={`flex flex-col items-center gap-1 py-2.5 rounded-lg border text-xs transition-all ${
                          form.type === t
                            ? `${cfg.border} ${cfg.bg} ${cfg.color} font-semibold`
                            : 'border-slate-700 bg-slate-800/40 text-slate-400 hover:border-slate-600'
                        }`}
                      >
                        <Icon size={16} />
                        {cfg.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-amber-400 uppercase tracking-wide mb-1.5">
                  Notas / Alineación Sugerida
                </label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="Ej: Convocatoria: GK - Carlos; DFC - Diego, Juan; MCO - Jean; DC - Guillermo..."
                  rows={3}
                  className="w-full bg-slate-800/60 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-600 transition-colors resize-none scrollbar-thin"
                />
              </div>
            </div>

            <div className="flex items-center justify-between p-5 border-t border-slate-800 bg-slate-800/30">
              {editingId ? (
                <button
                  onClick={() => handleDelete(editingId)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-red-300 hover:bg-red-950/40 text-sm font-medium transition-colors"
                >
                  <Trash2 size={16} />
                  Eliminar
                </button>
              ) : (
                <div />
              )}
              <div className="flex gap-2">
                <button
                  onClick={closeForm}
                  className="px-4 py-2 rounded-lg text-slate-400 hover:text-slate-200 text-sm font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!form.title.trim()}
                  className="px-5 py-2 rounded-lg bg-amber-600 text-slate-900 font-semibold text-sm hover:bg-amber-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {editingId ? 'Guardar Cambios' : 'Crear Evento'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
