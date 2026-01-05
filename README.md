# Arzkaro - React Native Expo Setup Guide

## 🚀 Quick Start

This project is set up with React Native, Expo, and local EAS builds using **pnpm** as the package manager.

## 📚 Documentation

### iOS Development
- [**Development Workflow (iOS)**](./docs/DEVELOPMENT_WORKFLOW.md): Daily guide, troubleshooting, and tips
- [**iOS Build Setup**](./docs/planios.md): Detailed EAS and Xcode setup

### Android Development
- [**Quick Start (Android)**](./docs/ANDROID_QUICK_START.md): Get started with Android in 5 minutes
- [**Development Workflow (Android)**](./docs/DEVELOPMENT_WORKFLOW_ANDROID.md): Complete Android development guide

### General
- [**All Documentation**](./docs/README.md): Complete documentation index

## Prerequisites

### For Both Platforms
- ✅ Node.js (LTS version)
- ✅ pnpm (`npm install -g pnpm`)
- ✅ EAS CLI (`pnpm install -g eas-cli`)
- ✅ Expo CLI (`pnpm install -g @expo/cli`)

### For iOS Development
- ✅ macOS
- ✅ Xcode (latest version)
- ✅ CocoaPods (`sudo gem install cocoapods`)
- ✅ iOS Simulator

### For Android Development
- ✅ Android Studio
- ✅ Android SDK (via Android Studio)
- ✅ Java Development Kit (JDK 17 recommended)
- ✅ Android Emulator OR physical Android device
- ✅ ANDROID_HOME environment variable configured

## Installation

```bash
# Install dependencies
pnpm install
```

## Running the App

You have **multiple options** to run the app on different platforms:

### iOS Development

#### Option 1: Quick Testing with Expo Go (Recommended for First Run)

This is the fastest way to see your app running:

```bash
# Start the development server
pnpm start

# Then press 's' to switch to Expo Go mode
# Press 'i' to open iOS simulator with Expo Go
```

**Note**: Expo Go is a pre-built app that lets you test your project quickly without building.

#### Option 2: Development Build (For Custom Native Code)

This creates a custom development build with `expo-dev-client`:

```bash
# Build the development app for iOS simulator
pnpm run ios

# This will:
# 1. Build the native iOS app
# 2. Install it on the simulator
# 3. Start the Metro bundler
```

**Alternative using EAS Build (Local)**:

```bash
# Build using EAS locally
pnpm run build:ios

# Then install the .app file on simulator
# Drag and drop the .app file onto the iOS Simulator
```

**📖 For detailed iOS development workflow, see [DEVELOPMENT_WORKFLOW.md](./docs/DEVELOPMENT_WORKFLOW.md)**

### Android Development

#### Quick Start (3 Steps)

```bash
# Step 1: Start Android emulator
emulator -avd Pixel_7
# (or use your own emulator name from: emulator -list-avds)

# Step 2: Build and run the app
pnpm run android
# This will build the app and install it on the emulator

# Step 3: Start coding!
# Edit any file and see changes instantly with Fast Refresh
```

#### Using Physical Android Device

```bash
# 1. Enable USB debugging on your device
# 2. Connect via USB and verify:
adb devices

# 3. Run the app
pnpm run android
```

**📖 For detailed Android development workflow, see [ANDROID_QUICK_START.md](./docs/ANDROID_QUICK_START.md) or [DEVELOPMENT_WORKFLOW_ANDROID.md](./docs/DEVELOPMENT_WORKFLOW_ANDROID.md)**

## Project Structure

