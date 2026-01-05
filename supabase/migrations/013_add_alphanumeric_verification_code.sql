-- =====================================================
-- Migration 011: Add Alphanumeric Verification Code to Tickets
-- =====================================================
-- Purpose: Add 6-character alphanumeric verification code for easy manual ticket validation
-- Replaces UUID-based ticket ID verification with human-friendly codes
-- Format: 6 characters using A-Z and 2-9 (excludes confusing chars: 0, O, I, 1, L)

-- -----------------------------------------------------
-- Step 1: Add verification_code column to tickets table
-- -----------------------------------------------------
ALTER TABLE tickets 
ADD COLUMN IF NOT EXISTS verification_code TEXT UNIQUE;

COMMENT ON COLUMN tickets.verification_code IS 'Unique 6-character alphanumeric code for manual ticket verification by hosts';

-- -----------------------------------------------------
-- Step 2: Create function to generate unique alphanumeric codes
-- -----------------------------------------------------
CREATE OR REPLACE FUNCTION generate_unique_verification_code()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_code TEXT;
  code_exists BOOLEAN;
  max_attempts INT := 100;
  attempt INT := 0;
  -- Alphanumeric characters (excluding confusing ones: 0, O, I, 1, L)
  -- This gives us 31 characters: A-Z (minus I, O, L) + 2-9
  chars TEXT := '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
  chars_length INT := 31;
  i INT;
BEGIN
  LOOP
    -- Generate random 6-character alphanumeric code
    new_code := '';
    FOR i IN 1..6 LOOP
      new_code := new_code || substr(chars, floor(random() * chars_length + 1)::int, 1);
    END LOOP;
    
    -- Check if code already exists
    SELECT EXISTS(SELECT 1 FROM tickets WHERE verification_code = new_code) INTO code_exists;
    
    -- If code doesn't exist, return it
    IF NOT code_exists THEN
      RETURN new_code;
    END IF;
    
    -- Increment attempt counter
    attempt := attempt + 1;
    
    -- Safety: prevent infinite loop
    IF attempt >= max_attempts THEN
      RAISE EXCEPTION 'Could not generate unique verification code after % attempts', max_attempts;
    END IF;
  END LOOP;
END;
$$;

COMMENT ON FUNCTION generate_unique_verification_code IS 
  'Generates a unique 6-character alphanumeric verification code for tickets (excludes confusing characters like O, 0, I, 1, L)';

-- -----------------------------------------------------
-- Step 3: Update auto_generate_tickets function (removed qr_code)
-- -----------------------------------------------------
CREATE OR REPLACE FUNCTION auto_generate_tickets()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
        verification_code,
        status
      ) VALUES (
        NEW.id,
        NEW.user_id,
        NEW.event_id,
        NEW.ticket_type_id,
        generate_unique_verification_code(),
        'valid'
      );
    END LOOP;
    
    -- Update event current_bookings
    UPDATE events 
    SET current_bookings = current_bookings + NEW.quantity
    WHERE id = NEW.event_id;
    
  END IF;
  
  -- Handle booking cancellation
  IF NEW.status = 'cancelled' AND (OLD IS NOT NULL AND OLD.status != 'cancelled') THEN
    
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
$$;

COMMENT ON FUNCTION auto_generate_tickets IS 
  'Automatically generates tickets with 6-character alphanumeric verification codes when a booking is confirmed';

-- -----------------------------------------------------
-- Step 4: Generate verification codes for existing tickets
-- -----------------------------------------------------
-- This will add codes to any existing tickets that don't have them
DO $$
DECLARE
  ticket_record RECORD;
BEGIN
  FOR ticket_record IN 
    SELECT id FROM tickets WHERE verification_code IS NULL
  LOOP
    UPDATE tickets 
    SET verification_code = generate_unique_verification_code()
    WHERE id = ticket_record.id;
  END LOOP;
END $$;

-- -----------------------------------------------------
-- Step 5: Make verification_code NOT NULL for new tickets
-- -----------------------------------------------------
-- After backfilling existing data, make it required for new tickets
ALTER TABLE tickets 
ALTER COLUMN verification_code SET NOT NULL;

-- Create index for faster verification_code lookups
CREATE INDEX IF NOT EXISTS idx_tickets_verification_code ON tickets(verification_code);

COMMENT ON INDEX idx_tickets_verification_code IS 'Index for fast ticket verification by alphanumeric code';

-- -----------------------------------------------------
-- Step 6: Remove unused qr_code column
-- -----------------------------------------------------
-- We're using verification_code instead of qr_code
ALTER TABLE tickets 
DROP COLUMN IF EXISTS qr_code;
