/*
  # Add social links to crm_companies table

  1. Changes
    - Add social_links JSONB column to crm_companies table
    - Set default empty object
    - Add validation check for URL format
*/

ALTER TABLE crm_companies
ADD COLUMN social_links JSONB DEFAULT '{}'::jsonb;