```
arzkaro/
├── app/                    # Expo Router screens (must be at root)
│   ├── _layout.tsx        # Root layout with navigation
│   ├── index.tsx          # Home screen
│   ├── profile.tsx        # Profile screen
│   └── settings.tsx       # Settings screen
├── src/                   # Frontend source code
│   ├── components/        # Reusable UI components
│   │   ├── Button.tsx     # Custom button component
│   │   └── Card.tsx       # Card component
│   ├── constants/         # Design system
│   │   ├── Colors.ts      # Color palette
│   │   └── Styles.ts      # Typography, spacing, shadows
│   ├── hooks/            # Custom React hooks
│   ├── services/         # API services and integrations
│   ├── utils/            # Utility functions
│   └── types/            # TypeScript type definitions
├── backend/               # Backend code and configuration
│   ├── supabase/         # Supabase configuration
│   │   ├── migrations/   # Database migrations
│   │   └── functions/    # Edge functions
│   └── types/            # Backend TypeScript types
├── docs/                 # Documentation
│   └── planios.md       # iOS setup guide
├── app.json              # Expo configuration
├── eas.json              # EAS Build configuration
└── package.json          # Dependencies and scripts
```

## Available Scripts

```bash
# Start development server
pnpm start

# Start with cache cleared
pnpm start --clear

# iOS Commands
pnpm run ios                  # Build and run on iOS simulator
pnpm run build:ios            # Local EAS build for iOS

# Android Commands
pnpm run android              # Build and run on Android emulator/device
emulator -list-avds           # List available Android emulators
adb devices                   # List connected Android devices
```

## ⚡ Quick Reference

### iOS
| Task | Command |
|------|---------|
| **Start Dev Server** | `pnpm start` |
| **Run on iOS** | `pnpm run ios` |
| **Reload App** | Press `r` in terminal OR `Cmd+R` in simulator |
| **Open Dev Menu** | `Cmd+D` in simulator |
| **Install Package** | `pnpm install <pkg>` |
| **Rebuild Native** | `cd ios && pod install && cd .. && pnpm run ios` |

### Android
| Task | Command |
|------|---------|
| **Start Emulator** | `emulator -avd Pixel_7` |
| **Run on Android** | `pnpm run android` |
| **Reload App** | Press `r` in terminal OR `R+R` in emulator |
| **Open Dev Menu** | `Ctrl+M` (Windows/Linux) OR `Cmd+M` (Mac) |
| **List Devices** | `adb devices` |
| **View Logs** | `adb logcat *:S ReactNative:V ReactNativeJS:V` |
| **Clean Build** | `cd android && ./gradlew clean && cd ..` |
```

## Features

✨ **TypeScript** - Full type safety  
🎨 **Custom Design System** - Consistent colors, typography, and spacing  
🧭 **Expo Router** - File-based navigation  
📱 **Three Sample Screens** - Home, Profile, and Settings  
🔧 **Reusable Components** - Button and Card components  
🏗️ **Local EAS Builds** - Build iOS apps locally  
📦 **pnpm** - Fast and efficient package manager

## Troubleshooting

### "No development build installed" Error

If you see this error when trying to run the app:

1. **Quick fix**: Press `s` in the terminal to switch to Expo Go mode, then press `i`
2. **Or build the app**: Run `npx expo run:ios` to build and install the development build

### iOS Simulator Not Opening

```bash
# Open simulator manually
open -a Simulator

# List available simulators
xcrun simctl list devices

# Boot a specific simulator
xcrun simctl boot "iPhone 15 Pro"
```

### Clear Cache

```bash
# Clear Metro bundler cache
pnpm start --clear

# Clear all caches
rm -rf node_modules
pnpm install
```

## Next Steps

1. **Test the app**: Run `pnpm start`, press `s` for Expo Go, then `i` for iOS
2. **Customize**: Edit screens in the `app/` directory
3. **Add features**: Create new components in `components/`
4. **Build for production**: Use `eas build --platform ios --profile production`

## Learn More

- [Expo Documentation](https://docs.expo.dev/)
- [Expo Router](https://docs.expo.dev/router/introduction/)
- [EAS Build](https://docs.expo.dev/build/introduction/)
- [React Native](https://reactnative.dev/)

---

Built with ❤️ using Expo & React Native
