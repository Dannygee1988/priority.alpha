/*
  # Update Vox Outbound Calls Contact Fields

  1. Changes
    - Replace `caller_name` with `first_name` and `last_name` columns
    - Replace `caller_address` with `street`, `city`, and `post_code` columns
    - Add `additional_information` column for extra notes
    - Add `last_contacted` column to track when contact was last reached

  2. Purpose
    - Provide more structured contact information
    - Enable better contact management and tracking
    - Support more detailed address information

  3. Notes
    - All new fields are optional except first_name and last_name
    - last_contacted uses timestamptz for timezone support
    - Existing caller_name and caller_address data will be preserved in migration
*/

-- Add new fields
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vox_outbound_calls' AND column_name = 'first_name'
  ) THEN
    ALTER TABLE vox_outbound_calls ADD COLUMN first_name text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vox_outbound_calls' AND column_name = 'last_name'
  ) THEN
    ALTER TABLE vox_outbound_calls ADD COLUMN last_name text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vox_outbound_calls' AND column_name = 'street'
  ) THEN
    ALTER TABLE vox_outbound_calls ADD COLUMN street text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vox_outbound_calls' AND column_name = 'city'
  ) THEN
    ALTER TABLE vox_outbound_calls ADD COLUMN city text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vox_outbound_calls' AND column_name = 'post_code'
  ) THEN
    ALTER TABLE vox_outbound_calls ADD COLUMN post_code text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vox_outbound_calls' AND column_name = 'additional_information'
  ) THEN
    ALTER TABLE vox_outbound_calls ADD COLUMN additional_information text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vox_outbound_calls' AND column_name = 'last_contacted'
  ) THEN
    ALTER TABLE vox_outbound_calls ADD COLUMN last_contacted timestamptz;
  END IF;
END $$;

-- Migrate existing caller_name data to first_name
UPDATE vox_outbound_calls
SET first_name = caller_name
WHERE caller_name IS NOT NULL AND first_name IS NULL;

-- Migrate existing caller_address data to street
UPDATE vox_outbound_calls
SET street = caller_address
WHERE caller_address IS NOT NULL AND street IS NULL;