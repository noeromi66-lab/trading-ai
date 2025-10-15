interface CandleData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface SwingPoint {
  index: number;
  price: number;
  type: 'high' | 'low';
  time: number;
}

interface LiquiditySweepResult {
  detected: boolean;
  sweptLevel: number | null;
  sweptType: 'high' | 'low' | null;
  confirmationCandle: number | null;
  strength: number; // 0-100
}

interface BreakOfStructureResult {
  detected: boolean;
  type: 'bullish' | 'bearish' | null;
  breakLevel: number | null;
  confirmationCandle: number | null;
  strength: number; // 0-100
  previousStructure: SwingPoint[];
  timeframeConfirmation: Record<string, boolean>;
  multiTimeframeStrength: number;
}

export class PythonPreCalculator {
  private readonly MIN_SWING_STRENGTH = 2; // Minimum candles on each side for swing point (reduced for sensitivity)
  private readonly LIQUIDITY_THRESHOLD = 0.00005; // Minimum price difference for liquidity sweep (tightened)
  private readonly BOS_CONFIRMATION_CANDLES = 1; // Candles needed to confirm BoS (faster confirmation)
  private readonly TIMEFRAMES = ['M15', 'H1', 'H4']; // Supported timeframes for multi-analysis
  private readonly SWING_LOOKBACK = 50; // How many candles to analyze for swing points
  private readonly LIQUIDITY_TOLERANCE = 0.0002; // Tolerance for equal highs/lows detection

  /**
   * Enhanced multi-timeframe analysis for liquidity sweeps
   */
  public detectLiquiditySweepMultiTimeframe(candleData: Record<string, CandleData[]>): LiquiditySweepResult {
    let bestSweep: LiquiditySweepResult = { 
      detected: false, 
      sweptLevel: null, 
      sweptType: null, 
      confirmationCandle: null, 
      strength: 0 
    };

    // Analyze each timeframe
    for (const timeframe of this.TIMEFRAMES) {
      if (!candleData[timeframe] || candleData[timeframe].length < 20) continue;

      const tfSweep = this.detectLiquiditySweep(candleData[timeframe]);
      
      // Boost strength for higher timeframe confirmations
      if (tfSweep.detected) {
        let adjustedStrength = tfSweep.strength;
        
        if (timeframe === 'H4') adjustedStrength += 20; // H4 confirmation is strongest
        else if (timeframe === 'H1') adjustedStrength += 10; // H1 confirmation is strong
        
        // Check for confluence across timeframes
        const confluenceBonus = this.calculateTimeframeConfluence(candleData, tfSweep);
        adjustedStrength += confluenceBonus;
        
        if (adjustedStrength > bestSweep.strength) {
          bestSweep = { ...tfSweep, strength: Math.min(100, adjustedStrength) };
        }
      }
    }

    return bestSweep;
  }

  /**
   * Enhanced multi-timeframe Break of Structure detection
   */
  public detectBreakOfStructureMultiTimeframe(candleData: Record<string, CandleData[]>): BreakOfStructureResult {
    let bestBoS: BreakOfStructureResult = { 
      detected: false, 
      type: null, 
      breakLevel: null, 
      confirmationCandle: null, 
      strength: 0,
      previousStructure: [],
      timeframeConfirmation: {},
      multiTimeframeStrength: 0
    };

    const timeframeResults: Record<string, any> = {};

    // Analyze each timeframe
    for (const timeframe of this.TIMEFRAMES) {
      if (!candleData[timeframe] || candleData[timeframe].length < 30) continue;

      const tfBoS = this.detectBreakOfStructure(candleData[timeframe]);
      timeframeResults[timeframe] = tfBoS;
      
      if (tfBoS.detected) {
        let adjustedStrength = tfBoS.strength;
        
        // Higher timeframe breaks are more significant
        if (timeframe === 'H4') adjustedStrength += 25;
        else if (timeframe === 'H1') adjustedStrength += 15;
        
        if (adjustedStrength > bestBoS.strength) {
          bestBoS = { 
            ...tfBoS, 
            strength: Math.min(100, adjustedStrength),
            timeframeConfirmation: {},
            multiTimeframeStrength: 0
          };
        }
      }
    }

    // Calculate multi-timeframe confirmation
    if (bestBoS.detected) {
      const confirmations: Record<string, boolean> = {};
      let confluenceCount = 0;
      
      for (const timeframe of this.TIMEFRAMES) {
        const tfResult = timeframeResults[timeframe];
        if (tfResult?.detected && tfResult.type === bestBoS.type) {
          confirmations[timeframe] = true;
          confluenceCount++;
        } else {
          confirmations[timeframe] = false;
        }
      }
      
      bestBoS.timeframeConfirmation = confirmations;
      bestBoS.multiTimeframeStrength = (confluenceCount / this.TIMEFRAMES.length) * 100;
      
      // Boost overall strength based on multi-timeframe confluence
      if (confluenceCount >= 2) {
        bestBoS.strength = Math.min(100, bestBoS.strength + (confluenceCount * 10));
      }
    }

    return bestBoS;
  }

