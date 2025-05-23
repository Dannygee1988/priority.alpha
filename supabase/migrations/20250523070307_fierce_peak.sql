/*
  # Create RNS Documents Table
  
  1. New Tables
    - `rns_documents`
      - `id` (uuid, primary key)
      - `company_id` (uuid, foreign key to company_profiles)
      - `title` (text)
      - `content` (text)
      - `status` (text) - draft, published, archived
      - `published_at` (timestamptz)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
  
  2. Security
    - Enable RLS on `rns_documents` table
    - Add policies for authenticated users to manage their company's RNS documents
*/

-- Create the rns_documents table
CREATE TABLE IF NOT EXISTS rns_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES company_profiles(id),
  title text NOT NULL,
  content text NOT NULL,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  published_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT title_length CHECK (char_length(title) >= 3)
);

-- Enable Row Level Security
ALTER TABLE rns_documents ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own company RNS documents"
  ON rns_documents
  FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id 
      FROM user_companies 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage own company RNS documents"
  ON rns_documents
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
CREATE INDEX idx_rns_documents_company_id ON rns_documents(company_id);
CREATE INDEX idx_rns_documents_status ON rns_documents(status);