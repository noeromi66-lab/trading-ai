import type { Candle } from '../types';

interface SwingPoint {
  index: number;
  price: number;
  type: 'high' | 'low';
  strength: number;
  volume: number;
  time: number;
}

interface LiquiditySweepResult {
  detected: boolean;
  sweptLevel: number | null;
  sweptType: 'high' | 'low' | null;
  strength: number;
  confirmationCandles: number;
  description: string;
}

interface BreakOfStructureResult {
  detected: boolean;
  type: 'bullish' | 'bearish' | null;
  breakLevel: number | null;
  strength: number;
  confirmationCandles: number;
  description: string;
}

export class AdvancedSMCDetector {
  private readonly MIN_SWING_STRENGTH = 3;
  private readonly LIQUIDITY_THRESHOLD = 0.00008; // 0.8 pips for forex
  private readonly BOS_THRESHOLD = 0.00015; // 1.5 pips for forex
  private readonly MIN_CONFIRMATION_CANDLES = 2;

  /**
   * Détecte les Liquidity Sweeps avec une précision institutionnelle
   */
  public detectLiquiditySweep(candles: Candle[]): LiquiditySweepResult {
    if (candles.length < 50) {
      return {
        detected: false,
        sweptLevel: null,
        sweptType: null,
        strength: 0,
        confirmationCandles: 0,
        description: 'Données insuffisantes pour détecter les liquidity sweeps'
      };
    }

    // Trouve les swing points significatifs
    const swingPoints = this.findSignificantSwings(candles);
    const recentCandles = candles.slice(-20);
    
    let bestSweep: LiquiditySweepResult = {
      detected: false,
      sweptLevel: null,
      sweptType: null,
      strength: 0,
      confirmationCandles: 0,
      description: 'Aucun liquidity sweep détecté'
    };

    // Analyse les sweeps de highs
    const recentHighs = swingPoints
      .filter(s => s.type === 'high')
      .slice(-5); // Les 5 derniers highs

    for (const swingHigh of recentHighs) {
      const sweepResult = this.analyzeLiquiditySweepAtLevel(
        candles,
        swingHigh,
        'high',
        recentCandles
      );

      if (sweepResult.strength > bestSweep.strength) {
        bestSweep = sweepResult;
      }
    }

    // Analyse les sweeps de lows
    const recentLows = swingPoints
      .filter(s => s.type === 'low')
      .slice(-5); // Les 5 derniers lows

    for (const swingLow of recentLows) {
      const sweepResult = this.analyzeLiquiditySweepAtLevel(
        candles,
        swingLow,
        'low',
        recentCandles
      );

      if (sweepResult.strength > bestSweep.strength) {
        bestSweep = sweepResult;
      }
    }

    return bestSweep;
  }

  /**
   * Détecte les Break of Structure avec précision
   */
  public detectBreakOfStructure(candles: Candle[]): BreakOfStructureResult {
    if (candles.length < 50) {
      return {
        detected: false,
        type: null,
        breakLevel: null,
        strength: 0,
        confirmationCandles: 0,
        description: 'Données insuffisantes pour détecter les BOS'
      };
    }

    const swingPoints = this.findSignificantSwings(candles);
    const trendAnalysis = this.analyzeTrendStructure(swingPoints);
    
    // Analyse BOS bullish
    const bullishBOS = this.analyzeBullishBOS(candles, swingPoints, trendAnalysis);
    
    // Analyse BOS bearish
    const bearishBOS = this.analyzeBearishBOS(candles, swingPoints, trendAnalysis);

    // Retourne le BOS le plus fort
    if (bullishBOS.strength > bearishBOS.strength && bullishBOS.strength > 60) {
      return bullishBOS;
    } else if (bearishBOS.strength > 60) {
      return bearishBOS;
    }

    return {
      detected: false,
      type: null,
      breakLevel: null,
      strength: Math.max(bullishBOS.strength, bearishBOS.strength),
      confirmationCandles: 0,
      description: 'Structure intacte - aucun break significatif détecté'
    };
  }

