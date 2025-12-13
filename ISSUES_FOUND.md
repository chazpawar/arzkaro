# 🚨 ArzKaro App Issues & Problems Report

**Date:** December 12, 2025  
**Status:** Critical issues found requiring immediate attention

---

## 🔴 CRITICAL ISSUES (Breaking Changes)

### 1. **Database Types Out of Sync with Migrations**

**Severity:** CRITICAL  
**Impact:** Type safety completely broken, runtime errors likely

**Problem:**
- `database.types.ts` reflects OLD schema from migration 001
- Migration 003 completely replaced the `host_requests` table with a NEW schema
- Types have NOT been regenerated since migration 003

**Evidence:**

**OLD Schema (in database.types.ts):**
```typescript
host_requests: {
  Row: {
    business_name: string | null;
    business_type: string | null;
    reason: string;
    reviewed_at: string | null;
    reviewed_by: string | null;
    status: host_request_status;
    user_id: string;
  }
}
```

**NEW Schema (in migration 003):**
```sql
CREATE TABLE host_requests (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  requested_host_type host_type NOT NULL,
  organizer_name TEXT NOT NULL,
  contact_number TEXT NOT NULL,
  email TEXT NOT NULL,
  street_address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  pin_code TEXT NOT NULL,
  pan_number TEXT NOT NULL,
  gstin TEXT,
  account_holder_name TEXT NOT NULL,
  beneficiary_name TEXT NOT NULL,
  account_number TEXT NOT NULL,
  ifsc_code TEXT NOT NULL,
  pan_card_photo_url TEXT NOT NULL,
  gst_certificate_url TEXT,
  status host_request_status DEFAULT 'pending' NOT NULL,
  reviewed_by UUID REFERENCES profiles(id),
  reviewed_at TIMESTAMPTZ,
  admin_notes TEXT,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
)
```

**Impact:**
- All host-related queries will fail at runtime
- TypeScript cannot catch these errors
- Admin panel host request management is broken
- Host application form validation uses wrong fields

---

### 2. **Missing `host_type` Field in Database Types**

**Severity:** CRITICAL  
**Impact:** Host system completely broken

**Problem:**
- Migration 003 added `host_type host_type` column to `profiles` table
- `database.types.ts` does NOT include this field
- Code is using `as unknown as` type assertions to bypass TypeScript

**Evidence:**
```typescript
// In profiles Row type - MISSING:
host_type: host_type | null;

// Current workaround in code (BAD):
const { role, host_type, is_host_approved } = profile as unknown as {
  role: string;
  host_type: string | null;
  is_host_approved: boolean;
};
```

**Locations using broken type assertions:**
- `src/services/event-service.ts` (lines 65, 127)
- `src/services/host-service.ts` (18 occurrences)
- `src/services/admin-service.ts` (8 occurrences)
- `src/services/booking-service.ts` (5 occurrences)

**Impact:**
- Cannot distinguish between Full Host and Activity Host
- Permission checks for event creation broken
- Host dashboard shows wrong capabilities

---

### 3. **Missing `host_type` ENUM in Database Types**

**Severity:** CRITICAL

**Problem:**
- Migration 003 created `CREATE TYPE host_type AS ENUM ('full', 'activity')`
- This enum is NOT in `database.types.ts`
- Cannot use type-safe enum values

**Missing:**
```typescript
// Should be in Enums:
host_type: 'full' | 'activity';
```

---

### 4. **Missing RPC Functions in Database Types**

**Severity:** HIGH  
**Impact:** Admin operations require type assertions

**Problem:**
- Migration 003 created 3 RPC functions:
  1. `approve_host_request(p_request_id, p_admin_id, p_admin_notes)`
  2. `reject_host_request(p_request_id, p_admin_id, p_rejection_reason, p_admin_notes)`
  3. `can_user_create_event_type(p_user_id, p_event_type)`
- These are NOT in `database.types.ts` Functions section
- Code uses `@ts-expect-error` to bypass TypeScript

**Evidence:**
```typescript
// @ts-expect-error - RPC function exists in database but not in generated types
const { data, error } = await supabase.rpc('approve_host_request', { ... });
```

**Occurrences:**
- `src/services/event-service.ts:29`
- `src/services/admin-service.ts:243`
- `src/services/admin-service.ts:284`

---

## 🟠 HIGH PRIORITY ISSUES

### 5. **Booking Cancellation Logic Removed**

**Severity:** HIGH  
**Impact:** Cancelled bookings don't update event capacity or ticket status

