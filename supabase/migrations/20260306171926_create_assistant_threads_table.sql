/*
  # Create OpenAI Assistant Threads Table

  1. New Tables
    - `assistant_threads`
      - `id` (uuid, primary key)
      - `company_id` (uuid, foreign key to company_profiles)
      - `thread_id` (text, OpenAI thread ID)
      - `assistant_id` (text, OpenAI assistant ID)
      - `metadata` (jsonb, thread metadata)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `assistant_messages`
      - `id` (uuid, primary key)
      - `thread_id` (uuid, foreign key to assistant_threads)
      - `message_id` (text, OpenAI message ID)
      - `role` (text, user or assistant)
      - `content` (jsonb, message content)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users to access their company's threads and messages
*/

-- Create assistant_threads table
CREATE TABLE IF NOT EXISTS assistant_threads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES company_profiles(id) ON DELETE CASCADE NOT NULL,
  thread_id text UNIQUE NOT NULL,
  assistant_id text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create assistant_messages table
CREATE TABLE IF NOT EXISTS assistant_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id uuid REFERENCES assistant_threads(id) ON DELETE CASCADE NOT NULL,
  message_id text UNIQUE NOT NULL,
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  content jsonb NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_assistant_threads_company_id ON assistant_threads(company_id);
CREATE INDEX IF NOT EXISTS idx_assistant_threads_thread_id ON assistant_threads(thread_id);
CREATE INDEX IF NOT EXISTS idx_assistant_messages_thread_id ON assistant_messages(thread_id);
CREATE INDEX IF NOT EXISTS idx_assistant_messages_created_at ON assistant_messages(created_at DESC);

-- Enable RLS
ALTER TABLE assistant_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE assistant_messages ENABLE ROW LEVEL SECURITY;

-- Policies for assistant_threads
CREATE POLICY "Users can view their company's assistant threads"
  ON assistant_threads FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM user_profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their company's assistant threads"
  ON assistant_threads FOR INSERT
  TO authenticated
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM user_profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update their company's assistant threads"
  ON assistant_threads FOR UPDATE
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM user_profiles WHERE id = auth.uid()
    )
  )
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM user_profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their company's assistant threads"
  ON assistant_threads FOR DELETE
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM user_profiles WHERE id = auth.uid()
    )
  );

-- Policies for assistant_messages
CREATE POLICY "Users can view messages from their company's threads"
  ON assistant_messages FOR SELECT
  TO authenticated
  USING (
    thread_id IN (
      SELECT id FROM assistant_threads WHERE company_id IN (
        SELECT company_id FROM user_profiles WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can insert messages to their company's threads"
  ON assistant_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    thread_id IN (
      SELECT id FROM assistant_threads WHERE company_id IN (
        SELECT company_id FROM user_profiles WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can update messages in their company's threads"
  ON assistant_messages FOR UPDATE
  TO authenticated
  USING (
    thread_id IN (
      SELECT id FROM assistant_threads WHERE company_id IN (
        SELECT company_id FROM user_profiles WHERE id = auth.uid()
      )
    )
  )
  WITH CHECK (
    thread_id IN (
      SELECT id FROM assistant_threads WHERE company_id IN (
        SELECT company_id FROM user_profiles WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can delete messages from their company's threads"
  ON assistant_messages FOR DELETE
  TO authenticated
  USING (
    thread_id IN (
      SELECT id FROM assistant_threads WHERE company_id IN (
        SELECT company_id FROM user_profiles WHERE id = auth.uid()
      )
    )
  );
