-- ArzKaro Database Schema Migration
-- Version: 001_initial_schema
-- Created: 2025-12-04

-- ==================================================
-- PROFILES TABLE
-- ==================================================

-- User profiles extending Supabase auth.users
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  username TEXT UNIQUE,
  bio TEXT,
  avatar_url TEXT,
  phone TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'host', 'admin')),
  is_host_approved BOOLEAN DEFAULT false,
  host_requested_at TIMESTAMPTZ,
  host_approved_at TIMESTAMPTZ,
  is_public BOOLEAN DEFAULT true,
  location TEXT,
  website TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Function to assign roles based on email for testing
CREATE OR REPLACE FUNCTION assign_user_role()
RETURNS TRIGGER AS $$
BEGIN
  -- Admin role
  IF NEW.email = 'dinesh.1124k@gmail.com' THEN
    NEW.role := 'admin';
    NEW.is_host_approved := true;
  -- Host role
  ELSIF NEW.email = 'rrucnamra@gmail.com' THEN
    NEW.role := 'host';
    NEW.is_host_approved := true;
  -- Default user role
  ELSE
    NEW.role := 'user';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to assign role on profile creation
DROP TRIGGER IF EXISTS on_profile_created ON profiles;
CREATE TRIGGER on_profile_created
  BEFORE INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION assign_user_role();

-- Function to auto-create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on auth.users insert
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at on profiles
DROP TRIGGER IF EXISTS profiles_updated_at ON profiles;
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ==================================================
-- HOST REQUESTS TABLE
-- ==================================================

CREATE TABLE IF NOT EXISTS host_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  business_name TEXT,
  business_type TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by UUID REFERENCES profiles(id),
  reviewed_at TIMESTAMPTZ,
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==================================================
-- EVENTS TABLE
-- ==================================================

CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id UUID REFERENCES profiles(id) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('event', 'experience', 'trip')),
  title TEXT NOT NULL,
  description TEXT,
  short_description TEXT,
  cover_image_url TEXT,
  images TEXT[] DEFAULT '{}',
  location_name TEXT,
  location_address TEXT,
  location_lat DECIMAL,
  location_lng DECIMAL,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  timezone TEXT DEFAULT 'Asia/Kolkata',
  max_capacity INTEGER,
  current_bookings INTEGER DEFAULT 0,
  price DECIMAL NOT NULL DEFAULT 0,
  currency TEXT DEFAULT 'INR',
  is_published BOOLEAN DEFAULT false,
  is_cancelled BOOLEAN DEFAULT false,
  category TEXT,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger to auto-update updated_at on events
DROP TRIGGER IF EXISTS events_updated_at ON events;
CREATE TRIGGER events_updated_at
  BEFORE UPDATE ON events
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ==================================================
-- TICKET TYPES TABLE
-- ==================================================

CREATE TABLE IF NOT EXISTS ticket_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL NOT NULL,
  quantity_available INTEGER NOT NULL,
  quantity_sold INTEGER DEFAULT 0,
  max_per_order INTEGER DEFAULT 10,
  sale_start_date TIMESTAMPTZ,
  sale_end_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==================================================
-- BOOKINGS TABLE
-- ==================================================

CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) NOT NULL,
  event_id UUID REFERENCES events(id) NOT NULL,
  ticket_type_id UUID REFERENCES ticket_types(id),
  quantity INTEGER NOT NULL DEFAULT 1,
  total_amount DECIMAL NOT NULL,
  currency TEXT DEFAULT 'INR',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'refunded')),
  payment_intent_id TEXT,
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger to auto-update updated_at on bookings
DROP TRIGGER IF EXISTS bookings_updated_at ON bookings;
CREATE TRIGGER bookings_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ==================================================
-- TICKETS TABLE
-- ==================================================

CREATE TABLE IF NOT EXISTS tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id),
  event_id UUID REFERENCES events(id),
  ticket_type_id UUID REFERENCES ticket_types(id),
  qr_code TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'valid' CHECK (status IN ('valid', 'used', 'cancelled', 'expired')),
  checked_in_at TIMESTAMPTZ,
  checked_in_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==================================================
-- EVENT GROUPS TABLE (Chat Groups)
-- ==================================================

CREATE TABLE IF NOT EXISTS event_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Function to auto-create group when event is created
CREATE OR REPLACE FUNCTION create_event_group()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO event_groups (event_id, name, description)
  VALUES (NEW.id, NEW.title || ' Group', 'Chat group for ' || NEW.title);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to create group on event creation
DROP TRIGGER IF EXISTS on_event_created ON events;
CREATE TRIGGER on_event_created
  AFTER INSERT ON events
  FOR EACH ROW
  EXECUTE FUNCTION create_event_group();

-- ==================================================
-- GROUP MEMBERS TABLE
-- ==================================================

CREATE TABLE IF NOT EXISTS group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES event_groups(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('member', 'moderator', 'host')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(group_id, user_id)
);

