import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  TouchableOpacity,
  TextInput,
  Image,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import Button from '../../src/components/ui/button';
import Card from '../../src/components/ui/card';
import Input from '../../src/components/ui/input';
import ImageUpload from '../../src/components/ui/image-upload';
import MultiImageUpload from '../../src/components/ui/multi-image-upload';
import ItineraryBuilder, { ItineraryDay } from '../../src/components/itinerary-builder';
import InclusionsBuilder from '../../src/components/inclusions-builder';
import ThingsToKnowBuilder from '../../src/components/things-to-know-builder';
import { Colors } from '../../src/constants/Colors';
import { Spacing, Typography, BorderRadius } from '../../src/constants/Styles';
import { Fonts } from '../../src/constants/Fonts';
import { useAuth } from '../../src/contexts/auth-context';
import * as EventService from '../../src/services/event-service';
import { HOST_TYPE_LABELS } from '../../src/services/host-service';

type EventType = 'event' | 'experience' | 'trip';

const EVENT_TYPES: {
  value: EventType;
  label: string;
  emoji: string;
  image: any;
}[] = [
  // { value: 'event', label: 'Event', emoji: '🎉', image: null }, // Commented out - Events disabled
  {
    value: 'experience',
    label: 'Experience',
    emoji: '✨',
    image: require('../../assets/others/experiences.png'),
  },
  {
    value: 'trip',
    label: 'Trip',
    emoji: '🏔️',
    image: require('../../assets/others/trips.png'),
  },
];

// Type-specific categories
const EVENT_CATEGORIES = [
  'Cultural',
  'Concert',
  'Games',
  'Outdoors',
  'Nightlife',
  'Business',
  'Entertainment',
  'Food & Drink',
  'Other',
];

const EXPERIENCE_CATEGORIES = [
  'Cultural',
  'Games',
  'Entertainment',
  'Outdoors',
  'Nightlife',
  'Wellness',
  'Other',
];

const TRIP_CATEGORIES = [
  'Travel',
  'Beach Trip',
  'Mountain Trek',
  'City Tour',
  'Road Trip',
  'Camping',
  'Food & Drink',
  'Other',
];

// Subcategories for each main category
const CATEGORY_SUBCATEGORIES: Record<string, string[]> = {
  Cultural: ['Music', 'Dance', 'Theatre', 'Art', 'Film', 'Literature'],
  Concert: ['Rock', 'Pop', 'Jazz', 'Classical', 'Electronic', 'Hip Hop', 'Country', 'Indie'],
  Games: ['Sports', 'E-Games', 'Board Games', 'Card Games', 'Outdoor Games'],
  Outdoors: ['Getaway', 'Hiking', 'Running', 'Cycling', 'Camping', 'Trekking'],
  Nightlife: ['Parties', 'Clubs', 'Cafes', 'Movies', 'Bar Hopping', 'Live Music'],
  Wellness: ['Yoga', 'Retreat', 'Rehab', 'Meditation', 'Spa', 'Fitness'],
  Business: ['Conference', 'Workshop', 'Seminar', 'Networking', 'Training', 'Exhibition'],
  Entertainment: ['Comedy', 'Magic Show', 'Circus', 'Theatre', 'Stand-up', 'Improv'],
  'Food & Drink': [
    'Wine Tasting',
    'Cooking Class',
    'Food Festival',
    'Brewery Tour',
    'Fine Dining',
    'Street Food',
  ],
  Travel: ['Sightseeing', 'Adventure Travel', 'Cultural Tour', 'Beach', 'Mountain', 'City Break'],
  'Beach Trip': [
    'Swimming',
    'Surfing',
    'Snorkeling',
    'Beach Volleyball',
    'Sunbathing',
    'Water Sports',
  ],
  'Mountain Trek': [
    'Hiking',
    'Camping',
    'Rock Climbing',
    'Nature Photography',
    'Wildlife Spotting',
  ],
  'City Tour': [
    'Historical Sites',
    'Museums',
    'Food Tour',
    'Shopping',
    'Nightlife',
    'Architecture',
  ],
  'Road Trip': ['Scenic Routes', 'Adventure', 'Food Stops', 'Photography', 'Camping', 'Nature'],
  Camping: [
    'Tent Camping',
    'RV Camping',
    'Backpacking',
    'Glamping',
    'Beach Camping',
    'Mountain Camping',
  ],
  Other: [],
};

// Helper function to get categories based on event type
const getCategoriesForType = (type: EventType): string[] => {
  switch (type) {
    case 'event':
      return EVENT_CATEGORIES;
    case 'experience':
      return EXPERIENCE_CATEGORIES;
    case 'trip':
      return TRIP_CATEGORIES;
    default:
      return EVENT_CATEGORIES;
  }
};

