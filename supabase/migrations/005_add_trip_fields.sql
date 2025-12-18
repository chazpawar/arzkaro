-- =====================================================
-- MIGRATION 005: Add Trip-Specific Fields to Events
-- =====================================================
-- This migration adds additional fields to the events table
-- specifically for trip-type events including:
--   - departure_location: Where the trip departs from
--   - pickups: Array of pickup locations
--   - itinerary: Detailed day-by-day trip itinerary
--   - whats_included: What's included in the trip package
--   - whats_not_included: What's NOT included in the trip
--   - ideal_for: Target audience for the trip
-- =====================================================

-- Add trip-specific fields to events table
ALTER TABLE events
ADD COLUMN IF NOT EXISTS departure_location TEXT,
ADD COLUMN IF NOT EXISTS pickups TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN IF NOT EXISTS itinerary TEXT,
ADD COLUMN IF NOT EXISTS whats_included TEXT,
ADD COLUMN IF NOT EXISTS whats_not_included TEXT,
ADD COLUMN IF NOT EXISTS ideal_for TEXT;

-- Add comments for documentation
COMMENT ON COLUMN events.departure_location IS 'Departure location for trips (e.g., "Mumbai Central Station")';
COMMENT ON COLUMN events.pickups IS 'Array of pickup locations for trips (e.g., ["Andheri", "Bandra", "Churchgate"])';
COMMENT ON COLUMN events.itinerary IS 'Detailed day-by-day itinerary for trips in markdown format';
COMMENT ON COLUMN events.whats_included IS 'What is included in the trip package (e.g., meals, accommodation, transport)';
COMMENT ON COLUMN events.whats_not_included IS 'What is NOT included in the trip package (e.g., personal expenses, insurance)';
COMMENT ON COLUMN events.ideal_for IS 'Target audience description (e.g., "Adventure enthusiasts", "Families with kids")';