-- Function to add host to group when event is created
CREATE OR REPLACE FUNCTION add_host_to_group()
RETURNS TRIGGER AS $$
DECLARE
  event_host_id UUID;
BEGIN
  SELECT host_id INTO event_host_id FROM events WHERE id = NEW.event_id;
  INSERT INTO group_members (group_id, user_id, role)
  VALUES (NEW.id, event_host_id, 'host');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to add host to group
DROP TRIGGER IF EXISTS on_group_created ON event_groups;
CREATE TRIGGER on_group_created
  AFTER INSERT ON event_groups
  FOR EACH ROW
  EXECUTE FUNCTION add_host_to_group();

-- ==================================================
-- MESSAGES TABLE (Group Chat)
-- ==================================================

CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES event_groups(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id),
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'system')),
  is_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==================================================
-- FRIEND REQUESTS TABLE
-- ==================================================

CREATE TABLE IF NOT EXISTS friend_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  receiver_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  responded_at TIMESTAMPTZ,
  UNIQUE(sender_id, receiver_id)
);

-- ==================================================
-- FRIENDSHIPS TABLE
-- ==================================================

CREATE TABLE IF NOT EXISTS friendships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id_1 UUID REFERENCES profiles(id) ON DELETE CASCADE,
  user_id_2 UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id_1, user_id_2),
  CHECK (user_id_1 < user_id_2) -- Ensure no duplicate pairs
);

-- Function to create friendship when friend request is accepted
CREATE OR REPLACE FUNCTION create_friendship()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'accepted' AND OLD.status = 'pending' THEN
    INSERT INTO friendships (user_id_1, user_id_2)
    VALUES (
      LEAST(NEW.sender_id, NEW.receiver_id),
      GREATEST(NEW.sender_id, NEW.receiver_id)
    )
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to create friendship on request acceptance
DROP TRIGGER IF EXISTS on_friend_request_accepted ON friend_requests;
CREATE TRIGGER on_friend_request_accepted
  AFTER UPDATE ON friend_requests
  FOR EACH ROW
  EXECUTE FUNCTION create_friendship();

-- ==================================================
-- DM CONVERSATIONS TABLE
-- ==================================================

CREATE TABLE IF NOT EXISTS dm_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id_1 UUID REFERENCES profiles(id) ON DELETE CASCADE,
  user_id_2 UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id_1, user_id_2),
  CHECK (user_id_1 < user_id_2)
);

-- Trigger to auto-update updated_at on dm_conversations
DROP TRIGGER IF EXISTS dm_conversations_updated_at ON dm_conversations;
CREATE TRIGGER dm_conversations_updated_at
  BEFORE UPDATE ON dm_conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ==================================================
-- DM MESSAGES TABLE
-- ==================================================

CREATE TABLE IF NOT EXISTS dm_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES dm_conversations(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES profiles(id),
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'image')),
  is_read BOOLEAN DEFAULT false,
  is_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==================================================

-- Enable RLS on all tables
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

-- PROFILES POLICIES
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE USING (auth.uid() = id);

-- HOST REQUESTS POLICIES
CREATE POLICY "Users can view own host requests"
  ON host_requests FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create host requests"
  ON host_requests FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can view all host requests"
  ON host_requests FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can update host requests"
  ON host_requests FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- EVENTS POLICIES
CREATE POLICY "Published events are viewable by everyone"
  ON events FOR SELECT USING (is_published = true OR host_id = auth.uid());

CREATE POLICY "Hosts can create events"
  ON events FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('host', 'admin'))
  );

CREATE POLICY "Hosts can update own events"
  ON events FOR UPDATE USING (host_id = auth.uid());

CREATE POLICY "Hosts can delete own events"
  ON events FOR DELETE USING (host_id = auth.uid());

-- TICKET TYPES POLICIES
CREATE POLICY "Anyone can view ticket types for published events"
  ON ticket_types FOR SELECT USING (
    EXISTS (SELECT 1 FROM events WHERE id = ticket_types.event_id AND (is_published = true OR host_id = auth.uid()))
  );

CREATE POLICY "Hosts can manage ticket types for own events"
  ON ticket_types FOR ALL USING (
    EXISTS (SELECT 1 FROM events WHERE id = ticket_types.event_id AND host_id = auth.uid())
  );

-- BOOKINGS POLICIES
CREATE POLICY "Users can view own bookings"
  ON bookings FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create bookings"
  ON bookings FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Hosts can view bookings for their events"
  ON bookings FOR SELECT USING (
    EXISTS (SELECT 1 FROM events WHERE id = bookings.event_id AND host_id = auth.uid())
  );

-- TICKETS POLICIES
CREATE POLICY "Users can view own tickets"
  ON tickets FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Hosts can view and update tickets for their events"
  ON tickets FOR ALL USING (
    EXISTS (SELECT 1 FROM events WHERE id = tickets.event_id AND host_id = auth.uid())
  );

