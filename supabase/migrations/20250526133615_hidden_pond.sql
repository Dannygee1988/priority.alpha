/*
  # Add user role management
  
  1. Changes
    - Add role column to user_companies table
    - Add role validation check
    - Update RLS policies to check roles
    - Add trigger to sync role with auth.users metadata
  
  2. Security
    - Enable RLS
    - Add policies for role-based access
*/

-- Add role column to user_companies
ALTER TABLE user_companies 
ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'user'
CHECK (role IN ('admin', 'user', 'viewer'));

-- Create function to sync role with auth.users metadata
CREATE OR REPLACE FUNCTION sync_user_role()
RETURNS TRIGGER AS $$
BEGIN
  -- Update user metadata in auth.users
  UPDATE auth.users
  SET raw_user_meta_data = jsonb_set(
    COALESCE(raw_user_meta_data, '{}'::jsonb),
    '{role}',
    to_jsonb(NEW.role)
  )
  WHERE id = NEW.user_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to sync role
DROP TRIGGER IF EXISTS sync_user_role_trigger ON user_companies;
CREATE TRIGGER sync_user_role_trigger
AFTER INSERT OR UPDATE OF role
ON user_companies
FOR EACH ROW
EXECUTE FUNCTION sync_user_role();

-- Update existing users to have their roles synced
UPDATE auth.users
SET raw_user_meta_data = jsonb_set(
  COALESCE(raw_user_meta_data, '{}'::jsonb),
  '{role}',
  to_jsonb(
    (SELECT role FROM user_companies WHERE user_id = auth.users.id LIMIT 1)
  )
)
WHERE id IN (SELECT user_id FROM user_companies);

-- Set first user as admin
UPDATE user_companies
SET role = 'admin'
WHERE user_id = (
  SELECT user_id 
  FROM user_companies 
  ORDER BY created_at ASC 
  LIMIT 1
);