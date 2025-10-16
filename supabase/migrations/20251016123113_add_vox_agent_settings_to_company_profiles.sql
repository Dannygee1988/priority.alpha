/*
  # Add Vox Agent Settings to Company Profiles

  1. Changes
    - Add `vox_agent_enabled` column (boolean field to control if the agent is active)
    - Add `vox_agent_voice` column (text field to store the selected voice option)

  2. Purpose
    - Enable companies to control their Vox agent on/off status
    - Allow voice customization for the Vox agent
    - Store agent preferences at the company level

  3. Notes
    - Agent is enabled by default for existing companies
    - Default voice is 'alloy' to match application defaults
    - These settings can be updated in real-time from the Vox Inbound interface
*/

-- Add agent settings fields to company_profiles table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'company_profiles' AND column_name = 'vox_agent_enabled'
  ) THEN
    ALTER TABLE company_profiles ADD COLUMN vox_agent_enabled boolean DEFAULT true;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'company_profiles' AND column_name = 'vox_agent_voice'
  ) THEN
    ALTER TABLE company_profiles ADD COLUMN vox_agent_voice text DEFAULT 'alloy';
  END IF;
END $$;