-- =============================================
-- Migration: Enable Realtime for Notifications Table
-- Description: Adds notifications table to Supabase realtime publication
-- =============================================

-- Enable realtime for notifications table
DO $$ 
BEGIN
  -- Check if table is already in publication
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'notifications'
  ) THEN
    -- Add notifications table to realtime publication
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications';
    RAISE NOTICE 'Added notifications table to realtime publication';
  ELSE
    RAISE NOTICE 'Notifications table already in realtime publication';
  END IF;
END $$;

-- Verify realtime is enabled
DO $$
DECLARE
  v_enabled BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 
    FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'notifications'
  ) INTO v_enabled;
  
  IF v_enabled THEN
    RAISE NOTICE '✓ Realtime enabled for notifications table';
  ELSE
    RAISE WARNING '✗ Failed to enable realtime for notifications table';
  END IF;
END $$;

COMMENT ON TABLE notifications IS 'In-app notifications for users (realtime enabled)';
