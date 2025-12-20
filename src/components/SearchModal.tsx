import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  Pressable,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { Colors } from '../constants/Colors';
import { Spacing, BorderRadius } from '../constants/Styles';

interface SearchModalProps {
  visible: boolean;
  onClose: () => void;
  onSearch: (location: string, query: string) => void;
  searchContext?: 'all' | 'experiences' | 'trips';
}

// Popular destinations for trips
const POPULAR_DESTINATIONS = [
  { id: '1', label: 'Goa', icon: 'airplane-outline' },
  { id: '2', label: 'Manali', icon: 'snow-outline' },
  { id: '3', label: 'Jaipur', icon: 'business-outline' },
  { id: '4', label: 'Rishikesh', icon: 'water-outline' },
  { id: '5', label: 'Udaipur', icon: 'boat-outline' },
  { id: '6', label: 'Leh-Ladakh', icon: 'snow-outline' },
];

// Nearby locations for experiences
const NEARBY_LOCATIONS = [
  { id: '1', label: 'All Locations', icon: 'globe-outline' },
  { id: '2', label: 'Indiranagar', icon: 'location-outline' },
  { id: '3', label: 'Koramangala', icon: 'location-outline' },
  { id: '4', label: 'Whitefield', icon: 'location-outline' },
  { id: '5', label: 'HSR Layout', icon: 'location-outline' },
  { id: '6', label: 'Marathahalli', icon: 'location-outline' },
];

// Suggested keywords
const SUGGESTED_KEYWORDS = [
  { id: '1', label: 'Cricket', icon: 'baseball-outline', category: 'Sport' },
  { id: '2', label: 'Dance', icon: 'musical-notes-outline', category: 'Arts' },
  { id: '3', label: 'Badminton', icon: 'tennisball-outline', category: 'Sport' },
  { id: '4', label: 'Yoga', icon: 'fitness-outline', category: 'Wellness' },
  { id: '5', label: 'Trekking', icon: 'trail-sign-outline', category: 'Adventure' },
  { id: '6', label: 'Photography', icon: 'camera-outline', category: 'Arts' },
  { id: '7', label: 'Comedy', icon: 'happy-outline', category: 'Entertainment' },
  { id: '8', label: 'Food', icon: 'restaurant-outline', category: 'Food & Drink' },
];

export default function SearchModal({
  visible,
  onClose,
  onSearch,
  searchContext = 'all',
}: SearchModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('All Locations');

  const locations = searchContext === 'trips' ? POPULAR_DESTINATIONS : NEARBY_LOCATIONS;

  const handleSearch = () => {
    onSearch(selectedLocation, searchQuery.trim());
    onClose();
  };

  const handleKeywordSelect = (keyword: string) => {
    setSearchQuery(keyword);
  };

  const handleLocationSelect = (location: string) => {
    setSelectedLocation(location);
  };

  const handleClear = () => {
    setSearchQuery('');
    setSelectedLocation('All Locations');
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.container}>
        <BlurView intensity={90} style={StyleSheet.absoluteFill} tint="light">
          <Pressable style={styles.overlay} onPress={onClose} />
        </BlurView>

        <View style={styles.contentContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Search Events</Text>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={28} color={Colors.text} />
            </Pressable>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Keyword Search Input */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>What are you looking for?</Text>
              <View style={styles.searchInputContainer}>
                <Ionicons name="search" size={20} color={Colors.textSecondary} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="e.g., Cricket, Dance, Manali, Food..."
                  placeholderTextColor={Colors.textSecondary}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  autoFocus
                  returnKeyType="search"
                  onSubmitEditing={handleSearch}
                />
                {searchQuery.length > 0 && (
                  <Pressable onPress={() => setSearchQuery('')}>
                    <Ionicons name="close-circle" size={20} color={Colors.textSecondary} />
                  </Pressable>
                )}
              </View>
              <Text style={styles.helperText}>
                Search by activity, destination, category, or any keyword
              </Text>
            </View>

            {/* Suggested Keywords */}
            {searchQuery.length === 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Suggested Keywords</Text>
                <View style={styles.keywordGrid}>
                  {SUGGESTED_KEYWORDS.map((keyword) => (
                    <Pressable
                      key={keyword.id}
                      style={styles.keywordChip}
                      onPress={() => handleKeywordSelect(keyword.label)}
                    >
                      <Ionicons name={keyword.icon as any} size={18} color={Colors.primary} />
                      <Text style={styles.keywordText}>{keyword.label}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}

            {/* Location Filter */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                {searchContext === 'trips' ? 'Select Destination' : 'Filter by Location'}
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.locationScroll}
              >
                {locations.map((location) => (
                  <Pressable
                    key={location.id}
                    style={[
                      styles.locationChip,
                      selectedLocation === location.label && styles.locationChipActive,
                    ]}
                    onPress={() => handleLocationSelect(location.label)}
                  >
                    <Ionicons
                      name={location.icon as any}
                      size={20}
                      color={
                        selectedLocation === location.label ? Colors.primary : Colors.textSecondary
                      }
                    />
                    <Text
                      style={[
                        styles.locationChipText,
                        selectedLocation === location.label && styles.locationChipTextActive,
                      ]}
                    >
                      {location.label}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>

            {/* Search Tips */}
            <View style={styles.section}>
              <View style={styles.tipCard}>
                <Ionicons name="bulb-outline" size={24} color={Colors.primary} />
                <View style={styles.tipContent}>
                  <Text style={styles.tipTitle}>Search Tips</Text>
                  <Text style={styles.tipText}>
                    • Type any keyword: sport name, activity, place, or category{'\n'}• Our system
                    will find all matching events{'\n'}• Combine keywords with location for better
                    results
                  </Text>
                </View>
              </View>
            </View>

            <View style={{ height: 100 }} />
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <Pressable onPress={handleClear} style={styles.clearButton}>
              <Text style={styles.clearText}>Clear All</Text>
            </Pressable>

            <Pressable style={styles.searchButton} onPress={handleSearch}>
              <Ionicons name="search" size={20} color="#FFF" />
              <Text style={styles.searchButtonText}>Search</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  overlay: {
    flex: 1,
  },
  contentContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.background,
    borderTopLeftRadius: BorderRadius.xxl,
    borderTopRightRadius: BorderRadius.xxl,
    maxHeight: '90%',
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
  },
  closeButton: {
    padding: Spacing.xs,
  },
  content: {
    flex: 1,
  },
  section: {
    padding: Spacing.lg,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    height: 56,
    gap: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.text,
    height: '100%',
  },
  helperText: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
    lineHeight: 18,
  },
  keywordGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  keywordChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  keywordText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text,
  },
  locationScroll: {
    gap: Spacing.sm,
    paddingRight: Spacing.lg,
  },
  locationChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    minWidth: 100,
  },
  locationChipActive: {
    backgroundColor: Colors.primaryLight || '#FFF0F3',
    borderColor: Colors.primary,
  },
  locationChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  locationChipTextActive: {
    color: Colors.primary,
    fontWeight: '600',
  },
  tipCard: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    gap: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  tipText: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 20,
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
    fontWeight: '600',
    color: Colors.text,
    textDecorationLine: 'underline',
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
    fontWeight: '700',
    fontSize: 16,
  },
});
