import { useState, useEffect } from 'react';
import { Play, RefreshCw, TrendingUp, AlertCircle, Info, Crown, Zap } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth/AuthContext';
import SignalCard from './SignalCard';
import TopTradeCard from './TopTradeCard';
import AIAnalysis from './AIAnalysis';

export default function Dashboard() {
  const { user } = useAuth();
  const [signals, setSignals] = useState<any[]>([]);
  const [selectedPair, setSelectedPair] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showApiInfo, setShowApiInfo] = useState(true);
  const [userSettings, setUserSettings] = useState<any>(null);
  const [topTrade, setTopTrade] = useState<any>(null);
  const [showTopTradeOnly, setShowTopTradeOnly] = useState(false);

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
    loadUserSettings();
    findTopTrade();
    const interval = setInterval(loadSignals, 30000);
    return () => clearInterval(interval);
  }, [selectedPair]);

  useEffect(() => {
    findTopTrade();
  }, [signals]);

  async function loadUserSettings() {
    if (!user) return;

    const { data } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    setUserSettings(data);
  }

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

  function findTopTrade() {
    if (signals.length === 0) {
      setTopTrade(null);
      return;
    }

    // Calculate dynamic confidence score for each signal
    const scoredSignals = signals.map(signal => {
      let dynamicScore = signal.confidence_score;
      
      // Grade multiplier
      const gradeMultipliers = { 'A+': 1.2, 'A': 1.15, 'B+': 1.1, 'B': 1.05, 'C': 1.0 };
      dynamicScore *= gradeMultipliers[signal.grade] || 1.0;
      
      // Risk/Reward bonus
      if (signal.risk_reward_ratio >= 2.5) dynamicScore += 10;
      else if (signal.risk_reward_ratio >= 2.0) dynamicScore += 5;
      
      // Killzone bonus
      if (signal.is_killzone) dynamicScore += 8;
      
      // Criteria passed bonus
      const criteriaCount = Object.keys(signal.criteria_passed || {}).length;
      dynamicScore += criteriaCount * 3;
      
      // Strategy bonus
      if (signal.strategy_used === 'SECRET') dynamicScore += 15;
      else if (signal.strategy_used.includes('KILLZONE')) dynamicScore += 10;
      
      // Recency bonus (newer signals get slight boost)
      const ageHours = (Date.now() - new Date(signal.created_at).getTime()) / (1000 * 60 * 60);
      if (ageHours < 0.5) dynamicScore += 5;
      
      return { ...signal, dynamicScore: Math.min(100, dynamicScore) };
    });

    // Find the highest scoring signal
    const bestSignal = scoredSignals.reduce((best, current) => 
      current.dynamicScore > best.dynamicScore ? current : best
    );

    setTopTrade(bestSignal);
  }

  function findTopTrade() {
    if (signals.length === 0) {
      setTopTrade(null);
      return;
    }

    // Calculate dynamic confidence score for each signal
    const scoredSignals = signals.map(signal => {
      let dynamicScore = signal.confidence_score;
      
      // Grade multiplier
      const gradeMultipliers = { 'A+': 1.2, 'A': 1.15, 'B+': 1.1, 'B': 1.05, 'C': 1.0 };
      dynamicScore *= gradeMultipliers[signal.grade] || 1.0;
      
      // Risk/Reward bonus
      if (signal.risk_reward_ratio >= 2.5) dynamicScore += 10;
      else if (signal.risk_reward_ratio >= 2.0) dynamicScore += 5;
      
      // Killzone bonus
      if (signal.is_killzone) dynamicScore += 8;
      
      // Criteria passed bonus
      const criteriaCount = Object.keys(signal.criteria_passed || {}).length;
      dynamicScore += criteriaCount * 3;
      
      // Strategy bonus
      if (signal.strategy_used === 'SECRET') dynamicScore += 15;
      else if (signal.strategy_used.includes('KILLZONE')) dynamicScore += 10;
      
      // Recency bonus (newer signals get slight boost)
      const ageHours = (Date.now() - new Date(signal.created_at).getTime()) / (1000 * 60 * 60);
      if (ageHours < 0.5) dynamicScore += 5;
      
      return { ...signal, dynamicScore: Math.min(100, dynamicScore) };
    });

    // Find the highest scoring signal
    const bestSignal = scoredSignals.reduce((best, current) => 
      current.dynamicScore > best.dynamicScore ? current : best
    );

    setTopTrade(bestSignal);
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
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white p-3 md:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent mb-1">
              Trading AI Dashboard
            </h1>
            <p className="text-sm text-slate-400">Live signal analysis with multi-strategy engine</p>
          </div>
          <button
            onClick={analyzeMarket}
            disabled={scanning}
            className="flex items-center gap-2 px-4 py-2.5 md:px-6 md:py-3 bg-gradient-to-r from-amber-500 to-amber-600 rounded-lg hover:from-amber-600 hover:to-amber-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-amber-500/25 text-sm md:text-base w-full sm:w-auto justify-center"
          >
            {scanning ? (
              <><RefreshCw className="w-4 h-4 md:w-5 md:h-5 animate-spin" /> Scanning...</>
            ) : (
              <><Play className="w-4 h-4 md:w-5 md:h-5" /> Scan Market</>
            )}
          </button>
        </div>

        <AIAnalysis />

        {userSettings?.auto_scan_enabled && (
          <div className="flex items-center gap-2 p-4 bg-green-500/10 border border-green-500/20 rounded-lg text-green-400 mb-6">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-sm">Auto-scan is enabled - scanning every {userSettings.scan_interval_minutes} minutes</span>
          </div>
        )}

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

        <div className="flex flex-wrap gap-2 md:gap-3 mb-6">
          <button
            onClick={() => {
              setSelectedPair(null);
              setShowTopTradeOnly(false);
            }}
            className={`px-4 py-2 md:px-6 md:py-3 rounded-lg whitespace-nowrap transition-all text-sm md:text-base font-medium ${
              selectedPair === null && !showTopTradeOnly
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            All Pairs
          </button>
          {topTrade && (
            <button
              onClick={() => setShowTopTradeOnly(!showTopTradeOnly)}
              className={`flex items-center gap-1.5 px-4 py-2 md:px-6 md:py-3 rounded-lg whitespace-nowrap transition-all text-sm md:text-base font-medium ${
                showTopTradeOnly
                  ? 'bg-gradient-to-r from-yellow-500 to-amber-500 text-white shadow-lg shadow-yellow-500/25'
                  : 'bg-gradient-to-r from-yellow-600/20 to-amber-600/20 border border-yellow-500/30 text-yellow-400 hover:from-yellow-500/30 hover:to-amber-500/30'
              }`}
            >
              <Crown className="w-3 h-3 md:w-4 md:h-4" />
              <span className="hidden sm:inline">Top Trade</span>
              <span className="sm:hidden">Top</span>
              <div className="bg-white/20 px-2 py-1 rounded text-xs font-bold">
                {Math.round(topTrade.dynamicScore)}%
              </div>
            </button>
          )}
          {pairs.map(pair => (
            <button
              key={pair.symbol}
              onClick={() => setSelectedPair(pair.symbol)}
              className={`px-4 py-2 md:px-6 md:py-3 rounded-lg whitespace-nowrap transition-all text-sm md:text-base font-medium ${
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
        ) : showTopTradeOnly && topTrade ? (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border border-yellow-500/30 rounded-lg">
                <Crown className="w-5 h-5 text-yellow-400" />
                <span className="text-yellow-400 font-bold">TOP TRADE SELECTION</span>
                <Zap className="w-4 h-4 text-yellow-400" />
              </div>
            </div>
            <TopTradeCard signal={topTrade} />
          </div>
        ) : showTopTradeOnly && topTrade ? (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border border-yellow-500/30 rounded-lg">
                <Crown className="w-5 h-5 text-yellow-400" />
                <span className="text-yellow-400 font-bold">TOP TRADE SELECTION</span>
                <Zap className="w-4 h-4 text-yellow-400" />
              </div>
            </div>
            <TopTradeCard signal={topTrade} />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            {signals.map(signal => (
              <SignalCard key={signal.id} signal={signal} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
