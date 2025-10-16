/*
  # Update RLS Policy for Vox Inbound Calls

  1. Changes
    - Drop existing restrictive SELECT policy that only shows calls where user_id matches
    - Create new SELECT policy that allows users to view calls for their company's vox agents
    - Users can see calls where the agent_id matches their company's vox_agent_id
  
  2. Security
    - Users can only view calls for companies they belong to
    - Policy checks user_companies table to verify company membership
    - Policy checks company_profiles to match agent_id with vox_agent_id
*/

-- Drop the old restrictive policy
DROP POLICY IF EXISTS "Users can view own inbound calls" ON vox_inbound_calls;

-- Create new policy that allows users to view calls for their company's agents
CREATE POLICY "Users can view company inbound calls"
  ON vox_inbound_calls
  FOR SELECT
  TO authenticated
  USING (
    agent_id IN (
      SELECT cp.vox_agent_id
      FROM company_profiles cp
      INNER JOIN user_companies uc ON uc.company_id = cp.id
      WHERE uc.user_id = auth.uid()
      AND cp.vox_agent_id IS NOT NULL
    )
  );
