-- Remove test data from crm_customers
DELETE FROM crm_customers 
WHERE email = 'dg@pri0r1ty.com' 
OR email = 'dgee@pri0r1ty.com';

-- Remove any associated user_companies entries
DELETE FROM user_companies
WHERE user_id IN (
  SELECT id 
  FROM auth.users 
  WHERE email = 'dg@pri0r1ty.com' 
  OR email = 'dgee@pri0r1ty.com'
);