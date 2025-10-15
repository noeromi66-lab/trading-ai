import { TrendingUp, TrendingDown, Minus, Clock, Target, Shield, CheckCircle, XCircle } from 'lucide-react';

function formatCriteriaText(key: string): string {
  const criteriaMap: Record<string, string> = {
    'liquidity_sweep': 'Liquidity Sweep',
    'order_block': 'Order Block',
    'fair_value_gap': 'Fair Value Gap',
    'break_of_structure': 'Break of Structure',
    'in_killzone': 'Killzone Active',
    'ema_crossover': 'EMA Crossover',
    'ema_alignment': 'EMA Alignment',
    'price_near_ema200': 'Near EMA 200',
    'rsi_extreme': 'RSI Extreme',
    'high_volume': 'High Volume',
    'valid_asian_range': 'Valid Asian Range',
    'range_sweep': 'Range Sweep',
    'breakout_confirmed': 'Breakout Confirmed',
    'momentum_volume': 'Momentum Volume',
    'insufficient_data': 'Insufficient Data'
  };
  
  return criteriaMap[key] || key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

export default function SignalCard({ signal }: { signal: any }) {
  const getSignalColor = () => {
    if (signal.signal_type === 'BUY') return 'from-green-500 to-emerald-600';
    if (signal.signal_type === 'SELL') return 'from-red-500 to-rose-600';
    return 'from-slate-600 to-slate-700';
  };

  const getSignalIcon = () => {
    if (signal.signal_type === 'BUY') return <TrendingUp className="w-6 h-6" />;
    if (signal.signal_type === 'SELL') return <TrendingDown className="w-6 h-6" />;
    return <Minus className="w-6 h-6" />;
  };

  const getGradeColor = () => {
    if (signal.grade === 'A+' || signal.grade === 'A') return 'bg-green-500';
    if (signal.grade === 'B+' || signal.grade === 'B') return 'bg-amber-500';
    return 'bg-slate-500';
  };

  const formatPrice = (price: number | null) => {
    if (price === null) return '-';
    const pair = signal.trading_pairs?.symbol || '';
    return price.toFixed(pair === 'XAUUSD' ? 2 : 5);
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const criteriaPassed = signal.criteria_passed || {};
  const criteriaFailed = signal.criteria_failed || {};

  return (
    <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden hover:border-slate-700 transition-all">
      <div className={`bg-gradient-to-r ${getSignalColor()} p-3 md:p-4`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 md:gap-3">
            {getSignalIcon()}
            <div>
              <h3 className="text-lg md:text-xl font-bold">{signal.signal_type}</h3>
              <p className="text-xs md:text-sm opacity-90">
                {signal.trading_pairs?.display_name || signal.trading_pairs?.symbol}
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className={`${getGradeColor()} px-2 md:px-3 py-0.5 md:py-1 rounded-full text-xs md:text-sm font-bold mb-1`}>
              {signal.grade}
            </div>
            <p className="text-xs opacity-90">{Math.round(signal.confidence_score)}%</p>
          </div>
        </div>
      </div>

      <div className="p-4 md:p-6">
        <div className="flex flex-wrap items-center gap-2 md:gap-4 text-xs md:text-sm text-slate-400 mb-4">
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3 md:w-4 md:h-4" />
            {formatTime(signal.created_at)}
          </div>
          <span className="hidden sm:inline">•</span>
          <span className="text-amber-400 text-xs md:text-sm">{signal.strategy_used}</span>
          <span className="hidden sm:inline">•</span>
          <span className="text-xs md:text-sm">{signal.timeframe}</span>
          {signal.is_killzone && (
            <>
              <span className="hidden sm:inline">•</span>
              <span className="text-green-400 text-xs md:text-sm">Killzone</span>
            </>
          )}
        </div>

        {signal.signal_type !== 'HOLD' && signal.entry_price && (
          <div className="grid grid-cols-2 gap-2 md:gap-3 mb-4">
            <div className="bg-slate-800/50 p-2 md:p-3 rounded-lg">
              <div className="text-xs text-slate-400 mb-1">Entry</div>
              <div className="text-sm md:text-lg font-semibold">{formatPrice(signal.entry_price)}</div>
            </div>
            <div className="bg-slate-800/50 p-2 md:p-3 rounded-lg">
              <div className="flex items-center gap-1 text-xs text-slate-400 mb-1">
                <Shield className="w-3 h-3" />
                Stop Loss
              </div>
              <div className="text-sm md:text-lg font-semibold text-red-400">{formatPrice(signal.stop_loss)}</div>
            </div>
            <div className="bg-slate-800/50 p-2 md:p-3 rounded-lg">
              <div className="flex items-center gap-1 text-xs text-slate-400 mb-1">
                <Target className="w-3 h-3" />
                TP1
              </div>
              <div className="text-sm md:text-lg font-semibold text-green-400">{formatPrice(signal.tp1)}</div>
            </div>
            <div className="bg-slate-800/50 p-2 md:p-3 rounded-lg">
              <div className="flex items-center gap-1 text-xs text-slate-400 mb-1">
                <Target className="w-3 h-3" />
                TP2
              </div>
              <div className="text-lg font-semibold text-green-400">{formatPrice(signal.tp2)}</div>
            </div>
          </div>
        )}

        {signal.risk_reward_ratio && (
          <div className={`flex items-center gap-2 p-3 rounded-lg mb-4 ${
            signal.risk_reward_ratio >= 2
              ? 'bg-green-500/10 border border-green-500/20 text-green-400'
              : 'bg-amber-500/10 border border-amber-500/20 text-amber-400'
          }`}>
            <Target className="w-4 h-4" />
            <span className="text-sm font-medium">R:R = 1:{signal.risk_reward_ratio.toFixed(2)}</span>
          </div>
        )}

        {signal.explanation && (
          <div className="bg-slate-800/30 p-4 rounded-lg mb-4">
            <p className="text-sm text-slate-300 leading-relaxed">{signal.explanation}</p>
          </div>
        )}

        <div className="space-y-3">
          {Object.keys(criteriaPassed).length > 0 && (
            <div>
              <div className="text-xs font-medium text-green-400 mb-2">✓ Criteria Passed</div>
              <div className="flex flex-wrap gap-2">
                {Object.keys(criteriaPassed).map(key => (
                  <div key={key} className="flex items-center gap-1 px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-full text-xs text-green-400">
                    <CheckCircle className="w-3 h-3" />
                    {formatCriteriaText(key)}
                  </div>
                ))}
              </div>
            </div>
          )}

          {Object.keys(criteriaFailed).length > 0 && (
            <div>
              <div className="text-xs font-medium text-red-400 mb-2">✗ Criteria Failed</div>
              <div className="flex flex-wrap gap-2">
                {Object.keys(criteriaFailed).map(key => (
                  <div key={key} className="flex items-center gap-1 px-3 py-1 bg-red-500/10 border border-red-500/20 rounded-full text-xs text-red-400">
                    <XCircle className="w-3 h-3" />
                    {formatCriteriaText(key)}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
