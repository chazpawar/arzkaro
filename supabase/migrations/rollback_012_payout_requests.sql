-- =====================================================
-- ROLLBACK SCRIPT: Remove Migration 012 - Payout Requests System
-- =====================================================
-- This script completely removes all objects created by migration 012.
-- Run this in Supabase SQL Editor to clean up the old migration.
-- 
-- After running this, you can run the correct 012_add_payout_requests.sql
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '🔄 Starting rollback of Migration 012: Payout Requests System';
  RAISE NOTICE '';
END;
$$;

-- =====================================================
-- STEP 1: DROP TRIGGERS
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '1️⃣ Dropping triggers...';
END;
$$;

DROP TRIGGER IF EXISTS trigger_validate_payout_request ON payout_requests;
DROP TRIGGER IF EXISTS trigger_update_payout_timestamps ON payout_requests;
DROP TRIGGER IF EXISTS trigger_update_payout_updated_at ON payout_requests;

-- =====================================================
-- STEP 2: DROP RLS POLICIES
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '2️⃣ Dropping RLS policies...';
END;
$$;

DROP POLICY IF EXISTS "Hosts can view their own payout requests" ON payout_requests;
DROP POLICY IF EXISTS "Admins can view all payout requests" ON payout_requests;
DROP POLICY IF EXISTS "Hosts and admins can view payout requests" ON payout_requests;
DROP POLICY IF EXISTS "Hosts can create payout requests" ON payout_requests;
DROP POLICY IF EXISTS "Admins can update payout requests" ON payout_requests;

-- =====================================================
-- STEP 3: DROP INDEXES
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '3️⃣ Dropping indexes...';
END;
$$;

DROP INDEX IF EXISTS idx_payout_requests_host_id;
DROP INDEX IF EXISTS idx_payout_requests_status;
DROP INDEX IF EXISTS idx_payout_requests_created_at;
DROP INDEX IF EXISTS idx_payout_requests_approved_by;

-- =====================================================
-- STEP 4: DROP TABLE
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '4️⃣ Dropping payout_requests table...';
END;
$$;

DROP TABLE IF EXISTS payout_requests CASCADE;

-- =====================================================
-- STEP 5: DROP FUNCTIONS
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '5️⃣ Dropping functions...';
END;
$$;

DROP FUNCTION IF EXISTS get_host_total_earnings(UUID);
DROP FUNCTION IF EXISTS get_host_pending_payouts(UUID);
DROP FUNCTION IF EXISTS get_host_completed_payouts(UUID);
DROP FUNCTION IF EXISTS get_host_available_balance(UUID);
DROP FUNCTION IF EXISTS validate_payout_request();
DROP FUNCTION IF EXISTS update_payout_timestamps();

-- =====================================================
-- STEP 6: DROP ENUM TYPE
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '6️⃣ Dropping enum type...';
END;
$$;

DROP TYPE IF EXISTS payout_request_status CASCADE;

-- =====================================================
-- ROLLBACK COMPLETE!
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '✅ Rollback Complete!';
  RAISE NOTICE '';
  RAISE NOTICE '🗑️  Removed objects:';
  RAISE NOTICE '   - 3 triggers';
  RAISE NOTICE '   - 5 RLS policies';
  RAISE NOTICE '   - 4 indexes';
  RAISE NOTICE '   - payout_requests table';
  RAISE NOTICE '   - 6 functions';
  RAISE NOTICE '   - payout_request_status enum';
  RAISE NOTICE '';
  RAISE NOTICE '📋 Next Steps:';
  RAISE NOTICE '   1. Verify this rollback completed successfully';
  RAISE NOTICE '   2. Run the correct migration: 012_add_payout_requests.sql';
  RAISE NOTICE '   3. Test the payout system with proper balance calculations';
  RAISE NOTICE '';
  RAISE NOTICE '💡 The correct migration includes:';
  RAISE NOTICE '   • get_host_total_earnings() - calculates total earnings';
  RAISE NOTICE '   • get_host_pending_payouts() - pending/approved/processing';
  RAISE NOTICE '   • get_host_completed_payouts() - completed payouts';
  RAISE NOTICE '   • get_host_available_balance() - total - pending - completed';
  RAISE NOTICE '';
END;
$$;
