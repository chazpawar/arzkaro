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
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Button from '../../src/components/ui/button';
import Card from '../../src/components/ui/card';
import Input from '../../src/components/ui/input';
import { Colors } from '../../src/constants/colors';
import { Spacing, Typography, BorderRadius } from '../../src/constants/styles';
import { useAuth } from '../../src/contexts/auth-context';
import * as EventService from '../../src/services/event-service';

type EventType = 'event' | 'experience' | 'trip';

const EVENT_TYPES: { value: EventType; label: string; emoji: string }[] = [
  { value: 'event', label: 'Event', emoji: '🎉' },
  { value: 'experience', label: 'Experience', emoji: '✨' },
  { value: 'trip', label: 'Trip', emoji: '🏔️' },
];

// Type-specific categories
const EVENT_CATEGORIES = [
  'Concert',
  'Festival',
  'Conference',
  'Workshop',
  'Seminar',
  'Networking',
  'Sports Event',
  'Exhibition',
  'Party',
  'Other',
];

const EXPERIENCE_CATEGORIES = [
  'Adventure',
  'Food & Dining',
  'Art & Culture',
  'Wellness & Spa',
  'Learning',
  'Entertainment',
  'Photography',
  'Wine Tasting',
  'Outdoor Activity',
  'Other',
];

