# ArzKaro - Event Hosting & Booking Application Roadmap

## 📋 Project Overview

ArzKaro is a comprehensive event hosting and booking platform built with **React Native (Expo)** and **Supabase**. The application enables users to discover, book, and attend events, experiences, and trips while providing hosts with tools to create and manage their offerings.

### Core User Roles

| Role | Description | Capabilities |
|------|-------------|--------------||
| **User** | Regular authenticated user | Book tickets, pay for events, receive QR tickets, join event groups, send friend requests, DM other users |
| **Host** | Verified user with hosting privileges | Create events/experiences/trips, manage event groups, manage group members, all User capabilities |
| **Admin** | Super user with full access | Manage users, hosts, events, groups, elevated privileges, all Host capabilities |

### Test User Roles (Development)

For development and testing purposes, the following email addresses are pre-assigned specific roles:

| Email | Role | Purpose |
|-------|------|---------||
| dinesh.1124k@gmail.com | Admin | Full administrative access |
| rrucnamra@gmail.com | Host | Host testing and event management |
| All other emails | User | Regular user testing |

---

## 🛠️ Technology Stack

### Current Stack (Already Implemented)

- **Frontend**: React Native 0.81.5 with Expo SDK 54
- **Navigation**: Expo Router v6
- **Backend**: Supabase (Authentication, Database)
- **Authentication**: Google OAuth via Supabase
- **State Management**: React Context API
- **Package Manager**: pnpm
- **Language**: TypeScript 5.9

### Required Additional Technologies

| Category | Technology | Purpose |
|----------|------------|---------||
| **Payments** | Razorpay React Native SDK | Process ticket payments (production - not in MVP) |
| **QR Codes** | `react-native-qrcode-svg` | Generate ticket QR codes |
| **QR Scanner** | `expo-camera` / `expo-barcode-scanner` | Scan tickets at events |
| **Realtime** | Supabase Realtime | Group chat & DM functionality |
| **Storage** | Supabase Storage | Event images, user avatars |
| **Push Notifications** | Expo Notifications | Event updates, chat notifications, friend requests |
| **Forms** | React Hook Form + Zod | Form validation |
| **UI Components** | Custom Design System (hardcoded theme) | Consistent single-theme UI |
| **Date/Time** | `date-fns` or `dayjs` | Date manipulation |
| **Image Picker** | `expo-image-picker` | Upload event/profile images |

---

## 📁 Recommended Folder Structure (Kebab-Case)

