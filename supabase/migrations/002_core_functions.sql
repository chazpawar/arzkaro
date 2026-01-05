-- =====================================================
-- MIGRATION 002: Core Functions and Triggers (v2.1)
-- =====================================================
-- This migration creates all database functions and triggers with security fixes applied.
--
-- ALL functions use SET search_path = public for security (prevents search path attacks)
-- ALL functions use SECURITY DEFINER where needed for privilege escalation
--
-- This consolidates:
--   - 001_initial_schema.sql (update_updated_at, handle_new_user)
--   - 002_system_enhancements.sql (auto-generation functions)
--   - 003_host_system_with_rls.sql (host management functions)
--   - 004_security_fixes.sql (SET search_path = public on all functions)
--   - 006_enable_realtime_messages.sql (unread tracking functions)
--
-- Run this AFTER 001_schema_and_types.sql
-- =====================================================

-- =====================================================
-- SECTION 1: UTILITY FUNCTIONS
-- =====================================================

-- -----------------------------------------------------
-- Update updated_at timestamp (from migration 001)
-- -----------------------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION update_updated_at_column IS 
  'Auto-updates updated_at column to current timestamp on row update';

-- -----------------------------------------------------
-- Handle new user registration (from migration 001)
-- -----------------------------------------------------
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION handle_new_user IS 
  'Automatically creates profile when new user signs up via auth.users';

-- -----------------------------------------------------
-- Helper: Check if current user is admin (from migration 005)
-- -----------------------------------------------------
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
  );
$$;

COMMENT ON FUNCTION is_admin IS 
  'Checks if current user is admin. Uses SECURITY DEFINER to bypass RLS and avoid recursion.';

-- -----------------------------------------------------
-- Helper: Check if current user is host or admin (from migration 005)
-- -----------------------------------------------------
CREATE OR REPLACE FUNCTION is_host_or_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.profiles 
    WHERE id = auth.uid() 
    AND role IN ('host', 'admin')
  );
$$;

COMMENT ON FUNCTION is_host_or_admin IS 
  'Checks if current user is host or admin for permission checks';

-- =====================================================
-- SECTION 2: TICKET AUTO-GENERATION (from migration 002)
-- =====================================================

-- -----------------------------------------------------
-- Auto-generate tickets when booking is confirmed
-- -----------------------------------------------------
CREATE OR REPLACE FUNCTION auto_generate_tickets()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
  IF NEW.status = 'cancelled' AND (OLD IS NOT NULL AND OLD.status != 'cancelled') THEN
    
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
$$;

COMMENT ON FUNCTION auto_generate_tickets IS 
  'Automatically generates tickets when a booking is confirmed and handles cancellation';

-- =====================================================
-- SECTION 3: EVENT GROUP AUTO-CREATION (from migration 002)
-- =====================================================

-- -----------------------------------------------------
-- Auto-create event group when event is published
-- -----------------------------------------------------
CREATE OR REPLACE FUNCTION auto_create_event_group()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

COMMENT ON FUNCTION auto_create_event_group IS 
  'Automatically creates an event group when an event is published';

-- =====================================================
-- SECTION 4: EXPIRED EVENT GROUP CLEANUP (from migration 002)
-- =====================================================

-- -----------------------------------------------------
-- Delete expired event groups (for cron job)
-- -----------------------------------------------------
CREATE OR REPLACE FUNCTION delete_expired_event_groups()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
  SELECT COUNT(*)::INTEGER INTO deleted_count FROM deleted;
  
  RETURN deleted_count;
END;
$$;

COMMENT ON FUNCTION delete_expired_event_groups IS 
  'Deletes event groups (and associated messages/members) for events that have ended. Returns count of deleted groups.';

-- Grant permission to service_role for cron job
GRANT EXECUTE ON FUNCTION delete_expired_event_groups() TO service_role;

-- =====================================================
-- SECTION 5: HOST REQUEST MANAGEMENT (from migration 003)
-- =====================================================

