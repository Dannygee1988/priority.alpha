/*
  # Add CRM ID to Vox Outbound Calls

  1. Changes
    - Add `crm_id` column to `vox_outbound_calls` table
      - `crm_id` (text) - External CRM system contact identifier
  
  2. Purpose
    - Enable linking call transcripts to contact profiles in user's CRM system
    - Allow users to correlate call data with their existing CRM contacts
  
  3. Notes
    - Field is optional to support existing records and contacts without CRM IDs
    - No unique constraint to allow multiple calls to the same CRM contact
    - Indexed for faster lookups when querying by CRM ID
*/

-- Add crm_id column to vox_outbound_calls
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vox_outbound_calls' AND column_name = 'crm_id'
  ) THEN
    ALTER TABLE vox_outbound_calls ADD COLUMN crm_id text;
  END IF;
END $$;

-- Create index for faster CRM ID lookups
CREATE INDEX IF NOT EXISTS idx_vox_outbound_calls_crm_id ON vox_outbound_calls(crm_id);
