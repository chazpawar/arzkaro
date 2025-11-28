# Running Your App on Android and iOS

This guide explains how to run your Expo app on physical devices and emulators/simulators.

## Quick Start

### Start the Development Server

```bash
pnpm start
```

This will start the Expo development server and show a QR code in your terminal.

---

## Option 1: Using Expo Go (Easiest - Recommended for Beginners)

Expo Go is a free app that lets you test your app without setting up Android Studio or Xcode.

### On Android Phone

1. **Download Expo Go**
   - Open [Google Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)
   - Search for "Expo Go"
   - Install the app

2. **Connect to Your App**
   - Start your dev server: `pnpm start`
   - Open Expo Go app on your phone
   - Tap "Scan QR code"
   - Scan the QR code from your terminal
   - Your app will load!

**Troubleshooting:**

- Make sure your phone and computer are on the **same Wi-Fi network**
- If it doesn't work, try tunnel mode: `pnpm start --tunnel`

### On iOS Phone (iPhone/iPad)

1. **Download Expo Go**
   - Open App Store
   - Search for "Expo Go"
   - Install the app

2. **Connect to Your App**
   - Start your dev server: `pnpm start`
   - Open Camera app on your iPhone
   - Point camera at the QR code in terminal
   - Tap the notification to open in Expo Go
   - Your app will load!

**Alternative method:**

- Open Expo Go app
- Go to "Projects" tab
- Type the URL shown in terminal (like `exp://192.168.x.x:8081`)

---

## Option 2: Using Android Emulator

The Android Emulator lets you test your app on a virtual Android device on your computer.

### Prerequisites

