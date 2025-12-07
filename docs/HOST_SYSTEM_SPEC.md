# Multi-Tier Host System Specification

## Overview
The app has 3 user types with different capabilities:
1. **Normal User** - Can book tickets, view events
2. **Host (Two Types)** - Can create events/trips/activities (Full Host) or activities only (Activity Host)
3. **Admin** - Can do everything hosts can + approve/reject host requests + manage users

---

## User Roles & Permissions

### 1. Normal User (`role = 'user'`)
- ✅ Browse events/trips/activities
- ✅ Book tickets (payment required)
- ✅ View their bookings
- ✅ Join event group chats (after booking)
- ✅ Apply to become a host
- ❌ Cannot create events

### 2. Full Host (`role = 'host'`, `host_type = 'full'`)
**Can Host:** Events, Trips, AND Activities

**Requirements to Apply:**
- Organizer's Name or Company Name
- Contact Number
- Email (from signup)
- GSTIN (for businesses)
- PAN Number (individuals)
- Registered Address (Street, City, State, Pin Code)
- Bank Account Details:
  - Account Holder Name
  - Beneficiary Name
  - Account Number
  - IFSC Code
- Document Uploads:
  - GST Certificate (optional, for businesses)
  - PAN Card Photo (Google Drive/Cloud link)

### 3. Activity Host (`role = 'host'`, `host_type = 'activity'`)
**Can Host:** Activities ONLY (cannot create Events or Trips)

**Requirements to Apply:**
- Host's Name
- Contact Number
- Email (from signup)
- Address (Street, City, State, Pin Code)
- PAN Number
- Bank Account Details:
  - Account Holder Name
  - Beneficiary Name
  - Account Number
  - IFSC Code
- Document Uploads:
  - PAN Card Photo (Google Drive/Cloud link)

### 4. Admin (`role = 'admin'`)
**Capabilities:**
- ✅ Can host Events, Trips, AND Activities (like Full Host)
- ✅ View all pending host requests
- ✅ Approve/Reject host requests with admin notes
- ✅ Change any user's role in database
- ✅ View detailed KYC information submitted by hosts
- ✅ Manage all events across the platform

---

## Database Schema Changes

### Current Schema Issues
The current `host_requests` table is too simple:
```sql
CREATE TABLE host_requests (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  reason TEXT NOT NULL,              -- Too generic
  business_name TEXT,                -- Limited fields
  business_type TEXT,
  status host_request_status,
  reviewed_by UUID REFERENCES profiles(id),
  reviewed_at TIMESTAMPTZ,
  admin_notes TEXT,
  created_at TIMESTAMPTZ
);
```

### Required Schema Updates

#### 1. Update ENUMs
```sql
-- Add host_type enum
CREATE TYPE host_type AS ENUM ('full', 'activity');

-- event_type already exists: 'event', 'experience', 'trip'
-- Note: 'experience' should be renamed to 'activity' for clarity
```

#### 2. Update `profiles` Table
```sql
ALTER TABLE profiles 
ADD COLUMN host_type host_type DEFAULT NULL;

-- host_type is NULL for regular users
-- host_type = 'full' for full hosts
-- host_type = 'activity' for activity-only hosts
```

