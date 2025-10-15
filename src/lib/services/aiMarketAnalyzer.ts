import type { Candle } from '../types';
import type { ForexPairData } from './polygonDataFetcher';

interface TechnicalPattern {
  type: 'FVG' | 'OB' | 'LIQUIDITY_SWEEP' | 'BOS';
  direction: 'bullish' | 'bearish';
  timeframe: string;
  price: number;
  confidence: number;
  description: string;
}

export interface AIAnalysisResult {
  symbol: string;
  patterns: TechnicalPattern[];
  bias: 'bullish' | 'bearish' | 'neutral';
  confidence: number;
  summary: string;
  entryZone?: { low: number; high: number };
  stopLoss?: number;
  takeProfit?: number;
  timestamp: number;
}

export class AIMarketAnalyzer {
  private apiKey: string;
  private model = 'gpt-4-turbo-preview';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async analyzeMarketData(pairData: ForexPairData): Promise<AIAnalysisResult> {
    const prompt = this.buildAnalysisPrompt(pairData);

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            {
              role: 'system',
              content: this.getSystemPrompt()
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.3,
          max_tokens: 2000
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      const analysisText = data.choices[0].message.content;

      return this.parseAIResponse(analysisText, pairData.symbol);
    } catch (error) {
      console.error(`AI analysis error for ${pairData.symbol}:`, error);
      throw error;
    }
  }

  async analyzeAllPairs(pairsData: ForexPairData[]): Promise<AIAnalysisResult[]> {
    const results: AIAnalysisResult[] = [];

    for (const pairData of pairsData) {
      try {
        const analysis = await this.analyzeMarketData(pairData);
        results.push(analysis);
        await this.delay(1000);
      } catch (error) {
        console.error(`Failed to analyze ${pairData.symbol}:`, error);
      }
    }

    return results;
  }

  private getSystemPrompt(): string {
    return `You are an expert forex and gold trader specializing in Smart Money Concepts (SMC) and advanced technical analysis.

Your task is to analyze candlestick data and identify the following patterns:
1. FVG (Fair Value Gap) - gaps in price that need to be filled
2. OB (Order Block) - zones where institutions placed large orders
3. Liquidity Sweep - price movements designed to trigger stop losses before reversing
4. BOS (Break of Structure) - confirming trend changes (bullish or bearish)

For each pattern found, provide:
- Pattern type
- Direction (bullish/bearish)
- Price level
- Confidence score (0-100)
- Brief description

Then provide:
- Overall market bias (bullish/bearish/neutral)
- Overall confidence (0-100)
- Trading recommendation with entry zone, stop loss, and take profit
- Summary of market structure

Format your response as JSON:
{
  "patterns": [
    {
      "type": "FVG|OB|LIQUIDITY_SWEEP|BOS",
      "direction": "bullish|bearish",
      "timeframe": "M15|H1|H4",
      "price": number,
      "confidence": number,
      "description": "string"
    }
  ],
  "bias": "bullish|bearish|neutral",
  "confidence": number,
  "summary": "string",
  "entryZone": { "low": number, "high": number },
  "stopLoss": number,
  "takeProfit": number
}`;
  }

  private buildAnalysisPrompt(pairData: ForexPairData): string {
    const recentCandles = pairData.candles.slice(-100);

    const candleData = recentCandles.map(c => ({
      time: new Date(c.time).toISOString(),
      open: c.open.toFixed(5),
      high: c.high.toFixed(5),
      low: c.low.toFixed(5),
      close: c.close.toFixed(5),
      volume: Math.round(c.volume)
    }));

    const currentPrice = recentCandles[recentCandles.length - 1].close;
    const priceChange = ((currentPrice - recentCandles[0].open) / recentCandles[0].open * 100).toFixed(2);

    return `Analyze ${pairData.symbol} market data:

Current Price: ${currentPrice.toFixed(5)}
Price Change (100 candles): ${priceChange}%
Timeframe: 15 minutes
Total Candles: ${candleData.length}

Recent Candlestick Data (last 100 candles):
${JSON.stringify(candleData, null, 2)}

Identify:
1. Fair Value Gaps (FVG)
2. Order Blocks (OB)
3. Liquidity Sweeps
4. Break of Structure (BOS)

Provide trading signals with entry zones, stop loss, and take profit levels.`;
  }

  private parseAIResponse(responseText: string, symbol: string): AIAnalysisResult {
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);

      return {
        symbol,
        patterns: parsed.patterns || [],
        bias: parsed.bias || 'neutral',
        confidence: parsed.confidence || 0,
        summary: parsed.summary || 'No summary available',
        entryZone: parsed.entryZone,
        stopLoss: parsed.stopLoss,
        takeProfit: parsed.takeProfit,
        timestamp: Date.now()
      };
    } catch (error) {
      console.error('Failed to parse AI response:', error);
      return {
        symbol,
        patterns: [],
        bias: 'neutral',
        confidence: 0,
        summary: 'Failed to parse AI analysis',
        timestamp: Date.now()
      };
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export function createAIAnalyzer(apiKey?: string): AIMarketAnalyzer {
  const key = apiKey || import.meta.env.VITE_OPENAI_API_KEY;

  if (!key || key === 'your_openai_api_key_here') {
    throw new Error('OpenAI API key not configured');
  }

  return new AIMarketAnalyzer(key);
}
