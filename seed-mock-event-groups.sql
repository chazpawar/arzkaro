-- Seed event_groups for mock events
-- This creates chat groups for all 10 mock events so chat functionality works

-- First, check if groups already exist
SELECT 'Existing event_groups:' as info;
SELECT id, event_id, name FROM event_groups WHERE event_id LIKE 'event-%';

-- Insert event_groups for all mock events
-- Using ON CONFLICT DO NOTHING to avoid duplicates
INSERT INTO event_groups (id, event_id, name, description, created_at, updated_at)
VALUES
  (gen_random_uuid(), 'event-1', 'Mumbai Music Festival 2025 - Chat', 'Group chat for Mumbai Music Festival 2025', NOW(), NOW()),
  (gen_random_uuid(), 'event-2', 'Tech Startup Summit - Chat', 'Group chat for Tech Startup Summit', NOW(), NOW()),
  (gen_random_uuid(), 'event-3', 'Sunrise Hot Air Balloon Ride - Chat', 'Group chat for Sunrise Hot Air Balloon Ride', NOW(), NOW()),
  (gen_random_uuid(), 'event-4', 'Photography Walk - Old Delhi - Chat', 'Group chat for Photography Walk - Old Delhi', NOW(), NOW()),
  (gen_random_uuid(), 'event-5', 'Wine Tasting Experience - Chat', 'Group chat for Wine Tasting Experience', NOW(), NOW()),
  (gen_random_uuid(), 'event-6', 'Yoga & Wellness Retreat - Chat', 'Group chat for Yoga & Wellness Retreat', NOW(), NOW()),
  (gen_random_uuid(), 'event-7', 'Comedy Night Special - Chat', 'Group chat for Comedy Night Special', NOW(), NOW()),
  (gen_random_uuid(), 'event-8', 'Cooking Class - Authentic Indian Cuisine - Chat', 'Group chat for Cooking Class - Authentic Indian Cuisine', NOW(), NOW()),
  (gen_random_uuid(), 'event-9', 'Weekend Beach Getaway - Chat', 'Group chat for Weekend Beach Getaway', NOW(), NOW()),
  (gen_random_uuid(), 'event-10', 'Food & Wine Festival - Chat', 'Group chat for Food & Wine Festival', NOW(), NOW())
ON CONFLICT (event_id) DO NOTHING;

-- Verify the inserts
SELECT 'After insert:' as info;
SELECT id, event_id, name FROM event_groups WHERE event_id LIKE 'event-%' ORDER BY event_id;

-- Count how many were created
SELECT COUNT(*) as total_mock_event_groups FROM event_groups WHERE event_id LIKE 'event-%';
