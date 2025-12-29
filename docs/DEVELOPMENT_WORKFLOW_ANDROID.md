# Development Workflow Guide - Android Development with Expo

> **Quick Start Guide for Daily Development**  
> Last Updated: December 2025

## Table of Contents

- [Quick Start](#quick-start)
- [When to Rebuild vs When to Just Reload](#when-to-rebuild-vs-when-to-just-reload)
- [Daily Development Workflow](#daily-development-workflow)
- [Common Development Commands](#common-development-commands)
- [Troubleshooting Common Issues](#troubleshooting-common-issues)
- [Project Setup (One-Time)](#project-setup-one-time)

---

## Quick Start

### First Time Setup (Do This Once)

```bash
# 1. Clone/navigate to project
cd /path/to/arzkaro

# 2. Install dependencies
pnpm install

# 3. Build and run (this will take 5-10 minutes first time)
pnpm run android
```

### Daily Development (Fast - No Rebuild Needed!)

```bash
# Just run this - Metro bundler will handle hot reloading
pnpm run android
```

**That's it!** The app will launch on the emulator/device and any code changes will automatically reload.

---

## When to Rebuild vs When to Just Reload

### ❌ NO REBUILD NEEDED (Just Save & Reload)

**JavaScript/TypeScript Changes:**

- ✅ Updating React components
- ✅ Changing styles (StyleSheet)
- ✅ Modifying business logic
- ✅ Adding new screens/routes
- ✅ Updating constants
- ✅ Changing text/content
- ✅ API calls and data fetching
- ✅ State management changes

**How it works:** Metro bundler automatically detects changes and reloads the app (Fast Refresh).

**Example workflow:**

```bash
# Terminal 1: Start Metro (keep this running)
pnpm start

# OR use this to build + run + start Metro
pnpm run android

# Now edit your files - changes appear automatically!
# Edit app/index.tsx, save, and see instant updates
```

### ✅ REBUILD REQUIRED (Full Build Needed)

**Native Code Changes:**

- 🔧 Installing new native modules (packages with native code)
- 🔧 Modifying `app.json` or `app.config.js`
- 🔧 Changing Android permissions (AndroidManifest.xml)
- 🔧 Adding/removing Expo plugins
- 🔧 Updating SDK version
- 🔧 Changing package name
- 🔧 Modifying build settings (build.gradle)
- 🔧 Changing google-services.json (Firebase config)

**How to rebuild:**

```bash
# Option 1: Using expo run:android (Recommended for development)
pnpm run android

# Option 2: Using EAS local build (For testing production builds)
eas build --platform android --profile development --local
# Then install the APK manually
```

---

## Daily Development Workflow

### Scenario 1: Working on UI/Logic (No Native Changes)

**This is 95% of your daily work!**

```bash
# Day 1: Initial setup
cd arzkaro
pnpm run android

# The emulator/device opens with your app
# Metro bundler is running

# Now work on your code:
# - Edit app/index.tsx
# - Save file
# - App automatically reloads (Fast Refresh)
# - See changes instantly!

# Keep Metro running while you work
# Press 'r' in Metro terminal to manually reload
# Press 'd' to open developer menu
```

**Pro Tips:**

- Keep Metro bundler running in a dedicated terminal
- Use Fast Refresh - it preserves component state
- If Fast Refresh fails, press 'r' in Metro terminal
- Press 'd' in emulator to open developer menu
- Shake the device (or Ctrl+M on Windows/Linux, Cmd+M on Mac) to open dev menu on physical device

### Scenario 2: Installing a New Package

**Check if the package has native code:**

```bash
# Example: Installing react-native-gesture-handler
pnpm install react-native-gesture-handler

# Does it need native linking?
# Check package README or look for:
# - "requires rebuild"
# - "native module"
# - android folders in node_modules
```

**If it's JavaScript-only (no native code):**

```bash
# Just install and reload
pnpm install <package>
# Metro will detect the change automatically
# No rebuild needed!
```

**If it has native code:**

```bash
# Install package
pnpm install <package>

# Rebuild the app
pnpm run android
```

### Scenario 3: Modifying app.json or Configuration

```bash
# Edit app.json or app.config.js
# Example: Change app name, icon, splash screen, permissions, etc.

# Rebuild required
pnpm run android
```

### Scenario 4: Using Physical Device vs Emulator

**Using Android Emulator:**

```bash
# Start emulator from Android Studio
# OR use command line (if emulator is in PATH)
emulator -avd <emulator_name>

# Then run
pnpm run android
```

**Using Physical Device:**

```bash
# 1. Enable Developer Options on your device
# 2. Enable USB Debugging
# 3. Connect device via USB
# 4. Verify device is connected
adb devices

# 5. Run app
pnpm run android
```

---

## Common Development Commands

### Metro Bundler Commands (Interactive)

When Metro is running, you can press:

| Key | Action                           |
| --- | -------------------------------- |
| `r` | Reload app                       |
| `d` | Open developer menu              |
| `i` | Run on iOS                       |
| `a` | Run on Android                   |
| `w` | Run on web                       |
| `j` | Open debugger                    |
| `m` | Toggle menu                      |
| `?` | Show all commands                |

### ADB Commands (Android Debug Bridge)

```bash
# List all connected devices/emulators
adb devices

# Install APK
adb install path/to/app.apk

# Uninstall app
adb uninstall com.arzkaro.app

# Clear app data
adb shell pm clear com.arzkaro.app

# View logs
adb logcat

# View React Native logs only
adb logcat *:S ReactNative:V ReactNativeJS:V

# Take screenshot
adb shell screencap /sdcard/screenshot.png
adb pull /sdcard/screenshot.png

# Record screen
adb shell screenrecord /sdcard/demo.mp4
# Press Ctrl+C to stop recording
adb pull /sdcard/demo.mp4

# Restart ADB server
adb kill-server
adb start-server

# Open developer menu on device
adb shell input keyevent 82

# Reload app
adb shell input text "RR"
```

### Emulator Commands

```bash
# List available emulators
emulator -list-avds

# Start specific emulator
emulator -avd <emulator_name>

# Start emulator in background
emulator -avd <emulator_name> &

# Start emulator with specific settings
emulator -avd <emulator_name> -no-snapshot-load
emulator -avd <emulator_name> -wipe-data
emulator -avd <emulator_name> -gpu host

# Check emulator status
adb -e shell getprop
```

### Gradle Commands

```bash
# Clean build
cd android && ./gradlew clean && cd ..

# Build debug APK
cd android && ./gradlew assembleDebug && cd ..

# Build release APK
cd android && ./gradlew assembleRelease && cd ..

# Install debug APK
cd android && ./gradlew installDebug && cd ..

# View all tasks
cd android && ./gradlew tasks && cd ..

# Clean and rebuild
cd android && ./gradlew clean assembleDebug && cd ..
```

### Keyboard Shortcuts in Emulator

| Shortcut          | Action                              |
| ----------------- | ----------------------------------- |
| `Ctrl + M`        | Open developer menu (Windows/Linux) |
| `Cmd + M`         | Open developer menu (Mac)           |
| `R + R`           | Reload app (press R twice quickly)  |
| `Ctrl + K`        | Toggle keyboard                     |
| `Ctrl + H`        | Go to home screen                   |
| `Ctrl + Backspace`| Back button                         |
| `Ctrl + P`        | Power button                        |

---

## Troubleshooting Common Issues

### Issue 1: "No development servers found"

**Cause:** Metro bundler isn't running or can't connect.

**Solution:**

```bash
# Check if port 8081 is in use
netstat -ano | findstr :8081

# Kill any process using port 8081 (Windows)
# Find PID from above command, then:
taskkill /PID <PID> /F

# Start Metro bundler
pnpm start

# In emulator, shake device (Ctrl+M)
# Enter URL manually: http://10.0.2.2:8081
# Note: 10.0.2.2 is the special IP for Android emulator to access host machine
```

### Issue 2: "Could not connect to development server"

**Cause:** Firewall blocking connection or wrong IP.

**Solution:**

For **Emulator**:
```bash
# Metro should be accessible at 10.0.2.2:8081
# Shake device and enter manually
```

For **Physical Device**:
```bash
# 1. Ensure device and computer are on same WiFi
# 2. Find your computer's IP address
ipconfig  # Windows
ifconfig  # Mac/Linux

# 3. In Metro, enter IP manually
# 4. Or use adb reverse
adb reverse tcp:8081 tcp:8081
```

### Issue 3: "Unable to load script"

**Cause:** Bundle not found or Metro not running.

**Solution:**

```bash
# Kill the app
# Start fresh:
pnpm run android
```

### Issue 4: Red Screen Errors

**Cause:** JavaScript errors in your code.

**Solution:**

- Read the error message carefully
- Check the file and line number mentioned
- Fix the error in your code
- App will reload automatically

### Issue 5: White Screen / App Crashes

**Cause:** Various - often native module issues.

**Solution:**

```bash
# Clear all caches and rebuild
rm -rf node_modules
pnpm install
cd android
./gradlew clean
cd ..
pnpm run android
```

### Issue 6: "Emulator won't start"

**Solution:**

```bash
# Kill all emulator processes
adb kill-server
adb start-server

# Start emulator from Android Studio
# Or use command line
emulator -avd <emulator_name> -wipe-data
```

### Issue 7: "Build Failed" with Gradle Errors

**Solution:**

```bash
# Clean Android build folder
cd android
./gradlew clean
rm -rf build/
rm -rf app/build/
cd ..

# Clear Gradle cache
cd android
./gradlew cleanBuildCache
cd ..

# Rebuild
pnpm run android
```

### Issue 8: "Daemon will be stopped at the end of the build"

**Cause:** Gradle daemon issues or memory.

**Solution:**

```bash
# Stop Gradle daemon
cd android
./gradlew --stop
cd ..

# Increase Gradle memory in android/gradle.properties
# Add or update:
# org.gradle.jvmargs=-Xmx4096m -XX:MaxMetaspaceSize=1024m

# Rebuild
pnpm run android
```

### Issue 9: Metro Bundler Won't Start

**Solution:**

```bash
# Clear Metro cache
pnpm start -- --reset-cache

# OR
rm -rf node_modules/.cache
pnpm start
```

### Issue 10: "SDK location not found"

**Solution:**

```bash
# Create local.properties in android/ folder
# Add SDK path:
# Windows: sdk.dir=C:\\Users\\YourUsername\\AppData\\Local\\Android\\Sdk
# Mac: sdk.dir=/Users/YourUsername/Library/Android/sdk
# Linux: sdk.dir=/home/YourUsername/Android/Sdk
```

---

## Project Setup (One-Time)

### Initial Project Configuration

If you're setting up the project for the first time on a new machine:

```bash
# 1. Clone repository
git clone <your-repo-url>
cd arzkaro

# 2. Install Node dependencies
pnpm install

# 3. Verify everything is set up
pnpm run android

# The app should build and launch on Android emulator/device
```

### Environment Setup Checklist

- [ ] Node.js LTS version installed
- [ ] pnpm installed: `npm install -g pnpm`
- [ ] Android Studio installed
- [ ] Android SDK installed (via Android Studio)
- [ ] ANDROID_HOME environment variable set
- [ ] Java Development Kit (JDK) installed (version 17 recommended)
- [ ] Android emulator created OR physical device available
- [ ] USB debugging enabled (for physical device)
- [ ] Port 8081 is free (not used by other apps)

### Setting up ANDROID_HOME (Windows)

```bash
# Add to System Environment Variables:
ANDROID_HOME=C:\Users\YourUsername\AppData\Local\Android\Sdk

# Add to Path:
%ANDROID_HOME%\platform-tools
%ANDROID_HOME%\tools
%ANDROID_HOME%\emulator
```

### Setting up ANDROID_HOME (Mac/Linux)

```bash
# Add to ~/.bashrc or ~/.zshrc:
export ANDROID_HOME=$HOME/Library/Android/sdk  # Mac
# OR
export ANDROID_HOME=$HOME/Android/Sdk  # Linux

export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/platform-tools
export PATH=$PATH:$ANDROID_HOME/tools
```

### Creating Android Emulator

```bash
# 1. Open Android Studio
# 2. Go to Tools > Device Manager
# 3. Click "Create Device"
# 4. Select a device (e.g., Pixel 6)
# 5. Select a system image (e.g., Android 13 - API 33)
# 6. Name your AVD and finish

# Or use command line:
avdmanager create avd -n Pixel_6_API_33 -k "system-images;android-33;google_apis;x86_64" -d "pixel_6"
```

---

## Performance Tips

### Make Development Faster

1. **Keep Metro Running:**

   ```bash
   # Don't restart Metro for every change
   # Just keep it running in a terminal
   pnpm start
   ```

2. **Use Fast Refresh Effectively:**
   - Fast Refresh preserves React component state
   - Works automatically for most changes
   - If it doesn't work, press 'r' to reload

3. **Emulator Performance:**

   ```bash
   # Use x86_64 images (faster than ARM)
   # Enable hardware acceleration
   # Close other apps to free up RAM
   # Allocate more RAM to emulator in AVD settings
   
   # Start emulator with GPU acceleration
   emulator -avd <name> -gpu host
   ```

4. **Clear Caches Only When Needed:**

   ```bash
   # Don't clear cache unless you have issues
   # Clearing cache slows down the next reload

   # Only clear when you see weird errors:
   pnpm start -- --reset-cache
   ```

5. **Use ADB Reverse for Faster Connection:**

   ```bash
   # This makes Metro accessible on device via localhost
   adb reverse tcp:8081 tcp:8081
   ```

---

## Understanding Build Types

### Development Build (pnpm run android)

- **Speed:** Fast (incremental builds after first time)
- **Size:** Larger (includes debugging symbols)
- **Use Case:** Daily development
- **Hot Reload:** Yes
- **Debugging:** Full debugging support
- **When to use:** Always during development

### EAS Local Build (eas build --local)

- **Speed:** Slower (fresh build each time)
- **Size:** Depends on configuration
- **Use Case:** Testing production-like builds
- **Hot Reload:** No (requires rebuild)
- **Debugging:** Limited
- **When to use:** Before releasing, testing build process

### Production Build (eas build)

- **Speed:** Slowest (full optimization)
- **Size:** Smallest (optimized)
- **Use Case:** Play Store submission
- **Hot Reload:** No
- **Debugging:** No
- **When to use:** Final release only

---

## Quick Reference: What Command to Use

| Task                       | Command                                                                    |
| -------------------------- | -------------------------------------------------------------------------- |
| **Start development**      | `pnpm run android`                                                         |
| **Just start Metro**       | `pnpm start`                                                               |
| **Reload app**             | Press 'r' in Metro terminal OR shake device                                |
| **Open dev menu**          | `Ctrl+M` (Windows/Linux) or `Cmd+M` (Mac) in emulator                      |
| **Install new package**    | `pnpm install <package>`                                                   |
| **Install native package** | `pnpm install <package> && pnpm run android`                               |
| **Clear cache**            | `pnpm start -- --reset-cache`                                              |
| **Clean rebuild**          | `rm -rf node_modules && pnpm install && pnpm run android`                  |
| **Clean Gradle**           | `cd android && ./gradlew clean && cd .. && pnpm run android`               |
| **List devices**           | `adb devices`                                                              |
| **View logs**              | `adb logcat *:S ReactNative:V ReactNativeJS:V`                             |
| **Build for production**   | `eas build --platform android --profile production --local`                |

---

## Summary: Do I Need to Rebuild?

### 🟢 NO REBUILD - Just Code & Reload (99% of the time)

- Editing React components
- Changing styles
- Updating business logic
- Adding screens
- API changes
- Most day-to-day development

**Just edit → save → see changes!**

### 🟡 REBUILD - After Installing Native Packages

- Installing packages with native code
- Running: `pnpm run android`

**Takes 2-5 minutes**

### 🔴 FULL REBUILD - After Configuration Changes

- Changing app.json or app.config.js
- Modifying build settings (build.gradle)
- Updating permissions
- Changing google-services.json
- Updating Expo SDK
- Running: `pnpm run android`

**Takes 5-10 minutes**

---

## Android-Specific Configuration Files

### Important Files to Know

1. **android/app/build.gradle**
   - App-level build configuration
   - Dependencies, versions, build types

2. **android/build.gradle**
   - Project-level build configuration
   - Repositories, Gradle version

3. **android/gradle.properties**
   - Gradle settings and memory allocation
   - Performance tuning

4. **android/app/src/main/AndroidManifest.xml**
   - App permissions
   - Activity declarations
   - Intent filters

5. **google-services.json**
   - Firebase configuration
   - Must be in root and android/app/

6. **android/local.properties**
   - Local SDK path (not committed to git)

---

## Need Help?

### Common Questions

**Q: How do I know if a package is native?**
A: Check the package's README or look for `android/` folders in `node_modules/<package-name>`

**Q: Why is my first build so slow?**
A: First build compiles everything and downloads dependencies. Subsequent builds are much faster (2-3 minutes).

**Q: Can I develop without rebuilding every time?**
A: YES! Once built, just use `pnpm start` and edit code. Rebuilds only needed for native changes.

**Q: What's the fastest way to test changes?**
A: Keep Metro running, edit files, save. Changes appear in 1-2 seconds.

**Q: Should I use emulator or physical device?**
A:
- Emulator: Easier, no USB needed, good for most development
- Physical device: Better for testing real-world performance, camera, sensors

**Q: Why can't I connect to Metro on my device?**
A: Run `adb reverse tcp:8081 tcp:8081` to forward the port

**Q: How do I view crash logs?**
A: Run `adb logcat *:S ReactNative:V ReactNativeJS:V` to see React Native logs

---

**Happy Developing! 🚀**

For iOS development, see [DEVELOPMENT_WORKFLOW.md](./DEVELOPMENT_WORKFLOW.md)
