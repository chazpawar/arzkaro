-- Migration: Host System, Ticket Automation, and Cleanup Functions
-- This migration adds:
-- 1. Multi-tier host system with complete KYC
-- 2. Ticket auto-generation on booking confirmation
-- 3. Event group auto-creation on event publish
-- 4. Expired event group cleanup function

-- =====================================================
-- PART 1: MULTI-TIER HOST SYSTEM
-- =====================================================

-- 1.1 CREATE HOST_TYPE ENUM
DROP TYPE IF EXISTS host_type CASCADE;
CREATE TYPE host_type AS ENUM ('full', 'activity');

COMMENT ON TYPE host_type IS 
  'Host access levels: full (can create events/trips/activities), activity (activities only)';

-- 1.2 UPDATE PROFILES TABLE - ADD HOST_TYPE COLUMN
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS host_type host_type DEFAULT NULL;

COMMENT ON COLUMN profiles.host_type IS 
  'Type of host access: full or activity. NULL for regular users.';

-- Update existing hosts to 'full' type by default
UPDATE profiles
SET host_type = 'full'
WHERE role = 'host' AND host_type IS NULL;

-- 1.3 DROP OLD HOST_REQUESTS TABLE AND RECREATE WITH FULL KYC
DROP TABLE IF EXISTS host_requests CASCADE;

