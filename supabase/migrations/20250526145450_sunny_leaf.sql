/*
  # Create advisor messages table

  1. New Tables
    - `advisor_messages`
      - `id` (uuid, primary key)
      - `company_id` (uuid, foreign key to company_profiles)
      - `role` (text) - user or assistant
      - `content` (text)
      - `sources` (jsonb) - array of sources used in response
      - `created_at` (timestamptz)
      - `conversation_id` (uuid) - groups messages into conversations
      - `parent_id` (uuid) - references previous message in conversation

  2. Security
    - Enable RLS
    - Add policies for authenticated users to manage their company's messages
*/

CREATE TABLE IF NOT EXISTS advisor_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES company_profiles(id),
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  content text NOT NULL,
  sources jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  conversation_id uuid NOT NULL DEFAULT gen_random_uuid(),
  parent_id uuid REFERENCES advisor_messages(id),
  CONSTRAINT valid_parent CHECK (
    (parent_id IS NULL AND role = 'user') OR
    (parent_id IS NOT NULL)
  )
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_advisor_messages_company_id ON advisor_messages(company_id);
CREATE INDEX IF NOT EXISTS idx_advisor_messages_conversation_id ON advisor_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_advisor_messages_created_at ON advisor_messages(created_at);

-- Enable RLS
ALTER TABLE advisor_messages ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can manage own company advisor messages"
  ON advisor_messages
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