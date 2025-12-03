# React Native with Expo - Local EAS Build Setup for iOS (2025)

> **Last Updated:** December 2025  
> **Focus:** Local EAS builds for iOS development with Xcode emulation

## Table of Contents
- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Initial Setup](#initial-setup)
- [Configuration](#configuration)
- [Building Locally](#building-locally)
- [Running on iOS Simulator](#running-on-ios-simulator)
- [Troubleshooting](#troubleshooting)
- [Best Practices](#best-practices)
- [Limitations of Local Builds](#limitations-of-local-builds)

---

## Overview

**What is EAS Build?**  
EAS (Expo Application Services) Build is a cloud-based build service for React Native apps. However, it also supports **local builds** which allow you to compile your app directly on your machine using your local Xcode installation.

**Why Use Local EAS Builds?**
- 🐛 **Debug build failures** that occur on cloud servers
- 🏢 **Company policy compliance** - keep builds on internal infrastructure
- 💰 **Bypass build quotas** - unlimited local builds without costs
- ⚡ **Faster iteration** during development
- 🔧 **Full control** over the build environment

---

## Prerequisites

### Required Software

1. **macOS Machine**  
   - iOS builds require macOS with Xcode
   - Cannot build iOS apps on Windows or Linux

2. **Xcode** (Latest Version)
   ```bash
   # Install from Mac App Store or
   xcode-select --install
   ```
   - Includes iOS Simulator and command-line tools
   - Verify installation: `xcode-select -p`

3. **Node.js** (LTS Version)
   ```bash
   # Check version
   node --version
   # Recommended: v18.x or v20.x
   ```

4. **Package Manager**
   - npm (comes with Node.js) or
   - pnpm: `npm install -g pnpm`

5. **CocoaPods** (for iOS dependencies)
   ```bash
   sudo gem install cocoapods
   pod --version
   ```

6. **Fastlane** (for iOS automation)
   ```bash
   sudo gem install fastlane
   fastlane --version
   ```

### Expo Account & Tools

1. **Expo Account**
   - Sign up at [expo.dev/signup](https://expo.dev/signup)
   - Free tier is sufficient for local builds

2. **Expo CLI**
   ```bash
   pnpm install -g @expo/cli
   expo --version
   ```

3. **EAS CLI**
   ```bash
   pnpm install -g eas-cli
   eas --version
   ```

4. **Apple Developer Account** (Optional for Simulator)
   - **NOT required** for iOS Simulator builds
   - **Required** for physical device testing ($99/year)
   - **Required** for App Store submission

---

## Initial Setup

### 1. Create or Navigate to Your Expo Project

**New Project:**
```bash
npx create-expo-app my-app
cd my-app
```

**Existing Project:**
```bash
cd your-existing-expo-project
```

### 2. Install expo-dev-client

For development builds with custom native code:
```bash
npx expo install expo-dev-client
```

### 3. Login to EAS CLI

```bash
eas login
```

Or set environment variable:
```bash
export EXPO_TOKEN=your_token_here
```

### 4. Initialize EAS Configuration

```bash
eas build:configure
```

This creates an `eas.json` file in your project root with default build profiles.

---

## Configuration

### Understanding eas.json

The `eas.json` file defines build profiles for different scenarios. Here's a comprehensive configuration:

```json
{
  "cli": {
    "version": ">= 5.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "ios": {
        "simulator": true,
        "buildConfiguration": "Debug"
      }
    },
    "development-device": {
      "developmentClient": true,
      "distribution": "internal",
      "ios": {
        "simulator": false,
        "buildConfiguration": "Debug"
      }
    },
    "preview": {
      "distribution": "internal",
      "ios": {
        "simulator": false
      }
    },
    "production": {
      "ios": {
        "simulator": false,
        "buildConfiguration": "Release"
      }
    },
    "ios-simulator-local": {
      "developmentClient": true,
      "distribution": "internal",
      "ios": {
        "simulator": true,
        "buildConfiguration": "Debug"
      }
    }
  },
  "submit": {
    "production": {}
  }
}
```

### Key Configuration Options

#### For iOS Simulator Builds:
```json
"ios": {
  "simulator": true,
  "buildConfiguration": "Debug"
}
```

#### For Physical Device Builds:
```json
"ios": {
  "simulator": false,
  "buildConfiguration": "Release"
}
```

#### Development Client:
```json
"developmentClient": true
```
- Enables custom native code and debugging
- Allows using `expo-dev-client` instead of Expo Go

---

## Building Locally

### Basic Local Build Command

```bash
eas build --platform ios --local
```

### Build for iOS Simulator

```bash
eas build --platform ios --profile development --local
```

Or with a specific simulator profile:
```bash
eas build --platform ios --profile ios-simulator-local --local
```

### Build Options

| Flag | Description |
|------|-------------|
| `--platform ios` | Specify iOS platform |
| `--local` | Run build locally instead of on EAS servers |
| `--profile <name>` | Use specific build profile from eas.json |
| `--clear-cache` | Clear local build cache |
| `--non-interactive` | Run without prompts (useful for CI/CD) |

### Environment Variables for Local Builds

```bash
# Skip cleanup after build (useful for debugging)
export EAS_LOCAL_BUILD_SKIP_CLEANUP=1

# Specify custom working directory
export EAS_LOCAL_BUILD_WORKINGDIR=/path/to/workdir
```

### Alternative: Using expo run:ios

For quick local development without EAS:
```bash
npx expo run:ios
```

This command:
- Compiles using local Xcode
- Automatically opens iOS Simulator
- Faster for rapid iteration
- Doesn't create distributable builds

---

## Running on iOS Simulator

### 1. Build the App

```bash
eas build --platform ios --profile development --local
```

The build output will be a `.app` or `.tar.gz` file.

### 2. Locate the Build Output

After successful build, note the output path:
```
✔ Build finished
Build artifact: /path/to/your-app.app
```

### 3. Install on Simulator

**Method 1: Drag and Drop**
- Open iOS Simulator (Xcode → Open Developer Tool → Simulator)
- Drag the `.app` file onto the simulator window

**Method 2: Command Line**
```bash
# List available simulators
xcrun simctl list devices

# Boot a simulator
xcrun simctl boot "iPhone 15 Pro"

# Install the app
xcrun simctl install booted /path/to/your-app.app

# Launch the app
xcrun simctl launch booted com.yourcompany.yourapp
```

**Method 3: Using expo run:ios**
```bash
# Automatically builds and runs on simulator
npx expo run:ios
```

### 4. Open Simulator from Xcode

```bash
open -a Simulator
```

Or from Xcode:
- Xcode → Open Developer Tool → Simulator
- Choose device: Window → Devices and Simulators

---

## Troubleshooting

### Common Issues and Solutions

#### 1. "Command not found: eas"
```bash
pnpm install -g eas-cli
# or
yarn global add eas-cli
```

#### 2. "Xcode not found"
```bash
# Install Xcode command-line tools
xcode-select --install

# Verify installation
xcode-select -p
```

#### 3. CocoaPods Installation Issues
```bash
# Update Ruby gems
sudo gem update --system

# Install CocoaPods
sudo gem install cocoapods

# If using Homebrew
brew install cocoapods
```

#### 4. Build Fails with "No provisioning profile"
For simulator builds, you don't need provisioning profiles. Ensure your `eas.json` has:
```json
"ios": {
  "simulator": true
}
```

#### 5. "expo-dev-client" Not Found
```bash
npx expo install expo-dev-client
```

#### 6. Simulator Not Booting
```bash
# Kill all simulator processes
killall Simulator

# Reset simulator
xcrun simctl erase all

# Restart
open -a Simulator
```

#### 7. Build Logs Location
When using local builds with debugging enabled:
```bash
export EAS_LOCAL_BUILD_SKIP_CLEANUP=1
export EAS_LOCAL_BUILD_WORKINGDIR=~/eas-build-local

# Build logs will be in:
~/eas-build-local/logs
```

---

## Best Practices

### 1. Use Separate Build Profiles

Create distinct profiles for different scenarios:
- `development` - Local simulator testing
- `development-device` - Physical device testing
- `preview` - Internal testing/TestFlight
- `production` - App Store release

### 2. Version Management

Keep your tools updated:
```bash
# Update EAS CLI
pnpm install -g eas-cli@latest

# Update Expo CLI
pnpm install -g @expo/cli@latest

# Update project dependencies
npx expo install --fix
```

### 3. Clean Builds

When encountering issues:
```bash
# Clear Metro bundler cache
npx expo start --clear

# Clear EAS build cache
eas build --platform ios --local --clear-cache

# Clean iOS build folder
cd ios && xcodebuild clean && cd ..
```

### 4. Gitignore Configuration

Add to `.gitignore`:
```
# EAS
.eas-build-local/

# iOS
ios/Pods/
ios/build/
*.ipa
*.app

# Xcode
*.xcworkspace
!default.xcworkspace
xcuserdata/
```

### 5. Development Workflow

Recommended workflow:
1. Use `npx expo run:ios` for rapid development
2. Use `eas build --local` for testing production-like builds
3. Use cloud EAS builds for final distribution

---

## Limitations of Local Builds

### What Local Builds Cannot Do:

❌ **Build for multiple platforms simultaneously**
- Cannot use `--platform all`
- Must build iOS and Android separately

❌ **Customize software versions**
- Cannot specify Node, Yarn, Fastlane versions in `eas.json`
- Must manage versions locally

❌ **Use build caching**
- Each local build starts fresh
- Cloud builds benefit from caching

❌ **Use EAS Secrets**
- Environment variables with "Secret" visibility not supported
- Must set secrets in local environment

❌ **Build on non-macOS for iOS**
- iOS builds require macOS with Xcode
- No workarounds available

### What Local Builds CAN Do:

✅ Debug build failures from cloud builds  
✅ Create simulator builds without Apple Developer account  
✅ Generate IPA files for distribution  
✅ Full control over build environment  
✅ Unlimited builds without quota restrictions  
✅ Faster iteration during development  
✅ Comply with company CI/CD policies  

---

## Additional Resources

### Official Documentation
- [Expo EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [Local Builds Guide](https://docs.expo.dev/build-reference/local-builds/)
- [iOS Simulator Builds](https://docs.expo.dev/build-reference/simulators/)
- [Development Builds](https://docs.expo.dev/develop/development-builds/introduction/)

### Useful Commands Reference

```bash
# Check EAS build status
eas build:list

# View build details
eas build:view [build-id]

# Configure credentials
eas credentials

# Submit to App Store
eas submit --platform ios

# Run on simulator (quick development)
npx expo run:ios

# Run on specific simulator
npx expo run:ios --device "iPhone 15 Pro"

# List available simulators
xcrun simctl list devices available
```

### Community Resources
- [Expo Forums](https://forums.expo.dev/)
- [Expo Discord](https://chat.expo.dev/)
- [GitHub Issues](https://github.com/expo/expo/issues)

---

## Quick Start Checklist

- [ ] Install Xcode and command-line tools
- [ ] Install Node.js (LTS version)
- [ ] Install CocoaPods and Fastlane
- [ ] Install Expo CLI and EAS CLI
- [ ] Create Expo account and login
- [ ] Create or navigate to Expo project
- [ ] Install expo-dev-client
- [ ] Run `eas build:configure`
- [ ] Configure `eas.json` for simulator builds
- [ ] Run `eas build --platform ios --local`
- [ ] Install and test on iOS Simulator

---

## Conclusion

Local EAS builds provide a powerful way to develop and test React Native apps with Expo while maintaining full control over your build environment. With Xcode installed, you can iterate quickly using the iOS Simulator without needing an Apple Developer account for initial development.

For production releases and physical device testing, you'll eventually need an Apple Developer account, but local simulator builds are perfect for the development phase.

**Happy Building! 🚀**
