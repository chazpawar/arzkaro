-- Migration: Add ticket auto-generation and remove QR code requirement
-- This migration fixes ticket creation and removes QR code dependency

-- =====================================================
-- 1. ALTER TICKETS TABLE - Make qr_code optional
-- =====================================================

-- Make qr_code nullable since we're not using QR codes
ALTER TABLE tickets ALTER COLUMN qr_code DROP NOT NULL;
ALTER TABLE tickets ALTER COLUMN qr_code DROP DEFAULT;

-- Add a default value for qr_code to avoid issues
UPDATE tickets SET qr_code = 'TKT-' || id::text WHERE qr_code IS NULL;

-- =====================================================
-- 2. FIX EVENT_GROUPS RLS POLICY (Infinite Recursion)
-- =====================================================

-- Drop the problematic policy
DROP POLICY IF EXISTS "Group members can view groups" ON event_groups;

-- Create a simpler policy that doesn't cause recursion
-- Allow viewing if user is the event host OR event is published
CREATE POLICY "Group members can view groups"
  ON event_groups FOR SELECT
  USING (
    event_id IN (
      SELECT id FROM events 
      WHERE host_id = auth.uid() OR is_published = true
    )
  );

-- Also need to allow INSERT for the trigger function
DROP POLICY IF EXISTS "Event hosts can create groups" ON event_groups;

CREATE POLICY "Event hosts can create groups"
  ON event_groups FOR INSERT
  WITH CHECK (
    event_id IN (
      SELECT id FROM events WHERE host_id = auth.uid()
    )
    OR auth.uid() IS NULL  -- Allow trigger/function to insert
  );

-- =====================================================
-- 3. FIX GROUP_MEMBERS RLS POLICY
-- =====================================================

-- Drop and recreate to allow trigger to insert
DROP POLICY IF EXISTS "Users can join groups (via booking)" ON group_members;

CREATE POLICY "Users can join groups (via booking)"
  ON group_members FOR INSERT
  WITH CHECK (
    auth.uid() = user_id OR auth.uid() IS NULL  -- Allow trigger/function
  );

-- =====================================================
-- 4. CREATE TICKET AUTO-GENERATION FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION auto_generate_tickets()
RETURNS TRIGGER AS $$
DECLARE
  ticket_count INTEGER;
  counter INTEGER;
BEGIN
  -- Only generate tickets when booking is confirmed
  IF NEW.status = 'confirmed' AND (OLD IS NULL OR OLD.status != 'confirmed') THEN
    
    -- Generate N tickets where N = booking quantity
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
    
    -- Mark all tickets as cancelled
    UPDATE tickets
    SET status = 'cancelled'
    WHERE booking_id = NEW.id AND status != 'cancelled';
    
    -- Decrease event current_bookings
    UPDATE events
    SET current_bookings = GREATEST(0, current_bookings - OLD.quantity)
    WHERE id = NEW.event_id;
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 5. CREATE TRIGGER FOR TICKET AUTO-GENERATION
-- =====================================================

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_auto_generate_tickets ON bookings;

-- Create trigger that fires after booking insert or update
CREATE TRIGGER trigger_auto_generate_tickets
  AFTER INSERT OR UPDATE OF status ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION auto_generate_tickets();

-- =====================================================
-- 6. CREATE EVENT GROUP AUTO-GENERATION FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION auto_create_event_group()
RETURNS TRIGGER AS $$
DECLARE
  v_group_id UUID;
BEGIN
  -- Only create group when event is published
  IF NEW.is_published = TRUE AND (OLD IS NULL OR OLD.is_published = FALSE) THEN
    
    -- Create event group if it doesn't exist
    INSERT INTO event_groups (event_id, name, description)
    VALUES (
      NEW.id,
      NEW.title || ' - Group Chat',
      'Chat group for ' || NEW.title
    )
    ON CONFLICT DO NOTHING
    RETURNING id INTO v_group_id;
    
    -- If group was just created, add host as member
    IF v_group_id IS NOT NULL THEN
      INSERT INTO group_members (group_id, user_id, role)
      VALUES (v_group_id, NEW.host_id, 'host')
      ON CONFLICT (group_id, user_id) DO NOTHING;
    END IF;
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 7. CREATE TRIGGER FOR EVENT GROUP AUTO-GENERATION
-- =====================================================

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_auto_create_event_group ON events;

-- Create trigger that fires after event insert or update
CREATE TRIGGER trigger_auto_create_event_group
  AFTER INSERT OR UPDATE OF is_published ON events
  FOR EACH ROW
  EXECUTE FUNCTION auto_create_event_group();

-- =====================================================
-- 8. UPDATE RLS POLICY FOR TICKETS
-- =====================================================

-- Drop and recreate the "System can create tickets" policy to allow trigger
DROP POLICY IF EXISTS "System can create tickets" ON tickets;

CREATE POLICY "System can create tickets"
  ON tickets FOR INSERT
  WITH CHECK (
    auth.uid() = user_id OR auth.uid() IS NULL  -- Allow trigger/function
  );

-- =====================================================
-- 9. COMMENTS
-- =====================================================

COMMENT ON FUNCTION auto_generate_tickets() IS 
  'Automatically generates tickets when a booking is confirmed and handles cancellation';

COMMENT ON FUNCTION auto_create_event_group() IS 
  'Automatically creates an event group when an event is published';

COMMENT ON TRIGGER trigger_auto_generate_tickets ON bookings IS 
  'Triggers ticket generation on booking confirmation';

COMMENT ON TRIGGER trigger_auto_create_event_group ON events IS 
  'Triggers event group creation on event publish';

