# Admin Setup Guide

This guide will help you set up the first admin user for your ArzKaro platform.

---

## Overview

ArzKaro uses a role-based access system with three roles:
- **User** (default) - Can browse events, book tickets, chat
- **Host** - Can create events/trips/activities (requires application + approval)
- **Admin** - Can approve host requests, manage users, access all features

**Important**: There is no separate admin login interface. All users log in through the same Google OAuth flow, and the app automatically detects their role from the database.

---

## Prerequisites

Before setting up an admin account, ensure:

1. ✅ Supabase project is set up and running
2. ✅ Database migrations are applied (`001_initial_schema.sql` and `002_host_system_and_automation.sql`)
3. ✅ App is configured with correct Supabase credentials
4. ✅ You can successfully log in to the app as a normal user

---

## Step-by-Step Admin Setup

### Step 1: Sign Up as Normal User

1. Open the ArzKaro app
2. Click "Sign in with Google"
3. Complete the Google OAuth flow
4. You'll be logged in as a **normal user** (role = 'user')

### Step 2: Find Your User ID

You need to find your Supabase user ID to promote yourself to admin.

**Method A: From Supabase Dashboard** (Recommended)

1. Go to your Supabase Dashboard
2. Navigate to **Authentication** → **Users**
3. Find your account in the list (search by email)
4. Copy the **User UID** (it looks like: `a1b2c3d4-e5f6-7890-abcd-ef1234567890`)

**Method B: From App Console** (Development)

1. Open the app in development mode
2. Go to Profile tab
3. Look for "User ID" field
4. Copy the UUID shown

**Method C: From SQL Query**

Run this query in Supabase SQL Editor:
```sql
SELECT id, email, role FROM profiles;
```
Find your email and copy the `id` value.

### Step 3: Promote to Admin

Open Supabase SQL Editor and run one of these queries:

**Option A: Promote by Email** (Recommended)
```sql
UPDATE profiles 
SET role = 'admin' 
WHERE email = 'your-email@gmail.com';
```
Replace `your-email@gmail.com` with your actual email.

**Option B: Promote by User ID**
```sql
UPDATE profiles 
SET role = 'admin' 
WHERE id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
```
Replace the UUID with your actual user ID.

