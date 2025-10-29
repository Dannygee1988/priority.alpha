/*
  # Add GCP ID column to company_profiles

  1. Changes
    - Add gcp_id column to company_profiles table
    - This will store the Google Cloud Platform ID for each company
    - Column is optional (nullable) and stored as text
*/

-- Add gcp_id column to company_profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'company_profiles' AND column_name = 'gcp_id'
  ) THEN
    ALTER TABLE company_profiles ADD COLUMN gcp_id text;
  END IF;
END $$;
