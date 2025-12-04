import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
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

const CATEGORIES = [
  'Music',
  'Sports',
  'Art',
  'Food & Drink',
  'Tech',
  'Business',
  'Health & Wellness',
  'Education',
  'Entertainment',
  'Other',
];

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
    if (!locationName.trim()) newErrors.locationName = 'Location name is required';
    if (!startDate.trim()) newErrors.startDate = 'Start date is required';
    if (!startTime.trim()) newErrors.startTime = 'Start time is required';
    if (!endDate.trim()) newErrors.endDate = 'End date is required';
    if (!endTime.trim()) newErrors.endTime = 'End time is required';
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

  const handleCreateEvent = async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      // Combine date and time
      const startDateTime = new Date(`${startDate}T${startTime}`).toISOString();
      const endDateTime = new Date(`${endDate}T${endTime}`).toISOString();

      const eventData = {
        type: eventType,
        title: title.trim(),
        description: description.trim(),
        category,
        location_name: locationName.trim(),
        location_address: locationAddress.trim() || undefined,
        start_date: startDateTime,
        end_date: endDateTime,
        max_capacity: maxCapacity ? parseInt(maxCapacity, 10) : undefined,
        price: parseFloat(price) || 0,
        currency: 'INR',
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
                      onPress={() => setEventType(type.value)}
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
                  {CATEGORIES.map((cat) => (
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

                <Input
                  label="Venue Name"
                  placeholder="e.g., The Grand Hall"
                  value={locationName}
                  onChangeText={setLocationName}
                  error={errors.locationName}
                />

                <Input
                  label="Address (Optional)"
                  placeholder="Full address for directions"
                  value={locationAddress}
                  onChangeText={setLocationAddress}
                />

                <View style={styles.row}>
                  <View style={styles.halfInput}>
                    <Input
                      label="Start Date"
                      placeholder="YYYY-MM-DD"
                      value={startDate}
                      onChangeText={setStartDate}
                      error={errors.startDate}
                    />
                  </View>
                  <View style={styles.halfInput}>
                    <Input
                      label="Start Time"
                      placeholder="HH:MM"
                      value={startTime}
                      onChangeText={setStartTime}
                      error={errors.startTime}
                    />
                  </View>
                </View>

                <View style={styles.row}>
                  <View style={styles.halfInput}>
                    <Input
                      label="End Date"
                      placeholder="YYYY-MM-DD"
                      value={endDate}
                      onChangeText={setEndDate}
                      error={errors.endDate}
                    />
                  </View>
                  <View style={styles.halfInput}>
                    <Input
                      label="End Time"
                      placeholder="HH:MM"
                      value={endTime}
                      onChangeText={setEndTime}
                      error={errors.endTime}
                    />
                  </View>
                </View>

                <Text style={styles.helperText}>Use 24-hour format (e.g., 14:30 for 2:30 PM)</Text>
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
});
