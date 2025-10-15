/*
  # Add SECRET Strategy Activation Column

  1. Changes
    - Add `secret_strategy_activated` column to `user_settings` table
    - Default to false (inactive)
    - Allow users to toggle strategy on/off independently of unlock status

  2. Purpose
    - Enable functional toggle control for SECRET Strategy
    - Allow users to activate/deactivate advanced methodology
    - Separate unlock status from activation status
*/

-- Add activation column to user_settings
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_settings' AND column_name = 'secret_strategy_activated'
  ) THEN
    ALTER TABLE user_settings ADD COLUMN secret_strategy_activated boolean DEFAULT false;
  END IF;
END $$;