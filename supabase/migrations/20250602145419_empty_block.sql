/*
  # Add expected cleanse date to market soundings

  1. Changes
    - Add expected_cleanse_date column to market_soundings table
*/

-- Add expected_cleanse_date column
ALTER TABLE market_soundings
ADD COLUMN expected_cleanse_date date;