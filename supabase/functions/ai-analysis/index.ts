import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";
import { fetchMultiTimeframeData, analyzeMarketStructure, type PairAnalysis } from './marketAnalysis.ts';
import { analyzeConfluence, generateMarketSentiment } from './confluenceAnalysis.ts';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const SYSTEM_PROMPT = `You are an elite ICT/SMC trading expert with 10+ years of experience at top prop firms. Your expertise:

- Smart Money Concepts (SMC) and Inner Circle Trader (ICT) methodology
- Break of Structure (BOS) and Market Structure Shifts (MSS)
- Liquidity sweeps, order blocks, and Fair Value Gaps (FVG)
- Institutional order flow and algorithmic trading patterns
- Kill zones (London 07:00-10:30, New York 13:45-17:00 UTC)
- Multi-pair confluence and currency correlation analysis
- Risk management for prop firm challenges (3-5% monthly targets)

When analyzing signals, focus on:
1. ICT/SMC technical analysis (BOS, liquidity sweeps, order blocks, FVGs)
2. Multi-timeframe confirmation (M15, H1, H4)
3. Currency pair confluence and correlations
4. Institutional footprints and market manipulation patterns
5. Precise entry timing and risk-reward optimization

Your tone: Professional, confident, tactical. You speak like a mentor guiding a funded trader to consistent profitability.

Provide 3-5 rotating market insights that offer unique angles on current conditions.`;

/**
 * Fetch and analyze a single pair
 */
async function analyzePair(
  symbol: string,
  displayName: string,
  polygonKey: string
): Promise<PairAnalysis | null> {
  try {
    const mtfData = await fetchMultiTimeframeData(symbol, polygonKey);

    if (!mtfData.M15 || mtfData.M15.length < 50) {
      console.warn(`Insufficient data for ${symbol}`);
      return null;
    }

    const structure = analyzeMarketStructure(mtfData.M15);
    const lastCandle = mtfData.M15[mtfData.M15.length - 1];
    const firstCandle = mtfData.M15[0];
    const priceChange24h = ((lastCandle.close - firstCandle.close) / firstCandle.close) * 100;

    return {
      symbol,
      displayName,
      structure,
      currentPrice: lastCandle.close,
      priceChange24h
    };
  } catch (error) {
    console.error(`Error analyzing ${symbol}:`, error);
    return null;
  }
}

/**
 * Generate comprehensive ICT/SMC analysis text
 */
