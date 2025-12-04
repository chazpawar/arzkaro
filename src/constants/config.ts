// App configuration constants

export const Config = {
  // App info
  appName: 'ArzKaro',
  appVersion: '1.0.0',

  // API & Backend
  supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL || '',
  supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '',

  // Deep linking
  scheme: 'arzkaro',

  // Pagination
  defaultPageSize: 20,

  // Image sizes
  avatarSizes: {
    small: 32,
    medium: 48,
    large: 80,
    xlarge: 120,
  },

  // Event defaults
  defaultCurrency: 'INR',
  defaultTimezone: 'Asia/Kolkata',

  // Validation limits
  maxTitleLength: 100,
  maxDescriptionLength: 2000,
  maxBioLength: 500,
  maxUsernameLength: 30,
  minUsernameLength: 3,

  // Date formats
  dateFormat: 'MMM d, yyyy',
  timeFormat: 'h:mm a',
  dateTimeFormat: 'MMM d, yyyy h:mm a',

  // Role-based test emails (development)
  testEmails: {
    admin: 'dinesh.1124k@gmail.com',
    host: 'rrucnamra@gmail.com',
  },
};

export type UserRole = 'user' | 'host' | 'admin';
