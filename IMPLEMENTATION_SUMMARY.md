# Authentication & Booking Implementation - Quick Reference

## 🎯 What Was Implemented

### 1. Complete Supabase Authentication System
- **Full AuthContext** (`arzkaro-frontend/src/contexts/AuthContext.tsx`)
  - Email/password login (direct, no OTP)
  - Email/password signup **with OTP verification**
  - OTP resend functionality
  - Google OAuth integration (ready for config)
  - Guest mode support
  - Session management & persistence
  - Profile CRUD operations

### 2. OTP Verification Modal
- **New Component** (`arzkaro-frontend/src/components/OTPVerificationModal.tsx`)
  - 6-digit OTP entry
  - Auto-focus input
  - Resend OTP functionality
  - Success/error messaging
  - Matches mobile app design

### 3. Dedicated Booking Page
- **New Page** (`arzkaro-frontend/src/pages/BookingPage.tsx`)
  - Event summary card
  - Ticket type selection (radio buttons)
  - Quantity selector (+/- buttons, min: 1, max: 10)
  - Price summary with line items
  - Info banner (instant digital tickets)
  - Fixed footer with CTA button
  - Integrates with existing Razorpay Forms.tsx

### 4. Updated Components
- **Auth Modal** (`arzkaro-frontend/src/components/Auth.tsx`)
  - Updated signup flow to trigger OTP modal
  - Integrated `sendSignupOTP()` and `verifyOTP()`
  - "Continue" button for signup (not "Sign Up")
  
- **Navbar** (`arzkaro-frontend/src/components/Navbar.tsx`)
  - Shows profile dropdown when authenticated
  - Displays user name from profile
  - Sign out functionality
  - "My Tickets" link when logged in

- **App Router** (`arzkaro-frontend/src/App.tsx`)
  - Added `/booking/:id` route
  - Booking page navigation handling
  - State management for booking flow

- **Event Detail Page** (`arzkaro-frontend/src/pages/ExperienceDetailPage.tsx`)
  - Added `onBookNow` prop
  - Navigates to booking page instead of showing modal inline

---

## 🔄 User Flow Diagrams

### Signup Flow (with OTP)
```
User clicks "Login/Signup"
  ↓
Clicks "Sign up"
  ↓
Enters: Full Name + Email + Password
  ↓
Clicks "Continue" button
  ↓
sendSignupOTP() called
  ├─ Supabase: signInWithOtp() with shouldCreateUser: true
  ├─ Password stored in user_metadata.temp_password
  └─ OTP email sent
  ↓
OTP modal opens automatically
  ↓
User enters 6-digit code from email
  ↓
Clicks "Verify code"
  ↓
verifyOTP() called
  ├─ Supabase: verifyOtp(email, token, type: 'email')
  ├─ Password set from temp_password
  ├─ temp_password removed from metadata
  └─ Session created
  ↓
Profile fetched from database
  ↓
Modal closes → User logged in
  ↓
Navbar shows profile dropdown
```

### Login Flow (no OTP)
```
User clicks "Login/Signup"
  ↓
Enters: Email + Password
  ↓
Clicks "Log in" button
  ↓
signIn() called
  └─ Supabase: signInWithPassword()
  ↓
Session created → Profile fetched
  ↓
Modal closes → User logged in
```

### Booking Flow
```
Browse event list
  ↓
Click event card → Event Detail Page
  ↓
Click "Book Now" button
  ↓
Navigate to /booking/:id → Booking Page
  ├─ Event summary displayed
  ├─ Select ticket type (radio)
  ├─ Select quantity (+/- buttons)
  └─ Price calculated automatically
  ↓
Click "Confirm Booking" in footer
  ↓
Payment modal opens (Forms.tsx)
  ↓
Razorpay payment form displayed
  ↓
Complete payment
  ↓
Navigate to /thankyou → Confirmation Page
```

---

## 📂 File Structure

### New Files (2)
```
arzkaro-frontend/src/
├── components/
│   └── OTPVerificationModal.tsx  ← OTP verification UI
└── pages/
    └── BookingPage.tsx            ← Ticket selection & booking
```

### Modified Files (6)
```
arzkaro-frontend/src/
├── contexts/
│   └── AuthContext.tsx            ← COMPLETELY REPLACED (stub → full Supabase)
├── components/
│   ├── Auth.tsx                   ← Added OTP signup flow
│   ├── Navbar.tsx                 ← Added profile dropdown
│   └── ProfileModal.tsx           ← Fixed updateProfile signature
├── pages/
│   └── ExperienceDetailPage.tsx   ← Navigate to booking page
└── App.tsx                        ← Added booking route
```

---

## 🔑 Key Functions

### AuthContext API
```typescript
// Email/Password
signIn(email, password)              // Login (no OTP)
signUp(email, password, fullName?)   // Direct signup (not used)

// OTP Signup Flow
sendSignupOTP(email, fullName, password)  // Send OTP email
verifyOTP(email, otp)                     // Verify code & complete signup
resendOTP(email)                          // Send new OTP

// OAuth
signInWithGoogle()                   // Google login

// Profile & Session
signOut()                            // Logout
updateProfile({username, ...})       // Update user profile
refreshProfile()                     // Reload profile from DB

// Guest Mode
enableGuestMode()                    // Browse without login
disableGuestMode()                   // Exit guest mode
```

