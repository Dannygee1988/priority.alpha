-- Create social_posts table
CREATE TABLE IF NOT EXISTS social_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES company_profiles(id),
  platform text NOT NULL CHECK (platform IN ('x', 'facebook', 'linkedin', 'instagram')),
  content text NOT NULL,
  media_urls text[] DEFAULT '{}',
  scheduled_for timestamptz,
  published_at timestamptz,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'published', 'failed')),
  engagement jsonb DEFAULT '{
    "likes": 0,
    "shares": 0,
    "comments": 0,
    "clicks": 0
  }'::jsonb,
  tags text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  rns_document_id uuid REFERENCES rns_documents(id),
  campaign_id text,
  analytics jsonb DEFAULT '{}'::jsonb,
  metadata jsonb DEFAULT '{}'::jsonb,
  
  -- Add constraints
  CONSTRAINT content_length CHECK (
    CASE
      WHEN platform = 'x' THEN char_length(content) <= 280
      WHEN platform = 'facebook' THEN char_length(content) <= 63206
      WHEN platform = 'linkedin' THEN char_length(content) <= 3000
      WHEN platform = 'instagram' THEN char_length(content) <= 2200
      ELSE false
    END
  )
);

-- Create indexes
CREATE INDEX idx_social_posts_company_id ON social_posts(company_id);
CREATE INDEX idx_social_posts_platform ON social_posts(platform);
CREATE INDEX idx_social_posts_status ON social_posts(status);
CREATE INDEX idx_social_posts_scheduled_for ON social_posts(scheduled_for);
CREATE INDEX idx_social_posts_published_at ON social_posts(published_at);
CREATE INDEX idx_social_posts_campaign_id ON social_posts(campaign_id);
CREATE INDEX idx_social_posts_tags ON social_posts USING gin(tags);

-- Enable RLS
ALTER TABLE social_posts ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can manage own company social posts"
  ON social_posts
  FOR ALL
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id 
      FROM user_companies 
      WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    company_id IN (
      SELECT company_id 
      FROM user_companies 
      WHERE user_id = auth.uid()
    )
  );

-- Create updated_at trigger
CREATE TRIGGER update_social_posts_updated_at
  BEFORE UPDATE ON social_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add comments
COMMENT ON TABLE social_posts IS 'Stores social media posts for companies';
COMMENT ON COLUMN social_posts.platform IS 'Social media platform where the post will be published';
COMMENT ON COLUMN social_posts.media_urls IS 'Array of URLs to media attachments (images, videos)';
COMMENT ON COLUMN social_posts.engagement IS 'Engagement metrics (likes, shares, comments)';
COMMENT ON COLUMN social_posts.analytics IS 'Performance metrics and analytics data';
COMMENT ON COLUMN social_posts.metadata IS 'Platform-specific metadata and settings';