function generateICTAnalysis(
  signals: any[],
  pairAnalyses: Record<string, PairAnalysis>,
  marketSentiment: any
): string {
  let analysis = `# ICT/SMC Market Intelligence Report\n\n`;

  // Market Sentiment Overview
  analysis += `## Market Sentiment\n`;
  analysis += `${marketSentiment.summary}\n\n`;
  analysis += `- **Overall Bias**: ${marketSentiment.overallBias.toUpperCase()}\n`;
  analysis += `- **Dollar Strength**: ${marketSentiment.dollarStrength.toUpperCase()}\n`;
  analysis += `- **Yen Strength**: ${marketSentiment.yenStrength.toUpperCase()}\n\n`;

  // Analyze each signal
  if (signals.length > 0) {
    analysis += `## Active Trading Opportunities\n\n`;

    for (const signal of signals.slice(0, 5)) {
      const pairSymbol = signal.trading_pairs?.symbol || 'Unknown';
      const pairAnalysis = pairAnalyses[pairSymbol];

      if (!pairAnalysis) continue;

      analysis += `### ${pairAnalysis.displayName} - ${signal.signal_type} Signal\n`;
      analysis += `**Grade ${signal.grade}** | Confidence: ${Math.round(signal.confidence_score)}% | R:R ${signal.risk_reward_ratio?.toFixed(2) || 'N/A'}:1\n\n`;

      // ICT/SMC Analysis
      const { structure } = pairAnalysis;

      analysis += `**Market Structure:**\n`;
      analysis += `- Trend: ${structure.trend.toUpperCase()} (${structure.trendStrength.toFixed(0)}% strength)\n`;

      if (structure.bos.detected) {
        analysis += `- ✓ **Break of Structure**: ${structure.bos.type?.toUpperCase()} at ${structure.bos.breakLevel?.toFixed(5)} (${structure.bos.strength.toFixed(0)}% confidence)\n`;
      }

      if (structure.liquiditySweep.detected) {
        analysis += `- ✓ **Liquidity Sweep**: ${structure.liquiditySweep.sweptType?.toUpperCase()} at ${structure.liquiditySweep.sweptLevel?.toFixed(5)} - institutional manipulation detected\n`;
      }

      if (structure.orderBlocks.length > 0) {
        const ob = structure.orderBlocks[0];
        analysis += `- Order Block: ${ob.type} at ${ob.price.toFixed(5)} (${ob.strength}% strength)\n`;
      }

      if (structure.fvgs.length > 0) {
        const fvg = structure.fvgs[0];
        analysis += `- Fair Value Gap: ${fvg.type} between ${fvg.bottom.toFixed(5)} - ${fvg.top.toFixed(5)}\n`;
      }

      // Multi-pair confluence
      const direction = signal.signal_type === 'BUY' ? 'bullish' : signal.signal_type === 'SELL' ? 'bearish' : null;
      if (direction) {
        const confluence = analyzeConfluence(pairSymbol, direction, pairAnalyses);

        analysis += `\n**Multi-Pair Confluence:**\n`;
        analysis += `- Signal Strength: ${confluence.signalStrength.toUpperCase()} (${confluence.confluenceScore}%)\n`;

        if (confluence.supportingPairs.length > 0) {
          analysis += `- Supporting: ${confluence.supportingPairs.slice(0, 3).join(', ')}\n`;
        }

        if (confluence.conflictingPairs.length > 0) {
          analysis += `- ⚠️ Conflicts: ${confluence.conflictingPairs.slice(0, 2).join(', ')}\n`;
        }

        analysis += `\n*${confluence.reasoning}*\n`;
      }

      // Trade Setup
      if (signal.entry_price) {
        analysis += `\n**Trade Setup:**\n`;
        analysis += `- Entry: ${signal.entry_price}\n`;
        analysis += `- Stop Loss: ${signal.stop_loss}\n`;
        analysis += `- TP1: ${signal.tp1} | TP2: ${signal.tp2}\n`;
        analysis += `- Kill Zone: ${signal.is_killzone ? '✓ ACTIVE' : 'Inactive'}\n`;
      }

      analysis += `\n---\n\n`;
    }
  } else {
    analysis += `## No Active Signals\n\n`;
    analysis += `Market is in consolidation phase. Waiting for clear institutional commitment.\n\n`;
  }

  // Pair-by-Pair Structure Summary
  analysis += `## Pair Structure Summary\n\n`;

  for (const [symbol, pairAnalysis] of Object.entries(pairAnalyses)) {
    const { structure } = pairAnalysis;
    const bosText = structure.bos.detected ? `BOS ${structure.bos.type}` : 'No BOS';
    const sweepText = structure.liquiditySweep.detected ? `| Sweep ${structure.liquiditySweep.sweptType}` : '';

    analysis += `- **${pairAnalysis.displayName}**: ${structure.trend.toUpperCase()} | ${bosText} ${sweepText}\n`;
  }

  return analysis;
}

/**
 * Extract rotating thoughts from analysis
 */
