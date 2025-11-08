import { useState, useEffect } from 'react';
import { Clock, Activity, TrendingUp, XCircle, PlayCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function History() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLogs();
  }, []);

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