```
arzkaro/
├── app/                              # Expo Router pages
│   ├── _layout.tsx
│   ├── index.tsx
│   ├── (auth)/
│   │   ├── _layout.tsx
│   │   ├── sign-in.tsx
│   │   └── callback.tsx
│   ├── (tabs)/
│   │   ├── _layout.tsx
│   │   ├── home.tsx
│   │   ├── explore.tsx
│   │   ├── bookings.tsx
│   │   ├── chats.tsx
│   │   └── profile.tsx
│   ├── users/
│   │   └── [id].tsx                  # Public user profile
│   ├── messages/
│   │   ├── index.tsx                 # DM conversations list
│   │   └── [id].tsx                  # DM chat with user
│   ├── friends/
│   │   ├── index.tsx                 # Friends list
│   │   └── requests.tsx              # Friend requests
│   ├── events/
│   │   ├── _layout.tsx
│   │   ├── [id].tsx                  # Event details
│   │   ├── create.tsx                # Create event (host)
│   │   └── [id]/
│   │       ├── book.tsx              # Booking flow
│   │       ├── chat.tsx              # Event group chat
│   │       ├── members.tsx           # Group members list
│   │       └── manage.tsx            # Manage event (host)
│   ├── experiences/
│   │   ├── [id].tsx
│   │   └── create.tsx
│   ├── trips/
│   │   ├── [id].tsx
│   │   └── create.tsx
│   ├── tickets/
│   │   ├── index.tsx                 # My tickets
│   │   └── [id].tsx                  # Ticket details with QR
│   ├── host/
│   │   ├── _layout.tsx
│   │   ├── dashboard.tsx
│   │   ├── events.tsx
│   │   ├── request.tsx               # Host application
│   │   └── analytics.tsx
│   └── admin/
│       ├── _layout.tsx
│       ├── dashboard.tsx
│       ├── users.tsx
│       ├── hosts.tsx
│       ├── host-requests.tsx
│       └── events.tsx
├── src/
│   ├── components/
│   │   ├── ui/                       # Base UI components
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── input.tsx
│   │   │   ├── modal.tsx
│   │   │   └── loading-spinner.tsx
│   │   ├── events/
│   │   │   ├── event-card.tsx
│   │   │   ├── event-list.tsx
│   │   │   ├── event-details-header.tsx
│   │   │   ├── event-booking-form.tsx
│   │   │   └── event-create-form.tsx
│   │   ├── tickets/
│   │   │   ├── ticket-card.tsx
│   │   │   ├── ticket-qr-code.tsx
│   │   │   └── ticket-scanner.tsx
│   │   ├── chat/
│   │   │   ├── chat-message.tsx
│   │   │   ├── chat-input.tsx
│   │   │   ├── chat-list.tsx
│   │   │   ├── chat-room.tsx
│   │   │   ├── dm-conversation.tsx
│   │   │   └── dm-list.tsx
│   │   ├── friends/
│   │   │   ├── friend-request-card.tsx
│   │   │   ├── friend-list-item.tsx
│   │   │   └── friend-actions.tsx
│   │   ├── profile/
│   │   │   ├── user-profile-header.tsx
│   │   │   ├── user-profile-stats.tsx
│   │   │   └── profile-action-buttons.tsx
│   │   ├── host/
│   │   │   ├── host-application-form.tsx
│   │   │   ├── host-stats-card.tsx
│   │   │   └── event-management-card.tsx
│   │   ├── admin/
│   │   │   ├── user-management-table.tsx
│   │   │   ├── host-request-card.tsx
│   │   │   └── admin-stats-dashboard.tsx
│   │   └── shared/
│   │       ├── user-avatar.tsx
│   │       ├── image-picker.tsx
│   │       ├── date-time-picker.tsx
│   │       └── search-bar.tsx
│   ├── contexts/
│   │   ├── auth-context.tsx
│   │   ├── chat-context.tsx
│   │   └── notification-context.tsx
│   ├── hooks/
│   │   ├── use-auth.ts
│   │   ├── use-events.ts
│   │   ├── use-bookings.ts
│   │   ├── use-tickets.ts
│   │   ├── use-chat.ts
│   │   ├── use-dm.ts
│   │   ├── use-friends.ts
│   │   ├── use-realtime.ts
│   │   └── use-storage.ts
│   ├── services/
│   │   ├── event-service.ts
│   │   ├── booking-service.ts
│   │   ├── payment-service.ts
│   │   ├── ticket-service.ts
│   │   ├── chat-service.ts
│   │   ├── dm-service.ts
│   │   ├── friend-service.ts
│   │   ├── host-service.ts
│   │   └── admin-service.ts
│   ├── constants/
│   │   ├── colors.ts
│   │   ├── styles.ts
│   │   └── config.ts
│   ├── types/
│   │   ├── event.types.ts
│   │   ├── user.types.ts
│   │   ├── booking.types.ts
│   │   ├── ticket.types.ts
│   │   └── chat.types.ts
│   └── utils/
│       ├── date-utils.ts
│       ├── format-utils.ts
│       ├── validation-utils.ts
│       └── qr-utils.ts
├── backend/
│   ├── supabase.ts
│   ├── auth.ts
│   ├── types/
│   │   └── database.types.ts
│   └── supabase/
│       ├── migrations/               # Database migrations
│       └── functions/                # Edge functions
└── docs/
    ├── ROADMAP.md
    ├── DEVELOPMENT_WORKFLOW.md
    └── API.md
```

---

## 🗄️ Database Schema Design

### Core Tables

