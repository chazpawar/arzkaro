-- =====================================================
-- MIGRATION 003: Row Level Security Policies (v2.1)
-- =====================================================
-- This migration creates all RLS policies with performance optimizations applied.
--
-- Performance optimizations (from migration 005):
--   - All auth.uid() calls wrapped with (SELECT auth.uid()) for better query planning
--   - Uses is_admin() and is_host_or_admin() helper functions to avoid recursion
--   - Merged duplicate permissive policies to avoid multiple_permissive_policies warning
--
-- This consolidates:
--   - 001_initial_schema.sql (base policies)
--   - 002_system_enhancements.sql (fixes for event groups and tickets)
--   - 003_host_system_with_rls.sql (host request policies)
--   - 005_performance_optimizations.sql (final optimized versions)
--
-- Run this AFTER 002_core_functions.sql (requires is_admin and is_host_or_admin functions)
-- =====================================================

-- =====================================================
-- PROFILES TABLE POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- Allow viewing public profiles, own profile, or if admin
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (
    is_public = TRUE 
    OR (SELECT auth.uid()) = id
    OR is_admin()
  );

-- Allow users to create their own profile
CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  WITH CHECK ((SELECT auth.uid()) = id);

-- Allow users to update own profile, admins can update any profile
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (
    (SELECT auth.uid()) = id
    OR is_admin()
  );

COMMENT ON POLICY "Users can update own profile" ON profiles IS 
  'Allows users to update their own profile, and admins to update any profile';

-- =====================================================
-- HOST_REQUESTS TABLE POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Users can view their own host requests" ON host_requests;
DROP POLICY IF EXISTS "Users can view own requests" ON host_requests;
DROP POLICY IF EXISTS "Admins can view all requests" ON host_requests;
DROP POLICY IF EXISTS "Users and admins can view requests" ON host_requests;
DROP POLICY IF EXISTS "Users can create host requests" ON host_requests;
DROP POLICY IF EXISTS "Users can create requests" ON host_requests;
DROP POLICY IF EXISTS "Admins can update requests" ON host_requests;

-- MERGED: Users can view own requests + Admins can view all requests
CREATE POLICY "Users and admins can view requests"
  ON host_requests FOR SELECT TO authenticated
  USING (
    (SELECT auth.uid()) = user_id 
    OR is_admin()
  );

-- Allow users to create their own host requests
CREATE POLICY "Users can create requests"
  ON host_requests FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- Allow admins to update requests (approval/rejection)
CREATE POLICY "Admins can update requests"
  ON host_requests FOR UPDATE TO authenticated
  USING (is_admin());

-- =====================================================
-- EVENTS TABLE POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Published events are viewable by everyone" ON events;
DROP POLICY IF EXISTS "Hosts can create events" ON events;
DROP POLICY IF EXISTS "Hosts can update their own events" ON events;
DROP POLICY IF EXISTS "Hosts can delete their own events" ON events;

-- Allow viewing published events, own events, or if admin
CREATE POLICY "Published events are viewable by everyone"
  ON events FOR SELECT
  USING (
    is_published = TRUE 
    OR host_id = (SELECT auth.uid()) 
    OR is_admin()
  );

-- Allow hosts and admins to create events (trigger enforces host type permissions)
CREATE POLICY "Hosts can create events"
  ON events FOR INSERT
  WITH CHECK (is_host_or_admin());

-- Allow hosts to update own events, admins can update any event
CREATE POLICY "Hosts can update their own events"
  ON events FOR UPDATE
  USING (
    host_id = (SELECT auth.uid()) 
    OR is_admin()
  );

-- Allow hosts to delete own events, admins can delete any event
CREATE POLICY "Hosts can delete their own events"
  ON events FOR DELETE
  USING (
    host_id = (SELECT auth.uid()) 
    OR is_admin()
  );

-- =====================================================
-- TICKET_TYPES TABLE POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Ticket types viewable for published events" ON ticket_types;
DROP POLICY IF EXISTS "Hosts can manage ticket types" ON ticket_types;
DROP POLICY IF EXISTS "Ticket types access" ON ticket_types;

-- Allow viewing ticket types for published events or own events
CREATE POLICY "Ticket types access"
  ON ticket_types FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM events 
      WHERE id = event_id 
        AND (is_published = TRUE OR host_id = (SELECT auth.uid()))
    )
  );

-- Allow hosts to manage ticket types for their own events
CREATE POLICY "Hosts can manage ticket types"
  ON ticket_types FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM events 
      WHERE id = event_id AND host_id = (SELECT auth.uid())
    )
  );

