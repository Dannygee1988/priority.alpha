/*
  # Update market soundings table

  1. Changes
    - Remove confidentiality_level column
    - Add project_name column
    - Rename title to subject
*/

-- Rename title column to subject
ALTER TABLE market_soundings
RENAME COLUMN title TO subject;

-- Add project_name column
ALTER TABLE market_soundings
ADD COLUMN project_name text NOT NULL;

-- Drop confidentiality_level column and its constraint
ALTER TABLE market_soundings
DROP COLUMN confidentiality_level;

-- Update the length constraint for the new column names
ALTER TABLE market_soundings
DROP CONSTRAINT title_length;

ALTER TABLE market_soundings
ADD CONSTRAINT subject_length CHECK (char_length(subject) >= 3);

ALTER TABLE market_soundings
ADD CONSTRAINT project_name_length CHECK (char_length(project_name) >= 2);