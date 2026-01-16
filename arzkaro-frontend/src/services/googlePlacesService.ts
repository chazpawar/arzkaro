const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

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
}

/**
 * Search for place autocomplete suggestions
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
    return [];
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

    // Use a CORS proxy if needed, but Google Maps API usually allows client-side fetch from authorized domains.
    // For local dev, we might need to handle CORS if the API key isn't restricted properly.
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
      return [];
    }
  } catch (error) {
    console.error('[GOOGLE_PLACES] Search error:', error);
    return [];
  }
}

/**
 * Get detailed information about a place including coordinates
 */
export async function getPlaceDetails(placeId: string): Promise<PlaceDetails | null> {
  if (!GOOGLE_MAPS_API_KEY) {
    console.error('[GOOGLE_PLACES] API key not configured');
    return null;
  }

  try {
    const params = new URLSearchParams({
      place_id: placeId,
      key: GOOGLE_MAPS_API_KEY,
      fields: 'place_id,name,formatted_address,geometry',
    });

    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/details/json?${params.toString()}`
    );

    const data = await response.json();

    if (data.status === 'OK') {
      return data.result;
    } else {
      console.error('[GOOGLE_PLACES] Details API error:', data.status, data.error_message);
      return null;
    }
  } catch (error) {
    console.error('[GOOGLE_PLACES] Get details error:', error);
    return null;
  }
}