const TRIP_CATEGORIES = [
  'Beach Trip',
  'Mountain Trek',
  'City Tour',
  'Road Trip',
  'Camping',
  'Safari',
  'Cruise',
  'Historical Tour',
  'Pilgrimage',
  'Other',
];

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
  const { user, isHost, isAdmin } = useAuth();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);

  // Form state
  const [eventType, setEventType] = useState<EventType>('event');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [locationName, setLocationName] = useState('');
  const [locationAddress, setLocationAddress] = useState('');
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('');
  const [maxCapacity, setMaxCapacity] = useState('');
  const [price, setPrice] = useState('0');

  // Validation
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Redirect non-hosts
  if (!isHost && !isAdmin) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.notHostContainer}>
          <Text style={styles.notHostIcon}>🚫</Text>
          <Text style={styles.notHostTitle}>Host Access Required</Text>
          <Text style={styles.notHostText}>You need to be an approved host to create events.</Text>
          <Button
            title="Apply to Become a Host"
            onPress={() => router.push('/host/request')}
            variant="primary"
          />
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

  const handleNextStep = () => {
    if (step === 1 && validateStep1()) {
      setStep(2);
    } else if (step === 2 && validateStep2()) {
      setStep(3);
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

  // Quick date templates
  const fillTomorrow = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split('T')[0];
    setStartDate(dateStr);
    setEndDate(dateStr);
    setStartTime('10:00');
    setEndTime('18:00');
  };

  const fillNextWeekend = () => {
    const today = new Date();
    const daysUntilSaturday = (6 - today.getDay() + 7) % 7 || 7;
    const saturday = new Date(today);
    saturday.setDate(today.getDate() + daysUntilSaturday);
    const dateStr = saturday.toISOString().split('T')[0];
    setStartDate(dateStr);
    setEndDate(dateStr);
    setStartTime('10:00');
    setEndTime('18:00');
  };

  const fillNextMonth = () => {
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    nextMonth.setDate(1);
    const dateStr = nextMonth.toISOString().split('T')[0];
    setStartDate(dateStr);
    setEndDate(dateStr);
    setStartTime('10:00');
    setEndTime('18:00');
  };

  const handleCreateEvent = async () => {
    if (!user?.id) return;

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

      const eventData = {
        type: eventType,
        title: title.trim(),
        description: description.trim(),
        category,
        location_name: locationName.trim(),
        location_address: locationAddress.trim() || undefined,
        start_date: startDateTime.toISOString(),
        end_date: endDateTime.toISOString(),
        max_capacity: maxCapacity ? parseInt(maxCapacity, 10) : undefined,
        price: parseFloat(price) || 0,
        currency: 'INR',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
        images: [],
        tags: [],
      };

      const event = await EventService.createEvent(eventData, user.id);

      Alert.alert(
        'Event Created!',
        'Your event has been created as a draft. Would you like to publish it now?',
        [
          {
            text: 'Keep as Draft',
            style: 'cancel',
            onPress: () => router.replace('/host/dashboard'),
          },
          {
            text: 'Publish Now',
            onPress: async () => {
              await EventService.publishEvent(event.id);
              router.replace(`/events/${event.id}`);
            },
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
          headerBackTitle: 'Cancel',
        }}
      />
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          {/* Progress Indicator */}
          <View style={styles.progressContainer}>
            {[1, 2, 3].map((s) => (
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

                {/* Event Type Selection */}
                <View style={styles.typeSelector}>
                  {EVENT_TYPES.map((type) => (
                    <Card
                      key={type.value}
                      style={[styles.typeCard, eventType === type.value && styles.typeCardSelected]}
                      onPress={() => {
                        setEventType(type.value);
                        setCategory(''); // Reset category when type changes
                      }}
                    >
                      <Text style={styles.typeEmoji}>{type.emoji}</Text>
                      <Text
                        style={[
                          styles.typeLabel,
                          eventType === type.value && styles.typeLabelSelected,
                        ]}
                      >
                        {type.label}
                      </Text>
                    </Card>
                  ))}
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

                <Text style={styles.inputLabel}>Category</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.categoryScroll}
                >
                  {getCategoriesForType(eventType).map((cat) => (
                    <Card
                      key={cat}
                      style={[styles.categoryChip, category === cat && styles.categoryChipSelected]}
                      onPress={() => setCategory(cat)}
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
              </View>
            )}

            {/* Step 2: Location & Time */}
            {step === 2 && (
              <View style={styles.stepContainer}>
                <Text style={styles.stepTitle}>Location & Time</Text>
                <Text style={styles.stepDescription}>When and where is it happening?</Text>

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
                      <Input
                        placeholder="YYYY-MM-DD"
                        value={startDate}
                        onChangeText={setStartDate}
                        error={errors.startDate}
                      />
                      <Text style={styles.dateExample}>e.g., 2025-12-25</Text>
                    </View>
                    <View style={styles.dateTimeInput}>
                      <Text style={styles.dateTimeLabel}>Time</Text>
                      <Input
                        placeholder="HH:MM"
                        value={startTime}
                        onChangeText={setStartTime}
                        error={errors.startTime}
                      />
                      <Text style={styles.dateExample}>e.g., 14:30</Text>
                    </View>
                  </View>

                  {/* End Date/Time */}
                  <Text style={styles.subsectionLabel}>End</Text>
                  <View style={styles.dateTimeRow}>
                    <View style={styles.dateTimeInput}>
                      <Text style={styles.dateTimeLabel}>Date</Text>
                      <Input
                        placeholder="YYYY-MM-DD"
                        value={endDate}
                        onChangeText={setEndDate}
                        error={errors.endDate}
                      />
                      <Text style={styles.dateExample}>e.g., 2025-12-25</Text>
                    </View>
                    <View style={styles.dateTimeInput}>
                      <Text style={styles.dateTimeLabel}>Time</Text>
                      <Input
                        placeholder="HH:MM"
                        value={endTime}
                        onChangeText={setEndTime}
                        error={errors.endTime}
                      />
                      <Text style={styles.dateExample}>e.g., 18:00</Text>
                    </View>
                  </View>

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

                {/* Quick Date Templates */}
                <View style={styles.templateSection}>
                  <Text style={styles.templateTitle}>Quick Templates</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <Pressable style={styles.templateChip} onPress={() => fillTomorrow()}>
                      <Ionicons name="calendar-outline" size={16} color={Colors.primary} />
                      <Text style={styles.templateChipText}>Tomorrow</Text>
                    </Pressable>
                    <Pressable style={styles.templateChip} onPress={() => fillNextWeekend()}>
                      <Ionicons name="calendar-outline" size={16} color={Colors.primary} />
                      <Text style={styles.templateChipText}>Next Weekend</Text>
                    </Pressable>
                    <Pressable style={styles.templateChip} onPress={() => fillNextMonth()}>
                      <Ionicons name="calendar-outline" size={16} color={Colors.primary} />
                      <Text style={styles.templateChipText}>Next Month</Text>
                    </Pressable>
                  </ScrollView>
                </View>
              </View>
            )}

            {/* Step 3: Capacity & Pricing */}
            {step === 3 && (
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

                {parseFloat(price) === 0 && (
                  <View style={styles.freeEventNote}>
                    <Text style={styles.freeEventNoteText}>🎉 This will be a free event!</Text>
                  </View>
                )}

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
            {step < 3 ? (
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
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  typeEmoji: {
    fontSize: 28,
    marginBottom: Spacing.xs,
  },
  typeLabel: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
  },
  typeLabelSelected: {
    color: Colors.primary,
    fontWeight: '600',
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
    fontWeight: '600',
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
    fontWeight: '600',
  },
  subsectionLabel: {
    ...Typography.bodyMedium,
    color: Colors.text,
    fontWeight: '600',
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
    fontWeight: '500',
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
    backgroundColor: Colors.infoLight,
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
    backgroundColor: Colors.successLight,
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
    gap: Spacing.xs,
    marginTop: Spacing.sm,
  },
  durationText: {
    ...Typography.bodySmall,
    color: Colors.success,
    fontWeight: '600',
  },
  templateSection: {
    marginTop: Spacing.md,
  },
  templateTitle: {
    ...Typography.bodyMedium,
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  templateChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    marginRight: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.xs,
  },
  templateChipText: {
    ...Typography.bodySmall,
    color: Colors.primary,
    fontWeight: '500',
  },
});
