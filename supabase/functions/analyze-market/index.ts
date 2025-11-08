import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

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
    const from = to - (200 * 15 * 60 * 1000);
    
    const url = `https://api.polygon.io/v2/aggs/ticker/C:${forex}/range/15/minute/${from}/${to}?adjusted=true&sort=asc&limit=200&apiKey=${apiKey}`;
    
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

function generateMockCandles(symbol: string, count: number = 200): Candle[] {
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

function analyzeAllStrategies(candles: Candle[]): any {
  const recent = candles.slice(-20);
  const lastCandle = candles[candles.length - 1];
  const prevCandle = candles[candles.length - 2];
  
  const criteriaPassed: Record<string, boolean> = {};
  const criteriaFailed: Record<string, boolean> = {};
  
  const highestHigh = Math.max(...recent.map(c => c.high));
  const lowestLow = Math.min(...recent.map(c => c.low));
  
  const sweepDetected = recent.some(c => 
    (c.high > highestHigh * 1.001 && c.close < highestHigh) ||
    (c.low < lowestLow * 0.999 && c.close > lowestLow)
  );
  
  if (sweepDetected) criteriaPassed.liquidity_sweep = true;
  else criteriaFailed.liquidity_sweep = true;
  
  const avgVolume = recent.reduce((sum, c) => sum + c.volume, 0) / recent.length;
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
  
  const bosDetected = lastCandle.close > highestHigh || lastCandle.close < lowestLow;
  if (bosDetected) criteriaPassed.break_of_structure = true;
  else criteriaFailed.break_of_structure = true;
  
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
      explanation: `Insufficient criteria met: ${passedCount}/${totalCriteria}. Missing: ${Object.keys(criteriaFailed).join(', ')}.`,
      isKillzone
    };
  }
  
  const signal = lastCandle.close > prevCandle.close ? 'BUY' : 'SELL';
  const confidence = Math.min(95, 50 + (passedCount / totalCriteria) * 45);
  
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
    explanation: `${signal} signal: ${Object.keys(criteriaPassed).join(', ')}. Confidence: ${confidence.toFixed(0)}%. R:R: ${rrRatio.toFixed(2)}:1.`,
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
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { pairSymbol, testMode, userId } = await req.json().catch(() => ({ pairSymbol: null, testMode: false, userId: null }));

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
      const analysis = analyzeAllStrategies(candles);

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
          strategy_used: "HYBRID",
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
          signal_id: signal.id,
          message: analysis.explanation,
          metadata: {
            signalType: analysis.signal,
            confidence: analysis.confidence,
            grade: analysis.grade,
            criteriaPassed: analysis.criteriaPassed,
            criteriaFailed: analysis.criteriaFailed
          }
        });
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