-- =====================================================
-- BOOKINGS TABLE POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Users can view their own bookings" ON bookings;
DROP POLICY IF EXISTS "Users can create bookings" ON bookings;
DROP POLICY IF EXISTS "Users can update their own bookings" ON bookings;

-- Allow users to view own bookings, hosts can view bookings for their events
CREATE POLICY "Users can view their own bookings"
  ON bookings FOR SELECT
  USING (
    user_id = (SELECT auth.uid()) 
    OR EXISTS (
      SELECT 1 FROM events 
      WHERE id = event_id AND host_id = (SELECT auth.uid())
    )
  );

-- Allow users to create bookings
CREATE POLICY "Users can create bookings"
  ON bookings FOR INSERT
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- Allow users to update own bookings (e.g., cancellation)
CREATE POLICY "Users can update their own bookings"
  ON bookings FOR UPDATE
  USING (user_id = (SELECT auth.uid()));

-- =====================================================
-- TICKETS TABLE POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Users can view their own tickets" ON tickets;
DROP POLICY IF EXISTS "System can create tickets" ON tickets;
DROP POLICY IF EXISTS "Hosts can update tickets for their events" ON tickets;

-- Allow users to view own tickets, hosts can view tickets for their events
CREATE POLICY "Users can view their own tickets"
  ON tickets FOR SELECT
  USING (
    user_id = (SELECT auth.uid()) 
    OR EXISTS (
      SELECT 1 FROM events 
      WHERE id = event_id AND host_id = (SELECT auth.uid())
    )
  );

-- Allow system/trigger to create tickets when booking is confirmed
CREATE POLICY "System can create tickets"
  ON tickets FOR INSERT
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- Allow hosts to update tickets for their events (check-in)
CREATE POLICY "Hosts can update tickets for their events"
  ON tickets FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM events 
      WHERE id = event_id AND host_id = (SELECT auth.uid())
    )
  );

-- =====================================================
-- EVENT_GROUPS TABLE POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Group members can view groups" ON event_groups;
DROP POLICY IF EXISTS "Event hosts can create groups" ON event_groups;

-- Allow viewing groups for published events or own events
CREATE POLICY "Group members can view groups"
  ON event_groups FOR SELECT
  USING (
    event_id IN (
      SELECT id FROM events 
      WHERE host_id = (SELECT auth.uid()) OR is_published = true
    )
  );

-- Allow event hosts to create groups, also allow system triggers
CREATE POLICY "Event hosts can create groups"
  ON event_groups FOR INSERT
  WITH CHECK (
    event_id IN (
      SELECT id FROM events WHERE host_id = (SELECT auth.uid())
    )
    OR (SELECT auth.uid()) IS NULL  -- Allow trigger/function to insert
  );

-- =====================================================
-- GROUP_MEMBERS TABLE POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Group members can view members" ON group_members;
DROP POLICY IF EXISTS "Users can join groups (via booking)" ON group_members;

-- Allow viewing members if user is in group or event is published
CREATE POLICY "Group members can view members"
  ON group_members FOR SELECT
  USING (
    user_id = (SELECT auth.uid()) 
    OR EXISTS (
      SELECT 1 FROM event_groups eg 
      INNER JOIN events e ON eg.event_id = e.id 
      WHERE eg.id = group_members.group_id 
        AND (e.host_id = (SELECT auth.uid()) OR e.is_published = true)
    )
  );

-- Allow users to join groups, also allow system triggers
CREATE POLICY "Users can join groups (via booking)"
  ON group_members FOR INSERT
  WITH CHECK (
    (SELECT auth.uid()) = user_id 
    OR (SELECT auth.uid()) IS NULL  -- Allow trigger/function
  );

-- =====================================================
-- MESSAGES TABLE POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Group members can view messages" ON messages;
DROP POLICY IF EXISTS "Group members can send messages" ON messages;
DROP POLICY IF EXISTS "Users can update their own messages" ON messages;

-- Allow viewing messages if user is member of group
CREATE POLICY "Group members can view messages"
  ON messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM group_members 
      WHERE group_id = messages.group_id 
        AND user_id = (SELECT auth.uid())
    )
  );

-- Allow sending messages if user is member of group
CREATE POLICY "Group members can send messages"
  ON messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM group_members 
      WHERE group_id = messages.group_id 
        AND user_id = (SELECT auth.uid())
    ) 
    AND (SELECT auth.uid()) = user_id
  );

-- Allow users to update/delete their own messages
CREATE POLICY "Users can update their own messages"
  ON messages FOR UPDATE
  USING (user_id = (SELECT auth.uid()));