  /**
   * Enhanced Market Structure Shift detection with partial BOS recognition
   */
  public detectMarketStructureShift(candles: CandleData[]): {
    detected: boolean;
    type: 'bullish' | 'bearish' | null;
    strength: number;
    partialBOS: boolean;
    complexPattern: boolean;
    swingSequence: SwingPoint[];
  } {
    if (candles.length < 50) {
      return { 
        detected: false, 
        type: null, 
        strength: 0, 
        partialBOS: false, 
        complexPattern: false,
        swingSequence: []
      };
    }

    const swings = this.findSwingPoints(candles, 4); // More sensitive swing detection
    const recentSwings = swings.slice(-8); // Analyze last 8 swings
    
    if (recentSwings.length < 6) {
      return { 
        detected: false, 
        type: null, 
        strength: 0, 
        partialBOS: false, 
        complexPattern: false,
        swingSequence: recentSwings
      };
    }

    // Analyze swing sequences for trend changes
    const highs = recentSwings.filter(s => s.type === 'high').slice(-4);
    const lows = recentSwings.filter(s => s.type === 'low').slice(-4);
    
    let bullishSignals = 0;
    let bearishSignals = 0;
    let partialBOS = false;
    let complexPattern = false;

    // Check for higher highs and higher lows (bullish MSS)
    if (highs.length >= 3) {
      for (let i = 1; i < highs.length; i++) {
        if (highs[i].price > highs[i-1].price) {
          bullishSignals++;
        } else if (highs[i].price > highs[i-1].price * 0.9995) {
          partialBOS = true; // Near miss, partial break
        }
      }
    }

    if (lows.length >= 3) {
      for (let i = 1; i < lows.length; i++) {
        if (lows[i].price > lows[i-1].price) {
          bullishSignals++;
        } else if (lows[i].price > lows[i-1].price * 0.9995) {
          partialBOS = true;
        }
      }
    }

    // Check for lower highs and lower lows (bearish MSS)
    if (highs.length >= 3) {
      for (let i = 1; i < highs.length; i++) {
        if (highs[i].price < highs[i-1].price) {
          bearishSignals++;
        }
      }
    }

    if (lows.length >= 3) {
      for (let i = 1; i < lows.length; i++) {
        if (lows[i].price < lows[i-1].price) {
          bearishSignals++;
        }
      }
    }

    // Detect complex patterns (mixed signals)
    if (bullishSignals > 0 && bearishSignals > 0) {
      complexPattern = true;
    }

    const totalSignals = bullishSignals + bearishSignals;
    if (totalSignals === 0) {
      return { 
        detected: false, 
        type: null, 
        strength: 0, 
        partialBOS, 
        complexPattern,
        swingSequence: recentSwings
      };
    }

    const bullishPercentage = (bullishSignals / totalSignals) * 100;
    let type: 'bullish' | 'bearish' | null = null;
    let strength = 0;

    if (bullishPercentage >= 70) {
      type = 'bullish';
      strength = bullishPercentage;
    } else if (bullishPercentage <= 30) {
      type = 'bearish';
      strength = 100 - bullishPercentage;
    }

    // Boost strength for clear patterns
    if (type && !complexPattern) {
      strength = Math.min(100, strength + 15);
    }

    return {
      detected: type !== null && strength >= 60,
      type,
      strength,
      partialBOS,
      complexPattern,
      swingSequence: recentSwings
    };
  }

