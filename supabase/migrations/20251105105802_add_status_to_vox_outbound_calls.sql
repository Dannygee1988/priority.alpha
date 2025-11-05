/*
  # Add status field to vox_outbound_calls table

  1. Changes
    - Add `status` column to `vox_outbound_calls` table
      - Type: text
      - Default value: 'Queued'
      - Not null constraint
  
  2. Notes
    - This field will track the status of outbound calls
    - Default status is 'Queued' for newly created records
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vox_outbound_calls' AND column_name = 'status'
  ) THEN
    ALTER TABLE vox_outbound_calls 
    ADD COLUMN status text NOT NULL DEFAULT 'Queued';
  END IF;
END $$;