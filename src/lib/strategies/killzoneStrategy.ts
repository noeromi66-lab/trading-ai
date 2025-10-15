import type { Signal } from '../types';
import { masterClock } from '../modules/masterClock';

export interface KillzoneChecklist {
  liquiditySwept: boolean;
  breakOfStructure: boolean;
  fvgOrOB: boolean;
  inKillzone: boolean;
  rrMinimum: boolean;
  noMajorNews: boolean;
}

export interface KillzoneSetup {
  checklist: KillzoneChecklist;
  score: number;
  grade: 'A+' | 'Acceptable' | 'Rejected';
  canTrade: boolean;
}

export class KillzoneStrategy {
  private readonly MIN_SCORE = 5;
  private readonly PERFECT_SCORE = 6;

  public analyzeSetup(
    liquiditySwept: boolean,
    breakOfStructure: boolean,
    fvgOrOB: boolean,
    rrRatio: number,
    noMajorNews: boolean
  ): KillzoneSetup {
    const inKillzone = masterClock.isInKillzone();

    const checklist: KillzoneChecklist = {
      liquiditySwept,
      breakOfStructure,
      fvgOrOB,
      inKillzone,
      rrMinimum: rrRatio >= 2.0,
      noMajorNews
    };

    const score = Object.values(checklist).filter(Boolean).length;

    let grade: 'A+' | 'Acceptable' | 'Rejected';
    let canTrade: boolean;

    if (score === this.PERFECT_SCORE) {
      grade = 'A+';
      canTrade = true;
    } else if (score >= this.MIN_SCORE) {
      grade = 'Acceptable';
      canTrade = true;
    } else {
      grade = 'Rejected';
      canTrade = false;
    }

    return {
      checklist,
      score,
      grade,
      canTrade
    };
  }

  public async scanMarket(
    symbol: string,
    timeframe: string,
    marketData: any
  ): Promise<Signal | null> {
    if (!masterClock.isInKillzone()) {
      return null;
    }

    const liquiditySwept = this.detectLiquiditySweep(marketData);
    const breakOfStructure = this.detectBreakOfStructure(marketData);
    const fvgOrOB = this.detectFVGOrOB(marketData);
    const rrRatio = this.calculateRR(marketData);
    const noMajorNews = true;

    const setup = this.analyzeSetup(
      liquiditySwept,
      breakOfStructure,
      fvgOrOB,
      rrRatio,
      noMajorNews
    );

    if (!setup.canTrade) {
      return null;
    }

    const direction = this.determineDirection(marketData);
    const entry = marketData.close;
    const stopLoss = this.calculateStopLoss(entry, direction, marketData);
    const takeProfit = this.calculateTakeProfit(entry, stopLoss, rrRatio);

    const signal: Signal = {
      id: crypto.randomUUID(),
      user_id: '',
      symbol,
      timeframe,
      direction,
      entry,
      stop_loss: stopLoss,
      take_profit: takeProfit,
      confidence: setup.score / this.PERFECT_SCORE,
      strategy: 'Killzone Strategy',
      status: 'active',
      created_at: new Date().toISOString(),
      metadata: {
        setup: setup.grade,
        score: `${setup.score}/${this.PERFECT_SCORE}`,
        checklist: setup.checklist,
        killzone: masterClock.getCurrentSession().currentSession
      }
    };

    return signal;
  }

  private detectLiquiditySweep(marketData: any): boolean {
    if (!marketData.history || marketData.history.length < 20) {
      return false;
    }

    const recentCandles = marketData.history.slice(-20);
    const highs = recentCandles.map((c: any) => c.high);
    const lows = recentCandles.map((c: any) => c.low);

    const equalHighs = this.findEqualLevels(highs);
    const equalLows = this.findEqualLevels(lows);

    const currentPrice = marketData.close;
    const swept = equalHighs.some(h => currentPrice > h * 1.0002) ||
                  equalLows.some(l => currentPrice < l * 0.9998);

    return swept;
  }

