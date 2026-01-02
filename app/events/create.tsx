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
  Dimensions,
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
import LocationAutocomplete from '../../src/components/LocationAutocomplete';
import { Colors } from '../../src/constants/Colors';
import { Spacing, Typography, BorderRadius } from '../../src/constants/Styles';
import { Fonts } from '../../src/constants/Fonts';
import { useAuth } from '../../src/contexts/auth-context';
import * as EventService from '../../src/services/event-service';

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
const _EVENT_CATEGORIES = [
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

// Main categories for Experiences with icons
const EXPERIENCE_MAIN_CATEGORIES = [
  {
    id: 'Cultural',
    label: 'Cultural',
    image: require('../../assets/categoriesicons/cultural/Cultural.png'),
    subcategories: [
      { id: 'Art', label: 'Art', image: require('../../assets/categoriesicons/cultural/Art.png') },
      {
        id: 'Dance',
        label: 'Dance',
        image: require('../../assets/categoriesicons/cultural/Dance.png'),
      },
      {
        id: 'Music',
        label: 'Music',
        image: require('../../assets/categoriesicons/cultural/Music.png'),
      },
    ],
  },
  {
    id: 'Nightlife',
    label: 'Nightlife',
    image: require('../../assets/categoriesicons/nightlife/Nightlife.png'),
    subcategories: [
      {
        id: 'DJ Night',
        label: 'DJ Night',
        image: require('../../assets/categoriesicons/nightlife/DJ Night.png'),
      },
      {
        id: 'House Party',
        label: 'House Party',
        image: require('../../assets/categoriesicons/nightlife/House Party.png'),
      },
      {
        id: 'Nightout',
        label: 'Nightout',
        image: require('../../assets/categoriesicons/nightlife/Nightout.png'),
      },
    ],
  },
  {
    id: 'Outdoors',
    label: 'Outdoors',
    image: require('../../assets/categoriesicons/outdoors/Outdoors.png'),
    subcategories: [
      {
        id: 'Camping',
        label: 'Camping',
        image: require('../../assets/categoriesicons/outdoors/Camping.png'),
      },
      {
        id: 'Cycling',
        label: 'Cycling',
        image: require('../../assets/categoriesicons/outdoors/Cycling.png'),
      },
      {
        id: 'Hiking',
        label: 'Hiking',
        image: require('../../assets/categoriesicons/outdoors/Hiking.png'),
      },
      {
        id: 'Walking',
        label: 'Walking',
        image: require('../../assets/categoriesicons/outdoors/Walking.png'),
      },
    ],
  },
  {
    id: 'Play',
    label: 'Play',
    image: require('../../assets/categoriesicons/play/Play.png'),
    subcategories: [
      {
        id: 'Board Game',
        label: 'Board Game',
        image: require('../../assets/categoriesicons/play/Board Game.png'),
      },
      {
        id: 'Gaming',
        label: 'Gaming',
        image: require('../../assets/categoriesicons/play/Gaming.png'),
      },
    ],
  },
  {
    id: 'Sports',
    label: 'Sports',
    image: require('../../assets/categoriesicons/sports/Sports.png'),
    subcategories: [
      {
        id: 'Badminton',
        label: 'Badminton',
        image: require('../../assets/categoriesicons/sports/Badminton.png'),
      },
      {
        id: 'Basketball',
        label: 'Basketball',
        image: require('../../assets/categoriesicons/sports/Basketball.png'),
      },
      {
        id: 'Cricket',
        label: 'Cricket',
        image: require('../../assets/categoriesicons/sports/Cricket.png'),
      },
      {
        id: 'Football',
        label: 'Football',
        image: require('../../assets/categoriesicons/sports/Football.png'),
      },
      {
        id: 'Pickleball',
        label: 'Pickleball',
        image: require('../../assets/categoriesicons/sports/Pickleball.png'),
      },
      {
        id: 'Volleyball',
        label: 'Volleyball',
        image: require('../../assets/categoriesicons/sports/Volleyball.png'),
      },
    ],
  },
  {
    id: 'Wellness',
    label: 'Wellness',
    image: require('../../assets/categoriesicons/wellness/Wellness.png'),
    subcategories: [
      {
        id: 'Meditation',
        label: 'Meditation',
        image: require('../../assets/categoriesicons/wellness/Meditation.png'),
      },
      {
        id: 'Yoga',
        label: 'Yoga',
        image: require('../../assets/categoriesicons/wellness/Yoga.png'),
      },
    ],
  },
];

// Main categories for Trips with icons
const TRIP_MAIN_CATEGORIES = [
  {
    id: 'Adventure',
    label: 'Adventure',
    image: require('../../assets/trips/Adventure.png'),
  },
  {
    id: 'Leisure',
    label: 'Leisure',
    image: require('../../assets/trips/Leisure.png'),
  },
  {
    id: 'Offbeat',
    label: 'Offbeat',
    image: require('../../assets/trips/Offbeat.png'),
  },
  {
    id: 'Spiritual',
    label: 'Spiritual',
    image: require('../../assets/trips/Spiritual.png'),
  },
  {
    id: 'Nature',
    label: 'Nature',
    image: require('../../assets/trips/Nature.png'),
  },
  {
    id: 'Festival',
    label: 'Festival',
    image: require('../../assets/trips/Festival.png'),
  },
  {
    id: 'Food & Culture',
    label: 'Food & Culture',
    image: require('../../assets/trips/Food.png'),
  },
  {
    id: 'Getaway',
    label: 'Getaway',
    image: require('../../assets/trips/Getaway.png'),
  },
];

const _EXPERIENCE_CATEGORIES = [
  'Cultural',
  'Games',
  'Entertainment',
  'Outdoors',
  'Nightlife',
  'Wellness',
  'Other',
];

const _TRIP_CATEGORIES = [
  'Adventure',
  'Leisure',
  'Offbeat',
  'Spiritual',
  'Nature',
  'Festival',
  'Food & Culture',
  'Getaway',
];

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
  const [step, setStep] = useState(0); // Start at 0 for intro screen

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
  const [locationLat, setLocationLat] = useState<number | null>(null);
  const [locationLng, setLocationLng] = useState<number | null>(null);
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
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    // Cover image is optional, so no validation needed
    return true;
  };

  const validateStep3 = () => {
    // Main category selection - required for experiences
    const newErrors: Record<string, string> = {};
    if (eventType === 'experience' && !category) {
      newErrors.category = 'Main category is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep4 = () => {
    // Subcategory selection - optional
    return true;
  };

  const validateStep5 = () => {
    // For trips: validate Date & Time (step 5 is Date & Time for trips)
    // For experiences: T&C and Cancellation Policy - optional
    if (eventType === 'trip') {
      const newErrors: Record<string, string> = {};

      // Check presence
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
        new Date(`${startDate}T${startTime}`) >= new Date(`${endDate}T${endTime}`)
      ) {
        newErrors.endDate = 'End date must be after start date';
      }

      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    }

    // For experiences: optional T&C step
    return true;
  };

  const validateStep6 = () => {
    const newErrors: Record<string, string> = {};

    // For experiences: validate Date & Time (step 6 is Date & Time for experiences)
    // For trips: validate Trip Details (location already validated in step 4)
    if (eventType === 'experience') {
      // Check presence
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
        new Date(`${startDate}T${startTime}`) >= new Date(`${endDate}T${endTime}`)
      ) {
        newErrors.endDate = 'End date must be after start date';
      }
    }

    // For trips: Trip Details step - no specific validation needed (all fields optional)

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep7 = () => {
    // Step 7 is Terms & Conditions for experiences (optional)
    // Step 7 is Trip Gallery for trips (optional)
    // No validation needed
    return true;
  };

  const validateStep8 = () => {
    // Trip gallery is optional, so no validation needed
    return true;
  };

  const getTotalSteps = () => {
    return eventType === 'trip' ? 9 : 8; // Trips have 9 steps, experiences have 8
  };

  const handleNextStep = () => {
    if (step === 0) {
      // From intro screen to title/description screen
      setStep(1);
    } else if (step === 1 && validateStep1()) {
      // From title/description to cover image
      setStep(2);
    } else if (step === 2 && validateStep2()) {
      // From cover image to main category selection
      setStep(3);
    } else if (step === 3 && validateStep3()) {
      // From main category to subcategory (experiences) or T&C (trips)
      setStep(4);
    } else if (step === 4 && validateStep4()) {
      // From subcategory to T&C (experiences) or Location (trips)
      setStep(5);
    } else if (step === 5 && validateStep5()) {
      // From T&C to Location (experiences) or Date & Time (trips)
      setStep(6);
    } else if (step === 6 && validateStep6()) {
      // From Location to Date & Time
      setStep(7);
    } else if (step === 7 && validateStep7()) {
      // From Date & Time to step 8 (Capacity for experiences, Gallery for trips)
      setStep(8);
    } else if (step === 8 && eventType === 'trip' && validateStep8()) {
      // From Trip Gallery (step 8) to Capacity & Pricing (step 9)
      setStep(9);
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
        location_lat: locationLat,
        location_lng: locationLng,
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
          title: 'Create Experience',
          headerBackTitle: '',
        }}
      />
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          {/* Progress Indicator - only show after intro screen */}
          {step > 0 && (
            <View style={styles.progressContainer}>
              {Array.from({ length: getTotalSteps() }, (_, i) => i + 1).map((s) => (
                <View key={s} style={[styles.progressDot, s <= step && styles.progressDotActive]} />
              ))}
            </View>
          )}

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Step 0: Intro Screen - What would you like to host? */}
            {step === 0 && (
              <View style={styles.introContainer}>
                <View style={styles.introCardsContainer}>
                  {EVENT_TYPES.map((type) => {
                    const hasPermission = canCreateEventType(type.value);
                    return (
                      <Pressable
                        key={type.value}
                        style={[
                          styles.introCard,
                          eventType === type.value && styles.introCardSelected,
                          !hasPermission && styles.introCardDisabled,
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
                            style={[
                              styles.introCardImage,
                              !hasPermission && styles.introCardImageDisabled,
                            ]}
                            resizeMode="contain"
                          />
                        ) : (
                          <Text
                            style={[
                              styles.introCardEmoji,
                              !hasPermission && styles.introCardEmojiDisabled,
                            ]}
                          >
                            {type.emoji}
                          </Text>
                        )}
                        <Text
                          style={[
                            styles.introCardLabel,
                            !hasPermission && styles.introCardLabelDisabled,
                          ]}
                        >
                          {type.label}
                        </Text>
                        {!hasPermission && (
                          <View style={styles.introCardLock}>
                            <Ionicons name="lock-closed" size={24} color={Colors.textTertiary} />
                          </View>
                        )}
                      </Pressable>
                    );
                  })}
                </View>

                {/* Host Type Badge */}
                {!isAdmin && profile?.host_type && getPermissionMessage() && (
                  <Card style={styles.introPermissionCard} variant="outlined">
                    <Ionicons name="information-circle" size={20} color={Colors.info} />
                    <Text style={styles.introPermissionText}>{getPermissionMessage()}</Text>
                  </Card>
                )}
              </View>
            )}

            {/* Step 1: Title & Description */}
            {step === 1 && (
              <View style={styles.descriptionContainer}>
                <Text style={styles.descriptionTitle}>
                  How would you like to describe your {eventType}?
                </Text>

                {/* Image Display */}
                <View style={styles.descriptionImageContainer}>
                  {EVENT_TYPES.find((t) => t.value === eventType)?.image && (
                    <Image
                      source={EVENT_TYPES.find((t) => t.value === eventType)!.image}
                      style={styles.descriptionImage}
                      resizeMode="contain"
                    />
                  )}
                  <Text style={styles.descriptionImageLabel}>
                    {EVENT_TYPES.find((t) => t.value === eventType)?.label}
                  </Text>
                </View>

                {/* Input Fields */}
                <View style={styles.descriptionInputsContainer}>
                  <Input
                    label="Title"
                    placeholder={`Give your ${eventType} a catchy name`}
                    value={title}
                    onChangeText={setTitle}
                    error={errors.title}
                  />

                  <Input
                    label="Description"
                    placeholder={`What's this ${eventType} about?`}
                    value={description}
                    onChangeText={setDescription}
                    multiline
                    numberOfLines={4}
                    error={errors.description}
                  />
                </View>
              </View>
            )}

            {/* Step 2: Cover Image */}
            {step === 2 && (
              <View style={styles.coverImageContainer}>
                <Text style={styles.coverImageTitle}>Add {eventType} cover image</Text>
                <Text style={styles.coverImageDescription}>
                  Choose a great photo that represents your {eventType}
                </Text>

                <View style={styles.coverImageUploadWrapper}>
                  <ImageUpload
                    label=""
                    onImageSelected={(url) => {
                      setCoverImageUrl(url);
                    }}
                    currentImageUrl={coverImageUrl}
                    bucket="event-images"
                    folder={`${eventType}s/${user?.id}`}
                  />
                </View>
              </View>
            )}

            {/* Step 3: Main Category Selection (Experiences Only) */}
            {step === 3 && eventType === 'experience' && (
              <View style={styles.categorySelectionContainer}>
                <Text style={styles.categorySelectionTitle}>Choose a category</Text>
                <Text style={styles.categorySelectionDescription}>
                  Select the category that best describes your experience
                </Text>

                <ScrollView
                  style={styles.categoryCardsScroll}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.categoryCardsContent}
                >
                  <View style={styles.categoryGrid}>
                    {EXPERIENCE_MAIN_CATEGORIES.map((mainCat) => (
                      <Pressable
                        key={mainCat.id}
                        style={[
                          styles.categoryCard,
                          category === mainCat.id && styles.categoryCardSelected,
                        ]}
                        onPress={() => {
                          setCategory(mainCat.id);
                          setSubcategories([]); // Reset subcategories when main category changes
                        }}
                      >
                        <Image
                          source={mainCat.image}
                          style={styles.categoryCardImage}
                          resizeMode="contain"
                        />
                        <Text style={styles.categoryCardLabel}>{mainCat.label}</Text>
                      </Pressable>
                    ))}
                  </View>
                </ScrollView>
                {errors.category && <Text style={styles.errorText}>{errors.category}</Text>}
              </View>
            )}

            {/* Step 3: Category Selection for Trips (no subcategories) */}
            {step === 3 && eventType === 'trip' && (
              <View style={styles.categorySelectionContainer}>
                <Text style={styles.categorySelectionTitle}>Choose a category</Text>
                <Text style={styles.categorySelectionDescription}>
                  Select the category that best describes your trip
                </Text>

                {/* Trip Category Grid */}
                <ScrollView
                  style={styles.categoryCardsScroll}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.categoryCardsContent}
                >
                  <View style={styles.categoryGrid}>
                    {TRIP_MAIN_CATEGORIES.map((cat) => (
                      <Pressable
                        key={cat.id}
                        style={[
                          styles.categoryCard,
                          category === cat.id && styles.categoryCardSelected,
                        ]}
                        onPress={() => setCategory(cat.id)}
                      >
                        <Image
                          source={cat.image}
                          style={styles.categoryCardImage}
                          resizeMode="contain"
                        />
                        <Text style={styles.categoryCardLabel}>{cat.label}</Text>
                      </Pressable>
                    ))}
                  </View>

                  {/* Custom Tags - For Trips */}
                  <View style={styles.tripTagsSection}>
                    <Text style={styles.tripTagsLabel}>Tags (Add multiple tags)</Text>
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
                </ScrollView>
                {errors.category && <Text style={styles.errorText}>{errors.category}</Text>}
              </View>
            )}

            {/* Step 4: Subcategory Selection (Experiences Only) */}
            {step === 4 && eventType === 'experience' && (
              <View style={styles.subcategorySelectionContainer}>
                <Text style={styles.subcategorySelectionTitle}>
                  {category ? `${category} - Choose subcategories` : 'Choose subcategories'}
                </Text>
                <Text style={styles.subcategorySelectionDescription}>
                  Select all the subcategories that apply to your experience
                </Text>

                <ScrollView
                  style={styles.subcategoryCardsScroll}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.subcategoryCardsContent}
                >
                  {category &&
                    EXPERIENCE_MAIN_CATEGORIES.find((c) => c.id === category)?.subcategories.map(
                      (subcat) => (
                        <Pressable
                          key={subcat.id}
                          style={[
                            styles.subcategoryCard,
                            subcategories.includes(subcat.id) && styles.subcategoryCardSelected,
                          ]}
                          onPress={() => {
                            if (subcategories.includes(subcat.id)) {
                              setSubcategories(subcategories.filter((s) => s !== subcat.id));
                            } else {
                              setSubcategories([...subcategories, subcat.id]);
                            }
                          }}
                        >
                          <Image
                            source={subcat.image}
                            style={styles.subcategoryCardImage}
                            resizeMode="contain"
                          />
                          <Text style={styles.subcategoryCardLabel}>{subcat.label}</Text>
                          {subcategories.includes(subcat.id) && (
                            <View style={styles.subcategoryCheckmark}>
                              <Ionicons name="checkmark-circle" size={24} color={Colors.primary} />
                            </View>
                          )}
                        </Pressable>
                      )
                    )}
                </ScrollView>
              </View>
            )}

            {/* Step 4: Location Details (Trips Only) */}
            {step === 4 && eventType === 'trip' && (
              <View style={styles.stepContainer}>
                <Text style={styles.stepTitle}>Location Details</Text>
                <Text style={styles.stepDescription}>Where is your {eventType} happening?</Text>

                <View style={styles.sectionCard}>
                  <View style={styles.sectionHeader}>
                    <Image
                      source={require('../../assets/others/location.png')}
                      style={styles.sectionHeaderIcon}
                      resizeMode="contain"
                    />
                    <Text style={styles.sectionHeaderText}>Venue Location</Text>
                  </View>

                  <LocationAutocomplete
                    label="Venue/Location"
                    placeholder="Search for a location..."
                    value={locationName}
                    onLocationSelect={(location) => {
                      setLocationName(location.name);
                      setLocationAddress(location.address);
                      setLocationLat(location.lat);
                      setLocationLng(location.lng);
                      setErrors((prev) => ({ ...prev, locationName: '' }));
                    }}
                    error={errors.locationName}
                  />

                  {locationAddress && (
                    <View style={styles.addressPreview}>
                      <Image
                        source={require('../../assets/others/location.png')}
                        style={{ width: 16, height: 16, marginRight: 8 }}
                        resizeMode="contain"
                      />
                      <Text style={styles.addressPreviewText} numberOfLines={2}>
                        {locationAddress}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            )}

            {/* Step 5: Location Details (Experiences Only) */}
            {step === 5 && eventType === 'experience' && (
              <View style={styles.stepContainer}>
                <Text style={styles.stepTitle}>Location Details</Text>
                <Text style={styles.stepDescription}>Where is your experience happening?</Text>

                {/* Location Section */}
                <View style={styles.sectionCard}>
                  <View style={styles.sectionHeader}>
                    <Image
                      source={require('../../assets/others/location.png')}
                      style={styles.sectionHeaderIcon}
                      resizeMode="contain"
                    />
                    <Text style={styles.sectionHeaderText}>Venue Location</Text>
                  </View>

                  <LocationAutocomplete
                    label="Venue/Location"
                    placeholder="Search for a location..."
                    value={locationName}
                    onLocationSelect={(location) => {
                      setLocationName(location.name);
                      setLocationAddress(location.address);
                      setLocationLat(location.lat);
                      setLocationLng(location.lng);
                      setErrors((prev) => ({ ...prev, locationName: '' }));
                    }}
                    error={errors.locationName}
                  />

                  {locationAddress && (
                    <View style={styles.addressPreview}>
                      <Image
                        source={require('../../assets/others/location.png')}
                        style={{ width: 16, height: 16, marginRight: 8 }}
                        resizeMode="contain"
                      />
                      <Text style={styles.addressPreviewText} numberOfLines={2}>
                        {locationAddress}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            )}

            {/* Step 5: Date & Time (Trips Only) */}
            {step === 5 && eventType === 'trip' && (
              <View style={styles.stepContainer}>
                <Text style={styles.stepTitle}>Date & Time</Text>
                <Text style={styles.stepDescription}>When is your {eventType} happening?</Text>

                {/* Things to Know - for Experiences (moved to top) */}
                {eventType !== 'trip' && (
                  <View style={styles.sectionCard}>
                    <View style={styles.sectionHeader}>
                      <Image
                        source={require('../../assets/others/info.png')}
                        style={styles.sectionHeaderIcon}
                        resizeMode="contain"
                      />
                      <Text style={styles.sectionHeaderText}>Things to Know</Text>
                    </View>

                    <ThingsToKnowBuilder value={thingsToKnow} onChange={setThingsToKnow} />
                  </View>
                )}

                {/* Date & Time Section */}
                <View style={styles.sectionCard}>
                  <View style={styles.sectionHeader}>
                    <Image
                      source={require('../../assets/others/dateandtime.png')}
                      style={styles.sectionHeaderIcon}
                      resizeMode="contain"
                    />
                    <Text style={styles.sectionHeaderText}>Schedule</Text>
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
                        <Image
                          source={require('../../assets/others/dateandtime.png')}
                          style={{ width: 24, height: 24 }}
                          resizeMode="contain"
                        />
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
                        <Image
                          source={require('../../assets/others/time.png')}
                          style={{ width: 24, height: 24 }}
                          resizeMode="contain"
                        />
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
                        <Image
                          source={require('../../assets/others/dateandtime.png')}
                          style={{ width: 24, height: 24 }}
                          resizeMode="contain"
                        />
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
                        <Image
                          source={require('../../assets/others/time.png')}
                          style={{ width: 24, height: 24 }}
                          resizeMode="contain"
                        />
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
                        <Image
                          source={require('../../assets/others/dateandtime.png')}
                          style={{ width: 24, height: 24 }}
                          resizeMode="contain"
                        />
                        <Text style={styles.durationText}>
                          Duration: {calculateDuration(startDate, startTime, endDate, endTime)}
                        </Text>
                      </View>
                    )}
                </View>
              </View>
            )}

            {/* Step 6: Date & Time (Experiences Only) */}
            {step === 6 && eventType === 'experience' && (
              <View style={styles.stepContainer}>
                <Text style={styles.stepTitle}>Date & Time</Text>
                <Text style={styles.stepDescription}>When is your experience happening?</Text>

                {/* Things to Know - for Experiences */}
                <View style={styles.sectionCard}>
                  <View style={styles.sectionHeader}>
                    <Image
                      source={require('../../assets/others/info.png')}
                      style={styles.sectionHeaderIcon}
                      resizeMode="contain"
                    />
                    <Text style={styles.sectionHeaderText}>Things to Know</Text>
                  </View>

                  <ThingsToKnowBuilder value={thingsToKnow} onChange={setThingsToKnow} />
                </View>

                {/* Date & Time Section */}
                <View style={styles.sectionCard}>
                  <View style={styles.sectionHeader}>
                    <Image
                      source={require('../../assets/others/dateandtime.png')}
                      style={styles.sectionHeaderIcon}
                      resizeMode="contain"
                    />
                    <Text style={styles.sectionHeaderText}>Schedule</Text>
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
                        <Image
                          source={require('../../assets/others/dateandtime.png')}
                          style={{ width: 24, height: 24 }}
                          resizeMode="contain"
                        />
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
                        <Image
                          source={require('../../assets/others/time.png')}
                          style={{ width: 24, height: 24 }}
                          resizeMode="contain"
                        />
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
                        <Image
                          source={require('../../assets/others/dateandtime.png')}
                          style={{ width: 24, height: 24 }}
                          resizeMode="contain"
                        />
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
                        <Image
                          source={require('../../assets/others/time.png')}
                          style={{ width: 24, height: 24 }}
                          resizeMode="contain"
                        />
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
                        <Image
                          source={require('../../assets/others/dateandtime.png')}
                          style={{ width: 24, height: 24 }}
                          resizeMode="contain"
                        />
                        <Text style={styles.durationText}>
                          Duration: {calculateDuration(startDate, startTime, endDate, endTime)}
                        </Text>
                      </View>
                    )}
                </View>
              </View>
            )}

            {/* Step 6: Trip Details (only for trips) */}
            {step === 6 && eventType === 'trip' && (
              <View style={styles.stepContainer}>
                <Text style={styles.stepTitle}>Trip Details</Text>
                <Text style={styles.stepDescription}>
                  Additional information specific to your trip
                </Text>

                {/* Departure Location */}
                <View style={styles.sectionCard}>
                  <View style={styles.sectionHeader}>
                    <Image
                      source={require('../../assets/others/location.png')}
                      style={styles.sectionHeaderIcon}
                      resizeMode="contain"
                    />
                    <Text style={styles.sectionHeaderText}>Departure & Pickups</Text>
                  </View>

                  <LocationAutocomplete
                    label="Departure Location"
                    placeholder="Search for departure location..."
                    value={departureLocation}
                    onLocationSelect={(location) => {
                      setDepartureLocation(location.name);
                      setErrors((prev) => ({ ...prev, departureLocation: '' }));
                    }}
                    error={errors.departureLocation}
                  />

                  {/* Pickups */}
                  <Text style={styles.inputLabel}>Pickup Points (Optional)</Text>
                  <View style={styles.pickupContainer}>
                    <View style={styles.pickupInputRow}>
                      <View style={styles.pickupInput}>
                        <LocationAutocomplete
                          placeholder="Search for pickup location..."
                          value={pickupInput}
                          onLocationSelect={(location) => {
                            setPickupInput(location.name);
                          }}
                        />
                      </View>
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
                    <Image
                      source={require('../../assets/others/info.png')}
                      style={styles.sectionHeaderIcon}
                      resizeMode="contain"
                    />
                    <Text style={styles.sectionHeaderText}>Things to Know</Text>
                  </View>

                  <ThingsToKnowBuilder value={thingsToKnow} onChange={setThingsToKnow} />
                </View>
              </View>
            )}

            {/* Step 7: Trip Gallery (only for trips) */}
            {step === 7 && eventType === 'trip' && (
              <View style={styles.coverImageContainer}>
                <Text style={styles.coverImageTitle}>Trip Gallery</Text>
                <Text style={styles.coverImageDescription}>
                  Add photos that showcase your trip experience
                </Text>

                <View style={styles.coverImageUploadWrapper}>
                  <MultiImageUpload
                    maxImages={5}
                    onImagesChange={setTripImages}
                    currentImages={tripImages}
                    bucket="event-images"
                    folder={`trips/${user?.id}`}
                  />

                  <View style={styles.helperCard}>
                    <Ionicons name="information-circle" size={16} color={Colors.info} />
                    <Text style={styles.helperCardText}>
                      Add up to 5 images to give users a better idea of what to expect on this trip
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {/* Step 7: Terms & Conditions (Experiences Only) - Second to Last */}
            {step === 7 && eventType === 'experience' && (
              <View style={styles.additionalInfoContainer}>
                <Text style={styles.additionalInfoTitle}>Terms & Policies</Text>
                <Text style={styles.additionalInfoDescription}>
                  Add terms and conditions for your experience
                </Text>

                <View style={styles.additionalInfoContent}>
                  <Input
                    label="Terms & Conditions (Optional)"
                    placeholder="Add any terms and conditions for this experience..."
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
                </View>
              </View>
            )}

            {/* Step 8: Capacity & Pricing (Experiences Only) */}
            {step === 8 && eventType === 'experience' && (
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

            {/* Step 8: Terms & Conditions (Trips Only) - Second to Last */}
            {step === 8 && eventType === 'trip' && (
              <View style={styles.additionalInfoContainer}>
                <Text style={styles.additionalInfoTitle}>Terms & Policies</Text>
                <Text style={styles.additionalInfoDescription}>
                  Add terms and conditions for your trip
                </Text>

                <View style={styles.additionalInfoContent}>
                  <Input
                    label="Terms & Conditions (Optional)"
                    placeholder="Add any terms and conditions for this trip..."
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
                </View>
              </View>
            )}

            {/* Step 9: Capacity & Pricing (Trips Only) */}
            {step === 9 && eventType === 'trip' && (
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
            {step > 0 && (
              <Button
                title="Back"
                onPress={() => setStep(step - 1)}
                variant="outline"
                style={styles.footerButton}
              />
            )}
            {step === 0 ? (
              <Button
                title="Next"
                onPress={handleNextStep}
                variant="primary"
                disabled={!eventType}
                style={styles.footerButtonFull}
              />
            ) : step < getTotalSteps() ? (
              <Button
                title="Next"
                onPress={handleNextStep}
                variant="primary"
                style={[styles.footerButton, step === 0 && styles.footerButtonFull]}
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

const { width: _SCREEN_WIDTH } = Dimensions.get('window');
const _CARD_PADDING = Spacing.lg * 2; // Total horizontal padding in ScrollView (left + right)
const _CARD_GAP = Spacing.md; // Gap between cards (16px)

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
    backgroundColor: Colors.text,
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
    borderColor: Colors.text,
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
  sectionHeaderIcon: {
    width: 24,
    height: 24,
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
    borderColor: Colors.text,
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
    borderColor: Colors.text,
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
    borderColor: Colors.text,
  },
  customTagChipText: {
    fontSize: 14,
    color: Colors.primary,
    fontFamily: Fonts.semiBold,
  },
  // Trip tags section (below category grid)
  tripTagsSection: {
    marginTop: Spacing.xl,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
    width: '100%',
  },
  tripTagsLabel: {
    fontSize: 16,
    fontFamily: Fonts.semiBold,
    color: Colors.text,
    marginBottom: Spacing.sm,
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
  addressPreview: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.surfaceSecondary,
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    marginTop: Spacing.sm,
  },
  addressPreviewText: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    flex: 1,
    lineHeight: 20,
  },
  // Intro Screen Styles
  introContainer: {
    flex: 1,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  introCardsContainer: {
    gap: Spacing.lg,
    width: '100%',
    maxWidth: 280,
    alignSelf: 'center',
  },
  introCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    borderColor: Colors.border,
    padding: Spacing.xl,
    paddingVertical: Spacing.xxl || Spacing.xl * 2,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
  },
  introCardSelected: {
    borderColor: '#000000',
    borderWidth: 2,
  },
  introCardDisabled: {
    opacity: 0.5,
    backgroundColor: Colors.surfaceSecondary,
  },
  introCardLabel: {
    ...Typography.h3,
    fontSize: 20,
    color: Colors.text,
    fontFamily: Fonts.semiBold,
    textAlign: 'center',
  },
  introCardLabelDisabled: {
    color: Colors.textTertiary,
  },
  introCardImage: {
    width: 90,
    height: 90,
  },
  introCardImageDisabled: {
    opacity: 0.4,
  },
  introCardEmoji: {
    fontSize: 64,
  },
  introCardEmojiDisabled: {
    opacity: 0.4,
  },
  introCardLock: {
    position: 'absolute',
    top: Spacing.md,
    right: Spacing.md,
  },
  introPermissionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
    marginTop: Spacing.xl,
    backgroundColor: Colors.infoLight,
    borderColor: Colors.info,
  },
  introPermissionText: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    flex: 1,
  },
  // Description Screen Styles (Step 1)
  descriptionContainer: {
    flex: 1,
    alignItems: 'center',
    paddingTop: Spacing.xl,
  },
  descriptionTitle: {
    ...Typography.h2,
    fontSize: 24,
    color: Colors.text,
    marginBottom: Spacing.xxl || Spacing.xl * 2,
    textAlign: 'center',
    fontFamily: Fonts.semiBold,
    paddingHorizontal: Spacing.md,
  },
  descriptionImageContainer: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xxl || Spacing.xl * 2,
    marginBottom: Spacing.xxl || Spacing.xl * 2,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  descriptionImage: {
    width: 120,
    height: 120,
    marginBottom: Spacing.md,
  },
  descriptionImageLabel: {
    ...Typography.body,
    fontSize: 16,
    color: Colors.text,
    fontFamily: Fonts.medium,
  },
  descriptionInputsContainer: {
    width: '100%',
    gap: Spacing.md,
  },
  // Cover Image Screen Styles (Step 2)
  coverImageContainer: {
    flex: 1,
    alignItems: 'center',
    paddingTop: Spacing.xl,
  },
  coverImageTitle: {
    ...Typography.h2,
    fontSize: 24,
    color: Colors.text,
    marginBottom: Spacing.md,
    textAlign: 'center',
    fontFamily: Fonts.semiBold,
    paddingHorizontal: Spacing.md,
  },
  coverImageDescription: {
    ...Typography.body,
    fontSize: 16,
    color: Colors.textSecondary,
    marginBottom: Spacing.xxl || Spacing.xl * 2,
    textAlign: 'center',
    paddingHorizontal: Spacing.lg,
  },
  coverImageUploadWrapper: {
    width: '100%',
  },
  // Additional Info Screen Styles (Step 3)
  additionalInfoContainer: {
    flex: 1,
    alignItems: 'center',
    paddingTop: Spacing.xl,
  },
  additionalInfoTitle: {
    ...Typography.h2,
    fontSize: 24,
    color: Colors.text,
    marginBottom: Spacing.md,
    textAlign: 'center',
    fontFamily: Fonts.semiBold,
    paddingHorizontal: Spacing.md,
  },
  additionalInfoDescription: {
    ...Typography.body,
    fontSize: 16,
    color: Colors.textSecondary,
    marginBottom: Spacing.xxl || Spacing.xl * 2,
    textAlign: 'center',
    paddingHorizontal: Spacing.lg,
  },
  additionalInfoContent: {
    width: '100%',
  },
  // Category Selection Screen Styles (Step 3 for Experiences)
  categorySelectionContainer: {
    flex: 1,
    alignItems: 'center',
    paddingTop: Spacing.xl,
  },
  categorySelectionTitle: {
    ...Typography.h2,
    fontSize: 24,
    color: Colors.text,
    marginBottom: Spacing.md,
    textAlign: 'center',
    fontFamily: Fonts.semiBold,
    paddingHorizontal: Spacing.md,
  },
  categorySelectionDescription: {
    ...Typography.body,
    fontSize: 16,
    color: Colors.textSecondary,
    marginBottom: Spacing.xl,
    textAlign: 'center',
    paddingHorizontal: Spacing.lg,
  },
  categoryCardsScroll: {
    flex: 1,
    width: '100%',
  },
  categoryCardsContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  categoryCard: {
    width: '47%', // Use percentage instead of calculated width for better 2-column grid
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    borderColor: Colors.border,
    padding: Spacing.lg,
    alignItems: 'center',
    marginBottom: Spacing.md,
    minHeight: 180,
    justifyContent: 'center',
  },
  categoryCardSelected: {
    borderColor: '#000000',
    backgroundColor: Colors.surfaceSecondary,
  },
  categoryCardImage: {
    width: 80,
    height: 80,
    marginBottom: Spacing.md,
  },
  categoryCardLabel: {
    ...Typography.bodyMedium,
    fontSize: 14,
    color: Colors.text,
    fontFamily: Fonts.semiBold,
    textAlign: 'center',
  },
  // Subcategory Selection Screen Styles (Step 4 for Experiences)
  subcategorySelectionContainer: {
    flex: 1,
    paddingTop: Spacing.xl,
    paddingHorizontal: Spacing.lg,
  },
  subcategorySelectionTitle: {
    ...Typography.h2,
    fontSize: 24,
    color: Colors.text,
    marginBottom: Spacing.md,
    textAlign: 'center',
    fontFamily: Fonts.semiBold,
  },
  subcategorySelectionDescription: {
    ...Typography.body,
    fontSize: 16,
    color: Colors.textSecondary,
    marginBottom: Spacing.xl,
    textAlign: 'center',
  },
  subcategoryCardsScroll: {
    flex: 1,
  },
  subcategoryCardsContent: {
    paddingBottom: Spacing.xl,
    gap: Spacing.md,
  },
  subcategoryCard: {
    width: '100%',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    borderColor: Colors.border,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.sm,
    position: 'relative',
  },
  subcategoryCardSelected: {
    borderColor: Colors.text,
    backgroundColor: Colors.surfaceSecondary,
  },
  subcategoryCardImage: {
    width: 60,
    height: 60,
  },
  subcategoryCardLabel: {
    ...Typography.bodyLarge,
    fontSize: 16,
    color: Colors.text,
    fontFamily: Fonts.medium,
    flex: 1,
  },
  subcategoryCheckmark: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
  },
});