```sql
-- User profiles extending Supabase auth.users
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
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

-- Assign roles based on email for testing
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

CREATE TRIGGER on_profile_created
  BEFORE INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION assign_user_role();

-- Host applications
CREATE TABLE host_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  reason TEXT NOT NULL,
  business_name TEXT,
  business_type TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by UUID REFERENCES profiles(id),
  reviewed_at TIMESTAMPTZ,
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Events, experiences, trips (polymorphic)
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id UUID REFERENCES profiles(id) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('event', 'experience', 'trip')),
  title TEXT NOT NULL,
  description TEXT,
  short_description TEXT,
  cover_image_url TEXT,
  images TEXT[],
  location_name TEXT,
  location_address TEXT,
  location_lat DECIMAL,
  location_lng DECIMAL,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  timezone TEXT DEFAULT 'UTC',
  max_capacity INTEGER,
  current_bookings INTEGER DEFAULT 0,
  price DECIMAL NOT NULL,
  currency TEXT DEFAULT 'INR',
  is_published BOOLEAN DEFAULT false,
  is_cancelled BOOLEAN DEFAULT false,
  category TEXT,
  tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ticket types for events
CREATE TABLE ticket_types (
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

-- Bookings
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) NOT NULL,
  event_id UUID REFERENCES events(id) NOT NULL,
  ticket_type_id UUID REFERENCES ticket_types(id),
  quantity INTEGER NOT NULL DEFAULT 1,
  total_amount DECIMAL NOT NULL,
  currency TEXT DEFAULT 'INR',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'refunded')),
  payment_intent_id TEXT,
  payment_status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tickets (individual tickets from bookings)
CREATE TABLE tickets (
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

-- Event group chats
CREATE TABLE event_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Group members
CREATE TABLE group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES event_groups(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('member', 'moderator', 'host')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(group_id, user_id)
);

-- Chat messages (for group chats)
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES event_groups(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id),
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'system')),
  is_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Friend requests
CREATE TABLE friend_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  receiver_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  responded_at TIMESTAMPTZ,
  UNIQUE(sender_id, receiver_id)
);

-- Friendships (created when friend request is accepted)
CREATE TABLE friendships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id_1 UUID REFERENCES profiles(id) ON DELETE CASCADE,
  user_id_2 UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id_1, user_id_2),
  CHECK (user_id_1 < user_id_2) -- Ensure no duplicate pairs
);

-- DM conversations
CREATE TABLE dm_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id_1 UUID REFERENCES profiles(id) ON DELETE CASCADE,
  user_id_2 UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id_1, user_id_2),
  CHECK (user_id_1 < user_id_2)
);

-- DM messages
CREATE TABLE dm_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES dm_conversations(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES profiles(id),
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'image')),
  is_read BOOLEAN DEFAULT false,
  is_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Row Level Security (RLS) Policies

```sql
-- Profiles: Users can read all, update own
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE USING (auth.uid() = id);

-- Events: Public read, host/admin write
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Published events are viewable by everyone"
  ON events FOR SELECT USING (is_published = true OR host_id = auth.uid());

CREATE POLICY "Hosts can create events"
  ON events FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('host', 'admin'))
  );

CREATE POLICY "Hosts can update own events"
  ON events FOR UPDATE USING (host_id = auth.uid());

-- Bookings: Users can see own bookings
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own bookings"
  ON bookings FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create bookings"
  ON bookings FOR INSERT WITH CHECK (user_id = auth.uid());

-- Messages: Group members can read/write
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Group members can view messages"
  ON messages FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_id = messages.group_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Group members can send messages"
  ON messages FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_id = messages.group_id AND user_id = auth.uid()
    )
  );

-- Friend requests: Users can view their own requests
ALTER TABLE friend_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view friend requests involving them"
  ON friend_requests FOR SELECT USING (
    sender_id = auth.uid() OR receiver_id = auth.uid()
  );

CREATE POLICY "Users can send friend requests"
  ON friend_requests FOR INSERT WITH CHECK (sender_id = auth.uid());

CREATE POLICY "Receivers can update friend requests"
  ON friend_requests FOR UPDATE USING (receiver_id = auth.uid());

-- Friendships: Users can view their friendships
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their friendships"
  ON friendships FOR SELECT USING (
    user_id_1 = auth.uid() OR user_id_2 = auth.uid()
  );

-- DM Conversations: Users can view their conversations
ALTER TABLE dm_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their DM conversations"
  ON dm_conversations FOR SELECT USING (
    user_id_1 = auth.uid() OR user_id_2 = auth.uid()
  );

CREATE POLICY "Users can create DM conversations with friends"
  ON dm_conversations FOR INSERT WITH CHECK (
    (user_id_1 = auth.uid() OR user_id_2 = auth.uid()) AND
    EXISTS (
      SELECT 1 FROM friendships
      WHERE (user_id_1 = dm_conversations.user_id_1 AND user_id_2 = dm_conversations.user_id_2)
         OR (user_id_1 = dm_conversations.user_id_2 AND user_id_2 = dm_conversations.user_id_1)
    )
  );

