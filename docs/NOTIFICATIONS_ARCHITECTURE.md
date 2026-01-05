# Notifications System Architecture

## Overview

ArzKaro has **TWO SEPARATE** notification systems that serve different purposes. Understanding the distinction is crucial for development and deployment.

---

## System 1: In-App Notifications (Database-Driven)

### Purpose
Display notifications within the app for important user actions that need to be tracked and shown in a dedicated notifications screen.

### Use Cases
1. **Friend Request Accepted** - When someone accepts your friend request
2. **Event Reminders** - 24 hours before a booked event starts
3. **Booking Confirmed** - When payment is completed for an event

### Technical Implementation

**Database Layer:**
- Migration: `019_add_notifications_system.sql`
- Table: `notifications`
- Real-time updates via Supabase subscriptions
- Triggers on `friend_requests` and `bookings` tables

**Service Layer:**
- File: `src/services/notification-service.ts`
- Functions:
  - `getUserNotifications()` - Fetch user's notifications
  - `getUnreadCount()` - Get badge count
  - `markAsRead()` - Mark notification as read
  - `markAllAsRead()` - Clear all unread
  - `deleteNotification()` - Remove notification
  - `subscribeToNotifications()` - Real-time updates

**Hook Layer:**
- File: `src/hooks/use-notifications.ts`
- Provides: `notifications`, `unreadCount`, `loading`, `error`
- Auto-subscribes to real-time updates
- Optimistic updates for better UX

**UI Layer:**
- Screen: `app/notifications.tsx`
- Badge: Bell icon in `app/(tabs)/explore.tsx`
- Features:
  - Swipe-to-delete
  - Pull-to-refresh
  - Empty state
  - Error handling

**Edge Functions:**
- `create-event-reminders` - Runs hourly via cron job
- Calls `create_event_reminders()` DB function
- Creates notifications 24h before events

**Cron Job:**
- Migration: `020_add_event_reminders_cron.sql`
- Schedule: Every hour at minute 0
- Purpose: Check for upcoming events and create reminders

### Behavior
- ✅ Saves to database
- ✅ Shows in notifications screen
- ✅ Real-time updates
- ✅ Badge count on bell icon
- ✅ Works in Expo Go
- ✅ Works in EAS builds

---

## System 2: Push Notifications (Device Notifications)

### Purpose
Send notifications to user's device even when app is closed or in background. Does NOT save to database or show in notifications screen.

### Use Cases
1. **Chat Messages** - When you receive a new message
2. **Promotional Notifications** - Admin sends custom notifications (from admin panel)

### Technical Implementation

**Database Layer:**
- Migration: `017_add_push_notifications.sql`
- Table: `push_tokens`
- Functions:
  - `upsert_push_token()` - Register/update device token
  - `get_user_push_tokens()` - Get all tokens for user
  - `cleanup_inactive_push_tokens()` - Remove old tokens

**Service Layer:**
- File: `src/services/push-notification-service.ts` ⚠️ **SEPARATE FILE**
- Functions:
  - `requestNotificationPermissions()` - Ask user for permission
  - `getExpoPushToken()` - Get device token
  - `registerPushToken()` - Save token to database
  - `unregisterPushToken()` - Remove token (logout)
  - `setBadgeCount()` - Update app badge
  - `isPushNotificationSupported()` - Check device support

**Edge Functions:**
1. `send-chat-notification` - Sends push when message received
2. `send-promotional-notification` - Admin panel uses this

**Admin Panel:**
- Screen: `app/admin/notifications.tsx`
- Send custom push notifications to all users
- Does NOT create in-app notifications

### Behavior
- ❌ Does NOT save to database
- ❌ Does NOT show in notifications screen
- ✅ Shows on device lock screen
- ✅ Works when app is closed
- ❌ Does NOT work in Expo Go
- ✅ Works in EAS builds only

---

## Important: Expo Go vs EAS Builds

### Expo Go (Development)
```typescript
// Push notification imports cause crashes in Expo Go
import * as Notifications from 'expo-notifications'; // ❌ CRASHES

// Solution: Separate file that's only imported when needed
// src/services/push-notification-service.ts
```

