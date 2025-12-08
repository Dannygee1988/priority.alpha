/*
  # Add sentiment tags to vox call tables

  1. Changes
    - Add `sentiment_tags` column to `vox_inbound_calls` table
      - Text array field for storing multiple sentiment tags
      - Defaults to empty array
      - Can be populated by external LLM analysis
    - Add `sentiment_tags` column to `vox_outbound_calls` table
      - Text array field for storing multiple sentiment tags
      - Defaults to empty array
      - Can be populated by external LLM analysis

  2. Security
    - No RLS changes needed (existing policies cover this column)

  3. Notes
    - This field will be used to store sentiment analysis tags from external LLM
    - Similar structure to keywords field in chatbot_messages table
    - Can include multiple sentiment descriptors (e.g., 'positive', 'urgent', 'satisfied', 'frustrated')
*/

-- Add sentiment_tags column to vox_inbound_calls table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vox_inbound_calls' AND column_name = 'sentiment_tags'
  ) THEN
    ALTER TABLE vox_inbound_calls ADD COLUMN sentiment_tags text[] DEFAULT '{}'::text[];
  END IF;
END $$;

-- Add sentiment_tags column to vox_outbound_calls table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vox_outbound_calls' AND column_name = 'sentiment_tags'
  ) THEN
    ALTER TABLE vox_outbound_calls ADD COLUMN sentiment_tags text[] DEFAULT '{}'::text[];
  END IF;
END $$;