import type { Candle } from '../types';

interface PolygonBar {
  t: number;
  o: number;
  h: number;
  l: number;
  c: number;
  v: number;
}

interface PolygonResponse {
  ticker: string;
  queryCount: number;
  resultsCount: number;
  adjusted: boolean;
  results: PolygonBar[];
  status: string;
}

export interface ForexPairData {
  symbol: string;
  candles: Candle[];
  timestamp: number;
}

const TRADING_PAIRS = [
  { symbol: 'EURUSD', polygonTicker: 'C:EURUSD' },
  { symbol: 'GBPUSD', polygonTicker: 'C:GBPUSD' },
  { symbol: 'XAUUSD', polygonTicker: 'C:XAUUSD' },
  { symbol: 'USDJPY', polygonTicker: 'C:USDJPY' },
  { symbol: 'GBPJPY', polygonTicker: 'C:GBPJPY' }
];

export class PolygonDataFetcher {
  private apiKey: string;
  private baseUrl = 'https://api.polygon.io/v2/aggs/ticker';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async fetchAllPairs(timeframe: string = '15', limit: number = 500): Promise<ForexPairData[]> {
    const results: ForexPairData[] = [];

    for (const pair of TRADING_PAIRS) {
      try {
        const candles = await this.fetchPairData(pair.symbol, timeframe, limit);
        results.push({
          symbol: pair.symbol,
          candles,
          timestamp: Date.now()
        });

        await this.delay(200);
      } catch (error) {
        console.error(`Error fetching ${pair.symbol}:`, error);
      }
    }

    return results;
  }

  async fetchPairData(symbol: string, timeframe: string = '15', limit: number = 500): Promise<Candle[]> {
    const pair = TRADING_PAIRS.find(p => p.symbol === symbol);
    if (!pair) {
      throw new Error(`Unknown trading pair: ${symbol}`);
    }

    const to = Date.now();
    const multiplier = parseInt(timeframe);
    const from = to - (limit * multiplier * 60 * 1000);

    const url = `${this.baseUrl}/${pair.polygonTicker}/range/${multiplier}/minute/${from}/${to}?adjusted=true&sort=asc&limit=${limit}&apiKey=${this.apiKey}`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Polygon API error: ${response.status} ${response.statusText}`);
    }

    const data: PolygonResponse = await response.json();

    if (!data.results || data.results.length === 0) {
      throw new Error(`No data returned for ${symbol}`);
    }

    return data.results.map((bar: PolygonBar) => ({
      time: bar.t,
      open: bar.o,
      high: bar.h,
      low: bar.l,
      close: bar.c,
      volume: bar.v || 1000
    }));
  }

  async fetchMultiTimeframeData(symbol: string): Promise<Record<string, Candle[]>> {
    const timeframes = {
      'H4': { multiplier: 4, timespan: 'hour', limit: 200 },
      'H1': { multiplier: 1, timespan: 'hour', limit: 300 },
      'M15': { multiplier: 15, timespan: 'minute', limit: 500 }
    };

    const pair = TRADING_PAIRS.find(p => p.symbol === symbol);
    if (!pair) {
      throw new Error(`Unknown trading pair: ${symbol}`);
    }

    const result: Record<string, Candle[]> = {};
    const to = Date.now();

    for (const [tf, config] of Object.entries(timeframes)) {
      try {
        const timeMultiplier = config.timespan === 'hour' ? 60 : 1;
        const from = to - (config.limit * config.multiplier * timeMultiplier * 60 * 1000);

        const url = `${this.baseUrl}/${pair.polygonTicker}/range/${config.multiplier}/${config.timespan}/${from}/${to}?adjusted=true&sort=asc&limit=${config.limit}&apiKey=${this.apiKey}`;

        const response = await fetch(url);

        if (response.ok) {
          const data: PolygonResponse = await response.json();

          if (data.results && data.results.length > 0) {
            result[tf] = data.results.map((bar: PolygonBar) => ({
              time: bar.t,
              open: bar.o,
              high: bar.h,
              low: bar.l,
              close: bar.c,
              volume: bar.v || 1000
            }));
          }
        }

        await this.delay(200);
      } catch (error) {
        console.error(`Error fetching ${tf} data for ${symbol}:`, error);
      }
    }

    return result;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export function createPolygonFetcher(apiKey?: string): PolygonDataFetcher {
  const key = apiKey || import.meta.env.VITE_POLYGON_API_KEY;

  if (!key || key === 'your_polygon_api_key_here') {
    throw new Error('Polygon.io API key not configured');
  }

  return new PolygonDataFetcher(key);
}