-- EVENT GROUPS POLICIES
CREATE POLICY "Group members can view groups"
  ON event_groups FOR SELECT USING (
    EXISTS (SELECT 1 FROM group_members WHERE group_id = event_groups.id AND user_id = auth.uid())
  );

-- GROUP MEMBERS POLICIES
CREATE POLICY "Group members can view other members"
  ON group_members FOR SELECT USING (
    EXISTS (SELECT 1 FROM group_members gm WHERE gm.group_id = group_members.group_id AND gm.user_id = auth.uid())
  );

CREATE POLICY "Hosts can manage group members"
  ON group_members FOR ALL USING (
    EXISTS (
      SELECT 1 FROM group_members gm 
      WHERE gm.group_id = group_members.group_id 
        AND gm.user_id = auth.uid() 
        AND gm.role = 'host'
    )
  );

-- MESSAGES POLICIES
CREATE POLICY "Group members can view messages"
  ON messages FOR SELECT USING (
    EXISTS (SELECT 1 FROM group_members WHERE group_id = messages.group_id AND user_id = auth.uid())
  );

CREATE POLICY "Group members can send messages"
  ON messages FOR INSERT WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (SELECT 1 FROM group_members WHERE group_id = messages.group_id AND user_id = auth.uid())
  );

-- FRIEND REQUESTS POLICIES
CREATE POLICY "Users can view friend requests involving them"
  ON friend_requests FOR SELECT USING (
    sender_id = auth.uid() OR receiver_id = auth.uid()
  );

CREATE POLICY "Users can send friend requests"
  ON friend_requests FOR INSERT WITH CHECK (sender_id = auth.uid());

CREATE POLICY "Receivers can update friend requests"
  ON friend_requests FOR UPDATE USING (receiver_id = auth.uid());

-- FRIENDSHIPS POLICIES
CREATE POLICY "Users can view their friendships"
  ON friendships FOR SELECT USING (
    user_id_1 = auth.uid() OR user_id_2 = auth.uid()
  );

-- DM CONVERSATIONS POLICIES
CREATE POLICY "Users can view their DM conversations"
  ON dm_conversations FOR SELECT USING (
    user_id_1 = auth.uid() OR user_id_2 = auth.uid()
  );

CREATE POLICY "Users can create DM conversations with friends"
  ON dm_conversations FOR INSERT WITH CHECK (
    (user_id_1 = auth.uid() OR user_id_2 = auth.uid()) AND
    EXISTS (
      SELECT 1 FROM friendships 
      WHERE (user_id_1 = LEAST(dm_conversations.user_id_1, dm_conversations.user_id_2) 
         AND user_id_2 = GREATEST(dm_conversations.user_id_1, dm_conversations.user_id_2))
    )
  );

-- DM MESSAGES POLICIES
CREATE POLICY "Conversation participants can view DM messages"
  ON dm_messages FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM dm_conversations 
      WHERE id = dm_messages.conversation_id 
        AND (user_id_1 = auth.uid() OR user_id_2 = auth.uid())
    )
  );

CREATE POLICY "Conversation participants can send DM messages"
  ON dm_messages FOR INSERT WITH CHECK (
    sender_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM dm_conversations 
      WHERE id = dm_messages.conversation_id 
        AND (user_id_1 = auth.uid() OR user_id_2 = auth.uid())
    )
  );

CREATE POLICY "Users can update their own DM messages"
  ON dm_messages FOR UPDATE USING (sender_id = auth.uid());

-- ==================================================
-- INDEXES FOR PERFORMANCE
-- ==================================================

CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

CREATE INDEX IF NOT EXISTS idx_events_host_id ON events(host_id);
CREATE INDEX IF NOT EXISTS idx_events_type ON events(type);
CREATE INDEX IF NOT EXISTS idx_events_start_date ON events(start_date);
CREATE INDEX IF NOT EXISTS idx_events_is_published ON events(is_published);
CREATE INDEX IF NOT EXISTS idx_events_category ON events(category);

CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_event_id ON bookings(event_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);

CREATE INDEX IF NOT EXISTS idx_tickets_user_id ON tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_tickets_event_id ON tickets(event_id);
CREATE INDEX IF NOT EXISTS idx_tickets_qr_code ON tickets(qr_code);

CREATE INDEX IF NOT EXISTS idx_group_members_group_id ON group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user_id ON group_members(user_id);

CREATE INDEX IF NOT EXISTS idx_messages_group_id ON messages(group_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);

CREATE INDEX IF NOT EXISTS idx_friend_requests_sender_id ON friend_requests(sender_id);
CREATE INDEX IF NOT EXISTS idx_friend_requests_receiver_id ON friend_requests(receiver_id);

CREATE INDEX IF NOT EXISTS idx_dm_messages_conversation_id ON dm_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_dm_messages_created_at ON dm_messages(created_at);

-- ==================================================
-- REALTIME SUBSCRIPTIONS
-- ==================================================

-- Enable realtime for messages and dm_messages tables
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE dm_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE friend_requests;
