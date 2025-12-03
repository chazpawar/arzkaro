# Backend - Supabase

This folder contains all backend-related code and configuration for the Arzkaro app using Supabase.

## Structure

```
backend/
├── supabase/              # Supabase configuration and migrations
│   ├── migrations/        # Database migrations
│   ├── functions/         # Edge functions
│   └── seed.sql          # Seed data
├── types/                 # TypeScript types for database
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

## Environment Variables

Add these to your `.env` file in the project root:

```env
EXPO_PUBLIC_SUPABASE_URL=your-supabase-url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

## Database Schema

(To be defined based on your app requirements)

## Edge Functions

(To be added as needed)

## Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase with React Native](https://supabase.com/docs/guides/getting-started/tutorials/with-expo-react-native)
