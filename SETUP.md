# Trading AI - Setup Guide

## 🔑 Required API Keys

### 1. Polygon.io API Key (Real Market Data)

**Get your free API key:**
1. Go to [https://polygon.io/](https://polygon.io/)
2. Sign up for a free account
3. Navigate to Dashboard → API Keys
4. Copy your API key
5. Add to `.env` file:
   ```
   VITE_POLYGON_API_KEY=your_actual_api_key_here
   ```

**Free Plan Includes:**
- 5 API calls per minute
- Delayed market data (15 min delay for stocks, real-time for forex)
- Perfect for testing and development

**Without API Key:**
- App will use mock data for testing
- All features work, but data is simulated

### 2. OpenAI API Key (Optional - Advanced Analysis)

**Get your API key:**
1. Go to [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys)
2. Create new API key
3. Add to `.env` file:
   ```
   VITE_OPENAI_API_KEY=your_openai_api_key_here
   ```

**Use Cases:**
- Enhanced signal explanations
- Natural language analysis
- Pattern recognition improvements

---

## ⚙️ Auto-Scan Setup (Cron Job)

The app includes an auto-scan feature for continuous market monitoring.

### How It Works:
1. Users enable "Auto-Scan" in Settings
2. They select preferred pairs and scan interval (5-60 minutes)
3. Background cron job calls the `auto-scan` Edge Function
4. Signals are generated automatically and saved to database
5. Users see new signals when they return to the app

### Setting Up the Cron Job:

**Option 1: Supabase Cron (Recommended)**
```sql
-- Run this in Supabase SQL Editor
select cron.schedule(
  'trading-ai-auto-scan',
  '*/15 * * * *',  -- Every 15 minutes
  $$
  select
    net.http_post(
      url:='https://wumtsgpybpwtvqierlxr.supabase.co/functions/v1/auto-scan',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb,
      body:='{}'::jsonb
    ) as request_id;
  $$
);
```

**Option 2: External Cron Service**

Use [cron-job.org](https://cron-job.org/) or similar:
- URL: `https://wumtsgpybpwtvqierlxr.supabase.co/functions/v1/auto-scan`
- Method: POST
- Schedule: Every 15 minutes
- Headers:
  ```
  Content-Type: application/json
  Authorization: Bearer YOUR_ANON_KEY
  ```

**Option 3: GitHub Actions**
Create `.github/workflows/auto-scan.yml`:
```yaml
name: Auto Scan Markets
on:
  schedule:
    - cron: '*/15 * * * *'  # Every 15 minutes
jobs:
  scan:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Auto Scan
        run: |
          curl -X POST \
            -H "Content-Type: application/json" \
            -H "Authorization: Bearer ${{ secrets.SUPABASE_ANON_KEY }}" \
            https://wumtsgpybpwtvqierlxr.supabase.co/functions/v1/auto-scan
```

---

## 📊 Data Persistence

**Session Persistence:**
- User authentication sessions are stored by Supabase
- Settings are saved automatically when changed
- Signals are stored in the database indefinitely (until expired)
- Activity logs provide complete audit trail

**When You Return:**
1. Your login session is restored (stays active for 7 days)
2. All previous signals are loaded from database
3. Activity history shows all past scans
4. Settings remain as configured

**Data Storage:**
- `signals` table: All generated trading signals
- `activity_logs` table: Complete scan history
- `user_settings` table: Your preferences
- Signals expire after 4 hours by default

---

## 🚀 Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure API keys in `.env`:**
   ```
   VITE_POLYGON_API_KEY=your_key_here
   VITE_OPENAI_API_KEY=your_key_here  # Optional
   ```

3. **Run development server:**
   ```bash
   npm run dev
   ```

4. **Build for production:**
   ```bash
   npm run build
   ```

---

## 🔧 Troubleshooting

**Signals not persisting?**
- Check browser console for errors
- Verify Supabase connection in Network tab
- Check Activity History for logs

**Auto-scan not working?**
- Verify cron job is configured
- Check Edge Function logs in Supabase dashboard
- Ensure "Auto-Scan" is enabled in Settings

**Mock data instead of real data?**
- Verify Polygon.io API key is correct
- Check API key has not exceeded rate limits
- Check browser console for API errors

---

## 📝 Notes

- Free Polygon.io tier has rate limits (5 calls/min)
- Signals are automatically cleaned up after expiration
- Activity logs are kept indefinitely for audit purposes
- User settings sync across devices when logged in
