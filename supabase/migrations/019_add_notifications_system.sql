-- =============================================
-- Migration: Add In-App Notifications System
-- Description: Creates notifications table for friend requests, reminders, and confirmations
-- =============================================

-- =============================================
-- Create notification_type enum
-- =============================================

DO $$ BEGIN
  CREATE TYPE notification_type AS ENUM (
    'friend_request_accepted',
    'event_reminder',
    'booking_confirmed',
    'event_cancelled',
    'event_updated',
    'new_message',
    'payout_completed'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- =============================================
-- Create notifications table
-- =============================================

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type notification_type NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT FALSE,
  
  -- Related entity references (nullable, depends on notification type)
  related_user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,  -- For friend requests
  related_event_id UUID REFERENCES events(id) ON DELETE CASCADE,   -- For event-related notifications
  related_booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE, -- For booking-related notifications
  
  -- Additional data as JSON for flexibility
  data JSONB DEFAULT '{}'::jsonb,
  
  -- Action URL for navigation
  action_url TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  read_at TIMESTAMPTZ
);

-- =============================================
-- Create indexes for performance
-- =============================================

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, read) WHERE read = false;

-- =============================================
-- Enable Row Level Security
-- =============================================

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- =============================================
-- Drop existing policies (if any)
-- =============================================

DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
DROP POLICY IF EXISTS "System can insert notifications" ON notifications;
DROP POLICY IF EXISTS "Allow insert notifications" ON notifications;
DROP POLICY IF EXISTS "Users can delete their own notifications" ON notifications;

-- =============================================
-- RLS Policies - FIXED VERSION
-- =============================================

-- SELECT Policy: Users can view their own notifications
CREATE POLICY "Users can view their own notifications"
  ON notifications
  FOR SELECT
  USING (auth.uid() = user_id);

-- INSERT Policy: Allow authenticated users to insert (for triggers with SECURITY DEFINER)
CREATE POLICY "Allow insert notifications"
  ON notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- UPDATE Policy: Users can update their own notifications (mark as read)
CREATE POLICY "Users can update their own notifications"
  ON notifications
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- DELETE Policy: Users can delete their own notifications
CREATE POLICY "Users can delete their own notifications"
  ON notifications
  FOR DELETE
  USING (auth.uid() = user_id);

-- =============================================
-- Grant necessary permissions
-- =============================================

-- Grant usage on the notification_type enum
GRANT USAGE ON TYPE notification_type TO authenticated;
GRANT USAGE ON TYPE notification_type TO service_role;

-- Grant permissions on notifications table
GRANT SELECT, INSERT, UPDATE, DELETE ON notifications TO authenticated;
GRANT ALL ON notifications TO service_role;

-- Grant SELECT on profiles for foreign key joins
GRANT SELECT ON profiles TO authenticated;

-- =============================================
-- Function: Create notification for friend request acceptance
-- =============================================

CREATE OR REPLACE FUNCTION notify_friend_request_accepted()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sender_name TEXT;
  v_sender_avatar TEXT;
BEGIN
  -- Only proceed if status changed to 'accepted'
  IF NEW.status = 'accepted' AND (OLD.status IS NULL OR OLD.status != 'accepted') THEN
    
    -- Get accepter's name and avatar
    SELECT full_name, avatar_url INTO v_sender_name, v_sender_avatar
    FROM profiles
    WHERE id = NEW.receiver_id;
    
    -- Use email if name not available
    IF v_sender_name IS NULL THEN
      SELECT split_part(email, '@', 1) INTO v_sender_name
      FROM auth.users
      WHERE id = NEW.receiver_id;
    END IF;
    
    v_sender_name := COALESCE(v_sender_name, 'Someone');
    
    -- Create notification for the sender
    INSERT INTO notifications (
      user_id,
      type,
      title,
      message,
      related_user_id,
      data,
      action_url
    ) VALUES (
      NEW.sender_id,
      'friend_request_accepted',
      v_sender_name || ' accepted your friend request',
      'You are now connected! Start planning events together.',
      NEW.receiver_id,
      jsonb_build_object(
        'friend_name', v_sender_name,
        'friend_avatar', v_sender_avatar,
        'friend_id', NEW.receiver_id
      ),
      '/friends'
    );
    
  END IF;
  
  RETURN NEW;
END;
$$;

-- =============================================
-- Trigger: Friend request accepted
-- =============================================

DROP TRIGGER IF EXISTS trigger_friend_request_accepted ON friend_requests;

CREATE TRIGGER trigger_friend_request_accepted
  AFTER UPDATE ON friend_requests
  FOR EACH ROW
  EXECUTE FUNCTION notify_friend_request_accepted();

