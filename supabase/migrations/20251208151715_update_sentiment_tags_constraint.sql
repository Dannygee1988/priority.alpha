/*
  # Update sentiment tags constraint

  1. Changes
    - Add check constraint to `vox_inbound_calls.sentiment_tags` to only allow 'Positive', 'Negative', or 'Neutral'
    - Add check constraint to `vox_outbound_calls.sentiment_tags` to only allow 'Positive', 'Negative', or 'Neutral'
    - Update all existing records to set sentiment_tags to ['Positive']
  
  2. Security
    - No RLS changes needed (existing policies cover this column)
  
  3. Notes
    - This ensures data consistency and prevents invalid sentiment tags
    - All existing records will be set to 'Positive' as default
*/

-- Update all existing records in vox_inbound_calls to set sentiment_tags to ['Positive']
UPDATE vox_inbound_calls 
SET sentiment_tags = ARRAY['Positive']::text[]
WHERE sentiment_tags IS NULL OR sentiment_tags = ARRAY[]::text[] OR sentiment_tags != ARRAY['Positive']::text[];

-- Update all existing records in vox_outbound_calls to set sentiment_tags to ['Positive']
UPDATE vox_outbound_calls 
SET sentiment_tags = ARRAY['Positive']::text[]
WHERE sentiment_tags IS NULL OR sentiment_tags = ARRAY[]::text[] OR sentiment_tags != ARRAY['Positive']::text[];

-- Add check constraint to vox_inbound_calls
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'vox_inbound_calls_sentiment_tags_check'
  ) THEN
    ALTER TABLE vox_inbound_calls 
    ADD CONSTRAINT vox_inbound_calls_sentiment_tags_check 
    CHECK (
      sentiment_tags <@ ARRAY['Positive', 'Negative', 'Neutral']::text[]
      AND array_length(sentiment_tags, 1) = 1
    );
  END IF;
END $$;

-- Add check constraint to vox_outbound_calls
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'vox_outbound_calls_sentiment_tags_check'
  ) THEN
    ALTER TABLE vox_outbound_calls 
    ADD CONSTRAINT vox_outbound_calls_sentiment_tags_check 
    CHECK (
      sentiment_tags <@ ARRAY['Positive', 'Negative', 'Neutral']::text[]
      AND array_length(sentiment_tags, 1) = 1
    );
  END IF;
END $$;

-- Update default value for vox_inbound_calls
ALTER TABLE vox_inbound_calls 
ALTER COLUMN sentiment_tags SET DEFAULT ARRAY['Positive']::text[];

-- Update default value for vox_outbound_calls
ALTER TABLE vox_outbound_calls 
ALTER COLUMN sentiment_tags SET DEFAULT ARRAY['Positive']::text[];