  /**
   * Advanced FVG retest detection
   */
  public detectFVGRetest(candles: CandleData[]): {
    detected: boolean;
    fvgLevel: number | null;
    retestConfirmed: boolean;
    strength: number;
    direction: 'bullish' | 'bearish' | null;
  } {
    if (candles.length < 20) {
      return { detected: false, fvgLevel: null, retestConfirmed: false, strength: 0, direction: null };
    }

    const recent = candles.slice(-20);
    
    // Find FVGs (Fair Value Gaps)
    for (let i = 0; i < recent.length - 3; i++) {
      const candle1 = recent[i];
      const candle2 = recent[i + 1];
      const candle3 = recent[i + 2];
      
      // Bullish FVG: candle1.high < candle3.low
      if (candle1.high < candle3.low) {
        const fvgTop = candle3.low;
        const fvgBottom = candle1.high;
        const fvgMid = (fvgTop + fvgBottom) / 2;
        
        // Check for retest in subsequent candles
        for (let j = i + 3; j < recent.length; j++) {
          const testCandle = recent[j];
          
          // Price retested the FVG zone
          if (testCandle.low <= fvgTop && testCandle.high >= fvgBottom) {
            // Confirm rejection from FVG
            if (j < recent.length - 1) {
              const nextCandle = recent[j + 1];
              if (nextCandle.close > fvgMid) {
                return {
                  detected: true,
                  fvgLevel: fvgMid,
                  retestConfirmed: true,
                  strength: 75,
                  direction: 'bullish'
                };
              }
            }
          }
        }
      }
      
      // Bearish FVG: candle1.low > candle3.high
      if (candle1.low > candle3.high) {
        const fvgTop = candle1.low;
        const fvgBottom = candle3.high;
        const fvgMid = (fvgTop + fvgBottom) / 2;
        
        // Check for retest in subsequent candles
        for (let j = i + 3; j < recent.length; j++) {
          const testCandle = recent[j];
          
          // Price retested the FVG zone
          if (testCandle.high >= fvgBottom && testCandle.low <= fvgTop) {
            // Confirm rejection from FVG
            if (j < recent.length - 1) {
              const nextCandle = recent[j + 1];
              if (nextCandle.close < fvgMid) {
                return {
                  detected: true,
                  fvgLevel: fvgMid,
                  retestConfirmed: true,
                  strength: 75,
                  direction: 'bearish'
                };
              }
            }
          }
        }
      }
    }

    return { detected: false, fvgLevel: null, retestConfirmed: false, strength: 0, direction: null };
  }

  /**
   * Calculate timeframe confluence for liquidity sweeps
   */
  private calculateTimeframeConfluence(candleData: Record<string, CandleData[]>, sweep: LiquiditySweepResult): number {
    let confluenceBonus = 0;
    let confirmingTimeframes = 0;

    for (const timeframe of this.TIMEFRAMES) {
      if (!candleData[timeframe] || timeframe === 'M15') continue; // Skip base timeframe
      
      const tfSweep = this.detectLiquiditySweep(candleData[timeframe]);
      
      if (tfSweep.detected && 
          tfSweep.sweptType === sweep.sweptType && 
          Math.abs((tfSweep.sweptLevel || 0) - (sweep.sweptLevel || 0)) / (sweep.sweptLevel || 1) < 0.001) {
        confirmingTimeframes++;
      }
    }

    // Bonus for each confirming timeframe
    confluenceBonus = confirmingTimeframes * 15;
    
    return confluenceBonus;
  }
  /**
   * Identifies swing points (highs and lows) in the price data
   * Enhanced with dynamic strength detection and better filtering
   */
  private findSwingPoints(candles: CandleData[], strength: number = this.MIN_SWING_STRENGTH): SwingPoint[] {
    const swings: SwingPoint[] = [];
    const lookback = Math.min(this.SWING_LOOKBACK, candles.length);
    const startIndex = Math.max(0, candles.length - lookback);

    for (let i = startIndex + strength; i < candles.length - strength; i++) {
      const current = candles[i];

      // Check for swing high with stricter criteria
      let isSwingHigh = true;
      let leftHigherCount = 0;
      let rightHigherCount = 0;

      for (let j = i - strength; j < i; j++) {
        if (candles[j].high >= current.high) {
          isSwingHigh = false;
          break;
        }
        if (candles[j].high < current.high) leftHigherCount++;
      }

      if (isSwingHigh) {
        for (let j = i + 1; j <= i + strength; j++) {
          if (candles[j].high >= current.high) {
            isSwingHigh = false;
            break;
          }
          if (candles[j].high < current.high) rightHigherCount++;
        }
      }

      // Only add if it's a clear swing high
      if (isSwingHigh && leftHigherCount >= strength && rightHigherCount >= strength) {
        swings.push({
          index: i,
          price: current.high,
          type: 'high',
          time: current.time
        });
      }

      // Check for swing low with stricter criteria
      let isSwingLow = true;
      let leftLowerCount = 0;
      let rightLowerCount = 0;

      for (let j = i - strength; j < i; j++) {
        if (candles[j].low <= current.low) {
          isSwingLow = false;
          break;
        }
        if (candles[j].low > current.low) leftLowerCount++;
      }

      if (isSwingLow) {
        for (let j = i + 1; j <= i + strength; j++) {
          if (candles[j].low <= current.low) {
            isSwingLow = false;
            break;
          }
          if (candles[j].low > current.low) rightLowerCount++;
        }
      }

      // Only add if it's a clear swing low
      if (isSwingLow && leftLowerCount >= strength && rightLowerCount >= strength) {
        swings.push({
          index: i,
          price: current.low,
          type: 'low',
          time: current.time
        });
      }
    }

    return swings.sort((a, b) => a.index - b.index);
  }

