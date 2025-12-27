-- =====================================================
-- MIGRATION 012: Add Payout Requests System
-- =====================================================
-- This migration adds the payout request system for hosts to withdraw earnings.
-- 
-- Features:
--   - payout_request_status enum for request states
--   - payout_requests table with host earnings tracking
--   - Constraints and validation
--   - Indexes for performance
--   - RLS policies for secure access
--   - Helper functions for payout management
--   - Triggers for automatic updates
--
-- Run this AFTER 011_add_profile_fields.sql
-- =====================================================

-- =====================================================
-- SECTION 1: CREATE ENUM TYPE
-- =====================================================

-- Payout request status enum
DROP TYPE IF EXISTS payout_request_status CASCADE;
CREATE TYPE payout_request_status AS ENUM ('pending', 'approved', 'rejected', 'processing', 'completed');
COMMENT ON TYPE payout_request_status IS 'Status of payout requests: pending, approved, rejected, processing, completed';

-- =====================================================
-- SECTION 2: CREATE TABLE
-- =====================================================

-- Payout requests table
CREATE TABLE IF NOT EXISTS payout_requests (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Host Information
  host_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Amount Details
  requested_amount DECIMAL(10,2) NOT NULL,
  earned_amount DECIMAL(10,2) NOT NULL, -- Total earnings at time of request
  currency TEXT DEFAULT 'INR' NOT NULL,
  
  -- Request Status
  status payout_request_status DEFAULT 'pending' NOT NULL,
  
  -- Notes and Reasons
  request_note TEXT, -- Optional note from host
  admin_note TEXT, -- Optional note from admin
  rejection_reason TEXT, -- Required when status is rejected
  
  -- Admin Review
  approved_by UUID REFERENCES profiles(id), -- Admin who approved/rejected
  approved_at TIMESTAMPTZ, -- When approved/rejected
  
  -- Processing Timestamps
  processing_started_at TIMESTAMPTZ, -- When marked as processing
  completed_at TIMESTAMPTZ, -- When payout completed
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Validation Constraints
  CONSTRAINT valid_requested_amount CHECK (requested_amount > 0),
  CONSTRAINT valid_earned_amount CHECK (earned_amount >= 0),
  CONSTRAINT requested_not_exceeds_earned CHECK (requested_amount <= earned_amount),
  CONSTRAINT rejection_reason_required CHECK (
    (status != 'rejected') OR (rejection_reason IS NOT NULL AND rejection_reason != '')
  ),
  CONSTRAINT approved_by_required_on_action CHECK (
    (status = 'pending') OR (approved_by IS NOT NULL)
  ),
  CONSTRAINT approved_at_required_on_action CHECK (
    (status = 'pending') OR (approved_at IS NOT NULL)
  )
);

COMMENT ON TABLE payout_requests IS 'Host payout withdrawal requests with approval workflow';
COMMENT ON COLUMN payout_requests.host_id IS 'Host requesting the payout';
COMMENT ON COLUMN payout_requests.requested_amount IS 'Amount host wants to withdraw';
COMMENT ON COLUMN payout_requests.earned_amount IS 'Total earnings at time of request (for validation)';
COMMENT ON COLUMN payout_requests.status IS 'Current status of the payout request';
COMMENT ON COLUMN payout_requests.request_note IS 'Optional note from host explaining the request';
COMMENT ON COLUMN payout_requests.admin_note IS 'Optional note from admin for internal tracking';
COMMENT ON COLUMN payout_requests.rejection_reason IS 'Required reason when request is rejected';
COMMENT ON COLUMN payout_requests.approved_by IS 'Admin who approved or rejected the request';
COMMENT ON COLUMN payout_requests.approved_at IS 'Timestamp when request was approved/rejected';
COMMENT ON COLUMN payout_requests.processing_started_at IS 'When payout processing began';
COMMENT ON COLUMN payout_requests.completed_at IS 'When payout was successfully completed';

-- =====================================================
-- SECTION 3: CREATE INDEXES
-- =====================================================

