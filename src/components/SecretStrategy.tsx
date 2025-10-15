import { useState } from 'react';
import { Lock, Unlock, TrendingUp, CheckCircle, Power } from 'lucide-react';

interface SecretStrategyProps {
  unlocked: boolean;
  activated: boolean;
  onUnlock: () => void;
  onToggleActivation: (activated: boolean) => void;
}

export default function SecretStrategy({ unlocked, activated, onUnlock, onToggleActivation }: SecretStrategyProps) {
  const [isRevealing, setIsRevealing] = useState(false);

  const handleReveal = () => {
    setIsRevealing(true);
    setTimeout(() => {
      onUnlock();
      onToggleActivation(true); // Auto-activate when revealed
    }, 500);
  };

  if (!unlocked && !isRevealing) {
    return (
      <div className="bg-gradient-to-br from-amber-900/20 to-amber-950/20 rounded-xl border-2 border-amber-500/30 p-8">
        <div className="flex items-center justify-center mb-6">
          <Lock className="w-16 h-16 text-amber-500 animate-pulse" />
        </div>

        <h3 className="text-2xl font-bold text-center mb-4 text-amber-400">
          SECRET'S STRATEGY
        </h3>

        <p className="text-center text-slate-300 mb-6">
          The professional strategy that achieves a 90%+ win rate.
          This combines the Killzone and Asian Session strategies used by institutional traders.
          Requires in-app notifications to receive setup checklists and trading alerts.
        </p>

        <button
          onClick={handleReveal}
          className="w-full py-4 bg-gradient-to-r from-amber-500 to-amber-600 rounded-lg font-bold text-lg hover:from-amber-600 hover:to-amber-700 transform hover:scale-105 transition-all"
        >
          REVEAL STRATEGY
        </button>
      </div>
    );
  }

  return (
    <>
      <div className={`bg-gradient-to-br from-slate-900 to-slate-950 rounded-xl border-2 border-amber-500 p-4 sm:p-8 transition-all duration-500 ${
      isRevealing ? 'animate-pulse' : ''
    }`}>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-0 mb-4 sm:mb-6">
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <Unlock className="w-6 h-6 sm:w-8 sm:h-8 text-amber-400" />
          <h3 className="text-xl sm:text-2xl font-bold text-amber-400">SECRET'S STRATEGY</h3>
          <div className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1 sm:py-2 bg-green-500/20 rounded-lg">
            <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-green-400" />
            <span className="text-green-400 font-bold text-sm sm:text-base">90%+ Win Rate</span>
          </div>
        </div>
        
          <button
            onClick={() => onToggleActivation(!activated)}
            className={`group relative overflow-hidden rounded-2xl px-6 py-3 transition-all duration-500 transform hover:scale-105 ${
              activated
                ? 'bg-gradient-to-r from-green-500 via-green-600 to-emerald-600 shadow-lg shadow-green-500/50'
                : 'bg-gradient-to-r from-slate-700 via-slate-600 to-slate-700 shadow-lg shadow-slate-900/50'
            }`}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-shimmer"></div>

            <div className="relative flex items-center gap-3">
              <div className={`relative w-12 h-6 rounded-full transition-all duration-300 ${
                activated ? 'bg-green-900/50' : 'bg-slate-800/50'
              }`}>
                <div className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-lg transition-all duration-300 transform ${
                  activated ? 'translate-x-6' : 'translate-x-0'
                }`}>
                  <div className={`absolute inset-0 rounded-full ${
                    activated ? 'bg-green-400/30 animate-pulse' : 'bg-slate-400/20'
                  }`}></div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Power className={`w-5 h-5 transition-all duration-300 ${
                  activated ? 'text-white drop-shadow-glow' : 'text-slate-300'
                }`} />
                <span className={`font-bold text-sm tracking-wide transition-all duration-300 ${
                  activated ? 'text-white drop-shadow-glow' : 'text-slate-200'
                }`}>
                  {activated ? 'ACTIVE' : 'INACTIVE'}
                </span>
              </div>
            </div>
          </button>
        </div>

      {/* Status Banner */}
      <div className={`mb-6 p-5 rounded-xl border-2 backdrop-blur-sm transition-all duration-500 ${
        activated
          ? 'bg-gradient-to-r from-green-500/20 via-green-600/15 to-emerald-500/20 border-green-400/40 shadow-lg shadow-green-500/20'
          : 'bg-gradient-to-r from-slate-800/60 via-slate-700/40 to-slate-800/60 border-slate-600/30'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`relative w-4 h-4 rounded-full ${
            activated ? 'bg-green-400 shadow-lg shadow-green-400/50' : 'bg-slate-500'
          }`}>
            {activated && (
              <div className="absolute inset-0 rounded-full bg-green-400 animate-ping opacity-75"></div>
            )}
          </div>
          <span className={`font-bold text-base leading-tight ${
            activated ? 'text-green-300' : 'text-slate-400'
          }`}>
            {activated ? '🚀 Strategy is ACTIVE - Auto-scan will use SECRET methodology' : '⏸️ Strategy is INACTIVE - Using standard analysis'}
          </span>
        </div>
      </div>
      
      <div className="space-y-4 sm:space-y-6">
        <div className="bg-slate-900/50 rounded-lg p-4 sm:p-6 border border-amber-500/20">
          <h4 className="text-lg sm:text-xl font-bold text-amber-400 mb-3 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6" />
            Killzone Strategy
          </h4>
          <p className="text-slate-300 mb-3 sm:mb-4 text-sm sm:text-base">
            Trade during the London (07:00-10:30) and New York (13:45-17:00) sessions when institutional money is most active.
          </p>

          <div className="space-y-2 sm:space-y-3">
            <div className="bg-slate-800/50 rounded-lg p-3 sm:p-4">
              <h5 className="font-semibold text-amber-300 mb-2 text-sm sm:text-base">Entry Checklist (Minimum 5/6):</h5>
              <ul className="space-y-1 text-xs sm:text-sm text-slate-300">
                <li>✓ Liquidity sweep (equal highs/lows cleared)</li>
                <li>✓ Break of Structure (ChoCH or BoS confirmed)</li>
                <li>✓ FVG or Order Block present in pivot zone</li>
                <li>✓ Trading within Killzone hours</li>
                <li>✓ Risk:Reward ratio ≥ 1:2</li>
                <li>✓ No major news in next 30 minutes</li>
              </ul>
            </div>

            <div className="bg-slate-800/50 rounded-lg p-3 sm:p-4">
              <h5 className="font-semibold text-amber-300 mb-2 text-sm sm:text-base">Trade Management:</h5>
              <ul className="space-y-1 text-xs sm:text-sm text-slate-300">
                <li>• Risk: 0.25% to 1% max per trade</li>
                <li>• At 1:2 RR: Take 50% profits, move SL to Break Even</li>
                <li>• Final TP: 1:3 to 1:5 RR or next liquidity zone</li>
                <li>• Max trades per day: 1-2 only</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="bg-slate-900/50 rounded-lg p-4 sm:p-6 border border-amber-500/20">
          <h4 className="text-lg sm:text-xl font-bold text-amber-400 mb-3 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6" />
            Asian Session Strategy
          </h4>
          <p className="text-slate-300 mb-3 sm:mb-4 text-sm sm:text-base">
            Mark the Asian range (00:00-06:00), then trade the fakeout during London Killzone (06:00-08:00).
          </p>

          <div className="space-y-2 sm:space-y-3">
            <div className="bg-slate-800/50 rounded-lg p-3 sm:p-4">
              <h5 className="font-semibold text-amber-300 mb-2 text-sm sm:text-base">Setup Requirements:</h5>
              <ul className="space-y-1 text-xs sm:text-sm text-slate-300">
                <li>✓ Define Asian High & Low (00:00-06:00)</li>
                <li>✓ Valid range size: 20-50 pips</li>
                <li>✓ Breakout then fakeout back into range</li>
                <li>✓ Structure shift (CHoCH) confirmed</li>
                <li>✓ Minimum 3 confluences present</li>
              </ul>
            </div>

            <div className="bg-slate-800/50 rounded-lg p-3 sm:p-4">
              <h5 className="font-semibold text-amber-300 mb-2 text-sm sm:text-base">Confluences (Need 3+):</h5>
              <ul className="space-y-1 text-xs sm:text-sm text-slate-300">
                <li>• Sweep of Asian extreme detected</li>
                <li>• Change of Character (CHoCH) confirmed</li>
                <li>• Order Block / Imbalance zone present</li>
                <li>• EMA alignment (20/50) favoring direction</li>
                <li>• Volume spike on reversal</li>
                <li>• RSI divergence detected</li>
              </ul>
            </div>

            <div className="bg-slate-800/50 rounded-lg p-3 sm:p-4">
              <h5 className="font-semibold text-amber-300 mb-2 text-sm sm:text-base">Entry Rules:</h5>
              <ul className="space-y-1 text-xs sm:text-sm text-slate-300">
                <li>• SL: Below/above Asian Low/High + buffer</li>
                <li>• TP: 1:2.5 to 1:3 RR minimum</li>
                <li>• Enter on M5/M15 timeframe precision</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-red-900/20 to-red-950/20 rounded-lg p-4 sm:p-6 border border-red-500/30">
          <h4 className="text-lg sm:text-xl font-bold text-red-400 mb-3">Golden Rules</h4>
          <ul className="space-y-1 sm:space-y-2 text-xs sm:text-sm text-slate-300">
            <li>❌ No revenge trading</li>
            <li>❌ No trades outside the plan</li>
            <li>❌ Stop immediately if daily drawdown hit</li>
            <li>✅ Journal every trade with screenshots</li>
            <li>✅ Daily review mandatory (wins and losses)</li>
            <li>✅ Reduce risk to 0.25% when up 5%+</li>
          </ul>
        </div>

        <div className="bg-gradient-to-r from-amber-900/20 to-amber-950/20 rounded-lg p-4 sm:p-6 border border-amber-500/30">
          <h4 className="text-lg sm:text-xl font-bold text-amber-400 mb-3">Daily Routine</h4>
          <div className="space-y-1 sm:space-y-2 text-xs sm:text-sm text-slate-300">
            <div className="flex items-start sm:items-center gap-2 sm:gap-3">
              <span className="font-mono text-amber-400 text-xs sm:text-sm flex-shrink-0">06:45</span>
              <span className="leading-tight">Analyze D1/H4, mark liquidity zones</span>
            </div>
            <div className="flex items-start sm:items-center gap-2 sm:gap-3">
              <span className="font-mono text-amber-400 text-xs sm:text-sm flex-shrink-0">07:00</span>
              <span className="leading-tight">Observe London Killzone</span>
            </div>
            <div className="flex items-start sm:items-center gap-2 sm:gap-3">
              <span className="font-mono text-amber-400 text-xs sm:text-sm flex-shrink-0">07:30-10:30</span>
              <span className="leading-tight">Execute if setup validated</span>
            </div>
            <div className="flex items-start sm:items-center gap-2 sm:gap-3">
              <span className="font-mono text-amber-400 text-xs sm:text-sm flex-shrink-0">13:45</span>
              <span className="leading-tight">Analyze New York session</span>
            </div>
            <div className="flex items-start sm:items-center gap-2 sm:gap-3">
              <span className="font-mono text-amber-400 text-xs sm:text-sm flex-shrink-0">14:30-17:00</span>
              <span className="leading-tight">Execute if NY setup validated</span>
            </div>
            <div className="flex items-start sm:items-center gap-2 sm:gap-3">
              <span className="font-mono text-amber-400 text-xs sm:text-sm flex-shrink-0">18:00</span>
              <span className="leading-tight">Journal + review + rest</span>
            </div>
          </div>
        </div>
      </div>
      </div>
    </>
  );
}