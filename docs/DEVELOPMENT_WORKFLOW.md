# Development Workflow Guide - iOS Development with Expo

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

# 3. Install iOS pods
cd ios && pod install && cd ..

# 4. Build and run (this will take 5-10 minutes first time)
pnpm run ios
```

### Daily Development (Fast - No Rebuild Needed!)

```bash
# Just run this - Metro bundler will handle hot reloading
pnpm run ios
```

**That's it!** The app will launch on the simulator and any code changes will automatically reload.

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

### Scenario 4: Switching Between Simulator Devices

```bash
# List available simulators
xcrun simctl list devices available

# Run on specific device
pnpm run ios --device "iPhone 15 Pro Max"
# OR
pnpm run ios --device "iPhone SE (3rd generation)"
```

---

## Common Development Commands

### Metro Bundler Commands (Interactive)

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

### Simulator Commands

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

---

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

# 3. Install iOS dependencies
cd ios && pod install && cd ..

# 4. Verify everything is set up
pnpm run ios

# The app should build and launch on iPhone 17 Pro simulator
```

### Environment Setup Checklist

- [ ] macOS with Xcode installed
- [ ] Xcode Command Line Tools: `xcode-select --install`
- [ ] Node.js LTS version installed
- [ ] pnpm installed: `npm install -g pnpm`
- [ ] CocoaPods installed: `sudo gem install cocoapods`
- [ ] iOS Simulator available
- [ ] Port 8081 is free (not used by other apps)

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

| Task                       | Command                                                                                 |
| -------------------------- | --------------------------------------------------------------------------------------- |
| **Start development**      | `pnpm run ios`                                                                          |
| **Just start Metro**       | `pnpm start`                                                                            |
| **Reload app**             | Press 'r' in Metro terminal                                                             |
| **Open dev menu**          | `Cmd+D` in simulator                                                                    |
| **Install new package**    | `pnpm install <package>`                                                                |
| **Install native package** | `pnpm install <package> && cd ios && pod install && cd .. && pnpm run ios`              |
| **Clear cache**            | `pnpm start -- --reset-cache`                                                           |
| **Clean rebuild**          | `rm -rf node_modules && pnpm install && cd ios && pod install && cd .. && pnpm run ios` |
| **Run on specific device** | `pnpm run ios --device "iPhone 15 Pro"`                                                 |
| **Build for production**   | `eas build --platform ios --profile production --local`                                 |

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

**Q: Should I use `pnpm run ios` or `pnpm start`?**
A:

- First time: `pnpm run ios` (builds + runs)
- After that: Just keep Metro running from the first command
- If Metro stops: `pnpm start`

---

**Happy Developing! 🚀**

For more detailed information, see [planios.md](./planios.md)