  private findEqualLevels(prices: number[]): number[] {
    const levels: number[] = [];
    const tolerance = 0.0005;

    for (let i = 0; i < prices.length - 1; i++) {
      for (let j = i + 1; j < prices.length; j++) {
        const diff = Math.abs(prices[i] - prices[j]) / prices[i];
        if (diff < tolerance) {
          levels.push(prices[i]);
          break;
        }
      }
    }

    return levels;
  }

  private detectBreakOfStructure(marketData: any): boolean {
    if (!marketData.history || marketData.history.length < 10) {
      return false;
    }

    const candles = marketData.history.slice(-10);
    const closes = candles.map((c: any) => c.close);

    const uptrend = closes[0] < closes[closes.length - 1];
    const downtrend = closes[0] > closes[closes.length - 1];

    let structureBreak = false;

    if (uptrend) {
      const previousLow = Math.min(...closes.slice(0, 5));
      const currentLow = Math.min(...closes.slice(5));
      structureBreak = currentLow > previousLow * 1.001;
    } else if (downtrend) {
      const previousHigh = Math.max(...closes.slice(0, 5));
      const currentHigh = Math.max(...closes.slice(5));
      structureBreak = currentHigh < previousHigh * 0.999;
    }

    return structureBreak;
  }

  private detectFVGOrOB(marketData: any): boolean {
    if (!marketData.history || marketData.history.length < 5) {
      return false;
    }

    const candles = marketData.history.slice(-5);

    for (let i = 0; i < candles.length - 2; i++) {
      const candle1 = candles[i];
      const candle2 = candles[i + 1];
      const candle3 = candles[i + 2];

      const gap = candle1.low > candle3.high || candle1.high < candle3.low;

      if (gap) {
        return true;
      }
    }

    const lastCandles = candles.slice(-3);
    const allBullish = lastCandles.every((c: any) => c.close > c.open);
    const allBearish = lastCandles.every((c: any) => c.close < c.open);

    return allBullish || allBearish;
  }

  private calculateRR(marketData: any): number {
    if (!marketData.atr) {
      return 2.0;
    }

    const atr = marketData.atr;
    const stopDistance = atr * 1.5;
    const targetDistance = atr * 3.0;

    return targetDistance / stopDistance;
  }

  private determineDirection(marketData: any): 'long' | 'short' {
    if (!marketData.history || marketData.history.length < 5) {
      return marketData.close > marketData.open ? 'long' : 'short';
    }

    const recentCandles = marketData.history.slice(-5);
    const avgClose = recentCandles.reduce((sum: number, c: any) => sum + c.close, 0) / recentCandles.length;

    return marketData.close > avgClose ? 'long' : 'short';
  }

  private calculateStopLoss(entry: number, direction: 'long' | 'short', marketData: any): number {
    const atr = marketData.atr || entry * 0.002;
    const stopDistance = atr * 1.5;

    if (direction === 'long') {
      return entry - stopDistance;
    } else {
      return entry + stopDistance;
    }
  }

  private calculateTakeProfit(entry: number, stopLoss: number, rrRatio: number): number {
    const risk = Math.abs(entry - stopLoss);
    const reward = risk * rrRatio;

    if (entry > stopLoss) {
      return entry + reward;
    } else {
      return entry - reward;
    }
  }

  public formatChecklist(setup: KillzoneSetup): string {
    const { checklist } = setup;
    return `
Killzone Strategy Checklist (${setup.score}/${this.PERFECT_SCORE}) - ${setup.grade}

✓ Liquidity Swept: ${checklist.liquiditySwept ? '✅' : '❌'}
✓ Break of Structure: ${checklist.breakOfStructure ? '✅' : '❌'}
✓ FVG/OB Present: ${checklist.fvgOrOB ? '✅' : '❌'}
✓ In Killzone: ${checklist.inKillzone ? '✅' : '❌'}
✓ RR ≥ 1:2: ${checklist.rrMinimum ? '✅' : '❌'}
✓ No Major News: ${checklist.noMajorNews ? '✅' : '❌'}

Trade Status: ${setup.canTrade ? '✅ APPROVED' : '❌ REJECTED'}
    `.trim();
  }
}

export const killzoneStrategy = new KillzoneStrategy();