import { useState, useRef } from 'react';
import { useApp } from '@/context/AppContext';
import { getSupabase } from '@/lib/supabaseClient';
import type { Player } from '@/lib/types';
import { RefreshCw, Plus, Trash2, Pencil, X, Users, ListChecks, Download, Check, AlertCircle, Palette, Upload, Camera } from 'lucide-react';
import { BrandingPanel } from '@/components/BrandingPanel';

type Section = 'plantilla' | 'items' | 'sync' | 'branding';

// Datos por defecto del club objetivo
const DEFAULT_CLUB_ID = '5505980';
const DEFAULT_PLATFORM = 'common-gen5';

export function AdminPanel() {
  const {
    players, items, scores,
    addPlayer, deletePlayer, updatePlayer,
    addItem, updateItem, deleteItem,
    syncPlayerEARatings, uploadPhoto,
  } = useApp();

  const [section, setSection] = useState<Section>('plantilla');
  
  // Parámetros de Sincronización
  const [clubId, setClubId] = useState(DEFAULT_CLUB_ID);
  const [platform, setPlatform] = useState(DEFAULT_PLATFORM);

  // Estados para Ítems
  const [newItemName, setNewItemName] = useState('');
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editItemName, setEditItemName] = useState('');

  // Estados para Jugadores
  const [newPlayerName, setNewPlayerName] = useState('');
  const [newPlayerPos, setNewPlayerPos] = useState('');
  const [newPlayerPhoto, setNewPlayerPhoto] = useState<string | null>(null);
  const [newPlayerPhotoFile, setNewPlayerPhotoFile] = useState<File | null>(null);
  const [editingPlayerId, setEditingPlayerId] = useState<string | null>(null);
  const [editPlayerName, setEditPlayerName] = useState('');
  const [editPlayerPos, setEditPlayerPos] = useState('');
  const [editPlayerPhoto, setEditPlayerPhoto] = useState<string | null>(null);
  const [editPlayerPhotoFile, setEditPlayerPhotoFile] = useState<File | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const newPhotoRef = useRef<HTMLInputElement>(null);
  const editPhotoRef = useRef<HTMLInputElement>(null);

  // Estados de Sincronización
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{
    type: 'success' | 'error' | 'info';
    text: string;
    imported?: number;
  } | null>(null);
  const [syncPreview, setSyncPreview] = useState<{ name: string; rating: number | null }[] | null>(null);

  const sortedItems = [...items].sort((a, b) => a.order - b.order);

  // Handlers para Ítems
  const handleAddItem = () => {
    if (newItemName.trim()) {
      addItem(newItemName.trim());
      setNewItemName('');
    }
  };

  const handleSaveEditItem = (id: string) => {
    if (editItemName.trim()) {
      updateItem(id, editItemName.trim());
      setEditingItemId(null);
      setEditItemName('');
    }
  };

  // Handlers para Jugadores
  const handleNewPhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setNewPlayerPhotoFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setNewPlayerPhoto(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleEditPhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setEditPlayerPhotoFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setEditPlayerPhoto(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleAddPlayer = async () => {
    if (newPlayerName.trim()) {
      const positions = newPlayerPos
        .split(',')
        .map((p) => p.trim().toUpperCase())
        .filter(Boolean)
        .slice(0, 3);
      let photoUrl: string | null = null;
      if (newPlayerPhotoFile) {
        setUploadingPhoto(true);
        const ext = newPlayerPhotoFile.name.split('.').pop()?.toLowerCase() ?? 'png';
        const fileName = `players/${Date.now()}-${newPlayerName.trim().replace(/\s/g, '-')}.${ext}`;
        photoUrl = await uploadPhoto(newPlayerPhotoFile, fileName);
        setUploadingPhoto(false);
      }
      addPlayer(newPlayerName.trim(), positions, photoUrl);
      setNewPlayerName('');
      setNewPlayerPos('');
      setNewPlayerPhoto(null);
      setNewPlayerPhotoFile(null);
    }
  };

  const startEditPlayer = (p: Player) => {
    setEditingPlayerId(p.id);
    setEditPlayerName(p.name);
    setEditPlayerPos(p.positions.join(', '));
    setEditPlayerPhoto(p.photoUrl ?? null);
    setEditPlayerPhotoFile(null);
  };

  const handleSaveEditPlayer = async () => {
    if (editingPlayerId && editPlayerName.trim()) {
      const positions = editPlayerPos
        .split(',')
        .map((p) => p.trim().toUpperCase())
        .filter(Boolean)
        .slice(0, 3);
      let photoUrl: string | null | undefined = editPlayerPhoto;
      if (editPlayerPhotoFile) {
        setUploadingPhoto(true);
        const ext = editPlayerPhotoFile.name.split('.').pop()?.toLowerCase() ?? 'png';
        const fileName = `players/${Date.now()}-${editPlayerName.trim().replace(/\s/g, '-')}.${ext}`;
        photoUrl = await uploadPhoto(editPlayerPhotoFile, fileName);
        setUploadingPhoto(false);
      }
      updatePlayer(editingPlayerId, editPlayerName.trim(), positions, photoUrl);
      setEditingPlayerId(null);
      setEditPlayerName('');
      setEditPlayerPos('');
      setEditPlayerPhoto(null);
      setEditPlayerPhotoFile(null);
    }
  };

  // Obtiene endpoint de Supabase Edge Function
  const getEdgeFunctionUrl = (): { url: string; anonKey: string } | null => {
    const sb = getSupabase();
    if (!sb) return null;
    const client = sb as unknown as { supabaseUrl: string; supabaseKey: string };
    return {
      url: `${client.supabaseUrl}/functions/v1/pro-clubs-sync`,
      anonKey: client.supabaseKey,
    };
  };

  // Sincronización sin bloqueos
  const handleSync = async () => {
    setSyncing(true);
    setSyncResult(null);
    setSyncPreview(null);

    try {
      const edgeInfo = getEdgeFunctionUrl();
      let fetchedPlayers: { name: string; rating: number | null }[] = [];

      if (edgeInfo) {
        // Opción A: A través de Edge Function en Supabase (servidor sin restricciones CORS)
        const res = await fetch(
          `${edgeInfo.url}?clubId=${clubId}&platform=${platform}`,
          {
            headers: {
              'Authorization': `Bearer ${edgeInfo.anonKey}`,
              'apikey': edgeInfo.anonKey,
            },
          }
        );

        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        const data = await res.json();
        
        if (data.error) {
          throw new Error(data.error);
        }
        fetchedPlayers = data.players || [];
      } else {
        // Opción B: Consulta directa a la API pública de EA Sports FC (Evita CORS en navegadores que lo permitan)
        const eaUrl = `https://proclubs.ea.com/api/fc/members/career/stats?platform=${platform}&clubId=${clubId}`;
        const res = await fetch(eaUrl, {
          headers: {
            'Accept': 'application/json',
          }
        });
        
        const data = await res.json();
        if (data && data.members) {
          fetchedPlayers = Object.values(data.members).map((m: any) => ({
            name: m.name || m.proName,
            rating: m.ratingAve ? parseFloat(m.ratingAve) : null,
          }));
        }
      }

      if (fetchedPlayers.length === 0) {
        setSyncResult({
          type: 'info',
          text: 'No se encontraron jugadores. Verifica que el ID del club o la plataforma sean correctos.',
        });
        setSyncing(false);
        return;
      }

      setSyncPreview(fetchedPlayers);
      setSyncResult({
        type: 'success',
        text: `Se obtuvieron ${fetchedPlayers.length} jugadores correctamente. Confirma la importación.`,
      });
    } catch (err: any) {
      setSyncResult({
        type: 'error',
        text: err.message || 'Error al conectar con la fuente de datos. Intenta nuevamente.',
      });
    }
    setSyncing(false);
  };

  const confirmImport = () => {
    if (!syncPreview) return;
    const ratings: Record<string, number> = {};
    for (const p of syncPreview) {
      if (p.rating != null) {
        ratings[p.name] = p.rating;
      }
    }
    syncPlayerEARatings(ratings);
    setSyncResult({
      type: 'success',
      text: `Sincronización completada. ${syncPreview.length} jugadores actualizados con sus notas oficiales.`,
      imported: syncPreview.length,
    });
    setSyncPreview(null);
  };

  const sections: { key: Section; label: string; icon: typeof Users }[] = [
    { key: 'plantilla', label: 'Gestión de Plantilla', icon: Users },
    { key: 'items', label: 'Ítems de Evaluación', icon: ListChecks },
    { key: 'sync', label: 'Sincronización Web', icon: RefreshCw },
    { key: 'branding', label: 'Personalización de Marca', icon: Palette },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-6">
        <h2 className="font-viking text-2xl font-bold text-amber-400">
          Panel de Administración
        </h2>
        <p className="text-slate-500 text-sm mt-1">
          Gestiona la plantilla, ítems de evaluación y sincronización con Pro Clubs
        </p>
      </div>

      {/* Navegación por pestañas */}
      <div className="flex gap-1 mb-6 bg-slate-900/60 rounded-xl p-1 border border-slate-700/40 overflow-x-auto scrollbar-thin">
        {sections.map((s) => {
          const Icon = s.icon;
          return (
            <button
              key={s.key}
              onClick={() => setSection(s.key)}
              className={`flex items-center gap-2 px-3 sm:px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                section === s.key
                  ? 'bg-amber-600/20 text-amber-300 border border-amber-700/40'
                  : 'text-slate-400 hover:text-amber-400 border border-transparent'
              }`}
            >
              <Icon size={16} />
              {s.label}
            </button>
          );
        })}
      </div>

      {/* ---- Plantilla ---- */}
      {section === 'plantilla' && (
        <div className="animate-fade-in space-y-4">
          <div className="bg-slate-900/60 border border-amber-900/40 rounded-2xl p-5">
            <h3 className="font-viking text-sm font-bold text-amber-400 mb-4 uppercase tracking-wide">
              Agregar Jugador
            </h3>
            <div className="flex flex-col gap-4">
              {/* Photo upload row */}
              <div className="flex items-center gap-4">
                <div className="relative flex-shrink-0">
                  <div className="w-16 h-16 rounded-full bg-slate-800 border-2 border-amber-900/40 overflow-hidden flex items-center justify-center">
                    {newPlayerPhoto ? (
                      <img src={newPlayerPhoto} alt="Foto" className="w-full h-full object-cover" />
                    ) : (
                      <Camera size={20} className="text-slate-600" />
                    )}
                  </div>
                  <button
                    onClick={() => newPhotoRef.current?.click()}
                    className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-amber-600 text-slate-900 flex items-center justify-center hover:bg-amber-500 transition-colors shadow-lg"
                    type="button"
                  >
                    <Upload size={12} />
                  </button>
                  <input
                    ref={newPhotoRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={handleNewPhotoSelect}
                    className="hidden"
                  />
                </div>
                <p className="text-xs text-slate-500">
                  Sube una foto de perfil del jugador (opcional)
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  placeholder="Nombre del jugador"
                  value={newPlayerName}
                  onChange={(e) => setNewPlayerName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddPlayer()}
                  className="flex-1 bg-slate-800/60 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-600 transition-colors"
                />
                <input
                  type="text"
                  placeholder="Posiciones (ej: GK, CB, CDM)"
                  value={newPlayerPos}
                  onChange={(e) => setNewPlayerPos(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddPlayer()}
                  className="sm:w-64 bg-slate-800/60 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-600 transition-colors"
                />
                <button
                  onClick={handleAddPlayer}
                  disabled={!newPlayerName.trim() || uploadingPhoto}
                  className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-amber-600 to-amber-700 text-slate-900 font-semibold text-sm hover:from-amber-500 hover:to-amber-600 transition-all shadow-lg shadow-amber-900/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <Plus size={16} />
                  {uploadingPhoto ? 'Subiendo...' : 'Agregar'}
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            {players.length === 0 && (
              <div className="text-center py-12 bg-slate-900/30 border border-slate-800 rounded-xl">
                <Users className="mx-auto text-slate-700 mb-2" size={32} />
                <p className="text-slate-600 text-sm">No hay jugadores registrados.</p>
              </div>
            )}
            {players.map((p) => (
              <div
                key={p.id}
                className="flex items-center gap-3 bg-slate-900/50 border border-slate-800 rounded-xl p-3.5 hover:border-slate-700 transition-colors group"
              >
                {editingPlayerId === p.id ? (
                  <>
                    {/* Edit mode: photo upload */}
                    <div className="relative flex-shrink-0">
                      <div className="w-12 h-12 rounded-full bg-slate-800 border-2 border-amber-600 overflow-hidden flex items-center justify-center">
                        {editPlayerPhoto ? (
                          <img src={editPlayerPhoto} alt="Foto" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-amber-500/60 font-bold text-sm">
                            {p.name.split(' ').map((w) => w[0]).slice(0, 2).join('')}
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => editPhotoRef.current?.click()}
                        className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-amber-600 text-slate-900 flex items-center justify-center hover:bg-amber-500 transition-colors shadow-lg"
                        type="button"
                      >
                        <Upload size={10} />
                      </button>
                      <input
                        ref={editPhotoRef}
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        onChange={handleEditPhotoSelect}
                        className="hidden"
                      />
                    </div>
                    <input
                      type="text"
                      value={editPlayerName}
                      onChange={(e) => setEditPlayerName(e.target.value)}
                      className="flex-1 bg-slate-800 border border-amber-600 rounded-lg px-3 py-1.5 text-slate-200 text-sm focus:outline-none"
                      autoFocus
                    />
                    <input
                      type="text"
                      value={editPlayerPos}
                      onChange={(e) => setEditPlayerPos(e.target.value)}
                      placeholder="Posiciones"
                      className="w-40 bg-slate-800 border border-amber-600 rounded-lg px-3 py-1.5 text-slate-200 text-sm focus:outline-none"
                    />
                    <button
                      onClick={handleSaveEditPlayer}
                      disabled={uploadingPhoto}
                      className="px-3 py-1.5 rounded-lg bg-amber-600 text-slate-900 text-xs font-semibold hover:bg-amber-500 transition-colors disabled:opacity-50"
                    >
                      {uploadingPhoto ? '...' : 'Guardar'}
                    </button>
                    <button
                      onClick={() => setEditingPlayerId(null)}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-400 text-xs font-medium hover:bg-slate-700 transition-colors"
                    >
                      Cancelar
                    </button>
                  </>
                ) : (
                  <>
                    {/* Display mode: avatar */}
                    <div className="w-10 h-10 rounded-full bg-slate-800 border border-amber-900/40 overflow-hidden flex items-center justify-center flex-shrink-0">
                      {p.photoUrl ? (
                        <img src={p.photoUrl} alt={p.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-amber-500/60 font-bold text-xs">
                          {p.name.split(' ').map((w) => w[0]).slice(0, 2).join('')}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-slate-200 font-medium text-sm">{p.name}</span>
                      <div className="flex items-center gap-2 mt-0.5">
                        {p.positions.length > 0 ? (
                          <span className="text-xs text-amber-500/80">
                            {p.positions.join(', ')}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-600">Sin posiciones</span>
                        )}
                        {p.eaRating !== null && (
                          <span className="text-xs text-emerald-400 bg-emerald-950/40 px-1.5 py-0.5 rounded font-semibold">
                            EA Avg: {p.eaRating.toFixed(1)}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="text-xs text-slate-600 hidden sm:block">
                      {scores.filter((s) => s.playerId === p.id).length} notas
                    </span>
                    <button
                      onClick={() => startEditPlayer(p)}
                      className="p-2 rounded-lg text-slate-500 hover:text-amber-400 hover:bg-slate-800 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`¿Eliminar a "${p.name}"?`)) deletePlayer(p.id);
                      }}
                      className="p-2 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-950/30 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={15} />
                    </button>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ---- Items ---- */}
      {section === 'items' && (
        <div className="animate-fade-in space-y-4">
          <div className="bg-slate-900/60 border border-amber-900/40 rounded-2xl p-5">
            <h3 className="font-viking text-sm font-bold text-amber-400 mb-4 uppercase tracking-wide">
              Agregar Ítem de Evaluación
            </h3>
            <div className="flex gap-3">
              <input
                type="text"
                placeholder="Nombre del ítem"
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddItem()}
                className="flex-1 bg-slate-800/60 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-600 transition-colors"
              />
              <button
                onClick={handleAddItem}
                disabled={!newItemName.trim()}
                className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-amber-600 to-amber-700 text-slate-900 font-semibold text-sm hover:from-amber-500 hover:to-amber-600 transition-all shadow-lg shadow-amber-900/20 disabled:opacity-50"
              >
                Agregar
              </button>
            </div>
          </div>

          <div className="space-y-2">
            {sortedItems.map((item, idx) => (
              <div
                key={item.id}
                className="flex items-center gap-3 bg-slate-900/50 border border-slate-800 rounded-xl p-3.5 hover:border-slate-700 transition-colors group"
              >
                <div className="w-8 h-8 rounded-lg bg-slate-800 border border-amber-900/20 flex items-center justify-center font-viking text-sm font-bold text-amber-500/70 flex-shrink-0">
                  {idx + 1}
                </div>
                {editingItemId === item.id ? (
                  <>
                    <input
                      value={editItemName}
                      onChange={(e) => setEditItemName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSaveEditItem(item.id)}
                      className="flex-1 bg-slate-800 border border-amber-600 rounded-lg px-3 py-1.5 text-slate-200 text-sm focus:outline-none"
                    />
                    <button
                      onClick={() => handleSaveEditItem(item.id)}
                      className="px-3 py-1.5 rounded-lg bg-amber-600 text-slate-900 text-xs font-semibold"
                    >
                      Guardar
                    </button>
                    <button
                      onClick={() => setEditingItemId(null)}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-400 text-xs font-medium"
                    >
                      Cancelar
                    </button>
                  </>
                ) : (
                  <>
                    <span className="flex-1 text-slate-200 font-medium">{item.name}</span>
                    <button
                      onClick={() => {
                        setEditingItemId(item.id);
                        setEditItemName(item.name);
                      }}
                      className="p-2 rounded-lg text-slate-500 hover:text-amber-400 hover:bg-slate-800 opacity-0 group-hover:opacity-100"
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`¿Eliminar ítem "${item.name}"?`)) deleteItem(item.id);
                      }}
                      className="p-2 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-950/30 opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={15} />
                    </button>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ---- Sync ---- */}
      {section === 'sync' && (
        <div className="animate-fade-in space-y-4">
          <div className="bg-slate-900/60 border border-amber-900/40 rounded-2xl p-6">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 rounded-xl bg-amber-950/40 border border-amber-800/40 flex items-center justify-center flex-shrink-0">
                <RefreshCw className="text-amber-400" size={24} />
              </div>
              <div>
                <h3 className="font-viking text-lg font-bold text-amber-400">
                  Sincronizar con Pro Clubs Tracker / EA
                </h3>
                <p className="text-slate-500 text-sm mt-1">
                  Obtiene el nombre y el valor **Avg Rating** de todos los jugadores del club.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Club ID</label>
                <input
                  type="text"
                  value={clubId}
                  onChange={(e) => setClubId(e.target.value)}
                  className="w-full bg-slate-800/60 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 text-sm focus:outline-none focus:border-amber-600"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Plataforma</label>
                <select
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value)}
                  className="w-full bg-slate-800/60 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 text-sm focus:outline-none focus:border-amber-600"
                >
                  <option value="common-gen5">PS5 / Xbox Series / PC (gen5)</option>
                  <option value="common-gen4">PS4 / Xbox One (gen4)</option>
                  <option value="nx">Nintendo Switch</option>
                </select>
              </div>
            </div>

            <button
              onClick={handleSync}
              disabled={syncing}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 text-slate-900 font-semibold text-sm hover:from-amber-500 hover:to-amber-600 transition-all shadow-lg shadow-amber-900/20 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {syncing ? (
                <>
                  <RefreshCw size={18} className="animate-spin" />
                  Sincronizando...
                </>
              ) : (
                <>
                  <Download size={18} />
                  Sincronizar Ahora
                </>
              )}
            </button>
          </div>

          {/* Sync result */}
          {syncResult && (
            <div
              className={`rounded-2xl p-4 border flex items-start gap-3 ${
                syncResult.type === 'success'
                  ? 'bg-emerald-950/40 border-emerald-800/40'
                  : syncResult.type === 'error'
                  ? 'bg-red-950/40 border-red-800/40'
                  : 'bg-amber-950/40 border-amber-800/40'
              }`}
            >
              {syncResult.type === 'success' ? (
                <Check className="text-emerald-400" size={20} />
              ) : (
                <AlertCircle className={syncResult.type === 'error' ? 'text-red-400' : 'text-amber-400'} size={20} />
              )}
              <div className="flex-1">
                <p className="text-sm font-medium">{syncResult.text}</p>
                {syncPreview && syncPreview.length > 0 && (
                  <button
                    onClick={confirmImport}
                    className="mt-3 px-4 py-2 rounded-lg bg-emerald-600 text-slate-900 font-semibold text-xs hover:bg-emerald-500 flex items-center gap-2"
                  >
                    <Check size={14} />
                    Confirmar e Importar {syncPreview.length} Jugadores
                  </button>
                )}
              </div>
              <button onClick={() => setSyncResult(null)} className="text-slate-500 hover:text-slate-300">
                <X size={18} />
              </button>
            </div>
          )}

          {/* Preview list */}
          {syncPreview && syncPreview.length > 0 && (
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4">
              <h4 className="font-viking text-sm font-bold text-amber-400 mb-3 uppercase tracking-wide">
                Vista Previa — {syncPreview.length} Jugadores
              </h4>
              <div className="space-y-1.5 max-h-80 overflow-y-auto scrollbar-thin">
                {syncPreview.map((p, i) => (
                  <div key={i} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-slate-800/40 border border-slate-700/40">
                    <span className="w-6 text-slate-600 text-xs font-bold text-center">{i + 1}</span>
                    <span className="flex-1 text-sm text-slate-200 font-medium">{p.name}</span>
                    {p.rating !== null ? (
                      <span className="text-sm font-bold text-emerald-400">{p.rating.toFixed(1)}</span>
                    ) : (
                      <span className="text-xs text-slate-600">Sin nota</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ---- Branding ---- */}
      {section === 'branding' && <BrandingPanel />}
    </div>
  );
}