#### 3. Completely Redesign `host_requests` Table
```sql
DROP TABLE host_requests CASCADE;

CREATE TABLE host_requests (
  -- Basic Info
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  requested_host_type host_type NOT NULL, -- 'full' or 'activity'
  
  -- Personal/Business Info
  organizer_name TEXT NOT NULL,           -- Name or Company Name
  contact_number TEXT NOT NULL,
  email TEXT NOT NULL,                    -- From signup, for verification
  
  -- Address
  street_address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  pin_code TEXT NOT NULL,
  
  -- KYC Documents
  pan_number TEXT NOT NULL,               -- Required for both types
  gstin TEXT,                             -- Optional, only for full hosts with GST
  
  -- Bank Details
  account_holder_name TEXT NOT NULL,
  beneficiary_name TEXT NOT NULL,
  account_number TEXT NOT NULL,
  ifsc_code TEXT NOT NULL,
  
  -- Document Links
  pan_card_photo_url TEXT NOT NULL,       -- Google Drive link or cloud storage
  gst_certificate_url TEXT,               -- Optional, for businesses
  
  -- Admin Review
  status host_request_status DEFAULT 'pending' NOT NULL,
  reviewed_by UUID REFERENCES profiles(id),
  reviewed_at TIMESTAMPTZ,
  admin_notes TEXT,
  rejection_reason TEXT,                  -- Specific reason if rejected
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Constraints
  CONSTRAINT valid_phone CHECK (contact_number ~ '^\+?[0-9]{10,15}$'),
  CONSTRAINT valid_pan CHECK (pan_number ~ '^[A-Z]{5}[0-9]{4}[A-Z]{1}$'),
  CONSTRAINT valid_pin CHECK (pin_code ~ '^[0-9]{6}$'),
  CONSTRAINT valid_ifsc CHECK (ifsc_code ~ '^[A-Z]{4}0[A-Z0-9]{6}$')
);

-- Indexes
CREATE INDEX idx_host_requests_user_id ON host_requests(user_id);
CREATE INDEX idx_host_requests_status ON host_requests(status);
CREATE INDEX idx_host_requests_type ON host_requests(requested_host_type);
```

---

## Business Logic & Validation

### Host Application Flow

#### Step 1: User Applies for Host Access
1. User navigates to Profile → "Become a Host"
2. User selects host type:
   - **Full Host** (Events + Trips + Activities)
   - **Activity Host** (Activities only)
3. Form shows appropriate fields based on selection

#### Step 2: Form Validation (Frontend)
**Full Host Form:**
- All fields required except GST Certificate (optional)
- Validate PAN format: `ABCDE1234F`
- Validate Phone: 10-15 digits
- Validate IFSC: `ABCD0123456`
- Validate Pin Code: 6 digits
- Ensure document URLs are valid

**Activity Host Form:**
- All fields required
- Same validation as Full Host
- No GST fields shown

#### Step 3: Backend Validation
```typescript
// src/services/host-service.ts

async function submitHostRequest(data: HostRequestData) {
  // 1. Check if user already has pending request
  const existing = await checkPendingRequest(data.user_id);
  if (existing) throw new Error('You already have a pending host request');
  
  // 2. Validate PAN format
  if (!isValidPAN(data.pan_number)) throw new Error('Invalid PAN format');
  
  // 3. Validate phone
  if (!isValidPhone(data.contact_number)) throw new Error('Invalid phone number');
  
  // 4. Validate IFSC
  if (!isValidIFSC(data.ifsc_code)) throw new Error('Invalid IFSC code');
  
  // 5. For full hosts, check if GST provided with GSTIN
  if (data.requested_host_type === 'full' && data.gstin && !data.gst_certificate_url) {
    throw new Error('GST Certificate required when GSTIN provided');
  }
  
  // 6. Insert request
  const request = await supabase
    .from('host_requests')
    .insert(data)
    .select()
    .single();
    
  return request;
}
```

#### Step 4: Admin Reviews Request
**Admin Dashboard Shows:**
- Total pending requests count
- List of pending requests with:
  - User name & email
  - Requested host type (Full / Activity)
  - Submission date
  - Quick preview of details

**Admin Clicks on Request to View Full Details:**
```
┌─────────────────────────────────────────┐
│  Host Request Details                   │
├─────────────────────────────────────────┤
│ User: John Doe (john@email.com)         │
│ Type: Full Host                          │
│ Submitted: 2 days ago                    │
├─────────────────────────────────────────┤
│ Personal Info:                           │
│  • Organizer: ABC Company Pvt Ltd       │
│  • Contact: +91 9876543210               │
│  • Email: john@email.com                 │
│                                          │
│ Address:                                 │
│  • Street: 123 Main St                   │
│  • City: Mumbai, State: Maharashtra      │
│  • Pin Code: 400001                      │
│                                          │
│ KYC Documents:                           │
│  • PAN: ABCDE1234F                       │
│  • GSTIN: 27ABCDE1234F1Z5 (optional)     │
│                                          │
│ Bank Details:                            │
│  • Account Holder: John Doe              │
│  • Beneficiary: ABC Company Pvt Ltd      │
│  • Account Number: 1234567890            │
│  • IFSC: SBIN0001234                     │
│                                          │
│ Documents:                               │
│  • 📄 PAN Card: [View Link]              │
│  • 📄 GST Certificate: [View Link]       │
├─────────────────────────────────────────┤
│ Admin Notes:                             │
│ [Text area for notes]                    │
│                                          │
│ [Approve Button] [Reject Button]         │
└─────────────────────────────────────────┘
```