**Option C: Promote First User** (If you're the only user)
```sql
UPDATE profiles 
SET role = 'admin' 
WHERE id = (SELECT id FROM profiles ORDER BY created_at ASC LIMIT 1);
```

Click **Run** to execute the query.

### Step 4: Verify Admin Status

**Option A: Real-Time Update** (Recommended)
1. The app should automatically detect the role change via real-time subscription
2. Wait a few seconds and check the Profile tab
3. You should see an "ADMIN" badge appear below your name

**Option B: Pull-to-Refresh**
1. Go to the Profile tab in the app
2. Pull down to refresh
3. You should see an "ADMIN" badge appear

**Option C: Re-login**
1. Sign out from the app
2. Sign back in with Google
3. Your role will be loaded as admin

### Step 5: Access Admin Panel

Once you're an admin:

1. Open the **Profile** tab
2. You should see a new menu item: **"Admin Panel"** with an "Admin" badge
3. Tap on it to access the admin dashboard

**Admin features**:
- Approve/reject host applications
- View all users
- Manage system settings
- Create any event type without restrictions
- Access host dashboard (admins have full host capabilities)

---

## Verification Queries

Run these queries in Supabase SQL Editor to verify your admin status:

### Check Your Role
```sql
SELECT id, email, role, is_host_approved, host_type, created_at
FROM profiles
WHERE email = 'your-email@gmail.com';
```

**Expected Output**:
```
role: admin
is_host_approved: false (or true if you were a host before)
host_type: null (or full/activity if you were a host before)
```

### Check All Admin Users
```sql
SELECT id, email, full_name, role, created_at
FROM profiles
WHERE role = 'admin'
ORDER BY created_at ASC;
```

This shows all admin users in the system.

### Check Role Distribution
```sql
SELECT role, COUNT(*) as count
FROM profiles
GROUP BY role
ORDER BY role;
```

This shows how many users have each role.

---

## Admin Capabilities

Once you're an admin, you can:

### 1. Review Host Applications
- Navigate to: **Profile** → **Admin Panel** → **Host Requests**
- View pending applications with full KYC details
- Approve or reject applications
- Add admin notes for internal tracking

### 2. Manage Users
- Navigate to: **Profile** → **Admin Panel** → **Users**
- View all registered users
- See user roles and status
- Manually promote/demote users (via SQL if needed)

### 3. Create Events Without Restrictions
- Admins can create Events, Trips, and Experiences
- No host application required
- No permission checks (bypass all restrictions)

### 4. Access Host Dashboard
- Admins automatically have host capabilities
- Can view host dashboard
- Can use ticket scanner
- Can manage bookings

### 5. Override Permissions
- Database functions check for admin role
- RLS policies allow admins to bypass most restrictions
- Can update any profile (for host approvals)

---

## Security Best Practices

### Protect Your Admin Account

1. **Use a strong Google account password**
   - Enable 2FA on your Google account
   - Use a unique password

2. **Limit admin users**
   - Only promote trusted individuals to admin
   - Review admin list regularly

3. **Monitor admin actions**
   - Check admin_notes field in host_requests table
   - Review who approved/rejected applications

4. **Backup before making changes**
   - Always backup database before manual SQL updates
   - Test changes on staging first if possible

### Promoting Additional Admins

To promote another user to admin, repeat Step 3 with their email/user ID.

**Warning**: Admins have unrestricted access. Only promote trusted team members.

---

## Troubleshooting

### Issue: "Admin Panel" Menu Item Not Showing

**Possible Causes**:
1. Role update didn't sync
2. App cache is stale
3. Real-time subscription not working

**Solutions**:
1. Pull-to-refresh in Profile tab
2. Log out and log back in
3. Check role in database:
   ```sql
   SELECT role FROM profiles WHERE email = 'your-email@gmail.com';
   ```
4. Force restart the app

### Issue: Still Getting "Access Denied" on Admin Routes

**Possible Causes**:
1. RLS policies not applied
2. Migration 001 not run correctly
3. Role not updated in database

**Solutions**:
1. Verify migrations are applied:
   ```sql
   SELECT * FROM information_schema.tables WHERE table_schema = 'public';
   ```
2. Check RLS policies exist:
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'profiles';
   ```
3. Manually re-run the role update query

### Issue: Can't Approve Host Requests

**Possible Causes**:
1. RPC function not created
2. Missing permissions on host_requests table

**Solutions**:
1. Verify function exists:
   ```sql
   SELECT proname FROM pg_proc WHERE proname = 'approve_host_request';
   ```
2. Re-run migration 002 if function is missing
3. Check RLS policy on host_requests:
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'host_requests';
   ```

### Issue: Real-Time Updates Not Working

**Possible Causes**:
1. Supabase Realtime not enabled
2. Table replication not configured
3. Network issues

**Solutions**:
1. Enable Realtime in Supabase Dashboard:
   - Go to **Database** → **Replication**
   - Enable replication for `profiles` table
2. Check console logs for subscription errors
3. Use pull-to-refresh as fallback

---

## Demoting from Admin

If you need to demote an admin user back to normal user:

```sql
UPDATE profiles 
SET role = 'user' 
WHERE email = 'user-email@gmail.com';
```

The user will lose admin access immediately (via real-time update or after refresh).

---

## Multiple Admins

The system supports multiple admins. To add more:

1. Have them sign up as normal users
2. Get their user ID or email
3. Run the promotion query for each user
4. Verify they can access the admin panel

**Recommendation**: Keep the number of admins small (1-3) for security.

---

## Next Steps

After setting up your admin account:

1. **Test the workflow**:
   - Create a test host application as a different user
   - Review and approve it as admin
   - Verify the user becomes a host

2. **Configure settings**:
   - Set up admin notifications (future feature)
   - Configure approval workflows
   - Set KYC review standards

3. **Monitor the platform**:
   - Regularly review pending host applications
   - Check user growth metrics
   - Monitor event creation patterns

---

## Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review console logs in the app (dev mode)
3. Verify database migrations in Supabase
4. Check GitHub issues for known problems

---

## Database Schema Reference

### Profiles Table Structure
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  role user_role DEFAULT 'user' NOT NULL,  -- 'user' | 'host' | 'admin'
  host_type host_type,                      -- 'full' | 'activity' | NULL
  is_host_approved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Role Enum
```sql
CREATE TYPE user_role AS ENUM ('user', 'host', 'admin');
```

### Host Type Enum
```sql
CREATE TYPE host_type AS ENUM ('full', 'activity');
```

---

**Last Updated**: December 8, 2025  
**Version**: 1.0.0  
**Migrations Required**: 001, 002
