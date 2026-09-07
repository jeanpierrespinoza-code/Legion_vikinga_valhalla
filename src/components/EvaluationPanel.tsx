import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import {
  EVALUATORS,
  POSITION_GROUPS,
  POSITION_LABELS,
  type EvaluatorName,
} from '@/lib/types';
import {
  itemAverageForPlayer,
  playerOverallAverage,
  evaluatorScore,
  formatScore,
} from '@/lib/calc';
import { StatusBadge } from '@/components/StatusBadge';

const ALL_POSITIONS = POSITION_GROUPS.flatMap((g) =>
  g.positions.map((p) => ({ ...p, group: g.group }))
);

export function EvaluationPanel() {
  const {
    players,
    items,
    scores,
    session,
    addPlayer,
    deletePlayer,
    updatePlayer,
    setScore,
  } = useApp();

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPositions, setNewPositions] = useState<string[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editPositions, setEditPositions] = useState<string[]>([]);

  const handleAdd = () => {
    if (newName.trim()) {
      addPlayer(newName.trim(), newPositions);
      setNewName('');
      setNewPositions([]);
      setShowAdd(false);
    }
  };

  const sortedItems = [...items].sort((a, b) => a.order - b.order);

  const formatPositions = (positions: string[]) => {
    if (positions.length === 0) return null;
    return positions
      .map((p) => `${p} · ${POSITION_LABELS[p] ?? p}`)
      .join(', ');
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      {/* Section title */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-viking text-2xl font-bold text-amber-400">
            Evaluación de Jugadores
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            Califica del 1 al 10 con la barra deslizante — el promedio de los 3 evaluadores define el estado
          </p>
        </div>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 text-slate-900 font-semibold text-sm hover:from-amber-500 hover:to-amber-600 transition-all shadow-lg shadow-amber-900/20"
        >
          <span className="text-lg leading-none">+</span> Nuevo Jugador
        </button>
      </div>

      {/* Add player form */}
      {showAdd && (
        <div className="mb-6 bg-slate-900/60 border border-amber-900/40 rounded-2xl p-5 animate-scale-in">
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3 mb-3">
            <input
              type="text"
              placeholder="Nombre del jugador"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              className="bg-slate-800/60 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-600 transition-colors"
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={handleAdd}
                className="px-5 py-2.5 rounded-lg bg-amber-600 text-slate-900 font-semibold text-sm hover:bg-amber-500 transition-colors"
              >
                Agregar
              </button>
              <button
                onClick={() => setShowAdd(false)}
                className="px-4 py-2.5 rounded-lg bg-slate-800 text-slate-400 font-medium text-sm hover:bg-slate-700 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
          <PositionSelector
            selected={newPositions}
            onChange={setNewPositions}
          />
        </div>
      )}

      {/* Empty state */}
      {players.length === 0 && !showAdd && (
        <div className="text-center py-20">
          <p className="text-slate-600 text-lg font-viking">
            No hay guerreros en el campo aún
          </p>
          <p className="text-slate-700 text-sm mt-2">
            Agrega tu primer jugador para comenzar la evaluación
          </p>
        </div>
      )}

      {/* Player list */}
      <div className="space-y-4">
        {players.map((player) => {
          const overall = playerOverallAverage(player, sortedItems, scores);
          const isExpanded = expandedId === player.id;
          const isEditing = editingId === player.id;
          const primaryPos = player.positions[0];
          const posInfo = ALL_POSITIONS.find((p) => p.en === primaryPos);

          return (
            <div
              key={player.id}
              className={`bg-slate-900/50 border rounded-2xl overflow-hidden transition-all duration-300 ${
                isExpanded
                  ? 'border-amber-700/50 shadow-lg shadow-amber-900/10'
                  : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              {/* Player header */}
              <div
                className="flex items-center gap-4 p-4 cursor-pointer"
                onClick={() => setExpandedId(isExpanded ? null : player.id)}
              >
                {/* Avatar / position */}
                <div className="relative flex-shrink-0">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 border border-amber-900/30 flex items-center justify-center">
                    {posInfo ? (
                      <span className="font-viking text-xs font-bold text-amber-400">
                        {posInfo.es}
                      </span>
                    ) : (
                      <span className="font-viking text-lg font-bold text-slate-600">
                        ?
                      </span>
                    )}
                  </div>
                  {player.positions.length > 1 && (
                    <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-amber-600 text-slate-900 text-[9px] font-bold flex items-center justify-center border-2 border-slate-900">
                      {player.positions.length}
                    </span>
                  )}
                </div>

                {/* Name + status */}
                <div className="flex-1 min-w-0">
                  {isEditing ? (
                    <div
                      className="space-y-3"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex flex-col sm:flex-row gap-2">
                        <input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-200 text-sm focus:outline-none focus:border-amber-600"
                          autoFocus
                        />
                        <button
                          onClick={() => {
                            updatePlayer(player.id, editName.trim() || player.name, editPositions);
                            setEditingId(null);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-amber-600 text-slate-900 text-xs font-semibold hover:bg-amber-500"
                        >
                          Guardar
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-400 text-xs font-medium hover:bg-slate-700"
                        >
                          Cancelar
                        </button>
                      </div>
                      <PositionSelector
                        selected={editPositions}
                        onChange={setEditPositions}
                      />
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-lg font-semibold text-slate-100">
                          {player.name}
                        </h3>
                        {player.positions.length > 0 && (
                          <span className="text-xs text-slate-500 bg-slate-800/60 px-2 py-0.5 rounded">
                            {formatPositions(player.positions)}
                          </span>
                        )}
                      </div>
                      <div className="mt-2 flex items-center gap-3 flex-wrap">
                        <StatusBadge avg={overall} />
                        {overall !== null && (
                          <span className="text-xs text-slate-500">
                            Promedio general:{' '}
                            <span className="text-amber-400 font-semibold">
                              {formatScore(overall)}
                            </span>
                          </span>
                        )}
                      </div>
                    </>
                  )}
                </div>

                {/* Actions */}
                {!isEditing && (
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingId(player.id);
                        setEditName(player.name);
                        setEditPositions([...player.positions]);
                      }}
                      className="p-2 rounded-lg text-slate-500 hover:text-amber-400 hover:bg-slate-800 transition-colors"
                      title="Editar"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`¿Eliminar a ${player.name}? Se borrarán todas sus notas.`)) {
                          deletePlayer(player.id);
                        }
                      }}
                      className="p-2 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-950/30 transition-colors"
                      title="Eliminar"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    </button>
                    <div
                      className={`p-1.5 text-slate-500 transition-transform duration-200 ${
                        isExpanded ? 'rotate-180' : ''
                      }`}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M6 9l6 6 6-6" />
                      </svg>
                    </div>
                  </div>
                )}
              </div>

              {/* Expanded scoring — slider based */}
              {isExpanded && (
                <div className="border-t border-slate-800 p-4 animate-fade-in">
                  <div className="space-y-5">
                    {sortedItems.length === 0 && (
                      <p className="text-center py-6 text-slate-600 text-sm">
                        No hay ítems de evaluación. Agrega ítems en Administración.
                      </p>
                    )}
                    {sortedItems.map((item) => {
                      const avg = itemAverageForPlayer(player, item, scores);
                      return (
                        <div key={item.id} className="bg-slate-800/30 rounded-xl p-4">
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-sm text-slate-300 font-medium">
                              {item.name}
                            </span>
                            <div className="flex items-center gap-2">
                              <span
                                className={`text-lg font-bold ${
                                  avg === null
                                    ? 'text-slate-600'
                                    : avg < 5
                                    ? 'text-red-400'
                                    : avg < 7
                                    ? 'text-amber-400'
                                    : 'text-emerald-400'
                                }`}
                              >
                                {formatScore(avg)}
                              </span>
                              <span className="text-[10px] text-slate-600 uppercase">promedio</span>
                            </div>
                          </div>

                          {/* Other evaluators' scores */}
                          <div className="flex items-center gap-3 mb-3 flex-wrap">
                            {EVALUATORS.map((ev) => {
                              const val = evaluatorScore(
                                player,
                                item,
                                ev.name as EvaluatorName,
                                scores
                              );
                              const isCurrent = ev.name === session;
                              return (
                                <div
                                  key={ev.name}
                                  className={`flex items-center gap-1.5 text-xs ${
                                    isCurrent ? 'text-amber-400' : 'text-slate-500'
                                  }`}
                                >
                                  <span className="font-medium">{ev.name}:</span>
                                  <span className={isCurrent ? 'font-bold' : ''}>
                                    {formatScore(val)}
                                  </span>
                                  {isCurrent && (
                                    <span className="text-[9px] text-amber-600">(tú)</span>
                                  )}
                                </div>
                              );
                            })}
                          </div>

                          {/* Slider for current evaluator */}
                          {session && (
                            <ScoreSlider
                              value={
                                evaluatorScore(
                                  player,
                                  item,
                                  session,
                                  scores
                                )
                              }
                              onChange={(v) =>
                                setScore(player.id, item.id, session, v)
                              }
                              evaluatorName={session}
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Overall */}
                  {sortedItems.length > 0 && (
                    <div className="mt-4 flex items-center justify-between bg-slate-800/40 border-t-2 border-amber-900/30 px-4 py-3 rounded-xl">
                      <span className="font-viking text-sm font-bold text-amber-400">
                        PROMEDIO GENERAL
                      </span>
                      <span
                        className={`text-2xl font-bold ${
                          overall === null
                            ? 'text-slate-600'
                            : overall < 5
                            ? 'text-red-400'
                            : overall < 7
                            ? 'text-amber-400'
                            : 'text-emerald-400'
                        }`}
                      >
                        {formatScore(overall)}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ScoreSlider({
  value,
  onChange,
  evaluatorName,
}: {
  value: number | null;
  onChange: (v: number) => void;
  evaluatorName: string;
}) {
  const sliderValue = value ?? 5;

  const getColorClass = (v: number) => {
    if (v < 5) return '#ef4444';
    if (v < 7) return '#f59e0b';
    return '#10b981';
  };

  const color = getColorClass(sliderValue);

  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-slate-600 w-16 flex-shrink-0">
        Tu nota ({evaluatorName})
      </span>
      <div className="flex-1 relative">
        <input
          type="range"
          min={1}
          max={10}
          step={1}
          value={sliderValue}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="w-full h-2 rounded-full appearance-none cursor-pointer slider-viking"
          style={{
            background: `linear-gradient(to right, ${color} 0%, ${color} ${((sliderValue - 1) / 9) * 100}%, #334155 ${((sliderValue - 1) / 9) * 100}%, #334155 100%)`,
          }}
        />
        <div className="flex justify-between mt-1 text-[9px] text-slate-600">
          <span>1</span>
          <span>2</span>
          <span>3</span>
          <span>4</span>
          <span>5</span>
          <span>6</span>
          <span>7</span>
          <span>8</span>
          <span>9</span>
          <span>10</span>
        </div>
      </div>
      <div
        className="w-12 text-center flex-shrink-0 py-1.5 rounded-lg font-bold text-sm border"
        style={{
          color: color,
          borderColor: color + '60',
          backgroundColor: color + '15',
        }}
      >
        {value !== null ? value.toFixed(0) : '—'}
      </div>
    </div>
  );
}

function PositionSelector({
  selected,
  onChange,
}: {
  selected: string[];
  onChange: (positions: string[]) => void;
}) {
  const toggle = (pos: string) => {
    if (selected.includes(pos)) {
      onChange(selected.filter((p) => p !== pos));
    } else if (selected.length < 3) {
      onChange([...selected, pos]);
    }
  };

  const uniquePositions = ALL_POSITIONS.filter(
    (p, i, arr) => arr.findIndex((x) => x.en === p.en) === i
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-slate-400 font-medium uppercase tracking-wide">
          Posiciones ({selected.length}/3)
        </span>
        {selected.length > 0 && (
          <button
            onClick={() => onChange([])}
            className="text-xs text-slate-500 hover:text-red-400 transition-colors"
          >
            Limpiar
          </button>
        )}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {POSITION_GROUPS.map((g) => (
          <div key={g.group} className="flex flex-col gap-1">
            <span className="text-[10px] text-slate-600 font-semibold uppercase tracking-wide px-1">
              {g.group}
            </span>
            <div className="flex flex-wrap gap-1.5">
              {uniquePositions
                .filter((p) => p.group === g.group)
                .map((p) => {
                  const isSelected = selected.includes(p.en);
                  const isDisabled = !isSelected && selected.length >= 3;
                  return (
                    <button
                      key={p.en}
                      onClick={() => toggle(p.en)}
                      disabled={isDisabled}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                        isSelected
                          ? 'bg-amber-600/20 text-amber-300 border-amber-600/50'
                          : isDisabled
                          ? 'bg-slate-800/30 text-slate-700 border-slate-800 cursor-not-allowed'
                          : 'bg-slate-800/40 text-slate-400 border-slate-700/40 hover:border-amber-800/40 hover:text-amber-400'
                      }`}
                    >
                      <span className="font-bold">{p.en}</span>
                      <span className="text-slate-500 ml-1">{p.es}</span>
                    </button>
                  );
                })}
            </div>
          </div>
        ))}
      </div>
      {selected.length > 0 && (
        <p className="text-xs text-slate-500 mt-2">
          Principal: <span className="text-amber-400 font-semibold">{selected[0]}</span>
          {selected.length > 1 && (
            <> · Secundarias: {selected.slice(1).join(', ')}</>
          )}
        </p>
      )}
    </div>
  );
}
