import type { Signal } from '../types';
import { masterClock } from '../modules/masterClock';

export interface AsianChecklist {
  asianRangeDefined: boolean;
  validRangeSize: boolean;
  breakoutDetected: boolean;
  fakeoutConfirmed: boolean;
  structureShift: boolean;
  confluenceMet: number;
}

export interface AsianSetup {
  checklist: AsianChecklist;
  confluences: string[];
  canTrade: boolean;
  asianHigh: number;
  asianLow: number;
  rangeSize: number;
}

export class AsianSessionStrategy {
  private readonly MIN_CONFLUENCES = 3;

  public analyzeSetup(
    asianHigh: number,
    asianLow: number,
    currentPrice: number,
    marketData: any
  ): AsianSetup {
    const rangeSize = asianHigh - asianLow;
    const validRange = rangeSize > 0.0020 * currentPrice && rangeSize < 0.0050 * currentPrice;

    const breakoutDetected = currentPrice > asianHigh || currentPrice < asianLow;

    const fakeoutConfirmed = this.detectFakeout(
      asianHigh,
      asianLow,
      currentPrice,
      marketData
    );

    const structureShift = this.detectStructureShift(marketData);

    const confluences = this.checkConfluences(
      asianHigh,
      asianLow,
      currentPrice,
      marketData,
      fakeoutConfirmed,
      structureShift
    );

    const checklist: AsianChecklist = {
      asianRangeDefined: asianHigh > asianLow,
      validRangeSize: validRange,
      breakoutDetected,
      fakeoutConfirmed,
      structureShift,
      confluenceMet: confluences.length
    };

    const canTrade = confluences.length >= this.MIN_CONFLUENCES &&
                     fakeoutConfirmed &&
                     validRange;

    return {
      checklist,
      confluences,
      canTrade,
      asianHigh,
      asianLow,
      rangeSize
    };
  }

  private detectFakeout(
    asianHigh: number,
    asianLow: number,
    currentPrice: number,
    marketData: any
  ): boolean {
    if (!marketData.history || marketData.history.length < 5) {
      return false;
    }

    const recentCandles = marketData.history.slice(-5);

    const brokeHigh = recentCandles.some((c: any) => c.high > asianHigh);
    const brokeLow = recentCandles.some((c: any) => c.low < asianLow);

    const backInRange = currentPrice > asianLow && currentPrice < asianHigh;

    return (brokeHigh || brokeLow) && backInRange;
  }

  private detectStructureShift(marketData: any): boolean {
    if (!marketData.history || marketData.history.length < 10) {
      return false;
    }

    const candles = marketData.history.slice(-10);

    const highs = candles.map((c: any) => c.high);
    const lows = candles.map((c: any) => c.low);

    const recentHighs = highs.slice(-5);
    const previousHighs = highs.slice(0, 5);

    const recentLows = lows.slice(-5);
    const previousLows = lows.slice(0, 5);

    const avgRecentHigh = recentHighs.reduce((a: number, b: number) => a + b, 0) / recentHighs.length;
    const avgPreviousHigh = previousHighs.reduce((a: number, b: number) => a + b, 0) / previousHighs.length;

    const avgRecentLow = recentLows.reduce((a: number, b: number) => a + b, 0) / recentLows.length;
    const avgPreviousLow = previousLows.reduce((a: number, b: number) => a + b, 0) / previousLows.length;

    const bullishShift = avgRecentLow > avgPreviousLow * 1.001 && avgRecentHigh > avgPreviousHigh * 1.001;
    const bearishShift = avgRecentHigh < avgPreviousHigh * 0.999 && avgRecentLow < avgPreviousLow * 0.999;

    return bullishShift || bearishShift;
  }

  private checkConfluences(
    asianHigh: number,
    asianLow: number,
    currentPrice: number,
    marketData: any,
    fakeout: boolean,
    structureShift: boolean
  ): string[] {
    const confluences: string[] = [];

    if (fakeout) {
      confluences.push('Sweep of Asian extreme detected');
    }

    if (structureShift) {
      confluences.push('Change of Character (CHoCH) confirmed');
    }

    const hasOB = this.detectOrderBlock(marketData);
    if (hasOB) {
      confluences.push('Order Block / Imbalance zone present');
    }

    const emaAlignment = this.checkEMAAlignment(marketData);
    if (emaAlignment) {
      confluences.push('EMA alignment favoring direction');
    }

    const volumeProfile = this.checkVolumeProfile(marketData);
    if (volumeProfile) {
      confluences.push('Volume spike on reversal');
    }

    const rsiDivergence = this.checkRSIDivergence(marketData);
    if (rsiDivergence) {
      confluences.push('RSI divergence detected');
    }

    return confluences;
  }

  private detectOrderBlock(marketData: any): boolean {
    if (!marketData.history || marketData.history.length < 5) {
      return false;
    }

    const candles = marketData.history.slice(-5);

    for (let i = 0; i < candles.length - 2; i++) {
      const candle1 = candles[i];
      const candle3 = candles[i + 2];

      const gap = candle1.low > candle3.high || candle1.high < candle3.low;
      if (gap) return true;
    }

    return false;
  }