-- DM Messages: Conversation participants can read/write
ALTER TABLE dm_messages ENABLE ROW LEVEL SECURITY;

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
```

---

## 📅 Development Phases

### Phase 1: Foundation & Core Infrastructure

**Goal**: Set up the project foundation with proper architecture

#### 1.1 Project Restructuring

- [ ] Refactor folder structure to kebab-case naming convention
- [ ] Set up proper component organization
- [ ] Configure path aliases in `tsconfig.json`
- [ ] Set up ESLint rules for file naming conventions

#### 1.2 Database Setup

- [ ] Create Supabase database migrations
- [ ] Set up all core tables (profiles, events, bookings, tickets)
- [ ] Implement Row Level Security (RLS) policies
- [ ] Generate TypeScript types from Supabase schema
- [ ] Create database functions and triggers

#### 1.3 Authentication Enhancement

- [ ] **DO NOT MODIFY** - Current Google OAuth implementation is working properly
- [ ] Implement automatic user profile creation on signup with role assignment
- [ ] Add role-based authentication checks (user/host/admin)
- [ ] Create auth guards for protected routes (host/admin screens)
- [ ] Test with assigned roles: admin (dinesh.1124k@gmail.com), host (rrucnamra@gmail.com)

#### 1.4 Design System Enhancement

- [ ] Implement single hardcoded color theme (no theme switching)
- [ ] Create comprehensive UI component library with fixed colors
- [ ] Build common form components
- [ ] Create loading states and skeleton screens
- [ ] Define app-wide color palette in constants

**Deliverables**:

- Fully structured codebase
- Complete database schema with RLS
- Enhanced authentication flow
- Core UI component library

---

### Phase 2: User Features - Event Discovery & Browsing

**Goal**: Enable users to discover and explore events

#### 2.1 Home Screen

- [ ] Create featured events carousel
- [ ] Implement event categories section
- [ ] Build nearby events section (location-based)
- [ ] Add upcoming events timeline

#### 2.2 Event Listing & Search

- [ ] Build event list view with filters
- [ ] Implement search functionality
- [ ] Add category filtering
- [ ] Create date/location filters
- [ ] Implement infinite scroll pagination

#### 2.3 Event Details

- [ ] Design event details screen
- [ ] Show event images gallery
- [ ] Display event information (date, location, price)
- [ ] Show host information with link to public profile
- [ ] Add "View Group Members" button for event attendees

#### 2.4 Tab Navigation

- [ ] Set up bottom tab navigation
- [ ] Create Explore, Chats, Tickets, Profile tabs
- [ ] Implement proper navigation stack for each tab

**Deliverables**:

- Complete event discovery experience
- Search and filter functionality
- Event details view
- Tab-based navigation

---

### Phase 3: Booking & Ticket System (MVP - No Payment)

**Goal**: Enable ticket booking and generation (skip payment for MVP)

#### 3.1 Payment Integration (Production Only - Skip for MVP)

- [ ] **FUTURE**: Install and configure Razorpay React Native SDK
- [ ] **FUTURE**: Set up Razorpay backend integration
- [ ] **FUTURE**: Configure payment methods (cards, UPI, wallets)
- [ ] **FUTURE**: Implement payment gateway
- [ ] **FUTURE**: Set up webhook handling for payment events

#### 3.2 Booking Flow (MVP)

- [ ] Create ticket selection UI
- [ ] Build booking summary screen
- [ ] Implement attendee information form
- [ ] **Skip payment step - auto-confirm booking**
- [ ] Redirect directly to ticket screen after booking

#### 3.3 Booking Confirmation (MVP)

- [ ] Auto-confirm bookings without payment
- [ ] Generate ticket immediately after booking
- [ ] Add user to event group automatically
- [ ] Show booking confirmation
- [ ] Store booking records in database with 'confirmed' status

#### 3.4 Booking Management

- [ ] Create "Tickets" screen
- [ ] Show booking history

**Deliverables**:

- End-to-end booking flow (no payment)
- Auto-ticket generation
- Booking management screens
- Auto-addition to event groups

---

### Phase 4: Ticket Generation & QR System

**Goal**: Generate and manage digital tickets with QR codes

#### 4.1 QR Code Generation

- [ ] Install `react-native-qrcode-svg`
- [ ] Generate unique ticket QR codes
- [ ] Store QR data securely in database
- [ ] Implement ticket validation logic

#### 4.2 Ticket Display

- [ ] Create digital ticket UI
- [ ] Display QR code prominently
- [ ] Show event details on ticket
- [ ] Add ticket to Apple Wallet / Google Pay (optional)
- [ ] Implement offline ticket access

#### 4.3 Ticket Scanner (for Hosts)

- [ ] Implement camera-based QR scanner using `expo-camera`
- [ ] Validate scanned tickets against database
- [ ] Show validation result (valid/invalid/used)
- [ ] Record check-in timestamps
- [ ] Handle offline scanning scenarios

**Deliverables**:

- QR code ticket generation
- Digital ticket display
- Host ticket scanner
- Check-in system

---

### Phase 5: Host Features

**Goal**: Enable hosts to create and manage events

#### 5.1 Host Application System

- [ ] Create host application form
- [ ] Implement application submission flow
- [ ] Build application status tracking
- [ ] Send notifications on status change

#### 5.2 Event Creation

- [ ] Build multi-step event creation form
- [ ] Implement image upload with Supabase Storage
- [ ] Add location picker/autocomplete
- [ ] Create date/time picker
- [ ] Set up ticket type configuration
- [ ] Implement event preview

#### 5.3 Event Management

- [ ] Create host dashboard
- [ ] Build event edit functionality
- [ ] Implement event publish/unpublish
- [ ] Add event cancellation flow
- [ ] Show booking statistics
- [ ] Create attendee list view

#### 5.4 Host Analytics

- [ ] Display revenue statistics
- [ ] Implement sales reports

**Deliverables**:

- Host application flow
- Event creation wizard
- Event management dashboard
- Basic analytics

---

### Phase 6: Group Chat & Realtime Features

**Goal**: Implement event group chats using Supabase Realtime

#### 6.1 Supabase Realtime Setup

- [ ] Configure Supabase Realtime channels
- [ ] Set up Realtime authorization policies
- [ ] Implement connection management
- [ ] Handle reconnection scenarios

#### 6.2 Auto Group Creation

- [ ] Create database trigger for auto-creating groups on event creation
- [ ] Implement auto-adding host as group admin
- [ ] Auto-add users to group on successful booking

#### 6.3 Chat Interface

- [ ] Build chat room UI
- [ ] Implement message list with infinite scroll
- [ ] Create message input with send functionality
- [ ] Add typing indicators
- [ ] Implement message timestamps

#### 6.4 Group Management

- [ ] Allow hosts to manage group members (remove/moderate)
- [ ] Implement member removal by hosts
- [ ] Create group info screen with member list
- [ ] Show member list with clickable profiles
- [ ] Add "Send Friend Request" option from member list
- [ ] Enable viewing other members' public profiles

#### 6.5 Chat List

- [ ] Build chat list screen
- [ ] Show unread message counts
- [ ] Add last message preview

#### 6.6 Friend Requests & DM System

- [ ] Implement friend request send functionality
- [ ] Build friend request inbox (pending/accepted/rejected)
- [ ] Create accept/reject friend request actions
- [ ] Store friendships in database on acceptance
- [ ] Enable DM conversation creation between friends
- [ ] Build DM chat interface (similar to group chat)
- [ ] Implement DM notifications
- [ ] Create friends list screen
- [ ] Add "Send Message" option for friends

**Deliverables**:

- Realtime group chat
- Auto group creation/membership
- Chat management for hosts
- Friend request system
- Private DM functionality
- Chat list with notifications

---

### Phase 7: Admin Panel

**Goal**: Build administrative controls for super users

#### 7.1 Admin Dashboard

- [ ] Create admin-only navigation/routes
- [ ] Build overview dashboard with key metrics
- [ ] Show platform statistics

#### 7.2 User Management

- [ ] Create user listing with search/filter
- [ ] Implement user detail view
- [ ] Add role management (promote to host/admin, demote)
- [ ] Build user suspension functionality
- [ ] View and manage all friendships
- [ ] Monitor DM conversations (if needed)

#### 7.3 Host Request Management

- [ ] Create host requests queue
- [ ] Build request review interface
- [ ] Implement approve/reject functionality

#### 7.4 Event & Group Oversight

- [ ] Create all events view
- [ ] Implement event moderation
- [ ] Add featured event management
- [ ] Build event removal functionality
- [ ] View all event groups and members
- [ ] Manage group members across all groups
- [ ] Remove inappropriate messages from any group/DM

**Deliverables**:

- Admin dashboard
- User management
- Host request processing
- Platform oversight tools

---

### Phase 8: Push Notifications

**Goal**: Implement push notifications for key events

#### 8.1 Expo Notifications Setup

- [ ] Configure `expo-notifications`
- [ ] Set up push notification tokens
- [ ] Store tokens in database
- [ ] Implement token refresh

#### 8.2 Notification Types

- [ ] Booking confirmation notifications
- [ ] Event reminder notifications
- [ ] Group chat message notifications
- [ ] DM message notifications
- [ ] Friend request notifications (sent/accepted/rejected)
- [ ] Host request status updates
- [ ] Event updates/changes
- [ ] Group member added/removed notifications

**Deliverables**:

- Push notification system
- Notification preferences
- Deep linking from notifications

---

### Phase 9: Polish & Optimization

**Goal**: Refine the app for production readiness

#### 9.1 Performance Optimization

- [ ] Implement image optimization
- [ ] Add list virtualization
- [ ] Optimize database queries
- [ ] Implement caching strategies
- [ ] Reduce bundle size

#### 9.2 Error Handling

- [ ] Implement global error boundary
- [ ] Add offline state handling
- [ ] Create user-friendly error messages

**Deliverables**:

- Optimized performance
- Comprehensive error handling

---

## 🔐 Environment Variables

Required environment configuration:

```env
# Supabase
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Razorpay (Production only - not needed for MVP)
EXPO_PUBLIC_RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret (backend only)
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret (backend only)

