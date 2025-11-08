import type { Candle, StrategyResult } from '../types';

function calculateEMA(candles: Candle[], period: number): number[] {
  const ema: number[] = [];
  const multiplier = 2 / (period + 1);
  const sma = candles.slice(0, period).reduce((sum, c) => sum + c.close, 0) / period;
  ema.push(sma);
  for (let i = period; i < candles.length; i++) {
    const currentEMA = (candles[i].close - ema[ema.length - 1]) * multiplier + ema[ema.length - 1];
    ema.push(currentEMA);
  }
  return ema;
}

function calculateRSI(candles: Candle[], period: number = 14): number {
  if (candles.length < period + 1) return 50;
  const changes = candles.slice(-period - 1).map((c, i, arr) =>
    i === 0 ? 0 : c.close - arr[i - 1].close
  ).slice(1);
  const gains = changes.map(c => c > 0 ? c : 0);
  const losses = changes.map(c => c < 0 ? Math.abs(c) : 0);
  const avgGain = gains.reduce((a, b) => a + b, 0) / period;
  const avgLoss = losses.reduce((a, b) => a + b, 0) / period;
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
}

function calculateATR(candles: Candle[], period: number = 14): number {
  if (candles.length < period + 1) return 0;
  const recent = candles.slice(-period - 1);
  const trueRanges = recent.slice(1).map((c, i) => {
    const prevClose = recent[i].close;
    return Math.max(
      c.high - c.low,
      Math.abs(c.high - prevClose),
      Math.abs(c.low - prevClose)
    );
  });
  return trueRanges.reduce((a, b) => a + b, 0) / period;
}

export function analyzeEMAStrategy(candles: Candle[]): StrategyResult {
  if (candles.length < 200) {
    return {
      signal: 'HOLD',
      confidence: 0,
      criteriaPassed: {},
      criteriaFailed: { insufficient_data: true },
      explanation: 'Insufficient data for EMA strategy (need 200+ candles)',
      details: {}
    };
  }

  const ema50 = calculateEMA(candles, 50);
  const ema100 = calculateEMA(candles, 100);
  const ema200 = calculateEMA(candles, 200);
  const rsi = calculateRSI(candles);
  const atr = calculateATR(candles);

  const current50 = ema50[ema50.length - 1];
  const current100 = ema100[ema100.length - 1];
  const current200 = ema200[ema200.length - 1];
  const prev50 = ema50[ema50.length - 2];
  const prev100 = ema100[ema100.length - 2];
  const currentPrice = candles[candles.length - 1].close;

  const criteriaPassed: Record<string, boolean> = {};
  const criteriaFailed: Record<string, boolean> = {};

  const bullishCross = prev50 <= prev100 && current50 > current100;
  const bearishCross = prev50 >= prev100 && current50 < current100;
  if (bullishCross || bearishCross) {
    criteriaPassed.ema_crossover = true;
  } else {
    criteriaFailed.ema_crossover = true;
  }

  const bullishAlignment = current50 > current100 && current100 > current200;
  const bearishAlignment = current50 < current100 && current100 < current200;
  if (bullishAlignment || bearishAlignment) {
    criteriaPassed.ema_alignment = true;
  } else {
    criteriaFailed.ema_alignment = true;
  }

  const nearEMA200 = Math.abs(currentPrice - current200) / current200 < 0.01;
  if (nearEMA200) {
    criteriaPassed.price_near_ema200 = true;
  } else {
    criteriaFailed.price_near_ema200 = true;
  }

  const rsiExtreme = rsi < 35 || rsi > 65;
  if (rsiExtreme) {
    criteriaPassed.rsi_extreme = true;
  } else {
    criteriaFailed.rsi_extreme = true;
  }

  const avgVolume = candles.slice(-20).reduce((sum, c) => sum + c.volume, 0) / 20;
  const currentVolume = candles[candles.length - 1].volume;
  const highVolume = currentVolume > avgVolume * 1.2;
  if (highVolume) {
    criteriaPassed.high_volume = true;
  } else {
    criteriaFailed.high_volume = true;
  }

  const passedCount = Object.keys(criteriaPassed).length;
  const totalCriteria = passedCount + Object.keys(criteriaFailed).length;

  if (passedCount < 2) {
    return {
      signal: 'HOLD',
      confidence: (passedCount / totalCriteria) * 100,
      criteriaPassed,
      criteriaFailed,
      explanation: `EMA Momentum insufficient: ${passedCount}/${totalCriteria} criteria. Missing: ${Object.keys(criteriaFailed).join(', ')}.`,
      details: { rsi, atr, ema50: current50, ema100: current100, ema200: current200 }
    };
  }

  let signal: 'BUY' | 'SELL' = 'HOLD';
  if (bullishCross || (bullishAlignment && rsi < 50)) {
    signal = 'BUY';
  } else if (bearishCross || (bearishAlignment && rsi > 50)) {
    signal = 'SELL';
  }

  if (signal === 'HOLD') {
    return {
      signal: 'HOLD',
      confidence: (passedCount / totalCriteria) * 100,
      criteriaPassed,
      criteriaFailed,
      explanation: 'EMA criteria met but no clear directional bias',
      details: { rsi, atr }
    };
  }

  const confidence = Math.min(95, 45 + (passedCount / totalCriteria) * 50);

  return {
    signal,
    confidence,
    criteriaPassed,
    criteriaFailed,
    explanation: `EMA Momentum ${signal}: ${Object.keys(criteriaPassed).join(', ')}. RSI: ${rsi.toFixed(1)}.`,
    details: { rsi, atr, direction: signal, ema50: current50, ema100: current100 }
  };
}
