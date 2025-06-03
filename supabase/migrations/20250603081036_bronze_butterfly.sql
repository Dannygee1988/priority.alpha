/*
  # Add Fundraising type to RNS and market soundings

  1. Changes
    - Update type check constraint in market_soundings table
    - Update type check constraint in rns_documents table
*/

-- Drop existing type check constraint from market_soundings
ALTER TABLE market_soundings
DROP CONSTRAINT IF EXISTS market_soundings_type_check;

-- Add new type check constraint to market_soundings
ALTER TABLE market_soundings
ADD CONSTRAINT market_soundings_type_check
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
    'Sustainability and Corporate Social Responsibility',
    'Fundraising'
  )
);