**What Works:**
- ✅ In-app notifications (database-driven)
- ✅ Notifications screen with badge
- ✅ Real-time updates

**What Doesn't Work:**
- ❌ Push notifications (device notifications)
- ❌ Registering push tokens
- ❌ `expo-notifications` imports

### EAS Builds (Production)
**Everything works!**
- ✅ In-app notifications
- ✅ Push notifications
- ✅ All features enabled

---

## Code Organization

### Files Structure
```
src/
├── services/
│   ├── notification-service.ts           # In-app notifications (works in Expo Go)
│   └── push-notification-service.ts      # Push notifications (EAS only)
├── hooks/
│   └── use-notifications.ts              # Hook for in-app notifications
app/
├── notifications.tsx                     # Notifications screen UI
└── (tabs)/
    └── explore.tsx                       # Bell icon with badge

supabase/
├── migrations/
│   ├── 017_add_push_notifications.sql    # Push tokens table
│   ├── 019_add_notifications_system.sql  # In-app notifications
│   └── 020_add_event_reminders_cron.sql  # Cron job setup
└── functions/
    ├── send-chat-notification/           # Push for chat
    ├── send-promotional-notification/    # Push for admin
    └── create-event-reminders/           # In-app reminders
```

### Why Two Separate Files?

**Problem:**
```typescript
// notification-service.ts (OLD - CAUSES CRASH)
import * as Notifications from 'expo-notifications'; // ❌ Crashes in Expo Go

// Even if you don't use it, the import runs immediately!
```

**Solution:**
```typescript
// notification-service.ts (NEW - SAFE)
import { supabase } from '../../backend/supabase'; // ✅ No expo-notifications

// push-notification-service.ts (SEPARATE)
import * as Notifications from 'expo-notifications'; // ✅ Only imported in EAS builds
```

---

## Enabling Push Notifications for EAS Builds

When you're ready to build with EAS, uncomment this code in `src/hooks/use-notifications.ts`:

```typescript
// Uncomment this entire section:
useEffect(() => {
  if (!userId) return;

  const setupPushNotifications = async () => {
    try {
      const PushService = await import('../services/push-notification-service');
      
      if (!PushService.isPushNotificationSupported()) {
        return;
      }

      const hasPermission = await PushService.requestNotificationPermissions();
      if (!hasPermission) return;

      const token = await PushService.getExpoPushToken();
      if (!token) return;

      await PushService.registerPushToken(userId, token);
    } catch (err) {
      console.error('[PUSH] Error setting up push notifications:', err);
    }
  };

  setupPushNotifications();
}, [userId]);
```

Also uncomment in `app/_layout.tsx`:
```typescript
// Change this:
// import { useNotifications } from '../src/hooks/use-notifications';

// To this:
import { useNotifications } from '../src/hooks/use-notifications';

// And change this:
function NotificationInitializer() {
  // useNotifications();
  return null;
}

// To this:
function NotificationInitializer() {
  useNotifications();
  return null;
}
```

---

## Testing Guide

### In Expo Go

**Test In-App Notifications:**
1. Accept a friend request → Notification appears in bell icon
2. Complete a booking → Confirmation notification
3. Swipe to delete notifications
4. Pull to refresh
5. Tap notification → Navigate to relevant screen

**Cannot Test:**
- ❌ Push notifications (device notifications)
- ❌ Chat push notifications
- ❌ Promotional push notifications

### In EAS Build

**Test Everything:**
1. All in-app notifications (same as above)
2. Send a message → Receive push notification
3. Close app → Still receive push notifications
4. Admin panel → Send promotional push
5. Tap push notification → App opens to relevant screen

---

## Deployment Checklist

### Migrations Applied ✅
- [x] 017: Push notifications table
- [x] 019: In-app notifications table
- [x] 020: Event reminders cron job

### Edge Functions Deployed ✅
- [x] `send-chat-notification`
- [x] `send-promotional-notification`
- [x] `create-event-reminders`

