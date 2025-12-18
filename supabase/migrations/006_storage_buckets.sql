-- ============================================================================
-- Storage Bucket and Policies for Event Images
-- ============================================================================
-- This migration must be run in the Supabase Dashboard SQL Editor
-- Go to: https://supabase.com/dashboard/project/YOUR_PROJECT/sql/new
-- ============================================================================

-- Step 1: Create storage bucket for event images with constraints
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'event-images', 
  'event-images', 
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Step 2: Drop existing policies if they exist (to make migration idempotent)
DROP POLICY IF EXISTS "Authenticated users can upload event images" ON storage.objects;
DROP POLICY IF EXISTS "Public can view event images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own event images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own event images" ON storage.objects;

-- Step 3: Create storage policies for event images bucket

-- Allow authenticated users to upload images
-- Allows authenticated users to upload images to the event-images bucket
CREATE POLICY "Authenticated users can upload event images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'event-images');

-- Allow public read access to event images
-- Allows anyone to view event images
CREATE POLICY "Public can view event images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'event-images');

-- Allow users to update their own event images
-- Allows users to update images in folders matching their user ID
CREATE POLICY "Users can update their own event images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'event-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow users to delete their own event images
-- Allows users to delete images in folders matching their user ID
CREATE POLICY "Users can delete their own event images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'event-images' AND auth.uid()::text = (storage.foldername(name))[1]);
