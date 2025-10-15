import type { Candle, RiskReward } from '../types';

export function calculateRiskReward(
  candles: Candle[],
  signalType: 'BUY' | 'SELL',
  pipValue: number
): RiskReward {
  const recent = candles.slice(-30);
  const lastCandle = candles[candles.length - 1];

  const atr = recent.slice(-14).reduce((sum, c, i, arr) => {
    if (i === 0) return 0;
    return sum + (c.high - c.low);
  }, 0) / 14;

  const highestHigh = Math.max(...recent.map(c => c.high));
  const lowestLow = Math.min(...recent.map(c => c.low));

  let entry: number;
  let stopLoss: number;
  let tp1: number;
  let tp2: number;

  if (signalType === 'BUY') {
    entry = lastCandle.close + (atr * 0.15);
    stopLoss = lowestLow - (pipValue * 8);

    const risk = entry - stopLoss;
    tp1 = entry + (risk * 1.5);
    tp2 = entry + (risk * 2.5);
  } else {
    entry = lastCandle.close - (atr * 0.15);
    stopLoss = highestHigh + (pipValue * 8);

    const risk = stopLoss - entry;
    tp1 = entry - (risk * 1.5);
    tp2 = entry - (risk * 2.5);
  }

  const risk = Math.abs(entry - stopLoss);
  const reward = Math.abs(tp1 - entry);
  const ratio = reward / risk;

  const pipRisk = risk / pipValue;
  const pipReward = reward / pipValue;

  return {
    entry,
    stopLoss,
    tp1,
    tp2,
    ratio,
    pipRisk,
    pipReward
  };
}

export function calculateGrade(confidence: number, rrRatio: number): 'A+' | 'A' | 'B+' | 'B' | 'C' {
  if (confidence >= 85 && rrRatio >= 2.0) return 'A+';
  if (confidence >= 75 && rrRatio >= 1.8) return 'A';
  if (confidence >= 65 && rrRatio >= 1.5) return 'B+';
  if (confidence >= 55 && rrRatio >= 1.3) return 'B';
  return 'C';
}
