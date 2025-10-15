import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface SessionStatus {
  isActive: boolean;
  currentSession: string | null;
  nextSession: string | null;
  timeUntilNext: number;
  serverTime: Date;
}

function getCurrentSession(): SessionStatus {
  const now = new Date();
  // Convert to Paris time (UTC+1 in winter, UTC+2 in summer)
  const parisTime = new Date(now.toLocaleString("en-US", {timeZone: "Europe/Paris"}));
  const currentHour = parisTime.getHours();
  const currentMinute = parisTime.getMinutes();
  const currentTime = currentHour * 60 + currentMinute;

  const sessions = [
    { name: 'Asian', start: 60, end: 420 }, // 01:00-07:00
    { name: 'Asian Killzone', start: 420, end: 510 }, // 07:00-08:30
    { name: 'London Killzone', start: 420, end: 630 }, // 07:00-10:30
    { name: 'New York Killzone', start: 840, end: 1020 }, // 14:00-17:00
  ];

  let activeSession: string | null = null;
  let nextSession: string | null = null;
  let timeUntilNext = Infinity;

  for (const session of sessions) {
    if (currentTime >= session.start && currentTime < session.end) {
      activeSession = session.name;
    }

    if (currentTime < session.start) {
      const timeUntil = session.start - currentTime;
      if (timeUntil < timeUntilNext) {
        timeUntilNext = timeUntil;
        nextSession = session.name;
      }
    }
  }

  return {
    isActive: activeSession !== null,
    currentSession: activeSession,
    nextSession: nextSession || sessions[0].name,
    timeUntilNext: timeUntilNext === Infinity ? 0 : timeUntilNext,
    serverTime: now,
  };
}

function isInKillzone(session: string | null): boolean {
  return session === 'London Killzone' || 
         session === 'New York Killzone' || 
         session === 'Asian Killzone';
}

function isInAsianSession(session: string | null): boolean {
  return session === 'Asian';
}

function shouldRunContinuousScan(session: string | null): boolean {
  return session === 'Asian Killzone' || 
         session === 'London Killzone' || 
         session === 'New York Killzone';
}
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const sessionStatus = getCurrentSession();
    const now = new Date();

    // Only run during active sessions
    if (!sessionStatus.isActive) {
      return new Response(
        JSON.stringify({
          message: 'No active trading session',
          session: sessionStatus.currentSession,
          nextSession: sessionStatus.nextSession
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    let sessionId: string | null = null;

    if (sessionStatus.isActive && sessionStatus.currentSession) {
      const { data: existingSession } = await supabase
        .from('strategy_sessions')
        .select('id')
        .eq('session_name', sessionStatus.currentSession)
        .eq('status', 'active')
        .gte('start_time', new Date(now.getTime() - 12 * 60 * 60 * 1000).toISOString())
        .maybeSingle();

      if (existingSession) {
        sessionId = existingSession.id;
      } else {
        const { data: newSession } = await supabase
          .from('strategy_sessions')
          .insert({
            session_type: isInKillzone(sessionStatus.currentSession) ? 'killzone' : 'asian',
            session_name: sessionStatus.currentSession,
            start_time: now.toISOString(),
            end_time: new Date(now.getTime() + 4 * 60 * 60 * 1000).toISOString(),
            status: 'active'
          })
          .select('id')
          .single();

        if (newSession) {
          sessionId = newSession.id;
        }
      }
    }

    const { data: users } = await supabase
      .from('user_settings')
      .select('user_id, preferred_pairs, auto_scan_enabled')
      .eq('auto_scan_enabled', true);

    if (!users || users.length === 0) {
      return new Response(
        JSON.stringify({
          message: 'No users with auto-scan enabled',
          session: sessionStatus.currentSession,
          sessionId
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let totalSignals = 0;
    const results: any[] = [];

    for (const userSettings of users) {
      const { data: prefs } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', userSettings.user_id)
        .maybeSingle();

      const shouldNotifyKillzone = prefs?.notify_killzone_signals !== false;
      const shouldNotifyAsian = prefs?.notify_asian_signals !== false;

      // Determine if we should scan based on session and user preferences
      const shouldScan = shouldRunContinuousScan(sessionStatus.currentSession) && (
        (sessionStatus.currentSession === 'Asian Killzone' && shouldNotifyAsian) ||
        (sessionStatus.currentSession === 'London Killzone' && shouldNotifyKillzone) ||
        (sessionStatus.currentSession === 'New York Killzone' && shouldNotifyKillzone)
      );

      if (!shouldScan) continue;

      const preferredPairs = Array.isArray(userSettings.preferred_pairs)
        ? userSettings.preferred_pairs
        : ['EURUSD'];

      for (const pairSymbol of preferredPairs) {
        try {
          const analyzeUrl = `${supabaseUrl}/functions/v1/analyze-market`;
          const response = await fetch(analyzeUrl, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${supabaseKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              pairSymbol,
              userId: userSettings.user_id,
              sessionId,
              strategyType: isInKillzone(sessionStatus.currentSession) ? 'killzone' : 'asian'
            })
          });

          if (response.ok) {
            const result = await response.json();
            if (result.signal) {
              totalSignals++;
              results.push({
                user: userSettings.user_id,
                pair: pairSymbol,
                signal: result.signal.direction
              });
            }
          }
        } catch (error) {
          console.error(`Failed to analyze ${pairSymbol}:`, error);
        }
      }
    }

    if (sessionId && totalSignals > 0) {
      await supabase
        .from('strategy_sessions')
        .update({ signals_generated: totalSignals })
        .eq('id', sessionId);
    }

    return new Response(
      JSON.stringify({
        message: 'Strategy execution completed',
        session: sessionStatus.currentSession,
        sessionId,
        signalsGenerated: totalSignals,
        users: users.length,
        results
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Strategy execution error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});