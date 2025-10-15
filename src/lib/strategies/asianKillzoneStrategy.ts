import type { Candle, StrategyResult } from '../types';

function isKillzoneActive(): { active: boolean; session: string } {
  const now = new Date();
  const utcHour = now.getUTCHours();

  if (utcHour >= 23 || utcHour < 2) return { active: true, session: 'Asian' };
  if (utcHour >= 7 && utcHour < 10) return { active: true, session: 'London' };
  if (utcHour >= 12 && utcHour < 15) return { active: true, session: 'New York' };

  return { active: false, session: 'None' };
}

function findAsianRange(candles: Candle[]): { high: number; low: number; valid: boolean } {
  const asianCandles = candles.slice(-30, -10);
  if (asianCandles.length < 10) {
    return { high: 0, low: 0, valid: false };
  }

  const high = Math.max(...asianCandles.map(c => c.high));
  const low = Math.min(...asianCandles.map(c => c.low));
  const range = high - low;
  const avgRange = asianCandles.reduce((sum, c) => sum + (c.high - c.low), 0) / asianCandles.length;

  const validRange = range < avgRange * 5 && range > avgRange * 0.5;

  return { high, low, valid: validRange };
}

export function analyzeAsianKillzoneStrategy(candles: Candle[]): StrategyResult {
  if (candles.length < 50) {
    return {
      signal: 'HOLD',
      confidence: 0,
      criteriaPassed: {},
      criteriaFailed: { insufficient_data: true },
      explanation: 'Insufficient data for Asian/Killzone strategy',
      details: {}
    };
  }

  const killzone = isKillzoneActive();
  const asianRange = findAsianRange(candles);
  const recent = candles.slice(-10);
  const lastCandle = candles[candles.length - 1];

  const criteriaPassed: Record<string, boolean> = {};
  const criteriaFailed: Record<string, boolean> = {};

  if (killzone.active) {
    criteriaPassed.in_killzone = true;
  } else {
    criteriaFailed.in_killzone = true;
  }

  if (asianRange.valid) {
    criteriaPassed.valid_asian_range = true;
  } else {
    criteriaFailed.valid_asian_range = true;
  }

  const sweepDetected = recent.some(c =>
    (c.high > asianRange.high && c.close < asianRange.high) ||
    (c.low < asianRange.low && c.close > asianRange.low)
  );
  if (sweepDetected) {
    criteriaPassed.range_sweep = true;
  } else {
    criteriaFailed.range_sweep = true;
  }

  const priceInsideRange = lastCandle.close > asianRange.low && lastCandle.close < asianRange.high;
  const priceAboveRange = lastCandle.close > asianRange.high;
  const priceBelowRange = lastCandle.close < asianRange.low;

  if (priceAboveRange || priceBelowRange) {
    criteriaPassed.breakout_confirmed = true;
  } else {
    criteriaFailed.breakout_confirmed = true;
  }

  const avgVolume = recent.reduce((sum, c) => sum + c.volume, 0) / recent.length;
  const recentHighVolume = recent.slice(-3).some(c => c.volume > avgVolume * 1.3);
  if (recentHighVolume) {
    criteriaPassed.momentum_volume = true;
  } else {
    criteriaFailed.momentum_volume = true;
  }

  const passedCount = Object.keys(criteriaPassed).length;
  const totalCriteria = passedCount + Object.keys(criteriaFailed).length;

  if (!killzone.active) {
    return {
      signal: 'HOLD',
      confidence: (passedCount / totalCriteria) * 100,
      criteriaPassed,
      criteriaFailed,
      explanation: 'The big players aren\'t at their desks yet. I prefer to trade when the institutions are active - London and New York sessions are where the real money moves. Let\'s wait for the right time.',
      details: { session: killzone.session, asianRange }
    };
  }

  if (passedCount < 3) {
    return {
      signal: 'HOLD',
      confidence: (passedCount / totalCriteria) * 100,
      criteriaPassed,
      criteriaFailed,
      explanation: 'The range is being respected, but I need to see a decisive break with conviction. The setup is forming nicely - just waiting for that institutional push to confirm direction.',
      details: { session: killzone.session, asianRange }
    };
  }

  let signal: 'BUY' | 'SELL' = 'HOLD';
  if (priceAboveRange && sweepDetected) {
    signal = 'BUY';
  } else if (priceBelowRange && sweepDetected) {
    signal = 'SELL';
  }

  if (signal === 'HOLD') {
    return {
      signal: 'HOLD',
      confidence: (passedCount / totalCriteria) * 100,
      criteriaPassed,
      criteriaFailed,
      explanation: 'In optimal trading session but breakout direction needs confirmation',
      details: { session: killzone.session, asianRange }
    };
  }

  const confidence = Math.min(95, 50 + (passedCount / totalCriteria) * 45);

  return {
    signal,
    confidence,
    criteriaPassed,
    criteriaFailed,
    explanation: `Perfect timing during the ${killzone.session} session. The breakout is clean and decisive - this is institutional money at work. The ${signal.toLowerCase()} momentum is undeniable here.`,
    details: { session: killzone.session, asianRange, direction: signal }
  };
}
