-- Add cancellation_policy field to events table
ALTER TABLE events 
ADD COLUMN cancellation_policy TEXT;

COMMENT ON COLUMN events.cancellation_policy IS 'Cancellation policy for the event';
