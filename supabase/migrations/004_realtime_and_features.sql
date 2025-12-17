-- =====================================================
-- MIGRATION 004: Realtime and Features (v2.1)
-- =====================================================
-- This migration enables realtime subscriptions and additional features:
--   - Realtime for chat tables (messages, group_members, event_groups)
--   - Replica identity for UPDATE/DELETE events
--
-- This consolidates:
--   - 006_enable_realtime_messages.sql (realtime configuration)
--
-- Run this AFTER 003_rls_policies.sql
-- =====================================================

-- =====================================================
-- SECTION 1: ENABLE REALTIME FOR CHAT TABLES
-- =====================================================

-- Add messages table from public schema to realtime publication (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'messages'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.messages';
    RAISE NOTICE '✅ Added messages table to realtime publication';
  ELSE
    RAISE NOTICE 'ℹ️  messages table already in realtime publication';
  END IF;
END
$$;

-- Add group_members to track membership changes (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'group_members'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.group_members';
    RAISE NOTICE '✅ Added group_members table to realtime publication';
  ELSE
    RAISE NOTICE 'ℹ️  group_members table already in realtime publication';
  END IF;
END
$$;

-- Add event_groups to track group updates (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'event_groups'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.event_groups';
    RAISE NOTICE '✅ Added event_groups table to realtime publication';
  ELSE
    RAISE NOTICE 'ℹ️  event_groups table already in realtime publication';
  END IF;
END
$$;

-- =====================================================
-- SECTION 2: SET REPLICA IDENTITY FOR REALTIME
-- =====================================================
-- Set replica identity to FULL for UPDATE/DELETE events
-- This allows Supabase Realtime to send full row data

ALTER TABLE public.messages REPLICA IDENTITY FULL;
ALTER TABLE public.group_members REPLICA IDENTITY FULL;
ALTER TABLE public.event_groups REPLICA IDENTITY FULL;

COMMENT ON TABLE messages IS 'Messages in event group chats (realtime enabled)';
COMMENT ON TABLE group_members IS 'Members of event chat groups (realtime enabled for presence)';
COMMENT ON TABLE event_groups IS 'Chat groups associated with events (realtime enabled)';

-- =====================================================
-- Migration Complete!
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '✅ Migration 004: Realtime and Features configured successfully';
  RAISE NOTICE '   - Realtime enabled for: messages, group_members, event_groups';
  RAISE NOTICE '   - Replica identity set to FULL for UPDATE/DELETE events';
  RAISE NOTICE '';
  RAISE NOTICE '📱 Realtime features enabled:';
  RAISE NOTICE '   - Live message updates in group chats';
  RAISE NOTICE '   - Member join/leave notifications';
  RAISE NOTICE '   - Group metadata updates';
  RAISE NOTICE '';
  RAISE NOTICE '📌 Usage in client:';
  RAISE NOTICE '   const subscription = supabase';
  RAISE NOTICE '     .channel("messages")';
  RAISE NOTICE '     .on("postgres_changes", {';
  RAISE NOTICE '       event: "*",';
  RAISE NOTICE '       schema: "public",';
  RAISE NOTICE '       table: "messages",';
  RAISE NOTICE '       filter: "group_id=eq.{groupId}"';
  RAISE NOTICE '     }, handleNewMessage)';
  RAISE NOTICE '     .subscribe()';
  RAISE NOTICE '';
  RAISE NOTICE '📌 Optional: Set up pg_cron for auto-cleanup of expired event groups:';
  RAISE NOTICE '   SELECT cron.schedule(';
  RAISE NOTICE '     ''delete-expired-event-groups'',';
  RAISE NOTICE '     ''0 2 * * *'',';
  RAISE NOTICE '     ''SELECT delete_expired_event_groups()''';
  RAISE NOTICE '   );';
  RAISE NOTICE '';
  RAISE NOTICE '🎉 All migrations completed! Database is ready to use.';
END;
$$;

-- =====================================================
-- VERIFICATION QUERY
-- =====================================================

-- Verify realtime publication (run manually if needed)
-- SELECT schemaname, tablename, pubname
-- FROM pg_publication_tables 
-- WHERE pubname = 'supabase_realtime'
-- ORDER BY tablename;
