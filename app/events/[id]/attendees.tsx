import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Image, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import LoadingSpinner from '../../../src/components/ui/loading-spinner';
import EmptyState from '../../../src/components/ui/empty-state';
import BackButton from '../../../src/components/ui/back-button';
import { Colors } from '../../../src/constants/Colors';
import { Spacing } from '../../../src/constants/Styles';
import { Fonts } from '../../../src/constants/Fonts';
import { useAuth } from '../../../src/contexts/auth-context';
import { getEventBookings } from '../../../src/services/booking-service';

interface Attendee {
  id: string;
  user_id: string;
  booking_id: string;
  user: {
    id: string;
    full_name: string | null;
    email: string;
    avatar_url: string | null;
  };
}

export default function EventAttendeesScreen() {
  const { id: eventId } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();

  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [avatarErrors, setAvatarErrors] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!eventId) {
      setError('No event ID provided');
      setLoading(false);
      return;
    }

    getEventBookings(eventId)
      .then((bookings) => {
        // Deduplicate users by ID and only show confirmed bookings
        const uniqueUsersMap = new Map();
        bookings
          .filter((b) => b.user && b.status === 'confirmed')
          .forEach((b) => {
            const userId = (b.user as any).id;
            if (!uniqueUsersMap.has(userId)) {
              uniqueUsersMap.set(userId, {
                id: b.id,
                user_id: userId,
                booking_id: b.id,
                user: b.user,
              });
            }
          });

        const attendeesList = Array.from(uniqueUsersMap.values());
        setAttendees(attendeesList);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching attendees:', err);
        setError(err instanceof Error ? err.message : 'Failed to load attendees');
        setLoading(false);
      });
  }, [eventId]);

  const handleAttendeePress = (userId: string) => {
    router.push(`/user-profile?userId=${userId}`);
  };

  const renderAttendee = ({ item }: { item: Attendee }) => {
    if (!item.user) return null;

    const displayName = item.user.full_name || item.user.email.split('@')[0] || 'User';
    const username = item.user.email.split('@')[0] || 'user';
    const isCurrentUser = item.user_id === user?.id;
    const hasAvatarError = avatarErrors[item.user_id];

    return (
      <Pressable style={styles.attendeeItem} onPress={() => handleAttendeePress(item.user_id)}>
        {/* Avatar */}
        <View style={styles.avatarContainer}>
          {item.user.avatar_url && !hasAvatarError ? (
            <Image
              source={{ uri: item.user.avatar_url }}
              style={styles.avatar}
              onError={() => setAvatarErrors((prev) => ({ ...prev, [item.user_id]: true }))}
            />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarPlaceholderText}>
                {displayName.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
        </View>

        {/* Attendee Info */}
        <View style={styles.attendeeInfo}>
          <Text style={styles.attendeeUsername} numberOfLines={1}>
            {username}
            {isCurrentUser && <Text style={styles.youBadge}> (You)</Text>}
          </Text>
          <Text style={styles.attendeeFullName} numberOfLines={1}>
            {displayName.toUpperCase()}
          </Text>
        </View>

        {/* Chevron */}
        <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
      </Pressable>
    );
  };

  // Loading
  if (loading) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <SafeAreaView style={styles.container} edges={['top']}>
          <View style={styles.customHeader}>
            <BackButton />
            <Text style={styles.customHeaderTitle}>Event Attendees</Text>
            <View style={styles.headerPlaceholder} />
          </View>
          <LoadingSpinner fullScreen text="Loading attendees..." />
        </SafeAreaView>
      </>
    );
  }

  // Error
  if (error) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <SafeAreaView style={styles.container} edges={['top']}>
          <View style={styles.customHeader}>
            <BackButton />
            <Text style={styles.customHeaderTitle}>Event Attendees</Text>
            <View style={styles.headerPlaceholder} />
          </View>
          <EmptyState
            title="Unable to Load Attendees"
            emoji="😕"
            message={error}
            action={{
              label: 'Go Back',
              onPress: () => router.back(),
            }}
          />
        </SafeAreaView>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.customHeader}>
          <BackButton />
          <Text style={styles.customHeaderTitle}>
            {attendees.length} {attendees.length === 1 ? 'Person' : 'People'} Joined
          </Text>
          <View style={styles.headerPlaceholder} />
        </View>
        <FlatList
          data={attendees}
          renderItem={renderAttendee}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <EmptyState
              title="No Attendees Yet"
              emoji="👥"
              message="No one has booked tickets for this event yet."
            />
          }
        />
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  list: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
  },
  attendeeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
    paddingVertical: Spacing.md,
    gap: Spacing.md,
    borderBottomWidth: 0,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  avatarPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarPlaceholderText: {
    fontSize: 24,
    fontFamily: Fonts.bold,
    color: Colors.textInverse,
  },
  attendeeInfo: {
    flex: 1,
  },
  attendeeUsername: {
    fontSize: 18,
    fontFamily: Fonts.semiBold,
    color: Colors.text,
    marginBottom: 4,
  },
  youBadge: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    color: Colors.primary,
  },
  attendeeFullName: {
    fontSize: 13,
    fontFamily: Fonts.regular,
    color: Colors.textSecondary,
    letterSpacing: 0.5,
  },
  customHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.background,
  },
  customHeaderTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  headerPlaceholder: {
    width: 40,
  },
});
