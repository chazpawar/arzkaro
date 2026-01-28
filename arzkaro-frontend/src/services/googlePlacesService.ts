/// <reference types="google.maps" />

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
 * Search for place autocomplete suggestions using the Google Maps JavaScript SDK
 */
export async function searchPlaces(
  input: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _types: string[] = [],
  components: string[] = ['in']
): Promise<PlaceAutocompleteResult[]> {
  if (!input || input.trim().length === 0) {
    return [];
  }

  // Ensure Google Maps is loaded
  if (typeof window === 'undefined' || !window.google?.maps?.places?.AutocompleteSuggestion) {
    console.warn('[GOOGLE_PLACES] Google Maps SDK not loaded or New Places API not available');
    return [];
  }

  try {
    const { suggestions } = await window.google.maps.places.AutocompleteSuggestion.fetchAutocompleteSuggestions({
      input: input.trim(),
      includedRegionCodes: components,
    });

    if (!suggestions) return [];

    return suggestions.map(suggestion => {
      const p = suggestion.placePrediction;
      if (!p) return null;
      return {
        place_id: p.placeId || '',
        description: p.text?.toString() || '',
        structured_formatting: {
          main_text: p.mainText?.toString() || p.text?.toString() || '',
          secondary_text: p.secondaryText?.toString() || ''
        }
      };
    }).filter((item): item is PlaceAutocompleteResult => item !== null);
  } catch (error) {
    console.error('[GOOGLE_PLACES] Search error:', error);
    return [];
  }
}

/**
 * Get detailed information about a place including coordinates using the Google Maps JavaScript SDK
 */
export async function getPlaceDetails(placeId: string): Promise<PlaceDetails | null> {
  if (typeof window === 'undefined' || !window.google?.maps?.places?.Place) {
    console.warn('[GOOGLE_PLACES] Google Maps SDK not loaded');
    return null;
  }

  try {
    const place = new window.google.maps.places.Place({ id: placeId });
    await place.fetchFields({
      fields: ['id', 'displayName', 'formattedAddress', 'location']
    });

    if (place.location) {
      return {
        place_id: place.id,
        name: place.displayName || '',
        formatted_address: place.formattedAddress || '',
        geometry: {
          location: {
            lat: place.location.lat(),
            lng: place.location.lng()
          }
        }
      };
    }
    return null;
  } catch (error) {
    console.error('[GOOGLE_PLACES] Get details error:', error);
    return null;
  }
}
