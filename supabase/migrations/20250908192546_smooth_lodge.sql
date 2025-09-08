/*
  # User Profile Types and Subscription Management

  1. New Tables
    - `user_profile_types`
      - `id` (uuid, primary key)
      - `name` (text, unique) - Advisor, Professional, Enterprise
      - `description` (text)
      - `features` (jsonb) - Array of feature keys
      - `price_monthly` (numeric)
      - `created_at` (timestamp)

  2. Table Updates
    - `user_companies`
      - Add `profile_type_id` (uuid, foreign key to user_profile_types)
      - Add `subscription_status` (text) - active, expired, cancelled, trial
      - Add `subscription_expires_at` (timestamp)

  3. Security
    - Enable RLS on `user_profile_types` table
    - Add policy for authenticated users to view profile types
    - Add indexes for performance

  4. Data
    - Insert three profile types with proper pricing
    - Set default profile type for existing users
*/

-- Create user_profile_types table
CREATE TABLE IF NOT EXISTS user_profile_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text NOT NULL,
  features jsonb NOT NULL DEFAULT '[]'::jsonb,
  price_monthly numeric DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT valid_name CHECK (name IN ('Advisor', 'Professional', 'Enterprise'))
);

-- Insert the three user profile types with proper UUIDs
DO $$
DECLARE
  advisor_id uuid := gen_random_uuid();
  professional_id uuid := gen_random_uuid();
  enterprise_id uuid := gen_random_uuid();
BEGIN
  INSERT INTO user_profile_types (id, name, description, features, price_monthly) VALUES
  (
    advisor_id,
    'Advisor',
    'Basic access to AI advisory features',
    '["advisor", "gpt", "chats", "data"]'::jsonb,
    29.99
  ),
  (
    professional_id,
    'Professional', 
    'Full business management suite',
    '["advisor", "gpt", "chats", "dashboard", "data", "crm", "social-media", "pr", "finance", "analytics", "settings"]'::jsonb,
    99.99
  ),
  (
    enterprise_id,
    'Enterprise',
    'Complete platform access with advanced features',
    '["advisor", "gpt", "chats", "dashboard", "data", "crm", "social-media", "pr", "finance", "analytics", "settings", "hr", "investors", "tools", "calendar", "management", "community"]'::jsonb,
    299.99
  )
  ON CONFLICT (name) DO NOTHING;
END $$;

-- Add profile type columns to user_companies
DO $$
BEGIN
  -- Add profile_type_id column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_companies' AND column_name = 'profile_type_id'
  ) THEN
    ALTER TABLE user_companies ADD COLUMN profile_type_id uuid;
  END IF;

  -- Add subscription_status column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_companies' AND column_name = 'subscription_status'
  ) THEN
    ALTER TABLE user_companies ADD COLUMN subscription_status text DEFAULT 'active';
  END IF;

  -- Add subscription_expires_at column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_companies' AND column_name = 'subscription_expires_at'
  ) THEN
    ALTER TABLE user_companies ADD COLUMN subscription_expires_at timestamptz DEFAULT (now() + interval '30 days');
  END IF;
END $$;

-- Add constraints if they don't exist
DO $$
BEGIN
  -- Add subscription status check constraint
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'user_companies' AND constraint_name = 'user_companies_subscription_status_check'
  ) THEN
    ALTER TABLE user_companies ADD CONSTRAINT user_companies_subscription_status_check 
    CHECK (subscription_status IN ('active', 'expired', 'cancelled', 'trial'));
  END IF;

  -- Add foreign key constraint for profile_type_id
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'user_companies' AND constraint_name = 'user_companies_profile_type_id_fkey'
  ) THEN
    ALTER TABLE user_companies ADD CONSTRAINT user_companies_profile_type_id_fkey 
    FOREIGN KEY (profile_type_id) REFERENCES user_profile_types(id);
  END IF;
END $$;

-- Set default profile type for users without one
UPDATE user_companies 
SET profile_type_id = (
  SELECT id FROM user_profile_types WHERE name = 'Advisor' LIMIT 1
)
WHERE profile_type_id IS NULL;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_companies_profile_type ON user_companies(profile_type_id);
CREATE INDEX IF NOT EXISTS idx_user_companies_subscription_status ON user_companies(subscription_status);

-- Enable RLS on user_profile_types
ALTER TABLE user_profile_types ENABLE ROW LEVEL SECURITY;

-- Create policy for user_profile_types
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'user_profile_types' AND policyname = 'Anyone can view profile types'
  ) THEN
    CREATE POLICY "Anyone can view profile types"
      ON user_profile_types
      FOR SELECT
      TO authenticated
      USING (true);
  END IF;
END $$;