-- =====================================================
-- FRIEND_REQUESTS TABLE POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Users can view their friend requests" ON friend_requests;
DROP POLICY IF EXISTS "Users can send friend requests" ON friend_requests;
DROP POLICY IF EXISTS "Users can update received requests" ON friend_requests;

-- Allow viewing friend requests where user is sender or receiver
CREATE POLICY "Users can view their friend requests"
  ON friend_requests FOR SELECT
  USING (
    sender_id = (SELECT auth.uid()) 
    OR receiver_id = (SELECT auth.uid())
  );

-- Allow users to send friend requests
CREATE POLICY "Users can send friend requests"
  ON friend_requests FOR INSERT
  WITH CHECK ((SELECT auth.uid()) = sender_id);

-- Allow users to update received requests (accept/reject)
CREATE POLICY "Users can update received requests"
  ON friend_requests FOR UPDATE
  USING (receiver_id = (SELECT auth.uid()));

-- =====================================================
-- FRIENDSHIPS TABLE POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Users can view their friendships" ON friendships;
DROP POLICY IF EXISTS "System can create friendships" ON friendships;
DROP POLICY IF EXISTS "Users can delete their friendships" ON friendships;

-- Allow viewing friendships where user is involved
CREATE POLICY "Users can view their friendships"
  ON friendships FOR SELECT
  USING (
    user_id_1 = (SELECT auth.uid()) 
    OR user_id_2 = (SELECT auth.uid())
  );

-- Allow creating friendships where user is involved
CREATE POLICY "System can create friendships"
  ON friendships FOR INSERT
  WITH CHECK (
    user_id_1 = (SELECT auth.uid()) 
    OR user_id_2 = (SELECT auth.uid())
  );

-- Allow deleting friendships where user is involved
CREATE POLICY "Users can delete their friendships"
  ON friendships FOR DELETE
  USING (
    user_id_1 = (SELECT auth.uid()) 
    OR user_id_2 = (SELECT auth.uid())
  );

-- =====================================================
-- DM_CONVERSATIONS TABLE POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Users can view their conversations" ON dm_conversations;
DROP POLICY IF EXISTS "Users can create conversations" ON dm_conversations;

-- Allow viewing conversations where user is participant
CREATE POLICY "Users can view their conversations"
  ON dm_conversations FOR SELECT
  USING (
    user_id_1 = (SELECT auth.uid()) 
    OR user_id_2 = (SELECT auth.uid())
  );

-- Allow creating conversations where user is participant
CREATE POLICY "Users can create conversations"
  ON dm_conversations FOR INSERT
  WITH CHECK (
    user_id_1 = (SELECT auth.uid()) 
    OR user_id_2 = (SELECT auth.uid())
  );

-- =====================================================
-- DM_MESSAGES TABLE POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Users can view their DM messages" ON dm_messages;
DROP POLICY IF EXISTS "Users can send DM messages" ON dm_messages;
DROP POLICY IF EXISTS "Users can update their own DM messages" ON dm_messages;

-- Allow viewing messages in user's conversations
CREATE POLICY "Users can view their DM messages"
  ON dm_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM dm_conversations 
      WHERE id = conversation_id 
        AND (user_id_1 = (SELECT auth.uid()) OR user_id_2 = (SELECT auth.uid()))
    )
  );

-- Allow sending messages in user's conversations
CREATE POLICY "Users can send DM messages"
  ON dm_messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM dm_conversations 
      WHERE id = conversation_id 
        AND (user_id_1 = (SELECT auth.uid()) OR user_id_2 = (SELECT auth.uid()))
    ) 
    AND (SELECT auth.uid()) = sender_id
  );

-- Allow users to update their own DM messages (mark as read, delete)
CREATE POLICY "Users can update their own DM messages"
  ON dm_messages FOR UPDATE
  USING (sender_id = (SELECT auth.uid()));

-- =====================================================
-- Migration Complete!
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Migration 003: RLS Policies created successfully';
  RAISE NOTICE '   - All RLS policies created with performance optimizations';
  RAISE NOTICE '   - auth.uid() wrapped with (SELECT auth.uid()) for better query planning';
  RAISE NOTICE '   - Uses is_admin() and is_host_or_admin() helper functions';
  RAISE NOTICE '   - Merged duplicate permissive policies';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Performance improvements:';
  RAISE NOTICE '   - auth.uid() evaluated once per query instead of per row';
  RAISE NOTICE '   - Reduced policy execution overhead';
  RAISE NOTICE '   - Better query plan initialization';
  RAISE NOTICE '';
  RAISE NOTICE '📌 Next: Run migration 004_host_system.sql (optional - for RPC functions)';
END;
$$;
