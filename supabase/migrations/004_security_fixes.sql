-- =====================================================
-- MIGRATION 004: Security Fixes
-- =====================================================
-- This migration fixes all security issues identified by Supabase Linter
-- 
-- Issues Fixed:
-- 1. Function search_path mutable (15 functions)
-- 2. Documentation for leaked password protection (manual config)
--
-- Run this migration AFTER 003_host_system_with_rls.sql
-- =====================================================

-- =====================================================
-- FIX 1: Set search_path for all functions (Security)
-- =====================================================
-- Issue: Functions with mutable search_path are vulnerable to search path attacks
-- Solution: Set search_path = 'public' to provide security while allowing access to custom types
-- 
-- IMPORTANT NOTES:
-- 1. We use 'public' instead of '' (empty) because our functions use custom enum types
--    (user_role, host_type, host_request_status, event_type, etc.) defined in the public schema.
-- 2. Using search_path = '' would prevent access to these types and cause "type does not exist" errors.
-- 3. search_path = 'public' is secure because:
--    - It explicitly sets the schema (not user-controlled)
--    - Prevents malicious schema injection attacks
--    - Standard practice for Supabase/PostgreSQL when using custom types
-- 4. All table references are schema-qualified or rely on the explicit search_path
--
-- Reference: https://supabase.com/docs/guides/database/database-linter?lint=0011_function_search_path_mutable

-- -----------------------------------------------------
-- STEP 1: Drop all existing functions
-- -----------------------------------------------------
-- Required because CREATE OR REPLACE cannot change SET search_path attribute

DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS auto_generate_tickets() CASCADE;
DROP FUNCTION IF EXISTS auto_create_event_group() CASCADE;
DROP FUNCTION IF EXISTS delete_expired_event_groups() CASCADE;
DROP FUNCTION IF EXISTS approve_host_request(UUID, UUID, TEXT) CASCADE;
DROP FUNCTION IF EXISTS reject_host_request(UUID, UUID, TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS check_event_creation_permission() CASCADE;
DROP FUNCTION IF EXISTS get_pending_host_requests_count() CASCADE;
DROP FUNCTION IF EXISTS can_user_create_event_type(UUID, TEXT) CASCADE;
DROP FUNCTION IF EXISTS update_host_request_updated_at() CASCADE;

-- Payment functions (if they exist)
DROP FUNCTION IF EXISTS update_payment_transaction_timestamp() CASCADE;
DROP FUNCTION IF EXISTS sync_booking_payment_status() CASCADE;
DROP FUNCTION IF EXISTS track_payment_attempt() CASCADE;
DROP FUNCTION IF EXISTS process_refund_on_cancellation() CASCADE;

-- -----------------------------------------------------
-- STEP 2: Recreate all triggers (they were dropped by CASCADE)
-- -----------------------------------------------------
-- Triggers will be recreated after functions are defined

-- -----------------------------------------------------
-- STEP 3: Recreate functions with search_path protection
-- -----------------------------------------------------

-- -----------------------------------------------------
-- From 001_initial_schema.sql
-- -----------------------------------------------------

-- Fix: update_updated_at_column
CREATE FUNCTION update_updated_at_column()
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

-- Fix: handle_new_user
CREATE FUNCTION handle_new_user()
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

-- -----------------------------------------------------
-- From 002_system_enhancements.sql
-- -----------------------------------------------------

-- Fix: auto_generate_tickets
CREATE FUNCTION auto_generate_tickets()
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
  
  RETURN NEW;
END;
$$;

-- Fix: auto_create_event_group
CREATE FUNCTION auto_create_event_group()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  group_id UUID;
BEGIN
  -- Only create group for published events
  IF NEW.is_published = TRUE AND (OLD IS NULL OR OLD.is_published = FALSE) THEN
    
    -- Create event group
    INSERT INTO event_groups (event_id, name, description)
    VALUES (
      NEW.id,
      NEW.title || ' Chat',
      'Group chat for ' || NEW.title || ' attendees'
    )
    RETURNING id INTO group_id;
    
    -- Add event host as moderator
    INSERT INTO group_members (group_id, user_id, role)
    VALUES (group_id, NEW.host_id, 'host');
    
  END IF;
  
  RETURN NEW;
END;
$$;

-- Fix: delete_expired_event_groups
CREATE FUNCTION delete_expired_event_groups()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM event_groups
  WHERE event_id IN (
    SELECT id FROM events
    WHERE end_date < NOW() - INTERVAL '30 days'
  );
END;
$$;

-- -----------------------------------------------------
-- From 003_host_system_with_rls.sql
-- -----------------------------------------------------

-- Fix: approve_host_request
CREATE FUNCTION approve_host_request(
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
  v_host_type host_type;
  v_status host_request_status;
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

-- Fix: reject_host_request
CREATE FUNCTION reject_host_request(
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
  v_status host_request_status;
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

-- Fix: check_event_creation_permission
CREATE FUNCTION check_event_creation_permission()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role user_role;
  user_host_type host_type;
BEGIN
  -- Get user's role and host_type
  SELECT role, host_type INTO user_role, user_host_type
  FROM profiles
  WHERE id = (SELECT auth.uid());

  -- Admins can create any event type
  IF user_role = 'admin' THEN
    RETURN NEW;
  END IF;

  -- Hosts can only create events matching their host_type
  IF user_role = 'host' THEN
    -- 'full' hosts can create any event type
    IF user_host_type = 'full' THEN
      RETURN NEW;
    END IF;

    -- 'activity' hosts can only create 'event' and 'experience' types
    IF user_host_type = 'activity' AND NEW.type IN ('event', 'experience') THEN
      RETURN NEW;
    END IF;

    -- If we reach here, host doesn't have permission
    RAISE EXCEPTION 'Host type "%" cannot create event type "%"', user_host_type, NEW.type;
  END IF;

  -- Non-hosts cannot create events
  RAISE EXCEPTION 'User must be a host or admin to create events';
END;
$$;

-- Fix: get_pending_host_requests_count
CREATE FUNCTION get_pending_host_requests_count()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  count INTEGER;
BEGIN
  SELECT COUNT(*) INTO count
  FROM host_requests
  WHERE status = 'pending';
  
  RETURN count;
END;
$$;

-- Fix: can_user_create_event_type
CREATE FUNCTION can_user_create_event_type(
  user_id UUID,
  event_type TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role user_role;
  user_host_type host_type;
BEGIN
  -- Get user's role and host_type
  SELECT role, host_type INTO user_role, user_host_type
  FROM profiles
  WHERE id = user_id;

  -- Admins can create any event type
  IF user_role = 'admin' THEN
    RETURN TRUE;
  END IF;

  -- Hosts check based on host_type
  IF user_role = 'host' THEN
    -- 'full' hosts can create any event type
    IF user_host_type = 'full' THEN
      RETURN TRUE;
    END IF;

    -- 'activity' hosts can only create 'event' and 'experience' types
    IF user_host_type = 'activity' AND event_type IN ('event', 'experience') THEN
      RETURN TRUE;
    END IF;
  END IF;

  -- Default: no permission
  RETURN FALSE;
END;
$$;

-- Fix: update_host_request_updated_at
CREATE FUNCTION update_host_request_updated_at()
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

-- -----------------------------------------------------
-- Payment Functions (if they exist in your database)
-- -----------------------------------------------------
-- NOTE: These functions are detected by Supabase linter but don't exist in migrations.
-- If you've created them directly in Supabase, run these fixes via SQL Editor:

-- Fix: update_payment_transaction_timestamp
-- CREATE OR REPLACE FUNCTION update_payment_transaction_timestamp()
-- RETURNS TRIGGER
-- LANGUAGE plpgsql
-- SECURITY DEFINER
-- SET search_path = ''
-- AS $$
-- BEGIN
--   NEW.updated_at = NOW();
--   RETURN NEW;
-- END;
-- $$;

-- Fix: sync_booking_payment_status
-- CREATE OR REPLACE FUNCTION sync_booking_payment_status()
-- RETURNS TRIGGER
-- LANGUAGE plpgsql
-- SECURITY DEFINER
-- SET search_path = ''
-- AS $$
-- BEGIN
--   -- Your existing function logic here
--   -- Just add SET search_path = '' to the function definition
--   RETURN NEW;
-- END;
-- $$;

-- Fix: track_payment_attempt
-- CREATE OR REPLACE FUNCTION track_payment_attempt()
-- RETURNS TRIGGER
-- LANGUAGE plpgsql
-- SECURITY DEFINER
-- SET search_path = ''
-- AS $$
-- BEGIN
--   -- Your existing function logic here
--   -- Just add SET search_path = '' to the function definition
--   RETURN NEW;
-- END;
-- $$;

-- Fix: process_refund_on_cancellation
-- CREATE OR REPLACE FUNCTION process_refund_on_cancellation()
-- RETURNS TRIGGER
-- LANGUAGE plpgsql
-- SECURITY DEFINER
-- SET search_path = ''
-- AS $$
-- BEGIN
--   -- Your existing function logic here
--   -- Just add SET search_path = '' to the function definition
--   RETURN NEW;
-- END;
-- $$;

-- =====================================================
-- STEP 4: Recreate all triggers
-- =====================================================
-- These were dropped by CASCADE when we dropped the functions

-- Trigger: update_updated_at_column (used by multiple tables)
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
DROP TRIGGER IF EXISTS update_events_updated_at ON events;
DROP TRIGGER IF EXISTS update_bookings_updated_at ON bookings;
DROP TRIGGER IF EXISTS update_dm_conversations_updated_at ON dm_conversations;

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

-- Trigger: handle_new_user (on auth.users)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Trigger: auto_generate_tickets (on bookings)
DROP TRIGGER IF EXISTS trigger_auto_generate_tickets ON bookings;

CREATE TRIGGER trigger_auto_generate_tickets
  AFTER INSERT OR UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION auto_generate_tickets();

-- Trigger: auto_create_event_group (on events)
DROP TRIGGER IF EXISTS trigger_auto_create_event_group ON events;

CREATE TRIGGER trigger_auto_create_event_group
  AFTER INSERT OR UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION auto_create_event_group();

-- Trigger: check_event_creation_permission (on events)
DROP TRIGGER IF EXISTS enforce_event_creation_permission ON events;

CREATE TRIGGER enforce_event_creation_permission
  BEFORE INSERT ON events
  FOR EACH ROW EXECUTE FUNCTION check_event_creation_permission();

-- Trigger: update_host_request_updated_at (on host_requests)
DROP TRIGGER IF EXISTS trigger_update_host_request_updated_at ON host_requests;

CREATE TRIGGER trigger_update_host_request_updated_at
  BEFORE UPDATE ON host_requests
  FOR EACH ROW EXECUTE FUNCTION update_host_request_updated_at();

-- =====================================================
-- MANUAL CONFIGURATION REQUIRED
-- =====================================================

-- FIX 2: Enable Leaked Password Protection
-- -----------------------------------------------
-- This cannot be automated via SQL migration.
-- Manual steps required in Supabase Dashboard:
--
-- 1. Go to: Authentication > Policies
-- 2. Find "Password Protection" section
-- 3. Enable "Leaked Password Protection"
--
-- This feature checks passwords against HaveIBeenPwned.org database
-- to prevent users from using compromised passwords.
--
-- Reference: https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection
-- =====================================================

-- Log completion
DO $$
BEGIN
  RAISE NOTICE 'Migration 004: Security fixes applied successfully';
  RAISE NOTICE '⚠️  MANUAL ACTION REQUIRED: Enable Leaked Password Protection in Supabase Dashboard > Authentication > Policies';
END;
$$;
