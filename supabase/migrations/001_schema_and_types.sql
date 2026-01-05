-- =====================================================
-- MIGRATION 001: Database Schema and Types (v2.1)
-- =====================================================
-- This migration creates the foundational database structure:
--   - All ENUM types (user roles, event types, host types, statuses)
--   - All tables with proper foreign keys and constraints
--   - All indexes for performance
--   - Permissions and grants
--
-- This consolidates:
--   - 001_initial_schema.sql (base tables and enums)
--   - 003_host_system_with_rls.sql (host_type enum and host_requests table)
--   - 002_system_enhancements.sql (qr_code optional fix)
--
-- NO functions, triggers, or RLS policies in this migration.
-- Run this first before any other migrations.
-- =====================================================

-- =====================================================
-- SECTION 1: CREATE ENUMS
-- =====================================================

DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS host_type CASCADE;
DROP TYPE IF EXISTS event_type CASCADE;
DROP TYPE IF EXISTS booking_status CASCADE;
DROP TYPE IF EXISTS payment_status CASCADE;
DROP TYPE IF EXISTS ticket_status CASCADE;
DROP TYPE IF EXISTS group_member_role CASCADE;
DROP TYPE IF EXISTS message_type CASCADE;
DROP TYPE IF EXISTS friend_request_status CASCADE;
DROP TYPE IF EXISTS host_request_status CASCADE;

-- User role types
CREATE TYPE user_role AS ENUM ('user', 'host', 'admin');
COMMENT ON TYPE user_role IS 'User access levels: user (standard), host (event creator), admin (full access)';

-- Host type (from migration 003)
CREATE TYPE host_type AS ENUM ('full', 'activity');
COMMENT ON TYPE host_type IS 'Host access levels: full (events/trips/activities), activity (activities only)';

-- Event types
CREATE TYPE event_type AS ENUM ('event', 'experience', 'trip');
COMMENT ON TYPE event_type IS 'Event categories: event (single event), experience (activity), trip (multi-day journey)';

-- Status enums
CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'cancelled', 'refunded');
CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'failed', 'refunded');
CREATE TYPE ticket_status AS ENUM ('valid', 'used', 'cancelled', 'expired');
CREATE TYPE group_member_role AS ENUM ('member', 'moderator', 'host');
CREATE TYPE message_type AS ENUM ('text', 'image', 'system');
CREATE TYPE friend_request_status AS ENUM ('pending', 'accepted', 'rejected');
CREATE TYPE host_request_status AS ENUM ('pending', 'approved', 'rejected');

-- =====================================================
-- SECTION 2: CREATE TABLES
-- =====================================================

-- -----------------------------------------------------
-- Profiles table (extends auth.users)
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  username TEXT UNIQUE,
  bio TEXT,
  avatar_url TEXT,
  phone TEXT,
  role user_role DEFAULT 'user' NOT NULL,
  
  -- Host-related fields (from migration 003)
  host_type host_type DEFAULT NULL,
  is_host_approved BOOLEAN DEFAULT FALSE NOT NULL,
  host_requested_at TIMESTAMPTZ,
  host_approved_at TIMESTAMPTZ,
  
  -- Privacy and metadata
  is_public BOOLEAN DEFAULT TRUE NOT NULL,
  location TEXT,
  website TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

COMMENT ON TABLE profiles IS 'User profiles extending auth.users with role and host information';
COMMENT ON COLUMN profiles.host_type IS 'Type of host access: full or activity. NULL for regular users.';
COMMENT ON COLUMN profiles.is_host_approved IS 'Whether user has been approved as a host by admin';

