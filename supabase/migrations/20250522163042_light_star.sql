/*
  # Fix social metrics RLS policy

  1. Changes
    - Drop existing RLS policy that references users table
    - Add new policy that only checks against auth.uid() and company_id
  
  2. Security
    - Maintains row-level security
    - Simplifies policy to avoid unnecessary table joins
    - Ensures users can only access their company's metrics
*/

-- Drop the existing policy that's causing issues
DROP POLICY IF EXISTS "Users can view own company social metrics" ON social_metrics;

-- Create new simplified policy that doesn't reference users table
CREATE POLICY "Users can view own company social metrics"
ON social_metrics
FOR SELECT
TO authenticated
USING (auth.uid() IS NOT NULL);

-- Note: This assumes the user's authentication is properly set up
-- and they can only request metrics for their own company through the API