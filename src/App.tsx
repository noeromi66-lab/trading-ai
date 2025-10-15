import { useState } from 'react';
import { LogOut, LayoutDashboard, Clock, Settings as SettingsIcon } from 'lucide-react';
import { AuthProvider, useAuth } from './lib/auth/AuthContext';
import Landing from './components/Landing';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import History from './components/History';
import Settings from './components/Settings';

type View = 'dashboard' | 'history' | 'settings';

function AppContent() {
  const { user, loading, signOut } = useAuth();
  const [view, setView] = useState<View>('dashboard');
  const [showAuth, setShowAuth] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex flex-col items-center justify-center gap-6">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-slate-700 border-t-amber-400"></div>
          <div className="absolute inset-0 animate-ping rounded-full h-16 w-16 border-4 border-amber-400 opacity-20"></div>
        </div>
        <div className="text-center">
          <p className="text-amber-400 font-medium text-lg mb-2">Loading Trading AI</p>
          <p className="text-slate-500 text-sm">Initializing modular strategy engine...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    if (!showAuth) {
      return <Landing onGetStarted={() => setShowAuth(true)} />;
    }
    return <Auth />;
  }

  return (
    <div className="relative min-h-screen">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-950/90 backdrop-blur-sm border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-3 py-2 sm:px-4 sm:py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-4 md:gap-6 overflow-x-auto scrollbar-hide">
              <button
                onClick={() => setView('dashboard')}
                className={`flex items-center gap-1 sm:gap-2 px-2 py-1.5 sm:px-3 sm:py-2 md:px-4 md:py-2 rounded-lg font-medium transition-all whitespace-nowrap text-xs sm:text-sm ${
                  view === 'dashboard'
                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <LayoutDashboard className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden xs:inline sm:inline">Dashboard</span>
                <span className="xs:hidden">Dash</span>
              </button>
              <button
                onClick={() => setView('history')}
                className={`flex items-center gap-1 sm:gap-2 px-2 py-1.5 sm:px-3 sm:py-2 md:px-4 md:py-2 rounded-lg font-medium transition-all whitespace-nowrap text-xs sm:text-sm ${
                  view === 'history'
                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden xs:inline sm:inline">History</span>
                <span className="xs:hidden">Hist</span>
              </button>
              <button
                onClick={() => setView('settings')}
                className={`flex items-center gap-1 sm:gap-2 px-2 py-1.5 sm:px-3 sm:py-2 md:px-4 md:py-2 rounded-lg font-medium transition-all whitespace-nowrap text-xs sm:text-sm ${
                  view === 'settings'
                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <SettingsIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden xs:inline sm:inline">Settings</span>
                <span className="xs:hidden">Set</span>
              </button>
            </div>
            <button
              onClick={signOut}
              className="flex items-center gap-1 sm:gap-2 px-2 py-1.5 sm:px-3 sm:py-2 text-slate-400 hover:text-white transition-colors text-xs sm:text-sm ml-2"
            >
              <LogOut className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </nav>
      <div className="pt-12 sm:pt-16">
        {view === 'dashboard' && <Dashboard />}
        {view === 'history' && <History />}
        {view === 'settings' && <Settings />}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
