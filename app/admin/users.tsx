import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  Pressable,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import LoadingSpinner from '../../src/components/ui/loading-spinner';
import EmptyState from '../../src/components/ui/empty-state';
import { Colors } from '../../src/constants/Colors';
import { Spacing, Typography, BorderRadius } from '../../src/constants/Styles';
import * as AdminService from '../../src/services/admin-service';
import type { Profile } from '../../src/types/user.types';

type RoleFilter = 'all' | 'user' | 'host' | 'admin';

export default function UsersPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [users, setUsers] = useState<Profile[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const LIMIT = 20;

  const fetchUsers = useCallback(
    async (reset = false) => {
      try {
        setError(null);
        const currentPage = reset ? 1 : page;

        const result = await AdminService.getUsers({
          page: currentPage,
          limit: LIMIT,
          search: search || undefined,
          role: roleFilter,
        });

        if (reset) {
          setUsers(result.users);
          setPage(1);
        } else {
          setUsers((prev) => [...prev, ...result.users]);
        }
        setTotal(result.total);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load users');
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [page, search, roleFilter]
  );

  // Load data on component mount and when roleFilter changes
  React.useEffect(() => {
    setLoading(true);
    fetchUsers(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roleFilter]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchUsers(true);
    setRefreshing(false);
  };

  const onSearch = () => {
    setLoading(true);
    fetchUsers(true);
  };

  const loadMore = () => {
    if (loadingMore || users.length >= total) return;
    setLoadingMore(true);
    setPage((prev) => prev + 1);
    fetchUsers(false);
  };

  const handleRoleChange = async (userId: string, currentRole: string) => {
    const options: ('user' | 'host' | 'admin')[] = ['user', 'host', 'admin'];

    Alert.alert('Change User Role', 'Select a new role for this user:', [
      ...options
        .filter((role) => role !== currentRole)
        .map((role) => ({
          text: role.charAt(0).toUpperCase() + role.slice(1),
          onPress: async () => {
            try {
              await AdminService.updateUserRole(userId, role);
              // Update local state
              setUsers((prev) =>
                prev.map((u) =>
                  u.id === userId ? { ...u, role, is_host_approved: role === 'host' } : u
                )
              );
              Alert.alert('Success', `User role updated to ${role}`);
            } catch (err) {
              Alert.alert('Error', err instanceof Error ? err.message : 'Failed to update role');
            }
          },
        })),
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const getRoleBadgeStyle = (role: string) => {
    switch (role) {
      case 'admin':
        return { backgroundColor: Colors.error + '10', color: Colors.error };
      case 'host':
        return { backgroundColor: Colors.primary + '10', color: Colors.primary };
      default:
        return { backgroundColor: Colors.surfaceSecondary, color: Colors.textSecondary };
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const renderUserItem = ({ item }: { item: Profile }) => {
    const roleStyle = getRoleBadgeStyle(item.role);

    return (
      <View style={styles.userCard}>
        <View style={styles.userRow}>
          {item.avatar_url ? (
            <Image source={{ uri: item.avatar_url }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>
                {(item.full_name || item.email || '?')[0].toUpperCase()}
              </Text>
            </View>
          )}
          <View style={styles.userInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.userName} numberOfLines={1}>
                {item.full_name || 'No Name'}
              </Text>
              <View style={[styles.roleBadge, { backgroundColor: roleStyle.backgroundColor }]}>
                <Text style={[styles.roleText, { color: roleStyle.color }]}>{item.role}</Text>
              </View>
            </View>
            <Text style={styles.userEmail} numberOfLines={1}>
              {item.email}
            </Text>
            <Text style={styles.userDate}>Joined {formatDate(item.created_at)}</Text>
          </View>
          <Pressable style={styles.moreButton} onPress={() => handleRoleChange(item.id, item.role)}>
            <Ionicons name="ellipsis-vertical" size={20} color={Colors.textSecondary} />
          </Pressable>
        </View>
      </View>
    );
  };

  const renderHeader = () => (
    <View style={styles.headerContent}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={Colors.textTertiary} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search users..."
          placeholderTextColor={Colors.textTertiary}
          value={search}
          onChangeText={setSearch}
          onSubmitEditing={onSearch}
          returnKeyType="search"
        />
      </View>

      {/* Role Filter */}
      <View style={styles.filterWrapper}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={['all', 'user', 'host', 'admin'] as RoleFilter[]}
          contentContainerStyle={styles.filterContainer}
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <Pressable
              style={[styles.filterButton, roleFilter === item && styles.filterButtonActive]}
              onPress={() => setRoleFilter(item)}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  roleFilter === item && styles.filterButtonTextActive,
                ]}
              >
                {item.charAt(0).toUpperCase() + item.slice(1)}
              </Text>
            </Pressable>
          )}
        />
      </View>

      {/* Results Count */}
      <Text style={styles.resultsCount}>
        {total} user{total !== 1 ? 's' : ''} found
      </Text>
    </View>
  );

  if (loading && users.length === 0) {
    return <LoadingSpinner fullScreen text="Loading users..." />;
  }

  if (error && users.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={Colors.text} />
          </Pressable>
          <Text style={styles.headerTitle}>Users</Text>
          <View style={{ width: 32 }} />
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable style={styles.retryButton} onPress={() => fetchUsers(true)}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Custom Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={Colors.text} />
          </Pressable>
          <View style={styles.headerActionPlaceholder} />
        </View>

        <FlatList
          data={users}
          renderItem={renderUserItem}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={
            <EmptyState
              title="No Users Found"
              message="No users match your search criteria."
              emoji="👥"
            />
          }
          ListFooterComponent={
            loadingMore ? (
              <View style={styles.loadingMore}>
                <LoadingSpinner size="small" />
              </View>
            ) : (
              <View style={{ height: Spacing.xl }} />
            )
          }
          onEndReached={loadMore}
          onEndReachedThreshold={0.3}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[Colors.primary]}
              tintColor={Colors.primary}
            />
          }
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  safeArea: {
    flex: 1,
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
  listContent: {
    paddingHorizontal: Spacing.lg,
  },
  headerContent: {
    paddingVertical: Spacing.md,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    height: 44,
  },
  searchIcon: {
    marginRight: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    ...Typography.body,
    color: Colors.text,
    height: '100%',
  },
  filterWrapper: {
    marginBottom: Spacing.md,
  },
  filterContainer: {
    gap: Spacing.sm,
    paddingRight: Spacing.lg,
  },
  filterButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterButtonActive: {
    backgroundColor: Colors.text,
    borderColor: Colors.text,
  },
  filterButtonText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: Colors.textInverse,
  },
  resultsCount: {
    ...Typography.caption,
    color: Colors.textTertiary,
    marginBottom: Spacing.sm,
  },
  userCard: {
    backgroundColor: Colors.surface,
    marginBottom: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surfaceSecondary,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary + '10',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    ...Typography.bodyMedium,
    color: Colors.primary,
    fontWeight: '600',
  },
  userInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: 2,
  },
  userName: {
    ...Typography.bodySmall,
    color: Colors.text,
    fontWeight: '600',
    flexShrink: 1,
  },
  userEmail: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  userDate: {
    ...Typography.caption,
    color: Colors.textTertiary,
    fontSize: 10,
  },
  roleBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  roleText: {
    ...Typography.caption,
    fontWeight: '700',
    fontSize: 9,
    textTransform: 'uppercase',
  },
  moreButton: {
    padding: Spacing.sm,
  },
  loadingMore: {
    paddingVertical: Spacing.lg,
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  errorText: {
    ...Typography.body,
    color: Colors.error,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  retryButton: {
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  retryButtonText: {
    ...Typography.bodyMedium,
    color: Colors.text,
  },
});
