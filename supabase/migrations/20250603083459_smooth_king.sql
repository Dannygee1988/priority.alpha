/*
  # Add type column to rns_documents table

  1. Changes
    - Add 'type' column to rns_documents table with text type
    - Add check constraint to ensure valid RNS types
    - Set default value to 'Inside Information'

  2. Security
    - No changes to RLS policies needed
*/

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'rns_documents' 
    AND column_name = 'type'
  ) THEN
    ALTER TABLE rns_documents 
    ADD COLUMN type text NOT NULL DEFAULT 'Inside Information'
    CHECK (type IN (
      'Financial Results',
      'Acquisitions and Disposals',
      'Dividend Announcements',
      'Corporate Governance Changes',
      'Share Issuance and Buybacks',
      'Regulatory Compliance',
      'Inside Information',
      'Strategic Updates',
      'Risk Factors',
      'Sustainability and Corporate Social Responsibility',
      'Fundraising'
    ));
  END IF;
END $$;