  /**
   * Detects liquidity sweeps with high accuracy
   * Enhanced to directly analyze price curve and recent swing extremes
   */
  public detectLiquiditySweep(candles: CandleData[]): LiquiditySweepResult {
    if (candles.length < 30) {
      return { detected: false, sweptLevel: null, sweptType: null, confirmationCandle: null, strength: 0 };
    }

    const swings = this.findSwingPoints(candles);
    const recentCandles = candles.slice(-15); // Look at last 15 candles for more context

    // Get recent swing highs and lows
    const recentHighs = swings.filter(s => s.type === 'high').slice(-5);
    const recentLows = swings.filter(s => s.type === 'low').slice(-5);

    let bestSweep: LiquiditySweepResult = {
      detected: false,
      sweptLevel: null,
      sweptType: null,
      confirmationCandle: null,
      strength: 0
    };

    // Check for high sweeps - price breaks above recent highs then reverses
    for (const swingHigh of recentHighs) {
      // Only consider recent swings (within lookback window)
      if (swingHigh.index < candles.length - this.SWING_LOOKBACK) continue;

      for (let i = 0; i < recentCandles.length; i++) {
        const candle = recentCandles[i];
        const candleIndex = candles.length - recentCandles.length + i;

        // Skip if this candle is before or at the swing point
        if (candleIndex <= swingHigh.index) continue;

        // Check if candle high swept above the swing high
        const sweepAmount = candle.high - swingHigh.price;
        const relativeSweep = sweepAmount / swingHigh.price;

        if (sweepAmount > this.LIQUIDITY_THRESHOLD && relativeSweep > 0.00005) {
          // Look for rejection - price closes back below the level
          const hasRejection = candle.close < swingHigh.price ||
                               (i < recentCandles.length - 1 && recentCandles[i + 1].close < swingHigh.price);

          if (hasRejection) {
            const confirmationIndex = this.findRejectionCandle(candles, candleIndex, 'high', swingHigh.price);
            const strength = this.calculateEnhancedSweepStrength(candles, candleIndex, swingHigh, 'high', sweepAmount);

            if (strength > bestSweep.strength && strength > 55) {
              bestSweep = {
                detected: true,
                sweptLevel: swingHigh.price,
                sweptType: 'high',
                confirmationCandle: confirmationIndex || candleIndex,
                strength
              };
            }
          }
        }
      }
    }

    // Check for low sweeps - price breaks below recent lows then reverses
    for (const swingLow of recentLows) {
      // Only consider recent swings
      if (swingLow.index < candles.length - this.SWING_LOOKBACK) continue;

      for (let i = 0; i < recentCandles.length; i++) {
        const candle = recentCandles[i];
        const candleIndex = candles.length - recentCandles.length + i;

        // Skip if this candle is before or at the swing point
        if (candleIndex <= swingLow.index) continue;

        // Check if candle low swept below the swing low
        const sweepAmount = swingLow.price - candle.low;
        const relativeSweep = sweepAmount / swingLow.price;

        if (sweepAmount > this.LIQUIDITY_THRESHOLD && relativeSweep > 0.00005) {
          // Look for rejection - price closes back above the level
          const hasRejection = candle.close > swingLow.price ||
                               (i < recentCandles.length - 1 && recentCandles[i + 1].close > swingLow.price);

          if (hasRejection) {
            const confirmationIndex = this.findRejectionCandle(candles, candleIndex, 'low', swingLow.price);
            const strength = this.calculateEnhancedSweepStrength(candles, candleIndex, swingLow, 'low', sweepAmount);

            if (strength > bestSweep.strength && strength > 55) {
              bestSweep = {
                detected: true,
                sweptLevel: swingLow.price,
                sweptType: 'low',
                confirmationCandle: confirmationIndex || candleIndex,
                strength
              };
            }
          }
        }
      }
    }

    return bestSweep;
  }

