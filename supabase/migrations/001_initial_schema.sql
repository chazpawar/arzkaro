-- ArzKaro Initial Database Schema Migration (SAFE VERSION)
-- This creates all tables, enums, RLS policies, triggers, and functions
-- Run this in Supabase SQL Editor

-- =====================================================
-- 1. CREATE ENUMS (with DROP IF EXISTS for safety)
-- =====================================================

DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS event_type CASCADE;
DROP TYPE IF EXISTS booking_status CASCADE;
DROP TYPE IF EXISTS payment_status CASCADE;
DROP TYPE IF EXISTS ticket_status CASCADE;
DROP TYPE IF EXISTS group_member_role CASCADE;
DROP TYPE IF EXISTS message_type CASCADE;
DROP TYPE IF EXISTS friend_request_status CASCADE;
DROP TYPE IF EXISTS host_request_status CASCADE;

CREATE TYPE user_role AS ENUM ('user', 'host', 'admin');
CREATE TYPE event_type AS ENUM ('event', 'experience', 'trip');
CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'cancelled', 'refunded');
CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'failed', 'refunded');
CREATE TYPE ticket_status AS ENUM ('valid', 'used', 'cancelled', 'expired');
CREATE TYPE group_member_role AS ENUM ('member', 'moderator', 'host');
CREATE TYPE message_type AS ENUM ('text', 'image', 'system');
CREATE TYPE friend_request_status AS ENUM ('pending', 'accepted', 'rejected');
CREATE TYPE host_request_status AS ENUM ('pending', 'approved', 'rejected');

-- =====================================================
-- 2. CREATE TABLES
-- =====================================================

-- Profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  username TEXT UNIQUE,
  bio TEXT,
  avatar_url TEXT,
  phone TEXT,
  role user_role DEFAULT 'user' NOT NULL,
  is_host_approved BOOLEAN DEFAULT FALSE NOT NULL,
  host_requested_at TIMESTAMPTZ,
  host_approved_at TIMESTAMPTZ,
  is_public BOOLEAN DEFAULT TRUE NOT NULL,
  location TEXT,
  website TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Host requests table
CREATE TABLE IF NOT EXISTS host_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  business_name TEXT,
  business_type TEXT,
  status host_request_status DEFAULT 'pending' NOT NULL,
  reviewed_by UUID REFERENCES profiles(id),
  reviewed_at TIMESTAMPTZ,
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Events table
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type event_type NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  short_description TEXT,
  cover_image_url TEXT,
  images TEXT[] DEFAULT ARRAY[]::TEXT[],
  location_name TEXT,
  location_address TEXT,
  location_lat DOUBLE PRECISION,
  location_lng DOUBLE PRECISION,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  timezone TEXT DEFAULT 'UTC' NOT NULL,
  max_capacity INTEGER,
  current_bookings INTEGER DEFAULT 0 NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'INR' NOT NULL,
  is_published BOOLEAN DEFAULT FALSE NOT NULL,
  is_cancelled BOOLEAN DEFAULT FALSE NOT NULL,
  category TEXT,
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Ticket types table
CREATE TABLE IF NOT EXISTS ticket_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  quantity_available INTEGER NOT NULL,
  quantity_sold INTEGER DEFAULT 0 NOT NULL,
  max_per_order INTEGER DEFAULT 10 NOT NULL,
  sale_start_date TIMESTAMPTZ,
  sale_end_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Bookings table
CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  ticket_type_id UUID REFERENCES ticket_types(id),
  quantity INTEGER DEFAULT 1 NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'INR' NOT NULL,
  status booking_status DEFAULT 'pending' NOT NULL,
  payment_intent_id TEXT,
  payment_status payment_status DEFAULT 'pending' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Tickets table
CREATE TABLE IF NOT EXISTS tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  ticket_type_id UUID REFERENCES ticket_types(id),
  qr_code TEXT NOT NULL UNIQUE,
  status ticket_status DEFAULT 'valid' NOT NULL,
  checked_in_at TIMESTAMPTZ,
  checked_in_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Event groups (chat groups for events)
