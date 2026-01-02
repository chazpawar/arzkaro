import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput as RNTextInput,
  ScrollView,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { Spacing, BorderRadius } from '../constants/Styles';
import { Fonts } from '../constants/Fonts';
import Button from './ui/button';
import Card from './ui/card';

export interface ItineraryDay {
  day: number;
  title: string;
  activities: string[];
}

interface ItineraryBuilderProps {
  value: ItineraryDay[];
  onChange: (days: ItineraryDay[]) => void;
}

export default function ItineraryBuilder({ value, onChange }: ItineraryBuilderProps) {
  const [days, setDays] = useState<ItineraryDay[]>(value.length > 0 ? value : []);

  const addDay = () => {
    const newDay: ItineraryDay = {
      day: days.length + 1,
      title: `Day ${days.length + 1}`,
      activities: [''],
    };
    const updated = [...days, newDay];
    setDays(updated);
    onChange(updated);
  };

  const removeDay = (index: number) => {
    const updated = days.filter((_, i) => i !== index);
    // Re-number days
    const renumbered = updated.map((day, i) => ({
      ...day,
      day: i + 1,
      title: day.title.replace(/Day \d+/, `Day ${i + 1}`),
    }));
    setDays(renumbered);
    onChange(renumbered);
  };

  const updateDayTitle = (index: number, title: string) => {
    const updated = [...days];
    updated[index] = { ...updated[index], title };
    setDays(updated);
    onChange(updated);
  };

  const addActivity = (dayIndex: number) => {
    const updated = [...days];
    updated[dayIndex].activities.push('');
    setDays(updated);
    onChange(updated);
  };

  const updateActivity = (dayIndex: number, activityIndex: number, text: string) => {
    const updated = [...days];
    updated[dayIndex].activities[activityIndex] = text;
    setDays(updated);
    onChange(updated);
  };

  const removeActivity = (dayIndex: number, activityIndex: number) => {
    const updated = [...days];
    updated[dayIndex].activities = updated[dayIndex].activities.filter(
      (_, i) => i !== activityIndex
    );
    setDays(updated);
    onChange(updated);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Trip Itinerary</Text>
        <Button title="Add Day" onPress={addDay} variant="outline" size="small" />
      </View>

      {days.length === 0 ? (
        <Card style={styles.emptyCard} variant="outlined">
          <Image
            source={require('../../assets/others/dateandtime.png')}
            style={{ width: 64, height: 64, opacity: 0.3 }}
            resizeMode="contain"
          />
          <Text style={styles.emptyText}>No itinerary added yet</Text>
          <Text style={styles.emptySubtext}>
            Tap &quot;Add Day&quot; to start building your itinerary
          </Text>
        </Card>
      ) : (
        <ScrollView style={styles.daysContainer} nestedScrollEnabled>
          {days.map((day, dayIndex) => (
            <Card key={dayIndex} style={styles.dayCard}>
              {/* Day Header */}
              <View style={styles.dayHeader}>
                <View style={styles.dayNumberBadge}>
                  <Text style={styles.dayNumberText}>{day.day}</Text>
                </View>
                <RNTextInput
                  style={styles.dayTitleInput}
                  value={day.title}
                  onChangeText={(text) => updateDayTitle(dayIndex, text)}
                  placeholder={`Day ${day.day} Title`}
                  placeholderTextColor={Colors.textTertiary}
                />
                <Pressable onPress={() => removeDay(dayIndex)} hitSlop={8}>
                  <Ionicons name="trash-outline" size={20} color={Colors.error} />
                </Pressable>
              </View>

              {/* Activities */}
              <View style={styles.activitiesContainer}>
                <Text style={styles.activitiesLabel}>Activities:</Text>
                {day.activities.map((activity, activityIndex) => (
                  <View key={activityIndex} style={styles.activityRow}>
                    <Ionicons
                      name="ellipse"
                      size={6}
                      color={Colors.textSecondary}
                      style={styles.bulletPoint}
                    />
                    <RNTextInput
                      style={styles.activityInput}
                      value={activity}
                      onChangeText={(text) => updateActivity(dayIndex, activityIndex, text)}
                      placeholder="Add activity..."
                      placeholderTextColor={Colors.textTertiary}
                      multiline
                    />
                    {day.activities.length > 1 && (
                      <Pressable
                        onPress={() => removeActivity(dayIndex, activityIndex)}
                        hitSlop={8}
                      >
                        <Ionicons name="close-circle" size={18} color={Colors.textTertiary} />
                      </Pressable>
                    )}
                  </View>
                ))}

                <Pressable style={styles.addActivityButton} onPress={() => addActivity(dayIndex)}>
                  <Ionicons name="add-circle-outline" size={20} color={Colors.primary} />
                  <Text style={styles.addActivityText}>Add Activity</Text>
                </Pressable>
              </View>
            </Card>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  headerTitle: {
    fontSize: 17,
    fontFamily: Fonts.semiBold,
    color: Colors.text,
  },
  emptyCard: {
    padding: Spacing.xl,
    alignItems: 'center',
    gap: Spacing.sm,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: Fonts.semiBold,
    color: Colors.textSecondary,
  },
  emptySubtext: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    color: Colors.textTertiary,
    textAlign: 'center',
  },
  daysContainer: {
    maxHeight: 500,
  },
  dayCard: {
    padding: Spacing.md,
    marginBottom: Spacing.md,
    backgroundColor: Colors.surface,
  },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  dayNumberBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayNumberText: {
    fontSize: 14,
    fontFamily: Fonts.bold,
    color: Colors.textInverse,
  },
  dayTitleInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: Fonts.semiBold,
    color: Colors.text,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  activitiesContainer: {
    gap: Spacing.xs,
  },
  activitiesLabel: {
    fontSize: 14,
    fontFamily: Fonts.medium,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  bulletPoint: {
    marginTop: 12,
  },
  activityInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: Fonts.regular,
    color: Colors.text,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    minHeight: 40,
  },
  addActivityButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.primaryLight,
    borderRadius: BorderRadius.md,
    alignSelf: 'flex-start',
    marginTop: Spacing.xs,
  },
  addActivityText: {
    fontSize: 14,
    fontFamily: Fonts.medium,
    color: Colors.primary,
  },
});