export default function CreateEventScreen() {
  const router = useRouter();
  const { user, profile, isHost, isAdmin } = useAuth();
  const [loading, setLoading] = useState(false);
  const [checkingPermissions, setCheckingPermissions] = useState(true);
  const [permissions, setPermissions] = useState<{
    canCreateEvents: boolean;
    canCreateTrips: boolean;
    canCreateExperiences: boolean;
  } | null>(null);
  const [step, setStep] = useState(1);

  // Form state
  const [eventType, setEventType] = useState<EventType>('experience');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [termsAndConditions, setTermsAndConditions] = useState('');
  const [cancellationPolicy, setCancellationPolicy] = useState('');
  const [category, setCategory] = useState('');
  const [subcategories, setSubcategories] = useState<string[]>([]);
  const [customTags, setCustomTags] = useState<string[]>([]); // For trips custom tags
  const [customTagInput, setCustomTagInput] = useState(''); // For adding custom tags
  const [locationName, setLocationName] = useState('');
  const [locationAddress, setLocationAddress] = useState('');
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('');
  const [maxCapacity, setMaxCapacity] = useState('');
  const [price, setPrice] = useState('0');

  // Image fields
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null);

  // Trip-specific fields
  const [departureLocation, setDepartureLocation] = useState('');
  const [pickups, setPickups] = useState<string[]>([]);
  const [pickupInput, setPickupInput] = useState('');
  const [itinerary, setItinerary] = useState<ItineraryDay[]>([]);
  const [whatsIncluded, setWhatsIncluded] = useState<string[]>([]);
  const [whatsNotIncluded, setWhatsNotIncluded] = useState<string[]>([]);
  const [tripImages, setTripImages] = useState<string[]>([]);
  const [thingsToKnow, setThingsToKnow] = useState<string[]>([]);

  // Date picker state
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  const [tempStartDate, setTempStartDate] = useState(new Date());
  const [tempEndDate, setTempEndDate] = useState(new Date());

  // Validation
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load permissions on mount
  React.useEffect(() => {
    async function checkPermissions() {
      if (!user?.id || (!isHost && !isAdmin)) {
        setCheckingPermissions(false);
        return;
      }

      try {
        const perms = await EventService.getUserHostPermissions(user.id);
        setPermissions(perms);
      } catch (error) {
        console.error('Error checking permissions:', error);
        setPermissions({
          canCreateEvents: false,
          canCreateTrips: false,
          canCreateExperiences: false,
        });
      } finally {
        setCheckingPermissions(false);
      }
    }

    checkPermissions();
  }, [user?.id, isHost, isAdmin]);

  // Redirect non-hosts
  if (!isHost && !isAdmin) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.notHostContainer}>
          <Text style={styles.notHostIcon}>🚫</Text>
          <Text style={styles.notHostTitle}>Host Access Required</Text>
          <Text style={styles.notHostText}>You need to be an approved host to create events.</Text>
          <Button title="View Profile" onPress={() => router.push('/profile')} variant="primary" />
          <Button
            title="Go Back"
            onPress={() => router.back()}
            variant="ghost"
            style={{ marginTop: Spacing.md }}
          />
        </View>
      </SafeAreaView>
    );
  }

  // Loading permissions
  if (checkingPermissions) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.notHostContainer}>
          <Text style={styles.notHostText}>Checking permissions...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Date picker handlers
  const handleStartDateChange = (event: any, selectedDate?: Date) => {
    setShowStartDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setTempStartDate(selectedDate);
      const dateStr = selectedDate.toISOString().split('T')[0];
      setStartDate(dateStr);
      // Clear error when date is selected
      if (errors.startDate) {
        setErrors({ ...errors, startDate: '' });
      }
    }
  };

  const handleStartTimeChange = (event: any, selectedTime?: Date) => {
    setShowStartTimePicker(Platform.OS === 'ios');
    if (selectedTime) {
      const hours = selectedTime.getHours().toString().padStart(2, '0');
      const minutes = selectedTime.getMinutes().toString().padStart(2, '0');
      const timeStr = `${hours}:${minutes}`;
      setStartTime(timeStr);
      // Clear error when time is selected
      if (errors.startTime) {
        setErrors({ ...errors, startTime: '' });
      }
    }
  };

  const handleEndDateChange = (event: any, selectedDate?: Date) => {
    setShowEndDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setTempEndDate(selectedDate);
      const dateStr = selectedDate.toISOString().split('T')[0];
      setEndDate(dateStr);
      // Clear error when date is selected
      if (errors.endDate) {
        setErrors({ ...errors, endDate: '' });
      }
    }
  };

  const handleEndTimeChange = (event: any, selectedTime?: Date) => {
    setShowEndTimePicker(Platform.OS === 'ios');
    if (selectedTime) {
      const hours = selectedTime.getHours().toString().padStart(2, '0');
      const minutes = selectedTime.getMinutes().toString().padStart(2, '0');
      const timeStr = `${hours}:${minutes}`;
      setEndTime(timeStr);
      // Clear error when time is selected
      if (errors.endTime) {
        setErrors({ ...errors, endTime: '' });
      }
    }
  };

  // Check specific event type permissions
  const canCreateEventType = (type: EventType): boolean => {
    if (isAdmin) return true;
    if (!permissions) return false;

    switch (type) {
      case 'event':
        return permissions.canCreateEvents;
      case 'trip':
        return permissions.canCreateTrips;
      case 'experience':
        return permissions.canCreateExperiences;
      default:
        return false;
    }
  };

  const getPermissionMessage = (): string => {
    if (isAdmin) return '';

    const hostType = profile?.host_type;
    if (hostType === 'activity') {
      return 'As an Activity Host, you can only create Experiences. Upgrade to Full Host for Events and Trips.';
    }
    return '';
  };

  const validateStep1 = () => {
    const newErrors: Record<string, string> = {};
    if (!title.trim()) newErrors.title = 'Title is required';
    if (!description.trim()) newErrors.description = 'Description is required';
    if (!category) newErrors.category = 'Category is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors: Record<string, string> = {};

    // Check presence
    if (!locationName.trim()) newErrors.locationName = 'Location name is required';
    if (!startDate.trim()) newErrors.startDate = 'Start date is required';
    if (!startTime.trim()) newErrors.startTime = 'Start time is required';
    if (!endDate.trim()) newErrors.endDate = 'End date is required';
    if (!endTime.trim()) newErrors.endTime = 'End time is required';

    // Validate date/time format and logic
    if (startDate && startTime) {
      const startDateTime = new Date(`${startDate}T${startTime}`);
      if (isNaN(startDateTime.getTime())) {
        newErrors.startDate = 'Invalid date/time format';
      } else if (startDateTime < new Date()) {
        newErrors.startDate = 'Start date must be in the future';
      }
    }

    if (endDate && endTime) {
      const endDateTime = new Date(`${endDate}T${endTime}`);
      if (isNaN(endDateTime.getTime())) {
        newErrors.endDate = 'Invalid date/time format';
      }
    }

    // Check if end date is after start date
    if (
      startDate &&
      startTime &&
      endDate &&
      endTime &&
      !newErrors.startDate &&
      !newErrors.endDate
    ) {
      const startDateTime = new Date(`${startDate}T${startTime}`);
      const endDateTime = new Date(`${endDate}T${endTime}`);
      if (endDateTime <= startDateTime) {
        newErrors.endDate = 'End date must be after start date';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const getTotalSteps = () => {
    return eventType === 'trip' ? 4 : 3;
  };

  const handleNextStep = () => {
    if (step === 1 && validateStep1()) {
      setStep(2);
    } else if (step === 2 && validateStep2()) {
      // If creating a trip, go to trip details step (3), otherwise skip to capacity & pricing (3)
      setStep(3);
    } else if (step === 3 && eventType === 'trip') {
      // From trip details, go to capacity & pricing (4)
      setStep(4);
    }
  };

  // Helper function to calculate duration
  const calculateDuration = (sDate: string, sTime: string, eDate: string, eTime: string) => {
    try {
      const start = new Date(`${sDate}T${sTime}`);
      const end = new Date(`${eDate}T${eTime}`);
      const diffMs = end.getTime() - start.getTime();
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

      if (diffHours < 24) {
        return `${diffHours}h ${diffMins}m`;
      } else {
        const days = Math.floor(diffHours / 24);
        const hours = diffHours % 24;
        return `${days}d ${hours}h`;
      }
    } catch {
      return '';
    }
  };

  const handleCreateEvent = async () => {
    if (!user?.id) return;

    // Check permission before creating
    if (!canCreateEventType(eventType)) {
      Alert.alert(
        'Permission Denied',
        `You don't have permission to create ${eventType}s. ${getPermissionMessage()}`,
        [{ text: 'OK' }]
      );
      return;
    }

    setLoading(true);
    try {
      // Combine date and time and validate
      const startDateTime = new Date(`${startDate}T${startTime}`);
      const endDateTime = new Date(`${endDate}T${endTime}`);

      // Final validation check
      if (isNaN(startDateTime.getTime()) || isNaN(endDateTime.getTime())) {
        Alert.alert('Invalid Date', 'Please check your date and time inputs');
        setLoading(false);
        return;
      }

      const eventData: any = {
        type: eventType,
        title: title.trim(),
        description: description.trim(),
        terms_and_conditions: termsAndConditions.trim() || undefined,
        cancellation_policy: cancellationPolicy.trim() || undefined,
        category,
        cover_image_url: coverImageUrl || undefined,
        location_name: locationName.trim(),
        location_address: locationAddress.trim() || undefined,
        start_date: startDateTime.toISOString(),
        end_date: endDateTime.toISOString(),
        max_capacity: maxCapacity ? parseInt(maxCapacity, 10) : undefined,
        price: parseFloat(price) || 0,
        currency: 'INR',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
        images: [],
        tags: eventType === 'trip' ? customTags : subcategories, // Custom tags for trips, subcategories for events/experiences
        things_to_know: thingsToKnow.length > 0 ? thingsToKnow.filter((i) => i.trim()) : undefined,
      };

      // Add trip-specific fields if creating a trip
      if (eventType === 'trip') {
        eventData.departure_location = departureLocation.trim() || undefined;
        eventData.pickups = pickups.length > 0 ? pickups : undefined;
        eventData.itinerary = itinerary.length > 0 ? JSON.stringify(itinerary) : undefined;
        eventData.whats_included =
          whatsIncluded.length > 0
            ? JSON.stringify(whatsIncluded.filter((i) => i.trim()))
            : undefined;
        eventData.whats_not_included =
          whatsNotIncluded.length > 0
            ? JSON.stringify(whatsNotIncluded.filter((i) => i.trim()))
            : undefined;
        eventData.images = tripImages.length > 0 ? tripImages : [];
      }

      const event = await EventService.createEvent(eventData, user.id);

      // Automatically publish the event
      await EventService.publishEvent(event.id);

      // Show success message and navigate to the event
      Alert.alert(
        'Event Published!',
        'Your event has been successfully published and is now live.',
        [
          {
            text: 'View Event',
            onPress: () => router.replace(`/events/${event.id}`),
          },
        ]
      );
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to create event');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Create Event',
          headerBackTitle: '',
        }}
      />
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          {/* Progress Indicator */}
          <View style={styles.progressContainer}>
            {Array.from({ length: getTotalSteps() }, (_, i) => i + 1).map((s) => (
              <View key={s} style={[styles.progressDot, s <= step && styles.progressDotActive]} />
            ))}
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Step 1: Basic Info */}
            {step === 1 && (
              <View style={styles.stepContainer}>
                <Text style={styles.stepTitle}>Basic Information</Text>
                <Text style={styles.stepDescription}>Tell us about your {eventType}</Text>

                {/* Host Type Badge */}
                {!isAdmin && profile?.host_type && (
                  <Card style={styles.hostTypeBadgeCard} variant="outlined">
                    <Text style={styles.hostTypeBadgeText}>
                      Your Host Type: {HOST_TYPE_LABELS[profile.host_type]}
                    </Text>
                    {getPermissionMessage() && (
                      <Text style={styles.permissionMessage}>{getPermissionMessage()}</Text>
                    )}
                  </Card>
                )}

                {/* Event Type Selection */}
                <View style={styles.typeSelector}>
                  {EVENT_TYPES.map((type) => {
                    const hasPermission = canCreateEventType(type.value);
                    return (
                      <Card
                        key={type.value}
                        style={[
                          styles.typeCard,
                          eventType === type.value && styles.typeCardSelected,
                          !hasPermission && styles.typeCardDisabled,
                        ]}
                        onPress={() => {
                          if (!hasPermission) {
                            Alert.alert(
                              'Permission Required',
                              `You need Full Host access to create ${type.label}s.`,
                              [{ text: 'OK' }]
                            );
                            return;
                          }
                          setEventType(type.value);
                          setCategory(''); // Reset category when type changes
                          setSubcategories([]); // Reset subcategories when type changes
                          setCustomTags([]); // Reset custom tags when type changes
                          setCustomTagInput(''); // Reset custom tag input
                        }}
                      >
                        {type.image ? (
                          <Image
                            source={type.image}
                            style={[styles.typeImage, !hasPermission && styles.typeImageDisabled]}
                            resizeMode="contain"
                          />
                        ) : (
                          <Text
                            style={[styles.typeEmoji, !hasPermission && styles.typeEmojiDisabled]}
                          >
                            {type.emoji}
                          </Text>
                        )}
                        <Text
                          style={[
                            styles.typeLabel,
                            eventType === type.value && styles.typeLabelSelected,
                            !hasPermission && styles.typeLabelDisabled,
                          ]}
                        >
                          {type.label}
                        </Text>
                        {!hasPermission && <Text style={styles.typeLockedIcon}>🔒</Text>}
                      </Card>
                    );
                  })}
                </View>

                <Input
                  label="Title"
                  placeholder="Give your event a catchy name"
                  value={title}
                  onChangeText={setTitle}
                  error={errors.title}
                />

                <Input
                  label="Description"
                  placeholder="What's this event about?"
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  numberOfLines={4}
                  error={errors.description}
                />

                <Input
                  label="Terms & Conditions (Optional)"
                  placeholder="Add any terms and conditions for this event..."
                  value={termsAndConditions}
                  onChangeText={setTermsAndConditions}
                  multiline
                  numberOfLines={4}
                />

                <Input
                  label="Cancellation Policy (Optional)"
                  placeholder="Add cancellation policy details..."
                  value={cancellationPolicy}
                  onChangeText={setCancellationPolicy}
                  multiline
                  numberOfLines={4}
                />

                <ImageUpload
                  label={`Add ${eventType === 'event' ? 'Event' : eventType === 'experience' ? 'Experience' : 'Trip'} Cover Image`}
                  onImageSelected={(url) => {
                    setCoverImageUrl(url);
                  }}
                  currentImageUrl={coverImageUrl}
                  bucket="event-images"
                  folder={`${eventType}s/${user?.id}`}
                />

                {/* Category Selection */}
                <Text style={styles.inputLabel}>
                  {eventType === 'trip' ? 'Category' : 'Main Category'}
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.categoryScroll}
                >
                  {getCategoriesForType(eventType).map((cat) => (
                    <Card
                      key={cat}
                      style={[styles.categoryChip, category === cat && styles.categoryChipSelected]}
                      onPress={() => {
                        setCategory(cat);
                        if (eventType !== 'trip') {
                          setSubcategories([]); // Reset subcategories for events/experiences
                        }
                      }}
                    >
                      <Text
                        style={[
                          styles.categoryChipText,
                          category === cat && styles.categoryChipTextSelected,
                        ]}
                      >
                        {cat}
                      </Text>
                    </Card>
                  ))}
                </ScrollView>
                {errors.category && <Text style={styles.errorText}>{errors.category}</Text>}

                {/* Subcategories - Only for Events and Experiences */}
                {eventType !== 'trip' &&
                  category &&
                  CATEGORY_SUBCATEGORIES[category]?.length > 0 && (
                    <View style={styles.subcategorySection}>
                      <Text style={styles.inputLabel}>Subcategories (Select all that apply)</Text>
                      <View style={styles.subcategoryGrid}>
                        {CATEGORY_SUBCATEGORIES[category].map((subcat) => (
                          <Pressable
                            key={subcat}
                            style={[
                              styles.subcategoryChip,
                              subcategories.includes(subcat) && styles.subcategoryChipSelected,
                            ]}
                            onPress={() => {
                              if (subcategories.includes(subcat)) {
                                setSubcategories(subcategories.filter((s) => s !== subcat));
                              } else {
                                setSubcategories([...subcategories, subcat]);
                              }
                            }}
                          >
                            <View
                              style={[
                                styles.checkbox,
                                subcategories.includes(subcat) && styles.checkboxChecked,
                              ]}
                            >
                              {subcategories.includes(subcat) && (
                                <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                              )}
                            </View>
                            <Text
                              style={[
                                styles.subcategoryChipText,
                                subcategories.includes(subcat) &&
                                  styles.subcategoryChipTextSelected,
                              ]}
                            >
                              {subcat}
                            </Text>
                          </Pressable>
                        ))}
                      </View>
                    </View>
                  )}

                {/* Custom Tags - Only for Trips */}
                {eventType === 'trip' && (
                  <View style={styles.customTagsSection}>
                    <Text style={styles.inputLabel}>Tags (Add multiple tags)</Text>
                    <Text style={styles.tagsHint}>
                      Add tags like &quot;Adventure&quot;, &quot;Beach&quot;, &quot;Relaxing&quot;,
                      &quot;Photography&quot; etc.
                    </Text>
                    <View style={styles.customTagInputRow}>
                      <View style={styles.customTagInputWrapper}>
                        <View style={styles.customTagInputContainer}>
                          <TextInput
                            style={styles.customTagTextInput}
                            placeholder="Type a tag and press Add"
                            placeholderTextColor={Colors.textSecondary}
                            value={customTagInput}
                            onChangeText={setCustomTagInput}
                            onSubmitEditing={() => {
                              const tag = customTagInput.trim();
                              if (tag && !customTags.includes(tag)) {
                                setCustomTags([...customTags, tag]);
                                setCustomTagInput('');
                              }
                            }}
                            returnKeyType="done"
                            blurOnSubmit={false}
                          />
                        </View>
                      </View>
                      <Pressable
                        style={[
                          styles.addTagButton,
                          !customTagInput.trim() && styles.addTagButtonDisabled,
                        ]}
                        onPress={() => {
                          const tag = customTagInput.trim();
                          if (tag && !customTags.includes(tag)) {
                            setCustomTags([...customTags, tag]);
                            setCustomTagInput('');
                          }
                        }}
                        disabled={!customTagInput.trim()}
                      >
                        <Ionicons
                          name="add"
                          size={24}
                          color={!customTagInput.trim() ? Colors.textTertiary : Colors.textInverse}
                        />
                      </Pressable>
                    </View>
                    {customTags.length > 0 && (
                      <View style={styles.customTagsList}>
                        {customTags.map((tag, index) => (
                          <View key={index} style={styles.customTagChip}>
                            <Text style={styles.customTagChipText}>{tag}</Text>
                            <Pressable
                              onPress={() => {
                                setCustomTags(customTags.filter((t) => t !== tag));
                              }}
                              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            >
                              <Ionicons name="close-circle" size={18} color={Colors.primary} />
                            </Pressable>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                )}
              </View>
            )}

            {/* Step 2: Location & Time */}
            {step === 2 && (
              <View style={styles.stepContainer}>
                <Text style={styles.stepTitle}>Location & Time</Text>
                <Text style={styles.stepDescription}>When and where is it happening?</Text>

                {/* Things to Know - for Experiences (moved to top) */}
                {eventType !== 'trip' && (
                  <View style={styles.sectionCard}>
                    <View style={styles.sectionHeader}>
                      <Ionicons name="information-circle" size={20} color={Colors.primary} />
                      <Text style={styles.sectionHeaderText}>Things to Know</Text>
                    </View>

                    <ThingsToKnowBuilder value={thingsToKnow} onChange={setThingsToKnow} />
                  </View>
                )}

                {/* Location Section */}
                <View style={styles.sectionCard}>
                  <View style={styles.sectionHeader}>
                    <Ionicons name="location" size={20} color={Colors.primary} />
                    <Text style={styles.sectionHeaderText}>Location Details</Text>
                  </View>

                  <Input
                    label="Venue Name"
                    placeholder="e.g., The Grand Hall, Central Park"
                    value={locationName}
                    onChangeText={setLocationName}
                    error={errors.locationName}
                  />

                  <Input
                    label="Address (Optional)"
                    placeholder="Full address for attendees"
                    value={locationAddress}
                    onChangeText={setLocationAddress}
                    multiline
                    numberOfLines={2}
                  />
                </View>

                {/* Date & Time Section */}
                <View style={styles.sectionCard}>
                  <View style={styles.sectionHeader}>
                    <Ionicons name="calendar" size={20} color={Colors.primary} />
                    <Text style={styles.sectionHeaderText}>Date & Time</Text>
                  </View>

                  {/* Start Date/Time */}
                  <Text style={styles.subsectionLabel}>Start</Text>
                  <View style={styles.dateTimeRow}>
                    <View style={styles.dateTimeInput}>
                      <Text style={styles.dateTimeLabel}>Date</Text>
                      <TouchableOpacity
                        style={[
                          styles.datePickerButton,
                          errors.startDate && styles.datePickerError,
                        ]}
                        onPress={() => setShowStartDatePicker(true)}
                      >
                        <Ionicons name="calendar-outline" size={20} color={Colors.primary} />
                        <Text
                          style={[
                            styles.datePickerText,
                            !startDate && styles.datePickerPlaceholder,
                          ]}
                        >
                          {startDate || 'Select Date'}
                        </Text>
                      </TouchableOpacity>
                      {errors.startDate && <Text style={styles.errorText}>{errors.startDate}</Text>}
                    </View>
                    <View style={styles.dateTimeInput}>
                      <Text style={styles.dateTimeLabel}>Time</Text>
                      <TouchableOpacity
                        style={[
                          styles.datePickerButton,
                          errors.startTime && styles.datePickerError,
                        ]}
                        onPress={() => setShowStartTimePicker(true)}
                      >
                        <Ionicons name="time-outline" size={20} color={Colors.primary} />
                        <Text
                          style={[
                            styles.datePickerText,
                            !startTime && styles.datePickerPlaceholder,
                          ]}
                        >
                          {startTime || 'Select Time'}
                        </Text>
                      </TouchableOpacity>
                      {errors.startTime && <Text style={styles.errorText}>{errors.startTime}</Text>}
                    </View>
                  </View>

                  {/* End Date/Time */}
                  <Text style={styles.subsectionLabel}>End</Text>
                  <View style={styles.dateTimeRow}>
                    <View style={styles.dateTimeInput}>
                      <Text style={styles.dateTimeLabel}>Date</Text>
                      <TouchableOpacity
                        style={[styles.datePickerButton, errors.endDate && styles.datePickerError]}
                        onPress={() => setShowEndDatePicker(true)}
                      >
                        <Ionicons name="calendar-outline" size={20} color={Colors.primary} />
                        <Text
                          style={[styles.datePickerText, !endDate && styles.datePickerPlaceholder]}
                        >
                          {endDate || 'Select Date'}
                        </Text>
                      </TouchableOpacity>
                      {errors.endDate && <Text style={styles.errorText}>{errors.endDate}</Text>}
                    </View>
                    <View style={styles.dateTimeInput}>
                      <Text style={styles.dateTimeLabel}>Time</Text>
                      <TouchableOpacity
                        style={[styles.datePickerButton, errors.endTime && styles.datePickerError]}
                        onPress={() => setShowEndTimePicker(true)}
                      >
                        <Ionicons name="time-outline" size={20} color={Colors.primary} />
                        <Text
                          style={[styles.datePickerText, !endTime && styles.datePickerPlaceholder]}
                        >
                          {endTime || 'Select Time'}
                        </Text>
                      </TouchableOpacity>
                      {errors.endTime && <Text style={styles.errorText}>{errors.endTime}</Text>}
                    </View>
                  </View>

                  {/* Date Time Pickers */}
                  {showStartDatePicker && (
                    <DateTimePicker
                      value={tempStartDate}
                      mode="date"
                      display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                      onChange={handleStartDateChange}
                      minimumDate={new Date()}
                    />
                  )}
                  {showStartTimePicker && (
                    <DateTimePicker
                      value={tempStartDate}
                      mode="time"
                      display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                      onChange={handleStartTimeChange}
                    />
                  )}
                  {showEndDatePicker && (
                    <DateTimePicker
                      value={tempEndDate}
                      mode="date"
                      display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                      onChange={handleEndDateChange}
                      minimumDate={new Date()}
                    />
                  )}
                  {showEndTimePicker && (
                    <DateTimePicker
                      value={tempEndDate}
                      mode="time"
                      display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                      onChange={handleEndTimeChange}
                    />
                  )}

                  {/* Helper Info */}
                  <View style={styles.helperCard}>
                    <Ionicons name="information-circle" size={16} color={Colors.info} />
                    <Text style={styles.helperCardText}>
                      Use 24-hour format. Times are in your local timezone.
                    </Text>
                  </View>

                  {/* Duration Preview */}
                  {startDate &&
                    startTime &&
                    endDate &&
                    endTime &&
                    !errors.startDate &&
                    !errors.endDate && (
                      <View style={styles.durationPreview}>
                        <Ionicons name="time" size={16} color={Colors.success} />
                        <Text style={styles.durationText}>
                          Duration: {calculateDuration(startDate, startTime, endDate, endTime)}
                        </Text>
                      </View>
                    )}
                </View>
              </View>
            )}

            {/* Step 3: Trip Details (only for trips) */}
            {step === 3 && eventType === 'trip' && (
              <View style={styles.stepContainer}>
                <Text style={styles.stepTitle}>Trip Details</Text>
                <Text style={styles.stepDescription}>
                  Additional information specific to your trip
                </Text>

                {/* Departure Location */}
                <View style={styles.sectionCard}>
                  <View style={styles.sectionHeader}>
                    <Ionicons name="location" size={20} color={Colors.primary} />
                    <Text style={styles.sectionHeaderText}>Departure & Pickups</Text>
                  </View>

                  <Input
                    label="Departure Location"
                    placeholder="Mumbai Central Station"
                    value={departureLocation}
                    onChangeText={setDepartureLocation}
                    error={errors.departureLocation}
                  />

                  {/* Pickups */}
                  <Text style={styles.inputLabel}>Pickup Points (Optional)</Text>
                  <View style={styles.pickupContainer}>
                    <View style={styles.pickupInputRow}>
                      <Input
                        placeholder="Add pickup location with time "
                        value={pickupInput}
                        onChangeText={setPickupInput}
                        containerStyle={styles.pickupInput}
                      />
                      <Button
                        title="Add"
                        onPress={() => {
                          if (pickupInput.trim()) {
                            setPickups([...pickups, pickupInput.trim()]);
                            setPickupInput('');
                          }
                        }}
                        variant="primary"
                        size="small"
                      />
                    </View>
                    {pickups.length > 0 && (
                      <View style={styles.pickupsList}>
                        {pickups.map((pickup, index) => (
                          <View key={index} style={styles.pickupListItem}>
                            <View style={styles.pickupListItemLeft}>
                              <View style={styles.pickupNumberBadge}>
                                <Text style={styles.pickupNumberText}>{index + 1}</Text>
                              </View>
                              <Text style={styles.pickupListItemText}>{pickup}</Text>
                            </View>
                            <Pressable
                              onPress={() => setPickups(pickups.filter((_, i) => i !== index))}
                              hitSlop={8}
                              style={styles.pickupDeleteButton}
                            >
                              <Ionicons name="trash-outline" size={18} color={Colors.error} />
                            </Pressable>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                </View>

                {/* Itinerary */}
                <View style={styles.sectionCard}>
                  <View style={styles.sectionHeader}>
                    <Ionicons name="list" size={20} color={Colors.primary} />
                    <Text style={styles.sectionHeaderText}>Itinerary</Text>
                  </View>

                  <ItineraryBuilder value={itinerary} onChange={setItinerary} />
                </View>

                {/* Trip Gallery */}
                <View style={styles.sectionCard}>
                  <View style={styles.sectionHeader}>
                    <Ionicons name="images" size={20} color={Colors.primary} />
                    <Text style={styles.sectionHeaderText}>Trip Gallery</Text>
                  </View>

                  <MultiImageUpload
                    maxImages={5}
                    onImagesChange={setTripImages}
                    currentImages={tripImages}
                    bucket="event-images"
                    folder={`trips/${user?.id}`}
                  />
                </View>

                {/* What's Included / Not Included */}
                <View style={styles.sectionCard}>
                  <View style={styles.sectionHeader}>
                    <Ionicons name="checkmark-circle" size={20} color={Colors.primary} />
                    <Text style={styles.sectionHeaderText}>Package Details</Text>
                  </View>

                  <InclusionsBuilder
                    includedItems={whatsIncluded}
                    notIncludedItems={whatsNotIncluded}
                    onIncludedChange={setWhatsIncluded}
                    onNotIncludedChange={setWhatsNotIncluded}
                  />
                </View>

                {/* Things to Know */}
                <View style={styles.sectionCard}>
                  <View style={styles.sectionHeader}>
                    <Ionicons name="information-circle" size={20} color={Colors.primary} />
                    <Text style={styles.sectionHeaderText}>Things to Know</Text>
                  </View>

                  <ThingsToKnowBuilder value={thingsToKnow} onChange={setThingsToKnow} />
                </View>
              </View>
            )}

            {/* Step 3 (Events/Experiences) or Step 4 (Trips): Capacity & Pricing */}
            {((step === 3 && eventType !== 'trip') || (step === 4 && eventType === 'trip')) && (
              <View style={styles.stepContainer}>
                <Text style={styles.stepTitle}>Capacity & Pricing</Text>
                <Text style={styles.stepDescription}>Set your limits and ticket price</Text>

                <Input
                  label="Maximum Capacity (Optional)"
                  placeholder="Leave empty for unlimited"
                  value={maxCapacity}
                  onChangeText={setMaxCapacity}
                  keyboardType="number-pad"
                />

                <Input
                  label="Ticket Price (INR)"
                  placeholder="0 for free events"
                  value={price}
                  onChangeText={setPrice}
                  keyboardType="decimal-pad"
                  leftIcon={<Text style={styles.currencySymbol}>₹</Text>}
                />

                <Card style={styles.summaryCard} variant="outlined">
                  <Text style={styles.summaryTitle}>Event Summary</Text>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Type:</Text>
                    <Text style={styles.summaryValue}>{eventType}</Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Title:</Text>
                    <Text style={styles.summaryValue} numberOfLines={1}>
                      {title}
                    </Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Category:</Text>
                    <Text style={styles.summaryValue}>{category}</Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Location:</Text>
                    <Text style={styles.summaryValue} numberOfLines={1}>
                      {locationName}
                    </Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Date:</Text>
                    <Text style={styles.summaryValue}>{startDate}</Text>
                  </View>
                </Card>
              </View>
            )}
          </ScrollView>

          {/* Footer Buttons */}
          <View style={styles.footer}>
            {step > 1 && (
              <Button
                title="Back"
                onPress={() => setStep(step - 1)}
                variant="outline"
                style={styles.footerButton}
              />
            )}
            {step < getTotalSteps() ? (
              <Button
                title="Next"
                onPress={handleNextStep}
                variant="primary"
                style={[styles.footerButton, step === 1 && styles.footerButtonFull]}
              />
            ) : (
              <Button
                title={loading ? 'Creating...' : 'Create Event'}
                onPress={handleCreateEvent}
                variant="primary"
                loading={loading}
                disabled={loading}
                style={styles.footerButton}
              />
            )}
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.border,
  },
  progressDotActive: {
    backgroundColor: Colors.primary,
    width: 24,
  },
  scrollContent: {
    padding: Spacing.lg,
  },
  stepContainer: {},
  stepTitle: {
    ...Typography.h2,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  stepDescription: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginBottom: Spacing.xl,
  },
  typeSelector: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  typeCard: {
    flex: 1,
    alignItems: 'center',
    padding: Spacing.md,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  typeCardSelected: {
    borderColor: '#000000',
  },
  typeCardDisabled: {
    opacity: 0.5,
    backgroundColor: Colors.surfaceSecondary,
  },
  typeEmoji: {
    fontSize: 28,
    marginBottom: Spacing.xs,
  },
  typeEmojiDisabled: {
    opacity: 0.4,
  },
  typeImage: {
    width: 48,
    height: 48,
    marginBottom: Spacing.xs,
  },
  typeImageDisabled: {
    opacity: 0.4,
  },
  typeLabel: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
  },
  typeLabelSelected: {
    color: Colors.primary,
    fontFamily: Fonts.semiBold,
  },
  typeLabelDisabled: {
    color: Colors.textTertiary,
  },
  typeLockedIcon: {
    fontSize: 16,
    marginTop: Spacing.xs,
  },
  hostTypeBadgeCard: {
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    backgroundColor: Colors.infoLight,
    borderColor: Colors.info,
  },
  hostTypeBadgeText: {
    ...Typography.bodyMedium,
    color: Colors.text,
    fontFamily: Fonts.semiBold,
    marginBottom: Spacing.xs,
  },
  permissionMessage: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
  },
  inputLabel: {
    ...Typography.bodyMedium,
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  categoryScroll: {
    marginBottom: Spacing.sm,
  },
  categoryChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginRight: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  categoryChipSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  categoryChipText: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
  },
  categoryChipTextSelected: {
    color: Colors.primary,
    fontFamily: Fonts.semiBold,
  },
  errorText: {
    ...Typography.caption,
    color: Colors.error,
    marginTop: Spacing.xs,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  halfInput: {
    flex: 1,
  },
  helperText: {
    ...Typography.caption,
    color: Colors.textTertiary,
    marginTop: Spacing.xs,
  },
  currencySymbol: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  freeEventNote: {
    backgroundColor: Colors.successLight,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.sm,
  },
  freeEventNoteText: {
    ...Typography.bodySmall,
    color: Colors.success,
    textAlign: 'center',
  },
  summaryCard: {
    marginTop: Spacing.lg,
    padding: Spacing.md,
  },
  summaryTitle: {
    ...Typography.bodyMedium,
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    marginBottom: Spacing.xs,
  },
  summaryLabel: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    width: 80,
  },
  summaryValue: {
    ...Typography.bodySmall,
    color: Colors.text,
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    padding: Spacing.lg,
    gap: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  footerButton: {
    flex: 1,
  },
  footerButtonFull: {
    flex: 1,
  },
  notHostContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  notHostIcon: {
    fontSize: 64,
    marginBottom: Spacing.lg,
  },
  notHostTitle: {
    ...Typography.h2,
    color: Colors.text,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  notHostText: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  // New Step 2 styles
  sectionCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  sectionHeaderText: {
    ...Typography.h4,
    color: Colors.text,
    fontFamily: Fonts.semiBold,
  },
  subsectionLabel: {
    ...Typography.bodyMedium,
    color: Colors.text,
    fontFamily: Fonts.semiBold,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  dateTimeRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  dateTimeInput: {
    flex: 1,
  },
  dateTimeLabel: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
    fontFamily: Fonts.medium,
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  datePickerError: {
    borderColor: Colors.error,
  },
  datePickerText: {
    ...Typography.body,
    color: Colors.text,
    flex: 1,
  },
  datePickerPlaceholder: {
    color: Colors.textTertiary,
  },
  dateExample: {
    ...Typography.caption,
    color: Colors.textTertiary,
    marginTop: 4,
    fontStyle: 'italic',
  },
  helperCard: {
    flexDirection: 'row',
    alignItems: 'center',

    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
    gap: Spacing.xs,
    marginTop: Spacing.sm,
  },
  helperCardText: {
    ...Typography.caption,
    color: Colors.info,
    flex: 1,
  },
  durationPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
    gap: Spacing.xs,
    marginTop: Spacing.sm,
  },
  durationText: {
    ...Typography.bodySmall,
    color: Colors.success,
    fontFamily: Fonts.semiBold,
  },
  subcategorySection: {
    marginTop: Spacing.lg,
  },
  subcategoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  subcategoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    gap: Spacing.xs,
  },
  subcategoryChipSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  subcategoryChipText: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
  },
  subcategoryChipTextSelected: {
    color: Colors.primary,
    fontFamily: Fonts.semiBold,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  // Custom Tags Section (for Trips)
  customTagsSection: {
    marginTop: Spacing.lg,
  },
  tagsHint: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
    marginTop: Spacing.xs,
  },
  customTagInputRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    alignItems: 'center',
  },
  customTagInputWrapper: {
    flex: 1,
  },
  customTagInputContainer: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.md,
    height: 48,
    justifyContent: 'center',
  },
  customTagTextInput: {
    fontSize: 16,
    color: Colors.text,
    padding: 0,
    margin: 0,
  },
  customTagInput: {
    marginBottom: 0,
  },
  addTagButton: {
    width: 50,
    height: 50,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addTagButtonDisabled: {
    backgroundColor: Colors.border,
    opacity: 0.6,
  },
  customTagsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  customTagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.primaryLight,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  customTagChipText: {
    fontSize: 14,
    color: Colors.primary,
    fontFamily: Fonts.semiBold,
  },
  // Trip-specific styles
  pickupContainer: {
    marginBottom: Spacing.md,
  },
  pickupInputRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  pickupInput: {
    flex: 1,
    marginBottom: 0,
  },
  pickupsList: {
    marginTop: Spacing.sm,
    gap: Spacing.xs,
  },
  pickupListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  pickupListItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flex: 1,
  },
  pickupNumberBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickupNumberText: {
    ...Typography.bodySmall,
    color: Colors.textInverse,
    fontFamily: Fonts.bold,
    fontSize: 12,
  },
  pickupListItemText: {
    ...Typography.body,
    color: Colors.text,
    flex: 1,
  },
  pickupDeleteButton: {
    padding: Spacing.xs,
  },
  pickupChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    gap: Spacing.xs,
  },
  pickupChipText: {
    ...Typography.bodySmall,
    color: Colors.primary,
    fontFamily: Fonts.medium,
  },
});
