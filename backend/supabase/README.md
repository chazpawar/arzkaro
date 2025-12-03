# Supabase Configuration

This directory contains Supabase-specific configuration files.

## Folders

- `migrations/` - Database migration files
- `functions/` - Supabase Edge Functions

## Getting Started

1. Install Supabase CLI: `pnpm install -g supabase`
2. Run `supabase init` to initialize
3. Link to your project: `supabase link --project-ref YOUR_PROJECT_REF`

## Migrations

Create a new migration:
```bash
supabase migration new migration_name
```

Apply migrations:
```bash
supabase db push
```
