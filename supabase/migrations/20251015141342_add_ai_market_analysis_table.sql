/*
  # Add AI Market Analysis Table

  1. New Tables
    - `ai_market_analysis`
      - `id` (uuid, primary key) - Unique identifier for each analysis
      - `pair_id` (uuid, foreign key) - References trading_pairs table
      - `user_id` (uuid, foreign key) - References auth.users
      - `patterns` (jsonb) - Array of detected patterns (FVG, OB, Liquidity Sweep, BOS)
      - `bias` (text) - Overall market bias (bullish/bearish/neutral)
      - `confidence` (integer) - AI confidence score (0-100)
      - `summary` (text) - Analysis summary
      - `entry_zone` (jsonb) - Recommended entry zone {low, high}
      - `stop_loss` (numeric) - Recommended stop loss level
      - `take_profit` (numeric) - Recommended take profit level
      - `created_at` (timestamptz) - When analysis was created
      - `updated_at` (timestamptz) - When analysis was last updated

  2. Security
    - Enable RLS on `ai_market_analysis` table
    - Add policies for authenticated users to read their own analysis
    - Add policies for authenticated users to insert/update their own analysis

  3. Indexes
    - Index on pair_id for faster queries
    - Index on user_id for faster user-specific queries
    - Composite index on (user_id, pair_id, created_at) for efficient lookups
*/

CREATE TABLE IF NOT EXISTS ai_market_analysis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pair_id uuid NOT NULL REFERENCES trading_pairs(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  patterns jsonb DEFAULT '[]'::jsonb,
  bias text NOT NULL CHECK (bias IN ('bullish', 'bearish', 'neutral')),
  confidence integer NOT NULL CHECK (confidence >= 0 AND confidence <= 100),
  summary text NOT NULL,
  entry_zone jsonb,
  stop_loss numeric,
  take_profit numeric,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE ai_market_analysis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own AI analysis"
  ON ai_market_analysis
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own AI analysis"
  ON ai_market_analysis
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own AI analysis"
  ON ai_market_analysis
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own AI analysis"
  ON ai_market_analysis
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_ai_analysis_pair_id ON ai_market_analysis(pair_id);
CREATE INDEX IF NOT EXISTS idx_ai_analysis_user_id ON ai_market_analysis(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_analysis_user_pair_date ON ai_market_analysis(user_id, pair_id, created_at DESC);

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_ai_analysis_updated_at BEFORE UPDATE ON ai_market_analysis
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