-- -----------------------------------------------------
-- Approve host request
-- -----------------------------------------------------
CREATE OR REPLACE FUNCTION approve_host_request(
  p_request_id UUID,
  p_admin_id UUID,
  p_admin_notes TEXT DEFAULT NULL
)
RETURNS TABLE(success BOOLEAN, message TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_host_type public.host_type;
  v_status public.host_request_status;
BEGIN
  -- Get request details
  SELECT user_id, requested_host_type, status
  INTO v_user_id, v_host_type, v_status
  FROM host_requests
  WHERE id = p_request_id;
  
  -- Check if request exists
  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, 'Host request not found'::TEXT;
    RETURN;
  END IF;
  
  -- Check if already processed
  IF v_status != 'pending' THEN
    RETURN QUERY SELECT FALSE, 'Host request already processed'::TEXT;
    RETURN;
  END IF;
  
  -- Update request status (mark as approved)
  UPDATE host_requests
  SET 
    status = 'approved',
    reviewed_by = p_admin_id,
    reviewed_at = NOW(),
    admin_notes = p_admin_notes,
    updated_at = NOW()
  WHERE id = p_request_id;
  
  -- Update user profile (grant host access)
  UPDATE profiles
  SET 
    role = 'host',
    host_type = v_host_type,
    is_host_approved = TRUE,
    host_approved_at = NOW(),
    updated_at = NOW()
  WHERE id = v_user_id;
  
  -- Return success
  RETURN QUERY SELECT TRUE, 'Host request approved successfully'::TEXT;
  
EXCEPTION
  WHEN OTHERS THEN
    -- Return error on exception
    RETURN QUERY SELECT FALSE, ('Error: ' || SQLERRM)::TEXT;
END;
$$;

COMMENT ON FUNCTION approve_host_request IS 
  'Atomically approves a host request and updates user profile with host access';

-- -----------------------------------------------------
-- Reject host request
-- -----------------------------------------------------
CREATE OR REPLACE FUNCTION reject_host_request(
  p_request_id UUID,
  p_admin_id UUID,
  p_rejection_reason TEXT,
  p_admin_notes TEXT DEFAULT NULL
)
RETURNS TABLE(success BOOLEAN, message TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_status public.host_request_status;
BEGIN
  -- Get request status
  SELECT status INTO v_status
  FROM host_requests
  WHERE id = p_request_id;
  
  -- Check if request exists
  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, 'Host request not found'::TEXT;
    RETURN;
  END IF;
  
  -- Check if already processed
  IF v_status != 'pending' THEN
    RETURN QUERY SELECT FALSE, 'Host request already processed'::TEXT;
    RETURN;
  END IF;
  
  -- Update request status (mark as rejected)
  UPDATE host_requests
  SET 
    status = 'rejected',
    reviewed_by = p_admin_id,
    reviewed_at = NOW(),
    rejection_reason = p_rejection_reason,
    admin_notes = p_admin_notes,
    updated_at = NOW()
  WHERE id = p_request_id;
  
  -- Return success
  RETURN QUERY SELECT TRUE, 'Host request rejected successfully'::TEXT;
  
EXCEPTION
  WHEN OTHERS THEN
    -- Return error on exception
    RETURN QUERY SELECT FALSE, ('Error: ' || SQLERRM)::TEXT;
END;
$$;

COMMENT ON FUNCTION reject_host_request IS 
  'Rejects a host request with a specified reason';

-- -----------------------------------------------------
-- Check event creation permission (trigger function)
-- -----------------------------------------------------
CREATE OR REPLACE FUNCTION check_event_creation_permission()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role public.user_role;
  v_host_type public.host_type;
  v_is_approved BOOLEAN;
BEGIN
  -- Get user details
  SELECT role, host_type, is_host_approved
  INTO v_role, v_host_type, v_is_approved
  FROM profiles
  WHERE id = NEW.host_id;
  
  -- Admins can create anything
  IF v_role = 'admin' THEN
    RETURN NEW;
  END IF;
  
  -- Must be approved host
  IF v_role != 'host' OR NOT v_is_approved THEN
    RAISE EXCEPTION 'User must be an approved host to create events';
  END IF;
  
  -- Full hosts can create anything
  IF v_host_type = 'full' THEN
    RETURN NEW;
  END IF;
  
  -- Activity hosts can only create activities (experience type)
  IF v_host_type = 'activity' THEN
    IF NEW.type = 'experience' THEN
      RETURN NEW;
    ELSE
      RAISE EXCEPTION 'Activity hosts can only create activities. Apply for Full Host access to create events and trips.';
    END IF;
  END IF;
  
  -- Fallback: deny
  RAISE EXCEPTION 'Insufficient permissions to create this event type';
  
END;
$$;

COMMENT ON FUNCTION check_event_creation_permission IS 
  'Validates event creation permissions based on user role and host type';

-- -----------------------------------------------------
-- Get pending host requests count (for admin dashboard)
-- -----------------------------------------------------
CREATE OR REPLACE FUNCTION get_pending_host_requests_count()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN (SELECT COUNT(*)::INTEGER FROM host_requests WHERE status = 'pending');
END;
$$;

COMMENT ON FUNCTION get_pending_host_requests_count IS 
  'Returns count of pending host requests for admin dashboard';

-- -----------------------------------------------------
-- Check if user can create event type (permission check)
-- -----------------------------------------------------
CREATE OR REPLACE FUNCTION can_user_create_event_type(
  p_user_id UUID,
  p_event_type event_type
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role public.user_role;
  v_host_type public.host_type;
  v_is_approved BOOLEAN;
BEGIN
  -- Get user details
  SELECT role, host_type, is_host_approved
  INTO v_role, v_host_type, v_is_approved
  FROM profiles
  WHERE id = p_user_id;
  
  -- Admins can create anything
  IF v_role = 'admin' THEN
    RETURN TRUE;
  END IF;
  
  -- Regular users cannot create anything
  IF v_role = 'user' THEN
    RETURN FALSE;
  END IF;
  
  -- Hosts must be approved
  IF v_role != 'host' OR NOT v_is_approved THEN
    RETURN FALSE;
  END IF;
  
  -- Full hosts can create anything
  IF v_host_type = 'full' THEN
    RETURN TRUE;
  END IF;
  
  -- Activity hosts can only create activities (experience)
  IF v_host_type = 'activity' AND p_event_type = 'experience' THEN
    RETURN TRUE;
  END IF;
  
  -- Default: cannot create
  RETURN FALSE;
END;
$$;

COMMENT ON FUNCTION can_user_create_event_type IS 
  'Checks if a user has permission to create a specific event type';

-- =====================================================
-- SECTION 6: UNREAD MESSAGE TRACKING (from migration 006)
-- =====================================================

-- -----------------------------------------------------
-- Get unread count for a user in a group
-- -----------------------------------------------------
CREATE OR REPLACE FUNCTION get_unread_count(
  p_group_id UUID,
  p_user_id UUID
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

COMMENT ON FUNCTION get_unread_count IS 
  'Returns count of unread messages in a group for a specific user';

-- -----------------------------------------------------
-- Mark group messages as read
-- -----------------------------------------------------
CREATE OR REPLACE FUNCTION mark_group_as_read(
  p_group_id UUID,
  p_user_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update last_read_at to current time
  UPDATE group_members
  SET last_read_at = NOW()
  WHERE group_id = p_group_id AND user_id = p_user_id;
END;
$$;

COMMENT ON FUNCTION mark_group_as_read IS 
  'Marks all messages in a group as read for the specified user';

-- -----------------------------------------------------
-- Auto-update last_read_at when user joins group
-- -----------------------------------------------------
CREATE OR REPLACE FUNCTION update_last_read_on_join()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  -- Set last_read_at to now when joining
  NEW.last_read_at := NOW();
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION update_last_read_on_join IS 
  'Sets last_read_at to current time when user joins a group';

-- =====================================================
-- SECTION 7: CREATE ALL TRIGGERS
-- =====================================================

-- Drop existing triggers first (idempotent)
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
DROP TRIGGER IF EXISTS update_events_updated_at ON events;
DROP TRIGGER IF EXISTS update_bookings_updated_at ON bookings;
DROP TRIGGER IF EXISTS update_dm_conversations_updated_at ON dm_conversations;
DROP TRIGGER IF EXISTS update_host_request_timestamp ON host_requests;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS trigger_auto_generate_tickets ON bookings;
DROP TRIGGER IF EXISTS trigger_auto_create_event_group ON events;
DROP TRIGGER IF EXISTS enforce_event_creation_permission ON events;
DROP TRIGGER IF EXISTS trg_update_last_read_on_join ON group_members;

-- Trigger: update_updated_at_column (used by multiple tables)
CREATE TRIGGER update_profiles_updated_at 
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_events_updated_at 
  BEFORE UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at 
  BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_dm_conversations_updated_at 
  BEFORE UPDATE ON dm_conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_host_request_timestamp
  BEFORE UPDATE ON host_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger: handle_new_user (on auth.users)
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Trigger: auto_generate_tickets (on bookings)
CREATE TRIGGER trigger_auto_generate_tickets
  AFTER INSERT OR UPDATE OF status ON bookings
  FOR EACH ROW EXECUTE FUNCTION auto_generate_tickets();

-- Trigger: auto_create_event_group (on events)
CREATE TRIGGER trigger_auto_create_event_group
  AFTER INSERT OR UPDATE OF is_published ON events
  FOR EACH ROW EXECUTE FUNCTION auto_create_event_group();

-- Trigger: check_event_creation_permission (on events)
CREATE TRIGGER enforce_event_creation_permission
  BEFORE INSERT ON events
  FOR EACH ROW EXECUTE FUNCTION check_event_creation_permission();

-- Trigger: update_last_read_on_join (on group_members)
CREATE TRIGGER trg_update_last_read_on_join
  BEFORE INSERT ON group_members
  FOR EACH ROW EXECUTE FUNCTION update_last_read_on_join();

-- =====================================================
-- SECTION 8: GRANT FUNCTION PERMISSIONS
-- =====================================================

-- Utility functions
GRANT EXECUTE ON FUNCTION is_admin() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION is_host_or_admin() TO authenticated, anon;

-- Host management functions
GRANT EXECUTE ON FUNCTION approve_host_request(UUID, UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION reject_host_request(UUID, UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_pending_host_requests_count() TO authenticated;
GRANT EXECUTE ON FUNCTION can_user_create_event_type(UUID, event_type) TO authenticated;

-- Unread tracking functions
GRANT EXECUTE ON FUNCTION get_unread_count(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION mark_group_as_read(UUID, UUID) TO authenticated;

-- Cleanup function (service_role only)
GRANT EXECUTE ON FUNCTION delete_expired_event_groups() TO service_role;

-- =====================================================
-- Migration Complete!
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Migration 002: Core Functions and Triggers created successfully';
  RAISE NOTICE '   - All functions created with security fixes (SET search_path = public)';
  RAISE NOTICE '   - All triggers created and linked to functions';
  RAISE NOTICE '   - Helper functions: is_admin(), is_host_or_admin()';
  RAISE NOTICE '   - Ticket auto-generation on booking confirmation';
  RAISE NOTICE '   - Event group auto-creation on event publish';
  RAISE NOTICE '   - Host request approval/rejection functions';
  RAISE NOTICE '   - Unread message tracking functions';
  RAISE NOTICE '';
  RAISE NOTICE '📌 Next: Run migration 003_rls_policies.sql';
END;
$$;
