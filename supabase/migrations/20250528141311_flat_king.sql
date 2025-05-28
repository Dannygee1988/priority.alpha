/*
  # Update CRM schema for companies and contacts

  1. New Tables
    - `crm_companies`
      - `id` (uuid, primary key)
      - `company_id` (uuid, foreign key to company_profiles)
      - `name` (text)
      - `industry` (text)
      - `website` (text)
      - `description` (text)
      - `annual_revenue` (numeric)
      - `employee_count` (integer)
      - `status` (text)
      - `tags` (text[])
      - `custom_fields` (jsonb)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Changes to crm_customers
    - Add `crm_company_id` column (optional foreign key to crm_companies)
    - Update existing constraints and policies
*/

-- Create crm_companies table
CREATE TABLE IF NOT EXISTS crm_companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES company_profiles(id),
  name text NOT NULL,
  industry text,
  website text,
  description text,
  annual_revenue numeric,
  employee_count integer,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'lead', 'prospect')),
  tags text[] DEFAULT '{}',
  custom_fields jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add indexes for crm_companies
CREATE INDEX idx_crm_companies_company_id ON crm_companies(company_id);
CREATE INDEX idx_crm_companies_status ON crm_companies(status);
CREATE INDEX idx_crm_companies_tags ON crm_companies USING gin(tags);

-- Enable RLS on crm_companies
ALTER TABLE crm_companies ENABLE ROW LEVEL SECURITY;

-- Create policies for crm_companies
CREATE POLICY "Users can view own company crm companies"
  ON crm_companies
  FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id 
      FROM user_companies 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage own company crm companies"
  ON crm_companies
  FOR ALL
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id 
      FROM user_companies 
      WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    company_id IN (
      SELECT company_id 
      FROM user_companies 
      WHERE user_id = auth.uid()
    )
  );

-- Add crm_company_id to crm_customers
ALTER TABLE crm_customers
ADD COLUMN crm_company_id uuid REFERENCES crm_companies(id);

-- Add index for the new column
CREATE INDEX idx_crm_customers_crm_company_id ON crm_customers(crm_company_id);

-- Create trigger for crm_companies updated_at
CREATE TRIGGER update_crm_companies_updated_at
  BEFORE UPDATE ON crm_companies
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();