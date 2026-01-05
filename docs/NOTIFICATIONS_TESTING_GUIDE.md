# Notifications Testing Guide

## Overview
This guide helps you test all notification features in the ArzKaro app.

## Prerequisites
- Two test devices or accounts (Device A and Device B)
- Admin access to Supabase Dashboard
- Test events with bookings scheduled 24 hours in the future

---

## Test 1: Badge Count on Bell Icon

### Steps:
1. Open the app on Device A
2. Navigate to Explore tab
3. Look at the bell icon in the top-right corner
4. Verify that:
   - ✅ No badge appears when there are no unread notifications
   - ✅ Badge appears with correct count when unread notifications exist
   - ✅ Badge shows "99+" when count exceeds 99

### Expected Behavior:
- Badge is red circle with white text
- Badge position: top-right of bell icon
- Badge updates in real-time when new notifications arrive

---

## Test 2: Friend Request Accepted Notification

### Setup:
- Device A: User A (will send friend request)
- Device B: User B (will accept friend request)

### Steps:

**On Device A:**
1. Go to Friends tab
2. Search for User B
3. Send friend request to User B
4. Note: Do NOT navigate away from Friends tab yet

**On Device B:**
1. Go to Friends tab
2. You should see friend request from User A in "Requests" section
3. Tap "Accept" button
4. Verify notification was sent to User A

**Back on Device A:**
1. Wait 2-3 seconds
2. Navigate to Explore tab
3. Check the bell icon - badge count should increase
4. Tap bell icon to open notifications
5. Verify notification appears:
   - ✅ Title: "{User B} accepted your friend request"
   - ✅ Message: "You are now friends with {User B}"
   - ✅ Avatar: User B's profile picture
   - ✅ Icon badge: Green checkmark
   - ✅ Time: "Just now" or "X seconds ago"
   - ✅ Blue background (unread)

**Interaction Tests:**
6. Tap the notification
7. Verify:
   - ✅ Background turns white (marked as read)
   - ✅ Blue dot disappears
   - ✅ Badge count decreases on bell icon
   - ✅ Navigates to User B's profile (if action_url is set)

**Delete Test:**
8. Swipe left on the notification
9. Verify red delete button appears
10. Tap "Delete"
11. Confirm deletion in alert
12. Verify notification is removed from list

---

## Test 3: Booking Confirmed Notification

### Setup:
- Device A: User A (will book event)
- Create a test event with paid tickets

### Steps:

**On Device A:**
1. Navigate to Explore tab
2. Find and tap on a paid event
3. Tap "Book Now"
4. Select ticket quantity
5. Complete Razorpay payment (use test card if in test mode)
6. Wait for payment confirmation
7. Go back to Explore tab
8. Tap bell icon
9. Verify notification appears:
   - ✅ Title: "Booking Confirmed"
   - ✅ Message: "Your booking for '{Event Title}' has been confirmed"
   - ✅ Icon: Blue checkmark circle
   - ✅ Time: "Just now"
   - ✅ Blue background (unread)

**Interaction Tests:**
10. Tap the notification
11. Verify:
    - ✅ Background turns white (marked as read)
    - ✅ Badge count decreases
    - ✅ Navigates to booking details (Tickets tab)

---

## Test 4: Event Reminder Notification (24h before event)

### Setup:
This test requires a cron job to be running. For manual testing:

**Option A: Manual Trigger (Recommended for Testing)**

1. Go to Supabase SQL Editor
2. Create a test event starting in 23.5 hours:
   ```sql
   -- Insert test event (adjust start_date to be 23.5 hours from now)
   INSERT INTO events (title, start_date, type, price, host_id)
   VALUES (
     'Test Event for Reminders',
     NOW() + INTERVAL '23 hours 30 minutes',
     'event',
     500,
     '<your-user-id>'
   );
   
   -- Get the event_id
   SELECT id, title, start_date FROM events 
   WHERE title = 'Test Event for Reminders';
   ```

3. Book the event on Device A (complete payment)

4. Manually trigger the reminder function:
   ```sql
   SELECT create_event_reminders();
   ```

5. On Device A, check notifications:
   - ✅ Title: "Event Reminder"
   - ✅ Message: "'{Event Title}' starts in 24 hours!"
   - ✅ Icon: Yellow clock
   - ✅ Blue background (unread)

6. Tap notification
   - ✅ Should navigate to event details page

**Option B: Wait for Cron Job (If Set Up)**

1. Book an event that starts tomorrow at the same time
2. Wait for the hourly cron job to run
3. Check notifications 24 hours before event

---

## Test 5: Real-Time Updates

### Setup:
- Device A and Device B logged in as different users

### Steps:

**On Device A:**
1. Open Notifications screen
2. Keep it visible

**On Device B:**
1. Accept a friend request from User A (or trigger any notification)

**Back on Device A:**
2. Watch the Notifications screen
3. Verify:
   - ✅ New notification appears WITHOUT refreshing
   - ✅ "Just now" timestamp
   - ✅ Badge count increases automatically
   - ✅ Smooth animation when notification appears

---

## Test 6: Mark All as Read

### Steps:
1. Ensure you have 3+ unread notifications
2. Go to Notifications screen
3. Verify header shows: "X unread notifications"
4. Tap "Mark all as read" button
5. Verify:
   - ✅ All notifications turn white
   - ✅ All blue dots disappear
   - ✅ Header disappears
   - ✅ Badge on bell icon goes to 0
   - ✅ Updates happen smoothly with animation

