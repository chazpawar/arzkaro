# Location Search Analysis & Issues

## Current Implementation Overview

### Flow:

1. User opens SearchModal → selects location → sets radius → taps Search
2. SearchModal passes `(location, query, radius, coordinates?)` to explore.tsx
3. explore.tsx filters events client-side using the `filteredEvents` logic
4. Events are displayed based on filters

---

## Identified Issues

### Issue 1: **Radius Search Only Works for "Current Location"**

**Location**: `app/(tabs)/explore.tsx` line 415-440

**Current Code:**

```typescript
// Radius-based filtering (when using current location)
if (searchLocation === 'Current Location' && userCoordinates) {
  // Check if event has coordinates
  if (event.location_lat && event.location_lng) {
    const distance = haversineDistance(
      userCoordinates.latitude,
      userCoordinates.longitude,
      event.location_lat,
      event.location_lng
    );
    if (distance > searchRadius) {
      return false;
    }
  }
}
```

**Problem**:

- Radius search ONLY applies when `searchLocation === 'Current Location'`
- When user selects a city from autocomplete (e.g., "Bangalore"), the coordinates ARE stored in `userCoordinates`
- BUT the `searchLocation` variable is set to the city NAME (e.g., "Bangalore"), not "Current Location"
- So the radius filter never runs for autocomplete-selected locations!

**Expected Behavior**:

- If `userCoordinates` exist (from EITHER current location OR autocomplete), radius search should apply
- The location name can be displayed for UI, but radius logic should check coordinates

---

### Issue 2: **Text-Based Location Search May Be Too Strict**

**Location**: `app/(tabs)/explore.tsx` line 359-412

**Current Logic**:

```typescript
if (searchLocation && searchLocation !== 'All Locations' && searchLocation !== 'Current Location') {
  // Text-based matching using location name/address
  // ...flexible matching logic...
}
```

**Problems**:

1. **Autocomplete selections skip text search**: When user selects "Bangalore" from autocomplete:
   - `searchLocation = "Bangalore"`
   - `userCoordinates = {lat: 12.9716, lng: 77.5946}`
   - Text search runs (but may not match if event has "Bengaluru")
   - Radius search DOES NOT run (because searchLocation !== 'Current Location')

2. **No clear separation between**:
   - Text-only search (popular locations without coordinates)
   - Coordinate-based search (autocomplete + current location)

---

### Issue 3: **Events May Not Have Coordinates**

**Source**: Previously created events before Google Places integration

**Problem**:

- Old events have NULL `location_lat` and `location_lng`
- Radius search correctly excludes these (line 434-438)
- But this means MOST events may be hidden if user searches by location

**Solution Needed**:

- Backfill script to geocode existing events
- OR fallback to text search when coordinates are missing

---

## Root Cause Summary

The main bug is a **logic error in the location filter conditions**:

1. When user selects autocomplete location:
   - `searchLocation` = "Bangalore" (city name)
   - `userCoordinates` = {lat, lng} (coordinates)
   - **Text search runs** (may not match)
   - **Radius search does NOT run** (searchLocation !== 'Current Location')

2. The code treats "Current Location" as the ONLY case for radius search, but autocomplete also provides coordinates

---

## Proposed Fixes

### Fix 1: Update Radius Search Logic (CRITICAL)

**File**: `app/(tabs)/explore.tsx`

**Change the condition from:**

```typescript
if (searchLocation === 'Current Location' && userCoordinates) {
```

**To:**

```typescript
// Apply radius search whenever we have coordinates (current location OR autocomplete)
if (userCoordinates && searchLocation !== 'All Locations') {
```

**Rationale**:

- Check if `userCoordinates` exist (regardless of searchLocation value)
- This covers both "Current Location" AND autocomplete selections
- Still skip when searchLocation is 'All Locations' (no location filter)

---

### Fix 2: Update Location Text Search Logic

**Option A**: Skip text search when coordinates are available

