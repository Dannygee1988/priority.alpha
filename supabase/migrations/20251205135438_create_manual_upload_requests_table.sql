/*
  # Create Manual Upload Requests Table

  1. New Tables
    - `vox_manual_upload_requests`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `company_id` (uuid, references company_profiles)
      - `file_name` (text) - original CSV filename
      - `contact_count` (integer) - number of contacts in the upload
      - `csv_data` (jsonb) - the parsed CSV data
      - `status` (text) - processing status (pending, processing, completed, failed)
      - `notes` (text) - optional notes from the user
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
      - `processed_at` (timestamptz) - when Pri0r1ty processed it

  2. Security
    - Enable RLS on `vox_manual_upload_requests` table
    - Add policies for authenticated users to:
      - Insert their own upload requests
      - View their own upload requests
      - Update their own upload requests (for notes)
*/

CREATE TABLE IF NOT EXISTS vox_manual_upload_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  company_id uuid REFERENCES company_profiles(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  contact_count integer DEFAULT 0 NOT NULL,
  csv_data jsonb NOT NULL,
  status text DEFAULT 'pending' NOT NULL,
  notes text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  processed_at timestamptz
);

ALTER TABLE vox_manual_upload_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own manual upload requests"
  ON vox_manual_upload_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own manual upload requests"
  ON vox_manual_upload_requests
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own manual upload requests"
  ON vox_manual_upload_requests
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_vox_manual_upload_requests_user_id 
  ON vox_manual_upload_requests(user_id);

CREATE INDEX IF NOT EXISTS idx_vox_manual_upload_requests_status 
  ON vox_manual_upload_requests(status);

CREATE INDEX IF NOT EXISTS idx_vox_manual_upload_requests_created_at 
  ON vox_manual_upload_requests(created_at DESC);