-- -----------------------------------------------------
-- Host requests table (comprehensive KYC from migration 003)
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS host_requests (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  requested_host_type host_type NOT NULL,
  
  -- Personal/Business Information
  organizer_name TEXT NOT NULL,
  contact_number TEXT NOT NULL,
  email TEXT NOT NULL,
  
  -- Address Details
  street_address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  pin_code TEXT NOT NULL,
  
  -- KYC Documents
  pan_number TEXT NOT NULL,
  gstin TEXT,
  
  -- Bank Account Details
  account_holder_name TEXT NOT NULL,
  beneficiary_name TEXT NOT NULL,
  account_number TEXT NOT NULL,
  ifsc_code TEXT NOT NULL,
  
  -- Document Upload Links
  pan_card_photo_url TEXT NOT NULL,
  gst_certificate_url TEXT,
  
  -- Admin Review Fields
  status host_request_status DEFAULT 'pending' NOT NULL,
  reviewed_by UUID REFERENCES profiles(id),
  reviewed_at TIMESTAMPTZ,
  admin_notes TEXT,
  rejection_reason TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Validation Constraints
  CONSTRAINT valid_phone CHECK (contact_number ~ '^\+?[0-9]{10,15}$'),
  CONSTRAINT valid_pan CHECK (pan_number ~ '^[A-Z]{5}[0-9]{4}[A-Z]{1}$'),
  CONSTRAINT valid_pin_code CHECK (pin_code ~ '^[0-9]{6}$'),
  CONSTRAINT valid_ifsc CHECK (ifsc_code ~ '^[A-Z]{4}0[A-Z0-9]{6}$'),
  CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

COMMENT ON TABLE host_requests IS 'Host access requests with complete KYC information';
COMMENT ON COLUMN host_requests.requested_host_type IS 'Type of host access requested: full or activity';
COMMENT ON COLUMN host_requests.organizer_name IS 'Name of organizer or company name for businesses';
COMMENT ON COLUMN host_requests.gstin IS 'GST Identification Number (optional for businesses)';
COMMENT ON COLUMN host_requests.pan_card_photo_url IS 'Cloud storage link to PAN card photo';
COMMENT ON COLUMN host_requests.gst_certificate_url IS 'Cloud storage link to GST certificate (optional)';

-- -----------------------------------------------------
-- Events table
-- -----------------------------------------------------
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

COMMENT ON TABLE events IS 'Events, experiences, and trips hosted on the platform';

-- -----------------------------------------------------
-- Ticket types table
-- -----------------------------------------------------
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

COMMENT ON TABLE ticket_types IS 'Different ticket types/tiers for events';

-- -----------------------------------------------------
-- Bookings table
-- -----------------------------------------------------
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

COMMENT ON TABLE bookings IS 'User bookings for events';

-- -----------------------------------------------------
-- Tickets table (qr_code made optional from migration 002)
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  ticket_type_id UUID REFERENCES ticket_types(id),
  qr_code TEXT UNIQUE,  -- Made optional (from migration 002)
  status ticket_status DEFAULT 'valid' NOT NULL,
  checked_in_at TIMESTAMPTZ,
  checked_in_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

COMMENT ON TABLE tickets IS 'Individual tickets generated from bookings';
COMMENT ON COLUMN tickets.qr_code IS 'QR code for ticket validation (optional, generated on confirmation)';

-- -----------------------------------------------------
-- Event groups (chat groups for events)
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS event_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

COMMENT ON TABLE event_groups IS 'Chat groups associated with events';

-- -----------------------------------------------------
-- Group members table
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES event_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role group_member_role DEFAULT 'member' NOT NULL,
  joined_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  last_read_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,  -- From migration 006
  UNIQUE(group_id, user_id)
);

COMMENT ON TABLE group_members IS 'Members of event chat groups';
COMMENT ON COLUMN group_members.last_read_at IS 'Timestamp when user last read messages (for unread tracking)';

-- -----------------------------------------------------
-- Messages table (for group chats)
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES event_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  message_type message_type DEFAULT 'text' NOT NULL,
  is_deleted BOOLEAN DEFAULT FALSE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

COMMENT ON TABLE messages IS 'Messages in event group chats';

-- -----------------------------------------------------
-- Friend requests table
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS friend_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status friend_request_status DEFAULT 'pending' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  responded_at TIMESTAMPTZ,
  UNIQUE(sender_id, receiver_id)
);

COMMENT ON TABLE friend_requests IS 'Friend connection requests between users';

-- -----------------------------------------------------
-- Friendships table
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS friendships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id_1 UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  user_id_2 UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(user_id_1, user_id_2)
);

COMMENT ON TABLE friendships IS 'Established friendships between users';

-- -----------------------------------------------------
-- DM conversations table
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS dm_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id_1 UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  user_id_2 UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(user_id_1, user_id_2)
);

COMMENT ON TABLE dm_conversations IS 'Direct message conversations between users';

-- -----------------------------------------------------
-- DM messages table
-- -----------------------------------------------------
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

COMMENT ON TABLE dm_messages IS 'Direct messages between users';

-- =====================================================
-- SECTION 3: CREATE INDEXES FOR PERFORMANCE
-- =====================================================

