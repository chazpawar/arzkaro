require('dotenv').config();

module.exports = {
  expo: {
    name: 'arzkaro',
    slug: 'arzkaro',

    owner: 'chaz1', // ✅ ADD THIS LINE

    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'light',
    scheme: 'arzkaro',
    newArchEnabled: false,
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
        NSLocationWhenInUseUsageDescription:
          'Allow ArzKaro to use your location to find nearby events and experiences.',
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
      permissions: ['ACCESS_COARSE_LOCATION', 'ACCESS_FINE_LOCATION'],
      googleServicesFile: './google-services.json',
    },
    web: {
      favicon: './assets/favicon.png',
    },
    extra: {
      eas: {
        projectId: '27bcb6e8-0b00-429d-9ac0-387b9e876cd7',
      },
      supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
      EXPO_PUBLIC_GOOGLE_MAPS_API_KEY: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY,
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
      [
        'expo-location',
        {
          locationAlwaysAndWhenInUsePermission:
            'Allow ArzKaro to use your location to find nearby events and experiences.',
        },
      ],
      [
        'expo-notifications',
        {
          icon: './assets/icon.png',
          color: '#ffffff',
        },
      ],
    ],
  },
};
