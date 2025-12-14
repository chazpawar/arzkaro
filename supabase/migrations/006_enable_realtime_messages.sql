-- =====================================================
-- Enable Realtime for Chat Tables
-- =====================================================

-- Add messages table from public schema to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- Add group_members to track membership changes
ALTER PUBLICATION supabase_realtime ADD TABLE public.group_members;

-- Add event_groups to track group updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.event_groups;

-- Set replica identity to FULL for UPDATE/DELETE events
ALTER TABLE public.messages REPLICA IDENTITY FULL;
ALTER TABLE public.group_members REPLICA IDENTITY FULL;
ALTER TABLE public.event_groups REPLICA IDENTITY FULL;

-- Verify it worked
SELECT 
  schemaname,
  tablename,
  pubname
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime'
ORDER BY tablename;