  /**
   * Trouve les swing points significatifs avec force calculée
   */
  private findSignificantSwings(candles: Candle[]): SwingPoint[] {
    const swings: SwingPoint[] = [];
    const lookback = Math.min(100, candles.length);
    const startIndex = Math.max(0, candles.length - lookback);

    for (let i = startIndex + this.MIN_SWING_STRENGTH; i < candles.length - this.MIN_SWING_STRENGTH; i++) {
      const current = candles[i];

      // Test pour swing high
      let isSwingHigh = true;
      let leftCount = 0;
      let rightCount = 0;

      // Vérifie à gauche
      for (let j = i - this.MIN_SWING_STRENGTH; j < i; j++) {
        if (candles[j].high >= current.high) {
          isSwingHigh = false;
          break;
        }
        leftCount++;
      }

      // Vérifie à droite
      if (isSwingHigh) {
        for (let j = i + 1; j <= i + this.MIN_SWING_STRENGTH; j++) {
          if (candles[j].high >= current.high) {
            isSwingHigh = false;
            break;
          }
          rightCount++;
        }
      }

      if (isSwingHigh && leftCount >= this.MIN_SWING_STRENGTH && rightCount >= this.MIN_SWING_STRENGTH) {
        const strength = this.calculateSwingStrength(candles, i, 'high');
        swings.push({
          index: i,
          price: current.high,
          type: 'high',
          strength,
          volume: current.volume,
          time: current.time
        });
      }

      // Test pour swing low
      let isSwingLow = true;
      leftCount = 0;
      rightCount = 0;

      // Vérifie à gauche
      for (let j = i - this.MIN_SWING_STRENGTH; j < i; j++) {
        if (candles[j].low <= current.low) {
          isSwingLow = false;
          break;
        }
        leftCount++;
      }

      // Vérifie à droite
      if (isSwingLow) {
        for (let j = i + 1; j <= i + this.MIN_SWING_STRENGTH; j++) {
          if (candles[j].low <= current.low) {
            isSwingLow = false;
            break;
          }
          rightCount++;
        }
      }

      if (isSwingLow && leftCount >= this.MIN_SWING_STRENGTH && rightCount >= this.MIN_SWING_STRENGTH) {
        const strength = this.calculateSwingStrength(candles, i, 'low');
        swings.push({
          index: i,
          price: current.low,
          type: 'low',
          strength,
          volume: current.volume,
          time: current.time
        });
      }
    }

    return swings.sort((a, b) => a.index - b.index);
  }

  /**
   * Analyse un liquidity sweep à un niveau spécifique
   */
  private analyzeLiquiditySweepAtLevel(
    candles: Candle[],
    swingPoint: SwingPoint,
    sweepType: 'high' | 'low',
    recentCandles: Candle[]
  ): LiquiditySweepResult {
    let bestSweep: LiquiditySweepResult = {
      detected: false,
      sweptLevel: null,
      sweptType: null,
      strength: 0,
      confirmationCandles: 0,
      description: `Aucun sweep du ${sweepType} à ${swingPoint.price.toFixed(5)}`
    };

    // Cherche les sweeps dans les bougies récentes
    for (let i = 0; i < recentCandles.length; i++) {
      const candle = recentCandles[i];
      const candleIndex = candles.length - recentCandles.length + i;

      // Skip si cette bougie est avant le swing point
      if (candleIndex <= swingPoint.index) continue;

      let sweepDetected = false;
      let sweepAmount = 0;

      if (sweepType === 'high') {
        // Sweep du high: prix dépasse le niveau puis ferme en dessous
        if (candle.high > swingPoint.price) {
          sweepAmount = candle.high - swingPoint.price;
          sweepDetected = candle.close < swingPoint.price || 
                          (i < recentCandles.length - 1 && recentCandles[i + 1].close < swingPoint.price);
        }
      } else {
        // Sweep du low: prix passe sous le niveau puis ferme au dessus
        if (candle.low < swingPoint.price) {
          sweepAmount = swingPoint.price - candle.low;
          sweepDetected = candle.close > swingPoint.price || 
                          (i < recentCandles.length - 1 && recentCandles[i + 1].close > swingPoint.price);
        }
      }

      if (sweepDetected && sweepAmount > this.LIQUIDITY_THRESHOLD) {
        const confirmationCandles = this.countConfirmationCandles(
          recentCandles,
          i,
          swingPoint.price,
          sweepType
        );

        const strength = this.calculateSweepStrength(
          candle,
          swingPoint,
          sweepAmount,
          confirmationCandles
        );

        if (strength > bestSweep.strength) {
          bestSweep = {
            detected: true,
            sweptLevel: swingPoint.price,
            sweptType: sweepType,
            strength,
            confirmationCandles,
            description: `Liquidity sweep ${sweepType} détecté à ${swingPoint.price.toFixed(5)} avec ${confirmationCandles} bougies de confirmation (force: ${strength.toFixed(0)}%)`
          };
        }
      }
    }

    return bestSweep;
  }

