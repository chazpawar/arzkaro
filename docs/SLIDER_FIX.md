# Slider Component Fix for Legacy Architecture

## Problem Overview

When using `@react-native-community/slider` v5.1.1+ with React Native Legacy Architecture, the app crashes at runtime with the following error:

```
-[RCTUIManager createView:viewName:rootTag:props:]
at RCTUIManager.mm Line 1,041, Column 0
```

This occurs when any screen attempts to render the `<Slider>` component.

## Root Cause

Version 5.1.1+ of `@react-native-community/slider` was designed primarily for the New Architecture (Fabric) using codegen with `interfaceOnly: true`. While it includes both architecture implementations:

- **New Architecture:** Uses `RNCSliderComponentView.mm` (Fabric component)
- **Legacy Architecture:** Requires `RNCSliderManager.m` (ViewManager)

The problem is that **v5.1.1 is missing the `RNCSliderManager.m` file** required for Legacy Architecture, causing React Native to fail when trying to create the native slider view.

## Why We Need Legacy Architecture

Our app **must use Legacy Architecture** because:

- `react-native-razorpay` dependency requires Legacy Architecture
- Payment processing is critical functionality
- Cannot enable New Architecture without breaking payment integration

Configuration:

- `app.config.js`: `newArchEnabled: false`
- `ios/Podfile.properties.json`: `"newArchEnabled": "false"`

## Solution

Downgrade `@react-native-community/slider` to version **4.5.3**, which includes proper Legacy Architecture support.

### Step-by-Step Fix

```bash
# 1. Remove the problematic version
pnpm remove @react-native-community/slider

# 2. Install v4.5.3 (last stable version with Legacy Architecture support)
pnpm add @react-native-community/slider@4.5.3

# 3. Reinstall iOS pods
cd ios
pod install
cd ..

# 4. Clean and rebuild (if needed)
# For iOS:
pnpm run ios

# For Android:
pnpm run android
```

### Verification

After installation, verify the required files are present:

```bash
ls -la node_modules/@react-native-community/slider/ios/
```

You should see:

- ✅ `RNCSliderManager.h` - Legacy Architecture header
- ✅ `RNCSliderManager.m` - Legacy Architecture implementation
- ✅ `RNCSliderComponentView.h` - New Architecture header (unused but present)
- ✅ `RNCSliderComponentView.mm` - New Architecture implementation (unused but present)

## Testing the Fix

1. **Build and run the app:**

   ```bash
   pnpm run ios
   # or
   pnpm run android
   ```

2. **Test slider functionality:**
   - Navigate to Events/Explore tab
   - Tap the search/filter button
   - Verify the search modal opens with the radius slider
   - Test dragging the slider (should show 5-50 km range)
   - Confirm no crashes occur
   - Verify search filters events based on location + radius

3. **Check logs for errors:**
   ```bash
   # No errors related to RCTUIManager or createView should appear
   tail -f ios/build-logs.txt | grep -i "error\|slider"
   ```

## Alternative Solutions (If Needed)

If v4.5.3 doesn't work for any reason, try these alternatives in order:

### Option 1: Try v5.0.1 (Expo's bundled version)

```bash
pnpm add @react-native-community/slider@5.0.1
cd ios && pod install && cd ..
pnpm run ios
```

### Option 2: Use alternative slider package

```bash
pnpm add react-native-slider-x
# Update imports in components
# import Slider from 'react-native-slider-x'
```

### Option 3: Custom implementation with PanResponder

Create a custom slider component using React Native's PanResponder API if third-party solutions fail.

## Files Modified

- `package.json` - Updated slider dependency to v4.5.3
- `src/components/SearchModal.tsx` - Uses `@react-native-community/slider`

## Version Compatibility Matrix

| Slider Version | Legacy Arch | New Arch | Status   | Notes                      |
| -------------- | ----------- | -------- | -------- | -------------------------- |
| 5.1.1+         | ❌          | ✅       | Broken   | Missing RNCSliderManager.m |
| 5.0.1          | ⚠️          | ✅       | Untested | Expo bundled version       |
| 4.5.3          | ✅          | ✅       | Working  | Recommended for Legacy     |
| 4.4.x          | ✅          | ❌       | Working  | Pre-New Architecture       |

## Related Issues

- React Native Legacy Architecture requirement: `app.config.js:60`
- Razorpay dependency constraint: `package.json` (react-native-razorpay)
- SearchModal slider usage: `src/components/SearchModal.tsx:14,200-210`

## Prevention

To prevent this issue in the future:

1. **Lock the slider version in package.json:**

   ```json
   {
     "dependencies": {
       "@react-native-community/slider": "4.5.3"
     }
   }
   ```

2. **Add a comment in SearchModal.tsx:**

   ```tsx
   // Using v4.5.3 for Legacy Architecture support (required for razorpay)
   import Slider from '@react-native-community/slider';
   ```

3. **Before upgrading any native dependencies:**
   - Check if the package has codegen with `interfaceOnly: true`
   - Verify it includes ViewManager files for Legacy Architecture
   - Test on both iOS and Android simulators

4. **Monitor the package when upgrading:**

   ```bash
   # Before upgrade
   npm view @react-native-community/slider versions
   npm view @react-native-community/slider@latest

   # Check changelog for architecture changes
   ```

## Additional Resources

- [React Native New Architecture](https://reactnative.dev/docs/new-architecture-intro)
- [Slider Package Repository](https://github.com/callstack/react-native-slider)
- [Legacy Architecture Support](https://reactnative.dev/docs/new-architecture-app-intro)

## Status

- **Issue:** Resolved ✅
- **Date Fixed:** December 28, 2025
- **Build Status:** Success
- **Testing:** Passed on iPhone 16e simulator
- **Current Version:** @react-native-community/slider@4.5.3
