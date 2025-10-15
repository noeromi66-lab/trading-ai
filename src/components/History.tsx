import { useState, useEffect } from 'react';
import { Clock, Activity, TrendingUp, XCircle, PlayCircle, Pin, X, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth/AuthContext';

export default function History() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [notificationsExpanded, setNotificationsExpanded] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLogs();
    loadNotifications();
  }, [user]);

  async function loadLogs() {
    setLoading(true);
    const { data } = await supabase
      .from('activity_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    setLogs(data || []);
    setLoading(false);
  }

  async function loadNotifications() {
    if (!user) return;

    const { data } = await supabase
      .from('in_app_notifications')
      .select('*')
      .eq('user_id', user.id)
      .eq('dismissed', false)
      .order('created_at', { ascending: false })
      .limit(5);

    setNotifications(data || []);
  }

  async function dismissNotification(notificationId: string) {
    if (!user) return;

    await supabase
      .from('in_app_notifications')
      .update({ dismissed: true, dismissed_at: new Date().toISOString() })
      .eq('id', notificationId)
      .eq('user_id', user.id);

    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'SIGNAL_GENERATED':
        return <TrendingUp className="w-5 h-5 text-green-400" />;
      case 'SIGNAL_REJECTED':
        return <XCircle className="w-5 h-5 text-red-400" />;
      case 'SCAN_STARTED':
        return <PlayCircle className="w-5 h-5 text-blue-400" />;
      default:
        return <Activity className="w-5 h-5 text-slate-400" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'SIGNAL_GENERATED':
        return 'border-green-500/20 bg-green-500/5';
      case 'SIGNAL_REJECTED':
        return 'border-red-500/20 bg-red-500/5';
      case 'SCAN_STARTED':
        return 'border-blue-500/20 bg-blue-500/5';
      default:
        return 'border-slate-700 bg-slate-800/50';
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <Clock className="w-8 h-8 text-amber-400" />
          <div>
            <h1 className="text-3xl font-bold">Activity History</h1>
            <p className="text-slate-400">Complete audit trail of all system activities</p>
          </div>
        </div>

        {notifications.length > 0 && (
          <div className="mb-8">
            <div className="bg-gradient-to-r from-amber-900/30 via-amber-800/20 to-amber-900/30 rounded-2xl border-2 border-amber-500/40 p-6 backdrop-blur-sm shadow-2xl shadow-amber-500/10">
              <div className="flex items-center gap-3 mb-5">
                <div className="relative">
                  <Pin className="w-7 h-7 text-amber-400 drop-shadow-glow" />
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-amber-400 rounded-full animate-pulse"></div>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-amber-300 drop-shadow-glow">Pinned In-App Notifications</h2>
                  <p className="text-amber-400/70 text-sm">Setup checklists and important trading alerts (max 5)</p>
                </div>
                <button
                  onClick={() => setNotificationsExpanded(!notificationsExpanded)}
                  className="flex items-center gap-2 px-4 py-2 bg-amber-500/20 hover:bg-amber-500/30 rounded-lg transition-all border border-amber-500/30"
                >
                  <span className="text-amber-300 font-medium text-sm">
                    {notificationsExpanded ? 'Collapse' : `Expand (${notifications.length})`}
                  </span>
                  {notificationsExpanded ? 
                    <ChevronUp className="w-4 h-4 text-amber-300" /> : 
                    <ChevronDown className="w-4 h-4 text-amber-300" />
                  }
                </button>
              </div>

              <div className="space-y-4">
                {notifications.slice(0, notificationsExpanded ? 5 : 1).map((notification, index) => (
                  <div
                    key={notification.id}
                    className="group bg-slate-900/60 backdrop-blur-sm border border-slate-700/50 rounded-xl p-5 hover:border-amber-500/40 transition-all duration-300 hover:shadow-lg hover:shadow-amber-500/10"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-amber-500 to-amber-600 rounded-lg flex items-center justify-center font-bold text-slate-900 shadow-lg shadow-amber-500/30">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-bold text-amber-300 mb-2 flex items-center gap-2">
                          {notification.title}
                        </h3>
                        <p className="text-slate-300 whitespace-pre-line leading-relaxed text-sm">
                          {notification.message}
                        </p>
                      </div>
                      <button
                        onClick={() => dismissNotification(notification.id)}
                        className="flex-shrink-0 p-2.5 hover:bg-red-500/10 rounded-lg transition-all duration-200 group/btn border border-transparent hover:border-red-500/30"
                        title="Dismiss notification"
                      >
                        <X className="w-5 h-5 text-slate-400 group-hover/btn:text-red-400 transition-colors" />
                      </button>
                    </div>
                  </div>
                ))}
                {!notificationsExpanded && notifications.length > 1 && (
                  <div className="text-center">
                    <button
                      onClick={() => setNotificationsExpanded(true)}
                      className="text-amber-400/70 hover:text-amber-400 text-sm transition-colors"
                    >
                      +{notifications.length - 1} more notifications
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-400"></div>
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-20 bg-slate-900/50 rounded-xl border border-slate-800">
            <Activity className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400 text-lg">No activity logs yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {logs.map((log) => (
              <div
                key={log.id}
                className={`border rounded-lg p-4 ${getActivityColor(log.activity_type)}`}
              >
                <div className="flex items-start gap-4">
                  <div className="mt-1">
                    {getActivityIcon(log.activity_type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm text-slate-300">
                          {log.activity_type.replace(/_/g, ' ')}
                        </span>
                        {log.pair_symbol && (
                          <>
                            <span className="text-slate-600">•</span>
                            <span className="text-amber-400 text-sm">{log.pair_symbol}</span>
                          </>
                        )}
                      </div>
                      <span className="text-xs text-slate-500">{formatTime(log.created_at)}</span>
                    </div>
                    <p className="text-sm text-slate-400 leading-relaxed">{log.message}</p>

                    {log.metadata && Object.keys(log.metadata).length > 0 && (
                      <details className="mt-3">
                        <summary className="cursor-pointer text-xs text-slate-500 hover:text-slate-400">
                          View details
                        </summary>
                        <div className="mt-2 p-3 bg-slate-900/50 rounded border border-slate-800">
                          <pre className="text-xs text-slate-400 overflow-x-auto">
                            {JSON.stringify(log.metadata, null, 2)}
                          </pre>
                        </div>
                      </details>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