  /**
   * Analyse BOS bullish
   */
  private analyzeBullishBOS(
    candles: Candle[],
    swingPoints: SwingPoint[],
    trendAnalysis: any
  ): BreakOfStructureResult {
    const recentHighs = swingPoints.filter(s => s.type === 'high').slice(-3);
    
    if (recentHighs.length === 0) {
      return {
        detected: false,
        type: null,
        breakLevel: null,
        strength: 0,
        confirmationCandles: 0,
        description: 'Aucun high récent pour analyser BOS bullish'
      };
    }

    // Trouve le high le plus significatif à casser
    const targetHigh = recentHighs.reduce((highest, current) => 
      current.strength > highest.strength ? current : highest
    );

    const recentCandles = candles.slice(-15);
    let bestBOS: BreakOfStructureResult = {
      detected: false,
      type: null,
      breakLevel: null,
      strength: 0,
      confirmationCandles: 0,
      description: `Aucun break du high à ${targetHigh.price.toFixed(5)}`
    };

    // Cherche le break du high
    for (let i = 0; i < recentCandles.length; i++) {
      const candle = recentCandles[i];
      const candleIndex = candles.length - recentCandles.length + i;

      if (candleIndex <= targetHigh.index) continue;

      // Break confirmé si fermeture au dessus du high
      const breakAmount = candle.close - targetHigh.price;
      
      if (breakAmount > this.BOS_THRESHOLD) {
        const confirmationCandles = this.countBOSConfirmation(
          recentCandles,
          i,
          targetHigh.price,
          'bullish'
        );

        const strength = this.calculateBOSStrength(
          candle,
          targetHigh,
          breakAmount,
          confirmationCandles,
          trendAnalysis
        );

        if (strength > bestBOS.strength) {
          bestBOS = {
            detected: true,
            type: 'bullish',
            breakLevel: targetHigh.price,
            strength,
            confirmationCandles,
            description: `Break of Structure BULLISH confirmé à ${targetHigh.price.toFixed(5)} avec ${confirmationCandles} bougies de confirmation (force: ${strength.toFixed(0)}%)`
          };
        }
      }
    }

    return bestBOS;
  }

  /**
   * Analyse BOS bearish
   */
  private analyzeBearishBOS(
    candles: Candle[],
    swingPoints: SwingPoint[],
    trendAnalysis: any
  ): BreakOfStructureResult {
    const recentLows = swingPoints.filter(s => s.type === 'low').slice(-3);
    
    if (recentLows.length === 0) {
      return {
        detected: false,
        type: null,
        breakLevel: null,
        strength: 0,
        confirmationCandles: 0,
        description: 'Aucun low récent pour analyser BOS bearish'
      };
    }

    // Trouve le low le plus significatif à casser
    const targetLow = recentLows.reduce((lowest, current) => 
      current.strength > lowest.strength ? current : lowest
    );

    const recentCandles = candles.slice(-15);
    let bestBOS: BreakOfStructureResult = {
      detected: false,
      type: null,
      breakLevel: null,
      strength: 0,
      confirmationCandles: 0,
      description: `Aucun break du low à ${targetLow.price.toFixed(5)}`
    };

    // Cherche le break du low
    for (let i = 0; i < recentCandles.length; i++) {
      const candle = recentCandles[i];
      const candleIndex = candles.length - recentCandles.length + i;

      if (candleIndex <= targetLow.index) continue;

      // Break confirmé si fermeture en dessous du low
      const breakAmount = targetLow.price - candle.close;
      
      if (breakAmount > this.BOS_THRESHOLD) {
        const confirmationCandles = this.countBOSConfirmation(
          recentCandles,
          i,
          targetLow.price,
          'bearish'
        );

        const strength = this.calculateBOSStrength(
          candle,
          targetLow,
          breakAmount,
          confirmationCandles,
          trendAnalysis
        );

        if (strength > bestBOS.strength) {
          bestBOS = {
            detected: true,
            type: 'bearish',
            breakLevel: targetLow.price,
            strength,
            confirmationCandles,
            description: `Break of Structure BEARISH confirmé à ${targetLow.price.toFixed(5)} avec ${confirmationCandles} bougies de confirmation (force: ${strength.toFixed(0)}%)`
          };
        }
      }
    }

    return bestBOS;
  }

