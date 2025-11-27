import { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { UIProvider, useUI } from './contexts/UIContext';
import { TrainingProvider } from './contexts/TrainingContext';
import { UIVisibilityProvider } from './contexts/UIVisibilityContext';
import { UILayoutProvider } from './contexts/UILayoutContext';
import { Login } from './components/auth/Login';
import { Register } from './components/auth/Register';
import { PasswordReset } from './components/auth/PasswordReset';
import { Navigation } from './components/layout/Navigation';
import { ErrorBoundary } from './components/layout/ErrorBoundary';
import { Dashboard } from './components/views/Dashboard';
import { Training } from './components/views/Training';
import { Guidelines } from './components/views/Guidelines';
import { Analytics } from './components/views/Analytics';
import { Team } from './components/views/Team';
import { Settings } from './components/views/Settings';
import { Profile } from './components/views/Profile';
import { Files } from './components/views/Files';
import { Users } from './components/views/Users';
import AdminUsers from './components/views/AdminUsers';
import { HallOfFame } from './components/views/HallOfFame';
import { Challenges } from './components/views/Challenges';
import LeaderDashboard from './components/views/LeaderDashboard';
import { ApiKeys } from './components/views/ApiKeys';
import { GuidelineAnalysis } from './components/views/GuidelineAnalysis';
import { isAdminOrHigher, supabase } from './lib/supabase';
import { Logo } from './components/ui/Logo';

type AuthView = 'login' | 'register' | 'reset';
type AppView = 'dashboard' | 'training' | 'guidelines' | 'analytics' | 'team' | 'settings' | 'profile' | 'files' | 'users' | 'adminusers' | 'halloffame' | 'challenges' | 'leaderdashboard' | 'apikeys' | 'guidelineanalysis';
type TrainingView =
  | 'training-suite'
  | 'training-mode-full'
  | 'training-mode-cold-call'
  | 'training-weekly-plan'
  | 'training-customer-avatar'
  | 'training-difficulty'
  | 'training-daily-quote';

function canAccessView(view: TrainingView | AppView, userPlan: 'basic' | 'pro' | 'enterprise'): boolean {
  const accessMatrix: Record<string, Array<'basic' | 'pro' | 'enterprise'>> = {
    'training-suite': ['basic', 'pro', 'enterprise'],
    'training-mode-full': ['basic', 'pro', 'enterprise'],
    'training-mode-cold-call': ['basic', 'pro', 'enterprise'],
    'training-weekly-plan': ['pro', 'enterprise'],
    'training-customer-avatar': ['pro', 'enterprise'],
    'training-difficulty': ['basic', 'pro', 'enterprise'],
    'training-daily-quote': ['basic', 'pro', 'enterprise'],
    'dashboard': ['basic', 'pro', 'enterprise'],
    'training': ['basic', 'pro', 'enterprise'],
    'guidelines': ['basic', 'pro', 'enterprise'],
    'analytics': ['pro', 'enterprise'],
    'team': ['enterprise'],
    'settings': ['basic', 'pro', 'enterprise'],
    'profile': ['basic', 'pro', 'enterprise'],
    'files': ['basic', 'pro', 'enterprise'],
    'users': ['pro', 'enterprise'],
    'adminusers': ['pro', 'enterprise'],
    'halloffame': ['basic', 'pro', 'enterprise'],
    'challenges': ['basic', 'pro', 'enterprise'],
    'leaderdashboard': ['pro', 'enterprise'],
    'apikeys': ['pro', 'enterprise'],
    'guidelineanalysis': ['basic', 'pro', 'enterprise'],
  };

  const allowedPlans = accessMatrix[view];
  if (!allowedPlans) {
    console.warn(`Unknown view: ${view}, defaulting to deny access`);
    return false;
  }

  return allowedPlans.includes(userPlan);
}

function AppContent() {
  const { user, profile, loading } = useAuth();
  const { setIsEditing } = useUI();
  const [authView, setAuthView] = useState<AuthView>('login');
  const [currentView, setCurrentView] = useState<AppView>('dashboard');
  const userPlan: 'basic' | 'pro' | 'enterprise' = 'basic';

  const handleNavigate = (view: string) => {
    if (loading || !profile) {
      console.log('Navigation blocked: profile not loaded yet');
      return;
    }

    if (view === 'adminusers' || view === 'apikeys') {
      if (!isAdminOrHigher(profile)) {
        console.log(`Access denied to ${view}: insufficient role`);
        return;
      }
    } else if (!canAccessView(view as AppView | TrainingView, userPlan)) {
      console.log(`Access denied to view: ${view}`);
      return;
    }

    setCurrentView(view as AppView);
    setIsEditing(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="flex justify-center mb-4 animate-pulse">
            <Logo size="xl" />
          </div>
          <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Sales Sensei lädt...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    if (authView === 'register') {
      return <Register onSwitchToLogin={() => setAuthView('login')} />;
    }
    if (authView === 'reset') {
      return <PasswordReset onBack={() => setAuthView('login')} />;
    }
    return (
      <Login
        onSwitchToRegister={() => setAuthView('register')}
        onSwitchToReset={() => setAuthView('reset')}
      />
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="flex justify-center mb-4">
            <Logo size="xl" />
          </div>
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Kein Profil gefunden</h2>
            <p className="text-gray-600 mb-6">
              Ihr Benutzerkonto existiert, aber es konnte kein zugehöriges Profil geladen werden.
              Dies kann passieren, wenn die Registrierung nicht vollständig abgeschlossen wurde.
            </p>
            <p className="text-sm text-gray-500 mb-6">
              Bitte kontaktieren Sie den Administrator oder versuchen Sie sich erneut anzumelden.
            </p>
            <button
              onClick={() => {
                window.location.reload();
              }}
              className="w-full bg-cyan-600 text-white px-6 py-3 rounded-lg hover:bg-cyan-700 transition-colors mb-3"
            >
              Seite neu laden
            </button>
            <button
              onClick={async () => {
                await supabase.auth.signOut();
                window.location.reload();
              }}
              className="w-full bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Abmelden
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation
        currentView={currentView}
        onNavigate={handleNavigate}
      />

      {currentView === 'dashboard' && (
        <Dashboard onNavigate={handleNavigate} />
      )}
      {currentView === 'training' && <Training onNavigate={handleNavigate} />}
      {currentView === 'guidelines' && <Guidelines />}
      {currentView === 'analytics' && <Analytics />}
      {currentView === 'team' && <Team />}
      {currentView === 'settings' && <Settings />}
      {currentView === 'profile' && <Profile />}
      {currentView === 'files' && <Files />}
      {currentView === 'users' && <Users />}
      {currentView === 'adminusers' && <AdminUsers />}
      {currentView === 'halloffame' && <HallOfFame />}
      {currentView === 'challenges' && <Challenges />}
      {currentView === 'leaderdashboard' && <LeaderDashboard />}
      {currentView === 'apikeys' && <ApiKeys />}
      {currentView === 'guidelineanalysis' && <GuidelineAnalysis />}
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <UIVisibilityProvider>
        <UILayoutProvider>
          <UIProvider>
            <TrainingProvider>
              <ErrorBoundary>
                <AppContent />
              </ErrorBoundary>
            </TrainingProvider>
          </UIProvider>
        </UILayoutProvider>
      </UIVisibilityProvider>
    </AuthProvider>
  );
}

export default App;
