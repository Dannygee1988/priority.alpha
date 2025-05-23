/*
  # Add Pri0r1ty AI company and user

  1. New Data
    - Creates Pri0r1ty AI company profile
    - Associates dgee@pri0r1ty.com with the company

  2. Changes
    - Inserts new company record
    - Creates user-company association
*/

-- Insert Pri0r1ty AI company
INSERT INTO public.company_profiles (
  id,
  name,
  sector,
  website,
  description
)
VALUES (
  'c0a80121-1234-5678-9abc-def012345678',
  'Pri0r1ty AI',
  'Technology',
  'https://pri0r1ty.com',
  'Business Management Powered by AI'
)
ON CONFLICT (id) DO NOTHING;

-- Associate dgee@pri0r1ty.com with Pri0r1ty AI
INSERT INTO public.user_companies (
  user_id,
  company_id
)
SELECT 
  id as user_id,
  'c0a80121-1234-5678-9abc-def012345678' as company_id
FROM auth.users
WHERE email = 'dgee@pri0r1ty.com'
ON CONFLICT (user_id, company_id) DO NOTHING;