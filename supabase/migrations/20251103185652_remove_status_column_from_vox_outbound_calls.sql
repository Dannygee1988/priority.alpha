/*
  # Remove Status Column from Vox Outbound Calls

  1. Changes
    - Drop `status` column from `vox_outbound_calls` table
    - The `call_status` field is sufficient for tracking call state

  2. Important Notes
    - This removes the redundant status field
    - Only `call_status` will be used going forward
*/

-- Drop the status column if it exists
ALTER TABLE vox_outbound_calls 
DROP COLUMN IF EXISTS status;