### Cron Jobs Running ✅
- [x] `create-event-reminders-hourly` (runs every hour)

### Code Status ✅
- [x] In-app notifications working in Expo Go
- [x] Push notification code ready for EAS builds
- [x] All linting and type checks passing

---

## Common Issues & Solutions

### Issue: App crashes with "Cannot find native module 'ExpoPushTokenManager'"
**Cause:** `expo-notifications` imported in a file that's loaded in Expo Go

**Solution:** 
- Keep push notification code in `push-notification-service.ts`
- Never import it directly in files loaded by Expo Go
- Use dynamic imports when needed

### Issue: Notifications not appearing in notifications screen
**Cause:** Database table doesn't exist or RLS policies blocking access

**Solution:**
```bash
# Check if migration 019 is applied
supabase migration list --linked

# If not applied, apply it
supabase db push
```

### Issue: Event reminders not being created
**Cause:** Cron job not running or edge function not deployed

**Solution:**
```bash
# Deploy edge function
supabase functions deploy create-event-reminders

# Check if cron job exists (in Supabase Dashboard)
Database → Cron Jobs → Look for "create-event-reminders-hourly"
```

### Issue: Push notifications not working in EAS build
**Cause:** Push notification registration code is still commented out

**Solution:** Follow the "Enabling Push Notifications for EAS Builds" section above

---

## Database Schema

### In-App Notifications (`notifications` table)
```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  type notification_type,  -- enum: friend_request_accepted, event_reminder, etc.
  title TEXT,
  message TEXT,
  read BOOLEAN DEFAULT FALSE,
  related_user_id UUID,
  related_event_id UUID,
  related_booking_id UUID,
  data JSONB,
  action_url TEXT,
  created_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ
);
```

### Push Tokens (`push_tokens` table)
```sql
CREATE TABLE push_tokens (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  expo_push_token TEXT UNIQUE,
  device_id TEXT,
  device_name TEXT,
  platform TEXT,  -- 'ios' | 'android' | 'web'
  app_version TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  last_used_at TIMESTAMPTZ
);
```

---

## API Reference

### In-App Notifications Service

```typescript
import * as NotificationService from '@/services/notification-service';

// Fetch notifications
const notifications = await NotificationService.getUserNotifications(userId, 50);

// Get unread count
const count = await NotificationService.getUnreadCount(userId);

// Mark as read
await NotificationService.markAsRead(notificationId);

// Mark all as read
await NotificationService.markAllAsRead(userId);

// Delete notification
await NotificationService.deleteNotification(notificationId);

// Subscribe to real-time updates
const channel = NotificationService.subscribeToNotifications(
  userId,
  (notification) => console.log('New:', notification),
  (notification) => console.log('Updated:', notification),
  (id) => console.log('Deleted:', id)
);

// Cleanup
supabase.removeChannel(channel);
```

### Push Notifications Service (EAS Only)

```typescript
import * as PushService from '@/services/push-notification-service';

// Request permissions
const hasPermission = await PushService.requestNotificationPermissions();

// Get push token
const token = await PushService.getExpoPushToken();

// Register token
await PushService.registerPushToken(userId, token);

// Unregister token (on logout)
await PushService.unregisterPushToken(token);

// Check device support
const isSupported = PushService.isPushNotificationSupported();

// Update badge count
await PushService.setBadgeCount(5);
```

---

## Summary

| Feature | In-App Notifications | Push Notifications |
|---------|---------------------|-------------------|
| **Purpose** | Show in notifications screen | Device notifications |
| **Use Cases** | Friend requests, reminders, confirmations | Chat messages, promotions |
| **Storage** | Saves to database | No database |
| **UI** | Notifications screen | Device lock screen |
| **Real-time** | Supabase subscriptions | Expo push service |
| **Expo Go** | ✅ Works | ❌ Doesn't work |
| **EAS Build** | ✅ Works | ✅ Works |
| **File** | `notification-service.ts` | `push-notification-service.ts` |
| **Badge** | Bell icon count | App icon badge |

**Remember:** These are TWO SEPARATE systems that work independently. Don't mix them!