CREATE TABLE IF NOT EXISTS event_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Group members table
CREATE TABLE IF NOT EXISTS group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES event_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role group_member_role DEFAULT 'member' NOT NULL,
  joined_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(group_id, user_id)
);

-- Messages table (for group chats)
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES event_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  message_type message_type DEFAULT 'text' NOT NULL,
  is_deleted BOOLEAN DEFAULT FALSE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Friend requests table
CREATE TABLE IF NOT EXISTS friend_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status friend_request_status DEFAULT 'pending' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  responded_at TIMESTAMPTZ,
  UNIQUE(sender_id, receiver_id)
);

-- Friendships table
CREATE TABLE IF NOT EXISTS friendships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id_1 UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  user_id_2 UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(user_id_1, user_id_2)
);

-- DM conversations table
CREATE TABLE IF NOT EXISTS dm_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id_1 UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  user_id_2 UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(user_id_1, user_id_2)
);

-- DM messages table
CREATE TABLE IF NOT EXISTS dm_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES dm_conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  message_type message_type DEFAULT 'text' NOT NULL,
  is_read BOOLEAN DEFAULT FALSE NOT NULL,
  is_deleted BOOLEAN DEFAULT FALSE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- =====================================================
-- 3. CREATE INDEXES FOR PERFORMANCE
-- =====================================================

DROP INDEX IF EXISTS idx_events_host_id;
DROP INDEX IF EXISTS idx_events_start_date;
DROP INDEX IF EXISTS idx_events_is_published;
DROP INDEX IF EXISTS idx_bookings_user_id;
DROP INDEX IF EXISTS idx_bookings_event_id;
DROP INDEX IF EXISTS idx_tickets_user_id;
DROP INDEX IF EXISTS idx_tickets_event_id;
DROP INDEX IF EXISTS idx_tickets_qr_code;
DROP INDEX IF EXISTS idx_messages_group_id;
DROP INDEX IF EXISTS idx_messages_created_at;
DROP INDEX IF EXISTS idx_dm_messages_conversation_id;
DROP INDEX IF EXISTS idx_dm_messages_created_at;
DROP INDEX IF EXISTS idx_group_members_group_id;
DROP INDEX IF EXISTS idx_group_members_user_id;

CREATE INDEX idx_events_host_id ON events(host_id);
CREATE INDEX idx_events_start_date ON events(start_date);
CREATE INDEX idx_events_is_published ON events(is_published);
CREATE INDEX idx_bookings_user_id ON bookings(user_id);
CREATE INDEX idx_bookings_event_id ON bookings(event_id);
CREATE INDEX idx_tickets_user_id ON tickets(user_id);
CREATE INDEX idx_tickets_event_id ON tickets(event_id);
CREATE INDEX idx_tickets_qr_code ON tickets(qr_code);
CREATE INDEX idx_messages_group_id ON messages(group_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);
CREATE INDEX idx_dm_messages_conversation_id ON dm_messages(conversation_id);
CREATE INDEX idx_dm_messages_created_at ON dm_messages(created_at);
CREATE INDEX idx_group_members_group_id ON group_members(group_id);
CREATE INDEX idx_group_members_user_id ON group_members(user_id);

-- =====================================================
-- 4. CREATE FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing triggers first
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
DROP TRIGGER IF EXISTS update_events_updated_at ON events;
DROP TRIGGER IF EXISTS update_bookings_updated_at ON bookings;
DROP TRIGGER IF EXISTS update_dm_conversations_updated_at ON dm_conversations;

-- Apply updated_at trigger to tables
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_dm_conversations_updated_at BEFORE UPDATE ON dm_conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger first
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Trigger to create profile on auth.users insert
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- =====================================================
-- 5. ENABLE ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE host_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE friend_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE dm_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE dm_messages ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 6. CREATE RLS POLICIES (Drop existing first)
-- =====================================================

