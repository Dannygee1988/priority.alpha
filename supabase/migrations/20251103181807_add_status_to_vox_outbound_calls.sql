/*
  # Add Status Field to Vox Outbound Calls Table

  1. Changes
    - Add `status` column to `vox_outbound_calls` table
    - Status can be: 'Unprocessed', 'Waiting', or 'Complete'
    - Default value is 'Unprocessed'

  2. Important Notes
    - This status field tracks the processing state of outbound calls
    - 'Unprocessed': Call has been queued but not yet processed
    - 'Waiting': Call is waiting to be made
    - 'Complete': Call has been completed
*/

-- Add status column to vox_outbound_calls if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vox_outbound_calls' AND column_name = 'status'
  ) THEN
    ALTER TABLE vox_outbound_calls 
    ADD COLUMN status text NOT NULL 
    CHECK (status IN ('Unprocessed', 'Waiting', 'Complete')) 
    DEFAULT 'Unprocessed';
  END IF;
END $$;