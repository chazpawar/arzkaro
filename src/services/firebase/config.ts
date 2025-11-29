import { initializeApp, getApp, getApps, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import from firebase/auth (not @firebase/auth) to get React Native exports
import {
  getAuth,
  Auth,
  indexedDBLocalPersistence,
  initializeAuth,
  browserPopupRedirectResolver,
} from 'firebase/auth';

// Type for React Native persistence (only available in RN builds)
type ReactNativeAsyncStorage = typeof AsyncStorage;
type GetReactNativePersistence = (storage: ReactNativeAsyncStorage) => any;

// Dynamic import for React Native persistence
const getReactNativePersistence: GetReactNativePersistence | undefined =
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  Platform.OS !== 'web' ? (require('firebase/auth') as any).getReactNativePersistence : undefined;
// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase
let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let storage: FirebaseStorage;

if (!getApps().length) {
  app = initializeApp(firebaseConfig);

  if (Platform.OS === 'web') {
    // Web: Use IndexedDB persistence
    auth = initializeAuth(app, {
      persistence: indexedDBLocalPersistence,
      popupRedirectResolver: browserPopupRedirectResolver,
    });
    console.log('Firebase Auth initialized with IndexedDB persistence for web');
  } else {
    // React Native: Use AsyncStorage persistence
    if (!getReactNativePersistence) {
      throw new Error('React Native persistence not available');
    }
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
    console.log('Firebase Auth initialized with AsyncStorage persistence for React Native');
  }

  db = getFirestore(app);
  storage = getStorage(app);
} else {
  app = getApp();
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
}

export { app, auth, db, storage };
