# Migration Consolidation

## Overview

This document describes the consolidation of Supabase database migrations from 7 separate files into 3 clean, well-organized migrations.

## Motivation

- **Reduce complexity**: 7 migrations reduced to 3
- **Improve maintainability**: Related features grouped logically
- **Better documentation**: Each consolidated migration has clear sections
- **Remove duplicates**: Eliminated standalone SQL files that duplicated migration 007

## Migration Structure

### Before Consolidation

```
supabase/migrations/
├── 001_initial_schema.sql
├── 002_fix_event_groups_rls.sql
├── 003_add_ticket_auto_generation.sql
├── 004_fix_admin_profile_update.sql
├── 005_auto_delete_expired_event_groups.sql
├── 006_multi_tier_host_system.sql
├── 007_fix_host_requests_rls.sql
└── (standalone duplicates)
    ├── fix-host-requests-rls.sql
    └── fix-host-requests-rls-v2.sql
```

### After Consolidation

```
supabase/migrations/
├── 001_initial_schema.sql
├── 002_system_enhancements.sql
└── 003_host_system_with_rls.sql
```

## Consolidated Migrations

### Migration 001: Initial Schema (UNCHANGED)

**File**: `001_initial_schema.sql`

**Status**: Kept as-is, no changes

**Contents**: Foundation database schema including:
- Core tables (profiles, events, bookings, tickets, chats, etc.)
- Enums (user_role, event_type, booking_status, ticket_status, etc.)
- Indexes and constraints
- Basic RLS policies
- Initial functions and triggers

---

### Migration 002: System Enhancements

**File**: `002_system_enhancements.sql`

**Combines**: Migrations 002, 003, 004, 005

**Purpose**: Groups all system-level enhancements and automation features

**Sections**:
1. **Event Groups RLS Fixes** (from 002)
   - Fixed RLS policies for `event_groups` table
   - Added proper SELECT, INSERT, UPDATE policies

2. **Group Members RLS Fixes** (from 002)
   - Fixed RLS policies for `group_members` table
   - Ensured group owners can manage members

3. **Ticket Auto-Generation System** (from 003)
   - Creates individual tickets automatically when bookings are created
   - Trigger: `auto_create_tickets_on_booking`
   - Function: `create_tickets_for_booking()`

4. **Event Group Auto-Generation** (from 003)
   - Creates default event group when events are created
   - Trigger: `auto_create_event_group`
   - Function: `create_default_event_group()`

5. **Admin Profile Update Permissions** (from 004)
   - Allows admins to update any user's profile
   - Fixed RLS policy: "Admins can update any profile"

6. **Auto-Delete Expired Event Groups** (from 005)
   - Automatically deletes event groups 7 days after event ends
   - Function: `delete_expired_event_groups()`
   - Scheduled via pg_cron (requires manual setup)

7. **Comments & Documentation**
   - Comprehensive inline comments explaining each section

---

### Migration 003: Host System with RLS

**File**: `003_host_system_with_rls.sql`

**Combines**: Migrations 006, 007

**Purpose**: Implements complete multi-tier host system with KYC verification

**Sections**:
1. **Create Host Type Enum**
   - `host_type`: 'full' | 'activity'
   - Full hosts: Can create events, trips, activities
   - Activity hosts: Can only create activities

2. **Update Profiles Table**
   - Adds `host_type` column to profiles

3. **Create Host Requests Table**
   - Comprehensive KYC fields:
     - Personal/Business information
     - Address details
     - KYC documents (PAN, GSTIN)
     - Bank account details
     - Document upload URLs
     - Admin review fields
   - Validation constraints for phone, PAN, PIN code, IFSC, email

4. **Row Level Security (RLS) Policies** (from 007)
   - Users can view/create their own requests
   - Admins can view/update all requests
   - Proper `TO authenticated` clauses
   - GRANT permissions to authenticated users

5. **Approval/Rejection Functions**
   - `approve_host_request()`: Approves request and grants host access
   - `reject_host_request()`: Rejects request with reason

6. **Event Creation Permission Trigger**
   - Validates event creation based on host type
   - Function: `check_event_creation_permission()`
   - Trigger: `enforce_event_creation_permission`

7. **Helper Functions**
   - `get_pending_host_requests_count()`: Returns pending request count
   - `can_user_create_event_type()`: Checks if user can create specific event type

8. **Data Migration**
   - Sets existing hosts to 'full' type by default

