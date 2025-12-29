# Push Notification Setup Guide for ArzKaro

## Overview

You're using: **Supabase (backend) + Expo Push Notifications (delivery)**

- ✅ Supabase: Handles your database, auth, and edge functions
- ✅ Expo: Handles push notification delivery to devices
- ⚠️ Firebase: Required ONLY for Android push notification infrastructure (Google requirement)
- ⚠️ Apple: Required for iOS push notification infrastructure

## Why Do I Need Firebase If I Use Supabase?

**Short answer:** Google requires it for Android push notifications.

**The flow:**
```
Your App → Supabase Edge Function → Expo Push Service → FCM (Android) / APNs (iOS) → Devices
```

Firebase is ONLY used for the final delivery step to Android devices. You don't use Firebase database, Firebase auth, or any other Firebase services.

---

## Setup Instructions

### Step 1: Android - Firebase Setup (Required for Android notifications)

#### 1.1 Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click "Add project"
3. Name it: `arzkaro` (or any name you prefer)
4. Disable Google Analytics (not needed)
5. Click "Create project"

#### 1.2 Add Android App to Firebase

1. In Firebase Console, click "Add app" → Android icon
2. Android package name: `com.arzkaro.app` (must match your app.config.js)
3. App nickname: `ArzKaro`
4. Click "Register app"
5. **Download `google-services.json`**
6. Place it in your project root: `/Users/RohitKumar/Desktop/arzkaro/google-services.json`
7. Click "Next" → "Next" → "Continue to console"

#### 1.3 Generate Service Account Key (for Expo)

1. In Firebase Console: Project Settings (gear icon) → Service Accounts tab
2. Click "Generate new private key"
3. Click "Generate key"
4. Save the JSON file (e.g., `arzkaro-firebase-adminsdk.json`)
5. ⚠️ **Keep this file secure - DO NOT commit to git**

#### 1.4 Upload to EAS (Expo Application Services)

Option A - Using EAS CLI:
```bash
# Install EAS CLI if not already installed
npm install -g eas-cli

# Login to your Expo account
eas login

# Configure credentials
eas credentials

# Select: Android → production → Google Service Account
# Select: Manage your Google Service Account Key for Push Notifications (FCM V1)
# Select: Set up a Google Service Account Key for Push Notifications (FCM V1)
# Select: Upload a new service account key
# Navigate to your downloaded JSON file
```

