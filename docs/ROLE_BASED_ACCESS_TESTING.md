# Role-Based Access Testing Guide

This guide provides comprehensive test scenarios for the role-based authentication and profile interface system.

---

## Test Environment Setup

### Prerequisites
- ✅ Database migrations applied (001 & 002)
- ✅ Supabase Realtime enabled for `profiles` table
- ✅ At least 3 test accounts ready:
  1. Normal user (test1@example.com)
  2. Host user (test2@example.com)
  3. Admin user (your actual email)

### Enable Supabase Realtime

1. Go to Supabase Dashboard → **Database** → **Replication**
2. Find `profiles` table
3. Toggle **Enable Replication** to ON
4. Save changes

---

## Test Scenarios

### Scenario 1: Normal User (Default Role)

**Test Account**: `test1@example.com`

#### 1.1 Initial Login
- [ ] Sign in with Google OAuth
- [ ] Verify redirected to explore/home screen
- [ ] Check console logs show: `role: 'user'`

#### 1.2 Profile Interface
Navigate to Profile tab:
- [ ] Avatar displays correctly
- [ ] Email shows correct address
- [ ] **NO admin badge** visible
- [ ] **NO host badge** visible
- [ ] "Become a Host" card is visible
- [ ] Menu items visible:
  - Edit Profile
  - My Tickets
  - Saved Events
  - Notifications
  - Settings
  - Help & Support
- [ ] **NO "Admin Panel"** menu item
- [ ] **NO "Host Dashboard"** menu item

#### 1.3 Route Protection
Try accessing protected routes manually:
- [ ] Navigate to `/admin/dashboard` → Should redirect to home
- [ ] Console shows: "Access denied: User is not an admin"
- [ ] Navigate to `/host/dashboard` → Should redirect to home
- [ ] Console shows: "Access denied: User is not a host"

#### 1.4 Event Creation
- [ ] Try to create event → Should be blocked or show error
- [ ] Cannot see "Create Event" button in explore page

#### 1.5 Host Application
- [ ] Click "Become a Host" card
- [ ] Application form opens
- [ ] Fill out all KYC fields
- [ ] Submit application
- [ ] Success message appears
- [ ] "Become a Host" card disappears
- [ ] Status badge shows "Pending Review"

---

### Scenario 2: Host User (Activity Type)

**Test Account**: `test2@example.com`

**Setup**: Approve host request with `host_type = 'activity'`

```sql
-- Run in Supabase SQL Editor
UPDATE profiles 
SET role = 'host', host_type = 'activity', is_host_approved = TRUE 
WHERE email = 'test2@example.com';
```

#### 2.1 Real-Time Update Test
- [ ] User is logged in before running SQL
- [ ] Wait 5-10 seconds after SQL update
- [ ] Check console logs: "Profile updated via real-time"
- [ ] Profile tab automatically updates (no manual refresh)
- [ ] **Host badge appears** with "Activity Host" label

#### 2.2 Profile Interface
Navigate to Profile tab:
- [ ] **Host badge** visible: "Activity Host"
- [ ] **NO admin badge**
- [ ] Menu items include:
  - Edit Profile
  - My Tickets
  - **Host Dashboard** (NEW - with "Host" badge)
  - Saved Events
  - Notifications
  - Settings
  - Help & Support
- [ ] **NO "Admin Panel"** menu item
- [ ] "Become a Host" card is gone

#### 2.3 Route Access
- [ ] Navigate to `/host/dashboard` → Allowed (shows dashboard)
- [ ] Navigate to `/admin/dashboard` → Blocked (redirects to home)
- [ ] Console shows: "Access denied: User is not an admin"

#### 2.4 Event Creation Restrictions
Try creating events:
- [ ] Can create **Experience** (allowed)
- [ ] Cannot create **Event** (error: "Activity hosts can only create activities")
- [ ] Cannot create **Trip** (error: "Activity hosts can only create activities")
- [ ] Error message is clear and informative

#### 2.5 Host Dashboard Access
Navigate to Host Dashboard:
- [ ] Can view dashboard
- [ ] Can see own events
- [ ] Can use ticket scanner
- [ ] Can view bookings

---

### Scenario 3: Host User (Full Type)

**Test Account**: `test3@example.com`

**Setup**: Approve host request with `host_type = 'full'`

```sql
UPDATE profiles 
SET role = 'host', host_type = 'full', is_host_approved = TRUE 
WHERE email = 'test3@example.com';
```

#### 3.1 Profile Interface
- [ ] **Host badge** visible: "Full Host"
- [ ] Menu includes "Host Dashboard"
- [ ] No admin panel access

#### 3.2 Event Creation
Try creating all event types:
- [ ] Can create **Event** → Success
- [ ] Can create **Trip** → Success
- [ ] Can create **Experience** → Success
- [ ] No permission errors

#### 3.3 Host Features
- [ ] Access to host dashboard
- [ ] Can scan tickets
- [ ] Can manage bookings
- [ ] Can view analytics

---

### Scenario 4: Admin User

