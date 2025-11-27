# Arzkaro

A modern cross-platform mobile application built with React Native, Expo Router, and NativeWind.

## Tech Stack

- **Framework**: [React Native](https://reactnative.dev/) 0.81.5
- **Runtime**: [Expo](https://expo.dev/) ~54.0.25
- **Routing**: [Expo Router](https://docs.expo.dev/router/introduction/) ~6.0.15
- **Styling**: [NativeWind](https://www.nativewind.dev/) v4.2.1 + [Tailwind CSS](https://tailwindcss.com/) v3.4.1
- **Animations**: [React Native Reanimated](https://docs.swmansion.com/react-native-reanimated/) ~4.1.5
- **Language**: [TypeScript](https://www.typescriptlang.org/) ~5.9.2
- **Package Manager**: [pnpm](https://pnpm.io/)

## Features

- ✅ File-based routing with Expo Router
- ✅ Utility-first styling with NativeWind (Tailwind CSS for React Native)
- ✅ Dark mode support
- ✅ TypeScript for type safety
- ✅ Cross-platform (iOS, Android, Web)
- ✅ React Native New Architecture enabled
- ✅ ESLint + Prettier for code quality
- ✅ Firebase integration ready

## Prerequisites

Before you begin, ensure you have the following installed:

- [Node.js](https://nodejs.org/) (v18 or later)
- [pnpm](https://pnpm.io/) (v8 or later)
- [Expo CLI](https://docs.expo.dev/get-started/installation/)

For mobile development:

- **iOS**: [Xcode](https://developer.apple.com/xcode/) (macOS only)
- **Android**: [Android Studio](https://developer.android.com/studio)

## Getting Started

### 1. Clone the Repository

```bash
git clone <repository-url>
cd arzkaro
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Start the Development Server

```bash
pnpm start
```

This will start the Expo development server. You can then:

- Press `i` to open iOS simulator
- Press `a` to open Android emulator
- Press `w` to open in web browser
- Scan the QR code with [Expo Go](https://expo.dev/client) app on your phone

## Available Scripts

| Command        | Description                              |
| -------------- | ---------------------------------------- |
| `pnpm start`   | Start the Expo development server        |
| `pnpm android` | Start the app on Android emulator/device |
| `pnpm ios`     | Start the app on iOS simulator/device    |
| `pnpm web`     | Start the app in web browser             |
| `pnpm lint`    | Run ESLint to check code quality         |
| `pnpm format`  | Format code with Prettier                |

## Project Structure

```
arzkaro/
├── app/                      # App screens and routing (Expo Router)
│   ├── _layout.tsx          # Root layout
│   └── index.tsx            # Home screen
├── src/                     # Source code
│   └── services/            # Services (Firebase, API, etc.)
│       └── firebase/        # Firebase configuration
├── assets/                  # Images, fonts, and other assets
├── docs/                    # Documentation
│   ├── setup.md            # Setup documentation
│   └── tailwind-setup.md   # Tailwind configuration guide
├── global.css              # Global styles (Tailwind directives)
├── tailwind.config.js      # Tailwind CSS configuration
├── babel.config.js         # Babel configuration
├── tsconfig.json           # TypeScript configuration
└── package.json            # Project dependencies and scripts
```

## Styling with NativeWind

This project uses NativeWind, which brings Tailwind CSS to React Native. You can use Tailwind utility classes directly in your components:

```tsx
import { View, Text } from 'react-native';

export default function Example() {
  return (
    <View className="flex-1 items-center justify-center bg-white dark:bg-gray-900">
      <Text className="text-2xl font-bold text-primary">Hello NativeWind!</Text>
    </View>
  );
}
```

### Custom Colors

The project includes a custom primary color (`#007bff`) that you can use:

```tsx
<View className="bg-primary">
  <Text className="text-white">Primary Background</Text>
</View>
```

### Dark Mode

Dark mode is supported out of the box:

```tsx
<View className="bg-white dark:bg-gray-900">
  <Text className="text-gray-900 dark:text-white">Auto dark mode support</Text>
</View>
```

## Package Manager: pnpm vs npx

This project uses **pnpm** as the package manager. Here's when to use what:

### Use `pnpm` for:

- Installing packages: `pnpm install`
- Adding dependencies: `pnpm add <package>`
- Running scripts: `pnpm start`, `pnpm android`, etc.

### Use `npx` or `pnpm exec` for:

- Running binaries: `npx expo install <package>`
- One-off commands: `pnpm dlx create-expo-app`

### Best Practice

Always use the scripts defined in `package.json`:

```bash
# ✅ Recommended
pnpm start
pnpm android

# ❌ Avoid
npx expo start
npx expo start --android
```

## Development Tips

### Hot Reloading

Expo provides fast refresh out of the box. Your changes will be reflected immediately in the app.

### Debugging

- Press `j` in the terminal to open the debugger
- Use React Native Debugger for advanced debugging
- Check the console for error messages

### Type Checking

Run TypeScript type checking:

```bash
pnpm exec tsc --noEmit
```

### Code Quality

```bash
# Check for linting errors
pnpm lint

# Auto-fix linting errors
pnpm lint --fix

# Format code
pnpm format
```

## Building for Production

### Android

```bash
pnpm exec eas build --platform android
```

### iOS

```bash
pnpm exec eas build --platform ios
```

### Web

```bash
pnpm exec expo export:web
```

> Note: You'll need to set up [EAS Build](https://docs.expo.dev/build/introduction/) for production builds.

## Firebase Integration

Firebase configuration is located in `src/services/firebase/`. To set up Firebase:

1. Create a project in [Firebase Console](https://console.firebase.google.com/)
2. Add your configuration to `src/services/firebase/config/index.ts`
3. Install Firebase packages as needed:
   ```bash
   pnpm add firebase
   ```

## Troubleshooting

### Metro bundler cache issues

```bash
pnpm start --clear
```

### Node modules issues

```bash
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

### iOS build issues

```bash
cd ios
pod install
cd ..
```

### Android build issues

```bash
cd android
./gradlew clean
cd ..
```

## Resources

- [Expo Documentation](https://docs.expo.dev/)
- [React Native Documentation](https://reactnative.dev/)
- [NativeWind Documentation](https://www.nativewind.dev/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Expo Router Documentation](https://docs.expo.dev/router/introduction/)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Support

For issues and questions, please check the documentation in the `docs/` folder or create an issue in the repository.

---

Built with ❤️ using React Native and Expo