# Google OAuth
GOOGLE_CLIENT_ID_IOS=your_google_ios_client_id
GOOGLE_CLIENT_ID_ANDROID=your_google_android_client_id
GOOGLE_CLIENT_ID_WEB=your_google_web_client_id
```

---

## 📊 Success Metrics

| Metric                 | Target      |
| ---------------------- | ----------- |
| App Load Time          | < 3 seconds |
| Payment Success Rate   | > 95%       |
| Chat Message Delivery  | < 500ms     |
| Ticket Scan Time       | < 2 seconds |
| App Crash Rate         | < 1%        |
| User Retention (7-day) | > 30%       |

---

## 🚀 Post-Launch Roadmap (Future Phases)

### Phase 10: Public User Profiles

**Goal**: Implement public user profiles viewable by all users

- [ ] Create public profile screen layout
- [ ] Display user information (name, bio, avatar, location)
- [ ] Show user statistics (events attended, hosted events for hosts)
- [ ] Add "Send Friend Request" button (if not friends)
- [ ] Add "Send Message" button (if already friends)
- [ ] Show mutual friends
- [ ] Display privacy settings toggle
- [ ] Implement profile edit functionality

**Deliverables**:

- Public user profile pages
- Friend request integration
- Profile statistics
- Privacy controls

---

## 🚀 Post-Launch Roadmap (Future Phases)

### Phase 11: Advanced Features

- [ ] Event recommendations using ML
- [ ] Social features (follow hosts, share events)
- [ ] Event reviews and ratings
- [ ] Multi-language support

### Phase 12: Business Features

- [ ] Multiple ticket tiers
- [ ] Early bird pricing
- [ ] Waitlist functionality
- [ ] Recurring events
- [ ] Event series

### Phase 13: Platform Expansion

- [ ] Web application
- [ ] Host mobile app (separate)
- [ ] Admin dashboard web app
- [ ] API for third-party integrations

---

## 📞 Support & Resources

- **Supabase Docs**: https://supabase.com/docs
- **Expo Docs**: https://docs.expo.dev
- **Razorpay React Native**: https://razorpay.com/docs/payments/payment-gateway/react-native-integration/
- **React Navigation**: https://reactnavigation.org/docs
- **Expo Router**: https://docs.expo.dev/router/introduction

---

_Last Updated: December 4, 2025_
_Version: 1.0.0_
