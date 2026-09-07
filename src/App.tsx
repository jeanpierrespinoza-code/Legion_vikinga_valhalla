import { useState } from 'react';
import { AppProvider, useApp } from '@/context/AppContext';
import { LoginScreen } from '@/components/LoginScreen';
import { Header, type View } from '@/components/Header';
import { EvaluationPanel } from '@/components/EvaluationPanel';
import { AdminPanel } from '@/components/AdminPanel';
import { FormationsPanel } from '@/components/FormationsPanel';
import { CalendarPanel } from '@/components/CalendarPanel';
import { NotificationToast } from '@/components/Notifications';
import { useNotifications } from '@/lib/useNotifications';
import { VikingLogo } from '@/components/VikingLogo';

function AppContent() {
  const { session, sessionRole, branding } = useApp();
  const [view, setView] = useState<View>('evaluacion');
  const { toast, dismissToast } = useNotifications(session);

  if (!session) return <LoginScreen />;

  const effectiveView = view === 'administracion' && sessionRole !== 'admin' ? 'evaluacion' : view;

  return (
    <div className="min-h-screen bg-viking-gradient">
      <Header view={effectiveView} setView={setView} />
      <main className="animate-fade-in" key={effectiveView}>
        {effectiveView === 'evaluacion' && <EvaluationPanel />}
        {effectiveView === 'formaciones' && <FormationsPanel />}
        {effectiveView === 'calendario' && <CalendarPanel />}
        {effectiveView === 'administracion' && sessionRole === 'admin' && <AdminPanel />}
      </main>
      <footer className="border-t border-amber-900/20 mt-12 py-6">
        <div className="flex flex-col items-center gap-2">
          <VikingLogo size={28} logoUrl={branding.logoUrl} />
          <p className="text-center text-slate-700 text-xs font-viking tracking-widest">
            VALHALLA LEGIÓN VIKINGA · Odin Allfather
          </p>
        </div>
      </footer>
      {toast && <NotificationToast notification={toast} onDismiss={dismissToast} />}
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
