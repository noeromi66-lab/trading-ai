/*
  # Trading AI Application Schema

  ## Overview
  Complete database schema for the Trading AI live signal application supporting:
  - User authentication and profiles
  - Trading pairs configuration
  - Signal generation and history
  - User preferences and notifications
  - Subscription tiers

  ## New Tables

  ### `profiles`
  - `id` (uuid, FK to auth.users)
  - `email` (text)
  - `full_name` (text)
  - `subscription_tier` (text) - free, student, trader
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### `trading_pairs`
  - `id` (uuid, PK)
  - `symbol` (text) - EURUSD, GBPUSD, XAUUSD, etc.
  - `display_name` (text)
  - `is_active` (boolean)
  - `pip_value` (numeric)
  - `created_at` (timestamptz)

  ### `signals`
  - `id` (uuid, PK)
  - `pair_id` (uuid, FK)
  - `signal_type` (text) - BUY, SELL, HOLD
  - `strategy` (text) - SMC, EMA_MOMENTUM, BREAKOUT
  - `entry_price` (numeric)
  - `stop_loss` (numeric)
  - `take_profit_1` (numeric)
  - `take_profit_2` (numeric)
  - `confidence_score` (numeric) - 0-100
  - `risk_reward_ratio` (numeric)
  - `timeframe` (text)
  - `explanation` (text)
  - `detected_patterns` (jsonb) - sweep, ob, fvg, bos, choch
  - `is_killzone` (boolean)
  - `created_at` (timestamptz)
  - `expires_at` (timestamptz)

  ### `user_preferences`
  - `id` (uuid, PK)
  - `user_id` (uuid, FK)
  - `preferred_pairs` (jsonb)
  - `notification_email` (boolean)
  - `notification_sms` (boolean)
  - `notification_whatsapp` (boolean)
  - `min_confidence_score` (numeric)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### `signal_notifications`
  - `id` (uuid, PK)
  - `user_id` (uuid, FK)
  - `signal_id` (uuid, FK)
  - `notification_type` (text)
  - `sent_at` (timestamptz)
  - `status` (text) - pending, sent, failed

  ### `user_signal_history`
  - `id` (uuid, PK)
  - `user_id` (uuid, FK)
  - `signal_id` (uuid, FK)
  - `action_taken` (text) - viewed, copied, ignored
  - `created_at` (timestamptz)

  ## Security
  - Enable RLS on all tables
  - Policies for authenticated users to access their own data
  - Public read access to trading_pairs and active signals
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text,
  subscription_tier text DEFAULT 'free' CHECK (subscription_tier IN ('free', 'student', 'trader')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Create trading_pairs table
CREATE TABLE IF NOT EXISTS trading_pairs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol text UNIQUE NOT NULL,
  display_name text NOT NULL,
  is_active boolean DEFAULT true,
  pip_value numeric DEFAULT 0.0001,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE trading_pairs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active trading pairs"
  ON trading_pairs FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Insert default trading pairs
INSERT INTO trading_pairs (symbol, display_name, pip_value) VALUES
  ('EURUSD', 'EUR/USD', 0.0001),
  ('GBPUSD', 'GBP/USD', 0.0001),
  ('XAUUSD', 'XAU/USD (Gold)', 0.01),
  ('USDJPY', 'USD/JPY', 0.01),
  ('GBPJPY', 'GBP/JPY', 0.01)
ON CONFLICT (symbol) DO NOTHING;

-- Create signals table
CREATE TABLE IF NOT EXISTS signals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pair_id uuid REFERENCES trading_pairs(id) ON DELETE CASCADE,
  signal_type text NOT NULL CHECK (signal_type IN ('BUY', 'SELL', 'HOLD')),
  strategy text NOT NULL,
  entry_price numeric,
  stop_loss numeric,
  take_profit_1 numeric,
  take_profit_2 numeric,
  confidence_score numeric DEFAULT 0 CHECK (confidence_score >= 0 AND confidence_score <= 100),
  risk_reward_ratio numeric,
  timeframe text DEFAULT 'M15',
  explanation text,
  detected_patterns jsonb DEFAULT '{}',
  is_killzone boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz DEFAULT now() + interval '4 hours'
);

ALTER TABLE signals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view signals"
  ON signals FOR SELECT
  TO authenticated
  USING (true);

-- Create user_preferences table
CREATE TABLE IF NOT EXISTS user_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  preferred_pairs jsonb DEFAULT '[]',
  notification_email boolean DEFAULT true,
  notification_sms boolean DEFAULT false,
  notification_whatsapp boolean DEFAULT false,
  min_confidence_score numeric DEFAULT 60,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own preferences"
  ON user_preferences FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences"
  ON user_preferences FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences"
  ON user_preferences FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create signal_notifications table
CREATE TABLE IF NOT EXISTS signal_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  signal_id uuid REFERENCES signals(id) ON DELETE CASCADE,
  notification_type text NOT NULL,
  sent_at timestamptz DEFAULT now(),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed'))
);

ALTER TABLE signal_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
  ON signal_notifications FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Create user_signal_history table
CREATE TABLE IF NOT EXISTS user_signal_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  signal_id uuid REFERENCES signals(id) ON DELETE CASCADE,
  action_taken text DEFAULT 'viewed',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE user_signal_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own history"
  ON user_signal_history FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own history"
  ON user_signal_history FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_signals_pair_created ON signals(pair_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_signals_expires ON signals(expires_at);
CREATE INDEX IF NOT EXISTS idx_user_history_user_created ON user_signal_history(user_id, created_at DESC);