-- =============================================
-- Function: Create notification for booking confirmation
-- =============================================

CREATE OR REPLACE FUNCTION notify_booking_confirmed()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_event_title TEXT;
  v_event_image TEXT;
  v_event_date TIMESTAMPTZ;
BEGIN
  -- Only proceed if payment status changed to 'completed' or status is 'confirmed'
  IF (NEW.payment_status = 'completed' OR NEW.status = 'confirmed') 
     AND (OLD.payment_status IS NULL OR OLD.payment_status != 'completed') THEN
    
    -- Get event details
    SELECT title, cover_image_url, start_date 
    INTO v_event_title, v_event_image, v_event_date
    FROM events
    WHERE id = NEW.event_id;
    
    -- Create notification
    INSERT INTO notifications (
      user_id,
      type,
      title,
      message,
      related_event_id,
      related_booking_id,
      data,
      action_url
    ) VALUES (
      NEW.user_id,
      'booking_confirmed',
      'Booking Confirmed',
      'Your booking for "' || v_event_title || '" has been confirmed.',
      NEW.event_id,
      NEW.id,
      jsonb_build_object(
        'event_title', v_event_title,
        'event_image', v_event_image,
        'event_date', v_event_date,
        'quantity', NEW.quantity,
        'total_amount', NEW.total_amount
      ),
      '/tickets/' || NEW.id::text
    );
    
  END IF;
  
  RETURN NEW;
END;
$$;

-- =============================================
-- Trigger: Booking confirmed
-- =============================================

DROP TRIGGER IF EXISTS trigger_booking_confirmed ON bookings;

CREATE TRIGGER trigger_booking_confirmed
  AFTER INSERT OR UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION notify_booking_confirmed();

-- =============================================
-- Function: Create event reminder notifications (24 hours before)
-- =============================================

CREATE OR REPLACE FUNCTION create_event_reminders()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_booking RECORD;
  v_event RECORD;
BEGIN
  -- Find all bookings for events starting in 24 hours
  FOR v_booking IN
    SELECT DISTINCT ON (b.user_id, b.event_id)
      b.id,
      b.user_id,
      b.event_id,
      e.title,
      e.cover_image_url,
      e.start_date,
      e.location_name
    FROM bookings b
    INNER JOIN events e ON e.id = b.event_id
    WHERE b.status = 'confirmed'
      AND e.start_date BETWEEN NOW() + INTERVAL '23 hours' AND NOW() + INTERVAL '25 hours'
      AND NOT EXISTS (
        -- Don't create duplicate reminders
        SELECT 1 FROM notifications n
        WHERE n.user_id = b.user_id
          AND n.related_event_id = b.event_id
          AND n.type = 'event_reminder'
          AND n.created_at > NOW() - INTERVAL '48 hours'
      )
  LOOP
    -- Create reminder notification
    INSERT INTO notifications (
      user_id,
      type,
      title,
      message,
      related_event_id,
      related_booking_id,
      data,
      action_url
    ) VALUES (
      v_booking.user_id,
      'event_reminder',
      'Event Starting Soon',
      'Your event "' || v_booking.title || '" starts tomorrow at ' || 
        TO_CHAR(v_booking.start_date, 'HH12:MI AM') || '.',
      v_booking.event_id,
      v_booking.id,
      jsonb_build_object(
        'event_title', v_booking.title,
        'event_image', v_booking.cover_image_url,
        'event_date', v_booking.start_date,
        'location', v_booking.location_name
      ),
      '/events/' || v_booking.event_id::text
    );
  END LOOP;
END;
$$;

-- =============================================
-- Comments
-- =============================================

COMMENT ON TABLE notifications IS 'In-app notifications for users';
COMMENT ON COLUMN notifications.type IS 'Type of notification';
COMMENT ON COLUMN notifications.read IS 'Whether the notification has been read';
COMMENT ON COLUMN notifications.related_user_id IS 'Related user (e.g., friend who accepted request)';
COMMENT ON COLUMN notifications.related_event_id IS 'Related event';
COMMENT ON COLUMN notifications.related_booking_id IS 'Related booking';
COMMENT ON COLUMN notifications.data IS 'Additional JSON data for the notification';
COMMENT ON COLUMN notifications.action_url IS 'URL to navigate to when notification is tapped';

COMMENT ON FUNCTION notify_friend_request_accepted IS 'Creates notification when friend request is accepted';
COMMENT ON FUNCTION notify_booking_confirmed IS 'Creates notification when booking is confirmed';
COMMENT ON FUNCTION create_event_reminders IS 'Creates reminder notifications for events starting in 24 hours (run via cron job)';
