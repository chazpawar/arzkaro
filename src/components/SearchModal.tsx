import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  Pressable,
  Platform,
  ScrollView,
  Keyboard,
  LayoutAnimation,
  UIManager,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import Slider from '@react-native-community/slider';
import * as Location from 'expo-location';
import * as Device from 'expo-device';
import { Colors } from '../constants/Colors';
import { Spacing, BorderRadius } from '../constants/Styles';
import { Fonts } from '../constants/Fonts';
import {
  searchPlaces,
  getPlaceDetails,
  type PlaceAutocompleteResult,
} from '../services/google-places-service';

interface SearchModalProps {
  visible: boolean;
  onClose: () => void;
  onSearch: (
    location: string,
    query: string,
    radius: number,
    coordinates?: { latitude: number; longitude: number }
  ) => void;
  searchContext?: 'all' | 'experiences' | 'trips';
}

// Suggested keywords based on context
const SUGGESTED_KEYWORDS = {
  all: [
    'Cricket',
    'Dance',
    'Badminton',
    'Yoga',
    'Trekking',
    'Photography',
    'Comedy',
    'Food',
    'Music',
    'Fitness',
  ],
  experiences: [
    'Cricket',
    'Dance',
    'Badminton',
    'Yoga',
    'Photography',
    'Comedy',
    'Food',
    'Music',
    'Fitness',
    'Workshop',
  ],
  trips: [
    'Trekking',
    'Beach',
    'Mountains',
    'Adventure',
    'Road Trip',
    'Camping',
    'Backpacking',
    'Hill Station',
    'Wildlife',
    'Heritage',
  ],
};

