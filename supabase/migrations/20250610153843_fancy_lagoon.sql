/*
  # Create CV Library table

  1. New Tables
    - `cv_library`
      - `id` (uuid, primary key)
      - `company_id` (uuid, foreign key to company_profiles)
      - `candidate_name` (text)
      - `email` (text)
      - `phone` (text)
      - `position_applied` (text)
      - `experience_level` (text)
      - `location` (text)
      - `file_url` (text) - URL to the CV file
      - `file_name` (text)
      - `file_size` (bigint)
      - `tags` (text[])
      - `notes` (text)
      - `status` (text)
      - `uploaded_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS
    - Add policies for authenticated users to manage their company's CVs
*/

-- Create cv_library table
CREATE TABLE IF NOT EXISTS cv_library (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES company_profiles(id),
  candidate_name text NOT NULL,
  email text NOT NULL,
  phone text,
  position_applied text NOT NULL,
  experience_level text NOT NULL CHECK (experience_level IN ('Entry Level', 'Mid Level', 'Senior Level', 'Executive')),
  location text,
  file_url text NOT NULL,
  file_name text NOT NULL,
  file_size bigint NOT NULL,
  tags text[] DEFAULT '{}',
  notes text,
  status text NOT NULL DEFAULT 'New' CHECK (status IN ('New', 'Reviewed', 'Shortlisted', 'Interviewed', 'Rejected', 'Hired')),
  uploaded_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Add constraints
  CONSTRAINT candidate_name_length CHECK (char_length(candidate_name) >= 2),
  CONSTRAINT position_applied_length CHECK (char_length(position_applied) >= 2),
  CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_cv_library_company_id ON cv_library(company_id);
CREATE INDEX IF NOT EXISTS idx_cv_library_status ON cv_library(status);
CREATE INDEX IF NOT EXISTS idx_cv_library_experience_level ON cv_library(experience_level);
CREATE INDEX IF NOT EXISTS idx_cv_library_uploaded_at ON cv_library(uploaded_at);
CREATE INDEX IF NOT EXISTS idx_cv_library_tags ON cv_library USING gin(tags);

-- Enable RLS
ALTER TABLE cv_library ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can manage own company CV library"
  ON cv_library
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
CREATE TRIGGER update_cv_library_updated_at
  BEFORE UPDATE ON cv_library
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();