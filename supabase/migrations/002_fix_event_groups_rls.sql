-- Fix infinite recursion between event_groups and group_members RLS policies
-- Run this in Supabase SQL Editor

-- Drop the problematic policy
DROP POLICY IF EXISTS "Group members can view groups" ON event_groups;

-- Create a new policy that doesn't depend on group_members
-- Allow users to view groups if they own the event OR the event is published
CREATE POLICY "Group members can view groups"
  ON event_groups FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM events e 
      WHERE e.id = event_groups.event_id 
      AND (e.host_id = auth.uid() OR e.is_published = true)
    )
  );
