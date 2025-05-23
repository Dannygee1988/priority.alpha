/*
  # Add type field to CRM customers

  1. Changes
    - Add type field to crm_customers table with predefined options
    - Set default type to 'Customer'
    - Add check constraint to ensure valid types
*/

ALTER TABLE crm_customers
ADD COLUMN type text NOT NULL DEFAULT 'Customer'
CHECK (type IN ('Staff', 'Customer', 'Investor', 'Lead', 'Advisor', 'Other'));