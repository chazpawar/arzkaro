-- Migration: Fix admin profile update permissions
-- This migration allows admins to update user profiles (needed for host approval)

-- =====================================================
-- 1. DROP OLD POLICY
-- =====================================================

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- =====================================================
-- 2. CREATE NEW POLICY WITH ADMIN EXCEPTION
-- =====================================================

-- Allow users to update their own profile OR admins to update any profile
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (
    auth.uid() = id OR 
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =====================================================
-- 3. ALSO FIX HOST_REQUESTS UPDATE POLICY
-- =====================================================

-- Drop old policy if exists
DROP POLICY IF EXISTS "Admins can update host requests" ON host_requests;

-- Create policy allowing admins to update host requests
CREATE POLICY "Admins can update host requests"
  ON host_requests FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =====================================================
-- 4. COMMENTS
-- =====================================================

COMMENT ON POLICY "Users can update own profile" ON profiles IS 
  'Allows users to update their own profile, and admins to update any profile';

COMMENT ON POLICY "Admins can update host requests" ON host_requests IS 
  'Allows admins to approve/reject host requests';