#### Step 5: Approve/Reject Logic
```typescript
// src/services/admin-service.ts

async function approveHostRequest(requestId: string, adminId: string, notes?: string) {
  // 1. Get request details
  const request = await getHostRequestById(requestId);
  
  // 2. Start transaction
  const { data, error } = await supabase.rpc('approve_host_request', {
    p_request_id: requestId,
    p_admin_id: adminId,
    p_admin_notes: notes
  });
  
  if (error) throw error;
  
  // 3. Send notification to user (email/push)
  await sendHostApprovalNotification(request.user_id, request.requested_host_type);
  
  return data;
}

async function rejectHostRequest(
  requestId: string, 
  adminId: string, 
  rejectionReason: string, 
  notes?: string
) {
  // 1. Update request status
  await supabase
    .from('host_requests')
    .update({
      status: 'rejected',
      reviewed_by: adminId,
      reviewed_at: new Date().toISOString(),
      rejection_reason: rejectionReason,
      admin_notes: notes
    })
    .eq('id', requestId);
  
  // 2. Send rejection notification
  const request = await getHostRequestById(requestId);
  await sendHostRejectionNotification(request.user_id, rejectionReason);
}
```

---

## Database Functions & Triggers

### Function: Approve Host Request (Atomic Transaction)
```sql
CREATE OR REPLACE FUNCTION approve_host_request(
  p_request_id UUID,
  p_admin_id UUID,
  p_admin_notes TEXT DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
  v_user_id UUID;
  v_host_type host_type;
BEGIN
  -- Get request details
  SELECT user_id, requested_host_type 
  INTO v_user_id, v_host_type
  FROM host_requests
  WHERE id = p_request_id AND status = 'pending';
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Host request not found or already processed';
  END IF;
  
  -- Update request status
  UPDATE host_requests
  SET 
    status = 'approved',
    reviewed_by = p_admin_id,
    reviewed_at = NOW(),
    admin_notes = p_admin_notes,
    updated_at = NOW()
  WHERE id = p_request_id;
  
  -- Update user profile
  UPDATE profiles
  SET 
    role = 'host',
    host_type = v_host_type,
    is_host_approved = TRUE,
    host_approved_at = NOW(),
    updated_at = NOW()
  WHERE id = v_user_id;
  
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### RLS Policies for `host_requests`

```sql
-- Users can view their own requests
CREATE POLICY "Users can view own requests"
  ON host_requests FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create their own requests
CREATE POLICY "Users can create requests"
  ON host_requests FOR INSERT
  WITH CHECK (
    auth.uid() = user_id 
    AND NOT EXISTS (
      SELECT 1 FROM host_requests 
      WHERE user_id = auth.uid() AND status = 'pending'
    )
  );

-- Only admins can view all requests
CREATE POLICY "Admins can view all requests"
  ON host_requests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Only admins can update requests
CREATE POLICY "Admins can update requests"
  ON host_requests FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
```

---

## Event Creation Permissions

### Logic: Who Can Create What?

```typescript
// src/services/event-service.ts

async function canUserCreateEventType(userId: string, eventType: 'event' | 'trip' | 'activity'): Promise<boolean> {
  const profile = await getUserProfile(userId);
  
  // Admins can create anything
  if (profile.role === 'admin') return true;
  
  // Regular users cannot create anything
  if (profile.role === 'user') return false;
  
  // Hosts must be approved
  if (!profile.is_host_approved) return false;
  
  // Full hosts can create everything
  if (profile.host_type === 'full') return true;
  
  // Activity hosts can only create activities
  if (profile.host_type === 'activity') {
    return eventType === 'activity';
  }
  
  return false;
}

