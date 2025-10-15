import { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Save, Bell, Lock, Unlock } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth/AuthContext';
import NotificationSettings from './NotificationSettings';
import SecretStrategy from './SecretStrategy';

export default function Settings() {
  const { user } = useAuth();
  const [settings, setSettings] = useState({
    preferredPairs: ['EURUSD', 'GBPUSD', 'XAUUSD'],
    minConfidenceThreshold: 60,
    minGradeThreshold: 'B',
    notifyInApp: true,
    notifyEmail: false,
    notifySms: false,
    autoScanEnabled: false,
    scanIntervalMinutes: 15,
    secretStrategyUnlocked: false,
    secretStrategyActivated: false
  });
  const [activeTab, setActiveTab] = useState<'general' | 'notifications' | 'strategy'>('general');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const pairs = ['EURUSD', 'GBPUSD', 'XAUUSD', 'USDJPY', 'GBPJPY'];
  const grades = ['C', 'B', 'B+', 'A', 'A+'];

  useEffect(() => {
    loadSettings();
  }, [user]);

  async function loadSettings() {
    if (!user) return;

    setLoading(true);
    const { data } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (data) {
      setSettings({
        preferredPairs: Array.isArray(data.preferred_pairs) ? data.preferred_pairs : ['EURUSD'],
        minConfidenceThreshold: data.min_confidence_threshold,
        minGradeThreshold: data.min_grade_threshold,
        notifyInApp: data.notify_in_app,
        notifyEmail: data.notify_email,
        notifySms: data.notify_sms,
        smsNotificationsEnabled: data.sms_notifications_enabled || false,
        autoScanEnabled: data.auto_scan_enabled,
        scanIntervalMinutes: data.scan_interval_minutes,
        secretStrategyUnlocked: data.secret_strategy_unlocked || false,
        secretStrategyActivated: data.secret_strategy_activated || false
      });
    }
    setLoading(false);
  }

  async function handleSave() {
    if (!user) return;

    setSaving(true);
    setMessage(null);

    try {
      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          preferred_pairs: settings.preferredPairs,
          min_confidence_threshold: settings.minConfidenceThreshold,
          min_grade_threshold: settings.minGradeThreshold,
          notify_in_app: settings.notifyInApp,
          notify_email: settings.notifyEmail,
          notify_sms: settings.notifySms,
          sms_notifications_enabled: settings.smsNotificationsEnabled,
          auto_scan_enabled: settings.autoScanEnabled,
          scan_interval_minutes: settings.scanIntervalMinutes,
          secret_strategy_unlocked: settings.secretStrategyUnlocked,
          secret_strategy_activated: settings.secretStrategyActivated,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (error) {
        console.error('Save error:', error);
        setMessage({ type: 'error', text: `Failed to save: ${error.message}` });
      } else {
        setMessage({ type: 'success', text: 'Settings saved successfully!' });
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      setMessage({ type: 'error', text: 'An unexpected error occurred' });
    }

    setSaving(false);
  }

  const togglePair = (pair: string) => {
    setSettings(prev => ({
      ...prev,
      preferredPairs: prev.preferredPairs.includes(pair)
        ? prev.preferredPairs.filter(p => p !== pair)
        : [...prev.preferredPairs, pair]
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-400"></div>
      </div>
    );
  }

  const handleUnlockStrategy = async () => {
    if (!user) return;

    setSettings({ ...settings, secretStrategyUnlocked: true, secretStrategyActivated: true });

    await supabase
      .from('user_settings')
      .update({ 
        secret_strategy_unlocked: true,
        secret_strategy_activated: true
      })
      .eq('user_id', user.id);
  };

  const handleToggleStrategyActivation = async (activated: boolean) => {
    if (!user) return;

    setSettings({ ...settings, secretStrategyActivated: activated });

    await supabase
      .from('user_settings')
      .update({ secret_strategy_activated: activated })
      .eq('user_id', user.id);

    // Create in-app notification for SECRET strategy activation
    if (activated) {
      // Check current notification count and remove oldest if at limit
      const { data: existingNotifications } = await supabase
        .from("in_app_notifications")
        .select("id")
        .eq("user_id", user.id)
        .eq("dismissed", false)
        .order("created_at", { ascending: true });

      // If we have 5 notifications, remove the oldest one
      if (existingNotifications && existingNotifications.length >= 5) {
        await supabase
          .from("in_app_notifications")
          .update({ dismissed: true, dismissed_at: new Date().toISOString() })
          .eq("id", existingNotifications[0].id);
      }

      // Insert SECRET strategy activation notification
      await supabase.from("in_app_notifications").insert({
        user_id: user.id,
        title: "🚀 SECRET'S STRATEGY ACTIVATED",
        message: "The professional 90%+ win rate strategy is now ACTIVE!\n\nAuto-scan will now use the advanced SECRET methodology combining Killzone and Asian Session strategies.\n\nKey Features:\n• Enhanced confidence scoring (+15% bonus)\n• Institutional-grade analysis\n• Prop firm optimized risk management\n• Complete setup checklists\n\nYour trading edge just got significantly stronger. Execute with confidence!",
        type: "strategy",
        pinned: true
      });
    }
    setMessage({ 
      type: 'success', 
      text: `SECRET Strategy ${activated ? 'ACTIVATED' : 'DEACTIVATED'}! ${activated ? 'Auto-scan will now use advanced methodology.' : 'Switched back to standard analysis.'}` 
    });
  };
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white p-3 sm:p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-2 sm:gap-3 mb-6 sm:mb-8">
          <SettingsIcon className="w-6 h-6 sm:w-8 sm:h-8 text-amber-400" />
          <h1 className="text-2xl sm:text-3xl font-bold">Settings</h1>
        </div>

        <div className="flex gap-1 sm:gap-2 mb-4 sm:mb-6 overflow-x-auto scrollbar-hide pb-2">
          <button
            onClick={() => setActiveTab('general')}
            className={`px-3 py-2 sm:px-6 sm:py-3 rounded-lg font-medium transition-all whitespace-nowrap text-sm sm:text-base ${
              activeTab === 'general'
                ? 'bg-amber-500 text-white'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            General
          </button>
          <button
            onClick={() => setActiveTab('notifications')}
            className={`px-3 py-2 sm:px-6 sm:py-3 rounded-lg font-medium transition-all whitespace-nowrap flex items-center gap-1 sm:gap-2 text-sm sm:text-base ${
              activeTab === 'notifications'
                ? 'bg-amber-500 text-white'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            <Bell className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden xs:inline sm:inline">Notifications</span>
            <span className="xs:hidden">Notify</span>
          </button>
          <button
            onClick={() => setActiveTab('strategy')}
            className={`px-3 py-2 sm:px-6 sm:py-3 rounded-lg font-medium transition-all whitespace-nowrap flex items-center gap-1 sm:gap-2 text-sm sm:text-base ${
              activeTab === 'strategy'
                ? 'bg-amber-500 text-white'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            {settings.notifyInApp ? <Unlock className="w-3 h-3 sm:w-4 sm:h-4" /> : <Lock className="w-3 h-3 sm:w-4 sm:h-4" />}
            <span className="hidden sm:inline">{settings.notifyInApp ? 'SECRET Strategy' : 'Locked Strategy'}</span>
            <span className="sm:hidden">{settings.notifyInApp ? 'SECRET' : 'Locked'}</span>
          </button>
        </div>

        {activeTab === 'general' && (
        <div className="space-y-6">
          <div className="bg-slate-900 rounded-xl border border-slate-800 p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Trading Pairs</h2>
            <p className="text-slate-400 text-xs sm:text-sm mb-3 sm:mb-4">
              Select pairs for automatic scanning
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
              {pairs.map(pair => (
                <button
                  key={pair}
                  onClick={() => togglePair(pair)}
                  className={`p-3 sm:p-4 rounded-lg border-2 transition-all text-sm sm:text-base ${
                    settings.preferredPairs.includes(pair)
                      ? 'border-amber-500 bg-amber-500/10'
                      : 'border-slate-700 bg-slate-800 hover:border-slate-600'
                  }`}
                >
                  {pair}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-slate-900 rounded-xl border border-slate-800 p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Signal Filters</h2>

            <div className="space-y-3 sm:space-y-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-slate-300 mb-2">
                  Minimum Confidence: {settings.minConfidenceThreshold}%
                </label>
                <input
                  type="range"
                  min="30"
                  max="90"
                  step="5"
                  value={settings.minConfidenceThreshold}
                  onChange={(e) => setSettings({ ...settings, minConfidenceThreshold: parseInt(e.target.value) })}
                  className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
                />
                <div className="flex justify-between text-xs text-slate-500 mt-1 px-1">
                  <span>30%</span>
                  <span>60%</span>
                  <span>90%</span>
                </div>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-slate-300 mb-2">
                  Minimum Grade
                </label>
                <select
                  value={settings.minGradeThreshold}
                  onChange={(e) => setSettings({ ...settings, minGradeThreshold: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  {grades.map(grade => (
                    <option key={grade} value={grade}>{grade}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 rounded-xl border border-slate-800 p-4 sm:p-6">
            <div className="flex items-center gap-2 mb-4">
              <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
              <h2 className="text-lg sm:text-xl font-semibold">Notifications</h2>
            </div>

            <div className="space-y-2 sm:space-y-3">
              <label className="flex items-center justify-between p-4 bg-slate-800 rounded-lg cursor-pointer hover:bg-slate-800/80 transition-all">
                <span className="text-slate-300">In-App Notifications</span>
                <input
                  type="checkbox"
                  checked={settings.notifyInApp}
                  onChange={(e) => setSettings({ ...settings, notifyInApp: e.target.checked })}
                  className="w-5 h-5 rounded accent-amber-500"
                />
              </label>

              <label className="flex items-center justify-between p-4 bg-slate-800 rounded-lg cursor-pointer hover:bg-slate-800/80 transition-all">
                <span className="text-slate-300">Email Notifications</span>
                <input
                  type="checkbox"
                  checked={settings.notifyEmail}
                  onChange={(e) => setSettings({ ...settings, notifyEmail: e.target.checked })}
                  className="w-5 h-5 rounded accent-amber-500"
                />
              </label>

              <label className="flex items-center justify-between p-4 bg-slate-800 rounded-lg cursor-pointer hover:bg-slate-800/80 transition-all">
                <span className="text-slate-300">SMS Notifications</span>
                <input
                  type="checkbox"
                  checked={settings.notifySms}
                  onChange={(e) => setSettings({ ...settings, notifySms: e.target.checked })}
                  className="w-5 h-5 rounded accent-amber-500"
                />
              </label>
            </div>
          </div>

          <div className="bg-slate-900 rounded-xl border border-slate-800 p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Auto-Scan</h2>

            <label className="flex items-center justify-between p-4 bg-slate-800 rounded-lg cursor-pointer hover:bg-slate-800/80 transition-all mb-4">
              <span className="text-slate-300">Enable Automatic Scanning</span>
              <input
                type="checkbox"
                checked={settings.autoScanEnabled}
                onChange={(e) => setSettings({ ...settings, autoScanEnabled: e.target.checked })}
                className="w-5 h-5 rounded accent-amber-500"
              />
            </label>

            {settings.autoScanEnabled && (
              <div>
                <label className="block text-xs sm:text-sm font-medium text-slate-300 mb-2">
                  Scan Interval: {settings.scanIntervalMinutes} minutes
                </label>
                <input
                  type="range"
                  min="5"
                  max="60"
                  step="5"
                  value={settings.scanIntervalMinutes}
                  onChange={(e) => setSettings({ ...settings, scanIntervalMinutes: parseInt(e.target.value) })}
                  className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
                />
                <div className="flex justify-between text-xs text-slate-500 mt-1 px-1">
                  <span>5 min</span>
                  <span>30 min</span>
                  <span>60 min</span>
                </div>
              </div>
            )}
          </div>

          {message && (
            <div className={`p-4 rounded-lg ${
              message.type === 'success' 
                ? 'bg-green-500/10 border border-green-500/20 text-green-400'
                : 'bg-red-500/10 border border-red-500/20 text-red-400'
            }`}>
              {message.text}
            </div>
          )}

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 py-3 sm:py-4 bg-gradient-to-r from-amber-500 to-amber-600 rounded-lg font-medium hover:from-amber-600 hover:to-amber-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
          >
            <Save className="w-4 h-4 sm:w-5 sm:h-5" />
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
        )}

        {activeTab === 'notifications' && <NotificationSettings />}

        {activeTab === 'strategy' && (
          <>
            {!settings.notifyInApp ? (
              <div className="bg-gradient-to-br from-amber-900/20 to-amber-950/20 rounded-xl border-2 border-amber-500/30 p-4 sm:p-8">
                <div className="flex items-center justify-center mb-6">
                  <Lock className="w-16 h-16 text-amber-500 animate-pulse" />
                </div>

                <h3 className="text-2xl font-bold text-center mb-4 text-amber-400">
                  SECRET'S STRATEGY LOCKED
                </h3>

                <p className="text-center text-slate-300 mb-6 text-sm sm:text-base">
                  To unlock the professional 90%+ win rate strategy, you must first enable in-app notifications.
                  This ensures you receive all important setup checklists and trading signals.
                </p>

                <button
                  onClick={() => {
                    setSettings({ ...settings, notifyInApp: true });
                    handleSave().then(() => {
                      setSettings({ ...settings, notifyInApp: true, secretStrategyUnlocked: true });
                    });
                  }}
                  className="w-full py-3 sm:py-4 bg-gradient-to-r from-amber-500 to-amber-600 rounded-lg font-bold text-sm sm:text-lg hover:from-amber-600 hover:to-amber-700 transform hover:scale-105 transition-all"
                >
                  ENABLE IN-APP NOTIFICATIONS & UNLOCK
                </button>
              </div>
            ) : (
              <SecretStrategy
                unlocked={settings.secretStrategyUnlocked}
                activated={settings.secretStrategyActivated}
                onUnlock={handleUnlockStrategy}
                onToggleActivation={handleToggleStrategyActivation}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
