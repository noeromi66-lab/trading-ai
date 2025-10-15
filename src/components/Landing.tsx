import { TrendingUp, Zap, Shield, Activity, ArrowRight, CheckCircle } from 'lucide-react';

interface LandingProps {
  onGetStarted: () => void;
}

export default function Landing({ onGetStarted }: LandingProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      <div className="max-w-7xl mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-3 mb-6">
            <TrendingUp className="w-12 h-12 text-amber-400 animate-pulse" />
            <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent">
              Trading AI
            </h1>
          </div>
          <div className="inline-block px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-full mb-6">
            <p className="text-sm text-amber-400 font-medium">Application Re-Architected with Modular Strategy Engine</p>
          </div>
          <p className="text-xl md:text-2xl text-slate-300 max-w-3xl mx-auto mb-12 leading-relaxed">
            Advanced multi-strategy signal analysis with <span className="text-amber-400 font-semibold">SMC/ICT</span>,
            <span className="text-amber-400 font-semibold"> EMA Momentum</span>, and
            <span className="text-amber-400 font-semibold"> Asian/Killzone</span> detection
          </p>
          <button
            onClick={onGetStarted}
            className="group inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-amber-500 to-amber-600 rounded-lg text-lg font-medium hover:from-amber-600 hover:to-amber-700 transition-all shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 hover:scale-105"
          >
            Start Trading Smarter
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-16">
          <div className="relative bg-slate-900/50 backdrop-blur-sm rounded-xl border border-slate-800 p-6 hover:border-amber-500/50 transition-all group">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-3">SMC/ICT Strategy</h3>
              <p className="text-slate-400 mb-4">
                Smart Money Concepts with institutional-grade pattern detection
              </p>
              <ul className="space-y-2">
                {['Liquidity Sweeps', 'Order Blocks', 'Fair Value Gaps', 'Break of Structure'].map(item => (
                  <li key={item} className="flex items-center gap-2 text-sm text-slate-300">
                    <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="relative bg-slate-900/50 backdrop-blur-sm rounded-xl border border-slate-800 p-6 hover:border-amber-500/50 transition-all group">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center mb-4">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-3">EMA Momentum</h3>
              <p className="text-slate-400 mb-4">
                Multi-timeframe EMA analysis with volume confirmation
              </p>
              <ul className="space-y-2">
                {['EMA 50/100/200 Crossovers', 'RSI Extremes', 'Volume Spikes', 'Trend Alignment'].map(item => (
                  <li key={item} className="flex items-center gap-2 text-sm text-slate-300">
                    <CheckCircle className="w-4 h-4 text-blue-400 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="relative bg-slate-900/50 backdrop-blur-sm rounded-xl border border-slate-800 p-6 hover:border-amber-500/50 transition-all group">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative">
              <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-amber-600 rounded-lg flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Asian/Killzone</h3>
              <p className="text-slate-400 mb-4">
                Session-based trading with range sweep detection
              </p>
              <ul className="space-y-2">
                {['Asian Range Mapping', 'Killzone Detection', 'Range Sweeps', 'Breakout Confirmation'].map(item => (
                  <li key={item} className="flex items-center gap-2 text-sm text-slate-300">
                    <CheckCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl border border-slate-700 p-8 md:p-12 mb-16">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-4">Modular Architecture</h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              Complete re-architecture with independent strategy modules, comprehensive logging, and transparent decision-making
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-4 bg-slate-900/50 rounded-lg border border-slate-800">
                <div className="w-2 h-2 bg-green-400 rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <h4 className="font-medium text-white mb-1">Complete Audit Trail</h4>
                  <p className="text-sm text-slate-400">Every signal decision logged with criteria passed/failed breakdown</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 bg-slate-900/50 rounded-lg border border-slate-800">
                <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <h4 className="font-medium text-white mb-1">Risk/Reward Calculator</h4>
                  <p className="text-sm text-slate-400">Automatic entry, stop-loss, and take-profit calculation with grades A+ to C</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 bg-slate-900/50 rounded-lg border border-slate-800">
                <div className="w-2 h-2 bg-amber-400 rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <h4 className="font-medium text-white mb-1">Hybrid Signal Engine</h4>
                  <p className="text-sm text-slate-400">Multi-strategy consensus with confidence scoring and detailed explanations</p>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-4 bg-slate-900/50 rounded-lg border border-slate-800">
                <div className="w-2 h-2 bg-purple-400 rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <h4 className="font-medium text-white mb-1">Real-Time Activity Logs</h4>
                  <p className="text-sm text-slate-400">Full timeline of scans, signals generated, and signals rejected with reasons</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 bg-slate-900/50 rounded-lg border border-slate-800">
                <div className="w-2 h-2 bg-red-400 rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <h4 className="font-medium text-white mb-1">Flexible Filtering</h4>
                  <p className="text-sm text-slate-400">User-configurable confidence thresholds and grade minimums</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 bg-slate-900/50 rounded-lg border border-slate-800">
                <div className="w-2 h-2 bg-cyan-400 rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <h4 className="font-medium text-white mb-1">Test/QA Mode</h4>
                  <p className="text-sm text-slate-400">Built-in testing capabilities for signal generation validation</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to Experience Next-Gen Trading Analysis?</h2>
          <p className="text-slate-400 mb-8 max-w-2xl mx-auto">
            Join traders using our advanced multi-strategy engine to identify high-probability setups across major forex pairs and gold
          </p>
          <button
            onClick={onGetStarted}
            className="group inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-amber-500 to-amber-600 rounded-lg text-lg font-medium hover:from-amber-600 hover:to-amber-700 transition-all shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 hover:scale-105"
          >
            Get Started Now
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
}