1. **Install Android Studio**
   - Download from [developer.android.com/studio](https://developer.android.com/studio)
   - Install and open Android Studio
   - Complete the setup wizard

2. **Set up Android SDK**
   - Open Android Studio
   - Go to **Settings/Preferences** > **Appearance & Behavior** > **System Settings** > **Android SDK**
   - Install latest SDK platform (Android 13 or 14 recommended)
   - Click "SDK Tools" tab
   - Check "Android SDK Build-Tools", "Android Emulator", "Android SDK Platform-Tools"
   - Click "Apply" to install

3. **Set up environment variables**

   **On macOS/Linux:**

   ```bash
   # Add to ~/.zshrc or ~/.bashrc
   export ANDROID_HOME=$HOME/Library/Android/sdk
   export PATH=$PATH:$ANDROID_HOME/emulator
   export PATH=$PATH:$ANDROID_HOME/platform-tools
   ```

   **On Windows:**
   - Search "Environment Variables" in Start Menu
   - Add `ANDROID_HOME` = `C:\Users\YourUsername\AppData\Local\Android\Sdk`
   - Add to PATH: `%ANDROID_HOME%\platform-tools` and `%ANDROID_HOME%\emulator`

### Create and Run Emulator

1. **Create Virtual Device**
   - Open Android Studio
   - Click **More Actions** > **Virtual Device Manager**
   - Click **Create Device**
   - Select a device (e.g., Pixel 6)
   - Click **Next**
   - Download a system image (e.g., Android 13 / Tiramisu)
   - Click **Next** > **Finish**

2. **Start Emulator**
   - In Virtual Device Manager, click ▶️ (Play button) next to your device
   - Wait for emulator to boot up

3. **Run Your App**

   ```bash
   pnpm start
   ```

   - Press `a` in the terminal to open on Android
   - OR run: `pnpm android`

**The app will install and open on the emulator!**

---

## Option 3: Using iOS Simulator (macOS Only)

The iOS Simulator lets you test your app on a virtual iPhone/iPad on your Mac.

### Prerequisites

1. **Install Xcode**
   - Open App Store on your Mac
   - Search for "Xcode"
   - Click "Get" and install (this is large, ~10GB+)
   - Open Xcode and agree to license terms
   - Install additional components when prompted

2. **Install Xcode Command Line Tools**

   ```bash
   xcode-select --install
   ```

3. **Install Watchman** (optional but recommended)
   ```bash
   brew install watchman
   ```

### Run on iOS Simulator

1. **Start Development Server**

   ```bash
   pnpm start
   ```

2. **Open iOS Simulator**
   - Press `i` in the terminal
   - OR run: `pnpm ios`

3. **The simulator will open and your app will install automatically!**

**Changing Simulator Device:**

- Press `Shift + i` when dev server is running
- Select different device from list (iPhone 15, iPad, etc.)

---

## Option 4: Using Physical Device with Development Build

For advanced features and custom native code, you need a development build.

### Prerequisites

**For Android:**

- Android Studio installed
- Android SDK set up
- USB Debugging enabled on your phone

**For iOS:**

- macOS with Xcode installed
- iOS device registered in Apple Developer account (for physical devices)

### Build and Run

**Android:**

```bash
# Connect phone via USB
# Enable USB Debugging in Developer Options
pnpm exec expo run:android
```

**iOS:**

```bash
# Connect iPhone via USB
pnpm exec expo run:ios --device
```

This will:

1. Build a development version of your app
2. Install it on your device
3. Start the dev server

---

## Comparison: Which Method Should You Use?

| Method                | Pros                                                                      | Cons                                                     | Best For                 |
| --------------------- | ------------------------------------------------------------------------- | -------------------------------------------------------- | ------------------------ |
| **Expo Go**           | ✅ No setup needed<br>✅ Quick to start<br>✅ Works on any device         | ❌ Limited to Expo modules<br>❌ No custom native code   | Quick testing, beginners |
| **Android Emulator**  | ✅ No phone needed<br>✅ Easy debugging<br>✅ Test different devices      | ❌ Slower than real device<br>❌ Requires Android Studio | Development, testing     |
| **iOS Simulator**     | ✅ No phone needed<br>✅ Fast and responsive<br>✅ Test different devices | ❌ macOS only<br>❌ Requires Xcode                       | Development (Mac users)  |
| **Development Build** | ✅ Custom native code<br>✅ Production-like<br>✅ Full features           | ❌ Slower to build<br>❌ Requires setup                  | Advanced development     |

---

## Common Issues and Solutions

### "Can't connect to development server"

**Solution:**

1. Make sure phone and computer are on same Wi-Fi
2. Try tunnel mode: `pnpm start --tunnel`
3. Restart dev server: `Ctrl+C` then `pnpm start`

### "Android Emulator won't start"

**Solution:**

1. Check virtualization is enabled in BIOS
2. Try different system image (e.g., Android 13 instead of 14)
3. Allocate more RAM in AVD settings (2GB minimum)

### "iOS Simulator not found"

**Solution:**

1. Make sure Xcode is fully installed
2. Run: `xcode-select --install`
3. Open Xcode once to complete setup

### "App crashes on startup"

**Solution:**

1. Clear cache: `pnpm start --clear`
2. Reinstall dependencies: `rm -rf node_modules && pnpm install`
3. Check terminal for error messages

### "Changes not showing up"

**Solution:**

1. Shake device to open Developer Menu
2. Enable "Fast Refresh"
3. Reload app (Press `r` in terminal or Reload in Developer Menu)

---

## Pro Tips

### Speed Up Development

1. **Use Physical Device**: Faster than emulators
2. **Enable Fast Refresh**: Auto-reload on file changes
3. **Use Tunnel Mode Only When Needed**: LAN mode is faster

### Keyboard Shortcuts (Dev Server)

- `a` - Open on Android
- `i` - Open on iOS
- `w` - Open in web browser
- `r` - Reload app
- `m` - Toggle menu
- `c` - Clear cache and restart

### Developer Menu (On Device)

- **Android**: Shake device or `Ctrl+M` (emulator)
- **iOS**: Shake device or `Cmd+D` (simulator)

Options in menu:

- Reload
- Enable/Disable Fast Refresh
- Toggle Performance Monitor
- Show/Hide Inspector

---

## Next Steps

Once your app is running:

1. **Make changes** to your code and see them live
2. **Use Developer Menu** for debugging
3. **Test on multiple devices** to ensure compatibility
4. **Check out** the NativeWind styling guide in the docs
