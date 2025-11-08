import type { Candle } from '../types';

export async function fetchRealMarketData(
  symbol: string,
  timeframe: string = '15',
  limit: number = 200
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

export function generateMockCandles(symbol: string, count: number = 200): Candle[] {
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
