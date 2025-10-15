import type { Candle } from '../types';

export async function fetchRealMarketData(
  symbol: string,
  timeframe: string = '15', 
  limit: number = 500
): Promise<Candle[]> {
  const apiKey = import.meta.env.VITE_POLYGON_API_KEY;

  if (!apiKey || apiKey === 'your_polygon_api_key_here') {
    console.warn('Polygon.io API key not configured. Using mock data.');
    return generateMockCandles(symbol, limit);
  }

  try {
    const forex = symbol.replace('/', '');
    const to = Date.now();
    const from = to - (limit * parseInt(timeframe) * 60 * 1000);
    const multiplier = parseInt(timeframe);

    const url = `https://api.polygon.io/v2/aggs/ticker/C:${forex}/range/${multiplier}/minute/${from}/${to}?adjusted=true&sort=asc&limit=${limit}&apiKey=${apiKey}`;

    const response = await fetch(url);

    if (!response.ok) {
      console.error('Polygon.io API error:', response.status);
      return generateMockCandles(symbol, limit);
    }

    const data = await response.json();

    if (!data.results || data.results.length === 0) {
      console.warn('No data from Polygon.io, using mock data');
      return generateMockCandles(symbol, limit);
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
    console.error('Error fetching market data:', error);
    return generateMockCandles(symbol, limit);
  }
}

export async function fetchMultiTimeframeData(symbol: string): Promise<Record<string, Candle[]>> {
  const timeframes = {
    'D1': { multiplier: 1, timespan: 'day', limit: 100 },
    'H4': { multiplier: 4, timespan: 'hour', limit: 200 },
    'H1': { multiplier: 1, timespan: 'hour', limit: 300 },
    'M30': { multiplier: 30, timespan: 'minute', limit: 400 },
    'M15': { multiplier: 15, timespan: 'minute', limit: 500 },
    'M5': { multiplier: 5, timespan: 'minute', limit: 600 },
    'M1': { multiplier: 1, timespan: 'minute', limit: 1000 }
  };

  const apiKey = import.meta.env.VITE_POLYGON_API_KEY;
  const result: Record<string, Candle[]> = {};

  if (!apiKey || apiKey === 'your_polygon_api_key_here') {
    // Generate mock data for all timeframes
    for (const [tf, config] of Object.entries(timeframes)) {
      result[tf] = generateMockCandles(symbol, config.limit);
    }
    return result;
  }

  const forex = symbol.replace('/', '');
  const to = Date.now();

  for (const [tf, config] of Object.entries(timeframes)) {
    try {
      const from = to - (config.limit * config.multiplier * (config.timespan === 'day' ? 24 * 60 : config.timespan === 'hour' ? 60 : 1) * 60 * 1000);
      
      const url = `https://api.polygon.io/v2/aggs/ticker/C:${forex}/range/${config.multiplier}/${config.timespan}/${from}/${to}?adjusted=true&sort=asc&limit=${config.limit}&apiKey=${apiKey}`;
      
      const response = await fetch(url);
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.results && data.results.length > 0) {
          result[tf] = data.results.map((bar: any) => ({
            time: bar.t,
            open: bar.o,
            high: bar.h,
            low: bar.l,
            close: bar.c,
            volume: bar.v || 1000
          }));
        } else {
          result[tf] = generateMockCandles(symbol, config.limit);
        }
      } else {
        result[tf] = generateMockCandles(symbol, config.limit);
      }
      
      // Rate limiting - wait 100ms between requests
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.error(`Error fetching ${tf} data:`, error);
      result[tf] = generateMockCandles(symbol, config.limit);
    }
  }

  return result;
}

export function generateMockCandles(symbol: string, count: number = 500): Candle[] {
  const candles: Candle[] = [];
  const now = Date.now();
  const basePrice = symbol.includes('XAU') ? 2000 : 1.1;
  const volatility = symbol.includes('XAU') ? 15 : 0.0015;

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

export function convertSymbolForPolygon(symbol: string): string {
  const mapping: Record<string, string> = {
    'EURUSD': 'EUR/USD',
    'GBPUSD': 'GBP/USD',
    'USDJPY': 'USD/JPY',
    'GBPJPY': 'GBP/JPY',
    'XAUUSD': 'XAU/USD'
  };
  return mapping[symbol] || symbol;
}