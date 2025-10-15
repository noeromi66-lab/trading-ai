# Strategy Automation System

## Overview

The trading platform now includes two automated trading strategies with session-based timing and intelligent notification routing:

1. **Killzone Strategy** - Trades during London (07:00-10:30) and New York (13:45-17:00) sessions
2. **Asian Session Strategy** - Monitors Asian range (00:00-06:00) and trades fakeouts during London Killzone (06:00-08:00)

## Master Clock System

The `MasterClock` module provides:
- Synchronized UTC-based time reference
- Session detection and tracking
- Automatic timing for CRON jobs
- Consistent scheduling across all strategies

## Notification System

### Email Notifications
- **Filters Applied**: Signal confidence, grade, strategy type
- Configurable minimum thresholds
- Strategy-specific opt-in/opt-out

### SMS Notifications
- **NO FILTERS**: All signals sent immediately
- Requires phone number verification
- Triggers SECRET strategy unlock flow
- Background operation (app can be closed)

## Strategy Details

### Killzone Strategy

**Entry Checklist (Minimum 5/6 required):**
1. Liquidity sweep (equal highs/lows cleared)
2. Break of Structure (ChoCH or BoS confirmed)
3. FVG or Order Block in pivot zone
4. Trading within Killzone hours
5. Risk:Reward ≥ 1:2
6. No major news in next 30 minutes

**Grading System:**
- 6/6 = A+ Setup
- 5/6 = Acceptable Setup
- <5/6 = Rejected (no trade)

**Trade Management:**
- Risk: 0.25% - 1% max per trade
- At 1:2 RR: Take 50% profits, SL to Break Even
- Final TP: 1:3 - 1:5 RR

### Asian Session Strategy

**Setup Requirements:**
1. Asian Range defined (00:00-06:00 UTC)
2. Valid range: 20-50 pips
3. Breakout followed by fakeout
4. Structure shift (CHoCH) confirmed
5. Minimum 3 confluences

**Confluences (6 available):**
- Sweep of Asian extreme
- Change of Character (CHoCH)
- Order Block / Imbalance
- EMA alignment (20/50)
- Volume spike on reversal
- RSI divergence

**Entry Timing:**
- Scan after Asian session close (06:00)
- Trade during London Killzone (06:00-08:00)
- M5/M15 precision entry

## CRON Job Setup

### Strategy Execution Function

**Endpoint:** `/functions/v1/strategy-execution`

**Recommended Schedule:**
- Every 15 minutes during trading hours
- Automatic session detection
- Only scans during active sessions

**Example CRON Expression:**
```
*/15 * * * *
```

### Auto-Scan Function

**Endpoint:** `/functions/v1/auto-scan`
**Requirements:** Users must have both `auto_scan_enabled = true` AND `notify_in_app = true`

**For Legacy Support:**
- Continues to work for general scanning
- Use strategy-execution for new implementations

## In-App Notifications

### Checklist Notifications
- Pin important setup checklists in History tab
- User can dismiss with X button
- Always shown at top with pin icon
- Stored at account level

### Setup:
1. Enable in Settings → General → "In-App Notifications" (mandatory for strategy unlock)
2. Notifications appear in History tab
3. Dismissible but persistent until removed
4. Signal notifications automatically created when signals generated

## SECRET's STRATEGY

### Unlock Conditions:
1. User enables in-app notifications (mandatory)
2. SMS notifications are optional but recommended
3. Strategy unlocks immediately when in-app notifications enabled

### Features:
- Complete Killzone & Asian strategy documentation
- 90%+ win rate methodology
- Daily trading routine
- Risk management rules
- Entry/exit checklists

## Database Schema

### New Tables:
- `user_phone_numbers` - SMS verification
- `notification_preferences` - Email/SMS settings
- `in_app_notifications` - Pinned checklists
- `strategy_sessions` - Session tracking
- `asian_ranges` - Range data storage

### Signal Enhancements:
- `strategy_type` - killzone, asian, smc, ema
- `checklist_data` - Full checklist JSON
- `session_id` - Links to strategy_sessions

## Configuration

### User Settings (Settings Tab):

**General:**
- Trading pairs selection
- Signal confidence threshold
- Minimum grade filter
- Auto-scan toggle

**Notifications:**
- Email on/off + filters
- SMS on/off + phone verification
- Strategy-specific toggles
- In-app checklist option

**SECRET Strategy:**
- Locked until SMS enabled
- Full strategy documentation
- 90%+ win rate methods

## Workflow

### Automated Execution:
1. CRON triggers strategy-execution every 15 minutes
2. Master clock determines active session
3. Function queries users with auto-scan enabled
4. Checks notification preferences per user
5. Scans enabled pairs for each user
6. Generates signals meeting checklist criteria
7. Routes to email (filtered) or SMS (all)
8. Creates in-app notification if enabled
9. Logs to activity_logs and strategy_sessions

### Manual Execution:
1. User clicks "Scan Market" on Dashboard
2. Immediate analysis of selected pair
3. Real-time checklist validation
4. Signal generation if criteria met
5. Notification per user preferences

## Best Practices

1. **Session Timing**: Always reference MasterClock for consistency
2. **Signal Filters**: Apply only to email, never SMS
3. **Phone Verification**: Required before SMS activation
4. **Strategy Sessions**: Track for analytics and optimization
5. **Checklists**: Store full criteria data in signals for review
6. **Notifications**: User controls per-strategy preferences
7. **Background Jobs**: Run even when app closed (stored preferences)

## Testing

To test the automation:
1. Enable auto-scan in Settings
2. Enable SMS notifications (optional)
3. Set preferred trading pairs
4. Trigger strategy-execution function manually
5. Check activity_logs for execution records
6. Verify signals in Dashboard
7. Check notifications in History

## Monitoring

Track system health via:
- `strategy_sessions` table for session activity
- `activity_logs` for scan events
- `signals` table for generation rate
- `in_app_notifications` for user engagement