require('dotenv').config();

module.exports = {
  expo: {
    name: 'arzkaro',
    slug: 'arzkaro',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'light',
    scheme: 'arzkaro',
    newArchEnabled: false, // Disabled for react-native-razorpay compatibility
    splash: {
      image: './assets/splash-icon.png',
      resizeMode: 'contain',
      backgroundColor: '#ffffff',
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.arzkaro.app',
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
        NSPhotoLibraryUsageDescription:
          'This app needs access to your photo library to upload event images.',
        NSCameraUsageDescription: 'This app needs access to your camera to take event photos.',
      },
    },
    android: {
      package: 'com.arzkaro.app',
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#ffffff',
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
      softwareKeyboardLayoutMode: 'resize',
    },
    web: {
      favicon: './assets/favicon.png',
    },
    extra: {
      eas: {
        projectId: 'e998f214-0dd4-4d63-b5f3-0d464ef70a7f',
      },
      supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    },
    plugins: [
      'expo-web-browser',
      [
        'expo-image-picker',
        {
          photosPermission: 'The app needs access to your photo library to upload event images.',
          cameraPermission: 'The app needs access to your camera to take event photos.',
        },
      ],
    ],
  },
};