-- Profile indexes
DROP INDEX IF EXISTS idx_profiles_role;
DROP INDEX IF EXISTS idx_profiles_username;
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_username ON profiles(username);

-- Host request indexes
DROP INDEX IF EXISTS idx_host_requests_user_id;
DROP INDEX IF EXISTS idx_host_requests_status;
DROP INDEX IF EXISTS idx_host_requests_type;
DROP INDEX IF EXISTS idx_host_requests_created_at;
CREATE INDEX idx_host_requests_user_id ON host_requests(user_id);
CREATE INDEX idx_host_requests_status ON host_requests(status);
CREATE INDEX idx_host_requests_type ON host_requests(requested_host_type);
CREATE INDEX idx_host_requests_created_at ON host_requests(created_at DESC);

-- Event indexes
DROP INDEX IF EXISTS idx_events_host_id;
DROP INDEX IF EXISTS idx_events_start_date;
DROP INDEX IF EXISTS idx_events_is_published;
DROP INDEX IF EXISTS idx_events_type;
CREATE INDEX idx_events_host_id ON events(host_id);
CREATE INDEX idx_events_start_date ON events(start_date);
CREATE INDEX idx_events_is_published ON events(is_published);
CREATE INDEX idx_events_type ON events(type);

-- Booking indexes
DROP INDEX IF EXISTS idx_bookings_user_id;
DROP INDEX IF EXISTS idx_bookings_event_id;
DROP INDEX IF EXISTS idx_bookings_status;
CREATE INDEX idx_bookings_user_id ON bookings(user_id);
CREATE INDEX idx_bookings_event_id ON bookings(event_id);
CREATE INDEX idx_bookings_status ON bookings(status);

-- Ticket indexes
DROP INDEX IF EXISTS idx_tickets_user_id;
DROP INDEX IF EXISTS idx_tickets_event_id;
DROP INDEX IF EXISTS idx_tickets_qr_code;
DROP INDEX IF EXISTS idx_tickets_booking_id;
CREATE INDEX idx_tickets_user_id ON tickets(user_id);
CREATE INDEX idx_tickets_event_id ON tickets(event_id);
CREATE INDEX idx_tickets_qr_code ON tickets(qr_code);
CREATE INDEX idx_tickets_booking_id ON tickets(booking_id);

-- Group and message indexes
DROP INDEX IF EXISTS idx_messages_group_id;
DROP INDEX IF EXISTS idx_messages_created_at;
DROP INDEX IF EXISTS idx_group_members_group_id;
DROP INDEX IF EXISTS idx_group_members_user_id;
DROP INDEX IF EXISTS idx_group_members_last_read;
CREATE INDEX idx_messages_group_id ON messages(group_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);
CREATE INDEX idx_group_members_group_id ON group_members(group_id);
CREATE INDEX idx_group_members_user_id ON group_members(user_id);
CREATE INDEX idx_group_members_last_read ON group_members(group_id, user_id, last_read_at);

-- DM indexes
DROP INDEX IF EXISTS idx_dm_messages_conversation_id;
DROP INDEX IF EXISTS idx_dm_messages_created_at;
CREATE INDEX idx_dm_messages_conversation_id ON dm_messages(conversation_id);
CREATE INDEX idx_dm_messages_created_at ON dm_messages(created_at);

-- =====================================================
-- SECTION 4: ENABLE ROW LEVEL SECURITY
-- =====================================================
-- Just enable RLS, policies will be created in migration 003

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
-- SECTION 5: GRANT PERMISSIONS
-- =====================================================

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- =====================================================
-- SECTION 6: UPDATE EXISTING DATA
-- =====================================================

-- Set all existing hosts to 'full' type by default (from migration 003)
UPDATE profiles
SET host_type = 'full'
WHERE role = 'host' AND host_type IS NULL;

-- Update existing tickets with default QR codes (from migration 002)
UPDATE tickets 
SET qr_code = 'TKT-' || id::text 
WHERE qr_code IS NULL;

-- =====================================================
-- Migration Complete!
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Migration 001: Schema and Types created successfully';
  RAISE NOTICE '   - All enums created (user_role, host_type, event_type, etc.)';
  RAISE NOTICE '   - All tables created with proper constraints';
  RAISE NOTICE '   - All indexes created for performance';
  RAISE NOTICE '   - RLS enabled on all tables';
  RAISE NOTICE '';
  RAISE NOTICE '📌 Next: Run migration 002_core_functions.sql';
END;
$$;
