export interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface StrategyResult {
  signal: 'BUY' | 'SELL' | 'HOLD';
  confidence: number;
  criteriaPassed: Record<string, boolean>;
  criteriaFailed: Record<string, boolean>;
  explanation: string;
  details: Record<string, any>;
}

export interface RiskReward {
  entry: number;
  stopLoss: number;
  tp1: number;
  tp2: number;
  ratio: number;
  pipRisk: number;
  pipReward: number;
}

export interface TradingSignal {
  id: string;
  pairId: string;
  pairSymbol: string;
  pairDisplayName: string;
  userId?: string;
  signalType: 'BUY' | 'SELL' | 'HOLD';
  strategyUsed: string;
  entryPrice: number | null;
  stopLoss: number | null;
  tp1: number | null;
  tp2: number | null;
  confidenceScore: number;
  grade: 'A+' | 'A' | 'B+' | 'B' | 'C';
  riskRewardRatio: number | null;
  timeframe: string;
  explanation: string;
  criteriaPassed: Record<string, boolean>;
  criteriaFailed: Record<string, boolean>;
  isKillzone: boolean;
  status: 'active' | 'expired' | 'taken';
  createdAt: string;
  expiresAt: string;
}

export interface ActivityLog {
  id: string;
  userId?: string;
  activityType: string;
  pairSymbol?: string;
  signalId?: string;
  metadata: Record<string, any>;
  message: string;
  createdAt: string;
}

export interface UserSettings {
  id: string;
  userId: string;
  preferredPairs: string[];
  minConfidenceThreshold: number;
  minGradeThreshold: string;
  notifyInApp: boolean;
  notifyEmail: boolean;
  notifySms: boolean;
  autoScanEnabled: boolean;
  scanIntervalMinutes: number;
  smsNotificationsEnabled: boolean;
  secretStrategyUnlocked: boolean;
}

export interface SwingPoint {
  index: number;
  price: number;
  type: 'high' | 'low';
}

export interface Signal {
  id: string;
  user_id: string;
  symbol: string;
  timeframe: string;
  direction: 'long' | 'short';
  entry: number;
  stop_loss: number;
  take_profit: number;
  confidence: number;
  strategy: string;
  status: 'active' | 'expired' | 'taken';
  created_at: string;
  metadata?: Record<string, any>;
}

export interface KillzoneChecklist {
  liquiditySwept: boolean;
  breakOfStructure: boolean;
  fvgOrOB: boolean;
  inKillzone: boolean;
  rrMinimum: boolean;
  noMajorNews: boolean;
}

export interface AsianChecklist {
  asianRangeDefined: boolean;
  validRangeSize: boolean;
  breakoutDetected: boolean;
  fakeoutConfirmed: boolean;
  structureShift: boolean;
  confluenceMet: number;
}
