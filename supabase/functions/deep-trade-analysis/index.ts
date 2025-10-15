import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const MASTER_PROMPT = `Ignore all previous instructions. You are an expert trading ICT/SMC specialist applied to prop firms, aiming for 3-5% profit with ultra-controlled risk.

Your expertise:
- Inner Circle Trader (ICT) methodology
- Smart Money Concepts (SMC)
- Prop firm trading psychology and risk management
- Killzone and Asian session analysis
- Order blocks, Fair Value Gaps, liquidity sweeps
- Break of Structure (BOS) and Change of Character (CHOCH)
- Institutional order flow analysis

Mission: Provide deep, actionable analysis for this specific trade setup. Focus on:
1. Market structure and institutional behavior
2. Optimal entry timing and execution
3. Risk management for prop firm compliance
4. Why this setup has edge over others
5. Specific action plan for execution

Be direct, confident, and tactical. This trader needs precision, not theory.`;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { signal } = await req.json();
    const openaiKey = Deno.env.get("OPENAI_API_KEY") || "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";

    if (!signal) {
      return new Response(
        JSON.stringify({ error: "No signal provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Format signal data for analysis
    const signalData = {
      pair: signal.trading_pairs?.symbol || 'Unknown',
      direction: signal.signal_type,
      confidence: signal.confidence_score,
      dynamicScore: signal.dynamicScore,
      grade: signal.grade,
      entry: signal.entry_price,
      stopLoss: signal.stop_loss,
      tp1: signal.tp1,
      tp2: signal.tp2,
      riskReward: signal.risk_reward_ratio,
      strategy: signal.strategy_used,
      timeframe: signal.timeframe,
      killzone: signal.is_killzone,
      criteriaPassed: Object.keys(signal.criteria_passed || {}),
      criteriaFailed: Object.keys(signal.criteria_failed || {}),
      explanation: signal.explanation
    };

    const analysisPrompt = `Analyze this TOP TRADE setup with deep ICT/SMC expertise:

SIGNAL DETAILS:
- Pair: ${signalData.pair}
- Direction: ${signalData.direction}
- Base Confidence: ${signalData.confidence}%
- Dynamic Score: ${signalData.dynamicScore}%
- Grade: ${signalData.grade}
- Strategy: ${signalData.strategy}
- Timeframe: ${signalData.timeframe}
- Killzone Active: ${signalData.killzone ? 'YES' : 'NO'}

TRADE PARAMETERS:
- Entry: ${signalData.entry}
- Stop Loss: ${signalData.stopLoss}
- Take Profit 1: ${signalData.tp1}
- Take Profit 2: ${signalData.tp2}
- Risk:Reward: 1:${signalData.riskReward}

CRITERIA ANALYSIS:
✅ Confirmed: ${signalData.criteriaPassed.join(', ')}
❌ Missing: ${signalData.criteriaFailed.join(', ')}

INITIAL ANALYSIS: "${signalData.explanation}"

Provide a comprehensive deep-dive analysis covering:

1. MARKET STRUCTURE ASSESSMENT
   - What institutional behavior is evident?
   - How does this setup align with smart money flow?
   - Key support/resistance and liquidity zones

2. EXECUTION STRATEGY
   - Optimal entry technique (market vs limit)
   - Position sizing for prop firm rules
   - Trade management plan

3. RISK ANALYSIS
   - Why this R:R ratio is justified
   - Potential failure scenarios
   - Maximum acceptable drawdown

4. COMPETITIVE EDGE
   - Why this trade beats other current opportunities
   - Institutional confirmation signals
   - Timing advantages

5. ACTION PLAN
   - Step-by-step execution checklist
   - Monitoring requirements
   - Exit strategy refinements

Be specific, actionable, and focused on prop firm success. This trader needs to execute with confidence.`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openaiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4-turbo-preview",
        messages: [
          { role: "system", content: MASTER_PROMPT },
          { role: "user", content: analysisPrompt }
        ],
        temperature: 0.7,
        max_tokens: 2500
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("OpenAI GPT-4 API error:", errorData);
      
      // Fallback analysis
      const fallbackAnalysis = generateFallbackAnalysis(signalData);
      return new Response(
        JSON.stringify({ analysis: fallbackAnalysis }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const analysis = data.choices[0]?.message?.content || "Analysis unavailable";

    return new Response(
      JSON.stringify({ analysis }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Deep analysis error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function generateFallbackAnalysis(signal: any): string {
  const direction = signal.direction.toLowerCase();
  const rr = signal.riskReward || 2.0;
  const confidence = signal.dynamicScore || signal.confidence;
  
  return `🎯 TOP TRADE ANALYSIS - ${signal.pair} ${signal.direction}

MARKET STRUCTURE ASSESSMENT:
This ${direction} setup on ${signal.pair} shows strong institutional commitment with ${confidence}% dynamic confidence. The ${signal.strategy} strategy has identified key smart money footprints including ${signal.criteriaPassed.slice(0, 3).join(', ')}.

EXECUTION STRATEGY:
• Entry: ${signal.entry} (use limit order for better fill)
• Stop Loss: ${signal.stopLoss} (tight institutional level)
• Take Profit: ${signal.tp1} (first target), ${signal.tp2} (extension)
• Position Size: Risk 0.5-1% of account for prop firm compliance

RISK ANALYSIS:
The 1:${rr} risk-reward ratio provides excellent asymmetric opportunity. This setup offers ${rr * 100}% potential return for every 1% risked, well above the 1.5:1 minimum for professional trading.

COMPETITIVE EDGE:
${signal.killzone ? 'KILLZONE ACTIVE - Institutional players are moving money right now. This timing advantage significantly increases probability of success.' : 'Market structure is clean with clear directional bias.'}

The dynamic scoring system has elevated this trade above all others based on:
- Grade ${signal.grade} quality setup
- ${signal.criteriaPassed.length} confirmed institutional signals
- Optimal risk-reward parameters

ACTION PLAN:
1. Set limit order at ${signal.entry}
2. Place stop loss at ${signal.stopLoss}
3. Monitor for fill during next 30 minutes
4. Take 50% profits at TP1, move SL to breakeven
5. Let remaining position run to TP2

This represents the highest probability setup available right now. Execute with confidence.`;
}