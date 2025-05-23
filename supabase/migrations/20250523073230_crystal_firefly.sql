/*
  # Create documents table for knowledge base

  1. New Tables
    - `documents`
      - `id` (uuid, primary key)
      - `company_id` (uuid, foreign key to company_profiles)
      - `name` (text)
      - `type` (text)
      - `size` (bigint)
      - `token_count` (integer)
      - `url` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `documents` table
    - Add policies for authenticated users to manage their own company's documents
*/

CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES company_profiles(id),
  name text NOT NULL,
  type text NOT NULL,
  size bigint NOT NULL,
  token_count integer DEFAULT 0,
  url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own company documents"
  ON documents
  FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id 
      FROM user_companies 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage own company documents"
  ON documents
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

-- Create indexes
CREATE INDEX idx_documents_company_id ON documents(company_id);