  /**
   * Calcule la force d'un swing point
   */
  private calculateSwingStrength(candles: Candle[], index: number, type: 'high' | 'low'): number {
    let strength = 50; // Base strength

    const candle = candles[index];
    const range = candle.high - candle.low;
    
    // Volume factor
    const avgVolume = candles.slice(Math.max(0, index - 20), index)
      .reduce((sum, c) => sum + c.volume, 0) / 20;
    
    if (candle.volume > avgVolume * 1.5) strength += 20;
    else if (candle.volume > avgVolume * 1.2) strength += 10;

    // Range factor
    const avgRange = candles.slice(Math.max(0, index - 20), index)
      .reduce((sum, c) => sum + (c.high - c.low), 0) / 20;
    
    if (range > avgRange * 1.5) strength += 15;
    else if (range > avgRange * 1.2) strength += 8;

    // Time factor (older swings are stronger)
    const age = candles.length - index;
    if (age > 20 && age < 100) strength += 10;

    return Math.min(100, strength);
  }

  /**
   * Compte les bougies de confirmation pour un sweep
   */
  private countConfirmationCandles(
    candles: Candle[],
    sweepIndex: number,
    level: number,
    sweepType: 'high' | 'low'
  ): number {
    let confirmations = 0;
    const lookAhead = Math.min(5, candles.length - sweepIndex - 1);

    for (let i = 1; i <= lookAhead; i++) {
      const candle = candles[sweepIndex + i];
      
      if (sweepType === 'high') {
        // Confirmation si prix reste sous le niveau
        if (candle.close < level && candle.high < level * 1.0002) {
          confirmations++;
        }
      } else {
        // Confirmation si prix reste au dessus du niveau
        if (candle.close > level && candle.low > level * 0.9998) {
          confirmations++;
        }
      }
    }

    return confirmations;
  }

  /**
   * Compte les bougies de confirmation pour un BOS
   */
  private countBOSConfirmation(
    candles: Candle[],
    breakIndex: number,
    level: number,
    direction: 'bullish' | 'bearish'
  ): number {
    let confirmations = 0;
    const lookAhead = Math.min(5, candles.length - breakIndex - 1);

    for (let i = 1; i <= lookAhead; i++) {
      const candle = candles[breakIndex + i];
      
      if (direction === 'bullish') {
        // Confirmation si prix reste au dessus du niveau
        if (candle.close > level && candle.low > level * 0.9995) {
          confirmations++;
        }
      } else {
        // Confirmation si prix reste en dessous du niveau
        if (candle.close < level && candle.high < level * 1.0005) {
          confirmations++;
        }
      }
    }

    return confirmations;
  }

