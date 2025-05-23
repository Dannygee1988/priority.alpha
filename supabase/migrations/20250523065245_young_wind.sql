/*
  # Company Profiles and User Associations Schema

  1. New Tables
    - `company_profiles`: Stores company information
    - `user_companies`: Junction table for user-company associations
  
  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users
    
  3. Performance
    - Add indexes for faster lookups
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

-- Create the user_companies junction table
CREATE TABLE IF NOT EXISTS user_companies (
  user_id uuid NOT NULL,
  company_id uuid NOT NULL REFERENCES company_profiles(id),
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (user_id, company_id)
);

-- Enable Row Level Security
ALTER TABLE company_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_companies ENABLE ROW LEVEL SECURITY;

-- Create policies for company_profiles if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'company_profiles' 
    AND policyname = 'Users can view own company profile'
  ) THEN
    CREATE POLICY "Users can view own company profile"
      ON company_profiles
      FOR SELECT
      TO authenticated
      USING (
        id IN (
          SELECT company_id 
          FROM user_companies 
          WHERE user_id = auth.uid()
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'company_profiles' 
    AND policyname = 'Users can update own company profile'
  ) THEN
    CREATE POLICY "Users can update own company profile"
      ON company_profiles
      FOR UPDATE
      TO authenticated
      USING (
        id IN (
          SELECT company_id 
          FROM user_companies 
          WHERE user_id = auth.uid()
        )
      )
      WITH CHECK (
        id IN (
          SELECT company_id 
          FROM user_companies 
          WHERE user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- Create policies for user_companies
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'user_companies' 
    AND policyname = 'Users can view own company associations'
  ) THEN
    CREATE POLICY "Users can view own company associations"
      ON user_companies
      FOR SELECT
      TO authenticated
      USING (user_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'user_companies' 
    AND policyname = 'Users can manage own company associations'
  ) THEN
    CREATE POLICY "Users can manage own company associations"
      ON user_companies
      FOR ALL
      TO authenticated
      USING (user_id = auth.uid())
      WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_companies_user_id ON user_companies(user_id);
CREATE INDEX IF NOT EXISTS idx_user_companies_company_id ON user_companies(company_id);