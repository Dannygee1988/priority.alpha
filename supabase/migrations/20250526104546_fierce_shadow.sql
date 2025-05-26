/*
  # Fix company profiles RLS policies

  1. Changes
    - Drop existing RLS policies for company_profiles table
    - Create new policies that check user_companies table for permissions
    - This allows users to view company profiles they are associated with

  2. Security
    - Maintains RLS protection
    - Uses user_companies junction table for access control
    - Ensures users can only access companies they are members of
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own company profile" ON company_profiles;
DROP POLICY IF EXISTS "Users can update own company profile" ON company_profiles;

-- Create new policies using user_companies table
CREATE POLICY "Users can view associated company profiles"
  ON company_profiles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM user_companies
      WHERE user_companies.user_id = auth.uid()
      AND user_companies.company_id = company_profiles.id
    )
  );

CREATE POLICY "Users can update associated company profiles"
  ON company_profiles
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM user_companies
      WHERE user_companies.user_id = auth.uid()
      AND user_companies.company_id = company_profiles.id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM user_companies
      WHERE user_companies.user_id = auth.uid()
      AND user_companies.company_id = company_profiles.id
    )
  );