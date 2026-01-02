-- =====================================================
-- MIGRATION 025: Fix Friends Realtime & Group Members Visibility
-- =====================================================
-- This migration fixes three critical issues:
--   1. Enables realtime subscriptions for friend_requests and friendships tables
--   2. Fixes RLS policy so users can see ALL group members (not just themselves)
--   3. Fixes profiles RLS to allow viewing profiles in friend requests and group members
--
-- Issues Fixed:
--   - Friend requests/friendships weren't in realtime publication
--   - Group members policy only showed user's own row
--   - Profiles RLS blocked foreign key joins (sender profiles showing as null)
--
-- Run this to fix friends and group members features
-- =====================================================

-- =====================================================
-- SECTION 1: ENABLE REALTIME FOR FRIENDS TABLES
-- =====================================================

-- Add friend_requests table to realtime publication (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'friend_requests'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.friend_requests';
    RAISE NOTICE 'SUCCESS: Added friend_requests table to realtime publication';
  ELSE
    RAISE NOTICE 'INFO: friend_requests table already in realtime publication';
  END IF;
END
$$;

-- Add friendships table to realtime publication (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'friendships'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.friendships';
    RAISE NOTICE 'SUCCESS: Added friendships table to realtime publication';
  ELSE
    RAISE NOTICE 'INFO: friendships table already in realtime publication';
  END IF;
END
$$;

-- Set replica identity to FULL for UPDATE/DELETE events
-- This allows Supabase Realtime to send full row data
ALTER TABLE public.friend_requests REPLICA IDENTITY FULL;
ALTER TABLE public.friendships REPLICA IDENTITY FULL;

COMMENT ON TABLE friend_requests IS 'Friend requests between users (realtime enabled)';
COMMENT ON TABLE friendships IS 'Confirmed friendships between users (realtime enabled)';

-- =====================================================
-- SECTION 2: FIX GROUP MEMBERS RLS POLICY
-- =====================================================

-- Drop the old restrictive policy that only showed user's own row
DROP POLICY IF EXISTS "Group members can view members" ON group_members;
DROP POLICY IF EXISTS "Group members can view all members in their groups" ON group_members;

-- Disable RLS temporarily to avoid recursion issues
ALTER TABLE group_members DISABLE ROW LEVEL SECURITY;

-- Create helper function to check if user is a member of a group
-- This breaks the recursion by using security definer
CREATE OR REPLACE FUNCTION is_group_member(p_group_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM group_members 
    WHERE group_id = p_group_id 
      AND user_id = p_user_id
  );
$$;

-- Re-enable RLS
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;

-- Create new policy using the helper function (no recursion)
CREATE POLICY "Group members can view all members in their groups"
  ON group_members FOR SELECT
  USING (
    -- User can see all members in groups they belong to
    is_group_member(group_members.group_id, (SELECT auth.uid()))
    -- OR user is the event host
    OR EXISTS (
      SELECT 1 FROM event_groups eg 
      INNER JOIN events e ON eg.event_id = e.id 
      WHERE eg.id = group_members.group_id 
        AND e.host_id = (SELECT auth.uid())
    )
    -- OR admins can see all
    OR is_admin()
  );

COMMENT ON POLICY "Group members can view all members in their groups" ON group_members IS 
  'Allows users to see all members in groups they belong to, hosts to see their event groups, and admins to see all';

COMMENT ON FUNCTION is_group_member(uuid, uuid) IS 
  'Helper function to check group membership without RLS recursion';

-- =====================================================
-- SECTION 3: FIX PROFILES RLS FOR FRIEND REQUESTS & GROUP MEMBERS
-- =====================================================

-- Drop the old restrictive profiles policy
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;

-- Create new policy that allows viewing profiles in friend requests and groups
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (
    -- Allow viewing public profiles
    is_public = TRUE 
    -- Allow viewing own profile
    OR (SELECT auth.uid()) = id
    -- Allow admins to view all profiles
    OR is_admin()
    -- Allow viewing profiles of users who sent/received friend requests from you
    OR EXISTS (
      SELECT 1 FROM friend_requests fr
      WHERE (fr.sender_id = profiles.id AND fr.receiver_id = (SELECT auth.uid()))
         OR (fr.receiver_id = profiles.id AND fr.sender_id = (SELECT auth.uid()))
    )
    -- Allow viewing profiles of your friends
    OR EXISTS (
      SELECT 1 FROM friendships f
      WHERE (f.user_id_1 = profiles.id AND f.user_id_2 = (SELECT auth.uid()))
         OR (f.user_id_2 = profiles.id AND f.user_id_1 = (SELECT auth.uid()))
    )
    -- Allow viewing profiles of users in the same group as you
    OR EXISTS (
      SELECT 1 FROM group_members gm1
      INNER JOIN group_members gm2 ON gm1.group_id = gm2.group_id
      WHERE gm1.user_id = profiles.id 
        AND gm2.user_id = (SELECT auth.uid())
    )
    -- Allow viewing profiles of users you have DM conversations with
    OR EXISTS (
      SELECT 1 FROM dm_conversations dc
      WHERE (dc.user_id_1 = profiles.id AND dc.user_id_2 = (SELECT auth.uid()))
         OR (dc.user_id_2 = profiles.id AND dc.user_id_1 = (SELECT auth.uid()))
    )
    -- Allow viewing profiles referenced in your notifications
    OR EXISTS (
      SELECT 1 FROM notifications n
      WHERE n.user_id = (SELECT auth.uid())
        AND n.related_user_id = profiles.id
    )
  );

COMMENT ON POLICY "Public profiles are viewable by everyone" ON profiles IS 
  'Allows viewing public profiles, own profile, admins can see all, and users can see profiles of friend request participants, friends, group members, DM conversation partners, and notification-related users';

-- =====================================================
-- Migration Complete!
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE 'SUCCESS: Migration 025: Friends & Group Members Fixed Successfully';
  RAISE NOTICE '';
  RAISE NOTICE 'FRIENDS REALTIME:';
  RAISE NOTICE '   - Realtime enabled for: friend_requests, friendships';
  RAISE NOTICE '   - Replica identity set to FULL for UPDATE/DELETE events';
  RAISE NOTICE '   - Live friend request notifications';
  RAISE NOTICE '   - Friend acceptance/rejection updates';
  RAISE NOTICE '   - Friendship removal notifications';
  RAISE NOTICE '';
  RAISE NOTICE 'GROUP MEMBERS VISIBILITY:';
  RAISE NOTICE '   - Users can now see ALL members in groups they belong to';
  RAISE NOTICE '   - Event hosts can see all members in their event groups';
  RAISE NOTICE '   - Admins can see all group members';
  RAISE NOTICE '';
  RAISE NOTICE 'PROFILES RLS FIXED:';
  RAISE NOTICE '   - Users can now view profiles of friend request senders/receivers';
  RAISE NOTICE '   - Users can view profiles of their friends';
  RAISE NOTICE '   - Users can view profiles of group members in shared groups';
  RAISE NOTICE '   - Users can view profiles of DM conversation partners';
  RAISE NOTICE '   - Users can view profiles referenced in notifications';
  RAISE NOTICE '   - Fixes "sender: null" issue in friend requests and DMs';
  RAISE NOTICE '';
  RAISE NOTICE 'Client Usage Example:';
  RAISE NOTICE '   // Subscribe to friend updates';
  RAISE NOTICE '   supabase.channel("friends_updates")';
  RAISE NOTICE '     .on("postgres_changes", {';
  RAISE NOTICE '       event: "*", schema: "public",';
  RAISE NOTICE '       table: "friend_requests",';
  RAISE NOTICE '       filter: "receiver_id=eq.{userId}"';
  RAISE NOTICE '     }, handleUpdate)';
  RAISE NOTICE '     .subscribe()';
  RAISE NOTICE '';
END;
$$;

-- =====================================================
-- VERIFICATION QUERIES (Optional - Run Manually)
-- =====================================================

-- Verify realtime publication
-- SELECT schemaname, tablename, pubname
-- FROM pg_publication_tables 
-- WHERE pubname = 'supabase_realtime'
--   AND tablename IN ('friend_requests', 'friendships')
-- ORDER BY tablename;

-- Verify group_members policy
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
-- FROM pg_policies
-- WHERE schemaname = 'public' AND tablename = 'group_members';
