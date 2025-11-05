/*
  # Remove Old Contact Fields from Vox Outbound Calls

  1. Changes
    - Drop `caller_name` column (replaced by first_name and last_name)
    - Drop `caller_address` column (replaced by street, city, post_code)

  2. Purpose
    - Complete the migration to new structured contact fields
    - Remove redundant columns that are no longer used

  3. Notes
    - Data has already been migrated to new fields in previous migration
    - This is safe to drop as the new fields contain the migrated data
*/

-- Drop old contact fields
ALTER TABLE vox_outbound_calls DROP COLUMN IF EXISTS caller_name;
ALTER TABLE vox_outbound_calls DROP COLUMN IF EXISTS caller_address;