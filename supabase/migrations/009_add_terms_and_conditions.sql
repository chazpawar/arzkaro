-- Migration: Add terms_and_conditions field to events table
-- Description: Adds an optional terms and conditions field for events, experiences, and trips
-- Date: 2025-12-24

-- Add terms_and_conditions column to events table
ALTER TABLE events
ADD COLUMN IF NOT EXISTS terms_and_conditions TEXT;

-- Add comment for documentation
COMMENT ON COLUMN events.terms_and_conditions IS 'Optional terms and conditions for the event';
