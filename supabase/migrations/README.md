# Database Migrations

This directory contains all database migrations for the ArzKaro event platform.

## Migration Files

### 001_initial_schema.sql
**Status**: ✅ Applied  
**Description**: Complete initial database schema

**Includes**:
- All core tables (profiles, events, bookings, tickets, etc.)
- User roles: `user`, `host`, `admin`
- Event types: `event`, `experience`, `trip`
- Booking and payment status enums
- Complete RLS (Row Level Security) policies
- Performance indexes on all tables
- Triggers for `updated_at` timestamps
- Auto-profile creation on user signup
- Fixed RLS policies to prevent infinite recursion
- Admin permissions for profile updates

**Tables Created**:
- `profiles` - User profiles extending auth.users
- `host_requests` - Basic host access requests
- `events` - Events, experiences, and trips
- `ticket_types` - Different ticket tiers for events
- `bookings` - User bookings for events
- `tickets` - Individual tickets with QR codes
- `event_groups` - Chat groups for events
- `group_members` - Group membership
- `messages` - Group chat messages
- `friend_requests` - Friend request system
- `friendships` - Active friendships
- `dm_conversations` - Direct message conversations
- `dm_messages` - Direct messages

---

### 002_host_system_and_automation.sql
**Status**: ✅ Applied  
**Description**: Multi-tier host system with KYC, automation, and cleanup

**Includes**:

#### Part 1: Multi-Tier Host System
- **Host Types**: `full` (events + trips + activities) and `activity` (activities only)
- Added `host_type` column to `profiles` table
- Rebuilt `host_requests` table with comprehensive KYC fields:
  - Personal info: organizer name, contact, email
  - Address: street, city, state, PIN code
  - KYC docs: PAN, GSTIN (optional)
  - Bank details: account holder, beneficiary, account number, IFSC
  - Document URLs: PAN card photo, GST certificate (optional)
  - Admin review: status, reviewer, notes, rejection reason
- Database-level validation:
  - Phone: `^\+?[0-9]{10,15}$`
  - PAN: `^[A-Z]{5}[0-9]{4}[A-Z]{1}$`
  - IFSC: `^[A-Z]{4}0[A-Z0-9]{6}$`
  - PIN: `^[0-9]{6}$`
  - Email: valid email format
- RLS policies for host_requests with admin access
- Database functions:
  - `approve_host_request()` - Atomically approves request and updates profile
  - `reject_host_request()` - Rejects request with reason
  - `check_event_creation_permission()` - Enforces host type permissions
  - `can_user_create_event_type()` - Checks if user can create event type
  - `get_pending_host_requests_count()` - Returns count for admin dashboard
- Database trigger: `enforce_event_creation_permission` on events table

**Permission Matrix**:
| User Type       | Events | Trips | Experiences |
|-----------------|--------|-------|-------------|
| Normal User     | ❌     | ❌    | ❌          |
| Activity Host   | ❌     | ❌    | ✅          |
| Full Host       | ✅     | ✅    | ✅          |
| Admin           | ✅     | ✅    | ✅          |

#### Part 2: Ticket Auto-Generation
- Made `qr_code` column optional in tickets table
- Updated RLS policies to allow trigger-based insertions
- Functions:
  - `auto_generate_tickets()` - Creates tickets on booking confirmation
    - Generates N tickets (N = booking quantity)
    - Auto-generates QR codes in format: `TKT-{UUID}-{COUNTER}`
    - Updates event `current_bookings` count
    - Handles booking cancellations (marks tickets as cancelled)
  - `auto_create_event_group()` - Creates group chat when event is published
    - Creates event group with name: "{Event Title} - Group Chat"
    - Adds host as group member with 'host' role
- Triggers:
  - `trigger_auto_generate_tickets` on bookings (AFTER INSERT/UPDATE)
  - `trigger_auto_create_event_group` on events (AFTER INSERT/UPDATE)

