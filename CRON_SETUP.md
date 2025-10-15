# 🔄 Cron Job Setup for Auto-Scan

Your API keys are now configured! Here's how to set up automatic market scanning.

## ✅ Your API Keys (Already Configured)

- ✅ **Polygon.io**: `_OSxpOFyFmo...` - Real forex/gold data
- ✅ **OpenAI**: `sk-svcacct-HRZYCv8...` - For enhanced analysis (optional)
- ✅ **Resend**: `re_5qnfaj1X_6...` - For email notifications (optional)

---

## 🚀 Quick Setup Options

### Option 1: Supabase Cron (Recommended - Most Reliable)

1. Go to your Supabase Dashboard: https://wumtsgpybpwtvqierlxr.supabase.co
2. Navigate to **SQL Editor**
3. Run this SQL command:

```sql
-- Enable pg_cron extension if not already enabled
create extension if not exists pg_cron;

-- Schedule auto-scan every 15 minutes
select cron.schedule(
  'trading-ai-auto-scan-15min',
  '*/15 * * * *',
  $$
  select
    net.http_post(
      url:='https://wumtsgpybpwtvqierlxr.supabase.co/functions/v1/auto-scan',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind1bXRzZ3B5YnB3dHZxaWVybHhyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA0NDE5ODYsImV4cCI6MjA3NjAxNzk4Nn0.Mz9ln7_i6gm0pBKQE-4W0Txl5tl1qCoiCSUnJNkYHvY"}'::jsonb,
      body:='{}'::jsonb
    ) as request_id;
  $$
);
```

4. Verify it's working:
```sql
-- Check scheduled jobs
select * from cron.job;

-- View job run history
select * from cron.job_run_details order by start_time desc limit 10;
```

---

### Option 2: Cron-Job.org (Easiest - Free External Service)

1. Go to [cron-job.org](https://cron-job.org) and create free account
2. Click **"Create cronjob"**
3. Configure:
   - **Title**: Trading AI Auto-Scan
   - **URL**: `https://wumtsgpybpwtvqierlxr.supabase.co/functions/v1/auto-scan`
   - **Schedule**: Every 15 minutes (or your preferred interval)
   - **Request method**: POST
   - **Request headers**:
     ```
     Content-Type: application/json
     Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind1bXRzZ3B5YnB3dHZxaWVybHhyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA0NDE5ODYsImV4cCI6MjA3NjAxNzk4Nn0.Mz9ln7_i6gm0pBKQE-4W0Txl5tl1qCoiCSUnJNkYHvY
     ```
4. Save and enable

---

### Option 3: GitHub Actions (Best for Developers)

1. Create `.github/workflows/auto-scan.yml`:

```yaml
name: Trading AI Auto-Scan
on:
  schedule:
    - cron: '*/15 * * * *'  # Every 15 minutes
  workflow_dispatch:  # Allow manual trigger

jobs:
  scan-markets:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Auto-Scan
        run: |
          curl -X POST \
            -H "Content-Type: application/json" \
            -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind1bXRzZ3B5YnB3dHZxaWVybHhyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA0NDE5ODYsImV4cCI6MjA3NjAxNzk4Nn0.Mz9ln7_i6gm0pBKQE-4W0Txl5tl1qCoiCSUnJNkYHvY" \
            https://wumtsgpybpwtvqierlxr.supabase.co/functions/v1/auto-scan
```

2. Commit and push to GitHub
3. GitHub will automatically run every 15 minutes

---

## 🎯 How Auto-Scan Works

1. **Cron triggers** the `auto-scan` Edge Function
2. Function queries all users with `auto_scan_enabled = true`
3. For each user, scans their **preferred pairs** from Settings
4. Generates signals using **real Polygon.io data**
5. Saves signals to database with full audit trail
6. Users see new signals when they return to the app

---

## 📊 Testing Your Setup

### Manual Test (No Cron Needed)

```bash
# Test the auto-scan function directly
curl -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind1bXRzZ3B5YnB3dHZxaWVybHhyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA0NDE5ODYsImV4cCI6MjA3NjAxNzk4Nn0.Mz9ln7_i6gm0pBKQE-4W0Txl5tl1qCoiCSUnJNkYHvY" \
  https://wumtsgpybpwtvqierlxr.supabase.co/functions/v1/auto-scan
```

Expected response:
```json
{
  "message": "Auto-scan completed",
  "scanned": 5,
  "users": 1
}
```

---

## 🔍 Monitoring & Logs

### View Activity Logs in App
1. Login to your Trading AI app
2. Go to **History** tab
3. See all scans, signals generated, and rejected signals

### View Edge Function Logs
1. Go to Supabase Dashboard
2. Navigate to **Edge Functions** → **analyze-market**
3. Click **Logs** tab
4. See real-time execution logs

### Check Polygon.io Usage
1. Go to [Polygon.io Dashboard](https://polygon.io/dashboard)
2. View API usage and rate limits
3. Free tier: 5 calls/minute

---

## ⚙️ Customizing Scan Frequency

**Change the cron schedule:**
- Every 5 min: `*/5 * * * *`
- Every 15 min: `*/15 * * * *` (recommended)
- Every 30 min: `*/30 * * * *`
- Every hour: `0 * * * *`
- Every 4 hours: `0 */4 * * *`

**Per-user settings:**
Users can configure their own scan interval in Settings (5-60 minutes).

---

## 🛡️ Rate Limits & Best Practices

**Polygon.io Free Tier:**
- 5 API calls per minute
- If you have 5 pairs, one scan uses 5 calls
- Set interval to minimum 1 minute with 5+ pairs

**Recommendations:**
- Start with 15-minute interval
- Monitor your Polygon.io usage
- Upgrade to paid tier if needed for more frequent scans

---

## ✅ You're All Set!

Your Trading AI is now configured with:
- ✅ Real market data from Polygon.io
- ✅ Persistent signal storage in Supabase
- ✅ Complete activity logging
- ✅ Ready for automated scanning

Just enable **Auto-Scan** in Settings and set up one of the cron options above!
