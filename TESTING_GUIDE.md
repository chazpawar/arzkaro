# Authentication & Booking Flow - Testing Guide

## 🎯 Overview

This guide covers manual testing for the newly implemented features:
1. **Complete Authentication System** with OTP signup (matching mobile app)
2. **Ticket Booking Flow** (dedicated booking page)
3. **Guest Mode** functionality
4. **Session Persistence**

---

## ⚙️ Prerequisites - Supabase Configuration

### 1. Email Authentication Setup

**Location**: Supabase Dashboard → Authentication → Email Auth

**Required Settings**:
```
✅ Enable Email provider
✅ Enable email confirmations: CHOOSE ONE OPTION

Option A (Recommended for Testing):
  ⚪ Disable email confirmations
  → Users can signup and immediately enter OTP

Option B (Production):
  ✅ Enable email confirmations
  → Users receive email link first, THEN OTP email
  → Must click confirmation link before OTP works
```

**Why this matters**: If email confirmations are enabled, users must verify their email via link BEFORE they can use OTP.

---

### 2. Email Template Configuration

**Location**: Supabase Dashboard → Authentication → Email Templates

**Critical**: Update the "Confirm signup" template to include OTP code:

```html
<h2>Confirm your signup</h2>

<p>Follow this link to confirm your user:</p>
<p><a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email">Confirm your email</a></p>

<!-- ADD THIS LINE FOR OTP -->
<p><strong>Or use this verification code: {{ .Token }}</strong></p>
```

**Why this matters**: Without `{{ .Token }}`, users won't receive the 6-digit OTP code in their email.

---

### 3. Google OAuth Configuration (Optional)

**Location**: Supabase Dashboard → Authentication → Providers → Google

**Steps**:
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create OAuth 2.0 credentials
3. Add authorized redirect URI:
   ```
   https://rsyuknfgziydxtvmidgd.supabase.co/auth/v1/callback
   ```
4. Copy Client ID and Client Secret to Supabase
5. Enable Google provider in Supabase

**Test URLs**:
- Development: `http://localhost:5173`
- Production: Your actual domain

---

### 4. Database Check - Profiles Table

**Location**: Supabase Dashboard → Database → Tables → profiles

**Verify the table exists with this structure**:
```sql
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text,
  full_name text,
  avatar_url text,
  email text,
  role text DEFAULT 'user',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Check if trigger exists to auto-create profile
CREATE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

**Why this matters**: Without the trigger, user profiles won't be created automatically.

---

## 🧪 Manual Testing Checklist

### Test 1: OTP Signup Flow (Primary Test)

**Steps**:
1. Start dev server: `cd arzkaro-frontend && npm run dev`
2. Open browser: `http://localhost:5173`
3. Click **"Login/Signup"** in navbar
4. Click **"Don't have an account? Sign up"**
5. Fill in:
   - Full Name: `Test User`
   - Email: `your-email@gmail.com`
   - Password: `test123456`
6. Click **"Continue"** button
7. **Check email inbox** (and spam folder!)
8. OTP modal should appear automatically
9. Enter the **6-digit code** from email
10. Click **"Verify code"**

**✅ Expected Result**:
- Modal closes
- Navbar shows **"My Tickets"** button
- Profile dropdown appears with your name
- Console logs: `Auth state changed: SIGNED_IN`

**❌ Common Issues**:

| Issue | Cause | Fix |
|-------|-------|-----|
| No email received | Email template missing `{{ .Token }}` | Update template in Supabase |
| "Invalid OTP" error | Email confirmations enabled | Click email link first, OR disable confirmations |
| Modal doesn't open | Check browser console for errors | Verify Supabase env vars in `.env` |
| "User already registered" | Email used before | Use different email OR delete from `auth.users` |

---

### Test 2: Email/Password Login (No OTP)

**Steps**:
1. Click **"Login/Signup"** in navbar
2. Enter credentials from Test 1:
   - Email: `your-email@gmail.com`
   - Password: `test123456`
3. Click **"Log in"** button

