-- =====================================================
-- MIGRATION 006: Enable Realtime & Unread Tracking
-- =====================================================
-- This migration:
-- 1. Enables realtime for chat tables
-- 2. Adds unread message tracking
-- 3. Creates helper functions for unread counts
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
  END IF;
END
$$;

-- Set replica identity to FULL for UPDATE/DELETE events
ALTER TABLE public.messages REPLICA IDENTITY FULL;
ALTER TABLE public.group_members REPLICA IDENTITY FULL;
ALTER TABLE public.event_groups REPLICA IDENTITY FULL;

-- =====================================================
-- SECTION 2: ADD UNREAD TRACKING
-- =====================================================

-- Add last_read_at column to group_members to track when user last read messages
ALTER TABLE group_members 
ADD COLUMN IF NOT EXISTS last_read_at TIMESTAMPTZ DEFAULT NOW() NOT NULL;

-- Create index for faster unread count queries
CREATE INDEX IF NOT EXISTS idx_group_members_last_read 
ON group_members(group_id, user_id, last_read_at);

CREATE INDEX IF NOT EXISTS idx_messages_created_at 
ON messages(group_id, created_at);

-- =====================================================
-- SECTION 3: UNREAD COUNT FUNCTION
-- =====================================================

-- Function to get unread count for a user in a group
CREATE OR REPLACE FUNCTION get_unread_count(
  p_group_id UUID,
  p_user_id UUID
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_last_read_at TIMESTAMPTZ;
  v_unread_count INTEGER;
BEGIN
  -- Get when user last read messages in this group
  SELECT last_read_at INTO v_last_read_at
  FROM group_members
  WHERE group_id = p_group_id AND user_id = p_user_id;
  
  -- If not a member, return 0
  IF v_last_read_at IS NULL THEN
    RETURN 0;
  END IF;
  
  -- Count messages created after last_read_at
  SELECT COUNT(*)::INTEGER INTO v_unread_count
  FROM messages
  WHERE group_id = p_group_id
    AND created_at > v_last_read_at
    AND is_deleted = FALSE
    AND user_id != p_user_id; -- Don't count own messages
  
  RETURN COALESCE(v_unread_count, 0);
END;
$$;

-- =====================================================
-- SECTION 4: MARK AS READ FUNCTION
-- =====================================================

-- Function to mark messages as read
CREATE OR REPLACE FUNCTION mark_group_as_read(
  p_group_id UUID,
  p_user_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update last_read_at to current time
  UPDATE group_members
  SET last_read_at = NOW()
  WHERE group_id = p_group_id AND user_id = p_user_id;
END;
$$;

-- =====================================================
-- SECTION 5: AUTO-UPDATE LAST_READ_AT ON JOIN
-- =====================================================

-- Trigger to set last_read_at when user joins a group
CREATE OR REPLACE FUNCTION update_last_read_on_join()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Set last_read_at to now when joining
  NEW.last_read_at := NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_update_last_read_on_join ON group_members;
CREATE TRIGGER trg_update_last_read_on_join
  BEFORE INSERT ON group_members
  FOR EACH ROW
  EXECUTE FUNCTION update_last_read_on_join();

-- =====================================================
-- SECTION 6: RLS POLICIES FOR NEW FUNCTIONS
-- =====================================================

-- Allow users to call get_unread_count for their own groups
GRANT EXECUTE ON FUNCTION get_unread_count(UUID, UUID) TO authenticated;

-- Allow users to mark their own groups as read
GRANT EXECUTE ON FUNCTION mark_group_as_read(UUID, UUID) TO authenticated;

-- =====================================================
-- SECTION 7: ENABLE REALTIME FOR READ RECEIPTS
-- =====================================================

-- Note: group_members already added to publication in SECTION 1
-- No need to add again

-- =====================================================
-- VERIFICATION QUERY
-- =====================================================

-- Verify realtime publication
SELECT 
  schemaname,
  tablename,
  pubname
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime'
ORDER BY tablename;