#### Part 3: Cleanup Functions
- `delete_expired_event_groups()` - Deletes event groups for expired events
  - Deletes group members first (foreign key constraint)
  - Deletes all messages in expired groups
  - Deletes expired event groups
  - Returns count of deleted groups
  - Can be run manually or scheduled with pg_cron
  - **Manual usage**: `SELECT delete_expired_event_groups();`
  - **Scheduled**: Daily at 2 AM UTC (requires pg_cron extension)

---

## Migration Order

**IMPORTANT**: Migrations must be applied in order:

1. `001_initial_schema.sql` - Sets up base schema
2. `002_host_system_and_automation.sql` - Adds host system and automation

---

## How to Apply Migrations

### Method 1: Supabase Dashboard (Recommended for Production)
1. Go to your Supabase Dashboard
2. Navigate to SQL Editor
3. Copy the contents of each migration file
4. Run them in order (001, then 002)

### Method 2: Supabase CLI (Local Development)
```bash
# Apply all pending migrations
supabase db push

# Reset database and apply all migrations (⚠️ destroys data)
supabase db reset
```

### Method 3: Manual Script (Windows)
```bash
# Run from project root
.\apply-migration.sh
```

---

## Rollback

If you need to rollback migration 002, run the following SQL:

```sql
-- Rollback Migration 002
DROP TRIGGER IF EXISTS enforce_event_creation_permission ON events;
DROP TRIGGER IF EXISTS trigger_auto_generate_tickets ON bookings;
DROP TRIGGER IF EXISTS trigger_auto_create_event_group ON events;
DROP TRIGGER IF EXISTS update_host_request_timestamp ON host_requests;

DROP FUNCTION IF EXISTS check_event_creation_permission();
DROP FUNCTION IF EXISTS auto_generate_tickets();
DROP FUNCTION IF EXISTS auto_create_event_group();
DROP FUNCTION IF EXISTS delete_expired_event_groups();
DROP FUNCTION IF EXISTS update_host_request_updated_at();
DROP FUNCTION IF EXISTS approve_host_request(UUID, UUID, TEXT);
DROP FUNCTION IF EXISTS reject_host_request(UUID, UUID, TEXT, TEXT);
DROP FUNCTION IF EXISTS get_pending_host_requests_count();
DROP FUNCTION IF EXISTS can_user_create_event_type(UUID, event_type);

DROP TABLE IF EXISTS host_requests CASCADE;
ALTER TABLE profiles DROP COLUMN IF EXISTS host_type;
DROP TYPE IF EXISTS host_type CASCADE;

-- Restore QR code constraint
ALTER TABLE tickets ALTER COLUMN qr_code SET NOT NULL;
```

**Note**: Rollback will destroy all host request data. Backup before rolling back!

---

## Database Schema Diagram

```
┌──────────────────┐
│   auth.users     │
└────────┬─────────┘
         │
         │ 1:1
         ▼
┌──────────────────┐       ┌──────────────────┐
│    profiles      │◄─────►│  host_requests   │
│  - id            │       │  - user_id       │
│  - role          │       │  - host_type     │
│  - host_type     │       │  - kyc_fields... │
└────────┬─────────┘       └──────────────────┘
         │
         │ 1:N
         ▼
┌──────────────────┐       ┌──────────────────┐
│     events       │◄─────►│  event_groups    │
│  - host_id       │       │  - event_id      │
│  - type          │       └────────┬─────────┘
└────────┬─────────┘                │
         │                          │ 1:N
         │ 1:N                      ▼
         ▼                ┌──────────────────┐
┌──────────────────┐     │  group_members   │
│    bookings      │     │  - group_id      │
│  - user_id       │     │  - user_id       │
│  - event_id      │     └────────┬─────────┘
└────────┬─────────┘              │
         │                        │ 1:N
         │ 1:N                    ▼
         ▼              ┌──────────────────┐
┌──────────────────┐   │    messages      │
│     tickets      │   │  - group_id      │
│  - booking_id    │   │  - user_id       │
│  - qr_code       │   └──────────────────┘
└──────────────────┘
```

---

## Testing Queries

### Check Host Type Enum
```sql
SELECT unnest(enum_range(NULL::host_type));
```

