-- Add linkedin_url column to crm_customers
ALTER TABLE crm_customers
ADD COLUMN linkedin_url text;

-- Remove status column and its constraint
ALTER TABLE crm_customers
DROP CONSTRAINT crm_customers_status_check,
DROP COLUMN status;