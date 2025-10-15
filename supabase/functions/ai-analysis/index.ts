import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface PairData {
  symbol: string;
  current: number;
  previous: number;
  change: number;
  bias: 'BUY' | 'SELL' | 'NEUTRAL';
}

async function fetchPairData(symbol: string, polygonKey: string): Promise<PairData | null> {
  try {
    const forex = symbol.replace('/', '');
    const to = Date.now();
    const from = to - (48 * 60 * 60 * 1000); // 48 hours for comparison
    
    const url = `https://api.polygon.io/v2/aggs/ticker/C:${forex}/range/1/hour/${from}/${to}?adjusted=true&sort=asc&limit=48&apiKey=${polygonKey}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      return null;
    }
    
    const data = await response.json();
    
    if (!data.results || data.results.length < 2) {
      return null;
    }
    
    const current = data.results[data.results.length - 1].c;
    const previous = data.results[data.results.length - 24].c; // 24 hours ago
    const change = ((current - previous) / previous) * 100;
    
    let bias: 'BUY' | 'SELL' | 'NEUTRAL' = 'NEUTRAL';
    if (change > 0.1) bias = 'BUY';
    else if (change < -0.1) bias = 'SELL';
    
    return {
      symbol,
      current,
      previous,
      change,
      bias
    };
  } catch (error) {
    console.error(`Error fetching ${symbol}:`, error);
    return null;
  }
}

function generateConfluenceAnalysis(pairData: Record<string, PairData>): string[] {
  const confluenceMessages: string[] = [];
  
  // EURUSD ↔ EURJPY, EURGBP, GBPUSD
  if (pairData.EURUSD && pairData.EURJPY && pairData.EURGBP && pairData.GBPUSD) {
    const eurConfluences = [];
    if (pairData.EURJPY.bias === pairData.EURUSD.bias) eurConfluences.push('EURJPY');
    if (pairData.EURGBP.bias === pairData.EURUSD.bias) eurConfluences.push('EURGBP');
    if (pairData.GBPUSD.bias === pairData.EURUSD.bias) eurConfluences.push('GBPUSD');
    
    const confluenceStrength = eurConfluences.length >= 2 ? 'strong EUR confluence' : 'mixed EUR signals';
    const confluenceText = eurConfluences.length > 0 ? `confirmed by ${eurConfluences.join(' and ')} also ${pairData.EURUSD.bias.toLowerCase()}` : 'no confluence support';
    
    confluenceMessages.push(`**EURUSD ${pairData.EURUSD.bias.toLowerCase()}** (${pairData.EURUSD.change.toFixed(2)}%) ${confluenceText} — ${confluenceStrength}. EUR/USD represents euro strength vs dollar.`);
  }
  
  // GBPUSD ↔ GBPJPY, EURUSD, EURGBP
  if (pairData.GBPUSD && pairData.GBPJPY && pairData.EURUSD && pairData.EURGBP) {
    const gbpConfluences = [];
    if (pairData.GBPJPY.bias === pairData.GBPUSD.bias) gbpConfluences.push('GBPJPY');
    if (pairData.EURUSD.bias === pairData.GBPUSD.bias) gbpConfluences.push('EURUSD');
    if (pairData.EURGBP.bias !== pairData.GBPUSD.bias && pairData.EURGBP.bias !== 'NEUTRAL') gbpConfluences.push('EURGBP inverse');
    
    const confluenceStrength = gbpConfluences.length >= 2 ? 'strong GBP confluence' : 'mixed GBP signals';
    const confluenceText = gbpConfluences.length > 0 ? `confirmed by ${gbpConfluences.join(' and ')}` : 'no confluence support';
    
    confluenceMessages.push(`**GBPUSD ${pairData.GBPUSD.bias.toLowerCase()}** (${pairData.GBPUSD.change.toFixed(2)}%) ${confluenceText} — ${confluenceStrength}. GBP/USD shows pound vs dollar dynamics.`);
  }
  
  // USDJPY ↔ EURJPY, GBPJPY, AUDJPY
  if (pairData.USDJPY && pairData.EURJPY && pairData.GBPJPY && pairData.AUDJPY) {
    const usdJpyConfluences = [];
    if (pairData.EURJPY.bias === pairData.USDJPY.bias) usdJpyConfluences.push('EURJPY');
    if (pairData.GBPJPY.bias === pairData.USDJPY.bias) usdJpyConfluences.push('GBPJPY');
    if (pairData.AUDJPY.bias === pairData.USDJPY.bias) usdJpyConfluences.push('AUDJPY');
    
    const confluenceStrength = usdJpyConfluences.length >= 2 ? 'strong yen confluence' : 'mixed yen signals';
    const confluenceText = usdJpyConfluences.length > 0 ? `confirmed by ${usdJpyConfluences.join(' and ')} also ${pairData.USDJPY.bias.toLowerCase()}` : 'no confluence support';
    
    confluenceMessages.push(`**USDJPY ${pairData.USDJPY.bias.toLowerCase()}** (${pairData.USDJPY.change.toFixed(2)}%) ${confluenceText} — ${confluenceStrength}. USD/JPY measures dollar vs yen strength.`);
  }
  
  // GBPJPY ↔ GBPUSD, USDJPY, EURJPY
  if (pairData.GBPJPY && pairData.GBPUSD && pairData.USDJPY && pairData.EURJPY) {
    const gbpJpyConfluences = [];
    if (pairData.GBPUSD.bias === pairData.GBPJPY.bias) gbpJpyConfluences.push('GBPUSD');
    if (pairData.USDJPY.bias === pairData.GBPJPY.bias) gbpJpyConfluences.push('USDJPY');
    if (pairData.EURJPY.bias === pairData.GBPJPY.bias) gbpJpyConfluences.push('EURJPY');
    
    const confluenceStrength = gbpJpyConfluences.length >= 2 ? 'strong GBP/JPY confluence' : 'mixed GBP/JPY signals';
    const confluenceText = gbpJpyConfluences.length > 0 ? `confirmed by ${gbpJpyConfluences.join(' and ')}` : 'no confluence support';
    
    confluenceMessages.push(`**GBPJPY ${pairData.GBPJPY.bias.toLowerCase()}** (${pairData.GBPJPY.change.toFixed(2)}%) ${confluenceText} — ${confluenceStrength}. GBP/JPY represents pound vs yen dynamics.`);
  }
  
  // Overall market sentiment
  const bullishPairs = Object.values(pairData).filter(p => p.bias === 'BUY').length;
  const bearishPairs = Object.values(pairData).filter(p => p.bias === 'SELL').length;
  const totalPairs = Object.keys(pairData).length;
  
  if (bullishPairs > bearishPairs) {
    confluenceMessages.push(`**Market Sentiment**: Risk-on with ${bullishPairs}/${totalPairs} pairs bullish. Dollar showing mixed performance across majors — favor long positions.`);
  } else if (bearishPairs > bullishPairs) {
    confluenceMessages.push(`**Market Sentiment**: Risk-off with ${bearishPairs}/${totalPairs} pairs bearish. Flight to safety or dollar strength evident — favor short positions.`);
  } else {
    confluenceMessages.push(`**Market Sentiment**: Neutral with balanced ${bullishPairs}/${totalPairs} bull/bear split. Consolidation phase across major pairs — wait for breakouts.`);
  }
  
  return confluenceMessages;
}

const SYSTEM_PROMPT = `You are an ICT/SMC trading expert with 10+ years of PROPFIRM experience. Your mission is to help traders achieve consistent 3-5% profits with ultra-controlled risk.

Your specialty:
- Smart Money Concepts (SMC)
- Inner Circle Trader (ICT) methodology
- Liquidity sweeps and manipulation
- Order blocks and Fair Value Gaps (FVG)
- Break of Structure (BOS)
- Asian/London/New York killzones
- Risk:Reward optimization for prop firm challenges

When analyzing market data:
1. Identify high-probability setups based on SMC/ICT principles
2. Assess liquidity sweeps and institutional footprints
3. Evaluate order blocks and imbalances
4. Consider killzone timing and session context
5. Calculate precise risk:reward ratios
6. Provide ACTIONABLE sniper entries for MT5 execution

Your tone: Professional, confident, tactical. You speak like a prop firm mentor guiding a funded trader.

Provide 3-5 distinct market thoughts that rotate every 10 seconds, each offering a unique angle on current market conditions.`;

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

    // Fetch specific pairs for confluence analysis as requested
    const confluencePairs = ['EURUSD', 'GBPUSD', 'USDJPY', 'GBPJPY', 'EURJPY', 'EURGBP', 'AUDJPY'];
    const pairData: Record<string, PairData> = {};
    
    // Fetch pair data with rate limiting
    for (const pair of confluencePairs) {
      const data = await fetchPairData(pair, polygonKey);
      if (data) {
        pairData[pair] = data;
      }
      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // Generate confluence analysis
    const confluenceMessages = generateConfluenceAnalysis(pairData);

    if (!signals || signals.length === 0) {
      // Always include confluence analysis when no signals
      return new Response(
        JSON.stringify({
          analysis: "No recent signals to analyze. Here's the current forex confluence analysis based on cross-pair correlations.",
          thoughts: confluenceMessages.length > 0 ? confluenceMessages : [
            "Waiting for market data to analyze. Click 'Scan Market' to begin.",
            "Market is quiet. No active signals detected in the last 5 minutes.",
            "Stand by for market opportunities. Patience is key in trading."
          ]
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const marketSummary = signals.map((s: any) => ({
      pair: s.trading_pairs?.symbol || 'Unknown',
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
      killzone: s.is_killzone
    }));

    const userMessage = `Analyze these recent market signals and provide expert ICT/SMC insights:

${JSON.stringify(marketSummary, null, 2)}

Current Forex Confluence Analysis (EURUSD↔EURJPY,EURGBP,GBPUSD | GBPUSD↔GBPJPY,EURUSD,EURGBP | USDJPY↔EURJPY,GBPJPY,AUDJPY | GBPJPY↔GBPUSD,USDJPY,EURJPY):
${confluenceMessages.join('\n')}

Provide:
1. Overall market sentiment and structure
2. Best opportunities right now (which pairs, which setups)
3. Key levels and institutional behavior
4. Risk assessment and trade management advice
5. What to watch next
`;


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
        max_tokens: 1500
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("OpenAI GPT-4 API error:", errorData);
      
      // Enhanced fallback with confluence analysis
      return new Response(
        JSON.stringify({
          analysis: generateFallbackAnalysis(marketSummary),
          thoughts: [...generateFallbackThoughts(marketSummary), ...confluenceMessages.slice(0, 2)]
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const fullAnalysis = data.choices[0]?.message?.content || "Analysis unavailable";
    
    let thoughts = extractThoughts(fullAnalysis);
    
    // Always include at least one confluence message in thoughts
    if (confluenceMessages.length > 0) {
      // Ensure confluence analysis is included in the rotation
      thoughts = [...confluenceMessages.slice(0, 2), ...thoughts];
    }

    return new Response(
      JSON.stringify({
        analysis: fullAnalysis,
        thoughts: thoughts.length > 0 ? thoughts : [fullAnalysis]
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

function extractThoughts(text: string): string[] {
  const lines = text.split('\n').filter(l => l.trim());
  const thoughts: string[] = [];
  
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].match(/^\d+\./)) {
      const thought = lines[i].replace(/^\d+\.\s*/, '').trim();
      if (thought.length > 20 && thought.length < 300) {
        thoughts.push(thought);
      }
    }
  }
  
  if (thoughts.length === 0) {
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
    for (let i = 0; i < Math.min(5, sentences.length); i += 2) {
      const combined = sentences.slice(i, i + 2).join(' ').trim();
      if (combined.length > 30) thoughts.push(combined);
    }
  }
  
  return thoughts.slice(0, 5);
}

function generateFallbackAnalysis(signals: any[]): string {
  const buySignals = signals.filter(s => s.signal === 'BUY').length;
  const sellSignals = signals.filter(s => s.signal === 'SELL').length;
  const holdSignals = signals.filter(s => s.signal === 'HOLD').length;
  const avgConfidence = signals.reduce((sum, s) => sum + s.confidence, 0) / signals.length;
  const inKillzone = signals.some(s => s.killzone);
  
  let analysis = `Market Overview\n\n`;
  analysis += `Current Signals: ${buySignals} Buy opportunities, ${sellSignals} Sell setups, ${holdSignals} Hold positions\n`;
  analysis += `Average Confidence Level: ${avgConfidence.toFixed(1)}%\n`;
  analysis += `Optimal Trading Session: ${inKillzone ? 'Active' : 'Inactive'}\n\n`;
  
  if (buySignals > sellSignals) {
    analysis += `Market Sentiment: Bullish bias detected. Multiple buy opportunities forming with institutional support above key levels.\n`;
  } else if (sellSignals > buySignals) {
    analysis += `Market Sentiment: Bearish pressure building. Multiple sell setups developing with institutional resistance at key levels.\n`;
  } else {
    analysis += `Market Sentiment: Neutral consolidation. Waiting for clear directional bias and institutional commitment.\n`;
  }
  
  analysis += `\nRecommendation: Focus on high-confidence signals (70%+) with Grade A or A+ ratings for optimal risk-reward opportunities.`;
  
  return analysis;
}

function generateFallbackThoughts(signals: any[]): string[] {
  const highGrade = signals.filter(s => s.grade && ['A', 'A+'].includes(s.grade));
  const inKillzone = signals.filter(s => s.killzone);
  const avgRR = signals.reduce((sum, s) => sum + (s.rr || 0), 0) / signals.length;
  
  const baseThoughts = [
    `${highGrade.length} premium trading opportunities are currently active. These high-grade setups offer excellent probability for reaching profit targets with controlled risk.`,
    
    `Trading Session Status: ${inKillzone.length > 0 ? 'Prime time for institutional activity. Major players are active, creating high-conviction entry opportunities.' : 'Lower volume period. Best opportunities typically emerge during London or New York sessions.'}`,
    
    `Risk Management: Average risk-reward ratio is ${avgRR.toFixed(2)}:1 across all signals. Professional traders target 1.5:1+ ratios, and we're ${avgRR >= 1.5 ? 'exceeding' : 'approaching'} that benchmark.`,
    
    `Institutional Activity: Key market structures are forming including liquidity sweeps and order blocks. Monitor for breakout confirmations before position entry.`,
    
    `Market Structure: Current analysis suggests ${signals.filter(s => s.signal === 'BUY').length > signals.filter(s => s.signal === 'SELL').length ? 'bullish' : 'bearish'} institutional control. Align trades with the dominant flow for best results.`
  ];
  
  return baseThoughts;
}
