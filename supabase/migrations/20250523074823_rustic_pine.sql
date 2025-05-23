/*
  # Add default company creation trigger

  1. New Function
    - Creates a function to automatically create a default company for new users
    - Associates the user with the created company
  
  2. Changes
    - Adds trigger to automatically create company on user creation
    
  3. Security
    - Function is set to be executed with security definer rights
*/

-- Function to create default company and associate it with user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  new_company_id uuid;
BEGIN
  -- Create default company
  INSERT INTO public.company_profiles (name)
  VALUES (COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)) || '''s Company')
  RETURNING id INTO new_company_id;

  -- Associate user with company
  INSERT INTO public.user_companies (user_id, company_id)
  VALUES (NEW.id, new_company_id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user registration
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();