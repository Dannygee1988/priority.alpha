/*
  # Create advisor_code table

  ## Summary
  Creates a table to store advisor agent code for each company, including JavaScript, CSS, and HTML code along with a live status indicator.

  ## Tables Created
  - `advisor_code`
    - `id` (uuid, primary key) - Unique identifier for the code record
    - `company_id` (uuid, foreign key) - Links to the company_profiles table
    - `live` (boolean) - Indicates if the code is currently live/active
    - `javascript` (text) - JavaScript code for the advisor agent
    - `css` (text) - CSS styling code for the advisor agent
    - `html` (text) - HTML markup code for the advisor agent
    - `created_at` (timestamptz) - Record creation timestamp
    - `updated_at` (timestamptz) - Last update timestamp

  ## Security
  - Enable RLS on `advisor_code` table
  - Add policy for authenticated users to read their own company's code
  - Add policy for authenticated users to insert code for their own company
  - Add policy for authenticated users to update their own company's code
  - Add policy for authenticated users to delete their own company's code

  ## Notes
  1. Each company can have one advisor code configuration
  2. The `live` field defaults to false for safety
  3. All code fields are nullable to allow incremental development
  4. Company ID is linked via user_companies junction table
*/

-- Create advisor_code table
CREATE TABLE IF NOT EXISTS advisor_code (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES company_profiles(id) ON DELETE CASCADE,
  live boolean DEFAULT false NOT NULL,
  javascript text,
  css text,
  html text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(company_id)
);

-- Enable RLS
ALTER TABLE advisor_code ENABLE ROW LEVEL SECURITY;

-- Create policies for advisor_code
CREATE POLICY "Users can view their company's advisor code"
  ON advisor_code FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM user_companies WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert advisor code for their company"
  ON advisor_code FOR INSERT
  TO authenticated
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM user_companies WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their company's advisor code"
  ON advisor_code FOR UPDATE
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM user_companies WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM user_companies WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their company's advisor code"
  ON advisor_code FOR DELETE
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM user_companies WHERE user_id = auth.uid()
    )
  );

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_advisor_code_company_id ON advisor_code(company_id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_advisor_code_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_advisor_code_updated_at
  BEFORE UPDATE ON advisor_code
  FOR EACH ROW
  EXECUTE FUNCTION update_advisor_code_updated_at();
