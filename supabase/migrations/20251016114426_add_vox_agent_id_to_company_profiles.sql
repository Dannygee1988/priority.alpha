/*
  # Add Vox Agent ID to Company Profiles

  1. Changes
    - Add `vox_agent_id` column to `company_profiles` table
    - This field will correlate with the `agent_id` field in `vox_inbound_calls` and `vox_outbound_calls`
    - Field is optional (nullable) as not all companies may have a Vox agent configured

  2. Notes
    - This creates a logical relationship between company profiles and Vox call logs
    - The agent_id can be used to filter and associate calls with specific companies
    - No foreign key constraint is added as agent_id is managed externally
*/

-- Add vox_agent_id column to company_profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'company_profiles' AND column_name = 'vox_agent_id'
  ) THEN
    ALTER TABLE company_profiles ADD COLUMN vox_agent_id text;
  END IF;
END $$;

-- Create an index for faster lookups by vox_agent_id
CREATE INDEX IF NOT EXISTS idx_company_profiles_vox_agent_id ON company_profiles(vox_agent_id);