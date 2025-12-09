-- =====================================================
-- MIGRATION 002: System Enhancements & Automation
-- =====================================================
-- This migration combines:
--   - Event groups RLS fixes (from 002_fix_event_groups_rls.sql)
--   - Ticket auto-generation system (from 003_add_ticket_auto_generation.sql)
--   - Admin profile permissions (from 004_fix_admin_profile_update.sql)
--   - Auto-cleanup of expired event groups (from 005_auto_delete_expired_event_groups.sql)
--
-- Run this migration AFTER 001_initial_schema.sql
-- =====================================================

-- =====================================================
-- SECTION 1: FIX EVENT GROUPS RLS POLICIES
-- =====================================================

-- Drop the problematic policy that causes infinite recursion
DROP POLICY IF EXISTS "Group members can view groups" ON event_groups;

-- Create a simpler policy that doesn't cause recursion
-- Allow viewing if user is the event host OR event is published
CREATE POLICY "Group members can view groups"
  ON event_groups FOR SELECT
  USING (
    event_id IN (
      SELECT id FROM events 
      WHERE host_id = auth.uid() OR is_published = true
    )
  );

-- Allow INSERT for the trigger function
DROP POLICY IF EXISTS "Event hosts can create groups" ON event_groups;

CREATE POLICY "Event hosts can create groups"
  ON event_groups FOR INSERT
  WITH CHECK (
    event_id IN (
      SELECT id FROM events WHERE host_id = auth.uid()
    )
    OR auth.uid() IS NULL  -- Allow trigger/function to insert
  );

-- =====================================================
-- SECTION 2: FIX GROUP_MEMBERS RLS POLICY
-- =====================================================

-- Drop and recreate to allow trigger to insert
DROP POLICY IF EXISTS "Users can join groups (via booking)" ON group_members;

CREATE POLICY "Users can join groups (via booking)"
  ON group_members FOR INSERT
  WITH CHECK (
    auth.uid() = user_id OR auth.uid() IS NULL  -- Allow trigger/function
  );

-- =====================================================
-- SECTION 3: TICKET AUTO-GENERATION SYSTEM
-- =====================================================

-- 3.1: Make qr_code optional (not using QR codes initially)
ALTER TABLE tickets ALTER COLUMN qr_code DROP NOT NULL;
ALTER TABLE tickets ALTER COLUMN qr_code DROP DEFAULT;

-- Add default value for existing tickets
UPDATE tickets SET qr_code = 'TKT-' || id::text WHERE qr_code IS NULL;

-- 3.2: Create ticket auto-generation function
CREATE OR REPLACE FUNCTION auto_generate_tickets()
RETURNS TRIGGER AS $$
DECLARE
  ticket_count INTEGER;
  counter INTEGER;
BEGIN
  -- Only generate tickets when booking is confirmed
  IF NEW.status = 'confirmed' AND (OLD IS NULL OR OLD.status != 'confirmed') THEN
    
    -- Generate N tickets where N = booking quantity
    ticket_count := NEW.quantity;
    
    FOR counter IN 1..ticket_count LOOP
      INSERT INTO tickets (
        booking_id,
        user_id,
        event_id,
        ticket_type_id,
        qr_code,
        status
      ) VALUES (
        NEW.id,
        NEW.user_id,
        NEW.event_id,
        NEW.ticket_type_id,
        'TKT-' || gen_random_uuid()::text || '-' || LPAD(counter::text, 3, '0'),
        'valid'
      );
    END LOOP;
    
    -- Update event current_bookings
    UPDATE events 
    SET current_bookings = current_bookings + NEW.quantity
    WHERE id = NEW.event_id;
    
  END IF;
  
  -- Handle booking cancellation
  IF NEW.status = 'cancelled' AND OLD.status != 'cancelled' THEN
    
    -- Mark all tickets as cancelled
    UPDATE tickets
    SET status = 'cancelled'
    WHERE booking_id = NEW.id AND status != 'cancelled';
    
    -- Decrease event current_bookings
    UPDATE events
    SET current_bookings = GREATEST(0, current_bookings - OLD.quantity)
    WHERE id = NEW.event_id;
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3.3: Create trigger for ticket auto-generation
DROP TRIGGER IF EXISTS trigger_auto_generate_tickets ON bookings;