DROP INDEX IF EXISTS idx_payout_requests_host_id;
DROP INDEX IF EXISTS idx_payout_requests_status;
DROP INDEX IF EXISTS idx_payout_requests_created_at;
DROP INDEX IF EXISTS idx_payout_requests_approved_by;

CREATE INDEX idx_payout_requests_host_id ON payout_requests(host_id);
CREATE INDEX idx_payout_requests_status ON payout_requests(status);
CREATE INDEX idx_payout_requests_created_at ON payout_requests(created_at DESC);
CREATE INDEX idx_payout_requests_approved_by ON payout_requests(approved_by);

-- =====================================================
-- SECTION 4: ENABLE ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE payout_requests ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- SECTION 5: CREATE RLS POLICIES
-- =====================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Hosts can view their own payout requests" ON payout_requests;
DROP POLICY IF EXISTS "Admins can view all payout requests" ON payout_requests;
DROP POLICY IF EXISTS "Hosts and admins can view payout requests" ON payout_requests;
DROP POLICY IF EXISTS "Hosts can create payout requests" ON payout_requests;
DROP POLICY IF EXISTS "Admins can update payout requests" ON payout_requests;

-- MERGED: Hosts can view own requests + Admins can view all requests
CREATE POLICY "Hosts and admins can view payout requests"
  ON payout_requests FOR SELECT TO authenticated
  USING (
    (SELECT auth.uid()) = host_id 
    OR is_admin()
  );

-- Allow hosts to create their own payout requests
CREATE POLICY "Hosts can create payout requests"
  ON payout_requests FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = host_id);

-- Allow admins to update payout requests (approve/reject/process/complete)
CREATE POLICY "Admins can update payout requests"
  ON payout_requests FOR UPDATE TO authenticated
  USING (is_admin());

-- =====================================================
-- SECTION 6: CREATE HELPER FUNCTIONS
-- =====================================================

-- -----------------------------------------------------
-- Calculate total earnings for a host from confirmed bookings
-- -----------------------------------------------------
CREATE OR REPLACE FUNCTION get_host_total_earnings(p_host_id UUID)
RETURNS DECIMAL(10,2)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  v_total_earnings DECIMAL(10,2);
BEGIN
  -- Sum up all confirmed booking amounts for host's events
  SELECT COALESCE(SUM(b.total_amount), 0)
  INTO v_total_earnings
  FROM bookings b
  INNER JOIN events e ON b.event_id = e.id
  WHERE e.host_id = p_host_id
    AND b.status = 'confirmed';
    
  RETURN v_total_earnings;
END;
$$;

COMMENT ON FUNCTION get_host_total_earnings IS 
  'Calculate total earnings from confirmed bookings for a host';

-- -----------------------------------------------------
-- Calculate pending payout requests total for a host
-- -----------------------------------------------------
CREATE OR REPLACE FUNCTION get_host_pending_payouts(p_host_id UUID)
RETURNS DECIMAL(10,2)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  v_pending_amount DECIMAL(10,2);
BEGIN
  -- Sum up all pending, approved, and processing payout requests (not completed or rejected)
  SELECT COALESCE(SUM(requested_amount), 0)
  INTO v_pending_amount
  FROM payout_requests
  WHERE host_id = p_host_id
    AND status IN ('pending', 'approved', 'processing');
    
  RETURN v_pending_amount;
END;
$$;

COMMENT ON FUNCTION get_host_pending_payouts IS 
  'Calculate total amount in pending/approved/processing payout requests for a host (excludes completed and rejected)';

-- -----------------------------------------------------
-- Calculate completed payout requests total for a host
-- -----------------------------------------------------
CREATE OR REPLACE FUNCTION get_host_completed_payouts(p_host_id UUID)
RETURNS DECIMAL(10,2)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  v_completed_amount DECIMAL(10,2);
BEGIN
  -- Sum up all completed payout requests
  SELECT COALESCE(SUM(requested_amount), 0)
  INTO v_completed_amount
  FROM payout_requests
  WHERE host_id = p_host_id
    AND status = 'completed';
    
  RETURN v_completed_amount;
END;
$$;

COMMENT ON FUNCTION get_host_completed_payouts IS 
  'Calculate total amount already paid out to host (completed payouts only)';

