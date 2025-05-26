/*
  # Create gallery images table

  1. New Tables
    - `gallery_images`
      - `id` (uuid, primary key)
      - `company_id` (uuid, foreign key to company_profiles)
      - `url` (text, required) - Cloudinary URL
      - `title` (text, required)
      - `description` (text)
      - `type` (text) - Purpose/category of the image (e.g., 'social_media', 'product')
      - `tags` (text[]) - Array of tags for organization
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `gallery_images` table
    - Add policies for authenticated users to manage their company's images
*/

-- Create the gallery_images table
CREATE TABLE IF NOT EXISTS gallery_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES company_profiles(id),
  url text NOT NULL,
  title text NOT NULL,
  description text,
  type text,
  tags text[] DEFAULT '{}'::text[],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT title_length CHECK (char_length(title) >= 2)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_gallery_images_company_id ON gallery_images(company_id);
CREATE INDEX IF NOT EXISTS idx_gallery_images_type ON gallery_images(type);
CREATE INDEX IF NOT EXISTS idx_gallery_images_tags ON gallery_images USING gin(tags);

-- Enable Row Level Security
ALTER TABLE gallery_images ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can manage own company gallery images"
  ON gallery_images
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
CREATE TRIGGER update_gallery_images_updated_at
  BEFORE UPDATE ON gallery_images
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();