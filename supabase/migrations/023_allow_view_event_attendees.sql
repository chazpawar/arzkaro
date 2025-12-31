-- Migration: Allow viewing confirmed bookings for event attendees
-- This allows users to see who else has joined an event (only confirmed bookings)

-- Drop existing policy
DROP POLICY IF EXISTS "Users can view their own bookings" ON bookings;

-- Recreate policy with attendee visibility
CREATE POLICY "Users can view their own bookings"
  ON bookings FOR SELECT
  USING (
    -- Users can see their own bookings (any status)
    user_id = (SELECT auth.uid()) 
    OR 
    -- Hosts can see all bookings for their events
    EXISTS (
      SELECT 1 FROM events 
      WHERE id = event_id AND host_id = (SELECT auth.uid())
    )
    OR
    -- Anyone can see confirmed bookings (for attendee lists)
    status = 'confirmed'
  );
