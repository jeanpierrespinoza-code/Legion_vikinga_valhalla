import { useState, useMemo, useRef, useCallback, type DragEvent, type TouchEvent } from 'react';
import { useApp } from '@/context/AppContext';
import { FORMATIONS, POSITION_LABELS, type FormationSlot } from '@/lib/types';
import { playerOverallAverage, formatScore } from '@/lib/calc';
import { RotateCcw, Zap, Trash2, Hand } from 'lucide-react';
import { PlayerAvatar } from '@/components/PlayerAvatar';

interface SlotPos {
  x: number;
  y: number;
}

export function FormationsPanel() {
  const { players, items, scores } = useApp();
  const [formationId, setFormationId] = useState(FORMATIONS[0].id);
  const [assignments, setAssignments] = useState<Record<string, string | null>>({});
  const [slotPositions, setSlotPositions] = useState<Record<string, SlotPos>>({});
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [draggingSlot, setDraggingSlot] = useState<string | null>(null);
  const [draggingPlayerId, setDraggingPlayerId] = useState<string | null>(null);
  const pitchRef = useRef<HTMLDivElement>(null);
  const touchOffset = useRef<{ dx: number; dy: number }>({ dx: 0, dy: 0 });

  const formation = FORMATIONS.find((f) => f.id === formationId)!;

  // Initialize slot positions from formation defaults when formation changes
  const getSlotPos = useCallback(
    (slot: FormationSlot): SlotPos => {
      if (slotPositions[slot.id]) return slotPositions[slot.id];
      return { x: slot.x, y: slot.y };
    },
    [slotPositions]
  );

  const rankedPlayers = useMemo(() => {
    return players
      .map((p) => ({
        ...p,
        avg: playerOverallAverage(p, items, scores),
      }))
      .sort((a, b) => (b.avg ?? -1) - (a.avg ?? -1));
  }, [players, items, scores]);

  const assignedPlayerIds = Object.values(assignments).filter(Boolean) as string[];

  const playerMatchesSlot = (playerPositions: string[], slot: FormationSlot): boolean => {
    return playerPositions.some((pos) => slot.acceptedPositions.includes(pos));
  };

  const playerSlotPriority = (playerPositions: string[], slot: FormationSlot): number => {
    if (playerPositions.length > 0 && slot.acceptedPositions.includes(playerPositions[0])) {
      return 1;
    }
    return 0;
  };

  const suggestionsForSlot = (slot: FormationSlot) => {
    return rankedPlayers.filter(
      (p) =>
        p.positions.length > 0 &&
        playerMatchesSlot(p.positions, slot) &&
        !assignedPlayerIds.includes(p.id)
    );
  };

  const autoFill = () => {
    const newAssignments: Record<string, string | null> = {};
    const usedPlayerIds = new Set<string>();
    const orderedSlots = [...formation.slots].sort((a, b) => b.y - a.y);

    for (const slot of orderedSlots) {
      const candidates = rankedPlayers
        .filter(
          (p) =>
            p.positions.length > 0 &&
            playerMatchesSlot(p.positions, slot) &&
            !usedPlayerIds.has(p.id)
        )
        .sort((a, b) => {
          const pa = playerSlotPriority(a.positions, slot);
          const pb = playerSlotPriority(b.positions, slot);
          if (pa !== pb) return pb - pa;
          return (b.avg ?? -1) - (a.avg ?? -1);
        });

      if (candidates.length > 0) {
        newAssignments[slot.id] = candidates[0].id;
        usedPlayerIds.add(candidates[0].id);
      } else {
        newAssignments[slot.id] = null;
      }
    }
    setAssignments(newAssignments);
  };

  const clearAll = () => {
    setAssignments({});
    setSelectedSlot(null);
  };

  const resetPositions = () => {
    setSlotPositions({});
  };

  const unassignSlot = (slotId: string) => {
    setAssignments((prev) => ({ ...prev, [slotId]: null }));
  };

  const getPlayer = (id: string) => players.find((p) => p.id === id);

  // ---- Drag & Drop ----

  const getPitchPercent = (clientX: number, clientY: number): SlotPos => {
    const rect = pitchRef.current?.getBoundingClientRect();
    if (!rect) return { x: 50, y: 50 };
    const x = ((clientX - rect.left) / rect.width) * 100;
    const y = ((clientY - rect.top) / rect.height) * 100;
    return {
      x: Math.max(5, Math.min(95, x)),
      y: Math.max(5, Math.min(95, y)),
    };
  };

  const handleSlotDragStart = (e: DragEvent, slotId: string) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/slot', slotId);
    setDraggingSlot(slotId);
  };

  const handlePitchDragOver = (e: DragEvent) => {
    if (draggingSlot) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
    }
  };

  const handlePitchDrop = (e: DragEvent) => {
    e.preventDefault();
    const slotId = e.dataTransfer.getData('text/slot');
    if (slotId) {
      const pos = getPitchPercent(e.clientX, e.clientY);
      setSlotPositions((prev) => ({ ...prev, [slotId]: pos }));
    }
    setDraggingSlot(null);
  };

  const handlePlayerDragStart = (e: DragEvent, playerId: string) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/player', playerId);
    setDraggingPlayerId(playerId);
  };

  const handleSlotDrop = (e: DragEvent, slotId: string) => {
    e.preventDefault();
    e.stopPropagation();
    const playerId = e.dataTransfer.getData('text/player');
    if (playerId) {
      setAssignments((prev) => {
        // Remove this player from any other slot
        const next = { ...prev };
        for (const [k, v] of Object.entries(next)) {
          if (v === playerId) next[k] = null;
        }
        next[slotId] = playerId;
        return next;
      });
    }
    setDraggingPlayerId(null);
  };

  // Touch support for mobile
  const handleSlotTouchStart = (e: TouchEvent, slotId: string) => {
    const touch = e.touches[0];
    const pos = getSlotPos(formation.slots.find((s) => s.id === slotId)!);
    const rect = pitchRef.current?.getBoundingClientRect();
    if (rect) {
      const slotPx = {
        x: rect.left + (pos.x / 100) * rect.width,
        y: rect.top + (pos.y / 100) * rect.height,
      };
      touchOffset.current = {
        dx: touch.clientX - slotPx.x,
        dy: touch.clientY - slotPx.y,
      };
    }
    setDraggingSlot(slotId);
  };

  const handleSlotTouchMove = (e: TouchEvent) => {
    if (!draggingSlot) return;
    e.preventDefault();
    const touch = e.touches[0];
    const pos = getPitchPercent(
      touch.clientX - touchOffset.current.dx,
      touch.clientY - touchOffset.current.dy
    );
    setSlotPositions((prev) => ({ ...prev, [draggingSlot]: pos }));
  };

  const handleSlotTouchEnd = () => {
    setDraggingSlot(null);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="font-viking text-2xl font-bold text-amber-400">
            Pizarra Táctica Interactiva
          </h2>
          <p className="text-slate-500 text-sm mt-1 flex items-center gap-1.5">
            <Hand size={14} className="text-amber-500" />
            Arrastra jugadores al campo y mueve las posiciones libremente
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={autoFill}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 text-slate-900 font-semibold text-sm hover:from-amber-500 hover:to-amber-600 transition-all shadow-lg shadow-amber-900/20 flex items-center gap-2"
          >
            <Zap size={16} />
            Auto-sugerir XI
          </button>
          <button
            onClick={resetPositions}
            className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-400 font-medium text-sm hover:bg-slate-700 transition-colors flex items-center gap-2"
          >
            <RotateCcw size={15} />
            <span className="hidden sm:inline">Restaurar pos.</span>
          </button>
          <button
            onClick={clearAll}
            className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-400 font-medium text-sm hover:bg-slate-700 transition-colors flex items-center gap-2"
          >
            <Trash2 size={15} />
            <span className="hidden sm:inline">Limpiar</span>
          </button>
        </div>
      </div>

      {/* Formation dropdown */}
      <div className="mb-6">
        <label className="block text-xs text-slate-400 font-medium mb-2 uppercase tracking-wide">
          Formación (EA Sports FC26)
        </label>
        <div className="relative inline-block w-full sm:w-72">
          <select
            value={formationId}
            onChange={(e) => {
              setFormationId(e.target.value);
              setAssignments({});
              setSlotPositions({});
              setSelectedSlot(null);
            }}
            className="w-full appearance-none bg-slate-900/60 border border-amber-900/40 rounded-xl px-4 py-3 pr-10 text-slate-200 font-viking font-bold text-sm focus:outline-none focus:border-amber-600 cursor-pointer transition-colors"
          >
            {FORMATIONS.map((f) => (
              <option key={f.id} value={f.id} className="bg-slate-900 text-slate-200">
                {f.name}
              </option>
            ))}
          </select>
          <svg
            className="absolute right-3 top-1/2 -translate-y-1/2 text-amber-500 pointer-events-none"
            width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        {/* Pitch */}
        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-4">
          <div
            ref={pitchRef}
            className="relative pitch-bg rounded-xl overflow-hidden select-none"
            style={{ aspectRatio: '10/14', touchAction: 'none' }}
            onDragOver={handlePitchDragOver}
            onDrop={handlePitchDrop}
            onTouchMove={handleSlotTouchMove}
            onTouchEnd={handleSlotTouchEnd}
          >
            {/* Pitch lines */}
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none"
              viewBox="0 0 100 140"
              preserveAspectRatio="none"
            >
              <rect x="2" y="2" width="96" height="136" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="0.5" />
              <line x1="2" y1="70" x2="98" y2="70" stroke="rgba(255,255,255,0.3)" strokeWidth="0.5" />
              <circle cx="50" cy="70" r="12" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="0.5" />
              <rect x="25" y="2" width="50" height="20" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="0.5" />
              <rect x="25" y="118" width="50" height="20" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="0.5" />
              <rect x="40" y="2" width="20" height="8" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="0.5" />
              <rect x="40" y="130" width="20" height="8" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="0.5" />
            </svg>

            {/* Formation slots — draggable */}
            {formation.slots.map((slot) => {
              const pos = getSlotPos(slot);
              const assignedId = assignments[slot.id];
              const player = assignedId ? getPlayer(assignedId) : null;
              const playerAvg = player
                ? playerOverallAverage(player, items, scores)
                : null;
              const isSelected = selectedSlot === slot.id;
              const suggestions = suggestionsForSlot(slot);
              const isDragging = draggingSlot === slot.id;

              return (
                <div
                  key={slot.id}
                  className="absolute -translate-x-1/2 -translate-y-1/2"
                  style={{ left: `${pos.x}%`, top: `${pos.y}%`, zIndex: isDragging ? 20 : 1 }}
                >
                  <button
                    draggable
                    onDragStart={(e) => handleSlotDragStart(e, slot.id)}
                    onDragEnd={() => setDraggingSlot(null)}
                    onDrop={(e) => handleSlotDrop(e, slot.id)}
                    onDragOver={(e) => { e.preventDefault(); }}
                    onTouchStart={(e) => handleSlotTouchStart(e, slot.id)}
                    onClick={() => setSelectedSlot(isSelected ? null : slot.id)}
                    className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex flex-col items-center justify-center transition-all duration-150 cursor-grab active:cursor-grabbing overflow-hidden ${
                      player
                        ? playerAvg !== null && playerAvg < 5
                          ? 'bg-red-900/80 border-2 border-red-600 shadow-lg shadow-red-900/30'
                          : playerAvg !== null && playerAvg < 7
                          ? 'bg-amber-900/80 border-2 border-amber-500 shadow-lg shadow-amber-900/30'
                          : 'bg-emerald-900/80 border-2 border-emerald-500 shadow-lg shadow-emerald-900/30'
                        : 'bg-slate-800/90 border-2 border-dashed border-slate-600 hover:border-amber-500'
                    } ${isSelected ? 'ring-4 ring-amber-400/40 scale-110' : ''} ${
                      isDragging ? 'scale-110 opacity-80' : ''
                    } ${!player && suggestions.length > 0 ? 'animate-pulse-glow' : ''}`}
                  >
                    {player ? (
                      <>
                        {player.photoUrl ? (
                          <img
                            src={player.photoUrl}
                            alt={player.name}
                            className="absolute top-1 left-1/2 -translate-x-1/2 w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover border border-white/30"
                          />
                        ) : (
                          <span
                            className="absolute top-1 left-1/2 -translate-x-1/2 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-slate-950/60 flex items-center justify-center text-[8px] sm:text-[9px] font-bold text-amber-300 border border-white/20"
                          >
                            {player.name.split(' ').map((w) => w[0]).slice(0, 2).join('')}
                          </span>
                        )}
                        <span className="text-[8px] sm:text-[9px] font-bold text-white leading-none max-w-[56px] truncate mt-7 sm:mt-8">
                          {player.name.split(' ')[0]}
                        </span>
                        {playerAvg !== null && (
                          <span className="text-[7px] sm:text-[8px] text-amber-300 font-semibold leading-none">
                            {formatScore(playerAvg)}
                          </span>
                        )}
                      </>
                    ) : (
                      <>
                        <span className="font-viking text-[10px] sm:text-xs font-bold text-slate-400">
                          {slot.label}
                        </span>
                        {suggestions.length > 0 && (
                          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-500 text-slate-900 text-[8px] font-bold flex items-center justify-center">
                            {suggestions.length}
                          </span>
                        )}
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 mt-4 flex-wrap text-xs">
            <span className="flex items-center gap-1.5 text-slate-400">
              <span className="w-3 h-3 rounded-full bg-emerald-700 border border-emerald-500" /> Aprobado
            </span>
            <span className="flex items-center gap-1.5 text-slate-400">
              <span className="w-3 h-3 rounded-full bg-amber-800 border border-amber-500" /> Analizar
            </span>
            <span className="flex items-center gap-1.5 text-slate-400">
              <span className="w-3 h-3 rounded-full bg-red-800 border border-red-600" /> Desaprobado
            </span>
            <span className="flex items-center gap-1.5 text-slate-400">
              <span className="w-3 h-3 rounded-full bg-slate-800 border border-dashed border-slate-600" /> Vacante
            </span>
            <span className="flex items-center gap-1.5 text-slate-500 ml-auto">
              <Hand size={12} /> Arrastrar para mover
            </span>
          </div>
        </div>

        {/* Side panel */}
        <div className="space-y-4">
          {selectedSlot ? (
            <SlotDetail
              slot={formation.slots.find((s) => s.id === selectedSlot)!}
              suggestions={suggestionsForSlot(
                formation.slots.find((s) => s.id === selectedSlot)!
              )}
              assignedPlayer={
                assignments[selectedSlot]
                  ? getPlayer(assignments[selectedSlot]!) ?? null
                  : null
              }
              assignedAvg={
                assignments[selectedSlot]
                  ? playerOverallAverage(getPlayer(assignments[selectedSlot]!)!, items, scores)
                  : null
              }
              allPlayers={rankedPlayers}
              onAssign={(playerId) => {
                setAssignments((prev) => {
                  const next = { ...prev };
                  for (const [k, v] of Object.entries(next)) {
                    if (v === playerId) next[k] = null;
                  }
                  next[selectedSlot] = playerId;
                  return next;
                });
              }}
              onUnassign={() => unassignSlot(selectedSlot)}
            />
          ) : (
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5">
              <h3 className="font-viking text-sm font-bold text-amber-400 mb-2">
                Pizarra Táctica
              </h3>
              <p className="text-slate-500 text-xs leading-relaxed">
                Selecciona una formación. Arrastra jugadores desde el panel derecho
                hacia posiciones del campo. Mueve las posiciones arrastrándolas en el campo.
                Toca una posición para ver sugerencias.
              </p>
              <div className="mt-4 pt-4 border-t border-slate-800">
                <p className="text-slate-400 text-xs font-semibold mb-2">
                  Formación {formation.name}
                </p>
                <div className="grid grid-cols-2 gap-1.5 text-xs">
                  {formation.slots.map((slot) => {
                    const filled = assignments[slot.id];
                    return (
                      <div
                        key={slot.id}
                        className={`px-2 py-1 rounded ${
                          filled
                            ? 'bg-emerald-950/40 text-emerald-300'
                            : 'bg-slate-800/40 text-slate-500'
                        }`}
                      >
                        {slot.label}
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-slate-800">
                <p className="text-slate-500 text-xs">
                  Asignados:{' '}
                  <span className="text-amber-400 font-semibold">
                    {assignedPlayerIds.length}
                  </span>{' '}
                  / {formation.slots.length}
                </p>
              </div>
            </div>
          )}

          {/* Player pool — draggable items */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4">
            <h3 className="font-viking text-xs font-bold text-amber-400 mb-3 uppercase tracking-wide">
              Jugadores Disponibles
            </h3>
            <div className="space-y-1.5 max-h-72 overflow-y-auto scrollbar-thin">
              {rankedPlayers.length === 0 && (
                <p className="text-slate-600 text-xs text-center py-4">
                  No hay jugadores registrados
                </p>
              )}
              {rankedPlayers.map((p) => {
                const isAssigned = assignedPlayerIds.includes(p.id);
                return (
                  <div
                    key={p.id}
                    draggable={!isAssigned}
                    onDragStart={(e) => handlePlayerDragStart(e, p.id)}
                    onDragEnd={() => setDraggingPlayerId(null)}
                    className={`flex items-center gap-2 text-xs py-1.5 px-2 rounded transition-all ${
                      isAssigned
                        ? 'bg-slate-800/20 text-slate-600 opacity-50'
                        : 'bg-slate-800/40 hover:bg-amber-950/30 cursor-grab active:cursor-grabbing hover:border-amber-700/40 border border-transparent'
                    } ${draggingPlayerId === p.id ? 'opacity-60' : ''}`}
                  >
                    <PlayerAvatar name={p.name} photoUrl={p.photoUrl} size="sm" />
                    <span className="flex-1 text-slate-300 truncate font-medium">
                      {p.name}
                    </span>
                    {p.positions.length > 0 && (
                      <span className="text-slate-600 text-[10px]">
                        {p.positions.join(', ')}
                      </span>
                    )}
                    <span
                      className={`font-bold ${
                        p.avg === null
                          ? 'text-slate-600'
                          : p.avg < 5
                          ? 'text-red-400'
                          : p.avg < 7
                          ? 'text-amber-400'
                          : 'text-emerald-400'
                      }`}
                    >
                      {formatScore(p.avg)}
                    </span>
                  </div>
                );
              })}
            </div>
            <p className="text-[10px] text-slate-600 mt-2 text-center">
              Arrastra un jugador hacia una posición del campo
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function SlotDetail({
  slot,
  suggestions,
  assignedPlayer,
  assignedAvg,
  allPlayers,
  onAssign,
  onUnassign,
}: {
  slot: FormationSlot;
  suggestions: { id: string; name: string; positions: string[]; avg: number | null }[];
  assignedPlayer: { name: string; positions: string[] } | null;
  assignedAvg: number | null;
  allPlayers: { id: string; name: string; positions: string[]; avg: number | null }[];
  onAssign: (playerId: string) => void;
  onUnassign: () => void;
}) {
  const [showAll, setShowAll] = useState(false);

  const unassignedPlayers = allPlayers.filter(
    (p) => !suggestions.find((s) => s.id === p.id)
  );

  return (
    <div className="bg-slate-900/50 border border-amber-900/30 rounded-2xl p-5 animate-scale-in">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-viking text-lg font-bold text-amber-400">
            {slot.label}
          </h3>
          <p className="text-slate-500 text-xs mt-0.5">
            Posiciones: {slot.acceptedPositions.map((p) => `${p} (${POSITION_LABELS[p] ?? p})`).join(', ')}
          </p>
        </div>
        {assignedPlayer && (
          <button
            onClick={onUnassign}
            className="text-xs text-red-400 hover:text-red-300 font-medium"
          >
            Quitar
          </button>
        )}
      </div>

      {assignedPlayer && (
        <div className="mb-4 bg-slate-800/40 border border-emerald-800/30 rounded-xl p-3">
          <p className="text-[10px] text-slate-500 uppercase mb-1">Asignado</p>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <PlayerAvatar name={assignedPlayer.name} size="sm" />
              <div>
                <span className="text-slate-200 font-medium text-sm">
                  {assignedPlayer.name}
                </span>
                {assignedPlayer.positions.length > 0 && (
                  <span className="text-xs text-slate-500 ml-2">
                    {assignedPlayer.positions.join(', ')}
                  </span>
                )}
              </div>
            </div>
            <span
              className={`text-sm font-bold ${
                assignedAvg === null
                  ? 'text-slate-600'
                  : assignedAvg < 5
                  ? 'text-red-400'
                  : assignedAvg < 7
                  ? 'text-amber-400'
                  : 'text-emerald-400'
              }`}
            >
              {formatScore(assignedAvg)}
            </span>
          </div>
        </div>
      )}

      <p className="text-[10px] text-slate-500 uppercase mb-2 tracking-wide">
        Sugerencias ({suggestions.length})
      </p>
      {suggestions.length === 0 ? (
        <p className="text-slate-600 text-xs py-3 text-center bg-slate-800/20 rounded-lg">
          No hay jugadores con esta posición. Asigna posiciones en el panel de administración.
        </p>
      ) : (
        <div className="space-y-1.5 max-h-48 overflow-y-auto scrollbar-thin">
          {suggestions.map((p) => {
            const isPrimary = p.positions.length > 0 && slot.acceptedPositions.includes(p.positions[0]);
            return (
              <button
                key={p.id}
                onClick={() => onAssign(p.id)}
                className="w-full flex items-center gap-2 p-2.5 rounded-lg bg-slate-800/40 hover:bg-amber-950/30 border border-slate-700/40 hover:border-amber-700/40 transition-all text-left group"
              >
                <span className="flex-1 text-sm text-slate-200 font-medium">
                  {p.name}
                </span>
                {isPrimary && (
                  <span className="text-[9px] text-emerald-400 bg-emerald-950/40 px-1.5 py-0.5 rounded font-semibold uppercase">
                    Principal
                  </span>
                )}
                {p.positions.length > 0 && (
                  <span className="text-[10px] text-amber-500 bg-amber-950/30 px-1.5 py-0.5 rounded">
                    {p.positions.join(', ')}
                  </span>
                )}
                <span
                  className={`text-sm font-bold ${
                    p.avg === null
                      ? 'text-slate-600'
                      : p.avg < 5
                      ? 'text-red-400'
                      : p.avg < 7
                      ? 'text-amber-400'
                      : 'text-emerald-400'
                  }`}
                >
                  {formatScore(p.avg)}
                </span>
              </button>
            );
          })}
        </div>
      )}

      <button
        onClick={() => setShowAll(!showAll)}
        className="w-full mt-2 text-xs text-slate-500 hover:text-amber-400 transition-colors py-1.5"
      >
        {showAll ? 'Ocultar todos' : 'Ver todos los jugadores'}
      </button>
      {showAll && (
        <div className="space-y-1 mt-2 max-h-32 overflow-y-auto scrollbar-thin">
          {unassignedPlayers.map((p) => (
            <button
              key={p.id}
              onClick={() => onAssign(p.id)}
              className="w-full flex items-center gap-2 p-2 rounded hover:bg-slate-800/40 transition-colors text-left text-xs"
            >
              <span className="flex-1 text-slate-400">{p.name}</span>
              <span className="text-slate-600">{formatScore(p.avg)}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