### Check Host Requests Table Structure
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'host_requests' 
ORDER BY ordinal_position;
```

### Check RLS Policies
```sql
SELECT schemaname, tablename, policyname, cmd
FROM pg_policies 
WHERE tablename IN ('host_requests', 'profiles', 'events')
ORDER BY tablename, policyname;
```

### Check Triggers
```sql
SELECT trigger_name, event_object_table, action_statement
FROM information_schema.triggers 
WHERE event_object_schema = 'public'
ORDER BY event_object_table, trigger_name;
```

### Check Functions
```sql
SELECT proname, prosrc 
FROM pg_proc 
WHERE proname LIKE '%host%' OR proname LIKE '%ticket%' OR proname LIKE '%group%';
```

### Test Host Permission Check
```sql
-- Check if user can create event type
SELECT can_user_create_event_type(
  'USER_UUID_HERE'::UUID, 
  'experience'::event_type
);
```

### Check Pending Host Requests
```sql
SELECT get_pending_host_requests_count();
```

### Check Expired Event Groups
```sql
-- See which groups would be deleted
SELECT eg.id, eg.name, e.title, e.end_date
FROM event_groups eg
INNER JOIN events e ON eg.event_id = e.id
WHERE e.end_date < NOW();

-- Run cleanup
SELECT delete_expired_event_groups();
```

---

## Notes

1. **RLS is enabled** on all tables for security
2. **Indexes are created** on frequently queried columns for performance
3. **Triggers automatically**:
   - Update `updated_at` timestamps
   - Create profiles on user signup
   - Generate tickets on booking confirmation
   - Create event groups on event publish
   - Enforce host permissions on event creation
4. **Functions are SECURITY DEFINER** to allow proper RLS bypass when needed
5. **Admin users** can bypass most RLS policies for management
6. **Host requests** can only be submitted if no pending request exists
7. **Re-application** is allowed after rejection

---

## Troubleshooting

### Error: "permission denied for table host_requests"
**Solution**: RLS policies are not set up correctly. Rerun migration 002.

### Error: "User must be an approved host to create events"
**Solution**: User needs to:
1. Submit host application
2. Wait for admin approval
3. Check profile has `role = 'host'` and `is_host_approved = TRUE`

### Error: "Activity hosts can only create activities"
**Solution**: User has `host_type = 'activity'` and tried to create event/trip. They need to:
1. Apply for Full Host access
2. Get approved by admin

### Tickets not being generated
**Solution**: 
1. Check booking status is `'confirmed'`
2. Check trigger exists: `SELECT * FROM pg_trigger WHERE tgname = 'trigger_auto_generate_tickets';`
3. Check RLS policy allows trigger insertion: `auth.uid() IS NULL` clause

### Event groups not being created
**Solution**:
1. Check event `is_published = TRUE`
2. Check trigger exists: `SELECT * FROM pg_trigger WHERE tgname = 'trigger_auto_create_event_group';`

---

## Maintenance

### Schedule Cleanup (pg_cron)
To enable automatic cleanup of expired event groups:

1. Enable pg_cron extension in Supabase Dashboard:
   - Go to Database → Extensions
   - Enable `pg_cron`

2. Schedule the cleanup job:
```sql
SELECT cron.schedule(
  'delete-expired-event-groups',
  '0 2 * * *', -- Daily at 2 AM UTC
  $$SELECT delete_expired_event_groups()$$
);
```

3. Check scheduled jobs:
```sql
SELECT * FROM cron.job;
```

4. Check job run history:
```sql
SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;
```

---

## Future Migrations

When creating new migrations:

1. Use sequential numbering: `003_`, `004_`, etc.
2. Include descriptive name: `003_add_reviews_system.sql`
3. Add header comment with description
4. Test locally before applying to production
5. Update this README with migration details
6. Include rollback instructions if complex

---

## Support

For migration issues:
- Check Supabase logs in Dashboard
- Review RLS policies with test queries above
- Verify user roles and permissions
- Contact team in GitHub issues
