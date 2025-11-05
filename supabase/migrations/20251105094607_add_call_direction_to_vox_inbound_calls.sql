/*
  # Add Call Direction Field to Vox Inbound Calls

  1. Changes
    - Add `call_direction` column to `vox_inbound_calls` table
    - Type: text with check constraint to ensure only 'inbound' or 'outbound' values
    - Default: 'inbound' (maintains backward compatibility)
    - NOT NULL constraint

  2. Purpose
    - Allow tracking whether a call is inbound or outbound
    - Provides flexibility to use the same table for both call types

  3. Notes
    - Existing records will default to 'inbound'
    - User will set this field manually for each call
*/

-- Add call_direction column with check constraint
ALTER TABLE vox_inbound_calls 
ADD COLUMN IF NOT EXISTS call_direction text NOT NULL DEFAULT 'inbound'
CHECK (call_direction IN ('inbound', 'outbound'));