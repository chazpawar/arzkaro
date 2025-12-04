# Supabase + Google OAuth Setup Guide

This guide walks you through setting up Supabase authentication with Google OAuth for cross-platform support (iOS, Android, Web).

## Prerequisites

1. A Supabase project ([create one here](https://supabase.com/dashboard))
2. A Google Cloud Platform project with OAuth configured
3. Node.js and pnpm installed

## Step 1: Set Up Supabase Project

### 1.1 Create Database Tables

Your Supabase project should have the necessary auth tables. If starting fresh, ensure the auth schema is properly initialized.

### 1.2 Get Supabase Credentials

1. Go to your [Supabase Project Settings](https://supabase.com/dashboard/project/_/settings/api)
2. Copy the **Project URL** (e.g., `https://xxxxx.supabase.co`)
3. Copy the **anon/public key** from the API Keys section

## Step 2: Configure Google OAuth

### 2.1 Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API (if not already enabled)

### 2.2 Configure OAuth Consent Screen

1. Go to [APIs & Services > OAuth consent screen](https://console.cloud.google.com/apis/credentials/consent)
2. Choose "External" user type
3. Fill in app information:
   - App name: `ArzKaro`
   - User support email: your email
   - Developer contact: your email
4. Add scopes:
   - `openid`
   - `.../auth/userinfo.email`
   - `.../auth/userinfo.profile`
5. Save and continue

### 2.3 Create OAuth Credentials

You need to create **3 separate OAuth Client IDs** - one for each platform:

#### Web Client (for OAuth redirect)

1. Go to [Credentials](https://console.cloud.google.com/apis/credentials)
2. Click **Create Credentials** > **OAuth client ID**
3. Application type: **Web application**
4. Name: `ArzKaro Web`
5. Authorized JavaScript origins:
   - Your Supabase project URL: `https://xxxxx.supabase.co`
   - For local development: `http://localhost:3000`
6. Authorized redirect URIs:
   - Your Supabase callback: `https://xxxxx.supabase.co/auth/v1/callback`
   - For local dev: `http://localhost:3000/auth/v1/callback`
7. Click **Create** and save the **Client ID** and **Client Secret**

#### iOS Client

1. Create Credentials > OAuth client ID
2. Application type: **iOS**
3. Name: `ArzKaro iOS`
4. Bundle ID: `com.arzkaro.app` (from your app.json)
5. Click **Create** and save the **iOS Client ID**

#### Android Client

1. Create Credentials > OAuth client ID
2. Application type: **Android**
3. Name: `ArzKaro Android`
4. Package name: `com.arzkaro.app`
5. Get SHA-1 fingerprint:
   ```bash
   # For development, get debug keystore fingerprint
   cd android
   ./gradlew signingReport
   # Look for the SHA1 under "Variant: debug"
   ```
6. Enter the SHA-1 fingerprint
7. Click **Create** and save the **Android Client ID**

## Step 3: Configure Supabase Auth

1. Go to your [Supabase Auth Providers](https://supabase.com/dashboard/project/_/auth/providers)
2. Find **Google** in the list and click to configure
3. Enable the Google provider
4. Enter your **Web Client ID** and **Client Secret** (from Step 2.3)
5. Save the configuration

## Step 4: Configure Your App

### 4.1 Create Environment File

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

### 4.2 Fill in Environment Variables

Edit `.env` with your actual credentials:

```bash
# Supabase Configuration
EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Google OAuth Client IDs
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=your-ios-client-id.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=your-android-client-id.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=your-web-client-id.apps.googleusercontent.com
```

### 4.3 Update app.json

The `app.json` already references these environment variables in the `extra` section. Ensure your scheme matches:

```json
{
  "expo": {
    "scheme": "arzkaro",
    "ios": {
      "bundleIdentifier": "com.arzkaro.app"
    },
    "android": {
      "package": "com.arzkaro.app"
    }
  }
}
```

## Step 5: Configure Deep Linking (iOS)

### 5.1 Add URL Scheme to Info.plist

When you run `pnpm run ios`, Expo will generate the native iOS project. After the first build, you can add custom URL schemes to handle OAuth redirects.

The app is already configured with the scheme `arzkaro` in `app.json`, which Expo will use to generate the necessary configuration.

## Step 6: Install Dependencies & Rebuild

### 6.1 Install Dependencies (Already Done)

The required dependencies are already installed:

- `@supabase/supabase-js`
- `@react-native-async-storage/async-storage`
- `expo-auth-session`
- `expo-crypto`
- `expo-web-browser`
- `expo-constants`

### 6.2 Rebuild the App

Since we added native dependencies (AsyncStorage), you need to rebuild:

```bash
pnpm run ios
```

This will:

1. Rebuild the native iOS app with new dependencies
2. Start Metro bundler
3. Launch the app in iPhone 17 Pro simulator

## Step 7: Test Authentication

1. Launch the app - you should see the sign-in screen
2. Tap "Continue with Google"
3. Browser should open with Google sign-in
4. Sign in with your Google account
5. Authorize the app
6. You should be redirected back to the app and signed in

## Troubleshooting

### OAuth Redirect Issues

If you get stuck on the Google sign-in screen or the redirect doesn't work:

1. **Check redirect URLs**: Make sure the redirect URL in your code matches what's configured in:
   - Google Cloud Console (Authorized redirect URIs)
   - Supabase Auth Settings

2. **Check scheme**: Verify `arzkaro://` is properly configured as your app scheme

3. **Console logs**: Check Metro bundler logs and Xcode console for errors

### Environment Variables Not Loading

If you see "Missing Supabase environment variables":

1. Ensure `.env` file exists in project root
2. Restart Metro bundler: Kill the process and run `pnpm start` again
3. Clear Expo cache: `npx expo start -c`

### Google Sign-In Opens But Doesn't Redirect

1. Check that the bundle ID matches between:
   - `app.json` (`ios.bundleIdentifier`)
   - Google Cloud Console (iOS client)
   - Generated iOS app (check in Xcode)

2. Ensure URL scheme is properly registered

## Development Workflow

### After Initial Setup

For most development work, you DON'T need to rebuild:

```bash
# Just start Metro bundler
pnpm start
```

### When to Rebuild

Only rebuild when you:

- Install new native dependencies
- Change `app.json` configuration
- Modify native code

```bash
# Rebuild for iOS
pnpm run ios
```

## Security Notes

1. **Never commit `.env`** - it's already in `.gitignore`
2. **Protect your keys** - The anon key is safe for client use, but keep your service role key secret
3. **Use Row Level Security (RLS)** - Always enable RLS on your Supabase tables
4. **Validate redirects** - Only allow trusted redirect URLs in production

## Next Steps

1. Set up Row Level Security policies in Supabase
2. Create user profiles table
3. Add profile management screens
4. Implement protected routes
5. Add user data syncing

## References

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Expo Auth Session](https://docs.expo.dev/versions/latest/sdk/auth-session/)
- [Google OAuth Setup](https://developers.google.com/identity/protocols/oauth2)
