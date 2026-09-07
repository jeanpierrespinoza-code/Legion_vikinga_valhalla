import { useState, useRef, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { VikingLogo } from '@/components/VikingLogo';
import { EVALUATORS } from '@/lib/types';
import { useNotifications } from '@/lib/useNotifications';
import { NotificationBell } from '@/components/Notifications';

export type View = 'evaluacion' | 'administracion' | 'formaciones' | 'calendario';

interface HeaderProps {
  view: View;
  setView: (v: View) => void;
}

export function Header({ view, setView }: HeaderProps) {
  const { session, setSession, players, sessionRole, changePassword, isDefaultPassword, branding } = useApp();
  const evaluator = EVALUATORS.find((e) => e.name === session);
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications(session);
  const [showProfile, setShowProfile] = useState(false);
  const [oldPwd, setOldPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [pwdMsg, setPwdMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowProfile(false);
        setPwdMsg(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleChangePassword = () => {
    if (!session) return;
    if (!oldPwd || !newPwd || !confirmPwd) {
      setPwdMsg({ type: 'error', text: 'Completa todos los campos' });
      return;
    }
    if (newPwd !== confirmPwd) {
      setPwdMsg({ type: 'error', text: 'Las contraseñas nuevas no coinciden' });
      return;
    }
    if (newPwd.length < 6) {
      setPwdMsg({ type: 'error', text: 'La nueva contraseña debe tener al menos 6 caracteres' });
      return;
    }
    const success = changePassword(session, oldPwd, newPwd);
    if (success) {
      setPwdMsg({ type: 'success', text: 'Contraseña actualizada correctamente' });
      setOldPwd('');
      setNewPwd('');
      setConfirmPwd('');
    } else {
      setPwdMsg({ type: 'error', text: 'La contraseña actual es incorrecta' });
    }
  };

  const allNavItems: { key: View; label: string; adminOnly?: boolean }[] = [
    { key: 'evaluacion', label: 'Evaluación' },
    { key: 'formaciones', label: 'Formaciones' },
    { key: 'calendario', label: 'Calendario' },
    { key: 'administracion', label: 'Administración', adminOnly: true },
  ];
  const navItems = allNavItems.filter(
    (item) => !item.adminOnly || sessionRole === 'admin'
  );

  return (
    <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-md border-b border-amber-900/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo + name */}
          <div className="flex items-center gap-3">
            <VikingLogo size={36} logoUrl={branding.logoUrl} />
            <div className="hidden sm:block">
              <h1 className="font-viking text-base font-bold text-amber-400 leading-none">
                VALHALLA
              </h1>
              <p className="text-[10px] text-amber-600/70 tracking-widest uppercase">
                Legión Vikinga
              </p>
            </div>
          </div>

          {/* Nav */}
          <nav className="flex items-center gap-1 bg-slate-900/60 rounded-xl p-1 border border-slate-700/40">
            {navItems.map((item) => (
              <button
                key={item.key}
                onClick={() => setView(item.key)}
                className={`px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  view === item.key
                    ? 'bg-amber-600/20 text-amber-300 border border-amber-700/40'
                    : 'text-slate-400 hover:text-amber-400 border border-transparent'
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>

          {/* User + profile + notifications */}
          <div className="flex items-center gap-2 sm:gap-3 relative" ref={dropdownRef}>
            <NotificationBell
              notifications={notifications}
              unreadCount={unreadCount}
              onMarkAsRead={markAsRead}
              onMarkAllAsRead={markAllAsRead}
              currentUserName={session}
            />
            <div className="hidden md:flex items-center gap-2 text-xs text-slate-500">
              <span>{players.length} jugadores</span>
            </div>
            <button
              onClick={() => {
                setShowProfile(!showProfile);
                setPwdMsg(null);
              }}
              className="flex items-center gap-2 bg-slate-900/60 border border-slate-700/40 rounded-lg px-3 py-1.5 hover:border-amber-700/40 transition-colors"
            >
              <div className="w-7 h-7 rounded-full bg-amber-600 text-slate-900 flex items-center justify-center font-viking text-sm font-bold">
                {evaluator?.avatar}
              </div>
              <span className="text-sm font-medium text-slate-200 hidden sm:inline">
                {session}
              </span>
              {session && isDefaultPassword(session) && (
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" title="Contraseña por defecto — cámbiala" />
              )}
              <svg
                className={`text-slate-500 transition-transform ${showProfile ? 'rotate-180' : ''}`}
                width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              >
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>

            {/* Profile dropdown */}
            {showProfile && session && (
              <div className="absolute right-0 top-full mt-2 w-80 bg-slate-900 border border-amber-900/40 rounded-2xl shadow-2xl overflow-hidden animate-scale-in z-50">
                {/* Header */}
                <div className="flex items-center gap-3 p-4 border-b border-slate-800 bg-slate-800/40">
                  <div className="w-10 h-10 rounded-full bg-amber-600 text-slate-900 flex items-center justify-center font-viking text-lg font-bold">
                    {evaluator?.avatar}
                  </div>
                  <div>
                    <p className="text-slate-200 font-semibold text-sm">{session}</p>
                    <p className="text-slate-500 text-xs">
                      {sessionRole === 'admin' ? 'Administrador' : 'Director Técnico'}
                    </p>
                  </div>
                </div>

                {/* Password change */}
                <div className="p-4">
                  <p className="text-xs text-amber-400 font-semibold uppercase tracking-wide mb-3">
                    Cambiar Contraseña
                  </p>
                  {session && isDefaultPassword(session) && (
                    <div className="mb-3 bg-amber-950/40 border border-amber-800/40 rounded-lg p-2.5 text-xs text-amber-300 leading-relaxed">
                      Estás usando la contraseña por defecto. Te recomendamos cambiarla.
                    </div>
                  )}

                  <div className="space-y-2.5">
                    <div className="relative">
                      <input
                        type={showOld ? 'text' : 'password'}
                        value={oldPwd}
                        onChange={(e) => setOldPwd(e.target.value)}
                        placeholder="Contraseña actual"
                        className="w-full bg-slate-800/60 border border-slate-700 rounded-lg px-3 py-2 pr-9 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-600"
                      />
                      <button
                        onClick={() => setShowOld(!showOld)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-amber-400"
                        type="button"
                      >
                        {showOld ? '🙈' : '👁'}
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        type={showNew ? 'text' : 'password'}
                        value={newPwd}
                        onChange={(e) => setNewPwd(e.target.value)}
                        placeholder="Nueva contraseña"
                        className="w-full bg-slate-800/60 border border-slate-700 rounded-lg px-3 py-2 pr-9 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-600"
                      />
                      <button
                        onClick={() => setShowNew(!showNew)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-amber-400"
                        type="button"
                      >
                        {showNew ? '🙈' : '👁'}
                      </button>
                    </div>
                    <input
                      type="password"
                      value={confirmPwd}
                      onChange={(e) => setConfirmPwd(e.target.value)}
                      placeholder="Confirmar nueva contraseña"
                      className="w-full bg-slate-800/60 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-600"
                    />
                  </div>

                  {pwdMsg && (
                    <p
                      className={`text-xs mt-2 animate-fade-in ${
                        pwdMsg.type === 'success' ? 'text-emerald-400' : 'text-red-400'
                      }`}
                    >
                      {pwdMsg.text}
                    </p>
                  )}

                  <button
                    onClick={handleChangePassword}
                    className="w-full mt-3 py-2.5 rounded-lg bg-amber-600 text-slate-900 font-semibold text-sm hover:bg-amber-500 transition-colors"
                  >
                    Actualizar Contraseña
                  </button>
                </div>

                {/* Logout */}
                <div className="border-t border-slate-800 p-3">
                  <button
                    onClick={() => {
                      setSession(null);
                      setShowProfile(false);
                    }}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-red-950/40 border border-red-800/40 text-red-300 font-medium text-sm hover:bg-red-950/60 transition-colors"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                      <polyline points="16 17 21 12 16 7" />
                      <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                    Cerrar Sesión
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
