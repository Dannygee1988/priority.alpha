/*
  # Add type field to market soundings

  1. Changes
    - Add type column to market_soundings table
    - Add check constraint for valid types
    - Set default type to 'Inside Information'
*/

-- Add type column with check constraint
ALTER TABLE market_soundings
ADD COLUMN type text NOT NULL DEFAULT 'Inside Information'
CHECK (
  type IN (
    'Financial Results',
    'Acquisitions and Disposals',
    'Dividend Announcements',
    'Corporate Governance Changes',
    'Share Issuance and Buybacks',
    'Regulatory Compliance',
    'Inside Information',
    'Strategic Updates',
    'Risk Factors',
    'Sustainability and Corporate Social Responsibility'
  )
);