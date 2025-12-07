-- Migration: Multi-Tier Host System with Complete KYC
-- This migration implements a two-tier host system with comprehensive KYC fields
-- Host Types: 'full' (events + trips + activities) and 'activity' (activities only)

-- =====================================================
-- 1. CREATE HOST_TYPE ENUM
-- =====================================================

DROP TYPE IF EXISTS host_type CASCADE;
CREATE TYPE host_type AS ENUM ('full', 'activity');

COMMENT ON TYPE host_type IS 
  'Host access levels: full (can create events/trips/activities), activity (activities only)';

-- =====================================================
-- 2. UPDATE PROFILES TABLE - ADD HOST_TYPE COLUMN
-- =====================================================

-- Add host_type column to profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS host_type host_type DEFAULT NULL;

COMMENT ON COLUMN profiles.host_type IS 
  'Type of host access: full or activity. NULL for regular users.';

-- =====================================================
-- 3. DROP OLD HOST_REQUESTS TABLE
-- =====================================================

-- Drop existing table and recreate with comprehensive KYC fields
DROP TABLE IF EXISTS host_requests CASCADE;

-- =====================================================
-- 4. CREATE NEW HOST_REQUESTS TABLE WITH FULL KYC
-- =====================================================

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

-- Add comments for documentation
COMMENT ON TABLE host_requests IS 
  'Stores host access requests with complete KYC information';

COMMENT ON COLUMN host_requests.requested_host_type IS 
  'Type of host access requested: full (events/trips/activities) or activity (activities only)';

COMMENT ON COLUMN host_requests.organizer_name IS 
  'Name of organizer or company name for businesses';

COMMENT ON COLUMN host_requests.gstin IS 
  'GST Identification Number - optional, required only for businesses with GST';

COMMENT ON COLUMN host_requests.pan_card_photo_url IS 
  'Google Drive or cloud storage link to PAN card photo';

COMMENT ON COLUMN host_requests.gst_certificate_url IS 
  'Google Drive or cloud storage link to GST certificate (optional)';

-- =====================================================
-- 5. CREATE FUNCTION: APPROVE HOST REQUEST
-- =====================================================

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
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION approve_host_request IS 
  'Atomically approves a host request and updates user profile with host access';

-- =====================================================
-- 6. CREATE FUNCTION: REJECT HOST REQUEST
-- =====================================================

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
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION reject_host_request IS 
  'Rejects a host request with a specified reason';

-- =====================================================
-- 7. CREATE TRIGGER: CHECK EVENT CREATION PERMISSION
-- =====================================================

CREATE OR REPLACE FUNCTION check_event_creation_permission()
RETURNS TRIGGER AS $$
DECLARE
  v_role user_role;
  v_host_type host_type;
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

COMMENT ON TRIGGER enforce_event_creation_permission ON events IS 
  'Enforces event creation permissions at database level';

-- =====================================================
-- 8. CREATE RLS POLICIES FOR HOST_REQUESTS
-- =====================================================

-- Enable RLS on host_requests table
ALTER TABLE host_requests ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view own requests" ON host_requests;
DROP POLICY IF EXISTS "Users can create requests" ON host_requests;
DROP POLICY IF EXISTS "Admins can view all requests" ON host_requests;
DROP POLICY IF EXISTS "Admins can update requests" ON host_requests;

-- Policy 1: Users can view their own requests
CREATE POLICY "Users can view own requests"
  ON host_requests FOR SELECT
  USING (auth.uid() = user_id);

-- Policy 2: Users can create their own requests (but only if no pending request exists)
CREATE POLICY "Users can create requests"
  ON host_requests FOR INSERT
  WITH CHECK (
    auth.uid() = user_id 
    AND NOT EXISTS (
      SELECT 1 FROM host_requests 
      WHERE user_id = auth.uid() AND status = 'pending'
    )
  );

-- Policy 3: Admins can view all requests
CREATE POLICY "Admins can view all requests"
  ON host_requests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Policy 4: Admins can update requests (for approval/rejection)
CREATE POLICY "Admins can update requests"
  ON host_requests FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =====================================================
-- 9. CREATE HELPER FUNCTION: GET PENDING HOST REQUESTS COUNT
-- =====================================================

CREATE OR REPLACE FUNCTION get_pending_host_requests_count()
RETURNS INTEGER AS $$
BEGIN
  RETURN (SELECT COUNT(*)::INTEGER FROM host_requests WHERE status = 'pending');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_pending_host_requests_count IS 
  'Returns count of pending host requests for admin dashboard';

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_pending_host_requests_count() TO authenticated;

-- =====================================================
-- 10. CREATE HELPER FUNCTION: CAN USER CREATE EVENT TYPE
-- =====================================================

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
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION can_user_create_event_type IS 
  'Checks if a user has permission to create a specific event type';

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION can_user_create_event_type(UUID, event_type) TO authenticated;

-- =====================================================
-- 11. GRANT PERMISSIONS TO FUNCTIONS
-- =====================================================

-- Grant execute permission on approval/rejection functions to authenticated users
-- (RLS will handle admin-only access)
GRANT EXECUTE ON FUNCTION approve_host_request(UUID, UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION reject_host_request(UUID, UUID, TEXT, TEXT) TO authenticated;

-- =====================================================
-- 12. UPDATE EXISTING DATA (IF ANY)
-- =====================================================

-- Set all existing hosts to 'full' type by default
-- (Admin can manually adjust if needed)
UPDATE profiles
SET host_type = 'full'
WHERE role = 'host' AND host_type IS NULL;

-- =====================================================
-- 13. ADD UPDATED_AT TRIGGER FOR HOST_REQUESTS
-- =====================================================

-- Create trigger to auto-update updated_at timestamp
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

-- =====================================================
-- VERIFICATION QUERIES (RUN THESE TO TEST)
-- =====================================================

-- Check if host_type enum was created
-- SELECT unnest(enum_range(NULL::host_type));

-- Check if profiles has host_type column
-- SELECT column_name, data_type FROM information_schema.columns 
-- WHERE table_name = 'profiles' AND column_name = 'host_type';

-- Check if host_requests table was created
-- SELECT column_name, data_type FROM information_schema.columns 
-- WHERE table_name = 'host_requests' ORDER BY ordinal_position;

-- Check if functions were created
-- SELECT proname FROM pg_proc WHERE proname LIKE '%host%';

-- Check if triggers were created
-- SELECT trigger_name FROM information_schema.triggers WHERE event_object_table = 'events';

-- =====================================================
-- ROLLBACK SCRIPT (IF NEEDED)
-- =====================================================

-- To rollback this migration, run:
/*
DROP TRIGGER IF EXISTS enforce_event_creation_permission ON events;
DROP TRIGGER IF EXISTS update_host_request_timestamp ON host_requests;
DROP FUNCTION IF EXISTS check_event_creation_permission();
DROP FUNCTION IF EXISTS update_host_request_updated_at();
DROP FUNCTION IF EXISTS approve_host_request(UUID, UUID, TEXT);
DROP FUNCTION IF EXISTS reject_host_request(UUID, UUID, TEXT, TEXT);
DROP FUNCTION IF EXISTS get_pending_host_requests_count();
DROP FUNCTION IF EXISTS can_user_create_event_type(UUID, event_type);
DROP TABLE IF EXISTS host_requests CASCADE;
ALTER TABLE profiles DROP COLUMN IF EXISTS host_type;
DROP TYPE IF EXISTS host_type CASCADE;
*/
