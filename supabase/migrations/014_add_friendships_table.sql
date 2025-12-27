-- =====================================================
-- MIGRATION 014: Friendships System
-- =====================================================
-- Creates tables and functions for friend connections

-- Create friendships table
CREATE TABLE IF NOT EXISTS friendships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  friend_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status text NOT NULL CHECK (status IN ('pending', 'accepted', 'blocked')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Ensure no duplicate friendships
  UNIQUE(user_id, friend_id),
  
  -- Ensure user cannot friend themselves
  CHECK (user_id != friend_id)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_friendships_user_id ON friendships(user_id);
CREATE INDEX IF NOT EXISTS idx_friendships_friend_id ON friendships(friend_id);
CREATE INDEX IF NOT EXISTS idx_friendships_status ON friendships(status);

-- Add updated_at trigger
CREATE TRIGGER update_friendships_updated_at
  BEFORE UPDATE ON friendships
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- RLS POLICIES FOR FRIENDSHIPS
-- =====================================================

ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;

-- Users can view their own friendships
CREATE POLICY "Users can view own friendships"
  ON friendships FOR SELECT
  USING (user_id = auth.uid() OR friend_id = auth.uid());

-- Users can create friendship requests
CREATE POLICY "Users can create friendships"
  ON friendships FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Users can update their own friendship requests
CREATE POLICY "Users can update own friendships"
  ON friendships FOR UPDATE
  USING (user_id = auth.uid() OR friend_id = auth.uid());

-- Users can delete their own friendships
CREATE POLICY "Users can delete own friendships"
  ON friendships FOR DELETE
  USING (user_id = auth.uid() OR friend_id = auth.uid());

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to check if two users are friends
CREATE OR REPLACE FUNCTION are_friends(user1_id uuid, user2_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM friendships
    WHERE status = 'accepted'
    AND (
      (user_id = user1_id AND friend_id = user2_id)
      OR
      (user_id = user2_id AND friend_id = user1_id)
    )
  );
$$;

-- Function to get mutual friends count
CREATE OR REPLACE FUNCTION get_mutual_friends_count(user1_id uuid, user2_id uuid)
RETURNS integer
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT COUNT(*)::integer
  FROM (
    -- User1's friends
    SELECT CASE 
      WHEN user_id = user1_id THEN friend_id 
      ELSE user_id 
    END as friend
    FROM friendships
    WHERE status = 'accepted'
    AND (user_id = user1_id OR friend_id = user1_id)
  ) user1_friends
  INNER JOIN (
    -- User2's friends
    SELECT CASE 
      WHEN user_id = user2_id THEN friend_id 
      ELSE user_id 
    END as friend
    FROM friendships
    WHERE status = 'accepted'
    AND (user_id = user2_id OR friend_id = user2_id)
  ) user2_friends
  ON user1_friends.friend = user2_friends.friend;
$$;

COMMENT ON TABLE friendships IS 'Stores friend connections between users';
COMMENT ON FUNCTION are_friends IS 'Check if two users are friends';
COMMENT ON FUNCTION get_mutual_friends_count IS 'Get count of mutual friends between two users';
