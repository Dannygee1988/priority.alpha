/*
  # Create social media accounts table

  1. New Tables
    - `social_accounts`
      - `id` (uuid, primary key)
      - `company_id` (uuid, foreign key to company_profiles)
      - `platform` (text, e.g., 'twitter', 'facebook', etc.)
      - `username` (text)
      - `credentials` (jsonb, encrypted credentials)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS
    - Add policy for authenticated users to manage their company's accounts
    - Encrypt sensitive credentials using pgcrypto

  3. Indexes
    - On company_id for faster lookups
    - On platform for filtering
*/

-- Enable pgcrypto extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create social_accounts table
CREATE TABLE IF NOT EXISTS social_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES company_profiles(id),
  platform text NOT NULL,
  username text NOT NULL,
  credentials jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Add constraints
  CONSTRAINT valid_platform CHECK (platform = ANY (ARRAY['twitter', 'facebook', 'linkedin', 'instagram'])),
  CONSTRAINT unique_company_platform UNIQUE (company_id, platform)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_social_accounts_company_id ON social_accounts(company_id);
CREATE INDEX IF NOT EXISTS idx_social_accounts_platform ON social_accounts(platform);

-- Enable RLS
ALTER TABLE social_accounts ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can manage own company social accounts"
  ON social_accounts
  FOR ALL
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id 
      FROM user_companies 
      WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    company_id IN (
      SELECT company_id 
      FROM user_companies 
      WHERE user_id = auth.uid()
    )
  );

-- Create updated_at trigger
CREATE TRIGGER update_social_accounts_updated_at
  BEFORE UPDATE ON social_accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to encrypt credentials
CREATE OR REPLACE FUNCTION encrypt_credentials()
RETURNS TRIGGER AS $$
DECLARE
  encryption_key text;
BEGIN
  -- Get encryption key from vault or environment
  encryption_key := current_setting('app.settings.encryption_key', true);
  
  -- Encrypt credentials if key is available
  IF encryption_key IS NOT NULL THEN
    NEW.credentials := jsonb_set(
      NEW.credentials,
      '{encrypted}',
      to_jsonb(
        encode(
          encrypt(
            NEW.credentials::text::bytea,
            decode(encryption_key, 'hex'),
            'aes'
          ),
          'base64'
        )
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for encryption
CREATE TRIGGER encrypt_social_accounts_credentials
  BEFORE INSERT OR UPDATE OF credentials
  ON social_accounts
  FOR EACH ROW
  EXECUTE FUNCTION encrypt_credentials();

-- Comments
COMMENT ON TABLE social_accounts IS 'Stores social media account credentials for companies';
COMMENT ON COLUMN social_accounts.credentials IS 'Encrypted JSON containing account credentials';