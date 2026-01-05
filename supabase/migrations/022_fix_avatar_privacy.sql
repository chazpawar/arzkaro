-- =============================================
-- Migration: Fix Avatar Privacy
-- Description: Updates avatar storage RLS to only allow friends, event members, and hosts to see avatars
-- =============================================

-- Drop existing avatar policies (make migration idempotent)
DROP POLICY IF EXISTS "Public can view avatars" ON storage.objects;
DROP POLICY IF EXISTS "Friends and event members can view avatars" ON storage.objects;

-- Create function to check if users are friends
CREATE OR REPLACE FUNCTION are_friends(user1_id UUID, user2_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM friend_requests
    WHERE status = 'accepted'
      AND (
        (sender_id = user1_id AND receiver_id = user2_id)
        OR (sender_id = user2_id AND receiver_id = user1_id)
      )
  );
END;
$$;

-- Create function to check if users are in same event/group
CREATE OR REPLACE FUNCTION are_event_members(user1_id UUID, user2_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if both users are members of the same event group
  RETURN EXISTS (
    SELECT 1 
    FROM group_members gm1
    INNER JOIN group_members gm2 ON gm1.group_id = gm2.group_id
    WHERE gm1.user_id = user1_id 
      AND gm2.user_id = user2_id
  );
END;
$$;

-- Create function to check if a user is a host of any published event
CREATE OR REPLACE FUNCTION is_event_host(user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if user is hosting any published event
  RETURN EXISTS (
    SELECT 1 FROM events
    WHERE host_id = user_id 
      AND status = 'published'
  );
END;
$$;

-- New policy: Only friends, event members, hosts, own avatar, or admins can view avatars
CREATE POLICY "Friends and event members can view avatars"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'avatars'
  AND (
    -- Own avatar
    auth.uid()::text = (storage.foldername(name))[1]
    -- Or is admin
    OR is_admin()
    -- Or they are friends
    OR are_friends(auth.uid(), ((storage.foldername(name))[1])::uuid)
    -- Or they are in the same event group
    OR are_event_members(auth.uid(), ((storage.foldername(name))[1])::uuid)
    -- Or the avatar belongs to a host (public figure)
    OR is_event_host(((storage.foldername(name))[1])::uuid)
  )
);

-- Add comments (Note: Cannot add comment on storage.objects policy due to permissions)
COMMENT ON FUNCTION are_friends IS 'Check if two users are friends (accepted friend request)';
COMMENT ON FUNCTION are_event_members IS 'Check if two users are members of the same event group';
COMMENT ON FUNCTION is_event_host IS 'Check if a user is hosting any published event';
