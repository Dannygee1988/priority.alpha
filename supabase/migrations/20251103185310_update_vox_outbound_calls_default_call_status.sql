/*
  # Update Default Call Status for Outbound Calls

  1. Changes
    - Change default value of `call_status` in `vox_outbound_calls` from 'completed' to 'queued'
    - Update check constraint to include 'queued' as a valid value

  2. Important Notes
    - New outbound calls should start with 'queued' status instead of 'completed'
    - This better reflects the actual state of calls when they are first created
    - Valid statuses: 'completed', 'failed', 'no-answer', 'busy', 'cancelled', 'queued'
*/

-- Drop the existing check constraint
ALTER TABLE vox_outbound_calls 
DROP CONSTRAINT IF EXISTS vox_outbound_calls_call_status_check;

-- Add new check constraint that includes 'queued'
ALTER TABLE vox_outbound_calls 
ADD CONSTRAINT vox_outbound_calls_call_status_check 
CHECK (call_status IN ('completed', 'failed', 'no-answer', 'busy', 'cancelled', 'queued'));

-- Update the default value to 'queued'
ALTER TABLE vox_outbound_calls 
ALTER COLUMN call_status SET DEFAULT 'queued';
