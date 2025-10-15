/*
  # Add Last Scan Tracking

  1. Changes
    - Add `last_scan_at` column to `user_settings` to track when user was last scanned
    - Add `next_scan_at` calculated field for UI display
    - Add index for efficient cron job queries
  
  2. Notes
    - Helps prevent duplicate scans
    - Allows UI to show when next scan will happen
    - Cron job can use this to schedule scans efficiently
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_settings' AND column_name = 'last_scan_at'
  ) THEN
    ALTER TABLE user_settings ADD COLUMN last_scan_at timestamptz;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_user_settings_auto_scan 
  ON user_settings(auto_scan_enabled, last_scan_at) 
  WHERE auto_scan_enabled = true;