  /**
   * Detects Break of Structure (BoS) with high accuracy
   * Enhanced to analyze price curve directly for trend changes
   */
  public detectBreakOfStructure(candles: CandleData[]): BreakOfStructureResult {
    if (candles.length < 40) {
      return {
        detected: false,
        type: null,
        breakLevel: null,
        confirmationCandle: null,
        strength: 0,
        previousStructure: [],
        timeframeConfirmation: {},
        multiTimeframeStrength: 0
      };
    }

    const swings = this.findSwingPoints(candles);
    const recentSwings = swings.slice(-8); // Last 8 swing points for better context

    if (recentSwings.length < 5) {
      return {
        detected: false,
        type: null,
        breakLevel: null,
        confirmationCandle: null,
        strength: 0,
        previousStructure: recentSwings,
        timeframeConfirmation: {},
        multiTimeframeStrength: 0
      };
    }

    // Analyze trend structure to understand current market direction
    const trendAnalysis = this.analyzeTrendStructure(recentSwings);

    // Check for bullish BoS (break above previous high in downtrend or continuation in uptrend)
    const bullishBoS = this.checkEnhancedBullishBoS(candles, recentSwings, trendAnalysis);

    // Check for bearish BoS (break below previous low in uptrend or continuation in downtrend)
    const bearishBoS = this.checkEnhancedBearishBoS(candles, recentSwings, trendAnalysis);

    // Return the strongest BoS signal with lower threshold for detection
    if (bullishBoS.strength > bearishBoS.strength && bullishBoS.strength > 50) {
      return {
        detected: true,
        type: 'bullish',
        breakLevel: bullishBoS.breakLevel,
        confirmationCandle: bullishBoS.confirmationCandle,
        strength: bullishBoS.strength,
        previousStructure: recentSwings,
        timeframeConfirmation: {},
        multiTimeframeStrength: 0
      };
    } else if (bearishBoS.strength > 50) {
      return {
        detected: true,
        type: 'bearish',
        breakLevel: bearishBoS.breakLevel,
        confirmationCandle: bearishBoS.confirmationCandle,
        strength: bearishBoS.strength,
        previousStructure: recentSwings,
        timeframeConfirmation: {},
        multiTimeframeStrength: 0
      };
    }

    return {
      detected: false,
      type: null,
      breakLevel: null,
      confirmationCandle: null,
      strength: 0,
      previousStructure: recentSwings,
      timeframeConfirmation: {},
      multiTimeframeStrength: 0
    };
  }

  /**
   * Enhanced calculation of sweep strength
   */
  private calculateEnhancedSweepStrength(
    candles: CandleData[],
    sweepIndex: number,
    level: SwingPoint,
    sweepType: 'high' | 'low',
    sweepAmount: number
  ): number {
    let strength = 55; // Base strength

    const sweepCandle = candles[sweepIndex];
    const candleRange = sweepCandle.high - sweepCandle.low;

    // Factor 1: Sweep conviction (how far beyond the level)
    const atr = this.calculateATR(candles.slice(Math.max(0, sweepIndex - 14), sweepIndex));
    if (sweepAmount > atr * 0.3) {
      strength += 15;
    }
    if (sweepAmount > atr * 0.5) {
      strength += 10;
    }

    // Factor 2: Rejection strength (wick size vs body)
    const bodySize = Math.abs(sweepCandle.close - sweepCandle.open);
    const wickSize = sweepType === 'high'
      ? sweepCandle.high - Math.max(sweepCandle.open, sweepCandle.close)
      : Math.min(sweepCandle.open, sweepCandle.close) - sweepCandle.low;

    if (wickSize > bodySize * 1.5) {
      strength += 15;
    }
    if (wickSize > candleRange * 0.6) {
      strength += 10;
    }

    // Factor 3: Immediate reversal confirmation
    if (sweepIndex < candles.length - 1) {
      const nextCandle = candles[sweepIndex + 1];
      const reversed = sweepType === 'high'
        ? nextCandle.close < level.price && nextCandle.close < nextCandle.open
        : nextCandle.close > level.price && nextCandle.close > nextCandle.open;

      if (reversed) {
        strength += 20;
      }
    }

    // Factor 4: Volume confirmation
    const avgVolume = candles.slice(Math.max(0, sweepIndex - 20), sweepIndex)
      .reduce((sum, c) => sum + c.volume, 0) / 20;
    if (sweepCandle.volume > avgVolume * 1.5) {
      strength += 10;
    }

    return Math.min(strength, 100);
  }