  /**
   * Calcule la force d'un liquidity sweep
   */
  private calculateSweepStrength(
    sweepCandle: Candle,
    swingPoint: SwingPoint,
    sweepAmount: number,
    confirmationCandles: number
  ): number {
    let strength = 40; // Base strength

    // Sweep amount factor
    const relativeAmount = sweepAmount / swingPoint.price;
    if (relativeAmount > 0.0005) strength += 25; // 5 pips
    else if (relativeAmount > 0.0002) strength += 15; // 2 pips
    else if (relativeAmount > 0.0001) strength += 10; // 1 pip

    // Confirmation factor
    strength += confirmationCandles * 8;

    // Wick factor (rejection strength)
    const bodySize = Math.abs(sweepCandle.close - sweepCandle.open);
    const wickSize = swingPoint.type === 'high' 
      ? sweepCandle.high - Math.max(sweepCandle.open, sweepCandle.close)
      : Math.min(sweepCandle.open, sweepCandle.close) - sweepCandle.low;

    if (wickSize > bodySize * 2) strength += 20;
    else if (wickSize > bodySize) strength += 10;

    // Volume factor
    if (sweepCandle.volume > swingPoint.volume * 1.3) strength += 15;

    // Swing strength factor
    strength += (swingPoint.strength - 50) * 0.3;

    return Math.min(100, Math.max(0, strength));
  }

  /**
   * Calcule la force d'un Break of Structure
   */
  private calculateBOSStrength(
    breakCandle: Candle,
    swingPoint: SwingPoint,
    breakAmount: number,
    confirmationCandles: number,
    trendAnalysis: any
  ): number {
    let strength = 45; // Base strength

    // Break amount factor
    const relativeAmount = breakAmount / swingPoint.price;
    if (relativeAmount > 0.001) strength += 25; // 10 pips
    else if (relativeAmount > 0.0005) strength += 15; // 5 pips
    else if (relativeAmount > 0.0002) strength += 10; // 2 pips

    // Confirmation factor
    strength += confirmationCandles * 10;

    // Candle strength (body vs wick)
    const bodySize = Math.abs(breakCandle.close - breakCandle.open);
    const candleRange = breakCandle.high - breakCandle.low;
    const bodyRatio = bodySize / candleRange;

    if (bodyRatio > 0.7) strength += 20; // Strong body
    else if (bodyRatio > 0.5) strength += 10;

    // Volume factor
    if (breakCandle.volume > swingPoint.volume * 1.5) strength += 20;
    else if (breakCandle.volume > swingPoint.volume * 1.2) strength += 10;

    // Trend context (counter-trend breaks are stronger)
    if (trendAnalysis.trend === 'bearish' && swingPoint.type === 'high') {
      strength += 15; // Bullish BOS in bearish trend
    } else if (trendAnalysis.trend === 'bullish' && swingPoint.type === 'low') {
      strength += 15; // Bearish BOS in bullish trend
    }

    // Swing strength factor
    strength += (swingPoint.strength - 50) * 0.4;

    return Math.min(100, Math.max(0, strength));
  }

  /**
   * Analyse la structure de tendance
   */
  private analyzeTrendStructure(swingPoints: SwingPoint[]): any {
    if (swingPoints.length < 4) {
      return { trend: 'sideways', strength: 0 };
    }

    const recentSwings = swingPoints.slice(-6);
    const highs = recentSwings.filter(s => s.type === 'high').slice(-3);
    const lows = recentSwings.filter(s => s.type === 'low').slice(-3);

    let bullishSignals = 0;
    let bearishSignals = 0;

    // Analyse des highs
    if (highs.length >= 2) {
      for (let i = 1; i < highs.length; i++) {
        if (highs[i].price > highs[i-1].price) bullishSignals++;
        else bearishSignals++;
      }
    }

    // Analyse des lows
    if (lows.length >= 2) {
      for (let i = 1; i < lows.length; i++) {
        if (lows[i].price > lows[i-1].price) bullishSignals++;
        else bearishSignals++;
      }
    }

    const totalSignals = bullishSignals + bearishSignals;
    if (totalSignals === 0) return { trend: 'sideways', strength: 0 };

    const bullishPercentage = (bullishSignals / totalSignals) * 100;
    
    if (bullishPercentage >= 70) {
      return { trend: 'bullish', strength: bullishPercentage };
    } else if (bullishPercentage <= 30) {
      return { trend: 'bearish', strength: 100 - bullishPercentage };
    } else {
      return { trend: 'sideways', strength: 50 };
    }
  }
}

export const advancedSMCDetector = new AdvancedSMCDetector();