**Problem:**
- Migration 002 included cancellation handling in `auto_generate_tickets()`
- Migration 004 removed it when fixing search_path security issues
- Now cancelled bookings don't:
  - Mark tickets as cancelled
  - Decrease event `current_bookings` count

**Evidence:**
```sql
-- Migration 002 had this (lines 105-118):
IF NEW.status = 'cancelled' AND OLD.status != 'cancelled' THEN
  UPDATE tickets SET status = 'cancelled' WHERE booking_id = NEW.id;
  UPDATE events SET current_bookings = GREATEST(0, current_bookings - OLD.quantity);
END IF;

-- Migration 004 REMOVED this section entirely
```

**Impact:**
- Events show incorrect availability
- Cancelled tickets still show as "valid"
- Users cannot re-book cancelled slots
- Revenue calculations wrong

---

### 6. **Migration 004 and 005 Not Applied to Database**

**Severity:** HIGH  
**Impact:** Security fixes and performance optimizations not active

**Problem:**
- Git status shows these as untracked files:
  ```
  ?? supabase/migrations/004_security_fixes.sql
  ?? supabase/migrations/005_performance_optimizations.sql
  ```
- Database likely only has migrations 001-003 applied
- Missing:
  - Search path security fixes (15 functions vulnerable)
  - RLS performance optimizations (42 policies slow)
  - Booking cancellation logic

**Action Required:**
- Apply migrations 004 and 005 to Supabase
- Commit these files to git

---

### 7. **Inconsistent `updated_at` Trigger for `host_requests`**

**Severity:** MEDIUM

**Problem:**
- Migration 003 creates `update_host_request_updated_at()` function
- Migration 004 does NOT recreate this function with `SET search_path`
- Security vulnerability remains

---

## 🟡 MEDIUM PRIORITY ISSUES

### 8. **Type Assertion Overuse**

**Severity:** MEDIUM  
**Impact:** No compile-time type safety, potential runtime errors

**Problem:**
- 18 instances of `as unknown as` type assertions
- Bypasses TypeScript type checking
- All due to outdated `database.types.ts`

---

### 9. **Missing RLS Policy for Admin Profile SELECT**

**Severity:** MEDIUM  
**Impact:** Admins cannot read profiles they're managing

**Problem:**
- Migration 005 notes: "Admins need both SELECT and UPDATE permissions"
- Admin panel does: `UPDATE ... RETURNING *` which requires SELECT
- Policy added in migration 005 but migration not applied

---

### 10. **Event Group Auto-Creation Logic Inconsistency**

**Severity:** LOW

**Problem:**
- Migration 002: Creates group with name `NEW.title || ' - Group Chat'`
- Migration 004: Creates group with name `NEW.title || ' Chat'`
- Inconsistent naming convention

---

## 📊 SUMMARY

| Category | Count |
|----------|-------|
| Critical Issues | 4 |
| High Priority | 3 |
| Medium Priority | 3 |
| **TOTAL** | **10** |

---

## ✅ REQUIRED ACTIONS (Priority Order)

### Immediate Actions:

1. **Regenerate database types:**
   ```bash
   npx supabase gen types typescript --project-id e998f214-0dd4-4d63-b5f3-0d464ef70a7f > backend/types/database.types.ts
   ```

2. **Apply missing migrations:**
   ```sql
   -- Apply to Supabase SQL Editor:
   -- 1. 004_security_fixes.sql
   -- 2. 005_performance_optimizations.sql
   ```

3. **Fix cancellation logic in migration 004:**
   - Add back the cancellation handling code
   - Reapply migration 004

4. **Remove all `@ts-expect-error` comments:**
   - After regenerating types, RPC functions should be available
   - Remove type assertions

5. **Remove all `as unknown as` casts:**
   - Replace with proper typed queries
   - Use generated types from Supabase

---

## 🔍 VERIFICATION CHECKLIST

After fixes:
- [ ] No TypeScript errors in `src/services/`
- [ ] No `@ts-expect-error` comments
- [ ] No `as unknown as` type assertions
- [ ] All migrations applied to Supabase
- [ ] Booking cancellation test passes
- [ ] Host type filtering works
- [ ] Admin can approve/reject host requests
- [ ] Events show correct availability

---

## 📝 NOTES

**Why this happened:**
- Migration 003 completely changed `host_requests` schema
- Types were never regenerated after migration 003
- Developers used workarounds (`@ts-expect-error`, `as unknown as`) instead of fixing root cause
- Migrations 004-005 created but never applied to database

**Prevention:**
- Add `npm run generate-types` script
- Run after every migration
- Add pre-commit hook to check types are in sync
- Add CI/CD check for type mismatches

---

**End of Report**
