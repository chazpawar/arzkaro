-- =====================================================
-- MIGRATION 016: Add Things to Know Field
-- =====================================================
-- This migration adds a things_to_know field to the events table
-- for storing important information participants should know
-- about events, experiences, and trips
-- =====================================================

-- Add things_to_know field to events table
ALTER TABLE events
ADD COLUMN IF NOT EXISTS things_to_know TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Add comment for documentation
COMMENT ON COLUMN events.things_to_know IS 'Important information participants should know (e.g., "Wear comfortable shoes", "Bring sunscreen")';