  /**
   * Finds rejection candle after a sweep
   */
  private findRejectionCandle(candles: CandleData[], sweepIndex: number, sweepType: 'high' | 'low', level: number): number | null {
    const lookAhead = Math.min(3, candles.length - sweepIndex - 1);
    
    for (let i = 1; i <= lookAhead; i++) {
      const candle = candles[sweepIndex + i];
      
      if (sweepType === 'high') {
        // Look for bearish rejection (close below level after sweep above)
        if (candle.close < level && candle.open > candle.close) {
          return sweepIndex + i;
        }
      } else {
        // Look for bullish rejection (close above level after sweep below)
        if (candle.close > level && candle.close > candle.open) {
          return sweepIndex + i;
        }
      }
    }
    
    return null;
  }

  /**
   * Calculates the strength of a liquidity sweep
   */
  private calculateSweepStrength(candles: CandleData[], sweepIndex: number, level: SwingPoint, sweepType: 'high' | 'low'): number {
    let strength = 50; // Base strength
    
    const sweepCandle = candles[sweepIndex];
    
    // Factor 1: Volume (if available and above average)
    const avgVolume = candles.slice(Math.max(0, sweepIndex - 20), sweepIndex).reduce((sum, c) => sum + c.volume, 0) / 20;
    if (sweepCandle.volume > avgVolume * 1.5) {
      strength += 15;
    }
    
    // Factor 2: Wick size (larger wick = stronger rejection)
    const bodySize = Math.abs(sweepCandle.close - sweepCandle.open);
    const wickSize = sweepType === 'high' 
      ? sweepCandle.high - Math.max(sweepCandle.open, sweepCandle.close)
      : Math.min(sweepCandle.open, sweepCandle.close) - sweepCandle.low;
    
    if (wickSize > bodySize * 2) {
      strength += 20;
    }
    
    // Factor 3: Time since level formation (older levels = more significant)
    const levelAge = sweepIndex - level.index;
    if (levelAge > 10) {
      strength += 10;
    }
    
    // Factor 4: Number of touches at level
    const touches = this.countLevelTouches(candles, level.price, sweepIndex);
    strength += Math.min(touches * 5, 15);
    
    return Math.min(strength, 100);
  }

  /**
   * Analyzes the overall trend structure
   */
  private analyzeTrendStructure(swings: SwingPoint[]): { trend: 'bullish' | 'bearish' | 'sideways'; strength: number } {
    if (swings.length < 4) {
      return { trend: 'sideways', strength: 0 };
    }

    const highs = swings.filter(s => s.type === 'high').slice(-3);
    const lows = swings.filter(s => s.type === 'low').slice(-3);

    let bullishSignals = 0;
    let bearishSignals = 0;

    // Check for higher highs
    if (highs.length >= 2) {
      for (let i = 1; i < highs.length; i++) {
        if (highs[i].price > highs[i-1].price) {
          bullishSignals++;
        } else {
          bearishSignals++;
        }
      }
    }

    // Check for higher lows / lower lows
    if (lows.length >= 2) {
      for (let i = 1; i < lows.length; i++) {
        if (lows[i].price > lows[i-1].price) {
          bullishSignals++;
        } else {
          bearishSignals++;
        }
      }
    }

    const totalSignals = bullishSignals + bearishSignals;
    if (totalSignals === 0) {
      return { trend: 'sideways', strength: 0 };
    }

    const bullishPercentage = (bullishSignals / totalSignals) * 100;
    
    if (bullishPercentage >= 70) {
      return { trend: 'bullish', strength: bullishPercentage };
    } else if (bullishPercentage <= 30) {
      return { trend: 'bearish', strength: 100 - bullishPercentage };
    } else {
      return { trend: 'sideways', strength: 50 };
    }
  }

