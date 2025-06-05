/*
  # Add additional fields to chatbot_messages table

  1. Changes
    - Add subject field for conversation topics
    - Add sentiment_score for message sentiment analysis
    - Add keywords array for message categorization
    - Add email field for customer identification
*/

ALTER TABLE chatbot_messages
ADD COLUMN subject text,
ADD COLUMN sentiment_score numeric CHECK (sentiment_score >= 0 AND sentiment_score <= 1),
ADD COLUMN keywords text[] DEFAULT '{}'::text[],
ADD COLUMN email text;