import { useState, useEffect } from 'react';
import { Bell, Phone, Mail, Filter, Check, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth/AuthContext';

export default function NotificationSettings() {
  const { user } = useAuth();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [countryCode, setCountryCode] = useState('+1');
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [showPhoneInput, setShowPhoneInput] = useState(false);

  const [preferences, setPreferences] = useState({
    emailEnabled: true,
    smsEnabled: false,
    emailSignalFilters: {
      minConfidence: 0.7,
      strategies: [] as string[]
    },
    notifyKillzone: true,
    notifyAsian: true,
    notifySmc: true,
    notifyEma: true,
    inAppChecklistEnabled: false
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadPreferences();
    loadPhoneNumber();
  }, [user]);

  async function loadPreferences() {
    if (!user) return;

    const { data } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (data) {
      setPreferences({
        emailEnabled: data.email_enabled,
        smsEnabled: data.sms_enabled,
        emailSignalFilters: data.email_signal_filters,
        notifyKillzone: data.notify_killzone_signals,
        notifyAsian: data.notify_asian_signals,
        notifySmc: data.notify_smc_signals,
        notifyEma: data.notify_ema_signals,
        inAppChecklistEnabled: data.in_app_checklist_enabled
      });
    }

    setLoading(false);
  }

  async function loadPhoneNumber() {
    if (!user) return;

    const { data } = await supabase
      .from('user_phone_numbers')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (data) {
      setPhoneNumber(data.phone_number);
      setCountryCode(data.country_code);
      setPhoneVerified(data.verified);
    }
  }

  async function handleSavePhone() {
    if (!user || !phoneNumber) return;

    setSaving(true);
    setMessage(null);

    try {
      const { data: existing } = await supabase
        .from('user_phone_numbers')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (existing) {
        await supabase
          .from('user_phone_numbers')
          .update({
            phone_number: phoneNumber,
            country_code: countryCode,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user.id);
      } else {
        await supabase
          .from('user_phone_numbers')
          .insert({
            user_id: user.id,
            phone_number: phoneNumber,
            country_code: countryCode
          });
      }

      setMessage({ type: 'success', text: 'Phone number saved! Verification SMS will be sent when you enable SMS notifications.' });
      setShowPhoneInput(false);
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to save phone number' });
    }

    setSaving(false);
  }

  async function handleSavePreferences() {
    if (!user) return;

    if (preferences.smsEnabled && !phoneNumber) {
      setMessage({ type: 'error', text: 'Please add a phone number before enabling SMS notifications' });
      setShowPhoneInput(true);
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const { data: existing } = await supabase
        .from('notification_preferences')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      const payload = {
        user_id: user.id,
        email_enabled: preferences.emailEnabled,
        sms_enabled: preferences.smsEnabled,
        email_signal_filters: preferences.emailSignalFilters,
        notify_killzone_signals: preferences.notifyKillzone,
        notify_asian_signals: preferences.notifyAsian,
        notify_smc_signals: preferences.notifySmc,
        notify_ema_signals: preferences.notifyEma,
        in_app_checklist_enabled: preferences.inAppChecklistEnabled,
        updated_at: new Date().toISOString()
      };

      if (existing) {
        await supabase
          .from('notification_preferences')
          .update(payload)
          .eq('user_id', user.id);
      } else {
        await supabase
          .from('notification_preferences')
          .insert(payload);
      }

      // Also update user_settings to sync SMS status
      await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          sms_notifications_enabled: preferences.smsEnabled,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });

      setMessage({ type: 'success', text: 'Notification preferences saved!' });
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to save preferences' });
    }

    setSaving(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-400"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="bg-slate-900 rounded-xl border border-slate-800 p-4 sm:p-6">
        <div className="flex items-center gap-2 mb-4">
          <Phone className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
          <h3 className="text-lg sm:text-xl font-semibold">SMS Notifications</h3>
        </div>

        <p className="text-slate-400 text-xs sm:text-sm mb-3 sm:mb-4">
          SMS notifications have NO filters and will send ALL signals immediately when generated.
        </p>

        {phoneVerified ? (
          <div className="flex items-center gap-2 p-3 sm:p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
            <Check className="w-4 h-4 sm:w-5 sm:h-5 text-green-400" />
            <div>
              <p className="text-green-400 font-medium text-sm sm:text-base">Phone Verified</p>
              <p className="text-slate-400 text-xs sm:text-sm">{countryCode} {phoneNumber}</p>
            </div>
          </div>
        ) : phoneNumber ? (
          <div className="flex items-center gap-2 p-3 sm:p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
            <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
            <div>
              <p className="text-amber-400 font-medium text-sm sm:text-base">Phone Pending Verification</p>
              <p className="text-slate-400 text-xs sm:text-sm">{countryCode} {phoneNumber}</p>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowPhoneInput(true)}
            className="w-full p-3 sm:p-4 border-2 border-dashed border-slate-700 rounded-lg text-slate-400 hover:border-amber-500 hover:text-amber-400 transition-all text-sm sm:text-base"
          >
            + Add Phone Number
          </button>
        )}

        {showPhoneInput && (
          <div className="mt-3 sm:mt-4 space-y-2 sm:space-y-3">
            <div className="flex gap-2">
              <select
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value)}
                className="px-2 sm:px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm sm:text-base"
              >
                <option value="+1">+1 (US/CA)</option>
                <option value="+44">+44 (UK)</option>
                <option value="+33">+33 (FR)</option>
                <option value="+49">+49 (DE)</option>
              </select>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="Phone number"
                className="flex-1 px-3 sm:px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm sm:text-base"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleSavePhone}
                disabled={saving || !phoneNumber}
                className="flex-1 py-2 bg-amber-500 rounded-lg hover:bg-amber-600 transition-all disabled:opacity-50 text-sm sm:text-base"
              >
                Save Phone
              </button>
              <button
                onClick={() => setShowPhoneInput(false)}
                className="px-3 sm:px-4 py-2 bg-slate-800 rounded-lg hover:bg-slate-700 transition-all text-sm sm:text-base"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <label className="flex items-center justify-between p-3 sm:p-4 bg-slate-800 rounded-lg cursor-pointer hover:bg-slate-800/80 transition-all mt-3 sm:mt-4">
          <span className="text-slate-300 text-sm sm:text-base">Enable SMS Notifications</span>
          <input
            type="checkbox"
            checked={preferences.smsEnabled}
            onChange={(e) => setPreferences({ ...preferences, smsEnabled: e.target.checked })}
            disabled={!phoneNumber}
            className="w-5 h-5 rounded accent-amber-500"
          />
        </label>
      </div>

      <div className="bg-slate-900 rounded-xl border border-slate-800 p-4 sm:p-6">
        <div className="flex items-center gap-2 mb-4">
          <Mail className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
          <h3 className="text-lg sm:text-xl font-semibold">Email Notifications</h3>
        </div>

        <label className="flex items-center justify-between p-3 sm:p-4 bg-slate-800 rounded-lg cursor-pointer hover:bg-slate-800/80 transition-all mb-3 sm:mb-4">
          <span className="text-slate-300 text-sm sm:text-base">Enable Email Notifications</span>
          <input
            type="checkbox"
            checked={preferences.emailEnabled}
            onChange={(e) => setPreferences({ ...preferences, emailEnabled: e.target.checked })}
            className="w-5 h-5 rounded accent-amber-500"
          />
        </label>

        {preferences.emailEnabled && (
          <div className="space-y-3 sm:space-y-4 p-3 sm:p-4 bg-slate-800/50 rounded-lg border border-slate-700">
            <div className="flex items-center gap-2 text-amber-400 mb-1 sm:mb-2">
              <Filter className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="font-medium text-sm sm:text-base">Email Signal Filters</span>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-slate-300 mb-2">
                Minimum Confidence: {(preferences.emailSignalFilters.minConfidence * 100).toFixed(0)}%
              </label>
              <input
                type="range"
                min="0.5"
                max="0.9"
                step="0.05"
                value={preferences.emailSignalFilters.minConfidence}
                onChange={(e) => setPreferences({
                  ...preferences,
                  emailSignalFilters: {
                    ...preferences.emailSignalFilters,
                    minConfidence: parseFloat(e.target.value)
                  }
                })}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
            </div>
          </div>
        )}
      </div>

      <div className="bg-slate-900 rounded-xl border border-slate-800 p-4 sm:p-6">
        <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Strategy Notifications</h3>

        <div className="space-y-2 sm:space-y-3">
          <label className="flex items-center justify-between p-3 sm:p-4 bg-slate-800 rounded-lg cursor-pointer hover:bg-slate-800/80 transition-all">
            <span className="text-slate-300 text-sm sm:text-base">Killzone Strategy</span>
            <input
              type="checkbox"
              checked={preferences.notifyKillzone}
              onChange={(e) => setPreferences({ ...preferences, notifyKillzone: e.target.checked })}
              className="w-5 h-5 rounded accent-amber-500"
            />
          </label>

          <label className="flex items-center justify-between p-3 sm:p-4 bg-slate-800 rounded-lg cursor-pointer hover:bg-slate-800/80 transition-all">
            <span className="text-slate-300 text-sm sm:text-base">Asian Session Strategy</span>
            <input
              type="checkbox"
              checked={preferences.notifyAsian}
              onChange={(e) => setPreferences({ ...preferences, notifyAsian: e.target.checked })}
              className="w-5 h-5 rounded accent-amber-500"
            />
          </label>

          <label className="flex items-center justify-between p-3 sm:p-4 bg-slate-800 rounded-lg cursor-pointer hover:bg-slate-800/80 transition-all">
            <span className="text-slate-300 text-sm sm:text-base">SMC Strategy</span>
            <input
              type="checkbox"
              checked={preferences.notifySmc}
              onChange={(e) => setPreferences({ ...preferences, notifySmc: e.target.checked })}
              className="w-5 h-5 rounded accent-amber-500"
            />
          </label>

          <label className="flex items-center justify-between p-3 sm:p-4 bg-slate-800 rounded-lg cursor-pointer hover:bg-slate-800/80 transition-all">
            <span className="text-slate-300 text-sm sm:text-base">EMA Strategy</span>
            <input
              type="checkbox"
              checked={preferences.notifyEma}
              onChange={(e) => setPreferences({ ...preferences, notifyEma: e.target.checked })}
              className="w-5 h-5 rounded accent-amber-500"
            />
          </label>
        </div>
      </div>

      <div className="bg-slate-900 rounded-xl border border-slate-800 p-4 sm:p-6">
        <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">In-App Features</h3>

        <label className="flex items-start sm:items-center justify-between p-3 sm:p-4 bg-slate-800 rounded-lg cursor-pointer hover:bg-slate-800/80 transition-all">
          <div>
            <p className="text-slate-300 font-medium text-sm sm:text-base">Setup Checklist Notifications</p>
            <p className="text-slate-500 text-xs sm:text-sm">Pin setup checklists in History tab</p>
          </div>
          <input 
            type="checkbox"
            checked={preferences.inAppChecklistEnabled}
            onChange={(e) => setPreferences({ ...preferences, inAppChecklistEnabled: e.target.checked })}
            className="w-5 h-5 rounded accent-amber-500 flex-shrink-0 mt-1 sm:mt-0"
          />
        </label>
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
        onClick={handleSavePreferences}
        disabled={saving}
        className="w-full py-3 sm:py-4 bg-gradient-to-r from-amber-500 to-amber-600 rounded-lg font-medium hover:from-amber-600 hover:to-amber-700 transition-all disabled:opacity-50 text-sm sm:text-base"
      >
        {saving ? 'Saving...' : 'Save Notification Preferences'}
      </button>
    </div>
  );
}