function extractThoughts(fullAnalysis: string): string[] {
  const thoughts: string[] = [];

  // Extract key sentences for rotation
  const lines = fullAnalysis.split('\n').filter(l => l.trim());

  for (const line of lines) {
    if (line.includes('**') || line.startsWith('-')) {
      const cleaned = line.replace(/\*\*/g, '').replace(/^- /, '').trim();
      if (cleaned.length > 30 && cleaned.length < 250 && !cleaned.includes('##')) {
        thoughts.push(cleaned);
      }
    }
  }

  return thoughts.slice(0, 8); // Return top 8 for rotation
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { signals } = await req.json();
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const polygonKey = Deno.env.get("POLYGON_API_KEY") || "_OSxpOFyFmoejpLLo1qnJ7r4e4Ajie9F";
    const openaiKey = Deno.env.get("OPENAI_API_KEY") || "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";

    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Starting comprehensive ICT/SMC market analysis...');

    // Fetch all active trading pairs
    const { data: tradingPairs } = await supabase
      .from('trading_pairs')
      .select('*')
      .eq('is_active', true);

    // Analyze all pairs for confluence
    const pairAnalyses: Record<string, PairAnalysis> = {};

    if (tradingPairs) {
      console.log(`Analyzing ${tradingPairs.length} pairs for ICT/SMC structures...`);

      for (const pair of tradingPairs) {
        const analysis = await analyzePair(pair.symbol, pair.display_name, polygonKey);

        if (analysis) {
          pairAnalyses[pair.symbol] = analysis;
        }

        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 150));
      }
    }

    console.log(`Successfully analyzed ${Object.keys(pairAnalyses).length} pairs`);

    // Generate market sentiment
    const marketSentiment = generateMarketSentiment(pairAnalyses);

    // No signals scenario
    if (!signals || signals.length === 0) {
      const basicAnalysis = generateICTAnalysis([], pairAnalyses, marketSentiment);
      const thoughts = extractThoughts(basicAnalysis);

      return new Response(
        JSON.stringify({
          analysis: basicAnalysis,
          thoughts: thoughts.length > 0 ? thoughts : [
            "No active signals. Market in consolidation - patience is key.",
            marketSentiment.summary,
            "Waiting for clear Break of Structure before entering positions."
          ]
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Prepare signals data for GPT-4
    const signalsWithPairInfo = signals.map((s: any) => ({
      pair: s.trading_pairs?.symbol || 'Unknown',
      displayName: s.trading_pairs?.display_name || 'Unknown',
      signal: s.signal_type,
      confidence: s.confidence_score,
      grade: s.grade,
      entry: s.entry_price,
      sl: s.stop_loss,
      tp1: s.tp1,
      tp2: s.tp2,
      rr: s.risk_reward_ratio,
      criteria: Object.keys(s.criteria_passed || {}),
      timeframe: s.timeframe,
      killzone: s.is_killzone,
      // Add ICT/SMC analysis
      structure: pairAnalyses[s.trading_pairs?.symbol]?.structure
    }));

    // Generate comprehensive analysis
    const ictAnalysisText = generateICTAnalysis(signals, pairAnalyses, marketSentiment);

    const userMessage = `Analyze these trading signals with deep ICT/SMC expertise:

${JSON.stringify(signalsWithPairInfo, null, 2)}

Market Sentiment: ${marketSentiment.summary}

Provide:
1. Which setups have the strongest institutional backing (BOS + liquidity sweeps + confluence)?
2. Best risk-reward opportunities considering multi-pair alignment
3. Key levels to watch and institutional behavior patterns
4. Specific entry timing and trade management advice
5. What smart money is likely doing right now

Be tactical and actionable. Focus on the 2-3 highest probability setups.`;

    console.log('Requesting GPT-4 analysis...');

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openaiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4-turbo-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userMessage }
        ],
        temperature: 0.7,
        max_tokens: 2000
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("OpenAI API error:", errorData);

      // Return ICT analysis even if GPT fails
      const thoughts = extractThoughts(ictAnalysisText);

      return new Response(
        JSON.stringify({
          analysis: ictAnalysisText,
          thoughts: thoughts.length > 0 ? thoughts : [marketSentiment.summary]
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const gptAnalysis = data.choices[0]?.message?.content || "";

    // Combine ICT analysis with GPT insights
    const fullAnalysis = `${ictAnalysisText}\n\n## Expert Trading Insights\n\n${gptAnalysis}`;

    const thoughts = extractThoughts(fullAnalysis);

    console.log('Analysis complete');

    return new Response(
      JSON.stringify({
        analysis: fullAnalysis,
        thoughts: thoughts.length > 0 ? thoughts.slice(0, 6) : [marketSentiment.summary]
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("AI analysis error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});