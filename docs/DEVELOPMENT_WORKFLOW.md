# Development Workflow Guide - iOS & Android Development with Expo

> **Quick Start Guide for Daily Development**  
> Last Updated: December 2025

## Table of Contents

- [Quick Start](#quick-start)
  - [iOS Setup](#ios-setup)
  - [Android Setup](#android-setup)
- [When to Rebuild vs When to Just Reload](#when-to-rebuild-vs-when-to-just-reload)
- [Daily Development Workflow](#daily-development-workflow)
- [Common Development Commands](#common-development-commands)
- [Platform-Specific Commands](#platform-specific-commands)
  - [iOS Commands](#ios-commands)
  - [Android Commands](#android-commands)
- [Troubleshooting Common Issues](#troubleshooting-common-issues)
- [Project Setup (One-Time)](#project-setup-one-time)

---

## Quick Start

### iOS Setup

#### First Time Setup (Do This Once)

```bash
# 1. Clone/navigate to project
cd /path/to/arzkaro

# 2. Install dependencies
pnpm install

# 3. Install iOS pods
cd ios && pod install && cd ..

# 4. Build and run (this will take 5-10 minutes first time)
pnpm run ios
```

#### Daily Development (Fast - No Rebuild Needed!)

```bash
# Just run this - Metro bundler will handle hot reloading
pnpm run ios
```

**That's it!** The app will launch on the simulator and any code changes will automatically reload.

### Android Setup

#### First Time Setup (Do This Once)

**Prerequisites:**
1. Install **Android Studio** from https://developer.android.com/studio
2. Configure **Android SDK** (API Level 33 or 34 recommended)
3. Create an **Android Virtual Device (AVD)**:
   - Open Android Studio → **Virtual Device Manager**
   - Click **Create Device**
   - Choose **Pixel 6** or **Pixel 7**
   - Select **Android 13 (API 33)** or **Android 14 (API 34)**
   - Choose **x86_64** image for better performance
   - Configure RAM: 2048 MB minimum (4096 MB recommended)

4. Set environment variables (add to `~/.zshrc` or `~/.bash_profile`):
```bash
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/platform-tools
```

**Build and Run:**

```bash
# 1. Start Android emulator
emulator -avd Pixel_7 &

# 2. Wait for emulator to boot (30-60 seconds)
# Check status with:
adb devices

# 3. Build and install app (first time - takes 10-15 minutes)
pnpm run android
# OR
npx expo run:android

# 4. Start dev server
npx expo start --dev-client
```

#### Daily Development (Fast - No Rebuild Needed!)

```bash
# 1. Start emulator (if not running)
emulator -avd Pixel_7 &

# 2. Start dev server (app will auto-launch)
npx expo start --dev-client
```

**Pro Tip:** Keep the emulator running while developing to avoid boot time!

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
pnpm run ios

# Now edit your files - changes appear automatically!
# Edit app/index.tsx, save, and see instant updates
```

### ✅ REBUILD REQUIRED (Full Build Needed)

**Native Code Changes:**

- 🔧 Installing new native modules (packages with native code)
- 🔧 Modifying `app.json` or `app.config.js`
- 🔧 Changing iOS permissions (Info.plist)
- 🔧 Adding/removing Expo plugins
- 🔧 Updating SDK version
- 🔧 Changing bundle identifier
- 🔧 Modifying build settings

**How to rebuild:**

```bash
# Option 1: Using expo run:ios (Recommended for development)
pnpm run ios

# Option 2: Using EAS local build (For testing production builds)
eas build --platform ios --profile development --local
# Then extract and install manually
```

---

## Daily Development Workflow

### Scenario 1: Working on UI/Logic (No Native Changes)

**This is 95% of your daily work!**

```bash
# Day 1: Initial setup
cd arzkaro
pnpm run ios

# The simulator opens with your app
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
- Press 'd' in simulator to open developer menu

### Scenario 2: Installing a New Package

**Check if the package has native code:**

```bash
# Example: Installing react-native-gesture-handler
pnpm install react-native-gesture-handler

# Does it need native linking?
# Check package README or look for:
# - "pod install required"
# - "native module"
# - iOS/android folders in node_modules
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

# Install iOS dependencies
cd ios && pod install && cd ..

# Rebuild the app
pnpm run ios
```

### Scenario 3: Modifying app.json or Configuration

```bash
# Edit app.json
# Example: Change app name, icon, splash screen, etc.

# Rebuild required
pnpm run ios
```

### Scenario 4: Switching Between Simulator/Emulator Devices

**iOS:**
```bash
# List available simulators
xcrun simctl list devices available

# Run on specific device
pnpm run ios --device "iPhone 15 Pro Max"
# OR
pnpm run ios --device "iPhone SE (3rd generation)"
```

**Android:**
```bash
# List available AVDs
emulator -list-avds

# Start specific emulator
emulator -avd Pixel_6 &
# OR
emulator -avd Pixel_7 &

# Check connected devices
adb devices
```

---

## Platform-Specific Commands

### iOS Commands

### iOS Commands

#### Metro Bundler Commands (Interactive)

When Metro is running, you can press:

| Key | Action                           |
| --- | -------------------------------- |
| `r` | Reload app                       |
| `d` | Open developer menu in simulator |
| `i` | Run on iOS                       |
| `a` | Run on Android                   |
| `w` | Run on web                       |
| `j` | Open debugger                    |
| `m` | Toggle menu                      |
| `?` | Show all commands                |

#### Simulator Commands

```bash
# Open simulator
open -a Simulator

# List all simulators
xcrun simctl list devices

# Boot a specific simulator
xcrun simctl boot "iPhone 17 Pro"

# Install app on booted simulator
xcrun simctl install booted /path/to/app.app

# Launch app
xcrun simctl launch booted com.arzkaro.app

# Terminate app
xcrun simctl terminate booted com.arzkaro.app

# Uninstall app
xcrun simctl uninstall booted com.arzkaro.app

# Reset simulator (clears all data)
xcrun simctl erase "iPhone 17 Pro"

# Take screenshot
xcrun simctl io booted screenshot screenshot.png

# Record video
xcrun simctl io booted recordVideo video.mp4
# Press Ctrl+C to stop recording
```

### Keyboard Shortcuts in Simulator

| Shortcut          | Action                              |
| ----------------- | ----------------------------------- |
| `Cmd + R`         | Reload app (if dev menu is enabled) |
| `Cmd + D`         | Open developer menu                 |
| `Cmd + Ctrl + Z`  | Shake device (opens dev menu)       |
| `Cmd + K`         | Toggle software keyboard            |
| `Cmd + Shift + H` | Go to home screen                   |
| `Cmd + L`         | Lock screen                         |
| `Cmd + S`         | Screenshot                          |
| `Cmd + 1/2/3`     | Scale simulator (50%/75%/100%)      |

### Android Commands

#### Emulator Commands

```bash
# List available AVDs
emulator -list-avds

# Start emulator
emulator -avd Pixel_7 &

# Start emulator with writable system (for testing)
emulator -avd Pixel_7 -writable-system &

# List running emulators
adb devices

# Kill emulator
adb -s emulator-5554 emu kill
```

#### ADB (Android Debug Bridge) Commands

```bash
# Check connected devices
adb devices

# Install APK
adb install /path/to/app.apk

# Uninstall app
adb uninstall com.arzkaro.app

# Launch app
adb shell am start -n com.arzkaro.app/.MainActivity

# Stop app
adb shell am force-stop com.arzkaro.app

# View logs (filtered for React Native)
adb logcat | grep ReactNative
# OR for all logs
adb logcat

# Clear logs
adb logcat -c

# View installed packages
adb shell pm list packages | grep arzkaro

# Take screenshot
adb shell screencap /sdcard/screenshot.png
adb pull /sdcard/screenshot.png

# Record screen
adb shell screenrecord /sdcard/demo.mp4
# Press Ctrl+C to stop, then:
adb pull /sdcard/demo.mp4

# Clear app data
adb shell pm clear com.arzkaro.app

# Open dev menu
adb shell input keyevent 82

# Reload app
adb shell input text "RR"

# Reverse port (for Metro bundler)
adb reverse tcp:8081 tcp:8081
```

#### Keyboard Shortcuts in Android Emulator

| Shortcut      | Action                |
| ------------- | --------------------- |
| `Cmd + M`     | Open developer menu   |
| `R + R`       | Reload app            |
| `Ctrl + M`    | Menu                  |
| `Cmd + S`     | Screenshot            |
| `Cmd + Down`  | Close keyboard        |

## Common Development Commands

## Troubleshooting Common Issues

### Issue 1: "No development servers found"

**Cause:** Metro bundler isn't running or can't connect.

**Solution:**

```bash
# Check if port 8081 is in use
lsof -i :8081

# Kill any process using port 8081
lsof -ti:8081 | xargs kill -9

# Start Metro bundler
pnpm start

# In simulator, shake device (Cmd+Ctrl+Z)
# Enter URL manually: http://localhost:8081
```

### Issue 2: "RCTFatal - Not Found"

**Cause:** Bundle not found or Metro not running.

**Solution:**

```bash
# Kill the app in simulator
# Start fresh:
pnpm run ios
```

### Issue 3: Red Screen Errors

**Cause:** JavaScript errors in your code.

**Solution:**

- Read the error message carefully
- Check the file and line number mentioned
- Fix the error in your code
- App will reload automatically

### Issue 4: White Screen / App Crashes

**Cause:** Various - often native module issues.

**Solution:**

```bash
# Clear all caches and rebuild
rm -rf node_modules
pnpm install
cd ios && rm -rf Pods Podfile.lock && pod install && cd ..
pnpm run ios
```

### Issue 5: "Unable to boot simulator"

**Solution:**

```bash
# Kill all simulator processes
killall Simulator

# Reset simulator
xcrun simctl shutdown all
xcrun simctl erase all

# Restart
open -a Simulator
pnpm run ios
```

### Issue 6: "Build Failed" with Xcode Errors

**Solution:**

```bash
# Clean iOS build folder
cd ios
xcodebuild clean
rm -rf build/
cd ..

# Clear derived data
rm -rf ~/Library/Developer/Xcode/DerivedData/arzkaro-*

# Rebuild
pnpm run ios
```

### Issue 7: "Pod install failed"

**Solution:**

```bash
# Update CocoaPods
sudo gem install cocoapods

# Clear pod cache
cd ios
rm -rf Pods Podfile.lock
pod deintegrate
pod install
cd ..
```

### Issue 8: Metro Bundler Won't Start

**Solution:**

```bash
# Clear Metro cache
pnpm start -- --reset-cache

# OR
rm -rf node_modules/.cache
pnpm start
```

### Issue 9: Android Emulator Won't Start

**Solution:**

```bash
# Check if emulator is installed
emulator -list-avds

# If no AVDs listed, create one in Android Studio

# Kill existing emulator processes
pkill -9 qemu-system

# Start fresh
emulator -avd Pixel_7 &
```

### Issue 10: "Unable to load script" on Android

**Cause:** Metro bundler not accessible from emulator.

**Solution:**

```bash
# Reverse port for Metro
adb reverse tcp:8081 tcp:8081

# Restart Metro
pnpm start -- --reset-cache

# Reload app in emulator (shake device or Cmd+M → Reload)
```

### Issue 11: Android Build Failed with Gradle Errors

**Solution:**

```bash
# Clean Gradle cache
cd android
./gradlew clean
rm -rf build/
cd ..

# Clear Gradle cache globally
rm -rf ~/.gradle/caches/

# Rebuild
pnpm run android
```

### Issue 12: "adb: command not found"

**Solution:**

```bash
# Add to ~/.zshrc or ~/.bash_profile
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/platform-tools

# Apply changes
source ~/.zshrc
# OR
source ~/.bash_profile

# Verify
adb --version
```

---

## Project Setup (One-Time)

### Initial Project Configuration

If you're setting up the project for the first time on a new machine:

**For iOS:**
```bash
# 1. Clone repository
git clone <your-repo-url>
cd arzkaro

# 2. Install Node dependencies
pnpm install

# 3. Install iOS dependencies
cd ios && pod install && cd ..

# 4. Verify everything is set up
pnpm run ios

# The app should build and launch on iPhone simulator
```

**For Android:**
```bash
# 1. Clone repository (if not done already)
git clone <your-repo-url>
cd arzkaro

# 2. Install Node dependencies
pnpm install

# 3. Create Android Virtual Device in Android Studio
# (See Android Setup section above)

# 4. Start emulator
emulator -avd Pixel_7 &

# 5. Build and run
pnpm run android

# The app should build and launch on Android emulator
```

### Android-Specific Configuration

The project is already configured for Android in `app.config.js`:

```javascript
android: {
  package: 'com.arzkaro.app',
  adaptiveIcon: {
    foregroundImage: './assets/adaptive-icon.png',
    backgroundColor: '#ffffff',
  },
  edgeToEdgeEnabled: true,
  predictiveBackGestureEnabled: false,
  softwareKeyboardLayoutMode: 'resize',
}
```

**Key settings:**
- **package**: App identifier for Android
- **adaptiveIcon**: Icon configuration for Android 8.0+
- **edgeToEdgeEnabled**: Modern edge-to-edge display
- **softwareKeyboardLayoutMode**: Resize layout when keyboard appears

### Environment Setup Checklist

**For iOS:**
- [ ] macOS with Xcode installed
- [ ] Xcode Command Line Tools: `xcode-select --install`
- [ ] Node.js LTS version installed
- [ ] pnpm installed: `npm install -g pnpm`
- [ ] CocoaPods installed: `sudo gem install cocoapods`
- [ ] iOS Simulator available
- [ ] Port 8081 is free (not used by other apps)

**For Android:**
- [ ] Android Studio installed
- [ ] Android SDK (API Level 33 or 34)
- [ ] Android SDK Build-Tools
- [ ] Android Emulator installed
- [ ] Android Virtual Device (AVD) created
- [ ] ANDROID_HOME environment variable set
- [ ] ADB in PATH
- [ ] Port 8081 is free

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

3. **Simulator Performance:**

   ```bash
   # Use smaller simulator sizes
   # In Simulator: Window → Physical Size (or Cmd+1)

   # Close other apps to free up RAM
   # Simulators use significant CPU/memory
   ```

4. **Clear Caches Only When Needed:**

   ```bash
   # Don't clear cache unless you have issues
   # Clearing cache slows down the next reload

   # Only clear when you see weird errors:
   pnpm start -- --reset-cache
   ```

---

## Understanding Build Types

### Development Build (pnpm run ios)

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
- **Use Case:** App Store submission
- **Hot Reload:** No
- **Debugging:** No
- **When to use:** Final release only

---

## Quick Reference: What Command to Use

| Task                          | iOS Command                                                                             | Android Command                                                        |
| ----------------------------- | --------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| **Start development**         | `pnpm run ios`                                                                          | `pnpm run android`                                                     |
| **Start emulator/simulator**  | `open -a Simulator`                                                                     | `emulator -avd Pixel_7 &`                                              |
| **Just start Metro**          | `pnpm start`                                                                            | `pnpm start`                                                           |
| **Start with dev client**     | `npx expo start --dev-client`                                                           | `npx expo start --dev-client`                                          |
| **Reload app**                | Press 'r' in Metro terminal or `Cmd+R` in simulator                                     | Press 'r' in Metro or shake device                                     |
| **Open dev menu**             | `Cmd+D` in simulator                                                                    | `Cmd+M` or `adb shell input keyevent 82`                               |
| **Check devices**             | `xcrun simctl list devices`                                                             | `adb devices`                                                          |
| **Install new package**       | `pnpm install <package>`                                                                | `pnpm install <package>`                                               |
| **Install native package**    | `pnpm install <package> && cd ios && pod install && cd .. && pnpm run ios`              | `pnpm install <package> && pnpm run android`                           |
| **View logs**                 | In Xcode or Metro console                                                               | `adb logcat \| grep ReactNative`                                       |
| **Clear cache**               | `pnpm start -- --reset-cache`                                                           | `pnpm start -- --reset-cache`                                          |
| **Clean rebuild**             | `rm -rf node_modules && pnpm install && cd ios && pod install && cd .. && pnpm run ios` | `rm -rf node_modules && pnpm install && pnpm run android`              |
| **Uninstall app**             | `xcrun simctl uninstall booted com.arzkaro.app`                                         | `adb uninstall com.arzkaro.app`                                        |
| **Take screenshot**           | `xcrun simctl io booted screenshot screen.png`                                          | `adb shell screencap /sdcard/screen.png && adb pull /sdcard/screen.png` |
| **Build for production**      | `eas build --platform ios --profile production`                                         | `eas build --platform android --profile production`                    |

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
- Running: `cd ios && pod install && cd .. && pnpm run ios`

**Takes 2-5 minutes**

### 🔴 FULL REBUILD - After Configuration Changes

- Changing app.json
- Modifying build settings
- Updating Expo SDK
- Running: `pnpm run ios`

**Takes 5-10 minutes**

---

## Need Help?

### Common Questions

**Q: How do I know if a package is native?**
A: Check the package's README or look for `ios/` and `android/` folders in `node_modules/<package-name>`

**Q: Why is my first build so slow?**
A: First build compiles everything. Subsequent builds are much faster (2-3 minutes).

**Q: Can I develop without rebuilding every time?**
A: YES! Once built, just use `pnpm start` and edit code. Rebuilds only needed for native changes.

**Q: What's the fastest way to test changes?**
A: Keep Metro running, edit files, save. Changes appear in 1-2 seconds.

**Q: Should I use `pnpm run ios/android` or `pnpm start`?**
A:
- First time: `pnpm run ios` or `pnpm run android` (builds + runs)
- After that: Just keep Metro running from the first command
- If Metro stops: `pnpm start` or `npx expo start --dev-client`

**Q: Can I develop for both iOS and Android simultaneously?**
A: Yes! Keep Metro running and have both simulator and emulator open. Metro will serve to both platforms.

**Q: Which platform should I develop on?**
A: Develop on whichever platform is more convenient. Test on both before releasing. iOS simulator is generally faster on Mac, but Android emulator works well for most tasks.

---

**Happy Developing! 🚀**

For more detailed information, see the project README.
