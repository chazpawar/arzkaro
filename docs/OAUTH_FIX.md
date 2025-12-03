# OAuth Callback Configuration Fix

## Problem
After Google OAuth login, the app was showing "Unmatched route" error because it was trying to navigate to a route that expo-router couldn't handle properly.

## Root Cause
The original implementation was manually creating a `/auth/callback` route and trying to handle the OAuth callback there. However, with `expo-web-browser` and `skipBrowserRedirect: true`, the proper pattern is to:
1. Let `WebBrowser.openAuthSessionAsync` handle the redirect
2. Process the callback URL directly using `Linking.useURL()`
3. Extract tokens and create the session programmatically

## Solution Applied

### 1. Updated `backend/auth.ts`
- Added `createSessionFromUrl` function to extract tokens from callback URL
- Modified `signInWithGoogle` to use `makeRedirectUri()` instead of hardcoded URL
- Used `QueryParams.getQueryParams()` to properly parse OAuth response
- Used `supabase.auth.setSession()` to create session from tokens

### 2. Updated `app/index.tsx`
- Added deep link handling with `Linking.useURL()`
- Automatically processes OAuth callback when app reopens
- No need for separate callback route

### 3. Removed `/auth/callback` route
- Deleted `app/auth/callback.tsx`
- Removed route registration from `app/_layout.tsx`

## Required Supabase Configuration

### Redirect URLs to Add in Supabase Dashboard

Go to your Supabase project dashboard:
**Authentication > URL Configuration > Redirect URLs**

Add these URLs:

**For Development:**
```
exp://localhost:8081
exp://localhost:8081/**
```

**For Production (replace with your actual scheme from app.config.js):**
```
arzkaro://
arzkaro://**
```

**For Expo Go (development only):**
```
exp://127.0.0.1:8081/--/**
```

### Site URL
Set your site URL to:
```
exp://localhost:8081
```
Or for production:
```
arzkaro://
```

## How It Works Now

1. User taps "Sign in with Google"
2. `signInWithGoogle()` is called
3. `makeRedirectUri()` generates proper redirect URL (e.g., `exp://localhost:8081`)
4. OAuth URL is opened in browser
5. User authenticates with Google
6. Browser redirects back to app using deep link
7. `Linking.useURL()` in `app/index.tsx` detects the URL
8. `createSessionFromUrl()` extracts `access_token` and `refresh_token`
9. `supabase.auth.setSession()` creates the session
10. `AuthContext` detects the session and updates UI
11. Home screen displays authenticated content

## Testing

1. Make sure Metro bundler is running: `npx expo start --dev-client`
2. Make sure app is installed on emulator/device
3. Tap "Sign in with Google"
4. Complete authentication
5. App should automatically return and show authenticated content

## Important Notes

- The redirect URL pattern has changed from `arzkaro://auth/callback` to just using `makeRedirectUri()`
- No manual route handling needed - expo-auth-session handles it automatically
- The `skipBrowserRedirect: true` option is crucial for native apps
- `detectSessionInUrl: false` in Supabase client config prevents automatic URL detection (we handle it manually)

## References

- [Supabase Native Mobile Deep Linking](https://supabase.com/docs/guides/auth/native-mobile-deep-linking)
- [Expo Deep Linking](https://docs.expo.dev/guides/deep-linking/)
- [expo-auth-session](https://docs.expo.dev/versions/latest/sdk/auth-session/)
