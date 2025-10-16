/*
  # Create Vox Call Logs Table

  1. New Tables
    - `vox_call_logs`
      - `id` (uuid, primary key) - Unique identifier for each call log
      - `user_id` (uuid, foreign key) - References the user who initiated/received the call
      - `call_direction` (text) - Direction of the call: 'inbound' or 'outbound'
      - `phone_number` (text) - Phone number of the other party
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

  2. Security
    - Enable RLS on `vox_call_logs` table
    - Add policy for authenticated users to view their own call logs
    - Add policy for authenticated users to insert their own call logs
    - Add policy for authenticated users to update their own call logs
    - Add policy for authenticated users to delete their own call logs

  3. Indexes
    - Add index on user_id for faster queries
    - Add index on started_at for chronological sorting
    - Add index on call_direction for filtering
*/

CREATE TABLE IF NOT EXISTS vox_call_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  call_direction text NOT NULL CHECK (call_direction IN ('inbound', 'outbound')),
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
ALTER TABLE vox_call_logs ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own call logs"
  ON vox_call_logs
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own call logs"
  ON vox_call_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own call logs"
  ON vox_call_logs
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own call logs"
  ON vox_call_logs
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_vox_call_logs_user_id ON vox_call_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_vox_call_logs_started_at ON vox_call_logs(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_vox_call_logs_call_direction ON vox_call_logs(call_direction);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_vox_call_logs_updated_at
  BEFORE UPDATE ON vox_call_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();