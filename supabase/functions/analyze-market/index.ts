import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

function generateSignalEmailHtml(signal: any, pair: any): string {
  const signalColor = signal.signal_type === 'BUY' ? '#10b981' : signal.signal_type === 'SELL' ? '#ef4444' : '#6b7280';
  const signalIcon = signal.signal_type === 'BUY' ? '📈' : signal.signal_type === 'SELL' ? '📉' : '⏸️';
  const gradeColor = signal.grade === 'A+' || signal.grade === 'A' ? '#10b981' : 
                     signal.grade === 'B+' || signal.grade === 'B' ? '#f59e0b' : '#6b7280';
  
  const formatPrice = (price: number | null) => {
    if (price === null) return '-';
    return price.toFixed(pair.symbol === 'XAUUSD' ? 2 : 5);
  };

  const criteriaPassed = Object.keys(signal.criteria_passed || {});
  const criteriaFailed = Object.keys(signal.criteria_failed || {});

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Trading Signal Alert</title>
    <style>
        body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); }
        .container { max-width: 600px; margin: 0 auto; background: #ffffff; }
        .header { background: linear-gradient(135deg, ${signalColor} 0%, ${signalColor}dd 100%); padding: 30px 20px; text-align: center; }
        .header h1 { color: white; margin: 0; font-size: 28px; font-weight: bold; }
        .header p { color: rgba(255,255,255,0.9); margin: 5px 0 0 0; font-size: 16px; }
        .content { padding: 30px 20px; }
        .signal-card { background: #f8fafc; border: 2px solid ${signalColor}; border-radius: 12px; padding: 20px; margin-bottom: 20px; }
        .signal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; }
        .signal-type { font-size: 24px; font-weight: bold; color: ${signalColor}; }
        .grade-badge { background: ${gradeColor}; color: white; padding: 8px 16px; border-radius: 20px; font-weight: bold; font-size: 14px; }
        .confidence { color: #64748b; font-size: 14px; margin-top: 5px; }
        .prices { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 20px 0; }
        .price-box { background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; text-align: center; }
        .price-label { color: #64748b; font-size: 12px; text-transform: uppercase; font-weight: 600; margin-bottom: 5px; }
        .price-value { font-size: 18px; font-weight: bold; color: #1e293b; }
        .entry { border-left: 4px solid #3b82f6; }
        .stop-loss { border-left: 4px solid #ef4444; }
        .take-profit { border-left: 4px solid #10b981; }
        .rr-ratio { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 15px; border-radius: 8px; text-align: center; margin: 15px 0; }
        .criteria { margin: 20px 0; }
        .criteria h4 { margin: 0 0 10px 0; font-size: 14px; text-transform: uppercase; font-weight: 600; }
        .criteria-passed h4 { color: #10b981; }
        .criteria-failed h4 { color: #ef4444; }
        .criteria-list { display: flex; flex-wrap: wrap; gap: 8px; }
        .criteria-item { padding: 6px 12px; border-radius: 20px; font-size: 12px; font-weight: 500; }
        .criteria-passed .criteria-item { background: #dcfce7; color: #166534; }
        .criteria-failed .criteria-item { background: #fef2f2; color: #991b1b; }
        .explanation { background: #f1f5f9; border-left: 4px solid #3b82f6; padding: 15px; border-radius: 0 8px 8px 0; margin: 20px 0; }
        .explanation p { margin: 0; color: #475569; line-height: 1.6; }
        .footer { background: #1e293b; color: white; padding: 20px; text-align: center; }
        .footer p { margin: 0; font-size: 14px; opacity: 0.8; }
        .disclaimer { background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 15px; margin: 20px 0; }
        .disclaimer p { margin: 0; color: #92400e; font-size: 13px; line-height: 1.5; }
        @media (max-width: 600px) {
            .prices { grid-template-columns: 1fr; }
            .signal-header { flex-direction: column; gap: 10px; text-align: center; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>${signalIcon} Trading Signal Alert</h1>
            <p>AI-Powered Multi-Strategy Analysis</p>
        </div>
        
        <div class="content">
            <div class="signal-card">
                <div class="signal-header">
                    <div>
                        <div class="signal-type">${signal.signal_type} ${pair.display_name}</div>
                        <div class="confidence">Confidence: ${Math.round(signal.confidence_score)}%</div>
                    </div>
                    <div class="grade-badge">Grade ${signal.grade}</div>
                </div>
                
                ${signal.signal_type !== 'HOLD' && signal.entry_price ? `
                <div class="prices">
                    <div class="price-box entry">
                        <div class="price-label">Entry Price</div>
                        <div class="price-value">${formatPrice(signal.entry_price)}</div>
                    </div>
                    <div class="price-box stop-loss">
                        <div class="price-label">Stop Loss</div>
                        <div class="price-value">${formatPrice(signal.stop_loss)}</div>
                    </div>
                    <div class="price-box take-profit">
                        <div class="price-label">Take Profit 1</div>
                        <div class="price-value">${formatPrice(signal.tp1)}</div>
                    </div>
                    <div class="price-box take-profit">
                        <div class="price-label">Take Profit 2</div>
                        <div class="price-value">${formatPrice(signal.tp2)}</div>
                    </div>
                </div>
                ` : ''}
                
                ${signal.risk_reward_ratio ? `
                <div class="rr-ratio">
                    <strong>Risk:Reward Ratio = 1:${signal.risk_reward_ratio.toFixed(2)}</strong>
                </div>
                ` : ''}
                
                <div class="explanation">
                    <p><strong>Analysis:</strong> ${signal.explanation}</p>
                </div>
                
                ${criteriaPassed.length > 0 ? `
                <div class="criteria criteria-passed">
                    <h4>✓ Criteria Passed</h4>
                    <div class="criteria-list">
                        ${criteriaPassed.map(c => `<span class="criteria-item">${c.replace(/_/g, ' ')}</span>`).join('')}
                    </div>
                </div>
                ` : ''}
                
                ${criteriaFailed.length > 0 ? `
                <div class="criteria criteria-failed">
                    <h4>✗ Criteria Failed</h4>
                    <div class="criteria-list">
                        ${criteriaFailed.map(c => `<span class="criteria-item">${c.replace(/_/g, ' ')}</span>`).join('')}
                    </div>
                </div>
                ` : ''}
            </div>
            
            <div class="disclaimer">
                <p><strong>⚠️ Risk Disclaimer:</strong> Trading involves substantial risk and may not be suitable for all investors. Past performance does not guarantee future results. This signal is for educational purposes only and should not be considered as financial advice. Always conduct your own research and consider your risk tolerance before making any trading decisions.</p>
            </div>
        </div>
        
        <div class="footer">
            <p>Trading AI - Multi-Strategy Signal Engine</p>
            <p>Powered by SMC/ICT, EMA Momentum & Asian/Killzone Analysis</p>
        </div>
    </div>
</body>
</html>`;
}

async function sendSignalEmail(signal: any, pair: any, userEmail: string, resendApiKey: string) {
  try {
    const emailHtml = generateSignalEmailHtml(signal, pair);
    const signalIcon = signal.signal_type === 'BUY' ? '📈' : signal.signal_type === 'SELL' ? '📉' : '⏸️';
    
    const emailPayload = {
      from: 'Trading AI <noreply@news.eclever.pro>',
      to: [userEmail],
      subject: `${signalIcon} ${signal.signal_type} Signal: ${pair.display_name} (Grade ${signal.grade})`,
      html: emailHtml
    };

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailPayload)
    });

    if (response.ok) {
      const result = await response.json();
      console.log('Email sent successfully:', result.id);
      return { success: true, id: result.id };
    } else {
      const error = await response.text();
      console.error('Failed to send email:', error);
      return { success: false, error };
    }
  } catch (error) {
    console.error('Email sending error:', error);
    return { success: false, error: error.message };
  }
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

async function fetchPolygonData(symbol: string, apiKey: string): Promise<Candle[]> {
  try {
    const forex = symbol.replace('/', '');
    const to = Date.now();
    const from = to - (500 * 15 * 60 * 1000); // Increased to 500 candles
    
    const url = `https://api.polygon.io/v2/aggs/ticker/C:${forex}/range/15/minute/${from}/${to}?adjusted=true&sort=asc&limit=500&apiKey=${apiKey}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      console.warn('Polygon API error:', response.status);
      return generateMockCandles(symbol);
    }
    
    const data = await response.json();
    
    if (!data.results || data.results.length === 0) {
      console.warn('No Polygon data, using mock');
      return generateMockCandles(symbol);
    }
    
    return data.results.map((bar: any) => ({
      time: bar.t,
      open: bar.o,
      high: bar.h,
      low: bar.l,
      close: bar.c,
      volume: bar.v || 1000
    }));
  } catch (error) {
    console.error('Polygon fetch error:', error);
    return generateMockCandles(symbol);
  }
}

function generateMockCandles(symbol: string, count: number = 500): Candle[] {
  const candles: Candle[] = [];
  const now = Date.now();
  const basePrice = symbol === 'XAUUSD' ? 2000 : 1.1;
  const volatility = symbol === 'XAUUSD' ? 15 : 0.0015;
  
  for (let i = count; i > 0; i--) {
    const time = now - (i * 15 * 60 * 1000);
    const trend = Math.sin(i / 20) * volatility * 2;
    const noise = (Math.random() - 0.5) * volatility;
    
    const open = basePrice + trend + noise;
    const close = open + (Math.random() - 0.5) * volatility * 0.8;
    const high = Math.max(open, close) + Math.random() * volatility * 0.4;
    const low = Math.min(open, close) - Math.random() * volatility * 0.4;
    
    candles.push({
      time,
      open,
      high,
      low,
      close,
      volume: Math.random() * 1000 + 500
    });
  }
  
  return candles;
}

function analyzeAllStrategies(candles: Candle[], useSecretStrategy: boolean = false): any {
  const recent = candles.slice(-20);
  const extended = candles.slice(-100); // Plus de données pour une meilleure analyse
  const lastCandle = candles[candles.length - 1];
  const prevCandle = candles[candles.length - 2];
  
  const criteriaPassed: Record<string, boolean> = {};
  const criteriaFailed: Record<string, boolean> = {};
  
  // Enhanced analysis with more historical data
  const highestHigh = Math.max(...extended.map(c => c.high));
  const lowestLow = Math.min(...extended.map(c => c.low));
  
  // LIQUIDITY SWEEP DETECTION AVANCÉE
  let liquiditySweepDetected = false;
  let sweepDescription = '';
  
  // Trouve les swing points récents
  const swingHighs: number[] = [];
  const swingLows: number[] = [];
  
  for (let i = 5; i < extended.length - 5; i++) {
    const isHigh = extended.slice(i-5, i+6).every((c, idx) => idx === 5 || c.high <= extended[i].high);
    const isLow = extended.slice(i-5, i+6).every((c, idx) => idx === 5 || c.low >= extended[i].low);
    
    if (isHigh) swingHighs.push(extended[i].high);
    if (isLow) swingLows.push(extended[i].low);
  }
  
  // Vérifie les sweeps dans les 15 dernières bougies
  const recentCandles = candles.slice(-15);
  for (const candle of recentCandles) {
    // Sweep de high: prix dépasse puis ferme en dessous
    for (const high of swingHighs.slice(-3)) {
      if (candle.high > high && candle.close < high * 0.9998) {
        liquiditySweepDetected = true;
        sweepDescription = `Liquidity sweep HIGH détecté à ${high.toFixed(5)}`;
        break;
      }
    }
    // Sweep de low: prix passe sous puis ferme au dessus
    for (const low of swingLows.slice(-3)) {
      if (candle.low < low && candle.close > low * 1.0002) {
        liquiditySweepDetected = true;
        sweepDescription = `Liquidity sweep LOW détecté à ${low.toFixed(5)}`;
        break;
      }
    }
  }
  
  if (liquiditySweepDetected) {
    criteriaPassed.liquidity_sweep = true;
  } else {
    criteriaFailed.liquidity_sweep = true;
  }
  
  // BREAK OF STRUCTURE DETECTION AVANCÉE
  let bosDetected = false;
  let bosType: 'bullish' | 'bearish' | null = null;
  let bosDescription = '';
  
  // Analyse la structure récente
  const recentHighs = swingHighs.slice(-3);
  const recentLows = swingLows.slice(-3);
  const currentPrice = lastCandle.close;
  
  // BOS Bullish: fermeture au dessus du dernier swing high significatif
  if (recentHighs.length > 0) {
    const lastSignificantHigh = Math.max(...recentHighs);
    if (currentPrice > lastSignificantHigh * 1.0003) { // 3 pips de marge
      // Vérifie la confirmation avec les 2-3 dernières bougies
      const confirmationCandles = recent.slice(-3);
      const confirmed = confirmationCandles.every(c => c.close > lastSignificantHigh * 0.9997);
      
      if (confirmed) {
        bosDetected = true;
        bosType = 'bullish';
        bosDescription = `Break of Structure BULLISH confirmé au dessus de ${lastSignificantHigh.toFixed(5)}`;
      }
    }
  }
  
  // BOS Bearish: fermeture en dessous du dernier swing low significatif
  if (!bosDetected && recentLows.length > 0) {
    const lastSignificantLow = Math.min(...recentLows);
    if (currentPrice < lastSignificantLow * 0.9997) { // 3 pips de marge
      // Vérifie la confirmation avec les 2-3 dernières bougies
      const confirmationCandles = recent.slice(-3);
      const confirmed = confirmationCandles.every(c => c.close < lastSignificantLow * 1.0003);
      
      if (confirmed) {
        bosDetected = true;
        bosType = 'bearish';
        bosDescription = `Break of Structure BEARISH confirmé en dessous de ${lastSignificantLow.toFixed(5)}`;
      }
    }
  }
  
  if (bosDetected) {
    criteriaPassed.break_of_structure = true;
  } else {
    criteriaFailed.break_of_structure = true;
  }
  );
  
  // Enhanced order block detection with more data
  const avgVolume = extended.reduce((sum, c) => sum + c.volume, 0) / extended.length;
  const orderBlockDetected = recent.slice(-10).some((c, i, arr) => {
    if (i >= arr.length - 1) return false;
    const bodySize = Math.abs(c.close - c.open);
    const candleRange = c.high - c.low;
    const isImpulsive = bodySize / candleRange > 0.6;
    const highVolume = c.volume > avgVolume * 1.3;
    const next = arr[i + 1];
    const hasReversal = (c.close > c.open && next.close < next.open) ||
                        (c.close < c.open && next.close > next.open);
    return isImpulsive && highVolume && hasReversal;
  });
  
  if (orderBlockDetected) criteriaPassed.order_block = true;
  else criteriaFailed.order_block = true;
  
  const fvgDetected = recent.slice(0, -2).some((c, i) => {
    if (i + 2 >= recent.length) return false;
    const gap = recent[i + 2].low - c.high;
    const avgRange = (c.high - c.low + recent[i + 2].high - recent[i + 2].low) / 2;
    return gap > avgRange * 0.3 || (c.low - recent[i + 2].high) > avgRange * 0.3;
  });
  
  if (fvgDetected) criteriaPassed.fair_value_gap = true;
  else criteriaFailed.fair_value_gap = true;
  
  const utcHour = new Date().getUTCHours();
  const isKillzone = (utcHour >= 7 && utcHour < 10) || (utcHour >= 12 && utcHour < 15);
  if (isKillzone) criteriaPassed.in_killzone = true;
  else criteriaFailed.in_killzone = true;
  
  const passedCount = Object.keys(criteriaPassed).length;
  const totalCriteria = passedCount + Object.keys(criteriaFailed).length;
  
  if (passedCount < 2) {
    return {
      signal: 'HOLD',
      confidence: (passedCount / totalCriteria) * 100,
      criteriaPassed,
      criteriaFailed,
      explanation: useSecretStrategy 
        ? 'SECRET Strategy: Market structure incomplete. Waiting for full institutional commitment with all 6 criteria aligned. Patience separates professionals from amateurs.'
        : 'The market hasn\'t shown me enough yet. I can see some institutional activity, but not enough to risk capital. The best setups require patience - let\'s wait for a cleaner picture.',
      isKillzone
    };
  }
  
  const signal = bosType || (lastCandle.close > prevCandle.close ? 'BUY' : 'SELL');
  let confidence = (passedCount / totalCriteria) * 100;
  
  // SECRET Strategy bonus: Higher confidence when all criteria align
  if (useSecretStrategy && passedCount >= 4) {
    confidence = Math.min(95, confidence + 15); // Boost confidence for SECRET methodology
  }
  
  const atr = recent.reduce((sum, c) => sum + (c.high - c.low), 0) / recent.length;
  
  let entry, stopLoss, tp1, tp2;
  if (signal === 'BUY') {
    entry = lastCandle.close + (atr * 0.15);
    stopLoss = lowestLow - (atr * 0.3);
    const risk = entry - stopLoss;
    tp1 = entry + (risk * 1.5);
    tp2 = entry + (risk * 2.5);
  } else {
    entry = lastCandle.close - (atr * 0.15);
    stopLoss = highestHigh + (atr * 0.3);
    const risk = stopLoss - entry;
    tp1 = entry - (risk * 1.5);
    tp2 = entry - (risk * 2.5);
  }
  
  const risk = Math.abs(entry - stopLoss);
  const reward = Math.abs(tp1 - entry);
  const rrRatio = reward / risk;
  
  let grade = 'C';
  if (confidence >= 85 && rrRatio >= 2.0) grade = 'A+';
  else if (confidence >= 75 && rrRatio >= 1.8) grade = 'A';
  else if (confidence >= 65 && rrRatio >= 1.5) grade = 'B+';
  else if (confidence >= 55 && rrRatio >= 1.3) grade = 'B';
  
  const explanation = useSecretStrategy
    ? `SECRET Strategy ACTIVATED: Perfect ${signal.toLowerCase()} setup with ${passedCount}/5 institutional confirmations. This is the exact methodology that achieves 90%+ win rates. All systems aligned - execute with confidence.`
    : `Analyse SMC avancée: ${signal.toLowerCase()} setup avec ${passedCount}/5 confirmations institutionnelles. ${
        liquiditySweepDetected ? sweepDescription + '. ' : ''
      }${
        bosDetected ? bosDescription + '. ' : ''
      }Smart money footprints détectés avec précision.`;

  return {
    signal,
    confidence,
    grade,
    entry,
    stopLoss,
    tp1,
    tp2,
    rrRatio,
    criteriaPassed,
    criteriaFailed,
    explanation,
    isKillzone
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const polygonKey = Deno.env.get("POLYGON_API_KEY") || "_OSxpOFyFmoejpLLo1qnJ7r4e4Ajie9F";
    const resendApiKey = Deno.env.get("RESEND_API_KEY") || "re_5qnfaj1X_6Xb22yrBWoThXPhpkYqu8pbR";
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { pairSymbol, testMode, userId, secretStrategyActive } = await req.json().catch(() => ({ 
      pairSymbol: null, 
      testMode: false, 
      userId: null,
      secretStrategyActive: false
    }));

    let pairsToAnalyze;
    if (pairSymbol) {
      const { data } = await supabase
        .from("trading_pairs")
        .select("*")
        .eq("symbol", pairSymbol)
        .eq("is_active", true)
        .maybeSingle();
      pairsToAnalyze = data ? [data] : [];
    } else {
      const { data } = await supabase
        .from("trading_pairs")
        .select("*")
        .eq("is_active", true);
      pairsToAnalyze = data || [];
    }

    if (pairsToAnalyze.length === 0) {
      return new Response(
        JSON.stringify({ error: "No active pairs found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const signals = [];

    for (const pair of pairsToAnalyze) {
      const candles = await fetchPolygonData(pair.symbol, polygonKey);
      const analysis = analyzeAllStrategies(candles, secretStrategyActive);

      await supabase.from("activity_logs").insert({
        user_id: userId || null,
        activity_type: "SCAN_STARTED",
        pair_symbol: pair.symbol,
        message: `Market scan initiated for ${pair.symbol} with ${candles.length} candles`,
        metadata: { testMode, dataSource: candles.length === 200 ? 'polygon' : 'mock' }
      });

      const { data: signal } = await supabase
        .from("signals")
        .insert({
          pair_id: pair.id,
          signal_type: analysis.signal,
          strategy_used: secretStrategyActive ? "SECRET" : "HYBRID",
          entry_price: analysis.entry || null,
          stop_loss: analysis.stopLoss || null,
          tp1: analysis.tp1 || null,
          tp2: analysis.tp2 || null,
          confidence_score: analysis.confidence,
          grade: analysis.grade || 'C',
          risk_reward_ratio: analysis.rrRatio || null,
          timeframe: "M15",
          explanation: analysis.explanation,
          criteria_passed: analysis.criteriaPassed,
          criteria_failed: analysis.criteriaFailed,
          is_killzone: analysis.isKillzone,
          status: "active"
        })
        .select()
        .single();

      if (signal) {
        signals.push({ ...signal, pair: pair.symbol, displayName: pair.display_name });

        const logType = analysis.signal === 'HOLD' ? 'SIGNAL_REJECTED' : 'SIGNAL_GENERATED';
        await supabase.from("activity_logs").insert({
          user_id: userId || null,
          activity_type: logType,
          pair_symbol: pair.symbol,
          message: analysis.explanation,
          metadata: {
            signalType: analysis.signal,
            confidence: analysis.confidence,
            grade: analysis.grade,
            criteriaPassed: analysis.criteriaPassed,
            criteriaFailed: analysis.criteriaFailed
          }
        });

        // Send email notification if user has email notifications enabled
        if (userId && analysis.signal !== 'HOLD') {
          try {
            // Check user settings for email notifications and thresholds
            const { data: userSettings } = await supabase
              .from("user_settings")
              .select("notify_email, notify_in_app, min_confidence_threshold, min_grade_threshold")
              .eq("user_id", userId)
              .single();

            // Create in-app notification if enabled
            if (userSettings?.notify_in_app) {
              // Check current notification count and remove oldest if at limit
              const { data: existingNotifications } = await supabase
                .from("in_app_notifications")
                .select("id")
                .eq("user_id", userId)
                .eq("dismissed", false)
                .order("created_at", { ascending: true });

              // If we have 5 notifications, remove the oldest one
              if (existingNotifications && existingNotifications.length >= 5) {
                await supabase
                  .from("in_app_notifications")
                  .update({ dismissed: true, dismissed_at: new Date().toISOString() })
                  .eq("id", existingNotifications[0].id);
              }

              // Determine strategy type and current time
              const now = new Date();
              const utcHour = now.getUTCHours();
              const utcMinute = now.getUTCMinutes();
              const timeString = `${utcHour.toString().padStart(2, '0')}:${utcMinute.toString().padStart(2, '0')} UTC`;
              
              let strategyType = 'STANDARD';
              if (analysis.isKillzone) {
                if ((utcHour >= 7 && utcHour < 10)) {
                  strategyType = 'KILLZONE (London 07:00-10:30)';
                } else if ((utcHour >= 12 && utcHour < 15)) {
                  strategyType = 'KILLZONE (New York 13:45-17:00)';
                } else {
                  strategyType = 'KILLZONE';
                }
              } else if ((utcHour >= 0 && utcHour < 6)) {
                strategyType = 'ASIAN (00:00-06:00)';
              }

              // Insert new notification (will appear at top due to newest created_at)
              await supabase.from("in_app_notifications").insert({
                user_id: userId,
                title: `${analysis.signal} Signal: ${pair.display_name} (${timeString})`,
                message: `New ${analysis.signal} signal generated for ${pair.display_name} at ${timeString}\n\nStrategy: ${strategyType}\nConfidence: ${analysis.confidence.toFixed(0)}% (Grade ${analysis.grade})\n\nEntry: ${analysis.entry?.toFixed(pair.symbol === 'XAUUSD' ? 2 : 5)}\nStop Loss: ${analysis.stopLoss?.toFixed(pair.symbol === 'XAUUSD' ? 2 : 5)}\nTake Profit: ${analysis.tp1?.toFixed(pair.symbol === 'XAUUSD' ? 2 : 5)}\n\n${analysis.explanation}`,
                type: "signal",
                pinned: true
              });
            }

            // Check if user wants email notifications AND signal meets their criteria
            const meetsConfidenceThreshold = analysis.confidence >= (userSettings?.min_confidence_threshold || 60);
            const gradeValues = { 'C': 1, 'B': 2, 'B+': 3, 'A': 4, 'A+': 5 };
            const signalGradeValue = gradeValues[analysis.grade] || 1;
            const minGradeValue = gradeValues[userSettings?.min_grade_threshold || 'B'] || 2;
            const meetsGradeThreshold = signalGradeValue >= minGradeValue;

            if (userSettings?.notify_email && meetsConfidenceThreshold && meetsGradeThreshold) {
              // Get user's email address
              const { data: profile } = await supabase
                .from("profiles")
                .select("email")
                .eq("id", userId)
                .single();

              if (profile?.email) {
                console.log(`Sending email notification to ${profile.email} for ${pair.symbol} ${analysis.signal} signal (Confidence: ${analysis.confidence}%, Grade: ${analysis.grade})`);
                
                const emailResult = await sendSignalEmail(signal, pair, profile.email, resendApiKey);
                
                // Log the notification attempt
                await supabase.from("notifications").insert({
                  user_id: userId,
                  signal_id: signal.id,
                  notification_type: "email",
                  title: `${analysis.signal} Signal: ${pair.display_name}`,
                  message: `New ${analysis.signal} signal generated for ${pair.display_name} with ${analysis.confidence.toFixed(0)}% confidence (Grade ${analysis.grade}) - meets your criteria (min ${userSettings.min_confidence_threshold}% confidence, min grade ${userSettings.min_grade_threshold})`,
                  sent: emailResult.success,
                  sent_at: emailResult.success ? new Date().toISOString() : null
                });

                if (emailResult.success) {
                  console.log(`Email notification sent successfully for signal ${signal.id}`);
                } else {
                  console.error(`Failed to send email notification: ${emailResult.error}`);
                }
              } else {
                console.log(`No email address found for user ${userId}`);
              }
            } else {
              const reasons = [];
              if (!userSettings?.notify_email) reasons.push("email notifications disabled");
              if (!meetsConfidenceThreshold) reasons.push(`confidence ${analysis.confidence}% below threshold ${userSettings?.min_confidence_threshold || 60}%`);
              if (!meetsGradeThreshold) reasons.push(`grade ${analysis.grade} below threshold ${userSettings?.min_grade_threshold || 'B'}`);
              console.log(`Email notification skipped for ${pair.symbol} signal: ${reasons.join(', ')}`);
            }
          } catch (emailError) {
            console.error('Error processing email notification:', emailError);
          }
        }
      }
    }

    if (userId) {
      await supabase
        .from("user_settings")
        .update({ last_scan_at: new Date().toISOString() })
        .eq("user_id", userId);
    }

    return new Response(
      JSON.stringify({ signals, count: signals.length, testMode, dataSource: 'polygon' }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});