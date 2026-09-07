import { useState } from 'react';
import { EVALUATORS, type EvaluatorName } from '@/lib/types';
import { useApp } from '@/context/AppContext';
import { VikingLogo } from '@/components/VikingLogo';

export function LoginScreen() {
  const { setSession, verifyPassword } = useApp();
  const [selected, setSelected] = useState<EvaluatorName | null>(null);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = () => {
    if (!selected) return;
    if (!password) {
      setError('Ingresa tu contraseña');
      return;
    }
    if (verifyPassword(selected, password)) {
      setError('');
      setSession(selected);
    } else {
      setError('Contraseña incorrecta');
    }
  };

  return (
    <div className="min-h-screen bg-viking-gradient flex items-center justify-center p-6">
      <div className="w-full max-w-md animate-fade-in">
        {/* Logo + Title */}
        <div className="flex flex-col items-center mb-10">
          <div className="relative mb-4">
            <div className="absolute inset-0 blur-2xl bg-amber-500/20 rounded-full" />
            <VikingLogo size={96} className="relative drop-shadow-2xl" />
          </div>
          <h1 className="font-viking text-3xl font-extrabold text-amber-400 text-glow-gold text-center leading-tight">
            VALHALLA
          </h1>
          <p className="font-viking text-sm font-semibold text-amber-600/80 tracking-[0.3em] uppercase mt-1">
            Legión Vikinga
          </p>
          <div className="h-px w-32 bg-gradient-to-r from-transparent via-amber-600/60 to-transparent mt-4" />
          <p className="text-slate-400 text-xs mt-4 tracking-wide uppercase">
            Sistema de Evaluación de Jugadores
          </p>
        </div>

        {/* Login form */}
        <div className="bg-slate-900/60 backdrop-blur-sm border border-amber-900/40 rounded-2xl p-6 shadow-2xl">
          <p className="text-slate-300 text-sm font-medium mb-4 text-center">
            Selecciona tu evaluador
          </p>
          <div className="space-y-3">
            {EVALUATORS.map((ev) => (
              <button
                key={ev.name}
                onClick={() => {
                  setSelected(ev.name);
                  setError('');
                  setPassword('');
                }}
                className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all duration-200 ${
                  selected === ev.name
                    ? 'border-amber-500 bg-amber-950/40 shadow-lg shadow-amber-900/20'
                    : 'border-slate-700/60 bg-slate-800/40 hover:border-amber-700/50 hover:bg-slate-800/70'
                }`}
              >
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center font-viking text-xl font-bold transition-colors ${
                    selected === ev.name
                      ? 'bg-amber-600 text-slate-900'
                      : 'bg-slate-700 text-amber-400'
                  }`}
                >
                  {ev.avatar}
                </div>
                <span
                  className={`text-lg font-semibold ${
                    selected === ev.name ? 'text-amber-200' : 'text-slate-200'
                  }`}
                >
                  {ev.name}
                </span>
                {selected === ev.name && (
                  <span className="ml-auto text-amber-400 text-sm">✓</span>
                )}
              </button>
            ))}
          </div>

          {/* Password field */}
          {selected && (
            <div className="mt-5 animate-fade-in">
              <label className="block text-xs text-slate-400 font-medium mb-2 uppercase tracking-wide">
                Contraseña
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError('');
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                  className="w-full bg-slate-800/60 border border-slate-700 rounded-lg px-4 py-3 pr-11 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-600 transition-colors"
                  placeholder="Ingresa tu contraseña"
                  autoFocus
                />
                <button
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-amber-400 transition-colors"
                  type="button"
                >
                  {showPassword ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
              {error && (
                <p className="text-red-400 text-xs mt-2 animate-fade-in">{error}</p>
              )}
            </div>
          )}

          <button
            disabled={!selected || !password}
            onClick={handleLogin}
            className={`w-full mt-6 py-3.5 rounded-xl font-viking text-base font-bold tracking-wide transition-all duration-200 ${
              selected && password
                ? 'bg-gradient-to-r from-amber-600 to-amber-700 text-slate-900 hover:from-amber-500 hover:to-amber-600 shadow-lg shadow-amber-900/30 hover:scale-[1.02]'
                : 'bg-slate-800 text-slate-600 cursor-not-allowed'
            }`}
          >
            ENTRAR AL CAMPO DE BATALLA
          </button>
        </div>

        <p className="text-center text-slate-600 text-xs mt-6">
          Las notas de los 3 evaluadores se promedian automáticamente
        </p>
      </div>
    </div>
  );
}
