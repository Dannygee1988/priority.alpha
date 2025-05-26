/*
  # Create company profiles table

  1. New Tables
    - `company_profiles`
      - `id` (uuid, primary key)
      - `created_at` (timestamp with timezone)
      - `name` (text, company name)
      - `assistant_id` (text, AI assistant identifier)
      - `sector` (text, business sector)
      - `logo_url` (text, URL to company logo)
      - `description` (text, company description)
      - `website` (text, company website)
      - `primary_color` (text, brand color)
      - `secondary_color` (text, secondary brand color)
      - `settings` (jsonb, company-specific settings)
      - `active` (boolean, company status)

  2. Security
    - Enable RLS on `company_profiles` table
    - Add policies for authenticated users to:
      - Read their own company profile
      - Update their own company profile
*/

-- Create the company_profiles table
CREATE TABLE IF NOT EXISTS company_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  name text NOT NULL,
  assistant_id text,
  sector text,
  logo_url text,
  description text,
  website text,
  primary_color text DEFAULT '#060644',
  secondary_color text DEFAULT '#F6CCE0',
  settings jsonb DEFAULT '{}'::jsonb,
  active boolean DEFAULT true,
  CONSTRAINT name_length CHECK (char_length(name) >= 2)
);

-- Enable Row Level Security
ALTER TABLE company_profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own company profile"
  ON company_profiles
  FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT company_id 
      FROM auth.users 
      WHERE auth.uid() = id
    )
  );

CREATE POLICY "Users can update own company profile"
  ON company_profiles
  FOR UPDATE
  TO authenticated
  USING (
    id IN (
      SELECT company_id 
      FROM auth.users 
      WHERE auth.uid() = id
    )
  )
  WITH CHECK (
    id IN (
      SELECT company_id 
      FROM auth.users 
      WHERE auth.uid() = id
    )
  );

-- Add company_id column to auth.users
ALTER TABLE auth.users 
  ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES company_profiles(id);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_company_id ON auth.users(company_id);