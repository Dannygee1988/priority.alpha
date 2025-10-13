/*
  # Add favorite feature to chatbot messages

  1. Changes
    - Add `is_favorite` column to `chatbot_messages` table
      - `is_favorite` (boolean, default false) - marks messages as favorites

  2. Notes
    - This allows users to star/favorite important customer messages for quick access
    - Default value is false for all existing and new messages
*/

-- Add is_favorite column to chatbot_messages table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'chatbot_messages' AND column_name = 'is_favorite'
  ) THEN
    ALTER TABLE chatbot_messages ADD COLUMN is_favorite boolean DEFAULT false;
  END IF;
END $$;

-- Create index for faster filtering of favorite messages
CREATE INDEX IF NOT EXISTS idx_chatbot_messages_is_favorite ON chatbot_messages(is_favorite) WHERE is_favorite = true;
