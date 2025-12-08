# Arzkaro - React Native Expo Setup Guide

## 🚀 Quick Start

This project is set up with React Native, Expo, and local EAS builds using **pnpm** as the package manager.

## 📚 Documentation

- [**Development Workflow**](./docs/DEVELOPMENT_WORKFLOW.md): Daily guide, troubleshooting, and tips.
- [**iOS Build Setup**](./docs/planios.md): Detailed EAS and Xcode setup.
- [**Admin Setup Guide**](./docs/ADMIN_SETUP.md): How to set up your first admin user.
- [**Database Migrations**](./supabase/migrations/README.md): Database schema and migration guide.
- [**Host System Spec**](./docs/HOST_SYSTEM_SPEC.md): Multi-tier host system documentation.

## Prerequisites

Before running the app, ensure you have:

- ✅ Node.js (LTS version)
- ✅ pnpm (`npm install -g pnpm`)
- ✅ Xcode (for iOS development)
- ✅ CocoaPods (`sudo gem install cocoapods`)
- ✅ EAS CLI (`pnpm install -g eas-cli`)
- ✅ Expo CLI (`pnpm install -g @expo/cli`)

## Installation

```bash
# Install dependencies
pnpm install
```

## Running the App

You have **two options** to run the app:

### Option 1: Quick Testing with Expo Go (Recommended for First Run)

This is the fastest way to see your app running:

```bash
# Start the development server
pnpm start

# Then press 's' to switch to Expo Go mode
# Press 'i' to open iOS simulator with Expo Go
```

**Note**: Expo Go is a pre-built app that lets you test your project quickly without building.

### Option 2: Development Build (For Custom Native Code)

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

# Run on iOS simulator (builds and runs)
pnpm run ios

# Run on Android emulator
npx expo run:android

# Build for iOS simulator (local EAS build)
pnpm run build:ios

# Build for iOS device (requires Apple Developer account)
eas build --platform ios --profile development-device --local

## ⚡ Quick Reference

| Task | Command |
|------|---------|
| **Start Dev Server** | `pnpm start` |
| **Run on iOS** | `pnpm run ios` |
| **Reload App** | Press `r` in terminal |
| **Open Dev Menu** | `Cmd+D` in simulator |
| **Install Package** | `pnpm install <pkg>` |
| **Rebuild Native** | `cd ios && pod install && cd .. && pnpm run ios` |
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
