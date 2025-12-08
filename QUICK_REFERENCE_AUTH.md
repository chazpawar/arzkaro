# Quick Reference: Role-Based Auth System

## 🎯 What You Need to Know

### Three User Roles
1. **User** (default) - Browse, book tickets, chat
2. **Host** - Create events/activities, manage bookings
3. **Admin** - Approve hosts, manage users, full access

### Single Login
Everyone logs in with Google OAuth. The app automatically detects their role from the database.

---

## 🚀 Quick Start: Make Yourself Admin

### Step 1: Login to App
Sign in with your Google account.

### Step 2: Run This SQL in Supabase
```sql
UPDATE profiles 
SET role = 'admin' 
WHERE email = 'your-email@gmail.com';
```

### Step 3: Refresh Profile
Pull down on Profile tab OR logout/login.

### Step 4: Verify
You should see:
- **ADMIN** badge (red)
- "Admin Panel" menu item
- "Host Dashboard" menu item

**Done!** You're now an admin.

---

## ⚡ Enable Real-Time Updates

Real-time updates make role changes instant (no refresh needed).

### In Supabase Dashboard:
1. Go to **Database** → **Replication**
2. Find `profiles` table
3. Toggle **Enable Replication** to **ON**
4. Save

Now when you change a user's role, they see it within 5-10 seconds!

---

## 👥 User Role Changes

### Promote User to Host
```sql
-- Activity Host (can only create experiences)
UPDATE profiles 
SET role = 'host', host_type = 'activity', is_host_approved = TRUE 
WHERE email = 'user@example.com';

-- Full Host (can create events, trips, experiences)
UPDATE profiles 
SET role = 'host', host_type = 'full', is_host_approved = TRUE 
WHERE email = 'user@example.com';
```

### Promote User to Admin
```sql
UPDATE profiles 
SET role = 'admin' 
WHERE email = 'user@example.com';
```

### Demote User
```sql
-- Back to normal user
UPDATE profiles 
SET role = 'user', host_type = NULL, is_host_approved = FALSE 
WHERE email = 'user@example.com';
```

---

## 🎨 What Users See

### Normal User Profile
```
[Avatar]
John Doe
john@example.com

Menu:
- Edit Profile
- My Tickets
- Saved Events
- Settings

[Become a Host Card]
```

### Host Profile
```
[Avatar]
John Doe
john@example.com
[FULL HOST] badge

Menu:
- Edit Profile
- My Tickets
- Host Dashboard ← NEW
- Saved Events
- Settings
```

### Admin Profile
```
[Avatar]
Admin User
admin@example.com
[ADMIN] badge

Menu:
- Edit Profile
- My Tickets
- Admin Panel ← NEW
- Host Dashboard ← NEW
- Saved Events
- Settings
```

---

## 🔒 Access Control

| Feature | User | Host | Admin |
|---------|------|------|-------|
| Browse Events | ✅ | ✅ | ✅ |
| Book Tickets | ✅ | ✅ | ✅ |
| Apply as Host | ✅ | ❌ | ❌ |
| Create Events | ❌ | ✅* | ✅ |
| Host Dashboard | ❌ | ✅ | ✅ |
| Scan Tickets | ❌ | ✅ | ✅ |
| Approve Hosts | ❌ | ❌ | ✅ |
| Admin Panel | ❌ | ❌ | ✅ |

*Activity hosts can only create experiences. Full hosts can create everything.

---

## 🔍 Check User Roles

### See All Roles
```sql
SELECT email, role, host_type, is_host_approved
FROM profiles
ORDER BY role, email;
```

### Count by Role
```sql
SELECT role, COUNT(*) as count
FROM profiles
GROUP BY role;
```

### Find Pending Host Requests
```sql
SELECT user_id, organizer_name, email, status, requested_host_type
FROM host_requests
WHERE status = 'pending'
ORDER BY created_at DESC;
```

---

## 🐛 Troubleshooting

### "Admin Panel" Not Showing
1. Check role: `SELECT role FROM profiles WHERE email = 'your-email@gmail.com';`
2. Pull to refresh in Profile tab
3. Logout and login again
4. Check console logs

### Real-Time Not Working
1. Enable Realtime in Supabase (see above)
2. Check console for subscription errors
3. Use pull-to-refresh as fallback

### Can't Access Admin Routes
1. Verify role is 'admin' in database
2. Clear app cache
3. Check migrations are applied

---

## 📱 Testing Tips

### Test Role Changes
1. Login on one device
2. Change role in Supabase
3. Watch profile update automatically (5-10 seconds)
4. Or pull to refresh

### Test Multiple Users
Create test accounts:
- `test-user@example.com` → User
- `test-host@example.com` → Host
- `test-admin@example.com` → Admin

Change roles with SQL and test different access levels.

---

## 📚 Full Documentation

**Admin Setup**: `docs/ADMIN_SETUP.md`  
**Testing Guide**: `docs/ROLE_BASED_ACCESS_TESTING.md`  
**Migration Guide**: `supabase/migrations/README.md`  
**Complete Summary**: `ROLE_BASED_AUTH_COMPLETE.md`

---

## 🎉 Key Features

✅ Real-time role updates (5-10 seconds)  
✅ Pull-to-refresh backup  
✅ Route protection (admin/host areas)  
✅ Dynamic profile UI  
✅ Admin has full host access  
✅ Natural discovery (no forced alerts)  
✅ Console logging for debugging  
✅ Security at database level (RLS)

---

## 💡 Pro Tips

1. **Always test on two devices** - See real-time updates in action
2. **Check console logs** - They show exactly what's happening
3. **Use pull-to-refresh** - If real-time seems slow
4. **Start as user** - Test the full upgrade path
5. **Enable Realtime** - Makes everything feel instant

---

**Questions?** Check `docs/ADMIN_SETUP.md` for detailed instructions.

**Last Updated**: December 8, 2025
