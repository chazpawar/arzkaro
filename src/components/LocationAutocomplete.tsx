import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { Fonts } from '../constants/Fonts';
import { Spacing, BorderRadius } from '../constants/Styles';
import {
  searchPlaces,
  getPlaceDetails,
  PlaceAutocompleteResult,
} from '../services/google-places-service';

interface LocationAutocompleteProps {
  label?: string;
  placeholder?: string;
  value: string;
  onLocationSelect: (location: {
    name: string;
    address: string;
    lat: number;
    lng: number;
    placeId: string;
  }) => void;
  error?: string;
}

export default function LocationAutocomplete({
  label = 'Location',
  placeholder = 'Search for a location...',
  value,
  onLocationSelect,
  error,
}: LocationAutocompleteProps) {
  const [query, setQuery] = useState(value);
  const [predictions, setPredictions] = useState<PlaceAutocompleteResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);

  // Sync internal state with external value prop
  useEffect(() => {
    setQuery(value);
    if (!value) {
      setSelectedLocation(null);
      setPredictions([]);
      setShowDropdown(false);
    }
  }, [value]);

  // Debounce search
  useEffect(() => {
    // Don't search if query is empty or too short
    if (!query || query.trim().length < 3) {
      setPredictions([]);
      setShowDropdown(false);
      setLoading(false);
      return;
    }

    // Don't search if this location is already selected
    if (selectedLocation === query) {
      setShowDropdown(false);
      return;
    }

    setLoading(true);
    const timeoutId = setTimeout(async () => {
      try {
        const results = await searchPlaces(query);
        setPredictions(results);
        setShowDropdown(results.length > 0);
      } catch (error) {
        console.error('[LocationAutocomplete] Search error:', error);
        setPredictions([]);
        setShowDropdown(false);
      } finally {
        setLoading(false);
      }
    }, 500); // 500ms debounce

    return () => {
      clearTimeout(timeoutId);
      setLoading(false);
    };
  }, [query, selectedLocation]);

  const handleSelectPlace = async (place: PlaceAutocompleteResult) => {
    setQuery(place.description);
    setSelectedLocation(place.description);
    setShowDropdown(false);
    setPredictions([]);
    Keyboard.dismiss();

    try {
      setLoading(true);
      const details = await getPlaceDetails(place.place_id);

      onLocationSelect({
        name: details.name || place.structured_formatting.main_text,
        address: details.formatted_address,
        lat: details.geometry.location.lat,
        lng: details.geometry.location.lng,
        placeId: place.place_id,
      });
    } catch (error) {
      console.error('[LocationAutocomplete] Get details error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setQuery('');
    setSelectedLocation(null);
    setPredictions([]);
    setShowDropdown(false);
  };

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}

      <View style={[styles.inputContainer, error && styles.inputContainerError]}>
        <Ionicons
          name="location"
          size={20}
          color={error ? Colors.error : Colors.textSecondary}
          style={styles.inputIcon}
        />

        <TextInput
          style={styles.input}
          placeholder={placeholder}
          value={query}
          onChangeText={(text) => {
            setQuery(text);
            setSelectedLocation(null);
          }}
          placeholderTextColor={Colors.textTertiary}
          autoCapitalize="words"
          autoCorrect={false}
        />

        {loading && <ActivityIndicator size="small" color={Colors.primary} />}

        {query.length > 0 && !loading && (
          <TouchableOpacity
            onPress={handleClear}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="close-circle" size={20} color={Colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {error && <Text style={styles.errorText}>{error}</Text>}

      {showDropdown && predictions.length > 0 && (
        <View style={styles.dropdownContainer}>
          {predictions.slice(0, 5).map((item) => (
            <TouchableOpacity
              key={item.place_id}
              style={styles.predictionItem}
              onPress={() => handleSelectPlace(item)}
              activeOpacity={0.7}
            >
              <Ionicons
                name="location"
                size={20}
                color={Colors.primary}
                style={styles.predictionIcon}
              />
              <View style={styles.predictionTextContainer}>
                <Text style={styles.predictionMainText} numberOfLines={1}>
                  {item.structured_formatting.main_text}
                </Text>
                <Text style={styles.predictionSecondaryText} numberOfLines={1}>
                  {item.structured_formatting.secondary_text}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {selectedLocation && (
        <View style={styles.selectedBadge}>
          <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
          <Text style={styles.selectedBadgeText}>Location confirmed</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.md,
    zIndex: 10,
  },
  label: {
    fontSize: 14,
    fontFamily: Fonts.semiBold,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  inputContainerError: {
    borderColor: Colors.error,
  },
  inputIcon: {
    marginRight: Spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontFamily: Fonts.regular,
    color: Colors.text,
    padding: 0,
  },
  errorText: {
    fontSize: 12,
    fontFamily: Fonts.regular,
    color: Colors.error,
    marginTop: Spacing.xs,
  },
  dropdownContainer: {
    marginTop: Spacing.xs,
    maxHeight: 300,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  predictionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  predictionIcon: {
    marginRight: Spacing.sm,
  },
  predictionTextContainer: {
    flex: 1,
  },
  predictionMainText: {
    fontSize: 16,
    fontFamily: Fonts.medium,
    color: Colors.text,
    marginBottom: 2,
  },
  predictionSecondaryText: {
    fontSize: 13,
    fontFamily: Fonts.regular,
    color: Colors.textSecondary,
  },
  selectedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.xs,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    backgroundColor: Colors.successLight || '#E8F5E9',
    borderRadius: BorderRadius.sm,
    alignSelf: 'flex-start',
  },
  selectedBadgeText: {
    fontSize: 12,
    fontFamily: Fonts.medium,
    color: Colors.success,
    marginLeft: Spacing.xs,
  },
});