-- Drop all existing policies
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view their own host requests" ON host_requests;
DROP POLICY IF EXISTS "Users can create host requests" ON host_requests;
DROP POLICY IF EXISTS "Published events are viewable by everyone" ON events;
DROP POLICY IF EXISTS "Hosts can create events" ON events;
DROP POLICY IF EXISTS "Hosts can update their own events" ON events;
DROP POLICY IF EXISTS "Hosts can delete their own events" ON events;
DROP POLICY IF EXISTS "Ticket types viewable for published events" ON ticket_types;
DROP POLICY IF EXISTS "Hosts can manage ticket types" ON ticket_types;
DROP POLICY IF EXISTS "Users can view their own bookings" ON bookings;
DROP POLICY IF EXISTS "Users can create bookings" ON bookings;
DROP POLICY IF EXISTS "Users can update their own bookings" ON bookings;
DROP POLICY IF EXISTS "Users can view their own tickets" ON tickets;
DROP POLICY IF EXISTS "System can create tickets" ON tickets;
DROP POLICY IF EXISTS "Hosts can update tickets for their events" ON tickets;
DROP POLICY IF EXISTS "Group members can view groups" ON event_groups;
DROP POLICY IF EXISTS "Event hosts can create groups" ON event_groups;
DROP POLICY IF EXISTS "Group members can view members" ON group_members;
DROP POLICY IF EXISTS "Users can join groups (via booking)" ON group_members;
DROP POLICY IF EXISTS "Group members can view messages" ON messages;
DROP POLICY IF EXISTS "Group members can send messages" ON messages;
DROP POLICY IF EXISTS "Users can update their own messages" ON messages;
DROP POLICY IF EXISTS "Users can view their friend requests" ON friend_requests;
DROP POLICY IF EXISTS "Users can send friend requests" ON friend_requests;
DROP POLICY IF EXISTS "Users can update received requests" ON friend_requests;
DROP POLICY IF EXISTS "Users can view their friendships" ON friendships;
DROP POLICY IF EXISTS "System can create friendships" ON friendships;
DROP POLICY IF EXISTS "Users can delete their friendships" ON friendships;
DROP POLICY IF EXISTS "Users can view their conversations" ON dm_conversations;
DROP POLICY IF EXISTS "Users can create conversations" ON dm_conversations;
DROP POLICY IF EXISTS "Users can view their DM messages" ON dm_messages;
DROP POLICY IF EXISTS "Users can send DM messages" ON dm_messages;
DROP POLICY IF EXISTS "Users can update their own DM messages" ON dm_messages;

-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (is_public = TRUE OR auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Host requests policies
CREATE POLICY "Users can view their own host requests"
  ON host_requests FOR SELECT
  USING (auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "Users can create host requests"
  ON host_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Events policies
CREATE POLICY "Published events are viewable by everyone"
  ON events FOR SELECT
  USING (is_published = TRUE OR host_id = auth.uid() OR EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "Hosts can create events"
  ON events FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND (role = 'host' OR role = 'admin')
  ));

CREATE POLICY "Hosts can update their own events"
  ON events FOR UPDATE
  USING (host_id = auth.uid() OR EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "Hosts can delete their own events"
  ON events FOR DELETE
  USING (host_id = auth.uid() OR EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  ));

-- Ticket types policies
CREATE POLICY "Ticket types viewable for published events"
  ON ticket_types FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM events WHERE id = event_id AND (is_published = TRUE OR host_id = auth.uid())
  ));

CREATE POLICY "Hosts can manage ticket types"
  ON ticket_types FOR ALL
  USING (EXISTS (
    SELECT 1 FROM events WHERE id = event_id AND host_id = auth.uid()
  ));

-- Bookings policies
CREATE POLICY "Users can view their own bookings"
  ON bookings FOR SELECT
  USING (user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM events WHERE id = event_id AND host_id = auth.uid()
  ));

CREATE POLICY "Users can create bookings"
  ON bookings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own bookings"
  ON bookings FOR UPDATE
  USING (user_id = auth.uid());

