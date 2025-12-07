-- Migration: Auto-delete expired event group chats
-- When an event ends (end_date passes), delete the associated group chat

-- =====================================================
-- 1. CREATE FUNCTION TO DELETE EXPIRED EVENT GROUPS
-- =====================================================

CREATE OR REPLACE FUNCTION delete_expired_event_groups()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Delete group members for expired events first (foreign key constraint)
  DELETE FROM group_members
  WHERE group_id IN (
    SELECT eg.id
    FROM event_groups eg
    INNER JOIN events e ON eg.event_id = e.id
    WHERE e.end_date < NOW()
  );
  
  -- Delete messages for expired event groups
  DELETE FROM messages
  WHERE group_id IN (
    SELECT eg.id
    FROM event_groups eg
    INNER JOIN events e ON eg.event_id = e.id
    WHERE e.end_date < NOW()
  );
  
  -- Delete the event groups themselves
  WITH deleted AS (
    DELETE FROM event_groups
    WHERE event_id IN (
      SELECT id FROM events WHERE end_date < NOW()
    )
    RETURNING id
  )
  SELECT COUNT(*) INTO deleted_count FROM deleted;
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 2. CREATE SCHEDULED JOB (pg_cron extension required)
-- =====================================================

-- Note: This requires pg_cron extension to be enabled
-- Run this manually in Supabase SQL Editor after enabling pg_cron:
--
-- SELECT cron.schedule(
--   'delete-expired-event-groups',
--   '0 2 * * *', -- Run daily at 2 AM UTC
--   $$SELECT delete_expired_event_groups()$$
-- );

-- =====================================================
-- 3. MANUAL CLEANUP QUERY (for immediate use)
-- =====================================================

-- Run this query manually to clean up existing expired event groups:
-- SELECT delete_expired_event_groups();

-- =====================================================
-- 4. COMMENTS
-- =====================================================

COMMENT ON FUNCTION delete_expired_event_groups() IS 
  'Deletes event groups (and associated messages/members) for events that have ended. Returns count of deleted groups.';

-- =====================================================
-- 5. GRANT PERMISSIONS
-- =====================================================

-- Allow service role to execute this function
GRANT EXECUTE ON FUNCTION delete_expired_event_groups() TO service_role;

-- =====================================================
-- USAGE INSTRUCTIONS
-- =====================================================

-- To enable automatic daily cleanup:
-- 1. Enable pg_cron extension in Supabase Dashboard (Database > Extensions)
-- 2. Run the cron.schedule command from section 2 above
-- 
-- To manually trigger cleanup:
-- SELECT delete_expired_event_groups();
--
-- To check which groups would be deleted:
-- SELECT eg.id, eg.name, e.title, e.end_date
-- FROM event_groups eg
-- INNER JOIN events e ON eg.event_id = e.id
-- WHERE e.end_date < NOW();
