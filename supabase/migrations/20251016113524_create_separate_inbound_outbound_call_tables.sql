/*
  # Create Separate Inbound and Outbound Call Tables

  1. Drop existing table
    - Drop `vox_call_logs` table

  2. New Tables
    - `vox_inbound_calls`
      - `id` (uuid, primary key) - Unique identifier for each call
      - `user_id` (uuid, foreign key) - References the user receiving the call
      - `agent_id` (text) - ID of the AI agent handling the call
      - `phone_number` (text) - Phone number of the caller
      - `call_duration` (integer) - Duration of the call in seconds
      - `call_status` (text) - Status: 'completed', 'failed', 'no-answer', 'busy', 'cancelled'
      - `call_sid` (text) - External system call identifier (e.g., Twilio SID)
      - `recording_url` (text) - URL to the call recording if available
      - `transcript` (text) - Full transcript of the call conversation
      - `summary` (text) - AI-generated summary of the call
      - `sentiment` (text) - Detected sentiment: 'positive', 'neutral', 'negative'
      - `tags` (text[]) - Array of tags for categorization
      - `notes` (text) - Additional notes about the call
      - `cost` (numeric) - Cost of the call in currency units
      - `started_at` (timestamptz) - When the call started
      - `ended_at` (timestamptz) - When the call ended
      - `created_at` (timestamptz) - Record creation timestamp
      - `updated_at` (timestamptz) - Record last update timestamp

    - `vox_outbound_calls`
      - `id` (uuid, primary key) - Unique identifier for each call
      - `user_id` (uuid, foreign key) - References the user making the call
      - `agent_id` (text) - ID of the AI agent handling the call
      - `phone_number` (text) - Phone number being called
      - `call_duration` (integer) - Duration of the call in seconds
      - `call_status` (text) - Status: 'completed', 'failed', 'no-answer', 'busy', 'cancelled'
      - `call_sid` (text) - External system call identifier (e.g., Twilio SID)
      - `recording_url` (text) - URL to the call recording if available
      - `transcript` (text) - Full transcript of the call conversation
      - `summary` (text) - AI-generated summary of the call
      - `sentiment` (text) - Detected sentiment: 'positive', 'neutral', 'negative'
      - `tags` (text[]) - Array of tags for categorization
      - `notes` (text) - Additional notes about the call
      - `cost` (numeric) - Cost of the call in currency units
      - `started_at` (timestamptz) - When the call started
      - `ended_at` (timestamptz) - When the call ended
      - `created_at` (timestamptz) - Record creation timestamp
      - `updated_at` (timestamptz) - Record last update timestamp

  3. Security
    - Enable RLS on both tables
    - Add policies for authenticated users to manage their own calls

  4. Indexes
    - Add indexes on user_id, agent_id, and started_at for both tables
*/

-- Drop existing table if it exists
DROP TABLE IF EXISTS vox_call_logs;

-- Create vox_inbound_calls table
CREATE TABLE IF NOT EXISTS vox_inbound_calls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  agent_id text NOT NULL,
  phone_number text NOT NULL,
  call_duration integer DEFAULT 0,
  call_status text NOT NULL CHECK (call_status IN ('completed', 'failed', 'no-answer', 'busy', 'cancelled')) DEFAULT 'completed',
  call_sid text,
  recording_url text,
  transcript text,
  summary text,
  sentiment text CHECK (sentiment IN ('positive', 'neutral', 'negative')),
  tags text[] DEFAULT '{}',
  notes text,
  cost numeric(10, 4) DEFAULT 0,
  started_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create vox_outbound_calls table
CREATE TABLE IF NOT EXISTS vox_outbound_calls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  agent_id text NOT NULL,
  phone_number text NOT NULL,
  call_duration integer DEFAULT 0,
  call_status text NOT NULL CHECK (call_status IN ('completed', 'failed', 'no-answer', 'busy', 'cancelled')) DEFAULT 'completed',
  call_sid text,
  recording_url text,
  transcript text,
  summary text,
  sentiment text CHECK (sentiment IN ('positive', 'neutral', 'negative')),
  tags text[] DEFAULT '{}',
  notes text,
  cost numeric(10, 4) DEFAULT 0,
  started_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE vox_inbound_calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE vox_outbound_calls ENABLE ROW LEVEL SECURITY;

-- Create policies for vox_inbound_calls
CREATE POLICY "Users can view own inbound calls"
  ON vox_inbound_calls
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own inbound calls"
  ON vox_inbound_calls
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own inbound calls"
  ON vox_inbound_calls
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own inbound calls"
  ON vox_inbound_calls
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create policies for vox_outbound_calls
CREATE POLICY "Users can view own outbound calls"
  ON vox_outbound_calls
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own outbound calls"
  ON vox_outbound_calls
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own outbound calls"
  ON vox_outbound_calls
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own outbound calls"
  ON vox_outbound_calls
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for vox_inbound_calls
CREATE INDEX IF NOT EXISTS idx_vox_inbound_calls_user_id ON vox_inbound_calls(user_id);
CREATE INDEX IF NOT EXISTS idx_vox_inbound_calls_agent_id ON vox_inbound_calls(agent_id);
CREATE INDEX IF NOT EXISTS idx_vox_inbound_calls_started_at ON vox_inbound_calls(started_at DESC);

-- Create indexes for vox_outbound_calls
CREATE INDEX IF NOT EXISTS idx_vox_outbound_calls_user_id ON vox_outbound_calls(user_id);
CREATE INDEX IF NOT EXISTS idx_vox_outbound_calls_agent_id ON vox_outbound_calls(agent_id);
CREATE INDEX IF NOT EXISTS idx_vox_outbound_calls_started_at ON vox_outbound_calls(started_at DESC);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for both tables
CREATE TRIGGER update_vox_inbound_calls_updated_at
  BEFORE UPDATE ON vox_inbound_calls
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vox_outbound_calls_updated_at
  BEFORE UPDATE ON vox_outbound_calls
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();