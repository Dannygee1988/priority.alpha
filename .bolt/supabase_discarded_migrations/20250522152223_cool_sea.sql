/*
  # Create company profiles and user relationships

  1. New Tables
    - `company_profiles`
      - `id` (uuid, primary key)
      - `name` (text, required)
      - `assistant_id` (text)
      - `sector` (text)
      - `logo_url` (text)
      - `description` (text)
      - `website` (text)
      - `primary_color` (text)
      - `secondary_color` (text)
      - `settings` (jsonb)
      - `active` (boolean)

  2. Security
    - Enable RLS on company_profiles
    - Add policies for viewing and updating company profiles
    - Add company_id to auth.users with foreign key constraint
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

-- Add company_id to auth.users
DO $$ 
BEGIN
  -- Check if the column exists
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'auth' 
    AND table_name = 'users' 
    AND column_name = 'company_id'
  ) THEN
    -- Add the column if it doesn't exist
    ALTER TABLE auth.users ADD COLUMN company_id uuid;
    
    -- Add the foreign key constraint
    ALTER TABLE auth.users 
      ADD CONSTRAINT fk_users_company_profiles 
      FOREIGN KEY (company_id) 
      REFERENCES public.company_profiles(id);
      
    -- Create index for faster lookups
    CREATE INDEX idx_users_company_id ON auth.users(company_id);
  END IF;
END $$;

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