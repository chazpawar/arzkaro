import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TextInput, Pressable, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { Spacing, BorderRadius } from '../constants/Styles';

interface SearchModalProps {
  visible: boolean;
  onClose: () => void;
  onSearch: (category: string, query: string, date?: Date) => void;
}

const CATEGORIES = [
  { id: 'events', label: 'Events', icon: 'calendar-outline' },
  { id: 'experiences', label: 'Experiences', icon: 'compass-outline' },
  { id: 'trips', label: 'Trips', icon: 'airplane-outline' },
];

const RECENT_SEARCHES = [
  { id: '1', label: 'New Delhi', subLabel: 'Any week • 2 guests', icon: 'location-outline' },
  { id: '2', label: 'Mumbai', subLabel: 'Weekend • 1 guest', icon: 'location-outline' },
];

export default function SearchModal({ visible, onClose, onSearch }: SearchModalProps) {
  const [activeCategory, setActiveCategory] = useState('events');
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = () => {
    onSearch(activeCategory, searchQuery);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={styles.container}>
        {/* Background Blur or Overlay */}
        <Pressable style={styles.overlay} onPress={onClose} />

        <View style={styles.contentWrapper}>
          <View style={styles.card}>
            {/* Header Categories */}
            <View style={styles.header}>
              <View style={styles.categoriesRow}>
                {CATEGORIES.map((cat) => (
                  <Pressable
                    key={cat.id}
                    onPress={() => setActiveCategory(cat.id)}
                    style={[
                      styles.categoryTab,
                      activeCategory === cat.id && styles.categoryTabActive,
                    ]}
                  >
                    <Ionicons
                      name={cat.icon as any}
                      size={20}
                      color={activeCategory === cat.id ? Colors.text : Colors.textSecondary}
                    />
                    <Text
                      style={[
                        styles.categoryText,
                        activeCategory === cat.id && styles.categoryTextActive,
                      ]}
                    >
                      {cat.label}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <Pressable onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close-circle" size={24} color={Colors.textSecondary} />
              </Pressable>
            </View>

            {/* Search Input Area */}
            <View style={styles.searchSection}>
              <Text style={styles.sectionTitle}>Where?</Text>
              <View style={styles.searchInputContainer}>
                <Ionicons name="search" size={20} color={Colors.text} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search destinations"
                  placeholderTextColor={Colors.textSecondary}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  autoFocus
                />
              </View>
            </View>

            {/* Recent Searches */}
            <View style={styles.recentSection}>
              <Text style={styles.recentTitle}>Recent searches</Text>
              {RECENT_SEARCHES.map((item) => (
                <Pressable
                  key={item.id}
                  style={styles.recentItem}
                  onPress={() => {
                    setSearchQuery(item.label);
                    // Optionally trigger search immediately
                  }}
                >
                  <View style={styles.recentIconBox}>
                    <Ionicons name={item.icon as any} size={22} color={Colors.text} />
                  </View>
                  <View>
                    <Text style={styles.recentLabel}>{item.label}</Text>
                    <Text style={styles.recentSubLabel}>{item.subLabel}</Text>
                  </View>
                </Pressable>
              ))}
            </View>

            {/* Bottom Actions */}
            <View style={styles.footer}>
              <Pressable onPress={() => setSearchQuery('')}>
                <Text style={styles.clearText}>Clear all</Text>
              </Pressable>

              <Pressable style={styles.searchButton} onPress={handleSearch}>
                <Ionicons name="search" size={20} color="#FFF" />
                <Text style={styles.searchButtonText}>Search</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-start',
  },
  contentWrapper: {
    marginTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: Spacing.md,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
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
    alignItems: 'flex-start',
    marginBottom: Spacing.lg,
  },
  categoriesRow: {
    flexDirection: 'row',
    gap: Spacing.lg,
    flex: 1,
    justifyContent: 'center',
  },
  categoryTab: {
    alignItems: 'center',
    gap: 4,
    opacity: 0.6,
  },
  categoryTabActive: {
    opacity: 1,
    borderBottomWidth: 2,
    borderBottomColor: Colors.text,
    paddingBottom: 4,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.text,
  },
  categoryTextActive: {
    fontWeight: '700',
  },
  closeButton: {
    position: 'absolute',
    right: 0,
    top: -4,
  },
  searchSection: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: Spacing.md,
    color: Colors.text,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    height: 50,
    gap: Spacing.sm,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.text,
    height: '100%',
  },
  recentSection: {
    marginBottom: Spacing.xl,
  },
  recentTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
    gap: Spacing.md,
  },
  recentIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: Colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recentLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  recentSubLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  clearText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
    textDecorationLine: 'underline',
  },
  searchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    gap: Spacing.xs,
  },
  searchButtonText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 16,
  },
});
