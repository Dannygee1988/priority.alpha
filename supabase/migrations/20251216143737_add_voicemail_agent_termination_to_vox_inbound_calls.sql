/*
  # Add Voicemail and Agent Termination Columns to vox_inbound_calls

  1. Changes
    - Add `voicemail` column to `vox_inbound_calls` table
      - Type: boolean
      - Default: false
      - Description: Indicates whether the call went to voicemail
    
    - Add `agent_termination` column to `vox_inbound_calls` table
      - Type: boolean
      - Default: false
      - Description: Indicates whether the AI agent terminated the call

  2. Notes
    - Both columns default to false
    - These flags help track call outcomes and agent behavior
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vox_inbound_calls' AND column_name = 'voicemail'
  ) THEN
    ALTER TABLE vox_inbound_calls ADD COLUMN voicemail boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vox_inbound_calls' AND column_name = 'agent_termination'
  ) THEN
    ALTER TABLE vox_inbound_calls ADD COLUMN agent_termination boolean DEFAULT false;
  END IF;
END $$;