CREATE TABLE host_requests (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  requested_host_type host_type NOT NULL,
  
  -- Personal/Business Information
  organizer_name TEXT NOT NULL,
  contact_number TEXT NOT NULL,
  email TEXT NOT NULL,
  
  -- Address Details
  street_address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  pin_code TEXT NOT NULL,
  
  -- KYC Documents
  pan_number TEXT NOT NULL,
  gstin TEXT,
  
  -- Bank Account Details
  account_holder_name TEXT NOT NULL,
  beneficiary_name TEXT NOT NULL,
  account_number TEXT NOT NULL,
  ifsc_code TEXT NOT NULL,
  
  -- Document Upload Links
  pan_card_photo_url TEXT NOT NULL,
  gst_certificate_url TEXT,
  
  -- Admin Review Fields
  status host_request_status DEFAULT 'pending' NOT NULL,
  reviewed_by UUID REFERENCES profiles(id),
  reviewed_at TIMESTAMPTZ,
  admin_notes TEXT,
  rejection_reason TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Validation Constraints
  CONSTRAINT valid_phone CHECK (contact_number ~ '^\+?[0-9]{10,15}$'),
  CONSTRAINT valid_pan CHECK (pan_number ~ '^[A-Z]{5}[0-9]{4}[A-Z]{1}$'),
  CONSTRAINT valid_pin_code CHECK (pin_code ~ '^[0-9]{6}$'),
  CONSTRAINT valid_ifsc CHECK (ifsc_code ~ '^[A-Z]{4}0[A-Z0-9]{6}$'),
  CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Create indexes for performance
CREATE INDEX idx_host_requests_user_id ON host_requests(user_id);
CREATE INDEX idx_host_requests_status ON host_requests(status);
CREATE INDEX idx_host_requests_type ON host_requests(requested_host_type);
CREATE INDEX idx_host_requests_created_at ON host_requests(created_at DESC);

COMMENT ON TABLE host_requests IS 
  'Stores host access requests with complete KYC information';

-- 1.4 ENABLE RLS ON HOST_REQUESTS
ALTER TABLE host_requests ENABLE ROW LEVEL SECURITY;

-- Policy 1: Users can view their own requests
CREATE POLICY "Users can view own requests"
  ON host_requests FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy 2: Users can insert their own requests
CREATE POLICY "Users can create requests"
  ON host_requests FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy 3: Admins can view all requests
CREATE POLICY "Admins can view all requests"
  ON host_requests FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Policy 4: Admins can update requests
CREATE POLICY "Admins can update requests"
  ON host_requests FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Grant necessary table permissions
GRANT SELECT, INSERT ON host_requests TO authenticated;
GRANT UPDATE ON host_requests TO authenticated;

-- 1.5 UPDATE PROFILES POLICY FOR ADMIN UPDATES
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (
    auth.uid() = id OR 
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 1.6 CREATE FUNCTION: APPROVE HOST REQUEST
CREATE OR REPLACE FUNCTION approve_host_request(
  p_request_id UUID,
  p_admin_id UUID,
  p_admin_notes TEXT DEFAULT NULL
)
RETURNS TABLE(success BOOLEAN, message TEXT) AS $$
DECLARE
  v_user_id UUID;
  v_host_type host_type;
  v_status host_request_status;
BEGIN
  SELECT user_id, requested_host_type, status
  INTO v_user_id, v_host_type, v_status
  FROM host_requests
  WHERE id = p_request_id;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, 'Host request not found'::TEXT;
    RETURN;
  END IF;
  
  IF v_status != 'pending' THEN
    RETURN QUERY SELECT FALSE, 'Host request already processed'::TEXT;
    RETURN;
  END IF;
  
  UPDATE host_requests
  SET 
    status = 'approved',
    reviewed_by = p_admin_id,
    reviewed_at = NOW(),
    admin_notes = p_admin_notes,
    updated_at = NOW()
  WHERE id = p_request_id;
  
  UPDATE profiles
  SET 
    role = 'host',
    host_type = v_host_type,
    is_host_approved = TRUE,
    host_approved_at = NOW(),
    updated_at = NOW()
  WHERE id = v_user_id;
  
  RETURN QUERY SELECT TRUE, 'Host request approved successfully'::TEXT;
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN QUERY SELECT FALSE, ('Error: ' || SQLERRM)::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION approve_host_request IS 
  'Atomically approves a host request and updates user profile with host access';

-- 1.7 CREATE FUNCTION: REJECT HOST REQUEST
CREATE OR REPLACE FUNCTION reject_host_request(
  p_request_id UUID,
  p_admin_id UUID,
  p_rejection_reason TEXT,
  p_admin_notes TEXT DEFAULT NULL
)
RETURNS TABLE(success BOOLEAN, message TEXT) AS $$
DECLARE
  v_status host_request_status;
BEGIN
  SELECT status INTO v_status
  FROM host_requests
  WHERE id = p_request_id;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, 'Host request not found'::TEXT;
    RETURN;
  END IF;
  
  IF v_status != 'pending' THEN
    RETURN QUERY SELECT FALSE, 'Host request already processed'::TEXT;
    RETURN;
  END IF;
  
  UPDATE host_requests
  SET 
    status = 'rejected',
    reviewed_by = p_admin_id,
    reviewed_at = NOW(),
    rejection_reason = p_rejection_reason,
    admin_notes = p_admin_notes,
    updated_at = NOW()
  WHERE id = p_request_id;
  
  RETURN QUERY SELECT TRUE, 'Host request rejected successfully'::TEXT;
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN QUERY SELECT FALSE, ('Error: ' || SQLERRM)::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION reject_host_request IS 
  'Rejects a host request with a specified reason';

-- 1.8 CREATE FUNCTION: CHECK EVENT CREATION PERMISSION
CREATE OR REPLACE FUNCTION check_event_creation_permission()
RETURNS TRIGGER AS $$
DECLARE
  v_role user_role;
  v_host_type host_type;
  v_is_approved BOOLEAN;
BEGIN
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
  
  RAISE EXCEPTION 'Insufficient permissions to create this event type';
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION check_event_creation_permission IS 
  'Validates event creation permissions based on user role and host type';

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS enforce_event_creation_permission ON events;

-- Create trigger on events table
CREATE TRIGGER enforce_event_creation_permission
  BEFORE INSERT ON events
  FOR EACH ROW
  EXECUTE FUNCTION check_event_creation_permission();

-- 1.9 CREATE HELPER FUNCTIONS
CREATE OR REPLACE FUNCTION get_pending_host_requests_count()
RETURNS INTEGER AS $$
BEGIN
  RETURN (SELECT COUNT(*)::INTEGER FROM host_requests WHERE status = 'pending');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION can_user_create_event_type(
  p_user_id UUID,
  p_event_type event_type
)
RETURNS BOOLEAN AS $$
DECLARE
  v_role user_role;
  v_host_type host_type;
  v_is_approved BOOLEAN;
BEGIN
  SELECT role, host_type, is_host_approved
  INTO v_role, v_host_type, v_is_approved
  FROM profiles
  WHERE id = p_user_id;
  
  IF v_role = 'admin' THEN
    RETURN TRUE;
  END IF;
  
  IF v_role = 'user' THEN
    RETURN FALSE;
  END IF;
  
  IF v_role != 'host' OR NOT v_is_approved THEN
    RETURN FALSE;
  END IF;
  
  IF v_host_type = 'full' THEN
    RETURN TRUE;
  END IF;
  
  IF v_host_type = 'activity' AND p_event_type = 'experience' THEN
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 1.10 UPDATED_AT TRIGGER FOR HOST_REQUESTS
CREATE OR REPLACE FUNCTION update_host_request_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_host_request_timestamp ON host_requests;

CREATE TRIGGER update_host_request_timestamp
  BEFORE UPDATE ON host_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_host_request_updated_at();

-- 1.11 GRANT PERMISSIONS
GRANT EXECUTE ON FUNCTION get_pending_host_requests_count() TO authenticated;
GRANT EXECUTE ON FUNCTION can_user_create_event_type(UUID, event_type) TO authenticated;
GRANT EXECUTE ON FUNCTION approve_host_request(UUID, UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION reject_host_request(UUID, UUID, TEXT, TEXT) TO authenticated;

-- =====================================================
-- PART 2: TICKET AUTO-GENERATION
-- =====================================================

-- 2.1 MAKE QR_CODE OPTIONAL IN TICKETS TABLE
ALTER TABLE tickets ALTER COLUMN qr_code DROP NOT NULL;
ALTER TABLE tickets ALTER COLUMN qr_code DROP DEFAULT;

-- Add default value for existing tickets
UPDATE tickets SET qr_code = 'TKT-' || id::text WHERE qr_code IS NULL;

-- 2.2 UPDATE RLS POLICIES FOR TICKET AUTO-GENERATION

-- Update event_groups policies to allow trigger insertion
DROP POLICY IF EXISTS "Event hosts can create groups" ON event_groups;

CREATE POLICY "Event hosts can create groups"
  ON event_groups FOR INSERT
  WITH CHECK (
    event_id IN (
      SELECT id FROM events WHERE host_id = auth.uid()
    )
    OR auth.uid() IS NULL  -- Allow trigger/function to insert
  );

-- Update group_members policy to allow trigger insertion
DROP POLICY IF EXISTS "Users can join groups (via booking)" ON group_members;

CREATE POLICY "Users can join groups (via booking)"
  ON group_members FOR INSERT
  WITH CHECK (
    auth.uid() = user_id OR auth.uid() IS NULL  -- Allow trigger/function
  );

-- Update tickets policy to allow trigger insertion
DROP POLICY IF EXISTS "System can create tickets" ON tickets;

CREATE POLICY "System can create tickets"
  ON tickets FOR INSERT
  WITH CHECK (
    auth.uid() = user_id OR auth.uid() IS NULL  -- Allow trigger/function
  );

-- 2.3 CREATE TICKET AUTO-GENERATION FUNCTION
CREATE OR REPLACE FUNCTION auto_generate_tickets()
RETURNS TRIGGER AS $$
DECLARE
  ticket_count INTEGER;
  counter INTEGER;
BEGIN
  -- Only generate tickets when booking is confirmed
  IF NEW.status = 'confirmed' AND (OLD IS NULL OR OLD.status != 'confirmed') THEN
    
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
    
    UPDATE tickets
    SET status = 'cancelled'
    WHERE booking_id = NEW.id AND status != 'cancelled';
    
    UPDATE events
    SET current_bookings = GREATEST(0, current_bookings - OLD.quantity)
    WHERE id = NEW.event_id;
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION auto_generate_tickets() IS 
  'Automatically generates tickets when a booking is confirmed and handles cancellation';

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_auto_generate_tickets ON bookings;

CREATE TRIGGER trigger_auto_generate_tickets
  AFTER INSERT OR UPDATE OF status ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION auto_generate_tickets();

-- 2.4 CREATE EVENT GROUP AUTO-GENERATION FUNCTION
CREATE OR REPLACE FUNCTION auto_create_event_group()
RETURNS TRIGGER AS $$
DECLARE
  v_group_id UUID;
BEGIN
  -- Only create group when event is published
  IF NEW.is_published = TRUE AND (OLD IS NULL OR OLD.is_published = FALSE) THEN
    
    INSERT INTO event_groups (event_id, name, description)
    VALUES (
      NEW.id,
      NEW.title || ' - Group Chat',
      'Chat group for ' || NEW.title
    )
    ON CONFLICT DO NOTHING
    RETURNING id INTO v_group_id;
    
    IF v_group_id IS NOT NULL THEN
      INSERT INTO group_members (group_id, user_id, role)
      VALUES (v_group_id, NEW.host_id, 'host')
      ON CONFLICT (group_id, user_id) DO NOTHING;
    END IF;
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION auto_create_event_group() IS 
  'Automatically creates an event group when an event is published';

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_auto_create_event_group ON events;

CREATE TRIGGER trigger_auto_create_event_group
  AFTER INSERT OR UPDATE OF is_published ON events
  FOR EACH ROW
  EXECUTE FUNCTION auto_create_event_group();

-- =====================================================
-- PART 3: CLEANUP FUNCTIONS
-- =====================================================

-- 3.1 CREATE FUNCTION TO DELETE EXPIRED EVENT GROUPS
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

COMMENT ON FUNCTION delete_expired_event_groups() IS 
  'Deletes event groups (and associated messages/members) for events that have ended. Returns count of deleted groups.';

-- Grant permissions
GRANT EXECUTE ON FUNCTION delete_expired_event_groups() TO service_role;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

COMMENT ON SCHEMA public IS 
  'Migration 002: Host system with KYC, ticket auto-generation, event group automation, and cleanup functions';
