/*
  # Fix training_urls company_id column type

  1. Changes
    - Change training_urls.company_id from text to uuid to match company_profiles.id
    - This fixes the type mismatch preventing queries from working

  2. Notes
    - Existing data will be cast from text to uuid
    - All existing company_id values appear to be valid UUID strings
*/

-- Change company_id column type from text to uuid
ALTER TABLE training_urls 
ALTER COLUMN company_id TYPE uuid USING company_id::uuid;
