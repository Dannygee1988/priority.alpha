/*
  # Create chatbot messages table

  1. New Tables
    - `chatbot_messages`
      - `id` (uuid, primary key)
      - `company_id` (uuid, foreign key to company_profiles)
      - `conversation_id` (uuid) - groups messages in a conversation
      - `role` (text) - 'user' or 'bot'
      - `content` (text)
      - `source` (text) - where the message came from (website, whatsapp, telegram, etc.)
      - `metadata` (jsonb) - additional data like user info, location, etc.
      - `created_at` (timestamptz)
      - `parent_id` (uuid) - references previous message in conversation

  2. Security
    - Enable RLS
    - Add policies for authenticated users to manage their company's messages
    - Add indexes for better performance
*/

-- Create chatbot_messages table
CREATE TABLE IF NOT EXISTS chatbot_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES company_profiles(id),
  conversation_id uuid NOT NULL,
  role text NOT NULL CHECK (role IN ('user', 'bot')),
  content text NOT NULL,
  source text NOT NULL CHECK (source IN ('website', 'whatsapp', 'telegram', 'facebook', 'instagram')),
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  parent_id uuid REFERENCES chatbot_messages(id),
  CONSTRAINT valid_parent CHECK (
    (parent_id IS NULL AND role = 'user') OR
    (parent_id IS NOT NULL)
  )
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_chatbot_messages_company_id ON chatbot_messages(company_id);
CREATE INDEX IF NOT EXISTS idx_chatbot_messages_conversation_id ON chatbot_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_chatbot_messages_created_at ON chatbot_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_chatbot_messages_source ON chatbot_messages(source);

-- Enable RLS
ALTER TABLE chatbot_messages ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can manage own company chatbot messages"
  ON chatbot_messages
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

-- Add comments
COMMENT ON TABLE chatbot_messages IS 'Stores messages from external chatbot conversations';
COMMENT ON COLUMN chatbot_messages.source IS 'Platform where the conversation took place';
COMMENT ON COLUMN chatbot_messages.metadata IS 'Additional data about the conversation (user info, location, etc.)';