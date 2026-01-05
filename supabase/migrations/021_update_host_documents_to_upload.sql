-- =====================================================
-- MIGRATION 021: Update Host Documents to File Upload
-- =====================================================
-- This migration updates the host_requests table to support
-- direct file uploads for PAN and GST documents instead of URLs.
-- Creates a storage bucket for host documents.
-- =====================================================

-- Step 1: Create storage bucket for host documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'host-documents', 
  'host-documents', 
  false, -- Private bucket for sensitive documents
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Step 2: Drop existing policies if they exist (to make migration idempotent)
DROP POLICY IF EXISTS "Users can upload their own host documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own host documents" ON storage.objects;
DROP POLICY IF EXISTS "Admins can view all host documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own host documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own host documents" ON storage.objects;

-- Step 3: Create storage policies for host documents bucket

-- Allow authenticated users to upload their own documents
CREATE POLICY "Users can upload their own host documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'host-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to view their own documents
CREATE POLICY "Users can view their own host documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'host-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow admins to view all host documents
CREATE POLICY "Admins can view all host documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'host-documents'
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Allow users to update their own documents
CREATE POLICY "Users can update their own host documents"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'host-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to delete their own documents
CREATE POLICY "Users can delete their own host documents"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'host-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Step 4: Update column comments
COMMENT ON COLUMN host_requests.pan_card_photo_url IS 'Supabase Storage URL for uploaded PAN card photo';
COMMENT ON COLUMN host_requests.gst_certificate_url IS 'Supabase Storage URL for uploaded GST certificate (optional)';
