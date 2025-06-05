/*
  # Update Twitter platform name to X

  1. Changes
    - Update platform name from 'twitter' to 'x' in social_posts table
    - Update platform check constraint in social_posts table
*/

-- Drop existing platform constraint from social_posts
ALTER TABLE social_posts
DROP CONSTRAINT IF EXISTS social_posts_platform_check;

-- Add new platform constraint to social_posts
ALTER TABLE social_posts
ADD CONSTRAINT social_posts_platform_check
CHECK (platform IN ('x', 'facebook', 'linkedin', 'instagram'));

-- Update any existing twitter entries to x
UPDATE social_posts
SET platform = 'x'
WHERE platform = 'twitter';