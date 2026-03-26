/*
  # Add Firestore Customer ID to Company Profiles

  1. Changes
    - Add `firestore_customer_id` column to `company_profiles` table
      - Stores the unique customer ID used to filter messages in Firestore
      - Nullable text field to allow gradual migration
  
  2. Purpose
    - Links company profiles to their Firestore conversation data
    - Enables filtering of Firestore messages by customer
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'company_profiles' AND column_name = 'firestore_customer_id'
  ) THEN
    ALTER TABLE company_profiles ADD COLUMN firestore_customer_id text;
  END IF;
END $$;