async function createEvent(data: CreateEventData, userId: string) {
  // 1. Check permissions
  const canCreate = await canUserCreateEventType(userId, data.type);
  if (!canCreate) {
    throw new Error(
      `You don't have permission to create ${data.type}s. ` +
      (data.type !== 'activity' ? 'Apply for Full Host access to create events and trips.' : 'Apply for Host access.')
    );
  }
  
  // 2. Create event
  // ... rest of logic
}
```

### Database Constraint (Additional Safety Layer)
```sql
-- Function to check event creation permissions
CREATE OR REPLACE FUNCTION check_event_creation_permission()
RETURNS TRIGGER AS $$
DECLARE
  v_role user_role;
  v_host_type host_type;
  v_is_approved BOOLEAN;
BEGIN
  -- Get user details
  SELECT role, host_type, is_host_approved
  INTO v_role, v_host_type, v_is_approved
  FROM profiles
  WHERE id = NEW.host_id;
  
  -- Admins can create anything
  IF v_role = 'admin' THEN
    RETURN NEW;
  END IF;
  
  -- Must be approved host
  IF v_role != 'host' OR NOT v_is_approved THEN
    RAISE EXCEPTION 'User must be an approved host to create events';
  END IF;
  
  -- Full hosts can create anything
  IF v_host_type = 'full' THEN
    RETURN NEW;
  END IF;
  
  -- Activity hosts can only create activities
  IF v_host_type = 'activity' AND NEW.type != 'experience' THEN
    RAISE EXCEPTION 'Activity hosts can only create activities';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger
CREATE TRIGGER enforce_event_creation_permission
  BEFORE INSERT ON events
  FOR EACH ROW
  EXECUTE FUNCTION check_event_creation_permission();
```

---

## Admin Dashboard Requirements

### Admin Profile Page Sections

#### 1. **Admin Controls** (New Section)
```
┌────────────────────────────────────────┐
│  Admin Dashboard                       │
├────────────────────────────────────────┤
│  📋 Pending Host Requests: [5]         │
│  👥 Total Users: 1,234                  │
│  🎭 Total Hosts: 56                     │
│  🎪 Total Events: 123                   │
│                                        │
│  [View Host Requests]                  │
│  [Manage Users]                        │
│  [Manage Events]                       │
└────────────────────────────────────────┘
```

#### 2. **Host Requests Management Page**
- Tab: All | Pending | Approved | Rejected
- Search by user name/email
- Filter by host type (Full / Activity)
- Sort by date
- Bulk actions (future)

#### 3. **User Management Page** (Optional Enhancement)
- View all users
- Search & filter
- Manually change role (with confirmation)
- View user activity (bookings, hosted events)

---

## Summary of Changes Required

### Database Migrations Needed
1. ✅ Create `host_type` enum
2. ✅ Add `host_type` column to `profiles`
3. ✅ Drop and recreate `host_requests` table with full KYC fields
4. ✅ Create `approve_host_request()` function
5. ✅ Create RLS policies for `host_requests`
6. ✅ Create `check_event_creation_permission()` trigger
7. ✅ Rename `experience` → `activity` in event_type enum (optional for clarity)

### Frontend Changes Needed
1. ✅ Host application form (Profile screen)
   - Host type selection
   - Dynamic form based on type
   - Document upload UI
2. ✅ Admin dashboard (new screen)
3. ✅ Host requests management (Admin)
4. ✅ Permission checks in event creation
5. ✅ Update event type labels ("experience" → "activity")

### Backend Services Needed
1. ✅ `submitHostRequest()` - Submit host application
2. ✅ `getHostRequests()` - Get requests (filtered by status)
3. ✅ `approveHostRequest()` - Approve with notes
4. ✅ `rejectHostRequest()` - Reject with reason
5. ✅ `canUserCreateEventType()` - Permission check
6. ✅ Update `createEvent()` with permission check

---

## Next Steps

1. Review and approve this specification
2. Create migration file for database changes
3. Update TypeScript types
4. Implement backend services
5. Build frontend UI components
6. Test thoroughly
7. Deploy

**Estimated Complexity:** High (5-7 days)
**Priority:** High (Core business logic)
