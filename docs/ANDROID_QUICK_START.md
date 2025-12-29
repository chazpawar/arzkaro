# Android Development - Quick Start Guide

This guide will help you start developing the ArzKaro app on Android in under 5 minutes.

## ✅ Prerequisites Check

You already have everything installed! Let's verify:

```bash
# Check Java
java -version
# Expected: openjdk version "17.x.x"

# Check Android SDK
echo $ANDROID_HOME
# Expected: C:\Users\Chaitanya Pawar\AppData\Local\Android\Sdk

# Check available emulators
emulator -list-avds
# Expected: Pixel_7

# Check ADB
adb devices
# Expected: List of devices (may be empty if no device connected)
```

## 🚀 Start Developing (3 Simple Steps)

### Step 1: Start the Emulator

```bash
# Open Android emulator
emulator -avd Pixel_7
```

**Wait for the emulator to fully boot** (you'll see the home screen)

### Step 2: Build and Run the App

In a new terminal window:

```bash
cd C:\Users\Chaitanya Pawar\arzkaro

# Install dependencies (first time only)
pnpm install

# Build and run on Android
pnpm run android
```

This will:
- Build the Android app (5-10 minutes first time)
- Install it on the emulator
- Start Metro bundler
- Launch the app

### Step 3: Start Coding!

Now you can edit your code and see changes instantly:

1. Open `app/index.tsx` in your editor
2. Make a change (e.g., change some text)
3. Save the file
4. The app reloads automatically! ✨

## 🎯 Daily Workflow

After the first setup, your daily workflow is super simple:

```bash
# Terminal 1: Start emulator
emulator -avd Pixel_7

# Terminal 2: Run the app
cd C:\Users\Chaitanya Pawar\arzkaro
pnpm run android

# Now edit your code - changes appear instantly!
```

## 🔧 Useful Commands

### Metro Bundler (when running)

Press these keys in the Metro terminal:
- `r` - Reload the app
- `d` - Open developer menu
- `?` - Show all commands

### In the Emulator

- `Ctrl + M` - Open developer menu
- `R + R` (press R twice) - Reload app

### ADB Commands

```bash
# View React Native logs
adb logcat *:S ReactNative:V ReactNativeJS:V

# Restart ADB if connection issues
adb kill-server
adb start-server

# Clear app data
adb shell pm clear com.arzkaro.app

# Open dev menu
adb shell input keyevent 82
```

## 🐛 Common Issues & Fixes

### Issue: "Could not connect to development server"

**Fix:**
```bash
# Run this command to forward the port
adb reverse tcp:8081 tcp:8081

# Then reload the app (press R+R in emulator)
```

### Issue: "Metro bundler won't start"

**Fix:**
```bash
# Kill any process on port 8081
netstat -ano | findstr :8081
# Note the PID, then kill it:
taskkill /PID <PID> /F

# Start Metro again
pnpm start
```

### Issue: "Build failed"

**Fix:**
```bash
# Clean and rebuild
cd android
./gradlew clean
cd ..
pnpm run android
```

### Issue: "Emulator won't start"

**Fix:**
```bash
# Kill all emulator processes
adb kill-server
adb start-server

# Start emulator fresh
emulator -avd Pixel_7 -wipe-data
```

## 📱 Using Your Physical Device

Instead of the emulator, you can use your Android phone:

1. **Enable Developer Options:**
   - Go to Settings > About Phone
   - Tap "Build Number" 7 times

2. **Enable USB Debugging:**
   - Go to Settings > Developer Options
   - Enable "USB Debugging"

3. **Connect via USB:**
   - Connect your phone to your computer
   - Allow USB debugging on your phone

4. **Verify Connection:**
   ```bash
   adb devices
   # You should see your device listed
   ```

5. **Run the app:**
   ```bash
   pnpm run android
   ```

## 🎨 What Can You Edit Without Rebuilding?

✅ **NO REBUILD NEEDED** - Just save and see changes:
- React components (`.tsx`, `.jsx` files)
- Styles (StyleSheet)
- Business logic
- API calls
- Screen navigation
- Text content
- Constants

❌ **REBUILD NEEDED** - Run `pnpm run android`:
- Installing new packages with native code
- Changing `app.json` or `app.config.js`
- Modifying permissions in AndroidManifest.xml
- Updating Expo SDK
- Changing package name or bundle identifier

## 📚 Next Steps

Once you're comfortable with the basics:

1. **Read the full workflow:** [DEVELOPMENT_WORKFLOW_ANDROID.md](./DEVELOPMENT_WORKFLOW_ANDROID.md)
2. **Learn about the project structure:** [README.md](../README.md)
3. **Understand the setup:** [SETUP.md](../SETUP.md)

## 🎉 You're Ready!

You now have everything you need to develop on Android. Just remember:

1. **Start emulator:** `emulator -avd Pixel_7`
2. **Run app:** `pnpm run android`
3. **Edit code** and see instant changes!

Happy coding! 🚀

---

**Need more help?** Check out [DEVELOPMENT_WORKFLOW_ANDROID.md](./DEVELOPMENT_WORKFLOW_ANDROID.md) for detailed information about all commands and troubleshooting steps.
