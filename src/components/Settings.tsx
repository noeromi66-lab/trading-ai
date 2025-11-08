import { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Save, Bell } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth/AuthContext';

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
    scanIntervalMinutes: 15
  });
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
        autoScanEnabled: data.auto_scan_enabled,
        scanIntervalMinutes: data.scan_interval_minutes
      });
    }
    setLoading(false);
  }

  async function handleSave() {
    if (!user) return;

    setSaving(true);
    setMessage(null);

    try {
      const { data: existing } = await supabase
        .from('user_settings')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      let error;
      if (existing) {
        const result = await supabase
          .from('user_settings')
          .update({
            preferred_pairs: settings.preferredPairs,
            min_confidence_threshold: settings.minConfidenceThreshold,
            min_grade_threshold: settings.minGradeThreshold,
            notify_in_app: settings.notifyInApp,
            notify_email: settings.notifyEmail,
            notify_sms: settings.notifySms,
            auto_scan_enabled: settings.autoScanEnabled,
            scan_interval_minutes: settings.scanIntervalMinutes,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user.id);
        error = result.error;
      } else {
        const result = await supabase
          .from('user_settings')
          .insert({
            user_id: user.id,
            preferred_pairs: settings.preferredPairs,
            min_confidence_threshold: settings.minConfidenceThreshold,
            min_grade_threshold: settings.minGradeThreshold,
            notify_in_app: settings.notifyInApp,
            notify_email: settings.notifyEmail,
            notify_sms: settings.notifySms,
            auto_scan_enabled: settings.autoScanEnabled,
            scan_interval_minutes: settings.scanIntervalMinutes
          });
        error = result.error;
      }

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white p-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <SettingsIcon className="w-8 h-8 text-amber-400" />
          <h1 className="text-3xl font-bold">Settings</h1>
        </div>

        <div className="space-y-6">
          <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
            <h2 className="text-xl font-semibold mb-4">Trading Pairs</h2>
            <p className="text-slate-400 text-sm mb-4">
              Select pairs for automatic scanning
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {pairs.map(pair => (
                <button
                  key={pair}
                  onClick={() => togglePair(pair)}
                  className={`p-4 rounded-lg border-2 transition-all ${
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

          <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
            <h2 className="text-xl font-semibold mb-4">Signal Filters</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
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
                <div className="flex justify-between text-xs text-slate-500 mt-1">
                  <span>30%</span>
                  <span>60%</span>
                  <span>90%</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
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

          <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Bell className="w-5 h-5 text-amber-400" />
              <h2 className="text-xl font-semibold">Notifications</h2>
            </div>

            <div className="space-y-3">
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

          <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
            <h2 className="text-xl font-semibold mb-4">Auto-Scan</h2>

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
                <label className="block text-sm font-medium text-slate-300 mb-2">
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
                <div className="flex justify-between text-xs text-slate-500 mt-1">
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
            className="w-full flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-amber-500 to-amber-600 rounded-lg font-medium hover:from-amber-600 hover:to-amber-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-5 h-5" />
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  );
}