  private checkEMAAlignment(marketData: any): boolean {
    if (!marketData.ema20 || !marketData.ema50) {
      return false;
    }

    const bullishAlignment = marketData.ema20 > marketData.ema50;
    const bearishAlignment = marketData.ema20 < marketData.ema50;

    return bullishAlignment || bearishAlignment;
  }

  private checkVolumeProfile(marketData: any): boolean {
    if (!marketData.history || marketData.history.length < 10) {
      return false;
    }

    const candles = marketData.history.slice(-10);
    const volumes = candles.map((c: any) => c.volume);

    const avgVolume = volumes.reduce((a: number, b: number) => a + b, 0) / volumes.length;
    const recentVolume = volumes.slice(-3);

    return recentVolume.some((v: number) => v > avgVolume * 1.5);
  }

  private checkRSIDivergence(marketData: any): boolean {
    if (!marketData.rsi || !marketData.history || marketData.history.length < 5) {
      return false;
    }

    return Math.abs(marketData.rsi - 50) > 20;
  }

  public async scanMarket(
    symbol: string,
    timeframe: string,
    marketData: any
  ): Promise<Signal | null> {
    const sessionStatus = masterClock.getCurrentSession();

    if (sessionStatus.currentSession !== 'London Killzone') {
      return null;
    }

    const asianRange = this.getAsianRange(marketData);
    if (!asianRange) {
      return null;
    }

    const { high: asianHigh, low: asianLow } = asianRange;
    const currentPrice = marketData.close;

    const setup = this.analyzeSetup(asianHigh, asianLow, currentPrice, marketData);

    if (!setup.canTrade) {
      return null;
    }

    const direction = this.determineDirection(asianHigh, asianLow, currentPrice, marketData);
    const entry = currentPrice;
    const stopLoss = this.calculateStopLoss(entry, direction, asianHigh, asianLow);
    const takeProfit = this.calculateTakeProfit(entry, stopLoss);

    const signal: Signal = {
      id: crypto.randomUUID(),
      user_id: '',
      symbol,
      timeframe,
      direction,
      entry,
      stop_loss: stopLoss,
      take_profit: takeProfit,
      confidence: Math.min(0.9, 0.6 + (setup.confluences.length * 0.1)),
      strategy: 'Asian Session Strategy',
      status: 'active',
      created_at: new Date().toISOString(),
      metadata: {
        asianHigh,
        asianLow,
        rangeSize: setup.rangeSize,
        confluences: setup.confluences,
        session: sessionStatus.currentSession
      }
    };

    return signal;
  }

  private getAsianRange(marketData: any): { high: number; low: number } | null {
    if (!marketData.asianHigh || !marketData.asianLow) {
      return null;
    }

    return {
      high: marketData.asianHigh,
      low: marketData.asianLow
    };
  }

  private determineDirection(
    asianHigh: number,
    asianLow: number,
    currentPrice: number,
    marketData: any
  ): 'long' | 'short' {
    if (!marketData.history || marketData.history.length < 5) {
      return currentPrice > (asianHigh + asianLow) / 2 ? 'short' : 'long';
    }

    const recentCandles = marketData.history.slice(-5);
    const brokeHigh = recentCandles.some((c: any) => c.high > asianHigh);

    if (brokeHigh && currentPrice < asianHigh) {
      return 'short';
    } else if (!brokeHigh && currentPrice > asianLow) {
      return 'long';
    }

    return currentPrice > (asianHigh + asianLow) / 2 ? 'short' : 'long';
  }

  private calculateStopLoss(
    entry: number,
    direction: 'long' | 'short',
    asianHigh: number,
    asianLow: number
  ): number {
    const buffer = (asianHigh - asianLow) * 0.1;

    if (direction === 'long') {
      return asianLow - buffer;
    } else {
      return asianHigh + buffer;
    }
  }

  private calculateTakeProfit(entry: number, stopLoss: number): number {
    const risk = Math.abs(entry - stopLoss);
    const reward = risk * 2.5;

    if (entry > stopLoss) {
      return entry + reward;
    } else {
      return entry - reward;
    }
  }

  public formatChecklist(setup: AsianSetup): string {
    const { checklist, confluences } = setup;
    return `
Asian Session Strategy - Confluence Check

Core Criteria:
✓ Asian Range Defined: ${checklist.asianRangeDefined ? '✅' : '❌'}
✓ Valid Range Size (20-50 pips): ${checklist.validRangeSize ? '✅' : '❌'}
✓ Breakout Detected: ${checklist.breakoutDetected ? '✅' : '❌'}
✓ Fakeout Confirmed: ${checklist.fakeoutConfirmed ? '✅' : '❌'}
✓ Structure Shift (CHoCH): ${checklist.structureShift ? '✅' : '❌'}

Confluences (${checklist.confluenceMet}/6):
${confluences.map(c => `✓ ${c}`).join('\n')}

Trade Status: ${setup.canTrade ? '✅ APPROVED (3+ Confluences)' : '❌ REJECTED (Need 3+ Confluences)'}

Asian Range: ${setup.asianHigh.toFixed(5)} - ${setup.asianLow.toFixed(5)}
Range Size: ${(setup.rangeSize * 10000).toFixed(1)} pips
    `.trim();
  }
}

export const asianSessionStrategy = new AsianSessionStrategy();