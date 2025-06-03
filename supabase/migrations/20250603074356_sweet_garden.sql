/*
  # Link specific user with company profile

  1. Changes
    - Create user profile for dgee@pri0r1ty.com if it doesn't exist
    - Link user with Pri0r1ty AI company profile
    - Set user role as admin
*/

-- Create user profile if it doesn't exist
INSERT INTO user_profiles (id)
SELECT id
FROM auth.users
WHERE email = 'dgee@pri0r1ty.com'
ON CONFLICT (id) DO NOTHING;

-- Link user with company
INSERT INTO user_companies (user_id, company_id, role)
SELECT 
  auth.users.id,
  'c0a80121-1234-5678-9abc-def012345678'::uuid,
  'admin'
FROM auth.users
WHERE email = 'dgee@pri0r1ty.com'
ON CONFLICT (user_id, company_id) DO NOTHING;