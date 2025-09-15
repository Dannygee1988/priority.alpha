/*
  # Create User Profiles System with Role-Based Access

  1. New Tables
    - `user_profile_types`
      - `id` (uuid, primary key)
      - `name` (text) - Advisor, Professional, Enterprise
      - `description` (text)
      - `features` (jsonb) - Array of accessible features
      - `price_monthly` (numeric)
      - `created_at` (timestamptz)

  2. Changes to user_companies
    - Add profile_type_id column
    - Add subscription_status column
    - Add subscription_expires_at column

  3. Security
    - Enable RLS on user_profile_types
    - Update policies for role-based access
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

-- Insert the three user profile types
INSERT INTO user_profile_types (id, name, description, features, price_monthly) VALUES
(
  'advisor-profile-uuid-1234-5678-9abc',
  'Advisor',
  'Basic access to AI advisory features',
  '["advisor", "gpt", "chats"]'::jsonb,
  29.99
),
(
  'professional-profile-uuid-1234-5678',
  'Professional', 
  'Full business management suite',
  '["advisor", "gpt", "chats", "dashboard", "data", "crm", "social-media", "pr", "finance", "analytics", "settings"]'::jsonb,
  99.99
),
(
  'enterprise-profile-uuid-1234-5678-9',
  'Enterprise',
  'Complete platform access with advanced features',
  '["advisor", "gpt", "chats", "dashboard", "data", "crm", "social-media", "pr", "finance", "analytics", "settings", "hr", "investors", "tools", "calendar", "management", "community"]'::jsonb,
  299.99
)
ON CONFLICT (name) DO NOTHING;

-- Add profile type columns to user_companies
ALTER TABLE user_companies
ADD COLUMN IF NOT EXISTS profile_type_id uuid REFERENCES user_profile_types(id) DEFAULT 'advisor-profile-uuid-1234-5678-9abc',
ADD COLUMN IF NOT EXISTS subscription_status text DEFAULT 'active' CHECK (subscription_status IN ('active', 'expired', 'cancelled', 'trial')),
ADD COLUMN IF NOT EXISTS subscription_expires_at timestamptz DEFAULT (now() + interval '30 days');

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_companies_profile_type ON user_companies(profile_type_id);
CREATE INDEX IF NOT EXISTS idx_user_companies_subscription_status ON user_companies(subscription_status);

-- Enable RLS on user_profile_types
ALTER TABLE user_profile_types ENABLE ROW LEVEL SECURITY;

-- Create policy for user_profile_types
CREATE POLICY "Anyone can view profile types"
  ON user_profile_types
  FOR SELECT
  TO authenticated
  USING (true);

-- Update existing users to have Advisor profile by default
UPDATE user_companies 
SET profile_type_id = 'advisor-profile-uuid-1234-5678-9abc'
WHERE profile_type_id IS NULL;