---

## Test 7: Swipe to Delete

### Steps:
1. Open Notifications screen
2. Pick any notification
3. Swipe left slowly
4. Verify:
   - ✅ Red background appears
   - ✅ Trash icon visible
   - ✅ "Delete" text visible
5. Release swipe before reaching 60px
6. Verify notification springs back
7. Swipe left again past 60px
8. Release
9. Verify delete button stays visible
10. Tap anywhere on notification card
11. Verify it closes back to original position
12. Swipe again and tap "Delete"
13. Confirm in alert
14. Verify:
    - ✅ Notification is removed
    - ✅ If unread, badge count decreases
    - ✅ Smooth deletion animation

---

## Test 8: Empty State

### Steps:
1. Delete all notifications
2. Or test with new account with no notifications
3. Verify empty state shows:
   - ✅ Bell icon with slash
   - ✅ "No Notifications" title
   - ✅ "You're all caught up!" message

---

## Test 9: Error State

### Steps:
1. Turn off internet connection
2. Open Notifications screen
3. Verify error state shows:
   - ✅ Alert icon
   - ✅ "Error Loading Notifications" title
   - ✅ Error message
   - ✅ "Retry" button
4. Turn internet back on
5. Tap "Retry"
6. Verify notifications load successfully

---

## Test 10: Pull to Refresh

### Steps:
1. Open Notifications screen
2. Pull down from top
3. Verify:
   - ✅ Loading spinner appears
   - ✅ Notifications refresh
   - ✅ New notifications appear (if any)
   - ✅ Spinner disappears when done

---

## Database Verification Tests

### Check Notification Creation

Run in Supabase SQL Editor:

```sql
-- View all notifications
SELECT 
  n.id,
  n.type,
  n.title,
  n.message,
  n.read,
  n.created_at,
  p.username as recipient,
  ru.username as related_user
FROM notifications n
LEFT JOIN profiles p ON p.id = n.user_id
LEFT JOIN profiles ru ON ru.id = n.related_user_id
ORDER BY n.created_at DESC
LIMIT 20;
```

### Check Trigger Functionality

```sql
-- Test friend request accepted trigger
UPDATE friend_requests 
SET status = 'accepted'
WHERE id = '<request-id>';

-- Verify notification was created
SELECT * FROM notifications 
WHERE type = 'friend_request_accepted'
ORDER BY created_at DESC
LIMIT 1;
```

```sql
-- Test booking confirmed trigger
UPDATE bookings
SET payment_status = 'completed'
WHERE id = '<booking-id>';

-- Verify notification was created
SELECT * FROM notifications 
WHERE type = 'booking_confirmed'
ORDER BY created_at DESC
LIMIT 1;
```

---

## Performance Tests

### Test with Many Notifications

1. Create 100+ notifications using SQL:
   ```sql
   DO $$
   BEGIN
     FOR i IN 1..100 LOOP
       INSERT INTO notifications (user_id, type, title, message, read)
       VALUES (
         '<your-user-id>',
         'event_reminder',
         'Test Notification ' || i,
         'This is test notification number ' || i,
         i % 3 = 0  -- Every 3rd notification is read
       );
     END LOOP;
   END $$;
   ```

2. Open Notifications screen
3. Verify:
   - ✅ Loads quickly (< 2 seconds)
   - ✅ Smooth scrolling
   - ✅ Badge shows "99+" when over 99 unread
   - ✅ No lag when swiping

---

## Edge Cases to Test

### 1. Long Notification Text
- Create notification with 500+ character message
- Verify text is truncated with ellipsis
- Verify card doesn't overflow

### 2. No Avatar
- Test notification from user with no profile picture
- Verify icon appears instead of avatar

### 3. Notification with No Action URL
- Create notification without action_url
- Tap notification
- Verify it marks as read but doesn't navigate

### 4. Rapid Notification Creation
- Trigger 5 notifications within 1 second
- Verify all appear correctly
- Verify badge count is accurate

---

## Troubleshooting

### Notifications Not Appearing

1. **Check database triggers:**
   ```sql
   SELECT * FROM pg_trigger 
   WHERE tgname LIKE 'trigger_%';
   ```

2. **Check notification logs:**
   ```sql
   SELECT * FROM notifications 
   ORDER BY created_at DESC 
   LIMIT 10;
   ```

3. **Check real-time subscription:**
   - Look for console logs: `[NOTIFICATIONS HOOK] Setting up realtime`
   - Verify Supabase real-time is enabled in dashboard

### Badge Count Incorrect

1. **Recalculate unread count:**
   ```sql
   SELECT COUNT(*) FROM notifications 
   WHERE user_id = '<your-user-id>' 
   AND read = false;
   ```

2. **Check hook logs in browser console**

### Swipe Not Working

1. Verify you're swiping horizontally (not vertically)
2. Swipe more than 10px to trigger
3. Check if device has gesture conflicts

---

## Success Criteria

All tests should pass with:
- ✅ No crashes
- ✅ Correct notification data
- ✅ Real-time updates working
- ✅ Smooth animations
- ✅ Accurate badge counts
- ✅ Proper navigation
- ✅ Data persistence after app restart

---

## Next Steps After Testing

1. Fix any bugs discovered
2. Test on both iOS and Android
3. Test with slow internet connection
4. Test with airplane mode transitions
5. Monitor error logs in production
6. Set up analytics for notification interactions

---

**Testing Status:** ⏳ Ready for testing  
**Last Updated:** Dec 30, 2025
