import { createPolygonFetcher, type ForexPairData } from './polygonDataFetcher';
import { createAIAnalyzer, type AIAnalysisResult } from './aiMarketAnalyzer';
import { supabase } from '../supabase';

export interface ScanResult {
  pairData: ForexPairData;
  aiAnalysis: AIAnalysisResult;
}

export interface ScanSummary {
  totalPairs: number;
  successfulScans: number;
  failedScans: number;
  results: ScanResult[];
  timestamp: number;
}

export class MarketScanOrchestrator {
  async scanAllMarkets(userId?: string): Promise<ScanSummary> {
    const timestamp = Date.now();
    const results: ScanResult[] = [];
    let successfulScans = 0;
    let failedScans = 0;

    try {
      const polygonFetcher = createPolygonFetcher();
      const aiAnalyzer = createAIAnalyzer();

      console.log('Fetching market data from Polygon.io...');
      const pairsData = await polygonFetcher.fetchAllPairs('15', 500);

      console.log(`Fetched data for ${pairsData.length} pairs`);

      for (const pairData of pairsData) {
        try {
          console.log(`Analyzing ${pairData.symbol}...`);
          const aiAnalysis = await aiAnalyzer.analyzeMarketData(pairData);

          results.push({
            pairData,
            aiAnalysis
          });

          if (userId) {
            await this.saveAnalysisToDatabase(pairData, aiAnalysis, userId);
          }

          successfulScans++;
        } catch (error) {
          console.error(`Failed to analyze ${pairData.symbol}:`, error);
          failedScans++;
        }
      }

      return {
        totalPairs: pairsData.length,
        successfulScans,
        failedScans,
        results,
        timestamp
      };
    } catch (error) {
      console.error('Market scan failed:', error);
      throw error;
    }
  }

  async scanSinglePair(symbol: string, userId?: string): Promise<ScanResult> {
    try {
      const polygonFetcher = createPolygonFetcher();
      const aiAnalyzer = createAIAnalyzer();

      console.log(`Fetching ${symbol} data from Polygon.io...`);
      const candles = await polygonFetcher.fetchPairData(symbol, '15', 500);

      const pairData: ForexPairData = {
        symbol,
        candles,
        timestamp: Date.now()
      };

      console.log(`Analyzing ${symbol}...`);
      const aiAnalysis = await aiAnalyzer.analyzeMarketData(pairData);

      if (userId) {
        await this.saveAnalysisToDatabase(pairData, aiAnalysis, userId);
      }

      return {
        pairData,
        aiAnalysis
      };
    } catch (error) {
      console.error(`Failed to scan ${symbol}:`, error);
      throw error;
    }
  }

  private async saveAnalysisToDatabase(
    pairData: ForexPairData,
    analysis: AIAnalysisResult,
    userId: string
  ): Promise<void> {
    try {
      const { data: pairRecord } = await supabase
        .from('trading_pairs')
        .select('id')
        .eq('symbol', pairData.symbol)
        .maybeSingle();

      if (!pairRecord) {
        console.warn(`Trading pair ${pairData.symbol} not found in database`);
        return;
      }

      const { data: existingAnalysis } = await supabase
        .from('ai_market_analysis')
        .select('id')
        .eq('pair_id', pairRecord.id)
        .eq('user_id', userId)
        .gte('created_at', new Date(Date.now() - 3600000).toISOString())
        .maybeSingle();

      if (existingAnalysis) {
        await supabase
          .from('ai_market_analysis')
          .update({
            patterns: analysis.patterns,
            bias: analysis.bias,
            confidence: analysis.confidence,
            summary: analysis.summary,
            entry_zone: analysis.entryZone,
            stop_loss: analysis.stopLoss,
            take_profit: analysis.takeProfit,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingAnalysis.id);
      } else {
        await supabase
          .from('ai_market_analysis')
          .insert({
            pair_id: pairRecord.id,
            user_id: userId,
            patterns: analysis.patterns,
            bias: analysis.bias,
            confidence: analysis.confidence,
            summary: analysis.summary,
            entry_zone: analysis.entryZone,
            stop_loss: analysis.stopLoss,
            take_profit: analysis.takeProfit
          });
      }
    } catch (error) {
      console.error('Failed to save analysis to database:', error);
    }
  }
}

export const marketScanOrchestrator = new MarketScanOrchestrator();