  /**
   * Enhanced bullish Break of Structure detection
   */
  private checkEnhancedBullishBoS(
    candles: CandleData[],
    swings: SwingPoint[],
    trendAnalysis: { trend: 'bullish' | 'bearish' | 'sideways'; strength: number }
  ): { strength: number; breakLevel: number | null; confirmationCandle: number | null } {
    const recentHighs = swings.filter(s => s.type === 'high').slice(-3);
    const recentLows = swings.filter(s => s.type === 'low').slice(-2);

    if (recentHighs.length < 1) {
      return { strength: 0, breakLevel: null, confirmationCandle: null };
    }

    // Find the most significant recent high to break
    let targetHigh = recentHighs[recentHighs.length - 1];

    // In a downtrend, breaking the most recent lower high is significant
    if (trendAnalysis.trend === 'bearish' && recentHighs.length >= 2) {
      targetHigh = recentHighs[recentHighs.length - 1];
    }

    const recentCandles = candles.slice(-15);
    let bestBoS = { strength: 0, breakLevel: null as number | null, confirmationCandle: null as number | null };

    // Look for break above the target high
    for (let i = 0; i < recentCandles.length; i++) {
      const candle = recentCandles[i];
      const candleIndex = candles.length - recentCandles.length + i;

      // Skip if this is the swing candle itself
      if (candleIndex <= targetHigh.index) continue;

      // Check for close above the high (body break is more significant)
      const breakAmount = candle.close - targetHigh.price;
      const relativeBreak = breakAmount / targetHigh.price;

      if (breakAmount > 0 && relativeBreak > 0.00003) {
        // Look for confirmation
        const confirmationIndex = this.findBoSConfirmation(candles, candleIndex, 'bullish', targetHigh.price);

        // Calculate strength even without strict confirmation for better detection
        const hasImplicitConfirmation = candle.close > candle.open ||
          (i < recentCandles.length - 1 && recentCandles[i + 1].low > targetHigh.price * 0.9995);

        if (confirmationIndex !== null || hasImplicitConfirmation) {
          let strength = this.calculateEnhancedBoSStrength(
            candles,
            candleIndex,
            targetHigh,
            'bullish',
            breakAmount,
            trendAnalysis
          );

          // Boost strength if breaking structure in a downtrend (trend reversal)
          if (trendAnalysis.trend === 'bearish') {
            strength += 15;
          }

          if (strength > bestBoS.strength) {
            bestBoS = {
              strength,
              breakLevel: targetHigh.price,
              confirmationCandle: confirmationIndex || candleIndex
            };
          }
        }
      }
    }

    return bestBoS;
  }

  /**
   * Enhanced bearish Break of Structure detection
   */
  private checkEnhancedBearishBoS(
    candles: CandleData[],
    swings: SwingPoint[],
    trendAnalysis: { trend: 'bullish' | 'bearish' | 'sideways'; strength: number }
  ): { strength: number; breakLevel: number | null; confirmationCandle: number | null } {
    const recentLows = swings.filter(s => s.type === 'low').slice(-3);
    const recentHighs = swings.filter(s => s.type === 'high').slice(-2);

    if (recentLows.length < 1) {
      return { strength: 0, breakLevel: null, confirmationCandle: null };
    }

    // Find the most significant recent low to break
    let targetLow = recentLows[recentLows.length - 1];

    // In an uptrend, breaking the most recent higher low is significant
    if (trendAnalysis.trend === 'bullish' && recentLows.length >= 2) {
      targetLow = recentLows[recentLows.length - 1];
    }

    const recentCandles = candles.slice(-15);
    let bestBoS = { strength: 0, breakLevel: null as number | null, confirmationCandle: null as number | null };

    // Look for break below the target low
    for (let i = 0; i < recentCandles.length; i++) {
      const candle = recentCandles[i];
      const candleIndex = candles.length - recentCandles.length + i;

      // Skip if this is the swing candle itself
      if (candleIndex <= targetLow.index) continue;

      // Check for close below the low (body break is more significant)
      const breakAmount = targetLow.price - candle.close;
      const relativeBreak = breakAmount / targetLow.price;

      if (breakAmount > 0 && relativeBreak > 0.00003) {
        // Look for confirmation
        const confirmationIndex = this.findBoSConfirmation(candles, candleIndex, 'bearish', targetLow.price);

        // Calculate strength even without strict confirmation for better detection
        const hasImplicitConfirmation = candle.close < candle.open ||
          (i < recentCandles.length - 1 && recentCandles[i + 1].high < targetLow.price * 1.0005);

        if (confirmationIndex !== null || hasImplicitConfirmation) {
          let strength = this.calculateEnhancedBoSStrength(
            candles,
            candleIndex,
            targetLow,
            'bearish',
            breakAmount,
            trendAnalysis
          );

          // Boost strength if breaking structure in an uptrend (trend reversal)
          if (trendAnalysis.trend === 'bullish') {
            strength += 15;
          }

          if (strength > bestBoS.strength) {
            bestBoS = {
              strength,
              breakLevel: targetLow.price,
              confirmationCandle: confirmationIndex || candleIndex
            };
          }
        }
      }
    }

    return bestBoS;
  }

