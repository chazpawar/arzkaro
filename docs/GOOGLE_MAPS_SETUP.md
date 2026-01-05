# Google Maps API Setup Guide

This guide will help you set up Google Maps & Places API for location autocomplete and coordinate capture in ArzKaro.

## 🎯 What This Enables

- **Location Autocomplete**: Search and select locations with address suggestions
- **Coordinate Capture**: Automatically get latitude/longitude for events
- **Radius-Based Search**: Find events within X km of user's location
- **Geocoding**: Convert addresses to coordinates (for existing events)

---

## 📋 Prerequisites

- Google Cloud account (free tier available)
- Credit card (required for Places API, but free quota is generous)
- ~10 minutes setup time

---

## 🚀 Setup Steps

### Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click **Select a project** → **New Project**
3. Enter project name: `ArzKaro` (or your preferred name)
4. Click **Create**

### Step 2: Enable Required APIs

1. In the Cloud Console, go to **APIs & Services** → **Library**
2. Search and enable the following APIs (click on each, then click **Enable**):
   - **Maps SDK for Android**
   - **Maps SDK for iOS**
   - **Places API** ⭐ (Required for autocomplete)
   - **Geocoding API** ⭐ (Required for address → coordinates)

### Step 3: Enable Billing

⚠️ **Important**: Places API and Geocoding API require billing to be enabled.

**Don't worry!** You get:

- **$200 free credit per month**
- **28,000 free autocomplete requests per month**
- **40,000 free geocoding requests per month**

For a typical app, this free quota is usually sufficient.

**To enable billing**:

1. Go to **Billing** in Cloud Console
2. Click **Link a billing account**
3. Add your credit card
4. Set up billing alerts (recommended: $50/month threshold)

### Step 4: Create API Key

1. Go to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **API Key**
3. Copy the API key (it will look like: `AIzaSyDxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`)

### Step 5: Restrict API Key (Important for Security!)

1. Click on the newly created API key to edit it
2. Under **API restrictions**:
   - Select **Restrict key**
   - Check only these APIs:
     - Maps SDK for Android
     - Maps SDK for iOS
     - Places API
     - Geocoding API

3. Under **Application restrictions**:
   - For **Development**: Select "None" (temporary)
   - For **Production**:
     - **Android**: Select "Android apps" and add package name: `com.arzkaro.app`
     - **iOS**: Select "iOS apps" and add bundle ID: `com.arzkaro.app`

4. Click **Save**

### Step 6: Add API Key to Your Project

1. Open `.env` file in your project root
2. Add the following line:

   ```bash
   EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyDxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```

   (Replace with your actual API key)

3. Save the file

### Step 7: Restart Your App

```bash
# Stop the current dev server (Ctrl+C)

# Clear cache and restart
pnpm start --clear

# Or rebuild if needed
pnpm run ios    # For iOS
pnpm run android  # For Android
```

---

## ✅ Verify Setup

1. Open your app
2. Navigate to "Create Event"
3. In the "Venue Name" field, start typing a location (e.g., "Bangalore")
4. You should see autocomplete suggestions appear
5. Select a location → coordinates will be captured automatically

---

## 📊 Monitor Usage

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services** → **Dashboard**
3. Click on **Places API** or **Geocoding API**
4. View request count and usage statistics

**Typical Usage**:

- Creating 1 event = 1 autocomplete search + 1 place details call ≈ ~2 requests
- 100 events created per month = ~200 requests (well within free tier)

---

## 💰 Cost Breakdown

### Free Tier (per month):

- **Places Autocomplete**: 28,000 requests FREE
- **Place Details**: 28,000 requests FREE
- **Geocoding**: 40,000 requests FREE

### After Free Tier:

- **Places Autocomplete**: $2.83 per 1,000 requests
- **Place Details**: $17 per 1,000 requests
- **Geocoding**: $5 per 1,000 requests

**For most apps, you'll never exceed the free tier!**

---

## 🔒 Security Best Practices

1. **Never commit API keys to Git**
   - ✅ API key is in `.env` (gitignored)
   - ❌ Don't hardcode in source files

2. **Restrict your API key**
   - Limit to specific APIs
   - Add application restrictions (bundle ID/package name)

3. **Set up billing alerts**
   - Get notified if usage exceeds expectations

4. **Monitor usage regularly**
   - Check dashboard weekly
   - Investigate any spikes

---

## 🐛 Troubleshooting

### "API key not configured" error

**Solution**:

1. Check `.env` file has `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=...`
2. Restart dev server: `pnpm start --clear`
3. Rebuild app if using custom dev client

### "This API project is not authorized to use this API"

**Solution**:

1. Go to Cloud Console → APIs & Services → Library
2. Find the API (Places/Geocoding) and click **Enable**
3. Wait 2-3 minutes for changes to propagate

### "REQUEST_DENIED" in API response

**Solution**:

1. Check billing is enabled
2. Verify API key restrictions don't block the API
3. Check API key is not expired/deleted

### No autocomplete suggestions appear

**Solution**:

1. Check internet connection
2. Open dev console and look for error logs
3. Verify API key is correct
4. Check Places API quota hasn't been exceeded

---

## 📱 Testing on Simulators

### iOS Simulator

```bash
pnpm run ios
```

- Autocomplete will work
- GPS location may not work (use preset locations in simulator)

### Android Emulator

```bash
pnpm run android
```

- Autocomplete will work
- GPS location requires Google Play Services in emulator

---

## 🎉 What's Next?

After setting up Google Maps API, you can:

1. ✅ **Create events with coordinates** - Autocomplete is now active
2. ✅ **Use radius-based search** - Find events within X km
3. 📊 **Backfill existing events** - Run geocoding script for old events
4. 🗺️ **Add map view** - Show event locations on a map (future enhancement)

---

## 📚 Additional Resources

- [Google Places API Documentation](https://developers.google.com/maps/documentation/places/web-service/overview)
- [Geocoding API Documentation](https://developers.google.com/maps/documentation/geocoding/overview)
- [API Key Best Practices](https://developers.google.com/maps/api-security-best-practices)
- [Pricing Calculator](https://mapsplatformtransition.withgoogle.com/calculator)

---

## 💡 Need Help?

If you encounter issues:

1. Check the troubleshooting section above
2. Review logs in Metro bundler
3. Check Google Cloud Console for API errors
4. Verify billing is enabled and quota isn't exceeded

---

**Setup complete! 🚀 Your app now has powerful location search capabilities!**
