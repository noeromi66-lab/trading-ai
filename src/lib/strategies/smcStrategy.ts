import type { Candle, StrategyResult, SwingPoint } from '../types';

export function findSwingPoints(candles: Candle[], lookback: number = 5): SwingPoint[] {
  const swings: SwingPoint[] = [];
  for (let i = lookback; i < candles.length - lookback; i++) {
    const highs = candles.slice(i - lookback, i + lookback + 1).map(c => c.high);
    const lows = candles.slice(i - lookback, i + lookback + 1).map(c => c.low);
    const currentHigh = candles[i].high;
    const currentLow = candles[i].low;
    if (currentHigh === Math.max(...highs)) {
      swings.push({ index: i, price: currentHigh, type: 'high' });
    }
    if (currentLow === Math.min(...lows)) {
      swings.push({ index: i, price: currentLow, type: 'low' });
    }
  }
  return swings;
}

export function analyzeSMCStrategy(candles: Candle[]): StrategyResult {
  if (candles.length < 30) {
    return {
      signal: 'HOLD',
      confidence: 0,
      criteriaPassed: {},
      criteriaFailed: { insufficient_data: true },
      explanation: 'Insufficient candle data for SMC analysis',
      details: {}
    };
  }

  const swings = findSwingPoints(candles);
  const recent = candles.slice(-20);
  const lastCandle = candles[candles.length - 1];

  const criteriaPassed: Record<string, boolean> = {};
  const criteriaFailed: Record<string, boolean> = {};

  const highestHigh = Math.max(...recent.map(c => c.high));
  const lowestLow = Math.min(...recent.map(c => c.low));

  const sweepDetected = recent.some(c =>
    (c.high > highestHigh && c.close < highestHigh) ||
    (c.low < lowestLow && c.close > lowestLow)
  );
  if (sweepDetected) criteriaPassed.liquidity_sweep = true;
  else criteriaFailed.liquidity_sweep = true;

  const avgVolume = recent.reduce((sum, c) => sum + c.volume, 0) / recent.length;
  const orderBlockDetected = recent.slice(-10).some((c, i, arr) => {
    const bodySize = Math.abs(c.close - c.open);
    const candleRange = c.high - c.low;
    const isImpulsive = bodySize / candleRange > 0.6;
    const highVolume = c.volume > avgVolume * 1.3;
    if (i < arr.length - 1) {
      const next = arr[i + 1];
      const hasReversal = (c.close > c.open && next.close < next.open) ||
                          (c.close < c.open && next.close > next.open);
      return isImpulsive && highVolume && hasReversal;
    }
    return false;
  });
  if (orderBlockDetected) criteriaPassed.order_block = true;
  else criteriaFailed.order_block = true;

  const fvgDetected = recent.slice(0, -2).some((c, i) => {
    if (i + 2 < recent.length) {
      const gap = recent[i + 2].low - c.high;
      const avgRange = (c.high - c.low + recent[i + 2].high - recent[i + 2].low) / 2;
      return gap > avgRange * 0.3 || (c.low - recent[i + 2].high) > avgRange * 0.3;
    }
    return false;
  });
  if (fvgDetected) criteriaPassed.fair_value_gap = true;
  else criteriaFailed.fair_value_gap = true;

  const bosDetected = lastCandle.close > highestHigh || lastCandle.close < lowestLow;
  if (bosDetected) criteriaPassed.break_of_structure = true;
  else criteriaFailed.break_of_structure = true;

  const passedCount = Object.keys(criteriaPassed).length;
  const totalCriteria = passedCount + Object.keys(criteriaFailed).length;

  if (passedCount < 2) {
    return {
      signal: 'HOLD',
      confidence: (passedCount / totalCriteria) * 100,
      criteriaPassed,
      criteriaFailed,
      explanation: `SMC analysis incomplete: only ${passedCount}/4 criteria met. Waiting for ${Object.keys(criteriaFailed).join(', ')}.`,
      details: { swingPoints: swings.length, passedCount, totalCriteria }
    };
  }

  const signal: 'BUY' | 'SELL' = lastCandle.close > candles[candles.length - 2].close ? 'BUY' : 'SELL';
  const confidence = Math.min(95, 50 + (passedCount / totalCriteria) * 50);

  return {
    signal,
    confidence,
    criteriaPassed,
    criteriaFailed,
    explanation: `SMC ${signal}: ${Object.keys(criteriaPassed).join(', ')} detected. ${passedCount}/${totalCriteria} criteria met.`,
    details: { swingPoints: swings.length, direction: signal }
  };
}
