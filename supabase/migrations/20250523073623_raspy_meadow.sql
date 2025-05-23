/*
  # Create CRM customers table

  1. New Tables
    - `crm_customers`
      - `id` (uuid, primary key)
      - `company_id` (uuid, foreign key to company_profiles)
      - `first_name` (text)
      - `last_name` (text)
      - `email` (text)
      - `phone` (text)
      - `company_name` (text)
      - `job_title` (text)
      - `status` (text) - prospect, lead, customer, inactive
      - `source` (text) - how the customer was acquired
      - `notes` (text)
      - `last_contacted` (timestamptz)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
      - `tags` (text[]) - array of tags for categorization
      - `custom_fields` (jsonb) - flexible field for additional data

  2. Security
    - Enable RLS on `crm_customers` table
    - Add policies for authenticated users to:
      - View their company's customers
      - Manage their company's customers

  3. Indexes
    - Index on company_id for faster lookups
    - Index on email for unique constraint per company
    - Index on status for filtering
    - Index on last_contacted for sorting
*/

-- Create the crm_customers table
CREATE TABLE IF NOT EXISTS crm_customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES company_profiles(id),
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text NOT NULL,
  phone text,
  company_name text,
  job_title text,
  status text NOT NULL DEFAULT 'prospect' CHECK (status IN ('prospect', 'lead', 'customer', 'inactive')),
  source text,
  notes text,
  last_contacted timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  tags text[] DEFAULT '{}',
  custom_fields jsonb DEFAULT '{}'::jsonb,
  UNIQUE (company_id, email)
);

-- Enable Row Level Security
ALTER TABLE crm_customers ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own company customers"
  ON crm_customers
  FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id 
      FROM user_companies 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage own company customers"
  ON crm_customers
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

-- Create indexes
CREATE INDEX idx_crm_customers_company_id ON crm_customers(company_id);
CREATE INDEX idx_crm_customers_email ON crm_customers(email);
CREATE INDEX idx_crm_customers_status ON crm_customers(status);
CREATE INDEX idx_crm_customers_last_contacted ON crm_customers(last_contacted);

-- Create function to automatically update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_crm_customers_updated_at
  BEFORE UPDATE ON crm_customers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();