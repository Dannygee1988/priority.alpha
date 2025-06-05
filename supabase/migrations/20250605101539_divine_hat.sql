/*
  # Update social accounts platform enum

  1. Changes
    - Update platform enum to use 'x' instead of 'twitter'
    - Maintain existing table structure and security
*/

-- Drop existing platform constraint
ALTER TABLE social_accounts
DROP CONSTRAINT IF EXISTS valid_platform;

-- Add new platform constraint
ALTER TABLE social_accounts
ADD CONSTRAINT valid_platform 
CHECK (platform = ANY (ARRAY['x', 'facebook', 'linkedin', 'instagram']));

-- Update any existing twitter entries to x
UPDATE social_accounts
SET platform = 'x'
WHERE platform = 'twitter';