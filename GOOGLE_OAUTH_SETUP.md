# Google OAuth Setup Guide for Arzkaro

This guide will help you fix the Google Sign-In error: `"code": 500, "error_code": "unexpected_failure"`

## Problem

The error occurs because Google OAuth is not configured in your Supabase project. You need to:
1. Create a Google OAuth app
2. Configure it in Supabase Dashboard
3. Add credentials to your environment variables

---

## Step 1: Create Google OAuth Credentials

### 1.1 Go to Google Cloud Console
Visit: https://console.cloud.google.com/

### 1.2 Create or Select a Project
- If you don't have a project, click "Create Project"
- Name it "Arzkaro" or similar
- Click "Create"

### 1.3 Enable Google+ API (if not already enabled)
- Go to "APIs & Services" > "Library"
- Search for "Google+ API"
- Click "Enable"

### 1.4 Create OAuth Credentials
1. Go to "APIs & Services" > "Credentials"
2. Click "+ CREATE CREDENTIALS" > "OAuth client ID"
3. If prompted, configure the OAuth consent screen:
   - Choose "External" user type
   - Fill in required fields:
     - App name: `Arzkaro`
     - User support email: Your email
     - Developer contact: Your email
   - Click "Save and Continue"
   - Skip scopes (default is fine)
   - Add test users if needed
   - Click "Save and Continue"

4. Create OAuth Client ID:
   - Application type: **Web application**
   - Name: `Arzkaro Web`
   - Authorized JavaScript origins:
     ```
     http://localhost:3000
     https://rsyuknfgziydxtvmidgd.supabase.co
     https://yourdomain.com (your production domain)
     ```
   - Authorized redirect URIs:
     ```
     http://localhost:3000/auth/callback
     https://rsyuknfgziydxtvmidgd.supabase.co/auth/v1/callback
     https://yourdomain.com/auth/callback (your production domain)
     ```
   - Click "Create"

5. **Copy the Client ID and Client Secret** - you'll need these!

---

## Step 2: Configure Google OAuth in Supabase Dashboard

### 2.1 Open Supabase Dashboard
Visit: https://supabase.com/dashboard/project/rsyuknfgziydxtvmidgd

### 2.2 Navigate to Authentication Settings
1. Click "Authentication" in the left sidebar
2. Click "Providers"
3. Find "Google" in the list
4. Toggle it to **Enabled**

### 2.3 Add Google Credentials
1. Paste your **Client ID** from Step 1.4
2. Paste your **Client Secret** from Step 1.4
3. (Optional) Configure additional settings:
   - Skip nonce check: Leave unchecked (unless needed)
4. Click **Save**

### 2.4 Note the Redirect URL
Supabase will show you the redirect URL to use:
```
https://rsyuknfgziydxtvmidgd.supabase.co/auth/v1/callback
```

Make sure this matches what you added to Google Console in Step 1.4.

---

## Step 3: Update Environment Variables (Optional for Local Development)

If you're running Supabase locally with `supabase start`, add these to your `.env` file:

### For Frontend (.env in arzkaro-frontend/)
```bash
# Already configured:
VITE_SUPABASE_URL=https://rsyuknfgziydxtvmidgd.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# No additional variables needed for frontend - uses hosted Supabase
```

### For Local Supabase Development (if using)
Create `.env` in the root `arzkaro/` directory:
```bash
GOOGLE_CLIENT_ID=your-client-id-from-google.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret-from-google
```

**Note:** Since you're using the hosted Supabase (rsyuknfgziydxtvmidgd.supabase.co), you only need to configure Google OAuth in the Supabase Dashboard (Step 2). Local environment variables are only needed if you're running Supabase locally.

---

## Step 4: Update Frontend Redirect URL (if needed)

### 4.1 Check Current Implementation
The current implementation in `src/contexts/AuthContext.tsx` uses:
```typescript
redirectTo: window.location.origin
```

This should work correctly, but if you encounter issues, you can make it more explicit:

### 4.2 Update to Explicit Redirect (Optional)
```typescript
const signInWithGoogle = async (): Promise<{ error: Error | null }> => {
  try {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });

    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('Google sign in error:', error);
    return { error: error as Error };
  }
};
```

---

## Step 5: Test Google Sign-In

1. Start your development server:
   ```bash
   cd arzkaro-frontend
   npm run dev
   ```

2. Open http://localhost:3000 in your browser

3. Click on "Login/Signup"

4. Click "Continue with Google"

5. You should be redirected to Google's OAuth consent screen

6. After authorizing, you'll be redirected back to your app and signed in!

---

## Troubleshooting

### Error: "redirect_uri_mismatch"
- Make sure the redirect URI in Google Console **exactly matches** what Supabase uses
- Common issue: Missing `/auth/v1/callback` in the URI

### Error: "Access blocked: This app's request is invalid"
- Make sure you've configured the OAuth consent screen in Google Console
- Add your email as a test user if the app is in "Testing" mode

### Error: Still getting 500 error
1. Check Supabase Dashboard logs:
   - Go to Supabase Dashboard > Logs > Auth Logs
   - Look for detailed error messages

2. Verify credentials:
   - Make sure Client ID and Secret are correctly copied (no extra spaces)
   - Re-save the configuration in Supabase Dashboard

3. Check browser console:
   - Open DevTools (F12)
   - Look for detailed error messages in Console tab
   - Check Network tab for failed requests

### Error: "Email not verified"
- Some Google accounts may not have verified emails
- You can enable `email_optional` in Supabase settings if needed

---

## Security Notes

1. **Never commit secrets to git**:
   - Client Secret should be kept secure
   - Already configured in `.gitignore`

2. **Production Setup**:
   - Add your production domain to Google Console authorized origins
   - Update Supabase redirect URLs for production

3. **OAuth Consent Screen**:
   - Before going to production, submit your app for verification
   - Or keep it in testing mode with a limited number of test users

---

## Quick Reference

### Important URLs
- Google Console: https://console.cloud.google.com/
- Supabase Dashboard: https://supabase.com/dashboard/project/rsyuknfgziydxtvmidgd
- Supabase Auth Callback: https://rsyuknfgziydxtvmidgd.supabase.co/auth/v1/callback

### Files Modified
- `supabase/config.toml` - Added Google OAuth configuration (for local Supabase)
- Frontend already has Google sign-in implemented in `src/contexts/AuthContext.tsx`

### Next Steps After Setup
1. Test Google Sign-In
2. Check if user profile is created correctly in `profiles` table
3. Test sign-out functionality
4. Test refresh behavior (should stay signed in after refresh)

---

## Need Help?

If you're still experiencing issues:
1. Check Supabase Auth Logs in the Dashboard
2. Check browser console for detailed errors
3. Verify all credentials are correctly entered
4. Ensure redirect URIs match exactly

Good luck! 🚀
