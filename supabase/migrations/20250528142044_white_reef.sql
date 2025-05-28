/*
  # Create market soundings table

  1. New Tables
    - `market_soundings`
      - `id` (uuid, primary key)
      - `company_id` (uuid, foreign key to company_profiles)
      - `title` (text)
      - `description` (text)
      - `status` (text) - Live or Cleansed
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
      - `cleansed_at` (timestamptz)
      - `confidentiality_level` (text)

  2. Security
    - Enable RLS
    - Add policies for authenticated users to manage their company's market soundings
*/

-- Create market_soundings table
CREATE TABLE IF NOT EXISTS market_soundings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES company_profiles(id),
  title text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'Live' CHECK (status IN ('Live', 'Cleansed')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  cleansed_at timestamptz,
  confidentiality_level text NOT NULL DEFAULT 'Standard' CHECK (confidentiality_level IN ('Standard', 'High', 'Critical')),
  CONSTRAINT title_length CHECK (char_length(title) >= 3)
);

-- Create indexes
CREATE INDEX idx_market_soundings_company_id ON market_soundings(company_id);
CREATE INDEX idx_market_soundings_status ON market_soundings(status);

-- Enable RLS
ALTER TABLE market_soundings ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can manage own company market soundings"
  ON market_soundings
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

-- Create updated_at trigger
CREATE TRIGGER update_market_soundings_updated_at
  BEFORE UPDATE ON market_soundings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create junction table for insider-sounding relationships
CREATE TABLE IF NOT EXISTS insider_soundings (
  insider_id uuid NOT NULL REFERENCES crm_customers(id),
  sounding_id uuid NOT NULL REFERENCES market_soundings(id),
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (insider_id, sounding_id)
);

-- Create indexes for junction table
CREATE INDEX idx_insider_soundings_insider_id ON insider_soundings(insider_id);
CREATE INDEX idx_insider_soundings_sounding_id ON insider_soundings(sounding_id);

-- Enable RLS on junction table
ALTER TABLE insider_soundings ENABLE ROW LEVEL SECURITY;

-- Create policies for junction table
CREATE POLICY "Users can manage own company insider soundings"
  ON insider_soundings
  FOR ALL
  TO authenticated
  USING (
    sounding_id IN (
      SELECT id 
      FROM market_soundings 
      WHERE company_id IN (
        SELECT company_id 
        FROM user_companies 
        WHERE user_id = auth.uid()
      )
    )
  )
  WITH CHECK (
    sounding_id IN (
      SELECT id 
      FROM market_soundings 
      WHERE company_id IN (
        SELECT company_id 
        FROM user_companies 
        WHERE user_id = auth.uid()
      )
    )
  );