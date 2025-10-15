import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: users } = await supabase
      .from("user_settings")
      .select("user_id, preferred_pairs, auto_scan_enabled, notify_in_app, secret_strategy_activated")
      .eq("auto_scan_enabled", true)
      .eq("notify_in_app", true);

    if (!users || users.length === 0) {
      return new Response(
        JSON.stringify({ message: "No users with auto-scan and in-app notifications enabled", scanned: 0 }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let totalScans = 0;

    for (const userSettings of users) {
      const preferredPairs = Array.isArray(userSettings.preferred_pairs)
        ? userSettings.preferred_pairs
        : ['EURUSD'];

      for (const pairSymbol of preferredPairs) {
        const { data: pair } = await supabase
          .from("trading_pairs")
          .select("*")
          .eq("symbol", pairSymbol)
          .eq("is_active", true)
          .single();

        if (!pair) continue;

        await supabase.from("activity_logs").insert({
          user_id: userSettings.user_id,
          activity_type: "SCAN_STARTED",
          pair_symbol: pair.symbol,
          message: `Auto-scan initiated for ${pair.symbol}${userSettings.secret_strategy_activated ? ' (SECRET Strategy ACTIVE)' : ''}`,
          metadata: { 
            autoScan: true, 
            cronJob: true,
            secretStrategyActive: userSettings.secret_strategy_activated || false
          }
        });

        try {
          const analyzeUrl = `${supabaseUrl}/functions/v1/analyze-market`;
          const response = await fetch(analyzeUrl, {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${supabaseKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ 
              pairSymbol: pair.symbol, 
              userId: userSettings.user_id,
              secretStrategyActive: userSettings.secret_strategy_activated || false
            })
          });

          if (response.ok) {
            totalScans++;
          }
        } catch (error) {
          console.error(`Failed to analyze ${pair.symbol}:`, error);
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        message: "Auto-scan completed", 
        scanned: totalScans, 
        users: users.length,
        secretStrategyUsers: users.filter(u => u.secret_strategy_activated).length
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