// Popular locations (reduced list)
const POPULAR_LOCATIONS = ['Bangalore', 'Mumbai', 'Delhi', 'Goa', 'Pune'];

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function SearchModal({
  visible,
  onClose,
  onSearch,
  searchContext = 'all',
}: SearchModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [selectedRadius, setSelectedRadius] = useState(10);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [locationSearchQuery, setLocationSearchQuery] = useState('');
  const [useCurrentLocation, setUseCurrentLocation] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [userCoordinates, setUserCoordinates] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const searchInputRef = useRef<TextInput>(null);

  // Autocomplete state
  const [locationSuggestions, setLocationSuggestions] = useState<PlaceAutocompleteResult[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Get keywords based on context
  const keywords = SUGGESTED_KEYWORDS[searchContext];

  // Reset to main search view when modal closes
  useEffect(() => {
    if (!visible) {
      setShowLocationPicker(false);
      setIsSearchFocused(false);
      setLocationSuggestions([]);
      setLocationSearchQuery('');
    }
  }, [visible]);

  // Debounced location search using Google Places Autocomplete
  useEffect(() => {
    // Clear previous timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Clear suggestions if input is empty
    if (!locationSearchQuery || locationSearchQuery.trim().length === 0) {
      setLocationSuggestions([]);
      setIsLoadingSuggestions(false);
      return;
    }

    // Start loading
    setIsLoadingSuggestions(true);

    // Debounce search by 500ms
    debounceTimerRef.current = setTimeout(async () => {
      try {
        console.log('[SEARCH_MODAL] Searching for:', locationSearchQuery);
        const results = await searchPlaces(locationSearchQuery, '(cities)', 'country:in');
        console.log('[SEARCH_MODAL] Found', results.length, 'suggestions');
        setLocationSuggestions(results.slice(0, 5)); // Show max 5 results
      } catch (error) {
        console.error('[SEARCH_MODAL] Error fetching suggestions:', error);
        setLocationSuggestions([]);
      } finally {
        setIsLoadingSuggestions(false);
      }
    }, 500);

    // Cleanup
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [locationSearchQuery]);

  const handleSearch = () => {
    const location = useCurrentLocation ? 'Current Location' : selectedLocation || 'All Locations';
    onSearch(location, searchQuery.trim(), selectedRadius, userCoordinates || undefined);
    onClose();
  };

  const handleKeywordSelect = (keyword: string) => {
    setSearchQuery(keyword);
  };

  const handleClear = () => {
    setSearchQuery('');
    setSelectedLocation('');
    setSelectedRadius(10);
    setUseCurrentLocation(false);
    setUserCoordinates(null);
    setLocationSuggestions([]);
  };

  const handleCurrentLocation = async () => {
    try {
      setIsLoadingLocation(true);
      console.log('[SEARCH] Requesting location permissions...');

      // Request location permissions
      const { status } = await Location.requestForegroundPermissionsAsync();
      console.log('[SEARCH] Permission status:', status);

      if (status !== 'granted') {
        Alert.alert(
          'Permission Denied',
          'Location permission is required to find nearby events. Please enable location access in your device settings.',
          [{ text: 'OK' }]
        );
        setIsLoadingLocation(false);
        return;
      }

      console.log('[SEARCH] Getting current position...');
      // Get current position with timeout
      const location = await Promise.race([
        Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        }),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Location timeout')), 10000)
        ),
      ]);

      const { latitude, longitude } = location.coords;
      console.log('[SEARCH] Got current location:', {
        latitude: latitude.toFixed(4),
        longitude: longitude.toFixed(4),
      });

      // Store coordinates
      setUserCoordinates({ latitude, longitude });
      setUseCurrentLocation(true);
      setSelectedLocation('Current Location');
      setShowLocationPicker(false);

      // Show success feedback after a brief delay to allow UI to update
      setTimeout(() => {
        Alert.alert(
          'Location Set ✓',
          `Lat: ${latitude.toFixed(4)}, Lon: ${longitude.toFixed(4)}\n\nYou can now search for events within ${selectedRadius} km of this location.`,
          [{ text: 'Got it' }]
        );
      }, 100);
    } catch (error) {
      console.error('[SEARCH] Error getting location:', error);

      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const isSimulator = Platform.OS === 'ios' && !Device.isDevice;

      Alert.alert(
        'Location Error',
        isSimulator
          ? `Failed to get location (Simulator detected)\n\nTo test location on iOS Simulator:\n1. In Simulator menu: Features → Location → Custom Location\n2. Enter: Lat: 12.9716, Lon: 77.5946 (Bangalore)\n3. Try again\n\nError: ${errorMessage}`
          : `Failed to get your location: ${errorMessage}\n\nPlease ensure:\n- Location services are enabled\n- App has location permission\n- You're not in Airplane mode`,
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoadingLocation(false);
    }
  };

  const handleSelectLocation = () => {
    setShowLocationPicker(true);
    setIsSearchFocused(false); // Reset search focus when going to location picker
    Keyboard.dismiss();
  };

  const handleLocationSearchSelect = async (location: string, placeId?: string) => {
    try {
      setIsLoadingLocation(true);

      // If we have a placeId from autocomplete, fetch coordinates directly
      if (placeId) {
        console.log('[SEARCH_MODAL] Fetching details for place:', placeId);
        const details = await getPlaceDetails(placeId);
        const { lat, lng } = details.geometry.location;
        console.log('[SEARCH_MODAL] Got coordinates:', { lat, lng });
        setUserCoordinates({ latitude: lat, longitude: lng });
      } else {
        // For popular locations (no placeId), search and get first result
        console.log('[SEARCH_MODAL] Searching for popular location:', location);
        // Use empty types to search all types, filter will be done by country (India)
        const results = await searchPlaces(location, '');

        if (results.length > 0) {
          const firstResult = results[0];
          console.log('[SEARCH_MODAL] Found place:', firstResult.description);

          // Get coordinates for the first result
          const details = await getPlaceDetails(firstResult.place_id);
          const { lat, lng } = details.geometry.location;
          console.log('[SEARCH_MODAL] Got coordinates:', { lat, lng });
          setUserCoordinates({ latitude: lat, longitude: lng });
        } else {
          throw new Error('Location not found');
        }
      }

      setSelectedLocation(location);
      setUseCurrentLocation(false);
      setShowLocationPicker(false);
      setLocationSearchQuery('');
      setLocationSuggestions([]);
    } catch (error) {
      console.error('[SEARCH_MODAL] Error fetching place details:', error);
      Alert.alert('Error', 'Failed to get location coordinates. Please try again.');
    } finally {
      setIsLoadingLocation(false);
    }
  };

  const handleBackFromLocation = () => {
    setShowLocationPicker(false);
  };

  const handleDismissKeyboard = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    Keyboard.dismiss();
    setIsSearchFocused(false);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <Pressable
        style={styles.modalWrapper}
        onPress={isSearchFocused ? handleDismissKeyboard : onClose}
      >
        <BlurView
          intensity={90}
          style={StyleSheet.absoluteFill}
          tint="light"
          pointerEvents="none"
        />

        <View
          style={[
            styles.contentContainer,
            isSearchFocused && !showLocationPicker && styles.contentContainerFullscreen,
          ]}
        >
          {!showLocationPicker ? (
            <>
              {/* Main Search View */}
              {!isSearchFocused && (
                <Pressable onPress={isSearchFocused ? handleDismissKeyboard : undefined}>
                  <View style={styles.header}>
                    <Text style={styles.headerTitle}>Search</Text>
                    {!isSearchFocused && (
                      <Pressable onPress={onClose} style={styles.closeButton}>
                        <Ionicons name="close" size={28} color={Colors.text} />
                      </Pressable>
                    )}
                  </View>
                </Pressable>
              )}

              <ScrollView
                style={styles.content}
                showsVerticalScrollIndicator={false}
                scrollEnabled={!isSearchFocused}
              >
                {/* Search Input */}
                <Pressable
                  style={[styles.section, isSearchFocused && styles.sectionFullscreen]}
                  onPress={isSearchFocused ? handleDismissKeyboard : undefined}
                >
                  {!isSearchFocused && (
                    <Text style={styles.sectionTitle}>What are you looking for?</Text>
                  )}
                  <Pressable onPress={(e) => e.stopPropagation()}>
                    <View style={styles.searchInputContainer}>
                      <Pressable onPress={isSearchFocused ? handleDismissKeyboard : undefined}>
                        <Ionicons
                          name={isSearchFocused ? 'arrow-back' : 'search'}
                          size={20}
                          color={Colors.textSecondary}
                        />
                      </Pressable>
                      <TextInput
                        ref={searchInputRef}
                        style={styles.searchInput}
                        placeholder="Type activity, event name..."
                        placeholderTextColor={Colors.textSecondary}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        returnKeyType="search"
                        onSubmitEditing={handleSearch}
                        onFocus={() => {
                          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                          setIsSearchFocused(true);
                        }}
                        onBlur={() => {
                          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                          setIsSearchFocused(false);
                        }}
                      />
                      {searchQuery.length > 0 && (
                        <Pressable onPress={() => setSearchQuery('')}>
                          <Ionicons name="close-circle" size={20} color={Colors.textSecondary} />
                        </Pressable>
                      )}
                    </View>
                  </Pressable>
                </Pressable>

                {/* Suggested Keywords */}
                {searchQuery.length === 0 && (
                  <Pressable onPress={isSearchFocused ? handleDismissKeyboard : undefined}>
                    <View style={styles.section}>
                      <Text style={styles.sectionTitleSmall}>Suggested Keywords</Text>
                      <Pressable onPress={(e) => e.stopPropagation()}>
                        <ScrollView
                          horizontal
                          showsHorizontalScrollIndicator={false}
                          contentContainerStyle={styles.keywordScroll}
                        >
                          {keywords.map((keyword, index) => (
                            <Pressable
                              key={index}
                              style={styles.keywordChip}
                              onPress={() => handleKeywordSelect(keyword)}
                            >
                              <Text style={styles.keywordText}>{keyword}</Text>
                            </Pressable>
                          ))}
                        </ScrollView>
                      </Pressable>
                    </View>
                  </Pressable>
                )}

                {/* Location Section */}
                <Pressable onPress={isSearchFocused ? handleDismissKeyboard : undefined}>
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Location</Text>
                    <Pressable
                      style={styles.locationSelectButton}
                      onPress={(e) => {
                        e.stopPropagation();
                        handleSelectLocation();
                      }}
                    >
                      <View style={styles.locationSelectLeft}>
                        <Ionicons
                          name={useCurrentLocation ? 'navigate' : 'location-outline'}
                          size={22}
                          color={Colors.primary}
                        />
                        <Text style={styles.locationSelectText}>
                          {selectedLocation || 'Select Location'}
                        </Text>
                      </View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        {selectedLocation ? (
                          <>
                            <Pressable
                              onPress={(e) => {
                                e.stopPropagation();
                                setSelectedLocation('');
                                setUseCurrentLocation(false);
                                setUserCoordinates(null);
                              }}
                              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            >
                              <Ionicons
                                name="close-circle"
                                size={22}
                                color={Colors.textSecondary}
                              />
                            </Pressable>
                            <Ionicons name="checkmark-circle" size={22} color={Colors.primary} />
                          </>
                        ) : (
                          <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
                        )}
                      </View>
                    </Pressable>

                    {/* Show search mode indicator */}
                    {selectedLocation && (
                      <View style={styles.searchModeHint}>
                        <Ionicons
                          name={userCoordinates ? 'radio-button-on' : 'text-outline'}
                          size={16}
                          color={userCoordinates ? Colors.primary : Colors.textSecondary}
                        />
                        <Text style={styles.searchModeText}>
                          {userCoordinates
                            ? `Radius search (${selectedRadius} km from ${selectedLocation})`
                            : 'Text search (name matching only)'}
                        </Text>
                      </View>
                    )}
                  </View>
                </Pressable>

                {/* Radius Section - Show when any location is selected */}
                {selectedLocation && (
                  <Pressable onPress={isSearchFocused ? handleDismissKeyboard : undefined}>
                    <View style={styles.section}>
                      <View style={styles.radiusHeader}>
                        <Text style={styles.sectionTitle}>Search Radius</Text>
                        <Text style={styles.radiusValue}>{selectedRadius} km</Text>
                      </View>
                      <Pressable onPress={(e) => e.stopPropagation()}>
                        <Slider
                          style={styles.slider}
                          minimumValue={1}
                          maximumValue={50}
                          step={1}
                          value={selectedRadius}
                          onValueChange={setSelectedRadius}
                          minimumTrackTintColor={Colors.primary}
                          maximumTrackTintColor={Colors.border}
                          thumbTintColor={Colors.primary}
                        />
                        <View style={styles.sliderLabels}>
                          <Text style={styles.sliderLabel}>1 km</Text>
                          <Text style={styles.sliderLabel}>50 km</Text>
                        </View>
                      </Pressable>
                    </View>
                  </Pressable>
                )}

                <View style={{ height: 100 }} />
              </ScrollView>

              {/* Footer */}
              <View style={styles.footer}>
                <Pressable onPress={handleClear} style={styles.clearButton}>
                  <Text style={styles.clearText}>Clear</Text>
                </Pressable>

                <Pressable style={styles.searchButton} onPress={handleSearch}>
                  <Ionicons name="search" size={20} color="#FFF" />
                  <Text style={styles.searchButtonText}>Search</Text>
                </Pressable>
              </View>
            </>
          ) : (
            <>
              {/* Location Selection View */}
              <View style={styles.header}>
                <View style={styles.headerLeft}>
                  <Pressable onPress={handleBackFromLocation} style={styles.backButton}>
                    <Ionicons name="chevron-back" size={28} color={Colors.text} />
                  </Pressable>
                  <Text style={styles.headerTitle}>Select Location</Text>
                </View>
              </View>

              <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Current Location Option */}
                <View style={styles.section}>
                  <Pressable
                    style={[
                      styles.locationOption,
                      isLoadingLocation && styles.locationOptionDisabled,
                    ]}
                    onPress={handleCurrentLocation}
                    disabled={isLoadingLocation}
                  >
                    <View style={styles.locationOptionLeft}>
                      {isLoadingLocation ? (
                        <ActivityIndicator size="small" color={Colors.primary} />
                      ) : (
                        <Ionicons name="navigate" size={22} color={Colors.primary} />
                      )}
                      <Text style={styles.locationOptionText}>
                        {isLoadingLocation ? 'Getting location...' : 'Use Current Location'}
                      </Text>
                    </View>
                    {!isLoadingLocation && (
                      <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
                    )}
                  </Pressable>
                </View>

                {/* Search Location */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitleSmall}>Search Location</Text>
                  <View style={styles.searchInputContainer}>
                    <Ionicons name="search" size={20} color={Colors.textSecondary} />
                    <TextInput
                      style={styles.searchInput}
                      placeholder="Search for a city or area..."
                      placeholderTextColor={Colors.textSecondary}
                      value={locationSearchQuery}
                      onChangeText={setLocationSearchQuery}
                      autoFocus
                    />
                    {isLoadingSuggestions && (
                      <ActivityIndicator size="small" color={Colors.primary} />
                    )}
                    {locationSearchQuery.length > 0 && !isLoadingSuggestions && (
                      <Pressable onPress={() => setLocationSearchQuery('')}>
                        <Ionicons name="close-circle" size={20} color={Colors.textSecondary} />
                      </Pressable>
                    )}
                  </View>
                </View>

                {/* Autocomplete Suggestions - Show when typing */}
                {locationSearchQuery.length > 0 && locationSuggestions.length > 0 && (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitleSmall}>Suggestions</Text>
                    <View style={styles.locationsList}>
                      {locationSuggestions.map((suggestion) => (
                        <Pressable
                          key={suggestion.place_id}
                          style={styles.locationItem}
                          onPress={() =>
                            handleLocationSearchSelect(
                              suggestion.structured_formatting.main_text,
                              suggestion.place_id
                            )
                          }
                        >
                          <Ionicons name="location" size={20} color={Colors.primary} />
                          <View style={styles.locationItemTextContainer}>
                            <Text style={styles.locationItemText}>
                              {suggestion.structured_formatting.main_text}
                            </Text>
                            <Text style={styles.locationItemSecondary}>
                              {suggestion.structured_formatting.secondary_text}
                            </Text>
                          </View>
                          <Ionicons name="chevron-forward" size={18} color={Colors.textSecondary} />
                        </Pressable>
                      ))}
                    </View>
                  </View>
                )}

                {/* Popular Locations - Show when not typing */}
                {locationSearchQuery.length === 0 && (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitleSmall}>Popular Locations</Text>
                    <View style={styles.locationsList}>
                      {POPULAR_LOCATIONS.map((location, index) => (
                        <Pressable
                          key={index}
                          style={styles.locationItem}
                          onPress={() => handleLocationSearchSelect(location)}
                        >
                          <Ionicons name="location" size={20} color={Colors.primary} />
                          <Text style={styles.locationItemText}>{location}</Text>
                          <Ionicons name="chevron-forward" size={18} color={Colors.textSecondary} />
                        </Pressable>
                      ))}
                    </View>
                  </View>
                )}

                <View style={{ height: 100 }} />
              </ScrollView>
            </>
          )}
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalWrapper: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  contentContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.background,
    borderTopLeftRadius: BorderRadius.xxl,
    borderTopRightRadius: BorderRadius.xxl,
    height: '85%',
    top: undefined,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  contentContainerFullscreen: {
    maxHeight: '100%',
    height: '100%',
    top: 0,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  backButton: {
    padding: Spacing.xs,
    marginLeft: -Spacing.xs,
  },
  headerTitle: {
    fontSize: 22,
    fontFamily: Fonts.bold,
    color: Colors.text,
  },
  closeButton: {
    padding: Spacing.xs,
  },
  content: {
    flex: 1,
  },
  section: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
  },
  sectionFullscreen: {
    paddingTop: Spacing.xxl + 20, // Extra spacing from top when fullscreen
  },
  sectionTitle: {
    fontSize: 17,
    fontFamily: Fonts.semiBold,
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  sectionTitleSmall: {
    fontSize: 14,
    fontFamily: Fonts.semiBold,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    height: 52,
    gap: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.text,
    height: '100%',
  },
  keywordScroll: {
    gap: Spacing.sm,
    paddingRight: Spacing.lg,
  },
  keywordChip: {
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  keywordText: {
    fontSize: 13,
    fontFamily: Fonts.medium,
    color: Colors.text,
  },
  locationSelectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    height: 56,
  },
  locationSelectLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  locationSelectText: {
    fontSize: 16,
    fontFamily: Fonts.medium,
    color: Colors.text,
  },
  radiusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  radiusValue: {
    fontSize: 16,
    fontFamily: Fonts.bold,
    color: Colors.primary,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xs,
  },
  sliderLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  locationOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    height: 56,
  },
  locationOptionDisabled: {
    opacity: 0.6,
  },
  locationOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  locationOptionText: {
    fontSize: 16,
    fontFamily: Fonts.medium,
    color: Colors.text,
  },
  locationsList: {
    gap: Spacing.sm,
  },
  locationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  locationItemText: {
    flex: 1,
    fontSize: 16,
    fontFamily: Fonts.medium,
    color: Colors.text,
  },
  locationItemTextContainer: {
    flex: 1,
    gap: 4,
  },
  locationItemSecondary: {
    fontSize: 13,
    fontFamily: Fonts.regular,
    color: Colors.textSecondary,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.background,
  },
  clearButton: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  clearText: {
    fontSize: 16,
    fontFamily: Fonts.semiBold,
    color: Colors.textSecondary,
  },
  searchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.full,
    gap: Spacing.xs,
    ...Platform.select({
      ios: {
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  searchButtonText: {
    color: '#FFF',
    fontFamily: Fonts.bold,
    fontSize: 16,
  },
  searchModeHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.sm,
    paddingHorizontal: Spacing.sm,
  },
  searchModeText: {
    fontSize: 13,
    fontFamily: Fonts.regular,
    color: Colors.textSecondary,
    flex: 1,
  },
});
