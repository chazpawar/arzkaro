#!/bin/bash

echo "🚀 ArzKaro Database Migration Script"
echo ""
echo "This script will:"
echo "  1. Link your local project to Supabase (requires database password)"
echo "  2. Apply the database migration"
echo "  3. Generate TypeScript types"
echo ""
echo "📋 You'll need your database password from:"
echo "   https://supabase.com/dashboard/project/rsyuknfgziydxtvmidgd/settings/database"
echo ""
echo "Press ENTER to continue..."
read

echo ""
echo "Step 1: Linking to Supabase project..."
echo ""

cd /Users/RohitKumar/Desktop/arzkaro

# Link to project (will prompt for password)
supabase link --project-ref rsyuknfgziydxtvmidgd

if [ $? -ne 0 ]; then
  echo ""
  echo "❌ Failed to link project"
  echo "   Make sure you entered the correct database password"
  exit 1
fi

echo ""
echo "✅ Successfully linked to project!"
echo ""
echo "Step 2: Applying migration..."
echo ""

# Push migration to remote
supabase db push

if [ $? -ne 0 ]; then
  echo ""
  echo "❌ Failed to apply migration"
  exit 1
fi

echo ""
echo "✅ Migration applied successfully!"
echo ""
echo "Step 3: Generating TypeScript types..."
echo ""

# Generate types
supabase gen types typescript --linked > backend/types/database.types.ts

if [ $? -ne 0 ]; then
  echo ""
  echo "⚠️  Failed to generate types (you can do this manually later)"
else
  echo ""
  echo "✅ TypeScript types generated!"
fi

echo ""
echo "=========================================="
echo "✨ Setup Complete!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "  1. Restart your app: pnpm run ios"
echo "  2. Test the app - database errors should be gone!"
echo ""
echo "Verify in Supabase dashboard:"
echo "  https://supabase.com/dashboard/project/rsyuknfgziydxtvmidgd/editor"
echo ""