Option B - Using Expo Dashboard:
1. Go to [expo.dev](https://expo.dev)
2. Select your project: `arzkaro`
3. Go to: Credentials → Android
4. Under "FCM V1 service account key" → "Add a service account key"
5. Upload the JSON file you downloaded in step 1.3

---

### Step 2: iOS - Apple Push Notifications Setup

⚠️ **Requirements:**
- Paid Apple Developer Account ($99/year)
- Physical iOS device (simulator doesn't support push notifications)

#### 2.1 Option A: Let EAS Handle It (Recommended)

When you run your first build:
```bash
eas build --platform ios --profile development
```

EAS will ask:
- "Setup Push Notifications for your project?" → **YES**
- "Generating a new Apple Push Notifications service key" → **YES**

EAS will automatically create and manage the APNs credentials for you.

#### 2.2 Option B: Manual Setup

1. Go to [Apple Developer Portal](https://developer.apple.com/account)
2. Certificates, Identifiers & Profiles → Keys
3. Click "+" to create a new key
4. Name: `ArzKaro Push Notifications`
5. Enable: Apple Push Notifications service (APNs)
6. Click "Continue" → "Register"
7. Download the `.p8` file
8. Note the Key ID
9. Upload to EAS using `eas credentials`

---

### Step 3: Build the App

#### 3.1 Create Development Build

For Android:
```bash
eas build --platform android --profile development
```

For iOS:
```bash
eas build --platform ios --profile development
```

For both:
```bash
eas build --platform all --profile development
```

#### 3.2 Install on Physical Device

After build completes:
1. Download the build from EAS dashboard
2. Install on your physical device
   - Android: Install the `.apk` file
   - iOS: Install via TestFlight or direct installation

⚠️ **Important:** Push notifications DO NOT work on emulators/simulators!

---

### Step 4: Test Push Notifications

#### 4.1 Get Your Push Token

1. Open your app on a physical device
2. Login or signup
3. The app will automatically register for push notifications
4. Check your Supabase database → `push_tokens` table
5. Copy your `expo_push_token` (starts with `ExponentPushToken[...]`)

#### 4.2 Send a Test Notification

**Method 1: Using Expo Push Tool**
1. Go to [expo.dev/notifications](https://expo.dev/notifications)
2. Paste your `ExponentPushToken`
3. Enter a title and message
4. Click "Send a Notification"

**Method 2: Using Your App (DM Test)**
1. Create two user accounts
2. Send a direct message from User A to User B
3. User B should receive a push notification

**Method 3: Using Admin Panel**
1. Login as admin user
2. Go to Admin Dashboard → Notifications
3. Send a promotional notification
4. All users should receive it

---

## Troubleshooting

### Android Issues

**Problem:** No notification received on Android
- ✅ Check: `google-services.json` is in project root
- ✅ Check: Service account key uploaded to EAS
- ✅ Check: Using a physical device (not emulator)
- ✅ Check: App has notification permissions enabled
- ✅ Check: Push token is in `push_tokens` table

**Problem:** "Failed to get push token"
- Run: `eas build --platform android --profile development --clear-cache`

### iOS Issues

**Problem:** No notification received on iOS
- ✅ Check: Using a paid Apple Developer account
- ✅ Check: Using a physical device (not simulator)
- ✅ Check: APNs credentials uploaded to EAS
- ✅ Check: App has notification permissions enabled

**Problem:** "Push notification entitlement not configured"
- Run: `eas credentials` and reconfigure iOS push notifications

### General Issues

**Problem:** Push token not saved to database
- Check: User is logged in
- Check: `useNotifications()` hook is initialized in `app/_layout.tsx`
- Check: No errors in console logs

**Problem:** Notifications received but not opening correct screen
- Check: Notification data contains correct `type`, `conversationId`, `eventId`
- Check: Routing logic in `src/hooks/use-notifications.ts`

---

## Architecture Summary

### Your Complete Stack:

```
┌─────────────────────────────────────────────────────────────┐
│                     Your React Native App                    │
│                                                               │
│  - expo-notifications (get push tokens)                      │
│  - useNotifications() hook (handle taps)                     │
└───────────────────────────┬─────────────────────────────────┘
                            │ registers push token
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                      Supabase Backend                        │
│                                                               │
│  - push_tokens table (stores tokens)                         │
│  - Database triggers (on new messages)                       │
│  - Edge Functions (send notifications)                       │
└───────────────────────────┬─────────────────────────────────┘
                            │ HTTP POST
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                  Expo Push Notification Service              │
│                                                               │
│  - Receives from your Supabase Edge Function                 │
│  - Routes to FCM or APNs based on device                     │
└─────────────┬────────────────────────────┬──────────────────┘
              │                            │
              ↓                            ↓
   ┌──────────────────┐          ┌──────────────────┐
   │  Firebase FCM    │          │   Apple APNs     │
   │   (Android)      │          │     (iOS)        │
   └────────┬─────────┘          └────────┬─────────┘
            │                             │
            ↓                             ↓
   Android Devices               iOS Devices
```

### What Each Service Does:

1. **Your App (React Native + Expo)**
   - Gets push tokens from user's device
   - Sends tokens to Supabase
   - Handles notification taps

2. **Supabase (Your Backend)**
   - Stores push tokens in database
   - Detects new messages (via triggers)
   - Calls Expo Push API (via Edge Functions)

3. **Expo Push Service (Middle Layer)**
   - Receives notification requests
   - Formats them for FCM/APNs
   - Handles delivery

4. **Firebase FCM (Android Only)**
   - Google's required service for Android
   - Delivers notifications to Android devices

5. **Apple APNs (iOS Only)**
   - Apple's service for iOS
   - Delivers notifications to iOS devices

---

## Cost Breakdown

| Service | Cost | What You Use It For |
|---------|------|---------------------|
| Supabase | Free tier available | Backend, database, auth, edge functions |
| Expo | Free (600 notifications/second) | Push notification routing |
| Firebase | Free | Android FCM only (no other services) |
| Apple Developer | $99/year | iOS app distribution + APNs |
| EAS Build | Free tier: 30 builds/month | Building the app |

---

## Next Steps

1. ✅ Create Firebase project
2. ✅ Download `google-services.json` → place in project root
3. ✅ Generate Firebase service account key
4. ✅ Upload service account key to EAS
5. ✅ Build app: `eas build --platform all --profile development`
6. ✅ Install on physical device
7. ✅ Test notifications

---

## Quick Reference

### Important Files:
- `app.config.js` - App configuration (already updated)
- `google-services.json` - Firebase config (you need to add this)
- `supabase/functions/send-chat-notification/` - Edge function for chat notifications
- `supabase/functions/send-promotional-notification/` - Edge function for admin notifications
- `src/hooks/use-notifications.ts` - Client-side notification handling
- `src/services/notification-service.ts` - Notification utilities

### Important Commands:
```bash
# Login to Expo
eas login

# Configure credentials
eas credentials

# Build for development
eas build --platform android --profile development
eas build --platform ios --profile development

# View logs
eas build:list
supabase functions logs send-chat-notification
```

### Important URLs:
- Expo Dashboard: https://expo.dev
- Firebase Console: https://console.firebase.google.com
- Supabase Dashboard: https://supabase.com/dashboard
- Push Notification Tester: https://expo.dev/notifications
- Apple Developer: https://developer.apple.com

---

**Need Help?** Check the troubleshooting section or reach out to the team.
