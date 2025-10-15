import { supabase } from '../supabase';

export async function logActivity(
  activityType: string,
  message: string,
  options: {
    userId?: string;
    pairSymbol?: string;
    signalId?: string;
    metadata?: Record<string, any>;
  } = {}
) {
  try {
    await supabase.from('activity_logs').insert({
      user_id: options.userId || null,
      activity_type: activityType,
      pair_symbol: options.pairSymbol || null,
      signal_id: options.signalId || null,
      metadata: options.metadata || {},
      message
    });
  } catch (error) {
    console.error('Failed to log activity:', error);
  }
}

export async function logSignalGenerated(
  pairSymbol: string,
  signalId: string,
  signalType: string,
  strategy: string,
  confidence: number,
  criteriaPassed: Record<string, boolean>,
  criteriaFailed: Record<string, boolean>
) {
  const passedList = Object.keys(criteriaPassed).join(', ');
  const failedList = Object.keys(criteriaFailed).join(', ');

  await logActivity('SIGNAL_GENERATED',
    `${signalType} signal for ${pairSymbol} using ${strategy} strategy. Confidence: ${confidence}%. Passed: ${passedList}. Failed: ${failedList}.`,
    {
      pairSymbol,
      signalId,
      metadata: {
        signalType,
        strategy,
        confidence,
        criteriaPassed,
        criteriaFailed
      }
    }
  );
}

export async function logSignalRejected(
  pairSymbol: string,
  strategy: string,
  reason: string,
  criteriaPassed: Record<string, boolean>,
  criteriaFailed: Record<string, boolean>
) {
  const passedCount = Object.keys(criteriaPassed).length;
  const failedList = Object.keys(criteriaFailed).join(', ');

  await logActivity('SIGNAL_REJECTED',
    `Signal rejected for ${pairSymbol} using ${strategy}. Reason: ${reason}. Only ${passedCount} criteria passed. Missing: ${failedList}.`,
    {
      pairSymbol,
      metadata: {
        strategy,
        reason,
        criteriaPassed,
        criteriaFailed
      }
    }
  );
}

export async function logScanStarted(pairSymbol: string, userId?: string) {
  await logActivity('SCAN_STARTED',
    `Market scan initiated for ${pairSymbol}`,
    { userId, pairSymbol }
  );
}

export async function logUserAction(
  userId: string,
  action: string,
  signalId?: string,
  metadata?: Record<string, any>
) {
  await logActivity('USER_ACTION',
    `User action: ${action}`,
    { userId, signalId, metadata }
  );
}
