-- =============================================
-- Migration: Add Push Notification Support
-- Description: Creates tables and functions for Expo push notifications
-- =============================================

-- Create push_tokens table
CREATE TABLE IF NOT EXISTS push_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  expo_push_token TEXT NOT NULL UNIQUE,
  device_id TEXT,
  device_name TEXT,
  platform TEXT CHECK (platform IN ('ios', 'android', 'web')),
  app_version TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_used_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_push_tokens_user_id ON push_tokens(user_id);
CREATE INDEX idx_push_tokens_token ON push_tokens(expo_push_token);
CREATE INDEX idx_push_tokens_platform ON push_tokens(platform);
CREATE INDEX idx_push_tokens_last_used ON push_tokens(last_used_at DESC);

-- Add trigger to update updated_at timestamp
CREATE TRIGGER update_push_tokens_updated_at
  BEFORE UPDATE ON push_tokens
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE push_tokens ENABLE ROW LEVEL SECURITY;

-- RLS Policies for push_tokens
-- Users can view their own push tokens
CREATE POLICY "Users can view their own push tokens"
  ON push_tokens
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own push tokens
CREATE POLICY "Users can insert their own push tokens"
  ON push_tokens
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own push tokens
CREATE POLICY "Users can update their own push tokens"
  ON push_tokens
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own push tokens
CREATE POLICY "Users can delete their own push tokens"
  ON push_tokens
  FOR DELETE
  USING (auth.uid() = user_id);

-- Admin can view all push tokens
CREATE POLICY "Admins can view all push tokens"
  ON push_tokens
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- =============================================
-- Helper Functions
-- =============================================

-- Function to upsert push token (insert or update if exists)
CREATE OR REPLACE FUNCTION upsert_push_token(
  p_user_id UUID,
  p_expo_push_token TEXT,
  p_device_id TEXT DEFAULT NULL,
  p_device_name TEXT DEFAULT NULL,
  p_platform TEXT DEFAULT NULL,
  p_app_version TEXT DEFAULT NULL
)
RETURNS push_tokens
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_token push_tokens;
BEGIN
  -- Check if token already exists
  SELECT * INTO v_token
  FROM push_tokens
  WHERE expo_push_token = p_expo_push_token;

  IF FOUND THEN
    -- Update existing token
    UPDATE push_tokens
    SET
      user_id = p_user_id,
      device_id = COALESCE(p_device_id, device_id),
      device_name = COALESCE(p_device_name, device_name),
      platform = COALESCE(p_platform, platform),
      app_version = COALESCE(p_app_version, app_version),
      last_used_at = NOW(),
      updated_at = NOW()
    WHERE expo_push_token = p_expo_push_token
    RETURNING * INTO v_token;
  ELSE
    -- Insert new token
    INSERT INTO push_tokens (
      user_id,
      expo_push_token,
      device_id,
      device_name,
      platform,
      app_version
    )
    VALUES (
      p_user_id,
      p_expo_push_token,
      p_device_id,
      p_device_name,
      p_platform,
      p_app_version
    )
    RETURNING * INTO v_token;
  END IF;

  RETURN v_token;
END;
$$;

-- Function to get all push tokens for a user
CREATE OR REPLACE FUNCTION get_user_push_tokens(p_user_id UUID)
RETURNS SETOF push_tokens
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM push_tokens
  WHERE user_id = p_user_id
  AND last_used_at > NOW() - INTERVAL '90 days'; -- Only return active tokens
END;
$$;

-- Function to delete inactive tokens (older than 90 days)
CREATE OR REPLACE FUNCTION cleanup_inactive_push_tokens()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_deleted_count INTEGER;
BEGIN
  DELETE FROM push_tokens
  WHERE last_used_at < NOW() - INTERVAL '90 days';
  
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  RETURN v_deleted_count;
END;
$$;

-- =============================================
-- Create notification_logs table for tracking sent notifications
-- =============================================

CREATE TABLE IF NOT EXISTS notification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  expo_push_token TEXT,
  notification_type TEXT NOT NULL CHECK (notification_type IN ('chat', 'booking', 'promotional', 'event_reminder', 'system')),
  title TEXT,
  body TEXT NOT NULL,
  data JSONB,
  status TEXT NOT NULL CHECK (status IN ('pending', 'sent', 'failed', 'delivered')) DEFAULT 'pending',
  error_message TEXT,
  expo_receipt_id TEXT,
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_notification_logs_user_id ON notification_logs(user_id);
CREATE INDEX idx_notification_logs_type ON notification_logs(notification_type);
CREATE INDEX idx_notification_logs_status ON notification_logs(status);
CREATE INDEX idx_notification_logs_created_at ON notification_logs(created_at DESC);

-- Enable RLS
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can view their own notification logs
CREATE POLICY "Users can view their own notification logs"
  ON notification_logs
  FOR SELECT
  USING (auth.uid() = user_id);

-- Admins can view all notification logs
CREATE POLICY "Admins can view all notification logs"
  ON notification_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- System can insert notification logs (via service role)
CREATE POLICY "Service role can insert notification logs"
  ON notification_logs
  FOR INSERT
  WITH CHECK (true);

-- System can update notification logs (via service role)
CREATE POLICY "Service role can update notification logs"
  ON notification_logs
  FOR UPDATE
  USING (true);

-- =============================================
-- Grant permissions
-- =============================================

GRANT ALL ON push_tokens TO authenticated;
GRANT ALL ON notification_logs TO authenticated;
GRANT EXECUTE ON FUNCTION upsert_push_token TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_push_tokens TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_inactive_push_tokens TO postgres;

-- =============================================
-- Comments for documentation
-- =============================================

COMMENT ON TABLE push_tokens IS 'Stores Expo push notification tokens for each user device';
COMMENT ON TABLE notification_logs IS 'Logs all push notifications sent through the system';
COMMENT ON FUNCTION upsert_push_token IS 'Insert or update a push token for a user';
COMMENT ON FUNCTION get_user_push_tokens IS 'Get all active push tokens for a user';
COMMENT ON FUNCTION cleanup_inactive_push_tokens IS 'Remove push tokens that haven''t been used in 90 days';
