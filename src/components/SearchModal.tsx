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
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import Slider from '@react-native-community/slider';
import { Colors } from '../constants/Colors';
import { Fonts } from '../constants/Fonts';
import { Spacing, BorderRadius } from '../constants/Styles';

interface SearchModalProps {
  visible: boolean;
  onClose: () => void;
  onSearch: (location: string, query: string, radius: number) => void;
  searchContext?: 'all' | 'experiences' | 'trips';
}

// Suggested keywords
const SUGGESTED_KEYWORDS = [
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
];

// Popular locations
const POPULAR_LOCATIONS = [
  'Bangalore',
  'Mumbai',
  'Delhi',
  'Goa',
  'Pune',
  'Hyderabad',
  'Chennai',
  'Kolkata',
];

export default function SearchModal({
  visible,
  onClose,
  onSearch,
  searchContext: _searchContext = 'all',
}: SearchModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [selectedRadius, setSelectedRadius] = useState(10);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [locationSearchQuery, setLocationSearchQuery] = useState('');
  const [useCurrentLocation, setUseCurrentLocation] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchInputRef = useRef<TextInput>(null);
  const shouldKeepFocus = useRef(false);

  // Animated value for modal height
  const modalHeight = useRef(new Animated.Value(0.85)).current;

  // Reset to main search view when modal closes
  useEffect(() => {
    if (!visible) {
      setShowLocationPicker(false);
      setIsSearchFocused(false);
      // Reset height when modal closes
      modalHeight.setValue(0.85);
    }
  }, [visible, modalHeight]);

  // Animate modal height when search is focused
  useEffect(() => {
    if (!showLocationPicker) {
      Animated.spring(modalHeight, {
        toValue: isSearchFocused ? 1.0 : 0.85,
        useNativeDriver: false,
        friction: 8,
        tension: 40,
      }).start();
    }
  }, [isSearchFocused, showLocationPicker, modalHeight]);

  const handleSearch = () => {
    const location = useCurrentLocation ? 'Current Location' : selectedLocation;
    onSearch(location || 'All Locations', searchQuery.trim(), selectedRadius);
    onClose();
  };

  const handleKeywordSelect = (keyword: string) => {
    shouldKeepFocus.current = true;
    setSearchQuery(keyword);
  };

  const handleClear = () => {
    setSearchQuery('');
    setSelectedLocation('');
    setSelectedRadius(10);
    setUseCurrentLocation(false);
  };

  const handleCurrentLocation = () => {
    setUseCurrentLocation(true);
    setSelectedLocation('Current Location');
    setShowLocationPicker(false);
  };

  const handleSelectLocation = () => {
    shouldKeepFocus.current = true;
    setIsSearchFocused(false); // Reset search focus when going to location picker
    // Reset modal height to 85% before showing location picker
    Animated.spring(modalHeight, {
      toValue: 0.85,
      useNativeDriver: false,
      friction: 8,
      tension: 40,
    }).start(() => {
      setShowLocationPicker(true);
    });
    Keyboard.dismiss();
  };

  const handleLocationSearchSelect = (location: string) => {
    setSelectedLocation(location);
    setUseCurrentLocation(false);
    setShowLocationPicker(false);
    setLocationSearchQuery('');
  };

  const handleBackFromLocation = () => {
    setShowLocationPicker(false);
  };

  const filteredLocations = POPULAR_LOCATIONS.filter((loc) =>
    loc.toLowerCase().includes(locationSearchQuery.toLowerCase())
  );

  const handleDismissKeyboard = () => {
    Keyboard.dismiss();
    setIsSearchFocused(false);
  };

  // Interpolate height percentage
  const heightPercentage = modalHeight.interpolate({
    inputRange: [0.85, 1.0],
    outputRange: ['85%', '100%'],
  });

  // Interpolate border radius
  const borderRadius = modalHeight.interpolate({
    inputRange: [0.85, 1.0],
    outputRange: [BorderRadius.xxl, 0],
  });

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

        <Animated.View
          style={[
            styles.contentContainer,
            {
              maxHeight: heightPercentage,
              height: heightPercentage,
              borderTopLeftRadius: borderRadius,
              borderTopRightRadius: borderRadius,
            },
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
                keyboardShouldPersistTaps="handled"
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
                          setIsSearchFocused(true);
                        }}
                        onBlur={() => {
                          // Only blur if we're not keeping focus for other interactions
                          if (!shouldKeepFocus.current) {
                            setIsSearchFocused(false);
                          } else {
                            // Reset the flag and refocus
                            shouldKeepFocus.current = false;
                            setTimeout(() => {
                              searchInputRef.current?.focus();
                            }, 0);
                          }
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
                  <View style={styles.section}>
                    <Text style={styles.sectionTitleSmall}>Suggested Keywords</Text>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.keywordScroll}
                    >
                      {SUGGESTED_KEYWORDS.map((keyword, index) => (
                        <Pressable
                          key={index}
                          style={styles.keywordChip}
                          onPress={() => handleKeywordSelect(keyword)}
                        >
                          <Text style={styles.keywordText}>{keyword}</Text>
                        </Pressable>
                      ))}
                    </ScrollView>
                  </View>
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
                        <Ionicons name="location-outline" size={22} color={Colors.primary} />
                        <Text style={styles.locationSelectText}>
                          {selectedLocation || 'Select Location'}
                        </Text>
                      </View>
                      <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
                    </Pressable>
                  </View>
                </Pressable>

                {/* Radius Section - Slider */}
                <View
                  style={styles.section}
                  onStartShouldSetResponder={() => {
                    shouldKeepFocus.current = true;
                    return false;
                  }}
                >
                  <View style={styles.radiusHeader}>
                    <Text style={styles.sectionTitle}>Search Radius</Text>
                    <Text style={styles.radiusValue}>{selectedRadius} km</Text>
                  </View>
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
                </View>

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
                  <Pressable style={styles.locationOption} onPress={handleCurrentLocation}>
                    <View style={styles.locationOptionLeft}>
                      <Ionicons name="navigate" size={22} color={Colors.primary} />
                      <Text style={styles.locationOptionText}>Use Current Location</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
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
                    {locationSearchQuery.length > 0 && (
                      <Pressable onPress={() => setLocationSearchQuery('')}>
                        <Ionicons name="close-circle" size={20} color={Colors.textSecondary} />
                      </Pressable>
                    )}
                  </View>
                </View>

                {/* Popular Locations */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitleSmall}>Popular Locations</Text>
                  <View style={styles.locationsList}>
                    {filteredLocations.map((location, index) => (
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

                <View style={{ height: 100 }} />
              </ScrollView>
            </>
          )}
        </Animated.View>
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
});
