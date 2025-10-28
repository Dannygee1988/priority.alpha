/*
  # Add RLS policies for training_urls table

  1. Security
    - Add SELECT policy: Users can view training URLs for their company
    - Add INSERT policy: Users can add training URLs for their company
    - Add DELETE policy: Users can delete training URLs for their company
    - All policies check that user belongs to the company via user_companies table
*/

-- Allow users to view training URLs for their company
CREATE POLICY "Users can view their company's training URLs"
  ON training_urls
  FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id 
      FROM user_companies 
      WHERE user_id = auth.uid()
    )
  );

-- Allow users to add training URLs for their company
CREATE POLICY "Users can add training URLs for their company"
  ON training_urls
  FOR INSERT
  TO authenticated
  WITH CHECK (
    company_id IN (
      SELECT company_id 
      FROM user_companies 
      WHERE user_id = auth.uid()
    )
  );

-- Allow users to delete training URLs for their company
CREATE POLICY "Users can delete their company's training URLs"
  ON training_urls
  FOR DELETE
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id 
      FROM user_companies 
      WHERE user_id = auth.uid()
    )
  );
