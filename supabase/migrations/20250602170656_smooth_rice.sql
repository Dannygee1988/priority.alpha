/*
  # Add cascade delete for market soundings

  1. Changes
    - Add ON DELETE CASCADE to insider_soundings foreign key
    - This ensures that when a market sounding is deleted, all associated insider relationships are also removed
*/

-- Drop existing foreign key constraint
ALTER TABLE insider_soundings
DROP CONSTRAINT IF EXISTS insider_soundings_sounding_id_fkey;

-- Add new foreign key constraint with cascade delete
ALTER TABLE insider_soundings
ADD CONSTRAINT insider_soundings_sounding_id_fkey
FOREIGN KEY (sounding_id)
REFERENCES market_soundings(id)
ON DELETE CASCADE;