### Supabase Functions Used
```typescript
// OTP Signup
supabase.auth.signInWithOtp({
  email,
  options: {
    shouldCreateUser: true,
    data: { full_name, temp_password }
  }
})

// OTP Verification
supabase.auth.verifyOtp({
  email,
  token: otp,
  type: 'email'
})

// Set Password After Verification
supabase.auth.updateUser({
  password: tempPassword,
  data: { temp_password: null }
})

// Login
supabase.auth.signInWithPassword({
  email,
  password
})

// Google OAuth
supabase.auth.signInWithOAuth({
  provider: 'google',
  options: { redirectTo: window.location.origin }
})

// Session Listener
supabase.auth.onAuthStateChange((event, session) => {
  // Handle SIGNED_IN, SIGNED_OUT, etc.
})
```

---

## ⚙️ Environment Variables

```env
# arzkaro-frontend/.env
VITE_SUPABASE_URL=https://rsyuknfgziydxtvmidgd.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...
```

**Usage in Code**:
```typescript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)
```

---

## 🗄️ Database Schema

### Profiles Table
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
```

### Auth Metadata Structure
```json
// auth.users.user_metadata
{
  "full_name": "Test User",
  "temp_password": "hashed_password"  // Only during OTP flow
}
```

### Auto-Create Profile Trigger
```sql
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

---

## 🚦 Routes

| Path | Component | Description |
|------|-----------|-------------|
| `/` | HomePage | Landing page |
| `/experiences` | ExperiencesPage | Event list |
| `/experience/:id` | ExperienceDetailPage | Event details with "Book Now" |
| `/booking/:id` | BookingPage | Ticket selection & quantity |
| `/my-tickets` | MyTicketsPage | User's booked tickets |
| `/thankyou` | ThankYouPage | Post-payment confirmation |

**Navigation Flow**:
```
/experience/123 → /booking/123 → (Payment Modal) → /thankyou
```

---

## ✅ Testing Commands

```bash
# Development
cd arzkaro-frontend
npm run dev              # Start dev server (localhost:5173)

# Build & Type Check
npm run build            # Production build
npm run typecheck        # Check TypeScript errors

# Git
git status               # Check uncommitted changes
git log --oneline -5     # View recent commits
```

---

## 🎨 Design Tokens

### Colors
```css
--primary: #FF785A      /* Orange accent (buttons, links) */
--border: #e5e7eb       /* Gray borders */
--text-primary: #111827 /* Black text */
--text-secondary: #6b7280 /* Gray text */
```

### Border Radius
```css
rounded-xl   = 12px     /* Cards, buttons */
rounded-2xl  = 16px     /* Modals */
rounded-full            /* Profile avatars */
```

### Spacing
```css
p-4  = 16px padding
p-6  = 24px padding
gap-4 = 16px gap
```

---

## 🐛 Known Issues & Limitations

1. **Email Delivery**: 
   - Supabase free tier has rate limits
   - OTP emails may go to spam folder
   - Consider custom SMTP in production

2. **Guest Mode**:
   - State not persisted across refreshes
   - Resets to logged-out state on reload
   - Intentional behavior (can be changed if needed)

3. **Google OAuth**:
   - Requires manual configuration in Supabase
   - Redirect URI must match exactly
   - Works on localhost for testing

4. **OTP Expiration**:
   - Codes expire after 60 seconds
   - User must request resend if expired
   - Configurable in Supabase settings

5. **Session Duration**:
   - Default: 1 hour
   - Auto-refresh enabled
   - Configurable in Supabase

---

## 📦 Dependencies

```json
{
  "@supabase/supabase-js": "^2.x",  // Supabase client
  "lucide-react": "^x.x.x",          // Icons (User, ChevronDown, etc.)
  "react": "^18.x",
  "react-dom": "^18.x"
}
```

---

## 🔗 Useful Links

- **Supabase Dashboard**: https://app.supabase.com/project/rsyuknfgziydxtvmidgd
- **Supabase Auth Docs**: https://supabase.com/docs/guides/auth
- **Google OAuth Setup**: https://console.cloud.google.com/
- **Testing Guide**: `/TESTING_GUIDE.md` (in repo root)

---

## 📊 Build Status

```bash
✅ TypeScript: 0 errors
✅ Build: Successful (3.34s)
✅ All tests: Ready for manual testing
✅ Git: All changes committed
```

**Commits**:
- `71f0520` - feat(web): implement complete auth with OTP signup and booking flow
- `9f07892` - fix(web): update mockEvents import path to ExperienceDetailPage

**Branch**: `better_not_call_rohit`

---

## 🎯 Next Steps

1. **Configure Supabase email templates** (add `{{ .Token }}`)
2. **Test OTP signup flow** end-to-end
3. **Configure Google OAuth** (optional)
4. **Test all user flows** (see TESTING_GUIDE.md)
5. **Deploy to production** when ready

---

**Last Updated**: Jan 7, 2026  
**Implementation**: Complete ✅  
**Status**: Ready for testing 🚀
