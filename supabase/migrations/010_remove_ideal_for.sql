-- =====================================================
-- MIGRATION 010: Remove ideal_for Column from Events
-- =====================================================
-- This migration removes the ideal_for field from events table
-- as it's no longer needed in the application.
-- =====================================================

-- Remove ideal_for column from events table
ALTER TABLE events
DROP COLUMN IF EXISTS ideal_for;
