-- Quick Fix: Enable RLS on host_requests table
-- Run this if you get "permission denied for table host_requests" error
-- This can be run multiple times safely (idempotent)

-- Enable RLS on host_requests table
ALTER TABLE host_requests ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any (safe to run even if they don't exist)
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

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION get_pending_host_requests_count() TO authenticated;
GRANT EXECUTE ON FUNCTION can_user_create_event_type(UUID, event_type) TO authenticated;
GRANT EXECUTE ON FUNCTION approve_host_request(UUID, UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION reject_host_request(UUID, UUID, TEXT, TEXT) TO authenticated;

-- Verify policies are enabled
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE tablename = 'host_requests'
ORDER BY policyname;
