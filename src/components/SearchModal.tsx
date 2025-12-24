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
  Animated,
  Dimensions,
} from 'react-native';
import { Calendar, DateData } from 'react-native-calendars';

import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { Spacing, BorderRadius } from '../constants/Styles';
import { useEvents } from '../hooks/use-events';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface SearchModalProps {
  visible: boolean;
  onClose: () => void;
  onSearch: (location: string, query: string, radius: number) => void;
  searchContext?: 'all' | 'experiences' | 'trips';
}

export default function SearchModal({
  visible,
  onClose,
  onSearch,
  searchContext: _searchContext = 'all',
}: SearchModalProps) {
  // Fetch events to extract unique locations
  const { events } = useEvents();

  // Extract unique locations from events
  const suggestedDestinations = React.useMemo(() => {
    const iconColors = ['#EF4444', '#6366F1', '#8B5CF6', '#10B981', '#F59E0B', '#3B82F6'];
    const iconBgColors = ['#FEF2F2', '#EEF2FF', '#F5F3FF', '#ECFDF5', '#FFFBEB', '#EFF6FF'];
    const icons = ['business', 'terrain', 'umbrella', 'beach-access', 'location'];

    // Always include "Nearby" as first option
    const destinations = [
      {
        id: 'nearby',
        label: 'Nearby',
        sublabel: "Find what's around you",
        icon: 'navigate',
        iconColor: '#3B82F6',
        iconBg: '#EFF6FF',
        isLocation: false,
      },
    ];

    // Extract unique locations from events
    const locationSet = new Set<string>();

    events.forEach((event) => {
      // For trips, use departure_location
      if (event.type === 'trip' && event.departure_location) {
        locationSet.add(event.departure_location);
      }
      // For events/experiences, use location_name
      else if (event.location_name) {
        locationSet.add(event.location_name);
      }
    });

    // Convert to array and create destination objects
    Array.from(locationSet)
      .slice(0, 5) // Limit to 5 locations
      .forEach((location, index) => {
        destinations.push({
          id: `location-${index}`,
          label: location,
          sublabel: 'Event location',
          icon: icons[index % icons.length],
          iconColor: iconColors[index % iconColors.length],
          iconBg: iconBgColors[index % iconBgColors.length],
          isLocation: true,
        });
      });

    return destinations;
  }, [events]);
  // Animation values
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Search state
  const [step, setStep] = useState<'collapsed' | 'expanded'>('collapsed');
  const [activeSection, setActiveSection] = useState<'where' | 'when' | 'who'>('where');
  const [searchQuery, setSearchQuery] = useState('');

  // Selection state
  const [where, setWhere] = useState('');

  // When state
  const [dateCategory, setDateCategory] = useState<'dates' | 'flexible'>('dates');
  const [selectedDateOption, setSelectedDateOption] = useState('Any week');
  const [selectedStartDate, setSelectedStartDate] = useState<string>('');
  const [selectedEndDate, setSelectedEndDate] = useState<string>('');

  // Generate marked dates for range selection
  const getMarkedDates = () => {
    const marked: any = {};

    if (selectedStartDate) {
      marked[selectedStartDate] = { startingDay: true, color: Colors.primary, textColor: 'white' };

      if (selectedEndDate) {
        marked[selectedEndDate] = { endingDay: true, color: Colors.primary, textColor: 'white' };

        // Fill dates in between
        const currentDate = new Date(selectedStartDate);
        const end = new Date(selectedEndDate);

        while (currentDate < end) {
          currentDate.setDate(currentDate.getDate() + 1);
          const dateString = currentDate.toISOString().split('T')[0];

          if (dateString < selectedEndDate) {
            marked[dateString] = { color: Colors.primaryLight, textColor: 'white' };
          }
        }
      } else {
        marked[selectedStartDate] = { selected: true, color: Colors.primary, textColor: 'white' };
      }
    }

    return marked;
  };

  const onDayPress = (day: DateData) => {
    if (!selectedStartDate || (selectedStartDate && selectedEndDate)) {
      // Start new range
      setSelectedStartDate(day.dateString);
      setSelectedEndDate('');
      setSelectedDateOption('Custom dates');
    } else {
      // Complete range
      // Check if end date is before start date
      if (new Date(day.dateString) < new Date(selectedStartDate)) {
        setSelectedStartDate(day.dateString);
        setSelectedEndDate('');
      } else {
        setSelectedEndDate(day.dateString);

        // Format display string
        const start = new Date(selectedStartDate).toLocaleDateString([], {
          month: 'short',
          day: 'numeric',
        });
        const end = new Date(day.dateString).toLocaleDateString([], {
          month: 'short',
          day: 'numeric',
        });
        setSelectedDateOption(`${start} - ${end}`);
      }
    }
  };

  // Who state
  const [guests, setGuests] = useState({
    adults: 0,
    children: 0,
    infants: 0,
    pets: 0,
  });

  // Calculate total guest count string
  const getGuestString = () => {
    const total = guests.adults + guests.children;
    if (total === 0) return 'Add guests';
    let str = `${total} guest${total !== 1 ? 's' : ''}`;
    if (guests.infants > 0) str += `, ${guests.infants} infant${guests.infants !== 1 ? 's' : ''}`;
    if (guests.pets > 0) str += `, ${guests.pets} pet${guests.pets !== 1 ? 's' : ''}`;
    return str;
  };

  useEffect(() => {
    if (visible) {
      // Reset state when opening
      setStep('collapsed');
      setActiveSection('where');
      setSearchQuery('');

      // Animate in
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Animate out
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: SCREEN_HEIGHT,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, fadeAnim, slideAnim]);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: SCREEN_HEIGHT,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  };

  const handleSearchPress = () => {
    // If just opening the expanded view
    if (step === 'collapsed') {
      setStep('expanded');
    } else {
      // Perform actual search
      onSearch(where || 'All Locations', searchQuery, 10);
      handleClose();
    }
  };

  const handleClearAll = () => {
    setWhere('');
    setDateCategory('dates');
    setSelectedDateOption('Any week');
    setGuests({ adults: 0, children: 0, infants: 0, pets: 0 });
    setSearchQuery('');
    setStep('collapsed');
    setActiveSection('where');
  };

  const updateGuests = (type: keyof typeof guests, delta: number) => {
    setGuests((prev) => {
      const newValue = Math.max(0, prev[type] + delta);
      return { ...prev, [type]: newValue };
    });
  };

  const renderWhereContent = () => (
    <>
      <View style={styles.searchInputContainer}>
        <Ionicons name="search" size={20} color={Colors.textSecondary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search destinations"
          placeholderTextColor={Colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
          onFocus={() => setStep('expanded')}
        />
      </View>

      <Text style={styles.sectionSubtitle}>Suggested destinations</Text>

      <ScrollView style={styles.suggestionsList} showsVerticalScrollIndicator={false}>
        {suggestedDestinations.slice(0, 3).map((item) => (
          <Pressable
            key={item.id}
            style={styles.suggestionItem}
            onPress={() => {
              setWhere(item.label);
              setSearchQuery(item.label);
              setActiveSection('when'); // Auto-advance
            }}
          >
            <View style={[styles.suggestionIcon, { backgroundColor: item.iconBg }]}>
              <Ionicons name={item.icon as any} size={24} color={item.iconColor} />
            </View>
            <View style={styles.suggestionTextContainer}>
              <Text style={styles.suggestionLabel}>{item.label}</Text>
              <Text style={styles.suggestionSublabel}>{item.sublabel}</Text>
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </>
  );

  const renderWhenContent = () => (
    <View>
      <View style={styles.tabsContainer}>
        <Pressable
          style={[styles.tab, dateCategory === 'dates' && styles.tabActive]}
          onPress={() => setDateCategory('dates')}
        >
          <Text style={[styles.tabText, dateCategory === 'dates' && styles.tabTextActive]}>
            Dates
          </Text>
        </Pressable>
        <Pressable
          style={[styles.tab, dateCategory === 'flexible' && styles.tabActive]}
          onPress={() => setDateCategory('flexible')}
        >
          <Text style={[styles.tabText, dateCategory === 'flexible' && styles.tabTextActive]}>
            Flexible
          </Text>
        </Pressable>
      </View>

      <View style={styles.calendarContainer}>
        {dateCategory === 'dates' ? (
          <Calendar
            onDayPress={onDayPress}
            markedDates={getMarkedDates()}
            markingType={'period'}
            theme={{
              todayTextColor: Colors.primary,
              selectedDayBackgroundColor: Colors.primary,
              arrowColor: Colors.primary,
              textDayFontWeight: '500',
              textMonthFontWeight: 'bold',
              textDayHeaderFontWeight: '500',
            }}
            minDate={new Date().toISOString().split('T')[0]}
          />
        ) : (
          <View style={styles.calendarPlaceholder}>
            <Ionicons name="calendar-outline" size={48} color={Colors.textSecondary} />
            <Text style={styles.placeholderText}>Select a flexible timeframe</Text>
          </View>
        )}

        <View style={styles.quickDatesRow}>
          {['This weekend', 'Next week', 'Any week'].map((opt) => (
            <Pressable
              key={opt}
              style={[
                styles.quickDateChip,
                selectedDateOption === opt && !selectedEndDate && styles.quickDateChipActive,
              ]}
              onPress={() => {
                setSelectedDateOption(opt);
                setSelectedStartDate('');
                setSelectedEndDate('');
              }}
            >
              <Text
                style={[
                  styles.quickDateText,
                  selectedDateOption === opt && !selectedEndDate && styles.quickDateTextActive,
                ]}
              >
                {opt}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
    </View>
  );

  const renderWhoContent = () => (
    <View style={styles.guestList}>
      {[
        { id: 'adults', label: 'Adults', sub: 'Ages 13 or above' },
        { id: 'children', label: 'Children', sub: 'Ages 2–12' },
        { id: 'infants', label: 'Infants', sub: 'Under 2' },
        { id: 'pets', label: 'Pets', sub: 'Bringing a service animal?' },
      ].map((item) => (
        <View key={item.id} style={styles.guestRow}>
          <View>
            <Text style={styles.guestLabel}>{item.label}</Text>
            <Text style={styles.guestSubLabel}>{item.sub}</Text>
          </View>
          <View style={styles.counterContainer}>
            <Pressable
              style={[
                styles.counterBtn,
                guests[item.id as keyof typeof guests] === 0 && styles.counterBtnDisabled,
              ]}
              onPress={() => updateGuests(item.id as keyof typeof guests, -1)}
              disabled={guests[item.id as keyof typeof guests] === 0}
            >
              <Ionicons
                name="remove"
                size={20}
                color={guests[item.id as keyof typeof guests] === 0 ? '#CDCDCD' : '#717171'}
              />
            </Pressable>
            <Text style={styles.counterValue}>{guests[item.id as keyof typeof guests]}</Text>
            <Pressable
              style={styles.counterBtn}
              onPress={() => updateGuests(item.id as keyof typeof guests, 1)}
            >
              <Ionicons name="add" size={20} color="#717171" />
            </Pressable>
          </View>
        </View>
      ))}
    </View>
  );

  const renderSectionHeader = (section: 'where' | 'when' | 'who', title: string, value: string) => {
    const isActive = activeSection === section;

    if (isActive) {
      return (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{title}</Text>
          {section === 'where' && renderWhereContent()}
          {section === 'when' && renderWhenContent()}
          {section === 'who' && renderWhoContent()}
        </View>
      );
    }

    return (
      <Pressable style={styles.collapsedCard} onPress={() => setActiveSection(section)}>
        <Text style={styles.collapsedLabel}>{title}</Text>
        <Text style={styles.actionText}>{value}</Text>
      </Pressable>
    );
  };

  const renderCollapsedView = () => (
    <View style={styles.collapsedContainer}>
      <View style={styles.headerRow}>
        <Pressable onPress={handleClose} style={styles.closeButton}>
          <View style={styles.closeButtonCircle}>
            <Ionicons name="close" size={20} color={Colors.text} />
          </View>
        </Pressable>
        <View style={{ flex: 1 }} />
      </View>

      {renderSectionHeader('where', 'Where', where || 'Add destination')}
      {renderSectionHeader('when', 'When', selectedDateOption || 'Add dates')}
      {renderSectionHeader('who', 'Who', getGuestString())}
    </View>
  );

  const renderExpandedView = () => (
    <View style={styles.expandedContainer}>
      <View style={styles.searchHeader}>
        <Pressable onPress={() => setStep('collapsed')} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </Pressable>
        <TextInput
          style={styles.headerInput}
          placeholder="Search destinations"
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoFocus
        />
      </View>

      <Text style={styles.sectionSubtitle}>Suggested destinations</Text>

      <ScrollView style={styles.expandedList} showsVerticalScrollIndicator={false}>
        {suggestedDestinations.map((item) => (
          <Pressable
            key={item.id}
            style={styles.suggestionItem}
            onPress={() => {
              setWhere(item.label);
              setSearchQuery(item.label);
              setStep('collapsed');
              setActiveSection('when');
            }}
          >
            <View style={[styles.suggestionIcon, { backgroundColor: item.iconBg }]}>
              <Ionicons name={item.icon as any} size={24} color={item.iconColor} />
            </View>
            <View style={styles.suggestionTextContainer}>
              <Text style={styles.suggestionLabel}>{item.label}</Text>
              <Text style={styles.suggestionSublabel}>{item.sublabel}</Text>
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={handleClose}>
      <View style={styles.modalOverlay}>
        <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
        </Animated.View>

        <Animated.View style={[styles.modalContent, { transform: [{ translateY: slideAnim }] }]}>
          {step === 'collapsed' ? (
            <>
              {renderCollapsedView()}

              <View style={styles.footer}>
                <Pressable onPress={handleClearAll}>
                  <Text style={styles.clearAllText}>Clear all</Text>
                </Pressable>

                <Pressable style={styles.searchButton} onPress={handleSearchPress}>
                  <Ionicons name="search" size={20} color="#FFF" />
                  <Text style={styles.searchButtonText}>Search</Text>
                </Pressable>
              </View>
            </>
          ) : (
            renderExpandedView()
          )}
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalContent: {
    backgroundColor: Colors.background, // Should be light gray/off-white based on image
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    height: '90%',
    paddingTop: Spacing.md,
  },

  // Collapsed View Styles
  collapsedContainer: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: Spacing.lg,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.text,
  },
  closeButton: {
    padding: 4,
  },
  closeButtonCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    height: 50,
    marginBottom: Spacing.lg,
  },
  searchInput: {
    flex: 1,
    marginLeft: Spacing.sm,
    fontSize: 16,
    color: Colors.text,
  },
  sectionSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },
  suggestionsList: {
    maxHeight: 240,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  suggestionIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  suggestionTextContainer: {
    flex: 1,
  },
  suggestionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 2,
  },
  suggestionSublabel: {
    fontSize: 13,
    color: Colors.textSecondary,
  },

  collapsedCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: Spacing.lg,
    paddingVertical: 20,
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
  collapsedLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  actionText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },

  // Footer
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    paddingBottom: Platform.OS === 'ios' ? 40 : Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    backgroundColor: '#FFF',
  },
  clearAllText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    textDecorationLine: 'underline',
  },
  searchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: BorderRadius.lg,
    gap: 8,
  },
  searchButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },

  // Expanded View Styles
  headerRow: {
    flexDirection: 'row',
    marginBottom: Spacing.md,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: BorderRadius.full,
    padding: 4,
    marginBottom: Spacing.lg,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: '#FFF',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  tabTextActive: {
    color: Colors.text,
  },
  calendarContainer: {
    marginTop: Spacing.sm,
  },
  calendarPlaceholder: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    backgroundColor: '#F9FAFB',
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderStyle: 'dashed',
  },
  placeholderText: {
    marginTop: Spacing.sm,
    color: Colors.textSecondary,
    fontSize: 14,
  },
  quickDatesRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.lg,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  quickDateChip: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    backgroundColor: '#FFF',
  },
  quickDateChipActive: {
    borderColor: Colors.text,
    backgroundColor: '#F3F4F6',
    borderWidth: 2,
  },
  quickDateText: {
    fontSize: 14,
    color: Colors.text,
  },
  quickDateTextActive: {
    fontWeight: '600',
  },

  // Guest selection styles
  guestList: {
    marginTop: Spacing.sm,
  },
  guestRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  guestLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  guestSubLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  counterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  counterBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#B0B0B0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  counterBtnDisabled: {
    borderColor: '#EBEBEB',
    backgroundColor: '#F7F7F7',
  },
  counterValue: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    minWidth: 24,
    textAlign: 'center',
  },

  expandedContainer: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  searchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    backgroundColor: '#FFF',
    height: 56,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
  },
  headerInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    paddingHorizontal: Spacing.sm,
  },
  expandedList: {
    flex: 1,
  },
});
