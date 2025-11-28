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

This project uses Firebase for authentication and backend services.

### Setup Firebase

1. **Create a Firebase Project**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Click "Add project" and follow the wizard
   - Enable Google Analytics (optional)

2. **Enable Google Sign-In**
   - In Firebase Console, go to **Authentication** > **Sign-in method**
   - Click on **Google** and enable it
   - Note down your **Web Client ID** (it looks like: `xxxxx.apps.googleusercontent.com`)

3. **Configure Your Environment**
   - Copy `.env.example` to `.env`

   ```bash
   cp .env.example .env
   ```

   - Fill in your Firebase configuration values in `.env`:

   ```env
   EXPO_PUBLIC_FIREBASE_API_KEY=your_api_key
   EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
   EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.firebasestorage.app
   EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id

   # Google Sign-In Configuration
   EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=your_web_client_id.apps.googleusercontent.com
   EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=your_ios_client_id.apps.googleusercontent.com
   ```

4. **Configure Google Sign-In for iOS (Optional)**
   - In `app.json`, replace `YOUR_IOS_CLIENT_ID` with your actual iOS Client ID:

   ```json
   "iosUrlScheme": "com.googleusercontent.apps.YOUR_IOS_CLIENT_ID"
   ```

5. **Enable Firestore (Optional)**
   - In Firebase Console, go to **Firestore Database**
   - Click "Create database"
   - Choose production mode or test mode
   - Select your database location

### Google Sign-In Features

- ✅ One-tap Google Sign-In
- ✅ Works on iOS, Android, and Web
- ✅ Automatic token refresh
- ✅ Secure authentication with Firebase
- ✅ Sign out from both Google and Firebase

### Using Authentication

```tsx
import { googleSignInService, logoutService } from '../src/services/auth';

// Sign in with Google
const handleSignIn = async () => {
  const result = await googleSignInService();
  if (result.error) {
    console.error('Sign-in error:', result.error);
  } else {
    console.log('Signed in user:', result.user);
  }
};

// Sign out
const handleSignOut = async () => {
  await logoutService();
};
```

### Firebase Services Available

- **Authentication**: Google Sign-In (src/services/auth/)
- **Firestore**: User profiles and data storage (src/services/user/)
- **Storage**: Ready for file uploads (src/services/firebase/storage/)

### Important Notes

1. **Web Platform**: On web, Google Sign-In uses popup-based authentication
2. **Native Platforms**: On iOS/Android, uses native Google Sign-In SDK
3. **Security**: Never commit your `.env` file with real credentials
4. **Testing**: Use Firebase Emulator Suite for local development

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
