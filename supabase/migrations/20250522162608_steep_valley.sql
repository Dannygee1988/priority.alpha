/*
  # Create social metrics table

  1. New Tables
    - `social_metrics`
      - `id` (uuid, primary key)
      - `company_id` (uuid, foreign key to company_profiles)
      - `total_followers` (integer)
      - `most_popular_platform` (text)
      - `community_score` (integer)
      - `hot_topic` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `social_metrics` table
    - Add policies for authenticated users to read their company's data
*/

CREATE TABLE IF NOT EXISTS social_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES company_profiles(id) NOT NULL,
  total_followers integer DEFAULT 0,
  most_popular_platform text,
  community_score integer DEFAULT 0,
  hot_topic text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_score CHECK (community_score >= 0 AND community_score <= 100)
);

ALTER TABLE social_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own company social metrics"
  ON social_metrics
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM auth.users
      WHERE auth.uid() = auth.users.id
      AND auth.users.raw_app_meta_data->>'company_id' = social_metrics.company_id::text
    )
  );

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update the updated_at column
CREATE TRIGGER update_social_metrics_updated_at
  BEFORE UPDATE ON social_metrics
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();