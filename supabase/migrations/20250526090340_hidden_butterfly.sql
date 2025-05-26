/*
  # Create company profiles table and policies

  1. New Tables
    - `company_profiles`
      - `id` (uuid, primary key)
      - `created_at` (timestamptz)
      - `name` (text)
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
    - Enable RLS on `company_profiles` table
    - Add policies for authenticated users to view and update their own company profile
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
    EXISTS (
      SELECT 1
      FROM auth.users
      WHERE uid() = auth.users.id
      AND (auth.users.raw_app_meta_data->>'company_id')::text = company_profiles.id::text
    )
  );

CREATE POLICY "Users can update own company profile"
  ON company_profiles
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM auth.users
      WHERE uid() = auth.users.id
      AND (auth.users.raw_app_meta_data->>'company_id')::text = company_profiles.id::text
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM auth.users
      WHERE uid() = auth.users.id
      AND (auth.users.raw_app_meta_data->>'company_id')::text = company_profiles.id::text
    )
  );