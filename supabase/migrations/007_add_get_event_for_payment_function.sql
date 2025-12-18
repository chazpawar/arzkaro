-- Create a function that bypasses RLS to get event details for payment processing
-- This is needed because Edge Functions can't bypass RLS with service role key properly

CREATE OR REPLACE FUNCTION get_event_for_payment(event_uuid UUID)
RETURNS TABLE (
  id UUID,
  title TEXT,
  price DECIMAL(10,2),
  host_id UUID
)
LANGUAGE plpgsql
SECURITY DEFINER -- This makes the function run with the privileges of the owner (bypasses RLS)
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    e.id,
    e.title,
    e.price,
    e.host_id
  FROM events e
  WHERE e.id = event_uuid;
END;
$$;

COMMENT ON FUNCTION get_event_for_payment IS 'Fetch event details for payment processing (bypasses RLS)';

-- Create a function that bypasses RLS to create a pending booking for payment processing
CREATE OR REPLACE FUNCTION create_pending_booking(
  p_booking_id UUID,
  p_event_id UUID,
  p_user_id UUID,
  p_quantity INTEGER,
  p_total_amount DECIMAL(10,2)
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO bookings (
    id,
    event_id,
    user_id,
    quantity,
    total_amount,
    payment_status,
    status
  ) VALUES (
    p_booking_id,
    p_event_id,
    p_user_id,
    p_quantity,
    p_total_amount,
    'pending',
    'pending'
  );
  
  RETURN p_booking_id;
END;
$$;

COMMENT ON FUNCTION create_pending_booking IS 'Create a pending booking for payment processing (bypasses RLS)';