9. **Updated_At Trigger**
   - Auto-updates `updated_at` timestamp on host_requests

---

## Changes Made

### Created Files
- ✅ `002_system_enhancements.sql` - Combines migrations 002-005
- ✅ `003_host_system_with_rls.sql` - Combines migrations 006-007

### Deleted Files
- ✅ `002_fix_event_groups_rls.sql`
- ✅ `003_add_ticket_auto_generation.sql`
- ✅ `004_fix_admin_profile_update.sql`
- ✅ `005_auto_delete_expired_event_groups.sql`
- ✅ `006_multi_tier_host_system.sql`
- ✅ `007_fix_host_requests_rls.sql`
- ✅ `supabase/fix-host-requests-rls.sql` (standalone duplicate)
- ✅ `supabase/fix-host-requests-rls-v2.sql` (standalone duplicate)

---

## Migration 007 Integration Details

Migration 007 was properly integrated into Migration 003 by:

1. **Adding `TO authenticated` clauses** to all RLS policies
2. **Including `WITH CHECK` clause** for UPDATE policy
3. **Adding GRANT statements** for table permissions:
   ```sql
   GRANT SELECT, INSERT ON host_requests TO authenticated;
   GRANT UPDATE ON host_requests TO authenticated;
   ```
4. **Preserving all policy logic** from the original migration 007

The key improvement from 007 was ensuring that RLS policies explicitly specify the `authenticated` role and include proper permissions, which was missing in the original migration 006.

---

## Database Type Regeneration (TODO)

The `backend/types/database.types.ts` file is currently out of sync with the database schema after migration 006. To fix this:

```bash
npx supabase gen types typescript --project-id <YOUR_PROJECT_ID> > backend/types/database.types.ts
```

This will:
- ✅ Add proper types for `host_requests` table
- ✅ Include `host_type` column in profiles
- ✅ Add RPC function types for `approve_host_request`, `reject_host_request`, etc.
- ✅ Remove need for `as unknown as` type assertions in service files

---

## Verification

To verify the consolidated migrations work correctly:

### 1. Check Migration Files
```bash
ls supabase/migrations/
# Should show: 001_initial_schema.sql, 002_system_enhancements.sql, 003_host_system_with_rls.sql
```

### 2. Test on Fresh Database
```bash
# Reset database and run migrations
npx supabase db reset

# Or apply migrations manually
npx supabase db push
```

### 3. Verify Host Type Enum
```sql
SELECT unnest(enum_range(NULL::host_type));
-- Expected: 'full', 'activity'
```

### 4. Verify Host Requests Table
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'host_requests' 
ORDER BY ordinal_position;
```

### 5. Verify RLS Policies
```sql
SELECT tablename, policyname 
FROM pg_policies 
WHERE tablename = 'host_requests';
-- Expected: 4 policies (users view/create, admins view/update)
```

### 6. Verify Functions
```sql
SELECT proname 
FROM pg_proc 
WHERE proname LIKE '%host%';
-- Expected: approve_host_request, reject_host_request, get_pending_host_requests_count, can_user_create_event_type, check_event_creation_permission, update_host_request_updated_at
```

---

## Benefits of Consolidation

1. **Easier to understand**: Related features grouped together
2. **Fewer files to manage**: 3 migrations instead of 7
3. **Better documentation**: Each section clearly labeled
4. **No duplicates**: Removed standalone SQL files
5. **Proper organization**: Logical grouping by feature area
6. **Easier rollback**: Can roll back entire feature sets together
7. **Cleaner git history**: Future migrations start from clean slate

---

## Impact on Existing Databases

⚠️ **IMPORTANT**: If you have already applied migrations 001-007 to a database:

1. **Do NOT run migrations 002-003 again** - They will fail because objects already exist
2. **For new databases**: Use the consolidated migrations 001-003
3. **For existing databases**: Continue using your current migration state

---

## Next Steps

1. ✅ Consolidate migrations - COMPLETE
2. ✅ Delete old files - COMPLETE
3. ✅ Create documentation - COMPLETE
4. ⏳ Test on fresh database (recommended)
5. ⏳ Regenerate TypeScript types
6. ⏳ Remove type assertions from service files

---

## Questions?

If you have questions about the consolidated migrations, refer to:
- Individual migration files for detailed comments
- This documentation for high-level overview
- Git history for original migration contents (before consolidation)

---

**Last Updated**: December 9, 2025