-- -----------------------------------------------------
-- Calculate available balance for a host
-- Available = Total Earnings - Pending Payouts - Completed Payouts
-- -----------------------------------------------------
CREATE OR REPLACE FUNCTION get_host_available_balance(p_host_id UUID)
RETURNS DECIMAL(10,2)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  v_total_earnings DECIMAL(10,2);
  v_pending_payouts DECIMAL(10,2);
  v_completed_payouts DECIMAL(10,2);
  v_available_balance DECIMAL(10,2);
BEGIN
  -- Get total earnings
  v_total_earnings := get_host_total_earnings(p_host_id);
  
  -- Get pending payouts
  v_pending_payouts := get_host_pending_payouts(p_host_id);
  
  -- Get completed payouts
  v_completed_payouts := get_host_completed_payouts(p_host_id);
  
  -- Calculate available balance
  v_available_balance := v_total_earnings - v_pending_payouts - v_completed_payouts;
  
  RETURN GREATEST(v_available_balance, 0); -- Never return negative
END;
$$;

COMMENT ON FUNCTION get_host_available_balance IS 
  'Calculate available balance = total earnings - pending payouts - completed payouts';

-- -----------------------------------------------------
-- Validate payout request before insert
-- -----------------------------------------------------
CREATE OR REPLACE FUNCTION validate_payout_request()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_available_balance DECIMAL(10,2);
BEGIN
  -- Calculate host's available balance
  v_available_balance := get_host_available_balance(NEW.host_id);
  
  -- Validate requested amount doesn't exceed available balance
  IF NEW.requested_amount > v_available_balance THEN
    RAISE EXCEPTION 'Requested amount (%) exceeds available balance (%)',
      NEW.requested_amount, v_available_balance;
  END IF;
  
  -- Set earned_amount to current total earnings for reference
  NEW.earned_amount := get_host_total_earnings(NEW.host_id);
  
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION validate_payout_request IS 
  'Validates payout request amount against available balance (total - pending - completed) before insert';

-- -----------------------------------------------------
-- Update timestamps on status changes
-- -----------------------------------------------------
CREATE OR REPLACE FUNCTION update_payout_timestamps()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  -- Update updated_at timestamp
  NEW.updated_at := NOW();
  
  -- Set processing_started_at when status changes to processing
  IF NEW.status = 'processing' AND (OLD.status IS NULL OR OLD.status != 'processing') THEN
    NEW.processing_started_at := NOW();
  END IF;
  
  -- Set completed_at when status changes to completed
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    NEW.completed_at := NOW();
  END IF;
  
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION update_payout_timestamps IS 
  'Automatically updates timestamps when payout status changes';

-- =====================================================
-- SECTION 7: CREATE TRIGGERS
-- =====================================================

-- Drop existing triggers first (idempotent)
DROP TRIGGER IF EXISTS trigger_validate_payout_request ON payout_requests;
DROP TRIGGER IF EXISTS trigger_update_payout_timestamps ON payout_requests;
DROP TRIGGER IF EXISTS trigger_update_payout_updated_at ON payout_requests;

-- Trigger: Validate payout request before insert
CREATE TRIGGER trigger_validate_payout_request
  BEFORE INSERT ON payout_requests
  FOR EACH ROW EXECUTE FUNCTION validate_payout_request();

-- Trigger: Update timestamps on status changes
CREATE TRIGGER trigger_update_payout_timestamps
  BEFORE UPDATE ON payout_requests
  FOR EACH ROW EXECUTE FUNCTION update_payout_timestamps();

-- Trigger: Update updated_at timestamp (reuse existing function)
CREATE TRIGGER trigger_update_payout_updated_at
  BEFORE UPDATE ON payout_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- SECTION 8: GRANT PERMISSIONS
