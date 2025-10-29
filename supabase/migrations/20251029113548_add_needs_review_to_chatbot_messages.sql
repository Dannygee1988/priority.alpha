/*
  # Add needs_review flag to chatbot_messages

  1. Changes
    - Add `needs_review` column to `chatbot_messages` table
      - Boolean field to flag messages that need accuracy review
      - Defaults to false
      - Indexed for efficient filtering
  
  2. Security
    - No RLS changes needed (existing policies cover this column)
*/

-- Add needs_review column to chatbot_messages table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'chatbot_messages' AND column_name = 'needs_review'
  ) THEN
    ALTER TABLE chatbot_messages ADD COLUMN needs_review boolean DEFAULT false;
  END IF;
END $$;

-- Create index for efficient filtering of flagged messages
CREATE INDEX IF NOT EXISTS idx_chatbot_messages_needs_review ON chatbot_messages(needs_review) WHERE needs_review = true;
