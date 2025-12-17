-- =====================================================
-- ARZKARO DATABASE CLEANUP SCRIPT
-- =====================================================
-- ⚠️  WARNING: This will DELETE ALL DATA and DROP ALL OBJECTS
-- Only run this if you want to completely reset your database
-- 
-- Use Case: When you need to re-run migrations from scratch
-- =====================================================

-- Drop all tables (CASCADE removes dependent objects)
DROP TABLE IF EXISTS dm_messages CASCADE;
DROP TABLE IF EXISTS dm_conversations CASCADE;
DROP TABLE IF EXISTS friendships CASCADE;
DROP TABLE IF EXISTS friend_requests CASCADE;
DROP TABLE IF EXISTS group_members CASCADE;
DROP TABLE IF EXISTS event_groups CASCADE;
DROP TABLE IF EXISTS tickets CASCADE;
DROP TABLE IF EXISTS bookings CASCADE;
DROP TABLE IF EXISTS ticket_types CASCADE;
DROP TABLE IF EXISTS events CASCADE;
DROP TABLE IF EXISTS host_requests CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Drop all enums
DROP TYPE IF EXISTS host_request_status CASCADE;
DROP TYPE IF EXISTS friend_request_status CASCADE;
DROP TYPE IF EXISTS message_type CASCADE;
DROP TYPE IF EXISTS group_member_role CASCADE;
DROP TYPE IF EXISTS ticket_status CASCADE;
DROP TYPE IF EXISTS payment_status CASCADE;
DROP TYPE IF EXISTS booking_status CASCADE;
DROP TYPE IF EXISTS event_type CASCADE;
DROP TYPE IF EXISTS host_type CASCADE;
DROP TYPE IF EXISTS user_role CASCADE;

-- Drop all functions
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS auto_generate_tickets() CASCADE;
DROP FUNCTION IF EXISTS auto_create_event_group() CASCADE;
DROP FUNCTION IF EXISTS delete_expired_event_groups() CASCADE;
DROP FUNCTION IF EXISTS approve_host_request(UUID, UUID, TEXT) CASCADE;
DROP FUNCTION IF EXISTS reject_host_request(UUID, UUID, TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS check_event_creation_permission() CASCADE;
DROP FUNCTION IF EXISTS get_pending_host_requests_count() CASCADE;
DROP FUNCTION IF EXISTS can_user_create_event_type(UUID, event_type) CASCADE;
DROP FUNCTION IF EXISTS update_host_request_updated_at() CASCADE;
DROP FUNCTION IF EXISTS is_admin() CASCADE;
DROP FUNCTION IF EXISTS is_host_or_admin() CASCADE;
DROP FUNCTION IF EXISTS get_unread_count(UUID, UUID) CASCADE;
DROP FUNCTION IF EXISTS mark_group_as_read(UUID, UUID) CASCADE;
DROP FUNCTION IF EXISTS update_last_read_on_join() CASCADE;

-- Remove tables from realtime publication
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime DROP TABLE public.messages;
  END IF;
  
  IF EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'group_members'
  ) THEN
    ALTER PUBLICATION supabase_realtime DROP TABLE public.group_members;
  END IF;
  
  IF EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'event_groups'
  ) THEN
    ALTER PUBLICATION supabase_realtime DROP TABLE public.event_groups;
  END IF;
END
$$;

-- Verification: Check everything is cleaned
SELECT 
  'Tables' as object_type, 
  COUNT(*)::text as remaining_count
FROM information_schema.tables 
WHERE table_schema = 'public'
UNION ALL
SELECT 
  'Enums', 
  COUNT(*)::text
FROM pg_type 
WHERE typtype = 'e'
UNION ALL
SELECT 
  'Functions', 
  COUNT(*)::text
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_type = 'FUNCTION';

-- Expected result: All counts should be 0
-- If not, check which objects remain:

-- Uncomment to see remaining tables:
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';

-- Uncomment to see remaining enums:
-- SELECT typname FROM pg_type WHERE typtype = 'e';

-- Uncomment to see remaining functions:
-- SELECT routine_name FROM information_schema.routines WHERE routine_schema = 'public';

-- =====================================================
-- CLEANUP COMPLETE
-- =====================================================
-- Next steps:
-- Run migrations in order:
--   1. 001_schema_and_types.sql
--   2. 002_core_functions.sql
--   3. 003_rls_policies.sql
--   4. 004_realtime_and_features.sql
--
-- OR use Supabase CLI:
--   supabase db reset
-- =====================================================