**Test Account**: Your actual email (e.g., `admin@arzkaro.com`)

**Setup**: 
```sql
UPDATE profiles 
SET role = 'admin' 
WHERE email = 'your-email@gmail.com';
```

#### 4.1 Real-Time Update (If Logged In)
- [ ] Wait 5-10 seconds after SQL
- [ ] Console logs: "Profile updated via real-time"
- [ ] **Admin badge appears** automatically
- [ ] **Host Dashboard appears** in menu
- [ ] **Admin Panel appears** in menu

#### 4.2 Profile Interface
Navigate to Profile tab:
- [ ] **Admin badge** visible (red background)
- [ ] **NO host badge** (admin supersedes)
- [ ] Menu items include:
  - Edit Profile
  - My Tickets
  - **Admin Panel** (NEW - with "Admin" badge)
  - **Host Dashboard** (NEW - with "Host" badge)
  - Saved Events
  - Notifications
  - Settings
  - Help & Support

#### 4.3 Route Access
- [ ] Navigate to `/admin/dashboard` → Allowed
- [ ] Navigate to `/host/dashboard` → Allowed
- [ ] Navigate to `/admin/host-requests` → Allowed
- [ ] Navigate to `/admin/users` → Allowed
- [ ] No access denied errors

#### 4.4 Event Creation (Full Access)
Try creating all event types:
- [ ] Can create **Event** → Success
- [ ] Can create **Trip** → Success
- [ ] Can create **Experience** → Success
- [ ] No host application needed
- [ ] No permission checks

#### 4.5 Admin Features
**Host Request Management**:
- [ ] View pending host requests
- [ ] See all KYC details
- [ ] Approve request → User becomes host
- [ ] Reject request → User receives rejection notice
- [ ] Add admin notes

**User Management**:
- [ ] View all users
- [ ] See user roles
- [ ] Filter by role

**System Override**:
- [ ] Can update any profile (via database)
- [ ] RLS policies allow admin access
- [ ] Functions check admin role and bypass restrictions

---

### Scenario 5: Pull-to-Refresh Testing

#### 5.1 Manual Refresh (No Real-Time)
- [ ] Login as normal user
- [ ] Run SQL to promote to host
- [ ] **DO NOT WAIT** for real-time
- [ ] Go to Profile tab
- [ ] Pull down to refresh
- [ ] Wait for "Refreshing..." indicator
- [ ] Host badge appears after refresh
- [ ] Menu items update

#### 5.2 Real-Time vs Manual Refresh
Test both methods side-by-side:
- [ ] **User A**: Logged in, gets promoted, waits for real-time (5-10s)
- [ ] **User B**: Logged in, gets promoted, pulls to refresh immediately
- [ ] Both should see updates
- [ ] Real-time is faster (5-10s vs manual action)

---

### Scenario 6: Role Demotion

#### 6.1 Host to User Demotion
```sql
UPDATE profiles 
SET role = 'user', host_type = NULL, is_host_approved = FALSE 
WHERE email = 'test2@example.com';
```

- [ ] Host badge disappears (real-time or refresh)
- [ ] "Host Dashboard" menu item disappears
- [ ] Access to `/host/dashboard` blocked
- [ ] Redirected to home when trying to access host routes
- [ ] "Become a Host" card reappears

#### 6.2 Admin to User Demotion
```sql
UPDATE profiles 
SET role = 'user' 
WHERE email = 'your-email@gmail.com';
```

- [ ] Admin badge disappears
- [ ] "Admin Panel" menu item disappears
- [ ] "Host Dashboard" menu item disappears
- [ ] Access to admin routes blocked
- [ ] Access to host routes blocked

---

### Scenario 7: Edge Cases

#### 7.1 No Internet Connection
- [ ] Disconnect from internet
- [ ] Login (should use cached credentials if available)
- [ ] Profile shows last known role
- [ ] Real-time updates don't work (expected)
- [ ] Pull-to-refresh shows error

#### 7.2 Database Role Change While Offline
- [ ] User is offline
- [ ] Admin changes role in database
- [ ] User comes back online
- [ ] Real-time subscription reconnects
- [ ] Profile updates automatically

#### 7.3 Multiple Devices
- [ ] Login on Device A as host
- [ ] Login on Device B with same account
- [ ] Admin promotes to host
- [ ] Both devices update via real-time
- [ ] Both show host badge

#### 7.4 Rapid Role Changes
- [ ] Change role multiple times quickly in database:
  ```sql
  UPDATE profiles SET role = 'host' WHERE email = 'test@example.com';
  UPDATE profiles SET role = 'admin' WHERE email = 'test@example.com';
  UPDATE profiles SET role = 'user' WHERE email = 'test@example.com';
  ```
- [ ] App handles updates gracefully
- [ ] Final state matches database
- [ ] No crashes or errors

#### 7.5 Invalid Role Data
Try setting invalid role:
```sql
-- This should fail due to enum constraint
UPDATE profiles SET role = 'superuser' WHERE email = 'test@example.com';
```
- [ ] Database rejects invalid role
- [ ] App doesn't crash
- [ ] User keeps existing role

