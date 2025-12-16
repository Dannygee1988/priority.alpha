/*
  # Add call_status Column to vox_calls Table

  1. Changes
    - Add `call_status` column to `vox_calls` table
      - Type: text
      - Constraint: Must be one of: completed, failed, no-answer, busy, cancelled, queued
      - Default: 'completed'
      - Description: Status of the call (completed/failed/no-answer/busy/cancelled/queued)

  2. Notes
    - Using 'completed' as default since most existing calls are likely completed
    - Adding a check constraint to ensure only valid status values are stored
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vox_calls' AND column_name = 'call_status'
  ) THEN
    ALTER TABLE vox_calls ADD COLUMN call_status text DEFAULT 'completed' CHECK (call_status IN ('completed', 'failed', 'no-answer', 'busy', 'cancelled', 'queued'));
  END IF;
END $$;