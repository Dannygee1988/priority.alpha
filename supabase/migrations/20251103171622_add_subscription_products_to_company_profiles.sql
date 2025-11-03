/*
  # Add Subscription Products to Company Profiles

  1. Changes
    - Add `subscription_products` column to `company_profiles` table
      - Type: text array (text[])
      - Purpose: Store list of active subscription products the company has access to
      - Default: Empty array
      - Examples: ['advisor', 'vox', 'fan-sonar', 'labs', 'finance', etc.]

  2. Product Options
    - advisor: AI Advisor, GPT, Chats, Code
    - vox: Vox voice calling system
    - fan-sonar: Fan Sonar social analytics
    - labs: Full Labs suite (Social Media, PR, Community, HR)
    - social-media: Social Media tools only
    - pr: Public Relations tools only
    - community: Community tools only
    - hr: Human Resources tools only
    - investors: Investor relations tools
    - management: Management dashboard
    - finance: Financial tools including Pr1Bit
    - analytics: Analytics dashboard
    - crm: Customer Relationship Management
    - data: Data upload and management
    - tools: Utility tools suite
    - calendar: Calendar and scheduling

  3. Notes
    - Companies can have multiple products active simultaneously
    - Users inherit access from their company's subscription_products
    - Empty array means no products are accessible (free tier defaults)
*/

-- Add subscription_products column to company_profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'company_profiles' AND column_name = 'subscription_products'
  ) THEN
    ALTER TABLE company_profiles ADD COLUMN subscription_products text[] DEFAULT '{}';
  END IF;
END $$;

-- Add comment to describe the column
COMMENT ON COLUMN company_profiles.subscription_products IS 'Array of active subscription products the company has access to. Users inherit access from their company.';
