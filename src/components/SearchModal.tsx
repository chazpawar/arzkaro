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
import Animated, { FadeIn, FadeOut, Layout } from 'react-native-reanimated';
import { Colors } from '../constants/Colors';
import { Spacing, BorderRadius } from '../constants/Styles';

interface SearchModalProps {
  visible: boolean;
  onClose: () => void;
  onSearch: (category: string, query: string, date?: Date) => void;
}

const RECENT_SEARCHES = [
  { id: '1', label: 'New Delhi', subLabel: '8–9 Dec • 16 guests', icon: 'business-outline' },
];

const SUGGESTED_DESTINATIONS = [
  { id: '1', label: 'Nearby', subLabel: "Find what's around you", icon: 'navigate-outline' },
  {
    id: '2',
    label: 'Noida, Uttar Pradesh',
    subLabel: 'Guests interested in New Delhi also looked here',
    icon: 'business-outline',
  },
];

export default function SearchModal({ visible, onClose, onSearch }: SearchModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedSection, setExpandedSection] = useState<'where' | 'when' | 'who'>('where');

  const handleSearch = () => {
    onSearch('all', searchQuery);
    onClose();
  };

  const renderWhereSection = () => {
    if (expandedSection !== 'where') {
      return (
        <Pressable onPress={() => setExpandedSection('where')}>
          <Animated.View 
            layout={Layout.springify()} 
            entering={FadeIn} 
            exiting={FadeOut}
            style={styles.collapsedCard}
          >
            <Text style={styles.collapsedLabel}>Where</Text>
            <Text style={styles.collapsedValue}>{searchQuery || 'Add destination'}</Text>
          </Animated.View>
        </Pressable>
      );
    }

    return (
      <Animated.View 
        layout={Layout.springify()} 
        entering={FadeIn} 
        exiting={FadeOut}
        style={styles.expandedCard}
      >
        <Text style={styles.cardTitle}>Where?</Text>
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

        <ScrollView style={styles.resultsList} showsVerticalScrollIndicator={false}>
          <Text style={styles.sectionHeader}>Recent searches</Text>
          {RECENT_SEARCHES.map((item) => (
            <Pressable
              key={item.id}
              style={styles.resultItem}
              onPress={() => setSearchQuery(item.label)}
            >
              <View style={styles.iconBox}>
                <Ionicons name={item.icon as any} size={24} color={Colors.text} />
              </View>
              <View style={styles.resultContent}>
                <Text style={styles.resultLabel}>{item.label}</Text>
                <Text style={styles.resultSubLabel}>{item.subLabel}</Text>
              </View>
            </Pressable>
          ))}

          <Text style={[styles.sectionHeader, { marginTop: Spacing.lg }]}>
            Suggested destinations
          </Text>
          {SUGGESTED_DESTINATIONS.map((item) => (
            <Pressable
              key={item.id}
              style={styles.resultItem}
              onPress={() => setSearchQuery(item.label)}
            >
              <View style={[styles.iconBox, item.id === '1' && styles.blueIconBox]}>
                <Ionicons
                  name={item.icon as any}
                  size={24}
                  color={item.id === '1' ? '#3B82F6' : Colors.text}
                />
              </View>
              <View style={styles.resultContent}>
                <Text style={styles.resultLabel}>{item.label}</Text>
                <Text style={styles.resultSubLabel}>{item.subLabel}</Text>
              </View>
            </Pressable>
          ))}
        </ScrollView>
      </Animated.View>
    );
  };

  const renderCollapsedSection = (label: string, actionText: string, section: 'when' | 'who') => {
    const isExpanded = expandedSection === section;

    if (isExpanded) {
        return (
             <Animated.View 
                layout={Layout.springify()} 
                entering={FadeIn} 
                exiting={FadeOut}
                style={styles.expandedCard}
              >
                 <Text style={styles.cardTitle}>{label}?</Text>
                 <View style={{height: 200, justifyContent: 'center', alignItems: 'center'}}>
                     <Text style={{color: Colors.textSecondary}}>Placeholder for {label} selection</Text>
                 </View>
            </Animated.View>
        )
    }

    return (
      <Pressable onPress={() => setExpandedSection(section)}>
        <Animated.View 
            layout={Layout.springify()} 
            entering={FadeIn} 
            exiting={FadeOut}
            style={styles.collapsedCard}
        >
          <Text style={styles.collapsedLabel}>{label}</Text>
          <Text style={styles.collapsedAction}>{actionText}</Text>
        </Animated.View>
      </Pressable>
    );
  };

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={styles.container}>
        <BlurView intensity={90} style={StyleSheet.absoluteFill} tint="light">
          <Pressable style={styles.overlay} onPress={onClose} />
        </BlurView>

        <View style={styles.contentContainer}>
          <View style={styles.cardStack}>
            {renderWhereSection()}
            {renderCollapsedSection('When', 'Add dates', 'when')}
            {renderCollapsedSection('Who', 'Add guests', 'who')}
          </View>

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
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: Spacing.md,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  contentContainer: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  cardStack: {
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  // Expanded Card Styles
  expandedCard: {
    backgroundColor: '#fff',
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
      android: {
        elevation: 5,
      },
    }),
    height: 400, // Fixed height for the expanded card
    overflow: 'hidden',
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: Spacing.lg,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    height: 50,
    marginBottom: Spacing.lg,
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
    marginLeft: Spacing.sm,
    height: '100%',
  },
  resultsList: {
    flex: 1,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  blueIconBox: {
    backgroundColor: '#EFF6FF',
  },
  resultContent: {
    flex: 1,
  },
  resultLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 2,
  },
  resultSubLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  // Collapsed Card Styles
  collapsedCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: BorderRadius.lg, // Medium rounding
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  collapsedLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  collapsedValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  collapsedAction: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
  },
  // Footer Styles
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
  },
  clearText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    textDecorationLine: 'underline',
    marginTop: 4,
  },
  searchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF385C',
    paddingVertical: 12,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.lg,
    gap: Spacing.xs,
  },
  searchButtonText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 16,
  },
});