```typescript
// Only do text-based search if NO coordinates available (popular locations)
if (
  searchLocation &&
  searchLocation !== 'All Locations' &&
  !userCoordinates // NEW: Skip text search if we have coordinates
) {
  // Text-based flexible matching
  // ...
}
```

**Option B**: Run text search as fallback

```typescript
// First try radius search if coordinates available
if (userCoordinates && searchLocation !== 'All Locations') {
  // Radius search
  if (event.location_lat && event.location_lng) {
    const distance = haversineDistance(...);
    if (distance > searchRadius) {
      return false; // Outside radius
    }
  } else {
    // Event has no coordinates - fallback to text search
    // ... text matching logic ...
  }
}
```

**Recommendation**: Use **Option B** for better UX

- Events WITH coordinates: Use precise radius search
- Events WITHOUT coordinates: Fallback to text search
- Covers both new and old events

---

### Fix 3: Update Search Modal to Clarify Behavior

Add hint text when coordinates are fetched:

```typescript
{userCoordinates && (
  <Text style={styles.coordinateHint}>
    📍 Coordinates: {userCoordinates.latitude.toFixed(4)}, {userCoordinates.longitude.toFixed(4)}
  </Text>
)}
```

---

### Fix 4: Backfill Existing Events (Optional but Recommended)

Create script: `/scripts/backfill-event-coordinates.ts`

**Pseudo-code**:

```typescript
// 1. Get all events without coordinates
const events = await supabase
  .from('events')
  .select('id, location_name, location_address')
  .or('location_lat.is.null,location_lng.is.null');

// 2. For each event, geocode address
for (const event of events) {
  const address = event.location_address || event.location_name;
  if (!address) continue;

  try {
    const coords = await geocodeAddress(address);
    if (coords) {
      await supabase
        .from('events')
        .update({ location_lat: coords.lat, location_lng: coords.lng })
        .eq('id', event.id);
    }
  } catch (error) {
    console.error('Failed to geocode:', event.id, error);
  }
}
```

---

## Testing Plan

### Test Case 1: Autocomplete + Radius Search

1. Open search modal
2. Select location → type "Bangalore" → select from autocomplete
3. Verify coordinates are shown
4. Set radius to 10 km
5. Tap Search
6. **Expected**: Events within 10 km of Bangalore center (12.9716, 77.5946) appear
7. **Expected**: Events outside 10 km are hidden
8. **Expected**: Events without coordinates fallback to text search (if "Bangalore" in location)

### Test Case 2: Current Location + Radius

1. Open search modal
2. Tap "Use Current Location"
3. Grant permission
4. Verify coordinates are set
5. Set radius to 5 km
6. Tap Search
7. **Expected**: Events within 5 km of current GPS location appear

### Test Case 3: Popular Location (No Coordinates)

1. Open search modal
2. Select location → pick "Mumbai" from popular locations (don't type)
3. Verify NO coordinates are set
4. Tap Search
5. **Expected**: Text-based search runs (events with "Mumbai" in location_name/address appear)
6. **Expected**: Radius slider should be disabled or show "Text search only"

### Test Case 4: Old Events Without Coordinates

1. Create test event without coordinates
2. Search for that event's location
3. **Expected**: Event appears if text matches location
4. **Expected**: Event does NOT appear in radius search (unless backfilled)

---

## Implementation Priority

1. **HIGH**: Fix radius search condition (Fix 1)
2. **HIGH**: Update location text search logic (Fix 2)
3. **MEDIUM**: Add coordinate display in UI (Fix 3)
4. **LOW**: Create backfill script (Fix 4)

---

## Code Changes Summary

### Files to Modify:

1. `/app/(tabs)/explore.tsx` - Fix filter logic
2. `/src/components/SearchModal.tsx` - Add coordinate display (optional)
3. `/scripts/backfill-event-coordinates.ts` - New file for backfill (optional)

### Lines to Change in explore.tsx:

- **Line 415**: Change condition from `searchLocation === 'Current Location'` to check `userCoordinates`
- **Line 359-412**: Update text search to run as fallback when coordinates missing
