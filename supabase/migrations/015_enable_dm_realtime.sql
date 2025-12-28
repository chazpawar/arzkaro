-- =====================================================
-- MIGRATION 015: Enable Realtime for DM Tables + Fix UPDATE Policy
-- =====================================================
-- This migration:
--   1. Enables realtime subscriptions for dm_messages and dm_conversations
--   2. Sets replica identity for UPDATE/DELETE events
--   3. Fixes UPDATE policy to allow marking messages as read
-- =====================================================

-- =====================================================
-- SECTION 1: ENABLE REALTIME FOR DM TABLES
-- =====================================================

-- Add dm_messages table to realtime publication (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'dm_messages'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.dm_messages';
    RAISE NOTICE '✅ Added dm_messages table to realtime publication';
  ELSE
    RAISE NOTICE 'ℹ️  dm_messages table already in realtime publication';
  END IF;
END
$$;

-- Add dm_conversations table to realtime publication (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'dm_conversations'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.dm_conversations';
    RAISE NOTICE '✅ Added dm_conversations table to realtime publication';
  ELSE
    RAISE NOTICE 'ℹ️  dm_conversations table already in realtime publication';
  END IF;
END
$$;

-- =====================================================
-- SECTION 2: SET REPLICA IDENTITY FOR REALTIME
-- =====================================================
-- Set replica identity to FULL for UPDATE/DELETE events
-- This allows Supabase Realtime to send full row data

ALTER TABLE public.dm_messages REPLICA IDENTITY FULL;
ALTER TABLE public.dm_conversations REPLICA IDENTITY FULL;

COMMENT ON TABLE dm_messages IS 'Direct messages between users (realtime enabled)';
COMMENT ON TABLE dm_conversations IS 'DM conversations between users (realtime enabled)';

-- =====================================================
-- SECTION 3: FIX DM MESSAGES UPDATE POLICY
-- =====================================================
-- Issue: Original UPDATE policy only allowed users to update their own messages
-- Fix: Allow users to update messages in their conversations (for marking as read)

-- Drop the old restrictive UPDATE policy
DROP POLICY IF EXISTS "Users can update their own DM messages" ON dm_messages;

-- Create a new UPDATE policy that allows:
-- 1. Users can update messages they sent (for editing/deleting)
-- 2. Users can update messages in their conversations (for marking as read)
CREATE POLICY "Users can update messages in their conversations"
  ON dm_messages FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM dm_conversations 
      WHERE id = conversation_id 
        AND (user_id_1 = (SELECT auth.uid()) OR user_id_2 = (SELECT auth.uid()))
    )
  );

-- =====================================================
-- Migration Complete!
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '✅ Migration 015: DM Realtime + UPDATE Policy Fix Applied';
  RAISE NOTICE '';
  RAISE NOTICE '📡 Realtime enabled for:';
  RAISE NOTICE '   - dm_messages (with REPLICA IDENTITY FULL)';
  RAISE NOTICE '   - dm_conversations (with REPLICA IDENTITY FULL)';
  RAISE NOTICE '';
  RAISE NOTICE '🔒 Security policy updated:';
  RAISE NOTICE '   - Users can now mark received messages as read';
  RAISE NOTICE '   - UPDATE events will propagate via realtime';
  RAISE NOTICE '   - Users can only update messages in their conversations';
  RAISE NOTICE '';
  RAISE NOTICE '📱 Realtime features enabled:';
  RAISE NOTICE '   - Live message updates in DMs';
  RAISE NOTICE '   - Read receipt updates (now working!)';
  RAISE NOTICE '   - Conversation updates';
  RAISE NOTICE '';
  RAISE NOTICE '📌 Usage in client:';
  RAISE NOTICE '   const subscription = supabase';
  RAISE NOTICE '     .channel("dm_messages")';
  RAISE NOTICE '     .on("postgres_changes", {';
  RAISE NOTICE '       event: "*",  // INSERT, UPDATE, DELETE';
  RAISE NOTICE '       schema: "public",';
  RAISE NOTICE '       table: "dm_messages"';
  RAISE NOTICE '     }, handleMessage)';
  RAISE NOTICE '     .subscribe()';
  RAISE NOTICE '';
END;
$$;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Verify realtime publication (run manually if needed)
-- SELECT schemaname, tablename, pubname
-- FROM pg_publication_tables 
-- WHERE pubname = 'supabase_realtime'
-- AND tablename IN ('dm_messages', 'dm_conversations')
-- ORDER BY tablename;

-- Verify replica identity (run manually if needed)
-- SELECT 
--   n.nspname as schemaname,
--   c.relname as tablename,
--   CASE c.relreplident
--     WHEN 'd' THEN 'DEFAULT'
--     WHEN 'f' THEN 'FULL'
--   END as replica_identity
-- FROM pg_catalog.pg_class c
-- JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
-- WHERE n.nspname = 'public'
--   AND c.relname IN ('dm_messages', 'dm_conversations');

-- Verify UPDATE policy (run manually if needed)
-- SELECT policyname, cmd, qual
-- FROM pg_policies 
-- WHERE tablename = 'dm_messages' AND cmd = 'UPDATE';
