/*
  # Add Contact Fields to Vox Outbound Calls

  1. Changes
    - Add `caller_name` column (required text field for the contact's name)
    - Add `caller_email` column (optional text field for the contact's email address)
    - Add `caller_address` column (optional text field for the contact's physical address)

  2. Purpose
    - Enable storing complete contact information for outbound calls
    - Support bulk upload of contact data via CSV
    - Improve call personalization and record keeping

  3. Notes
    - Name is required as it's essential for personalized calls
    - Email and address are optional to support various data collection scenarios
    - Existing records will have NULL values for new optional fields
*/

-- Add contact fields to vox_outbound_calls table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vox_outbound_calls' AND column_name = 'caller_name'
  ) THEN
    ALTER TABLE vox_outbound_calls ADD COLUMN caller_name text NOT NULL DEFAULT 'Unknown';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vox_outbound_calls' AND column_name = 'caller_email'
  ) THEN
    ALTER TABLE vox_outbound_calls ADD COLUMN caller_email text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vox_outbound_calls' AND column_name = 'caller_address'
  ) THEN
    ALTER TABLE vox_outbound_calls ADD COLUMN caller_address text;
  END IF;
END $$;

-- Remove the default constraint after adding the column
ALTER TABLE vox_outbound_calls ALTER COLUMN caller_name DROP DEFAULT;