---

### Scenario 8: Navigation Guards

#### 8.1 Deep Linking to Protected Routes
Test deep links:
- [ ] As normal user, open deep link to `/admin/dashboard`
- [ ] Should redirect to home
- [ ] As normal user, open deep link to `/host/dashboard`
- [ ] Should redirect to home
- [ ] As host, open deep link to `/admin/dashboard`
- [ ] Should redirect to home
- [ ] As admin, open deep link to `/host/dashboard`
- [ ] Should show dashboard

#### 8.2 Back Button After Role Change
- [ ] Login as user
- [ ] Try to access `/host/dashboard` → Redirected
- [ ] Promoted to host
- [ ] Press back button
- [ ] Try again → Now allowed

---

### Scenario 9: Host Application Workflow

#### 9.1 First-Time Application
- [ ] User applies to become host
- [ ] Application status shows "Pending Review"
- [ ] Cannot submit another application (button disabled)
- [ ] Admin sees application in admin panel
- [ ] Admin approves → User becomes host
- [ ] User sees host badge (real-time update)

#### 9.2 Re-Application After Rejection
- [ ] Admin rejects application with reason
- [ ] User sees "Rejected" status
- [ ] Rejection reason is displayed
- [ ] "Apply Again" button appears
- [ ] User can submit new application
- [ ] Previous rejection is saved in database

---

### Scenario 10: Console Logging

Check console logs for proper debug info:

#### 10.1 On Login
```
🔍 [AUTH] Fetching profile for user: <user-id>
📥 [AUTH] Profile fetch response: { ... }
✅ [AUTH] Profile fetched successfully. Role: user
🎭 [AUTH] Role state updated: { role: 'user', isAdmin: false, isHost: false }
```

#### 10.2 On Real-Time Update
```
🔄 [AUTH] Setting up real-time profile subscription for user: <user-id>
📡 [AUTH] Real-time subscription status: SUBSCRIBED
🔔 [AUTH] Profile updated via real-time: { role: 'host', ... }
✅ [AUTH] Profile state updated. New role: host
🎭 [AUTH] Role state updated: { role: 'host', isAdmin: false, isHost: true }
```

#### 10.3 On Access Denial
```
🚫 Access denied: User is not a host. Redirecting to home.
🚫 Access denied: User is not an admin. Redirecting to home.
```

---

## Performance Testing

### Load Testing
- [ ] 10 simultaneous role changes → App handles gracefully
- [ ] Real-time updates arrive within 5-10 seconds
- [ ] No memory leaks after multiple updates
- [ ] UI remains responsive during updates

### Network Testing
- [ ] Test on 3G/4G/5G/WiFi
- [ ] Real-time works on all networks
- [ ] Graceful degradation on slow networks
- [ ] Proper error messages on failure

---

## Automated Testing Checklist

### Unit Tests (Future)
- [ ] `useAuth` hook returns correct role
- [ ] `isHost` computed property works
- [ ] `isAdmin` computed property works
- [ ] `refreshProfile` updates state

### Integration Tests (Future)
- [ ] Navigation guards block unauthorized access
- [ ] Real-time subscription connects successfully
- [ ] Profile updates trigger UI changes
- [ ] Role changes persist across app restarts

---

## Bug Report Template

If you find issues during testing, use this template:

```markdown
**Bug Title**: [Short description]

**Role**: User / Host (Activity) / Host (Full) / Admin

**Steps to Reproduce**:
1. Login as [role]
2. Navigate to [screen]
3. Perform [action]
4. Observe [unexpected behavior]

**Expected Behavior**:
[What should happen]

**Actual Behavior**:
[What actually happens]

**Console Logs**:
```
[Paste relevant console output]
```

**Database State**:
```sql
SELECT id, email, role, host_type, is_host_approved 
FROM profiles 
WHERE email = '[your-test-email]';
```

**Environment**:
- OS: iOS / Android
- Device: Simulator / Physical
- App Version: [version]
- Supabase: [project-ref]
```

---

## Success Criteria

All tests pass when:
- ✅ All role-based UI changes work correctly
- ✅ Navigation guards block unauthorized access
- ✅ Real-time updates arrive within 10 seconds
- ✅ Pull-to-refresh updates work as fallback
- ✅ No crashes or errors during role changes
- ✅ Console logs show correct debug information
- ✅ Database state matches UI state
- ✅ Users discover role changes naturally (no forced alerts)

---

## Test Results Log

Track your test results:

| Date | Tester | Scenario | Result | Notes |
|------|--------|----------|--------|-------|
| 2025-12-08 | [Name] | Normal User | ✅ Pass | All checks passed |
| 2025-12-08 | [Name] | Activity Host | ⚠️ Partial | Real-time delayed |
| 2025-12-08 | [Name] | Full Host | ✅ Pass | - |
| 2025-12-08 | [Name] | Admin | ✅ Pass | - |

---

**Last Updated**: December 8, 2025  
**Version**: 1.0.0  
**Status**: Ready for testing