-- =====================================================

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON TABLE payout_requests TO authenticated;
GRANT EXECUTE ON FUNCTION get_host_total_earnings(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_host_pending_payouts(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_host_completed_payouts(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_host_available_balance(UUID) TO authenticated;

-- =====================================================
-- Migration Complete!
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '✅ Migration 012: Payout Requests System created successfully';
  RAISE NOTICE '   - payout_request_status enum created';
  RAISE NOTICE '   - payout_requests table created with constraints';
  RAISE NOTICE '   - Indexes created for performance';
  RAISE NOTICE '   - RLS policies created for secure access';
  RAISE NOTICE '   - Helper functions created:';
  RAISE NOTICE '     • get_host_total_earnings(host_id)';
  RAISE NOTICE '     • get_host_pending_payouts(host_id)';
  RAISE NOTICE '     • get_host_completed_payouts(host_id)';
  RAISE NOTICE '     • get_host_available_balance(host_id)';
  RAISE NOTICE '   - Triggers created for validation and timestamps';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Payout Request Workflow:';
  RAISE NOTICE '   1. Host creates request (status: pending)';
  RAISE NOTICE '   2. Admin approves/rejects (status: approved/rejected)';
  RAISE NOTICE '   3. Admin marks as processing (status: processing)';
  RAISE NOTICE '   4. Admin marks as completed (status: completed)';
  RAISE NOTICE '   5. Completed payouts reduce available balance';
  RAISE NOTICE '';
  RAISE NOTICE '💰 Balance Calculation:';
  RAISE NOTICE '   Available Balance = Total Earnings - Pending Payouts - Completed Payouts';
  RAISE NOTICE '   • Total Earnings: Sum of all confirmed bookings';
  RAISE NOTICE '   • Pending Payouts: Sum of pending/approved/processing requests';
  RAISE NOTICE '   • Completed Payouts: Sum of completed requests (already paid)';
  RAISE NOTICE '';
  RAISE NOTICE '🔒 Security:';
  RAISE NOTICE '   - Hosts can only view/create their own requests';
  RAISE NOTICE '   - Admins can view all requests and approve/reject/process';
  RAISE NOTICE '   - Amount validation prevents overdrawing';
  RAISE NOTICE '   - Database constraints ensure data integrity';
  RAISE NOTICE '   - Trigger automatically validates available balance';
  RAISE NOTICE '   - Rejection reason required for rejected requests';
  RAISE NOTICE '';
  RAISE NOTICE '💡 Usage:';
  RAISE NOTICE '   -- Calculate host total earnings';
  RAISE NOTICE '   SELECT get_host_total_earnings(''host-uuid'');';
  RAISE NOTICE '';
  RAISE NOTICE '   -- Calculate pending payouts';
  RAISE NOTICE '   SELECT get_host_pending_payouts(''host-uuid'');';
  RAISE NOTICE '';
  RAISE NOTICE '   -- Calculate completed payouts';
  RAISE NOTICE '   SELECT get_host_completed_payouts(''host-uuid'');';
  RAISE NOTICE '';
  RAISE NOTICE '   -- Calculate available balance';
  RAISE NOTICE '   SELECT get_host_available_balance(''host-uuid'');';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Payout Request Workflow:';
  RAISE NOTICE '   1. Host creates request (status: pending)';
  RAISE NOTICE '   2. Admin approves/rejects (status: approved/rejected)';
  RAISE NOTICE '   3. Admin marks as processing (status: processing)';
  RAISE NOTICE '   4. Admin marks as completed (status: completed)';
  RAISE NOTICE '';
  RAISE NOTICE '🔒 Security:';
  RAISE NOTICE '   - Hosts can only view/create their own requests';
  RAISE NOTICE '   - Admins can view all requests and approve/reject/process';
  RAISE NOTICE '   - Amount validation prevents overdrawing';
  RAISE NOTICE '   - Rejection reason required for rejected requests';
  RAISE NOTICE '';
  RAISE NOTICE '💡 Usage:';
  RAISE NOTICE '   -- Calculate host earnings';
  RAISE NOTICE '   SELECT get_host_total_earnings(''host-uuid'');';
  RAISE NOTICE '';
  RAISE NOTICE '   -- Calculate pending payouts';
  RAISE NOTICE '   SELECT get_host_pending_payouts(''host-uuid'');';
  RAISE NOTICE '';
  RAISE NOTICE '   -- Available balance = earnings - pending';
  RAISE NOTICE '';
END;
$$;
