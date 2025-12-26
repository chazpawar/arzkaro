import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { Spacing } from '../constants/Styles';
import Card from './ui/card';

export interface ItineraryDay {
  day: number;
  title: string;
  activities: string[];
}

interface ItineraryDisplayProps {
  itinerary: ItineraryDay[] | string;
  maxDays?: number;
}

export default function ItineraryDisplay({ itinerary, maxDays = 3 }: ItineraryDisplayProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [textWidth, setTextWidth] = useState(0);
  const seeMoreRef = useRef<Text>(null);

  const parseItinerary = (data: ItineraryDay[] | string): ItineraryDay[] => {
    if (typeof data === 'string') {
      try {
        return JSON.parse(data);
      } catch {
        return parseTextItinerary(data);
      }
    }
    return data;
  };

  const parseTextItinerary = (text: string): ItineraryDay[] => {
    const days: ItineraryDay[] = [];
    const lines = text.split('\n');
    let currentDay: ItineraryDay | null = null;

    lines.forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed) return;

      const dayMatch = trimmed.match(/^Day\s+(\d+)[:\-–—]?\s*(.*)$/i);
      if (dayMatch) {
        if (currentDay) days.push(currentDay);
        currentDay = {
          day: parseInt(dayMatch[1]),
          title: dayMatch[2] || `Day ${dayMatch[1]}`,
          activities: [],
        };
      } else if (currentDay) {
        const cleaned = trimmed.replace(/^[•\-\*·]\s*/, '');
        if (cleaned) {
          currentDay.activities.push(cleaned);
        }
      }
    });

    if (currentDay) days.push(currentDay);
    return days;
  };

  const days = parseItinerary(itinerary);
  const displayDays = isExpanded ? days : days.slice(0, maxDays);
  const hasMore = days.length > maxDays;

  const handleSeeMoreLayout = () => {
    if (seeMoreRef.current) {
      seeMoreRef.current.measure((x, y, width) => {
        setTextWidth(width);
      });
    }
  };

  if (days.length === 0) {
    return (
      <Card style={styles.emptyCard} variant="outlined">
        <Text style={styles.emptyText}>No itinerary available</Text>
      </Card>
    );
  }

  return (
    <View style={styles.container}>
      <Card style={styles.mainCard} variant="outlined">
        <View style={styles.cardContent}>
          <Text style={styles.mainTitle}>Itinerary:</Text>

          <View style={styles.daysContainer}>
            {displayDays.map((day, index) => (
              <View key={index} style={styles.daySection}>
                <Text style={styles.dayTitle}>
                  Day {day.day}: {day.title}
                </Text>

                {day.activities.length > 0 && (
                  <View style={styles.activitiesContainer}>
                    {day.activities.map((activity, actIndex) => (
                      <View key={actIndex} style={styles.activityRow}>
                        <Ionicons
                          name="ellipse"
                          size={6}
                          color={Colors.textSecondary}
                          style={styles.bulletPoint}
                        />
                        <Text style={styles.activityText}>{activity}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            ))}
          </View>

          {hasMore && (
            <View style={styles.seeMoreContainer}>
              <View style={styles.seeMoreWrapper}>
                <Pressable
                  ref={seeMoreRef}
                  style={styles.seeMoreButton}
                  onPress={() => setIsExpanded(!isExpanded)}
                  onLayout={handleSeeMoreLayout}
                >
                  <Text style={styles.seeMoreText}>{isExpanded ? 'See less' : 'See more...'}</Text>
                </Pressable>
                <View style={[styles.underline, { width: textWidth || 100 }]} />
              </View>
            </View>
          )}
        </View>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.md,
  },
  mainTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  mainCard: {
    padding: Spacing.lg,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardContent: {
    gap: Spacing.md,
  },
  daysContainer: {
    gap: 0,
  },
  daySection: {
    marginBottom: Spacing.md,
  },
  dayTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  activitiesContainer: {
    gap: Spacing.xs,
    paddingLeft: Spacing.lg,
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  bulletPoint: {
    marginTop: 6,
  },
  activityText: {
    fontSize: 15,
    fontWeight: '400',
    color: Colors.textSecondary,
    flex: 1,
    lineHeight: 22,
  },
  seeMoreContainer: {
    marginTop: Spacing.sm,
    alignItems: 'flex-end',
  },
  seeMoreWrapper: {
    position: 'relative',
  },
  seeMoreButton: {
    paddingBottom: 2,
  },
  seeMoreText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.primary,
  },
  underline: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    height: 1,
    backgroundColor: Colors.primary,
  },
  emptyCard: {
    padding: Spacing.lg,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '400',
    color: Colors.textTertiary,
  },
});
