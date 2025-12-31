import Constants from 'expo-constants';

// Try multiple ways to get the API key
const GOOGLE_MAPS_API_KEY =
  Constants.expoConfig?.extra?.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ||
  (Constants.manifest as any)?.extra?.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ||
  process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ||
  '';

// Debug: Check if API key is loaded
if (!GOOGLE_MAPS_API_KEY) {
  console.warn('[GOOGLE_PLACES] API key not found in config');
  console.warn(
    '[GOOGLE_PLACES] Constants.expoConfig:',
    JSON.stringify(Constants.expoConfig?.extra, null, 2)
  );
} else {
  console.log('[GOOGLE_PLACES] API key loaded:', GOOGLE_MAPS_API_KEY.substring(0, 20) + '...');
}

export interface PlaceAutocompleteResult {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
}

export interface PlaceDetails {
  place_id: string;
  name: string;
  formatted_address: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  address_components: {
    long_name: string;
    short_name: string;
    types: string[];
  }[];
}

/**
 * Search for place autocomplete suggestions
 * @param input - Search query
 * @param types - Place types to filter (default: all types)
 * @param components - Country code to restrict results (e.g., 'country:in')
 * @returns Array of autocomplete predictions
 */
export async function searchPlaces(
  input: string,
  types = '',
  components = 'country:in'
): Promise<PlaceAutocompleteResult[]> {
  if (!input || input.trim().length === 0) {
    return [];
  }

  if (!GOOGLE_MAPS_API_KEY) {
    console.error('[GOOGLE_PLACES] API key not configured');
    throw new Error('Google Maps API key not configured');
  }

  try {
    const params = new URLSearchParams({
      input: input.trim(),
      key: GOOGLE_MAPS_API_KEY,
      components: components,
    });

    if (types) {
      params.append('types', types);
    }

    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/autocomplete/json?${params.toString()}`
    );

    const data = await response.json();

    if (data.status === 'OK') {
      return data.predictions || [];
    } else if (data.status === 'ZERO_RESULTS') {
      return [];
    } else {
      console.error('[GOOGLE_PLACES] API error:', data.status, data.error_message);
      throw new Error(data.error_message || `Google Places API error: ${data.status}`);
    }
  } catch (error) {
    console.error('[GOOGLE_PLACES] Search error:', error);
    throw error;
  }
}

/**
 * Get detailed information about a place including coordinates
 * @param placeId - Google Place ID from autocomplete
 * @returns Place details with coordinates
 */
export async function getPlaceDetails(placeId: string): Promise<PlaceDetails> {
  if (!GOOGLE_MAPS_API_KEY) {
    console.error('[GOOGLE_PLACES] API key not configured');
    throw new Error('Google Maps API key not configured');
  }

  try {
    const params = new URLSearchParams({
      place_id: placeId,
      key: GOOGLE_MAPS_API_KEY,
      fields: 'place_id,name,formatted_address,geometry,address_components',
    });

    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/details/json?${params.toString()}`
    );

    const data = await response.json();

    if (data.status === 'OK') {
      return data.result;
    } else {
      console.error('[GOOGLE_PLACES] Details API error:', data.status, data.error_message);
      throw new Error(data.error_message || `Google Places API error: ${data.status}`);
    }
  } catch (error) {
    console.error('[GOOGLE_PLACES] Get details error:', error);
    throw error;
  }
}

/**
 * Geocode an address to get coordinates
 * Useful for backfilling existing events with coordinates
 * @param address - Full address string
 * @returns Coordinates and formatted address
 */
export async function geocodeAddress(
  address: string
): Promise<{ lat: number; lng: number; formatted_address: string } | null> {
  if (!GOOGLE_MAPS_API_KEY) {
    console.error('[GOOGLE_PLACES] API key not configured');
    throw new Error('Google Maps API key not configured');
  }

  try {
    const params = new URLSearchParams({
      address: address.trim(),
      key: GOOGLE_MAPS_API_KEY,
      components: 'country:IN', // Restrict to India
    });

    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?${params.toString()}`
    );

    const data = await response.json();

    if (data.status === 'OK' && data.results.length > 0) {
      const result = data.results[0];
      return {
        lat: result.geometry.location.lat,
        lng: result.geometry.location.lng,
        formatted_address: result.formatted_address,
      };
    } else if (data.status === 'ZERO_RESULTS') {
      return null;
    } else {
      console.error('[GOOGLE_PLACES] Geocoding error:', data.status, data.error_message);
      throw new Error(data.error_message || `Geocoding error: ${data.status}`);
    }
  } catch (error) {
    console.error('[GOOGLE_PLACES] Geocode error:', error);
    throw error;
  }
}

/**
 * Reverse geocode coordinates to get address
 * @param lat - Latitude
 * @param lng - Longitude
 * @returns Address details
 */
export async function reverseGeocode(
  lat: number,
  lng: number
): Promise<{ formatted_address: string; city: string } | null> {
  if (!GOOGLE_MAPS_API_KEY) {
    console.error('[GOOGLE_PLACES] API key not configured');
    throw new Error('Google Maps API key not configured');
  }

  try {
    const params = new URLSearchParams({
      latlng: `${lat},${lng}`,
      key: GOOGLE_MAPS_API_KEY,
    });

    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?${params.toString()}`
    );

    const data = await response.json();

    if (data.status === 'OK' && data.results.length > 0) {
      const result = data.results[0];

      // Extract city name from address components
      const cityComponent = result.address_components.find(
        (component: any) =>
          component.types.includes('locality') ||
          component.types.includes('administrative_area_level_2')
      );

      return {
        formatted_address: result.formatted_address,
        city: cityComponent?.long_name || '',
      };
    } else if (data.status === 'ZERO_RESULTS') {
      return null;
    } else {
      console.error('[GOOGLE_PLACES] Reverse geocoding error:', data.status, data.error_message);
      throw new Error(data.error_message || `Reverse geocoding error: ${data.status}`);
    }
  } catch (error) {
    console.error('[GOOGLE_PLACES] Reverse geocode error:', error);
    throw error;
  }
}
