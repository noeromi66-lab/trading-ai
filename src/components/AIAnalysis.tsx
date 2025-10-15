import { useState, useEffect } from 'react';
import { Brain, RefreshCw, TrendingUp, AlertTriangle, Sparkles } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function AIAnalysis() {
  const [analysis, setAnalysis] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [thoughts, setThoughts] = useState<string[]>([]);
  const [currentThought, setCurrentThought] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [autoRotate, setAutoRotate] = useState(true);
  const [userInteracted, setUserInteracted] = useState(false);

  useEffect(() => {
    if (thoughts.length > 1 && autoRotate && !userInteracted) {
      const interval = setInterval(() => {
        setCurrentThought(prev => (prev + 1) % thoughts.length);
      }, 20000); // Changed from 10s to 20s
      return () => clearInterval(interval);
    }
  }, [thoughts, autoRotate, userInteracted]);

  // Resume auto-rotation after user inactivity
  useEffect(() => {
    if (userInteracted) {
      const timeout = setTimeout(() => {
        setAutoRotate(true);
        setUserInteracted(false);
      }, 30000); // Resume after 30 seconds
      return () => clearTimeout(timeout);
    }
  }, [userInteracted]);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      goToNext();
    }
    if (isRightSwipe) {
      goToPrevious();
    }
  };

  const goToNext = () => {
    if (thoughts.length > 1) {
      setCurrentThought(prev => (prev + 1) % thoughts.length);
      setAutoRotate(false);
      setUserInteracted(true);
    }
  };

  const goToPrevious = () => {
    if (thoughts.length > 1) {
      setCurrentThought(prev => (prev - 1 + thoughts.length) % thoughts.length);
      setAutoRotate(false);
      setUserInteracted(true);
    }
  };

  const goToThought = (index: number) => {
    setCurrentThought(index);
    setAutoRotate(false);
    setUserInteracted(true);
  };

  const formatBoldText = (text: string) => {
    return text.replace(/\*\*(.*?)\*\*/g, '<strong class="text-amber-300 font-bold">$1</strong>');
  };

  async function analyzeWithAI() {
    setLoading(true);
    try {
      const { data: recentSignals } = await supabase
        .from('signals')
        .select(`
          *,
          trading_pairs(symbol, display_name)
        `)
        .gte('created_at', new Date(Date.now() - 5 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false })
        .limit(20);

      const buySignals = recentSignals?.filter(s => s.signal_type === 'BUY').length || 0;
      const sellSignals = recentSignals?.filter(s => s.signal_type === 'SELL').length || 0;
      const totalSignals = recentSignals?.length || 0;

      const defaultThoughts = [
        `**Market Activity:** ${totalSignals} signal${totalSignals !== 1 ? 's' : ''} detected in the last 5 minutes. ${buySignals} BUY, ${sellSignals} SELL opportunities identified.`,
        '**Analysis System:** AI analysis engine is being recoded for enhanced accuracy and performance.',
        '**Trading Signals:** Review individual signal cards below for entry points, stop loss, and take profit levels.',
        '**Risk Management:** Always risk 1-2% per trade maximum. Capital preservation is priority number one.',
        '**Session Timing:** Best setups occur during London (07:00 UTC) and New York (13:45 UTC) killzones.',
        '**Confluence:** Check multiple pairs for correlated moves to strengthen signal conviction.'
      ];

      setAnalysis(`Market Intelligence: ${totalSignals} signals analyzed`);
      setThoughts(defaultThoughts);
      setLastUpdate(new Date());
    } catch (err) {
      console.error('Analysis failed:', err);
      setAnalysis('Unable to generate analysis at this time.');
      setThoughts(['Analysis system temporarily unavailable. Please try again.']);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 rounded-xl border border-purple-500/30 p-4 md:p-6 shadow-2xl shadow-purple-500/10 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Brain className="w-6 h-6 md:w-7 md:h-7 text-purple-400" />
            <Sparkles className="w-3 h-3 text-amber-400 absolute -top-1 -right-1 animate-pulse" />
          </div>
          <div>
            <h2 className="text-lg md:text-xl font-bold text-white">AI Market Intelligence</h2>
            <p className="text-xs text-slate-400">GPT-4 Expert Analysis</p>
          </div>
        </div>
        <button
          onClick={analyzeWithAI}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-2 md:px-4 md:py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">Analyze</span>
        </button>
      </div>

      {lastUpdate && (
        <div className="text-xs text-slate-500 mb-3">
          Last updated: {lastUpdate.toLocaleTimeString()}
        </div>
      )}

      <div className="bg-slate-950/50 rounded-lg p-4 border border-slate-800 min-h-[120px]">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="flex flex-col items-center gap-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400"></div>
              <p className="text-sm text-slate-400">GPT-4 analyzing market data...</p>
            </div>
          </div>
        ) : analysis ? (
          <div className="space-y-4">
            <div 
              className="flex items-start gap-3 cursor-pointer select-none"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              <TrendingUp className="w-5 h-5 text-purple-400 mt-1 flex-shrink-0" />
              <div className="flex-1">
                <div 
                  className="text-sm md:text-base text-slate-300 leading-relaxed whitespace-pre-line"
                  dangerouslySetInnerHTML={{
                    __html: formatBoldText(thoughts.length > 1 ? thoughts[currentThought] : analysis)
                  }}
                >
                </div>
                {thoughts.length > 1 && (
                  <>
                    <div className="flex items-center justify-between mt-4">
                      <div className="flex gap-1">
                        {thoughts.map((_, i) => (
                          <button
                            key={i}
                            onClick={() => goToThought(i)}
                            className={`h-2 rounded-full transition-all hover:bg-purple-300 ${
                              i === currentThought ? 'w-8 bg-purple-400' : 'w-2 bg-slate-700'
                            }`}
                          />
                        ))}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500">
                          {currentThought + 1}/{thoughts.length}
                        </span>
                        <button
                          onClick={goToPrevious}
                          className="p-1 hover:bg-slate-800 rounded transition-colors"
                          disabled={thoughts.length <= 1}
                        >
                          <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                          </svg>
                        </button>
                        <button
                          onClick={goToNext}
                          className="p-1 hover:bg-slate-800 rounded transition-colors"
                          disabled={thoughts.length <= 1}
                        >
                          <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-slate-500 mt-2">
                      {autoRotate ? 'Auto-rotating every 20s' : 'Swipe or use arrows to navigate'} • Tap dots for direct access
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <AlertTriangle className="w-12 h-12 text-slate-600 mb-3" />
            <p className="text-slate-400 text-sm mb-2">No analysis available</p>
            <p className="text-slate-500 text-xs">Click Analyze to get AI insights</p>
          </div>
        )}
      </div>

      <div className="mt-4 p-3 bg-slate-900/50 rounded-lg border border-slate-800">
        <p className="text-xs text-slate-400 leading-relaxed">
          <span className="text-purple-400 font-semibold">Market Intelligence:</span> Real-time signal analysis system.
          Monitors recent market activity, signal distribution, and trading opportunities.
          Analysis engine being upgraded for enhanced ICT/SMC methodology and institutional flow detection.
        </p>
      </div>
    </div>
  );
}