-- Tickets policies
CREATE POLICY "Users can view their own tickets"
  ON tickets FOR SELECT
  USING (user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM events WHERE id = event_id AND host_id = auth.uid()
  ));

CREATE POLICY "System can create tickets"
  ON tickets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Hosts can update tickets for their events"
  ON tickets FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM events WHERE id = event_id AND host_id = auth.uid()
  ));

-- Event groups policies
-- Fixed: avoid infinite recursion by checking events directly instead of group_members
CREATE POLICY "Group members can view groups"
  ON event_groups FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM events e 
      WHERE e.id = event_groups.event_id 
      AND (e.host_id = auth.uid() OR e.is_published = true)
    )
  );

CREATE POLICY "Event hosts can create groups"
  ON event_groups FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM events WHERE id = event_id AND host_id = auth.uid()
  ));

-- Group members policies
-- Allow users to view group members if they are in the same group
-- Fixed: avoid infinite recursion by checking event_groups ownership or direct membership
CREATE POLICY "Group members can view members"
  ON group_members FOR SELECT
  USING (
    user_id = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM event_groups eg 
      INNER JOIN events e ON eg.event_id = e.id 
      WHERE eg.id = group_members.group_id 
      AND (e.host_id = auth.uid() OR e.is_published = true)
    )
  );

CREATE POLICY "Users can join groups (via booking)"
  ON group_members FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Messages policies
CREATE POLICY "Group members can view messages"
  ON messages FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM group_members WHERE group_id = messages.group_id AND user_id = auth.uid()
  ));

CREATE POLICY "Group members can send messages"
  ON messages FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM group_members WHERE group_id = messages.group_id AND user_id = auth.uid()
  ) AND auth.uid() = user_id);

CREATE POLICY "Users can update their own messages"
  ON messages FOR UPDATE
  USING (user_id = auth.uid());

-- Friend requests policies
CREATE POLICY "Users can view their friend requests"
  ON friend_requests FOR SELECT
  USING (sender_id = auth.uid() OR receiver_id = auth.uid());

CREATE POLICY "Users can send friend requests"
  ON friend_requests FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update received requests"
  ON friend_requests FOR UPDATE
  USING (receiver_id = auth.uid());

-- Friendships policies
CREATE POLICY "Users can view their friendships"
  ON friendships FOR SELECT
  USING (user_id_1 = auth.uid() OR user_id_2 = auth.uid());

CREATE POLICY "System can create friendships"
  ON friendships FOR INSERT
  WITH CHECK (user_id_1 = auth.uid() OR user_id_2 = auth.uid());

CREATE POLICY "Users can delete their friendships"
  ON friendships FOR DELETE
  USING (user_id_1 = auth.uid() OR user_id_2 = auth.uid());

-- DM conversations policies
CREATE POLICY "Users can view their conversations"
  ON dm_conversations FOR SELECT
  USING (user_id_1 = auth.uid() OR user_id_2 = auth.uid());

CREATE POLICY "Users can create conversations"
  ON dm_conversations FOR INSERT
  WITH CHECK (user_id_1 = auth.uid() OR user_id_2 = auth.uid());

-- DM messages policies
CREATE POLICY "Users can view their DM messages"
  ON dm_messages FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM dm_conversations 
    WHERE id = conversation_id AND (user_id_1 = auth.uid() OR user_id_2 = auth.uid())
  ));

CREATE POLICY "Users can send DM messages"
  ON dm_messages FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM dm_conversations 
    WHERE id = conversation_id AND (user_id_1 = auth.uid() OR user_id_2 = auth.uid())
  ) AND auth.uid() = sender_id);

CREATE POLICY "Users can update their own DM messages"
  ON dm_messages FOR UPDATE
  USING (sender_id = auth.uid());

-- =====================================================
-- 7. GRANT PERMISSIONS
-- =====================================================

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- =====================================================
-- Migration Complete!
-- =====================================================