CREATE TRIGGER trigger_auto_generate_tickets
  AFTER INSERT OR UPDATE OF status ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION auto_generate_tickets();

-- 3.4: Update RLS policy for tickets to allow trigger
DROP POLICY IF EXISTS "System can create tickets" ON tickets;

CREATE POLICY "System can create tickets"
  ON tickets FOR INSERT
  WITH CHECK (
    auth.uid() = user_id OR auth.uid() IS NULL  -- Allow trigger/function
  );

-- =====================================================
-- SECTION 4: EVENT GROUP AUTO-GENERATION
-- =====================================================

-- 4.1: Create event group auto-generation function
CREATE OR REPLACE FUNCTION auto_create_event_group()
RETURNS TRIGGER AS $$
DECLARE
  v_group_id UUID;
BEGIN
  -- Only create group when event is published
  IF NEW.is_published = TRUE AND (OLD IS NULL OR OLD.is_published = FALSE) THEN
    
    -- Create event group if it doesn't exist
    INSERT INTO event_groups (event_id, name, description)
    VALUES (
      NEW.id,
      NEW.title || ' - Group Chat',
      'Chat group for ' || NEW.title
    )
    ON CONFLICT DO NOTHING
    RETURNING id INTO v_group_id;
    
    -- If group was just created, add host as member
    IF v_group_id IS NOT NULL THEN
      INSERT INTO group_members (group_id, user_id, role)
      VALUES (v_group_id, NEW.host_id, 'host')
      ON CONFLICT (group_id, user_id) DO NOTHING;
    END IF;
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4.2: Create trigger for event group auto-generation
DROP TRIGGER IF EXISTS trigger_auto_create_event_group ON events;

CREATE TRIGGER trigger_auto_create_event_group
  AFTER INSERT OR UPDATE OF is_published ON events
  FOR EACH ROW
  EXECUTE FUNCTION auto_create_event_group();

-- =====================================================
-- SECTION 5: ADMIN PROFILE UPDATE PERMISSIONS
-- =====================================================

-- 5.1: Allow admins to update any user profile
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (
    auth.uid() = id OR 
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =====================================================
-- SECTION 6: AUTO-DELETE EXPIRED EVENT GROUPS
-- =====================================================

-- 6.1: Create function to delete expired event groups
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

-- 6.2: Grant permissions
GRANT EXECUTE ON FUNCTION delete_expired_event_groups() TO service_role;

-- =====================================================
-- SECTION 7: COMMENTS & DOCUMENTATION
-- =====================================================

COMMENT ON FUNCTION auto_generate_tickets() IS 
  'Automatically generates tickets when a booking is confirmed and handles cancellation';

COMMENT ON FUNCTION auto_create_event_group() IS 
  'Automatically creates an event group when an event is published';

COMMENT ON FUNCTION delete_expired_event_groups() IS 
  'Deletes event groups (and associated messages/members) for events that have ended. Returns count of deleted groups.';

COMMENT ON TRIGGER trigger_auto_generate_tickets ON bookings IS 
  'Triggers ticket generation on booking confirmation';

COMMENT ON TRIGGER trigger_auto_create_event_group ON events IS 
  'Triggers event group creation on event publish';

COMMENT ON POLICY "Users can update own profile" ON profiles IS 
  'Allows users to update their own profile, and admins to update any profile';

-- =====================================================
-- USAGE NOTES
-- =====================================================

-- To enable automatic daily cleanup of expired event groups:
-- 1. Enable pg_cron extension in Supabase Dashboard (Database > Extensions)
-- 2. Run in SQL Editor:
--    SELECT cron.schedule(
--      'delete-expired-event-groups',
--      '0 2 * * *',
--      $$SELECT delete_expired_event_groups()$$
--    );
-- 
-- To manually trigger cleanup:
--    SELECT delete_expired_event_groups();
