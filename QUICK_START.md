# 🚀 Quick Start - ArzKaro

## ⚠️ IMPORTANT: First Time Setup

If you see errors like **"Could not find the table 'public.events'"**:

### You need to run database migrations!

**Easiest Method:**

1. Open https://supabase.com/dashboard
2. Select your project
3. Click **SQL Editor** → **New Query**
4. Copy all contents from: `backend/supabase/migrations/001_initial_schema.sql`
5. Paste and click **RUN**
6. Restart the app

**OR use Supabase CLI:**

```bash
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
```

📖 **Full instructions:** See `SETUP_DATABASE.md`

---

## 📱 Running the App

```bash
# Install dependencies
pnpm install

# Run on Android
pnpm run android

# Run on iOS
pnpm run ios
```

## 👤 Sign In

1. Click **"Sign in with Google"** button
2. Authorize with your Google account
3. Your profile will be created automatically
4. To become a host:
   - Go to Profile tab
   - Request host access
   - Wait for admin approval (or manually update role in database)

## ✨ Features to Test

- **Explore Tab**: Browse events
- **Chats Tab**: Group chats and DMs
- **Tickets Tab**: View your tickets
- **Profile Tab**: User settings, admin panel (if admin)

## 🐛 Common Issues

| Error             | Solution                                    |
| ----------------- | ------------------------------------------- |
| Table not found   | Run migrations (see above)                  |
| Loading forever   | Check .env has correct Supabase credentials |
| No events showing | Create your first event as admin/host       |

## 📚 Documentation

- `SETUP_DATABASE.md` - Database setup guide
- `docs/DEVELOPMENT_WORKFLOW.md` - Development guide
- `docs/SUPABASE_SETUP.md` - Supabase configuration

---

**Need help?** Check the error logs in the terminal for specific issues.
