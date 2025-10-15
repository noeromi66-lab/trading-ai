import type { Candle, StrategyResult } from '../types';
import { analyzeSMCStrategy } from '../strategies/smcStrategy';
import { analyzeEMAStrategy } from '../strategies/emaStrategy';
import { analyzeAsianKillzoneStrategy } from '../strategies/asianKillzoneStrategy';
import { calculateRiskReward, calculateGrade } from './riskReward';
import { logSignalGenerated, logSignalRejected } from './logger';

interface SignalEngineResult {
  signalType: 'BUY' | 'SELL' | 'HOLD';
  strategy: string;
  confidence: number;
  grade: string;
  entry: number | null;
  stopLoss: number | null;
  tp1: number | null;
  tp2: number | null;
  rrRatio: number | null;
  explanation: string;
  criteriaPassed: Record<string, boolean>;
  criteriaFailed: Record<string, boolean>;
  isKillzone: boolean;
}

function mergeResults(results: StrategyResult[]): StrategyResult {
  const validResults = results.filter(r => r.signal !== 'HOLD');

  if (validResults.length === 0) {
    const allCriteriaPassed = results.reduce((acc, r) => ({ ...acc, ...r.criteriaPassed }), {});
    const allCriteriaFailed = results.reduce((acc, r) => ({ ...acc, ...r.criteriaFailed }), {});
    const avgConfidence = results.reduce((sum, r) => sum + r.confidence, 0) / results.length;

    return {
      signal: 'HOLD',
      confidence: avgConfidence,
      criteriaPassed: allCriteriaPassed,
      criteriaFailed: allCriteriaFailed,
      explanation: 'The market is speaking in whispers right now. Multiple timeframes and strategies are giving mixed signals - this tells me to step aside and wait for clarity. The best trades come to those who wait.',
      details: {}
    };
  }

  const buyCount = validResults.filter(r => r.signal === 'BUY').length;
  const sellCount = validResults.filter(r => r.signal === 'SELL').length;

  const dominantSignal = buyCount > sellCount ? 'BUY' : 'SELL';
  const matchingResults = validResults.filter(r => r.signal === dominantSignal);

  const avgConfidence = matchingResults.reduce((sum, r) => sum + r.confidence, 0) / matchingResults.length;
  const allCriteriaPassed = matchingResults.reduce((acc, r) => ({ ...acc, ...r.criteriaPassed }), {});
  const allCriteriaFailed = results.reduce((acc, r) => ({ ...acc, ...r.criteriaFailed }), {});

  const strategies = matchingResults.map(r => r.details.strategy || 'Unknown').join(' + ');

  return {
    signal: dominantSignal,
    confidence: avgConfidence,
    criteriaPassed: allCriteriaPassed,
    criteriaFailed: allCriteriaFailed,
    explanation: `This is what we live for - multiple strategies singing in harmony for a ${dominantSignal.toLowerCase()} setup. When ${matchingResults.length} different approaches agree, the market is telling us something important. Time to listen.`,
    details: { strategies, agreement: matchingResults.length }
  };
}

export async function analyzeMarket(
  candles: Candle[],
  pairSymbol: string,
  pipValue: number
): Promise<SignalEngineResult> {
  const smcResult = analyzeSMCStrategy(candles);
  const emaResult = analyzeEMAStrategy(candles);
  const killzoneResult = analyzeAsianKillzoneStrategy(candles);

  const results = [
    { ...smcResult, details: { ...smcResult.details, strategy: 'SMC' } },
    { ...emaResult, details: { ...emaResult.details, strategy: 'EMA' } },
    { ...killzoneResult, details: { ...killzoneResult.details, strategy: 'KILLZONE' } }
  ];

  const mergedResult = mergeResults(results);

  const isKillzone = killzoneResult.criteriaPassed.in_killzone || false;

  if (mergedResult.signal === 'HOLD') {
    await logSignalRejected(
      pairSymbol,
      'HYBRID',
      mergedResult.explanation,
      mergedResult.criteriaPassed,
      mergedResult.criteriaFailed
    );

    return {
      signalType: 'HOLD',
      strategy: 'HYBRID',
      confidence: mergedResult.confidence,
      grade: 'C',
      entry: null,
      stopLoss: null,
      tp1: null,
      tp2: null,
      rrRatio: null,
      explanation: mergedResult.explanation,
      criteriaPassed: mergedResult.criteriaPassed,
      criteriaFailed: mergedResult.criteriaFailed,
      isKillzone
    };
  }

  const rr = calculateRiskReward(candles, mergedResult.signal, pipValue);
  const grade = calculateGrade(mergedResult.confidence, rr.ratio);

  const strategyName = mergedResult.details.strategies || 'HYBRID';

  return {
    signalType: mergedResult.signal,
    strategy: strategyName,
    confidence: mergedResult.confidence,
    grade,
    entry: rr.entry,
    stopLoss: rr.stopLoss,
    tp1: rr.tp1,
    tp2: rr.tp2,
    rrRatio: rr.ratio,
    explanation: mergedResult.explanation,
    criteriaPassed: mergedResult.criteriaPassed,
    criteriaFailed: mergedResult.criteriaFailed,
    isKillzone
  };
}