  /**
   * Finds BoS confirmation candles
   */
  private findBoSConfirmation(candles: CandleData[], breakIndex: number, direction: 'bullish' | 'bearish', level: number): number | null {
    const lookAhead = Math.min(this.BOS_CONFIRMATION_CANDLES, candles.length - breakIndex - 1);
    
    let confirmationCount = 0;
    
    for (let i = 1; i <= lookAhead; i++) {
      const candle = candles[breakIndex + i];
      
      if (direction === 'bullish') {
        if (candle.close > level) {
          confirmationCount++;
        }
      } else {
        if (candle.close < level) {
          confirmationCount++;
        }
      }
    }
    
    return confirmationCount >= 1 ? breakIndex + 1 : null;
  }

  /**
   * Enhanced BoS strength calculation
   */
  private calculateEnhancedBoSStrength(
    candles: CandleData[],
    breakIndex: number,
    level: SwingPoint,
    direction: 'bullish' | 'bearish',
    breakAmount: number,
    trendAnalysis: { trend: 'bullish' | 'bearish' | 'sideways'; strength: number }
  ): number {
    let strength = 50; // Base strength for BoS

    const breakCandle = candles[breakIndex];
    const atr = this.calculateATR(candles.slice(Math.max(0, breakIndex - 14), breakIndex));

    // Factor 1: Break conviction (how decisively price broke the level)
    if (breakAmount > atr * 0.3) {
      strength += 15;
    }
    if (breakAmount > atr * 0.6) {
      strength += 10;
    }

    // Factor 2: Candle strength (bullish/bearish candle with good body)
    const bodySize = Math.abs(breakCandle.close - breakCandle.open);
    const candleRange = breakCandle.high - breakCandle.low;
    const bodyRatio = bodySize / candleRange;

    const isBullishCandle = breakCandle.close > breakCandle.open;
    const isBearishCandle = breakCandle.close < breakCandle.open;

    if ((direction === 'bullish' && isBullishCandle && bodyRatio > 0.6) ||
        (direction === 'bearish' && isBearishCandle && bodyRatio > 0.6)) {
      strength += 15;
    }

    // Factor 3: Sustained break (price stays beyond level)
    if (breakIndex < candles.length - 2) {
      const next1 = candles[breakIndex + 1];
      const next2 = candles[breakIndex + 2];

      const sustained = direction === 'bullish'
        ? next1.low > level.price * 0.9998 && next2.low > level.price * 0.9997
        : next1.high < level.price * 1.0002 && next2.high < level.price * 1.0003;

      if (sustained) {
        strength += 20;
      }
    }

    // Factor 4: Volume confirmation
    const avgVolume = candles.slice(Math.max(0, breakIndex - 20), breakIndex)
      .reduce((sum, c) => sum + c.volume, 0) / 20;
    if (breakCandle.volume > avgVolume * 1.3) {
      strength += 15;
    }

    // Factor 5: Level significance
    const levelAge = breakIndex - level.index;
    if (levelAge > 10 && levelAge < 50) {
      strength += 10;
    }

    return Math.min(strength, 100);
  }

  /**
   * Counts how many times price touched a level
   */
  private countLevelTouches(candles: CandleData[], level: number, endIndex: number, tolerance: number = 0.0003): number {
    let touches = 0;
    
    for (let i = 0; i < endIndex; i++) {
      const candle = candles[i];
      const highDiff = Math.abs(candle.high - level) / level;
      const lowDiff = Math.abs(candle.low - level) / level;
      
      if (highDiff <= tolerance || lowDiff <= tolerance) {
        touches++;
      }
    }
    
    return touches;
  }

  /**
   * Calculates Average True Range
   */
  private calculateATR(candles: CandleData[], period: number = 14): number {
    if (candles.length < period + 1) return 0;
    
    const trueRanges: number[] = [];
    
    for (let i = 1; i < candles.length; i++) {
      const current = candles[i];
      const previous = candles[i - 1];
      
      const tr = Math.max(
        current.high - current.low,
        Math.abs(current.high - previous.close),
        Math.abs(current.low - previous.close)
      );
      
      trueRanges.push(tr);
    }
    
    const recentTRs = trueRanges.slice(-period);
    return recentTRs.reduce((sum, tr) => sum + tr, 0) / recentTRs.length;
  }
}

// Export singleton instance
export const pythonPreCalculator = new PythonPreCalculator();