/*
  # Update advisor_code table - Change live field to text

  ## Summary
  Modifies the `live` field in the advisor_code table from boolean to text to store the complete inline deployment code.

  ## Changes
  1. Drop the existing `live` boolean column
  2. Add new `live` text column to store the full deployment code

  ## Notes
  - The `live` field now stores the complete inline code ready for deployment
  - This allows users to copy the full code snippet to add to their website
*/

-- Drop the old boolean column and add text column
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'advisor_code' AND column_name = 'live' AND data_type = 'boolean'
  ) THEN
    ALTER TABLE advisor_code DROP COLUMN live;
  END IF;
END $$;

-- Add live as text field
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'advisor_code' AND column_name = 'live' AND data_type = 'text'
  ) THEN
    ALTER TABLE advisor_code ADD COLUMN live text;
  END IF;
END $$;
