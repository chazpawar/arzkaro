# Arzkaro - Complete Setup Guide

> **Step-by-step guide for setting up the Arzkaro app from scratch**

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Initial Setup](#initial-setup)
3. [Environment Configuration](#environment-configuration)
4. [Database Setup](#database-setup)
5. [Running the App](#running-the-app)
6. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software

Before you begin, install the following:

#### 1. **Xcode** (macOS only - for iOS development)

```bash
# Install from Mac App Store
# After installation, install command line tools:
xcode-select --install
```

#### 2. **Node.js** (LTS version recommended)

```bash
# Using Homebrew (recommended):
brew install node@20

# Verify installation:
node --version  # Should show v20.x.x or higher
npm --version   # Should show v10.x.x or higher
```

#### 3. **pnpm** (Package Manager)

```bash
# Install globally:
npm install -g pnpm

# Verify installation:
pnpm --version  # Should show v9.x.x or higher
```

#### 4. **CocoaPods** (iOS dependency manager)

```bash
# Install via RubyGems:
sudo gem install cocoapods

# Verify installation:
pod --version  # Should show v1.15.x or higher
```

#### 5. **Expo CLI** (Optional but recommended)

```bash
# Install globally:
pnpm install -g @expo/cli

# Verify installation:
npx expo --version
```

#### 6. **Git**

```bash
# Usually pre-installed on macOS
# Verify:
git --version
```

### System Requirements

- **macOS**: 12.0 (Monterey) or later
- **RAM**: 8GB minimum, 16GB recommended
- **Storage**: 20GB free space minimum
- **Xcode**: 15.0 or later

---

## Initial Setup

### Step 1: Clone the Repository

```bash
# Clone the repository
git clone https://github.com/chazpawar/arzkaro.git

# Navigate to the project directory
cd arzkaro

# Check current branch
git branch
# Should show: * dj-rohit
```

### Step 2: Install Dependencies

```bash
# Install Node.js dependencies
pnpm install

# This will install all packages from package.json
# Should take 1-3 minutes
```

### Step 3: Install iOS Dependencies

```bash
# Navigate to iOS folder and install pods
cd ios
pod install
cd ..

# This will install native iOS dependencies
# Should take 2-5 minutes on first run
```

---

## Environment Configuration

### Step 1: Create Environment File

```bash
# Copy the example environment file
cp .env.example .env
```

### Step 2: Configure Supabase

You need to set up a Supabase project and get credentials:

1. **Go to Supabase Dashboard**:
   - Visit: https://supabase.com
   - Sign up or log in
   - Create a new project

2. **Get Project Credentials**:
   - Go to: Project Settings → API
   - Copy the following values:

3. **Update `.env` file**:

```bash
# Open .env file
nano .env  # or use your preferred editor

# Add your Supabase credentials:
EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key-here
```

### Step 3: Configure Google OAuth (Optional for Sign In)

If you want Google Sign-In to work:

1. **Go to Google Cloud Console**:
   - Visit: https://console.cloud.google.com
   - Create a new project or select existing

2. **Enable Google+ API**:
   - Go to: APIs & Services → Library
   - Search for "Google+ API"
   - Click Enable

3. **Create OAuth Credentials**:
   - Go to: APIs & Services → Credentials
   - Click "Create Credentials" → "OAuth 2.0 Client ID"
   - Create THREE client IDs:
     - **iOS** application
     - **Android** application
     - **Web** application

4. **Configure Redirect URIs** (for Web client):
   - Add: `https://your-project-id.supabase.co/auth/v1/callback`
   - Add: `arzkaro://auth/callback`

5. **Update `.env` file**:

```bash
# Add Google OAuth credentials to .env:
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=your-ios-client-id.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=your-android-client-id.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=your-web-client-id.apps.googleusercontent.com
```

6. **Configure Supabase Auth**:
   - Go to: Supabase Dashboard → Authentication → Providers
   - Enable Google
   - Add your Google Web Client ID and Client Secret

### Step 4: Verify Environment Setup

```bash
# Check if .env file has all required variables
cat .env

# Should see all EXPO_PUBLIC_* variables filled
```

---

## Database Setup

### Step 1: Run Migrations

```bash
# Make migration script executable
chmod +x apply-migration.sh

# Run all migrations
./apply-migration.sh
```

**What this does:**

- Creates database tables (users, profiles, events, tickets, etc.)
- Sets up Row Level Security (RLS) policies
- Creates database functions and triggers
- Configures authentication

### Step 2: Verify Database Setup

1. **Go to Supabase Dashboard**:
   - Navigate to: Table Editor
   - You should see tables: `profiles`, `events`, `bookings`, `tickets`, `chats`, etc.

2. **Check Authentication**:
   - Navigate to: Authentication → Users
   - Should be empty (no users yet)

---

## Running the App

### Option 1: Run on iOS Simulator (Recommended)

```bash
# Build and run the app on iOS simulator
pnpm run ios

# This will:
# 1. Build the native iOS app (takes 5-10 min first time)
# 2. Launch iOS Simulator
# 3. Install the app
# 4. Start Metro bundler
# 5. Open the app
```

**What to expect:**

- First build takes 5-10 minutes
- Simulator will open automatically
- App will launch showing the auth screen
- Metro bundler runs in terminal

**Simulator controls:**

- `Cmd + D` - Open developer menu
- `Cmd + R` - Reload app
- `Cmd + Shift + H` - Go to home screen

### Option 2: Start Metro Bundler Only

```bash
# If app is already installed, just start Metro:
pnpm start

# Then in the simulator, shake device or press Cmd+D
# and tap "Reload"
```

### Option 3: Run on Specific iOS Device

```bash
# List available simulators
xcrun simctl list devices available

# Run on specific device
pnpm run ios --device "iPhone 15 Pro Max"
```

---

## Verify Everything Works

### 1. App Launches

- ✅ iOS Simulator opens
- ✅ App shows the Arzkaro logo
- ✅ Auth screen appears with "Continue with Google" button

### 2. Sign In Works (if Google OAuth configured)

- ✅ Click "Continue with Google"
- ✅ Browser opens for Google sign in
- ✅ After sign in, redirects back to app
- ✅ App shows main tabs: Explore, Chats, Tickets, Profile

### 3. Navigation Works

- ✅ Can switch between tabs
- ✅ Profile tab shows user info
- ✅ Explore tab shows events (may be empty)

### 4. Sign Out Works

- ✅ Go to Profile tab
- ✅ Click "Sign Out" button
- ✅ Confirm sign out
- ✅ Returns to auth screen

---

## Development Workflow

### Daily Development

```bash
# 1. Start the app (if not already running)
pnpm run ios

# 2. Edit code in your editor
# Examples:
# - Edit app/index.tsx
# - Edit src/components/Button.tsx
# - Edit app/(tabs)/profile.tsx

# 3. Save the file
# App will automatically reload (Fast Refresh)

# 4. See changes instantly in simulator!
```

### When to Rebuild

**NO rebuild needed** for:

- ✅ Editing React components
- ✅ Changing styles
- ✅ Updating TypeScript code
- ✅ Adding new screens/routes
- ✅ Modifying constants

**Rebuild required** for:

- 🔧 Installing packages with native code
- 🔧 Changing app.json or app.config.js
- 🔧 Adding Expo plugins
- 🔧 Modifying iOS permissions

**How to rebuild:**

```bash
# Stop the current build (Ctrl+C)
# Then run:
pnpm run ios
```

---

## Troubleshooting

### Issue: "Unable to resolve module"

**Solution:**

```bash
# Clear Metro cache and reinstall
rm -rf node_modules
pnpm install
pnpm start -- --reset-cache
```

### Issue: "Pod install failed"

**Solution:**

```bash
cd ios
rm -rf Pods Podfile.lock
pod deintegrate
pod install
cd ..
pnpm run ios
```

### Issue: "No development build found"

**Solution:**

```bash
# Rebuild the app
pnpm run ios
```

### Issue: "Port 8081 already in use"

**Solution:**

```bash
# Kill process using port 8081
lsof -ti:8081 | xargs kill -9

# Then restart
pnpm start
```

### Issue: Simulator not opening

**Solution:**

```bash
# Open simulator manually
open -a Simulator

# Then run
pnpm start
# Press 'i' to launch on iOS
```

### Issue: White screen or app crashes

**Solution:**

```bash
# Full clean rebuild
rm -rf node_modules ios/Pods ios/Podfile.lock
pnpm install
cd ios && pod install && cd ..
pnpm run ios
```

### Issue: "Supabase credentials missing"

**Solution:**

- Check that `.env` file exists
- Verify all `EXPO_PUBLIC_*` variables are set
- Restart Metro: `pnpm start --clear`

### Issue: Google Sign In not working

**Possible causes:**

1. `.env` file missing Google OAuth credentials
2. Google Cloud Console credentials not configured
3. Supabase Auth provider not enabled

**Solution:**

- Follow [Step 3: Configure Google OAuth](#step-3-configure-google-oauth-optional-for-sign-in)
- Verify redirect URIs match
- Check Supabase Auth settings

---

## Common Commands Reference

```bash
# Install dependencies
pnpm install

# Start Metro bundler
pnpm start

# Build and run on iOS
pnpm run ios

# Clear Metro cache
pnpm start -- --reset-cache

# Install iOS pods
cd ios && pod install && cd ..

# Check TypeScript errors
pnpm run type-check
# or
npx tsc --noEmit

# Run linter
pnpm run lint

# Full clean reinstall
rm -rf node_modules ios/Pods ios/Podfile.lock
pnpm install
cd ios && pod install && cd ..
pnpm run ios
```

---

## Project Structure Overview

```
arzkaro/
├── app/                    # Expo Router screens (file-based routing)
│   ├── (tabs)/            # Tab navigation screens
│   │   ├── explore.tsx    # Events/Explore tab
│   │   ├── chats.tsx      # Chats tab
│   │   ├── tickets.tsx    # Tickets tab
│   │   └── profile.tsx    # Profile tab
│   ├── events/            # Event-related screens
│   ├── admin/             # Admin dashboard (role: admin)
│   ├── host/              # Host dashboard (role: host)
│   └── index.tsx          # Entry point (auth check)
│
├── src/                   # Source code
│   ├── components/        # Reusable UI components
│   ├── constants/         # Design system (Colors, Styles)
│   ├── contexts/          # React contexts (auth-context)
│   ├── hooks/             # Custom hooks (use-events, use-bookings)
│   ├── services/          # API services (event-service, etc.)
│   ├── types/             # TypeScript type definitions
│   └── utils/             # Utility functions
│
├── backend/               # Backend configuration
│   ├── supabase.ts        # Supabase client setup
│   ├── auth.ts            # Authentication helpers
│   └── types/             # Database types
│
├── supabase/              # Supabase configuration
│   ├── migrations/        # Database migration files
│   └── config.toml        # Supabase config
│
├── .env                   # Environment variables (create from .env.example)
├── app.json               # Expo configuration
├── eas.json               # EAS Build configuration
├── package.json           # Dependencies
└── tsconfig.json          # TypeScript configuration
```

---

## Next Steps

1. ✅ **Test the app** - Run through sign in/out flow
2. ✅ **Explore the code** - Check out different screens in `app/`
3. ✅ **Read docs** - See [DEVELOPMENT_WORKFLOW.md](./docs/DEVELOPMENT_WORKFLOW.md) for daily development
4. ✅ **Start developing** - Add features, modify UI, integrate APIs

---

## Additional Resources

- **Development Workflow**: [docs/DEVELOPMENT_WORKFLOW.md](./docs/DEVELOPMENT_WORKFLOW.md)
- **iOS Build Guide**: [docs/planios.md](./docs/planios.md)
- **Expo Documentation**: https://docs.expo.dev
- **Supabase Documentation**: https://supabase.com/docs
- **React Native Documentation**: https://reactnative.dev

---

## Getting Help

If you encounter issues:

1. Check the [Troubleshooting](#troubleshooting) section
2. Read [DEVELOPMENT_WORKFLOW.md](./docs/DEVELOPMENT_WORKFLOW.md)
3. Check Expo logs in terminal
4. Look for error messages in the app (red screen)

---

**Happy Coding! 🚀**

Built with ❤️ using Expo, React Native, and Supabase