**✅ Expected Result**:
- Modal closes immediately
- Logged in (no OTP required)
- Navbar shows profile dropdown

**Why no OTP?**: Login uses `signInWithPassword()` (instant), signup uses `signInWithOtp()` (requires verification).

---

### Test 3: OTP Resend Functionality

**Steps**:
1. Start signup flow (Test 1, steps 1-6)
2. When OTP modal appears, **DO NOT enter code**
3. Click **"Resend"** link
4. Check email for new OTP

**✅ Expected Result**:
- "OTP resent successfully!" message appears
- New email received with fresh OTP code
- Can verify with new code

---

### Test 4: Guest Mode

**Steps**:
1. Ensure logged out (click Sign Out if needed)
2. Click **"Login/Signup"** in navbar
3. Click **"Skip"** button at bottom of modal

**✅ Expected Result**:
- Modal closes
- Can browse events/experiences
- Navbar does NOT show profile dropdown
- Still shows "Login/Signup" button

**Test booking restriction**:
1. Browse to an event detail page
2. Click **"Book Now"**
3. Should show booking page normally (guest mode doesn't restrict this yet - can be added)

---

### Test 5: Booking Flow (While Authenticated)

**Steps**:
1. Login first (Test 2)
2. Click **"Experiences"** in navbar
3. Click any event card
4. Click **"Book Now"** button
5. **Booking page should appear** with:
   - Event summary card (image, title, date, location)
   - Ticket type selection (radio buttons)
   - Quantity selector (+/- buttons)
   - Price summary
   - Info banner about digital tickets
   - Fixed footer with total price
6. Select a ticket type
7. Change quantity with +/- buttons
8. Click **"Confirm Booking"** in footer

**✅ Expected Result**:
- Payment modal opens (Forms.tsx)
- Shows Razorpay payment form
- Event details displayed in modal

**Navigation Test**:
1. Click back arrow in booking page
2. Should return to event detail page
3. URL should change to `/experience/{id}`

---

### Test 6: Session Persistence

**Steps**:
1. Login (Test 2)
2. Verify logged in (navbar shows profile)
3. **Refresh the page** (F5 or Ctrl+R)

**✅ Expected Result**:
- Still logged in after refresh
- Navbar still shows profile dropdown
- No need to login again

**How it works**: Session stored in browser localStorage by Supabase.

---

### Test 7: Google OAuth (If Configured)

**Steps**:
1. Ensure logged out
2. Click **"Login/Signup"** in navbar
3. Click **"Continue with Google"** button
4. Select Google account
5. Grant permissions

**✅ Expected Result**:
- Redirected back to app
- Logged in automatically
- Profile created with Google email/name
- Navbar shows profile dropdown

**❌ Common Issues**:

| Issue | Cause | Fix |
|-------|-------|-----|
| "OAuth provider not enabled" | Google not configured | Complete step 3 in Prerequisites |
| Redirect fails | Wrong redirect URI | Check Supabase callback URL matches Google Console |
| No profile created | Database trigger missing | Add trigger from step 4 in Prerequisites |

---

### Test 8: Sign Out

**Steps**:
1. While logged in, click **profile dropdown** in navbar
2. Click **"Sign Out"** button

**✅ Expected Result**:
- Dropdown closes
- Navbar shows "Login/Signup" button again
- Console logs: `Auth state changed: SIGNED_OUT`
- Can browse but not authenticated

---

### Test 9: Profile Update (Bonus)

**Steps**:
1. Login (Test 2)
2. Click **profile icon** in navbar
3. Update username or avatar
4. Save changes

**✅ Expected Result**:
- Profile updated in database
- Changes reflected in navbar dropdown
- No errors in console

---

## 🔍 Debugging Tips

### Check Environment Variables

```bash
cd arzkaro-frontend
cat .env
```

**Should contain**:
```env
VITE_SUPABASE_URL=https://rsyuknfgziydxtvmidgd.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...
```

**If missing**: Copy from `.env.example` and fill in your Supabase credentials.

---

### Browser Console Checks

**Open DevTools** (F12) → Console tab

**Good signs** (when logging in):
```
Auth state changed: SIGNED_IN
Profile fetched: {id: "...", email: "...", full_name: "..."}
```

**Bad signs**:
```
Error fetching profile: {...}
Sign in error: {...}
Verify OTP error: {...}
```

**Network tab**: Check for failed requests to Supabase:
- Look for red `POST` requests to `/auth/v1/token`
- Check response for error messages

---

### Database Verification

**Check if user was created**:

1. Go to Supabase Dashboard → Authentication → Users
2. Find your test email
3. Click to view details
4. Check `user_metadata`:
   ```json
   {
     "full_name": "Test User",
     "temp_password": null  // Should be null after OTP verification
   }
   ```

**Check if profile was created**:

1. Go to Supabase Dashboard → Database → Table Editor → profiles
2. Find row with matching `id` (same as auth user ID)
3. Verify `full_name`, `email` populated

---

### Common Error Messages

| Error | Meaning | Fix |
|-------|---------|-----|
| "Invalid login credentials" | Wrong email/password | Check credentials, or reset password |
| "User already registered" | Email exists | Login instead of signup, or delete user |
| "Invalid OTP" | Wrong code OR expired | Check email for latest code (expires in 60s) |
| "Email not confirmed" | Confirmations enabled | Click email confirmation link first |
| "No session created" | OTP verification failed | Check Supabase logs for details |
| "OAuth provider not enabled" | Google not configured | Complete OAuth setup in dashboard |

---

## 📊 Testing Summary

After completing all tests, you should have verified:

- ✅ **Signup with OTP**: Users can register with email verification
- ✅ **Login**: Users can login with email/password (no OTP)
- ✅ **OTP Resend**: Users can request new OTP if needed
- ✅ **Google OAuth**: Users can login with Google account
- ✅ **Guest Mode**: Users can browse without logging in
- ✅ **Booking Flow**: Users can select tickets and proceed to payment
- ✅ **Session Persistence**: Login persists across page refreshes
- ✅ **Sign Out**: Users can logout successfully
- ✅ **Profile Management**: User profiles are created and updated

---

## 🚀 Production Deployment Checklist

Before deploying to production:

1. **Email Configuration**:
   - [ ] Enable email confirmations
   - [ ] Configure custom SMTP provider (not Supabase default)
   - [ ] Update email templates with branding
   - [ ] Test email delivery across providers (Gmail, Outlook, etc.)

2. **OAuth Configuration**:
   - [ ] Update Google OAuth redirect URI to production domain
   - [ ] Test OAuth flow on production URL
   - [ ] Add privacy policy URL in Google OAuth consent screen

3. **Security**:
   - [ ] Enable RLS (Row Level Security) on `profiles` table
   - [ ] Review auth policies in Supabase
   - [ ] Rate limit OTP requests (prevent spam)
   - [ ] Add CAPTCHA to signup form (optional)

4. **Performance**:
   - [ ] Enable Supabase CDN for faster auth responses
   - [ ] Add loading states for all auth operations
   - [ ] Implement retry logic for failed requests

5. **User Experience**:
   - [ ] Add password strength indicator
   - [ ] Add "Forgot Password" flow
   - [ ] Add email change functionality
   - [ ] Add account deletion option

---

## 📝 Notes

- **OTP Expiration**: OTP codes expire after 60 seconds by default
- **Session Expiration**: Sessions expire after 1 hour (configurable in Supabase)
- **Email Rate Limits**: Supabase free tier has email sending limits
- **Guest Mode State**: Not persisted, resets on page refresh (by design)

---

## 🆘 Need Help?

If you encounter issues:

1. Check Supabase Logs: Dashboard → Logs → Auth Logs
2. Check browser console for errors
3. Verify environment variables are loaded: `console.log(import.meta.env)`
4. Test with different browsers (incognito mode)
5. Clear browser cache and localStorage

**Last Updated**: Session completed - Jan 7, 2026
**Branch**: `better_not_call_rohit`
**Commit**: `feat(web): implement complete auth with OTP signup and booking flow`
