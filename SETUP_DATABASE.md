# Database Setup Guide

## Error: "Could not find the table 'public.events' in the schema cache"

This error means the database tables haven't been created yet. Follow these steps:

## Prerequisites

1. ✅ You already have a `.env` file configured
2. ✅ You have Supabase credentials in the `.env` file

## Option 1: Run Migrations via Supabase Dashboard (Easiest)

1. **Go to your Supabase Dashboard**
   - Visit: https://supabase.com/dashboard
   - Select your project

2. **Open SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New Query"

3. **Copy and Run the Migration**
   - Open the file: `backend/supabase/migrations/001_initial_schema.sql`
   - Copy ALL the contents
   - Paste into the SQL Editor
   - Click "Run" button

4. **Verify Tables Created**
   - Click "Table Editor" in left sidebar
   - You should see tables: `profiles`, `events`, `bookings`, `tickets`, etc.

## Option 2: Run Migrations via Supabase CLI

1. **Install Supabase CLI** (if not installed)

   ```bash
   npm install -g supabase
   # or
   pnpm install -g supabase
   ```

2. **Login to Supabase**

   ```bash
   supabase login
   ```

3. **Link to Your Project**

   ```bash
   supabase link --project-ref YOUR_PROJECT_REF
   ```

   To find your project ref:
   - Go to Project Settings → General
   - Copy the "Reference ID"

4. **Run Migrations**
   ```bash
   supabase db push
   ```

## Option 3: Manual Table Creation

If the above options don't work, you can manually create tables:

1. Go to Supabase Dashboard → SQL Editor
2. Run each CREATE TABLE statement from `001_initial_schema.sql` one by one

## Verify Setup

After running migrations, restart your app:

```bash
# Stop the app (Ctrl+C)
pnpm run android
```

You should now see:

- ✅ Events load (or show empty state if no events created)
- ✅ Chats load properly
- ✅ Tickets load properly
- ✅ Profile shows correctly

## Next Steps: Create Your First Event

1. Sign in with Google OAuth
2. Request host access from your Profile tab
3. Once approved (or manually set role to 'host' in database), navigate to Events
4. Click "Create Event" button to create your first event!

## Troubleshooting

### Still seeing "table not found" errors?

1. Check your `.env` file has the correct Supabase URL and key
2. Make sure you ran the migration on the CORRECT Supabase project
3. Verify tables exist in Dashboard → Table Editor
4. Try restarting the app completely

### Getting "permission denied" errors?

The migration file includes RLS (Row Level Security) policies. Make sure you're signed in as the project owner when running migrations.

### Need to reset the database?

⚠️ **Warning: This will delete ALL data**

In Supabase Dashboard → SQL Editor:

```sql
-- Drop all tables
DROP TABLE IF EXISTS dm_messages CASCADE;
DROP TABLE IF EXISTS dm_conversations CASCADE;
DROP TABLE IF EXISTS friendships CASCADE;
DROP TABLE IF EXISTS friend_requests CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS group_members CASCADE;
DROP TABLE IF EXISTS event_groups CASCADE;
DROP TABLE IF EXISTS tickets CASCADE;
DROP TABLE IF EXISTS bookings CASCADE;
DROP TABLE IF EXISTS ticket_types CASCADE;
DROP TABLE IF EXISTS events CASCADE;
DROP TABLE IF EXISTS host_requests CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
```

Then run the migration again.
