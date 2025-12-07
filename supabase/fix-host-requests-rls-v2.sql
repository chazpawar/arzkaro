-- Fix RLS Policies for host_requests table
-- This ensures users can view their own requests properly

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can view own requests" ON host_requests;
DROP POLICY IF EXISTS "Users can create requests" ON host_requests;
DROP POLICY IF EXISTS "Admins can view all requests" ON host_requests;
DROP POLICY IF EXISTS "Admins can update requests" ON host_requests;

-- Recreate policies with proper permissions

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

-- Verify RLS is enabled
ALTER TABLE host_requests ENABLE ROW LEVEL SECURITY;

-- Grant necessary table permissions to authenticated users
GRANT SELECT, INSERT ON host_requests TO authenticated;
GRANT UPDATE ON host_requests TO authenticated;
