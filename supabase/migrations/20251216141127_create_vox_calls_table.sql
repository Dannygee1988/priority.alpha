/*
  # Create vox_calls Table

  1. New Tables
    - `vox_calls`
      - `id` (uuid, primary key) - Unique identifier for each call record
      - `user_id` (uuid, foreign key) - References auth.users table
      - `outbound_caller_id` (text) - Phone number for outbound calls
      - `inbound_caller_id` (text) - Phone number for inbound calls
      - `time_dialed` (timestamptz) - When the call was initiated
      - `call_direction` (text) - Direction of call (inbound/outbound)
      - `call_duration` (integer) - Duration in seconds
      - `tools_used` (jsonb) - Array of tools used during the call
      - `call_terminated_by` (text) - Who terminated the call (caller/agent/system)
      - `keyword_extraction` (jsonb) - Array of extracted keywords
      - `sentiment` (text) - Overall sentiment of the call
      - `transcript` (text) - Full call transcript
      - `summary` (text) - Call summary
      - `caller_name` (text) - Name of the caller
      - `caller_address` (text) - Address of the caller
      - `last_time_contacted` (timestamptz) - Last time this contact was reached
      - `call_method` (text) - Method of call (phone/voip/etc)
      - `caller_notes` (text) - Notes about the caller
      - `caller_email` (text) - Email address of the caller
      - `created_at` (timestamptz) - Record creation timestamp
      - `updated_at` (timestamptz) - Record last update timestamp

  2. Security
    - Enable RLS on `vox_calls` table
    - Add policies for authenticated users to access their own call records
    - Users can only view, insert, update, and delete their own calls

  3. Indexes
    - Index on user_id for faster lookups
    - Index on time_dialed for time-based queries
    - Index on call_direction for filtering by direction
*/

CREATE TABLE IF NOT EXISTS vox_calls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  outbound_caller_id text,
  inbound_caller_id text,
  time_dialed timestamptz,
  call_direction text CHECK (call_direction IN ('inbound', 'outbound')),
  call_duration integer DEFAULT 0,
  tools_used jsonb DEFAULT '[]'::jsonb,
  call_terminated_by text,
  keyword_extraction jsonb DEFAULT '[]'::jsonb,
  sentiment text CHECK (sentiment IN ('positive', 'neutral', 'negative')),
  transcript text,
  summary text,
  caller_name text,
  caller_address text,
  last_time_contacted timestamptz,
  call_method text,
  caller_notes text,
  caller_email text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE vox_calls ENABLE ROW LEVEL SECURITY;

-- Policy for SELECT: Users can view their own calls
CREATE POLICY "Users can view own calls"
  ON vox_calls
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy for INSERT: Users can create calls for themselves
CREATE POLICY "Users can create own calls"
  ON vox_calls
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy for UPDATE: Users can update their own calls
CREATE POLICY "Users can update own calls"
  ON vox_calls
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy for DELETE: Users can delete their own calls
CREATE POLICY "Users can delete own calls"
  ON vox_calls
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create index for faster lookups by user_id
CREATE INDEX IF NOT EXISTS idx_vox_calls_user_id ON vox_calls(user_id);

-- Create index for faster lookups by time_dialed
CREATE INDEX IF NOT EXISTS idx_vox_calls_time_dialed ON vox_calls(time_dialed DESC);

-- Create index for faster lookups by call_direction
CREATE INDEX IF NOT EXISTS idx_vox_calls_direction ON vox_calls(call_direction);
