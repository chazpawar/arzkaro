# Backend - Supabase

This folder contains all backend-related code and configuration for the Arzkaro app using Supabase.

## Structure

```
backend/
├── supabase/              # Supabase configuration and migrations
│   ├── migrations/        # Database migrations (to be created)
│   ├── functions/         # Edge functions (to be created)
│   └── seed.sql          # Seed data (to be created)
├── types/                 # TypeScript types for database
│   └── database.types.ts # Generated types from Supabase schema
├── supabase.ts           # Supabase client initialization
├── auth.ts               # Authentication helpers (Google OAuth)
└── README.md             # This file
```

## Setup

### 1. Install Supabase CLI

```bash
pnpm install -g supabase
```

### 2. Initialize Supabase (if not already done)

```bash
cd backend
supabase init
```

### 3. Link to your Supabase project

```bash
supabase link --project-ref your-project-ref
```

### 4. Create migrations

```bash
supabase migration new your_migration_name
```

### 5. Apply migrations

```bash
supabase db push
```

## Files

### `supabase.ts`

Supabase client initialization with:

- AsyncStorage for session persistence
- PKCE flow for OAuth
- TypeScript types from `database.types.ts`

### `auth.ts`

Authentication helpers:

- `signInWithGoogle()` - Cross-platform Google OAuth
- `signOut()` - Sign out current user

### `types/database.types.ts`

TypeScript types generated from your Supabase database schema. Update these by running:

```bash
supabase gen types typescript --project-id YOUR_PROJECT_ID > backend/types/database.types.ts
```

## Environment Variables

Add these to your `.env` file in the project root:

```env
EXPO_PUBLIC_SUPABASE_URL=your-supabase-url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=your-ios-client-id
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=your-android-client-id
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=your-web-client-id
```

See `.env.example` for the full list and setup instructions.

## Database Schema

(To be defined based on your app requirements)

## Edge Functions

(To be added as needed)

## Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase with React Native](https://supabase.com/docs/guides/getting-started/tutorials/with-expo-react-native)
