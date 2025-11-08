import { useState, useEffect } from 'react';
import { Play, RefreshCw, TrendingUp, AlertCircle, Info } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth/AuthContext';
import SignalCard from './SignalCard';

export default function Dashboard() {
  const { user } = useAuth();
  const [signals, setSignals] = useState<any[]>([]);
  const [selectedPair, setSelectedPair] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showApiInfo, setShowApiInfo] = useState(true);

  const hasPolygonKey = import.meta.env.VITE_POLYGON_API_KEY &&
    import.meta.env.VITE_POLYGON_API_KEY !== 'your_polygon_api_key_here';

  const pairs = [
    { symbol: 'EURUSD', name: 'EUR/USD' },
    { symbol: 'GBPUSD', name: 'GBP/USD' },
    { symbol: 'XAUUSD', name: 'XAU/USD' },
    { symbol: 'USDJPY', name: 'USD/JPY' },
    { symbol: 'GBPJPY', name: 'GBP/JPY' }
  ];

  useEffect(() => {
    loadSignals();
    const interval = setInterval(loadSignals, 30000);
    return () => clearInterval(interval);
  }, [selectedPair]);

  async function loadSignals() {
    setLoading(true);
    try {
      let query = supabase
        .from('signals')
        .select(`
          *,
          trading_pairs(symbol, display_name)
        `)
        .gte('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(20);

      if (selectedPair) {
        const { data: pairData } = await supabase
          .from('trading_pairs')
          .select('id')
          .eq('symbol', selectedPair)
          .single();

        if (pairData) {
          query = query.eq('pair_id', pairData.id);
        }
      }

      const { data } = await query;
      setSignals(data || []);
    } catch (err) {
      console.error('Failed to load signals:', err);
    } finally {
      setLoading(false);
    }
  }

  async function analyzeMarket() {
    setScanning(true);
    setError(null);

    try {
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-market`;
      const { data: { session } } = await supabase.auth.getSession();

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token || import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ pairSymbol: selectedPair, testMode: true })
      });

      if (!response.ok) {
        throw new Error('Failed to analyze market');
      }

      await loadSignals();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Scan failed');
    } finally {
      setScanning(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent mb-2">
              Trading AI Dashboard
            </h1>
            <p className="text-slate-400">Live signal analysis with multi-strategy engine</p>
          </div>
          <button
            onClick={analyzeMarket}
            disabled={scanning}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 rounded-lg hover:from-amber-600 hover:to-amber-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-amber-500/25"
          >
            {scanning ? (
              <><RefreshCw className="w-5 h-5 animate-spin" /> Scanning...</>
            ) : (
              <><Play className="w-5 h-5" /> Scan Market</>
            )}
          </button>
        </div>

        {!hasPolygonKey && showApiInfo && (
          <div className="flex items-start gap-3 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg text-blue-300 mb-6">
            <Info className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="font-medium mb-1">Using Mock Data</p>
              <p className="text-sm text-blue-400/80">
                Add your Polygon.io API key to <code className="px-1.5 py-0.5 bg-blue-500/20 rounded text-xs">.env</code> file for real market data. See <code className="px-1.5 py-0.5 bg-blue-500/20 rounded text-xs">SETUP.md</code> for instructions.
              </p>
            </div>
            <button onClick={() => setShowApiInfo(false)} className="text-blue-400 hover:text-blue-300">
              ×
            </button>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 mb-6">
            <AlertCircle className="w-5 h-5" />
            {error}
          </div>
        )}

        <div className="flex gap-3 mb-8 overflow-x-auto pb-2">
          <button
            onClick={() => setSelectedPair(null)}
            className={`px-4 py-2 rounded-lg whitespace-nowrap transition-all ${
              selectedPair === null
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            All Pairs
          </button>
          {pairs.map(pair => (
            <button
              key={pair.symbol}
              onClick={() => setSelectedPair(pair.symbol)}
              className={`px-4 py-2 rounded-lg whitespace-nowrap transition-all ${
                selectedPair === pair.symbol
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {pair.name}
            </button>
          ))}
        </div>

        {loading && signals.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-400"></div>
          </div>
        ) : signals.length === 0 ? (
          <div className="text-center py-20 bg-slate-900/50 rounded-xl border border-slate-800">
            <TrendingUp className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400 text-lg mb-2">No active signals</p>
            <p className="text-slate-500 text-sm">Click \"Scan Market\" to analyze pairs</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {signals.map(signal => (
              <SignalCard key={signal.id} signal={signal} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
