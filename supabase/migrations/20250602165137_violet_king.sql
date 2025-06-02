/*
  # Add expected cleanse date to market soundings

  1. Changes
    - Add `expected_cleanse_date` column to `market_soundings` table
      - Type: timestamptz (timestamp with time zone)
      - Nullable: true (not all soundings will have an expected cleanse date)

  2. Notes
    - Uses IF NOT EXISTS to prevent errors if column already exists
    - Maintains existing data and constraints
*/

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'market_soundings' 
    AND column_name = 'expected_cleanse_date'
  ) THEN
    ALTER TABLE market_soundings 
    ADD COLUMN expected_cleanse_date timestamptz;
  END IF;
END $$;