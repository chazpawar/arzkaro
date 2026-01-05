# Location Search Debugging Guide

## Issue: Event in Hoshiarpur Not Showing in Search Results

### Symptoms:

- Event location shows "Hoshiarpur" in event detail page
- Searching for "Hoshiarpur" returns "No Results Found"
- Event appears in "Top Experiences" section (no filters applied)

### Possible Root Causes:

#### 1. **Database Data Mismatch**

The event's `location_name` in the database might not exactly match "Hoshiarpur":

- Could be `null` or empty string
- Could have extra whitespace: `" Hoshiarpur "` or `"Hoshiarpur "`
- Could have additional text: `"Hoshiarpur, Punjab"` or `"Near Hoshiarpur"`
- Could be stored in `location_address` instead of `location_name`

**How to Check**:

```sql
SELECT id, title, location_name, location_address, type
FROM events
WHERE title = 'Fw';  -- Replace with actual event title
```

#### 2. **Search Modal Not Passing Location Correctly**

If user typed "Hoshiarpur" manually, the SearchModal might not be passing it correctly.

**How to Check**:
Look for console logs:

```
[EXPLORE] Search triggered: { location: 'Hoshiarpur', query: '', radius: 10, coordinates: undefined }
```

#### 3. **Google Places API Failure**

If user selected from autocomplete but API failed to fetch coordinates:

- Alert would show: "Failed to get location coordinates"
- Location set WITHOUT coordinates
- Falls back to text search (which might not match)

**How to Check**:
Look for console logs:

```
[SEARCH_MODAL] Error fetching place details: <error>
```

#### 4. **Text Matching Logic Bug**

The includes() logic might have issues with:

- Empty strings matching everything: `"hoshiarpur".includes("") === true`
- Unicode characters or special encoding

**How to Check**:
Enhanced logging shows:

```
[EXPLORE] Event location check: {
  searchFor: 'hoshiarpur',
  eventLocationName: '<actual value>',
  eventLocationAddress: '<actual value>',
  eventTitle: 'Fw'
}
```

### Debugging Steps:

#### Step 1: Check Console Logs

Open Metro bundler and search for:

1. `[EXPLORE] Search triggered` - Confirms search parameters
2. `[EXPLORE] Text-only search active` - Confirms text search is running
3. `[EXPLORE] Event location check` - Shows actual event data being compared
4. `[EXPLORE] Match result` - Shows if match succeeded

#### Step 2: Check Database

```sql
-- Find the event
SELECT * FROM events WHERE title LIKE '%Fw%';

-- Check its location fields
SELECT
  id,
  title,
  type,
  location_name,
  location_address,
  location_lat,
  location_lng
FROM events
WHERE title = 'Fw';
```

#### Step 3: Test String Matching Manually

```javascript
const searchFor = 'hoshiarpur';
const eventLocation = '<value from database>';

const match = eventLocation.toLowerCase().trim() === searchFor;
console.log('Match:', match);
```

#### Step 4: Check if Event Has Coordinates

```sql
SELECT location_lat, location_lng FROM events WHERE title = 'Fw';
```

If coordinates are NULL and location_name doesn't match, event won't appear in results.

---

## Solutions:

### Solution 1: Fix Database Data (If Mismatch)

If `location_name` is incorrect or null:

```sql
UPDATE events
SET location_name = 'Hoshiarpur',
    location_lat = 31.4679,  -- Hoshiarpur coordinates
    location_lng = 75.9119
WHERE id = '<event_id>';
```

### Solution 2: Add "Hoshiarpur" to Popular Locations

If users frequently search for it:

**File**: `/src/components/SearchModal.tsx`

```typescript
const POPULAR_LOCATIONS = [
  'Bangalore',
  'Mumbai',
  'Delhi',
  'Goa',
  'Pune',
  'Hyderabad',
  'Chennai',
  'Kolkata',
  'Hoshiarpur', // ADD THIS
];
```

### Solution 3: Improve Text Matching (Handle Edge Cases)

**File**: `/app/(tabs)/explore.tsx`

Change the matching logic to handle empty strings:

```typescript
// Before
locationMatch =
  locationName.includes(locationLower) ||
  locationLower.includes(locationName) ||  // Bug: matches empty strings!
  ...

// After
locationMatch =
  (locationName && locationName.includes(locationLower)) ||
  (locationName && locationLower.includes(locationName)) ||
  ...
```

### Solution 4: Add Partial Matching

If event is "Hoshiarpur, Punjab" but user searches "Hoshiarpur":

The current logic already handles this with:

```typescript
locationName.split(',').some((part) => part.trim() === locationLower);
```

This splits "Hoshiarpur, Punjab" → ["Hoshiarpur", "Punjab"] and checks each part.

### Solution 5: Add Fuzzy Matching (Advanced)

For typos or similar names:

```bash
npm install string-similarity
```

```typescript
import { findBestMatch } from 'string-similarity';

const similarity = findBestMatch(locationLower, [locationName]);
if (similarity.bestMatch.rating > 0.8) {
  locationMatch = true;
}
```

---

## Quick Fix for Immediate Testing:

Add enhanced debugging to see exact values:

**File**: `/app/(tabs)/explore.tsx` (lines 442-460)

```typescript
// Log every event being checked
console.log('[EXPLORE_DEBUG] Checking event:', {
  title: event.title,
  type: event.type,
  location_name: event.location_name,
  location_address: event.location_address,
  searchLocation: searchLocation,
});
```

Then search for "Hoshiarpur" and check Metro logs to see why the event named "Fw" is not matching.

---

## Expected Console Output for Successful Match:

```
[EXPLORE] Search triggered: {
  location: 'Hoshiarpur',
  query: '',
  radius: 10,
  coordinates: undefined
}
[EXPLORE] Text-only search active: {
  searchingFor: 'hoshiarpur',
  eventTitle: 'Fw',
  eventType: 'experience'
}
[EXPLORE] Event location check: {
  searchFor: 'hoshiarpur',
  eventLocationName: 'hoshiarpur',
  eventLocationAddress: '',
  eventTitle: 'Fw'
}
[EXPLORE] Match result: {
  eventTitle: 'Fw',
  match: true
}
```

---

## Next Steps:

1. Run the app
2. Search for "Hoshiarpur"
3. Check Metro bundler console for the logs above
4. Share the console output to identify exact issue
5. Apply appropriate solution based on findings
