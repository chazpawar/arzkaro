import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, Image, Pressable, Alert } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import LoadingSpinner from '../src/components/ui/loading-spinner';
import EmptyState from '../src/components/ui/empty-state';
import { Colors } from '../src/constants/Colors';
import { Spacing, Typography, BorderRadius } from '../src/constants/Styles';
import { useAuth } from '../src/contexts/auth-context';
import * as ContactsService from '../src/services/contacts-service';
import * as FriendsService from '../src/services/friends-service';
import type { ContactMatch } from '../src/services/contacts-service';

export default function FindFriendsScreen() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();

  const [matches, setMatches] = useState<ContactMatch[]>([]);
  const [loading, setLoading] = useState(false);
  const [synced, setSynced] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const handleSyncContacts = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const contactMatches = await ContactsService.findFriendsFromContacts();
      setMatches(contactMatches);
      setSynced(true);

      if (contactMatches.length === 0) {
        Alert.alert(
          'No Matches Found',
          "We couldn't find any of your contacts on ArzKaro. Invite your friends to join!"
        );
      }
    } catch (error) {
      console.error('[FIND_FRIENDS] Error syncing contacts:', error);
      Alert.alert('Error', 'Failed to sync contacts. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddFriend = async (userId: string, userName: string) => {
    if (!user?.id) return;

    try {
      setActionLoading(userId);
      await FriendsService.sendFriendRequest(user.id, userId);
      Alert.alert('Success', `Friend request sent to ${userName}!`);

      // Remove from matches list
      setMatches((prev) => prev.filter((m) => m.id !== userId));
    } catch (error) {
      console.error('[FIND_FRIENDS] Error sending friend request:', error);
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Failed to send friend request'
      );
    } finally {
      setActionLoading(null);
    }
  };

  // Not authenticated
  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <EmptyState
          title="Sign In Required"
          emoji="🔒"
          message="Please sign in to find friends."
          action={{
            label: 'Sign In',
            onPress: () => router.push('/'),
          }}
        />
      </SafeAreaView>
    );
  }

  const renderMatch = ({ item }: { item: ContactMatch }) => {
    const displayName = item.full_name || 'Unknown';
    const isLoading = actionLoading === item.id;

    return (
      <Pressable style={styles.listItem} onPress={() => router.push(`/profile?userId=${item.id}`)}>
        <View style={styles.avatarContainer}>
          {item.avatar_url ? (
            <Image source={{ uri: item.avatar_url }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>{displayName.charAt(0).toUpperCase()}</Text>
            </View>
          )}
          <View style={styles.onArzkaroBadge}>
            <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
          </View>
        </View>

        <View style={styles.listItemContent}>
          <Text style={styles.listItemName} numberOfLines={1}>
            {displayName}
          </Text>
          <View style={styles.matchInfo}>
            <Ionicons
              name={item.match_source === 'email' ? 'mail-outline' : 'call-outline'}
              size={12}
              color={Colors.textSecondary}
            />
            <Text style={styles.matchSourceText}>
              {item.match_source === 'email' ? 'Matched by email' : 'Matched by phone'}
            </Text>
          </View>
        </View>

        <Pressable
          style={[styles.addButton, isLoading && styles.addButtonDisabled]}
          onPress={(e) => {
            e.stopPropagation();
            handleAddFriend(item.id, displayName);
          }}
          disabled={isLoading}
        >
          {isLoading ? (
            <LoadingSpinner size="small" color={Colors.background} />
          ) : (
            <>
              <Ionicons name="person-add" size={16} color={Colors.background} />
              <Text style={styles.addButtonText}>Add</Text>
            </>
          )}
        </Pressable>
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </Pressable>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>Find Friends</Text>
          {synced && (
            <Text style={styles.headerSubtitle}>
              {matches.length} friend{matches.length !== 1 ? 's' : ''} found
            </Text>
          )}
        </View>
        {synced ? (
          <Pressable onPress={handleSyncContacts} style={styles.syncAgainButton} disabled={loading}>
            {loading ? (
              <LoadingSpinner size="small" />
            ) : (
              <Ionicons name="sync" size={24} color={Colors.primary} />
            )}
          </Pressable>
        ) : (
          <View style={styles.headerActionPlaceholder} />
        )}
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.centerContainer}>
          <LoadingSpinner text="Syncing contacts..." />
        </View>
      ) : !synced ? (
        <View style={styles.centerContainer}>
          <View style={styles.permissionCard}>
            <View style={styles.iconCircle}>
              <Ionicons name="people" size={48} color={Colors.primary} />
            </View>
            <Text style={styles.permissionTitle}>Find Your Friends</Text>
            <Text style={styles.permissionDescription}>
              We&apos;ll check your contacts to see which of your friends are already on ArzKaro.
              Your contacts are never stored on our servers.
            </Text>
            <View style={styles.privacyBullets}>
              <View style={styles.bulletPoint}>
                <Ionicons name="shield-checkmark" size={20} color={Colors.success} />
                <Text style={styles.bulletText}>Your contacts stay private</Text>
              </View>
              <View style={styles.bulletPoint}>
                <Ionicons name="lock-closed" size={20} color={Colors.success} />
                <Text style={styles.bulletText}>No data is stored on servers</Text>
              </View>
              <View style={styles.bulletPoint}>
                <Ionicons name="eye-off" size={20} color={Colors.success} />
                <Text style={styles.bulletText}>Only you see the matches</Text>
              </View>
            </View>
            <Pressable style={styles.syncButton} onPress={handleSyncContacts}>
              <Ionicons name="sync" size={20} color={Colors.background} />
              <Text style={styles.syncButtonText}>Sync Contacts</Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <FlatList
          data={matches}
          renderItem={renderMatch}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <EmptyState
              title="No Friends Found"
              emoji="🔍"
              message="We couldn't find any of your contacts on ArzKaro. Invite your friends to join the platform!"
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  backButton: {
    padding: Spacing.xs,
    marginLeft: -Spacing.xs,
  },
  headerTextContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    ...Typography.bodyLarge,
    fontWeight: '600',
    color: Colors.text,
  },
  headerSubtitle: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  headerActionPlaceholder: {
    width: 32,
  },
  syncAgainButton: {
    padding: Spacing.xs,
    marginRight: -Spacing.xs,
  },
  permissionCard: {
    width: '100%',
    maxWidth: 400,
    padding: Spacing.xl,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    alignItems: 'center',
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  permissionTitle: {
    ...Typography.h2,
    color: Colors.text,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  permissionDescription: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
    lineHeight: 22,
  },
  privacyBullets: {
    width: '100%',
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  bulletPoint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  bulletText: {
    ...Typography.body,
    color: Colors.text,
  },
  syncButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
    width: '100%',
    justifyContent: 'center',
  },
  syncButtonText: {
    ...Typography.bodyLarge,
    color: Colors.background,
    fontWeight: '600',
  },
  list: {
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    gap: Spacing.md,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  avatarPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    ...Typography.h2,
    color: Colors.background,
  },
  onArzkaroBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 2,
  },
  listItemContent: {
    flex: 1,
    gap: 4,
  },
  listItemName: {
    ...Typography.bodyMedium,
    color: Colors.text,
    fontWeight: '600',
  },
  matchInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  matchSourceText: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
  },
  addButtonDisabled: {
    opacity: 0.6,
  },
  addButtonText: {
    ...Typography.body,
    color: Colors.background,
    fontWeight: '600',
  },
});
