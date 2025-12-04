import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  Pressable,
  TextInput,
  Image,
  Alert,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Card from '../../src/components/ui/card';
import LoadingSpinner from '../../src/components/ui/loading-spinner';
import { Colors } from '../../src/constants/colors';
import { Spacing, Typography, BorderRadius } from '../../src/constants/styles';
import * as AdminService from '../../src/services/admin-service';
import type { Profile } from '../../src/types/user.types';

type RoleFilter = 'all' | 'user' | 'host' | 'admin';

export default function UsersPage() {
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

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchUsers(true);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [roleFilter])
  );

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
        return { backgroundColor: Colors.error + '20', color: Colors.error };
      case 'host':
        return { backgroundColor: Colors.primary + '20', color: Colors.primary };
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
      <Card style={styles.userCard} variant="outlined">
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
            <Text style={styles.userName} numberOfLines={1}>
              {item.full_name || 'No Name'}
            </Text>
            <Text style={styles.userEmail} numberOfLines={1}>
              {item.email}
            </Text>
            <Text style={styles.userDate}>Joined {formatDate(item.created_at)}</Text>
          </View>
          <View style={styles.userActions}>
            <View style={[styles.roleBadge, { backgroundColor: roleStyle.backgroundColor }]}>
              <Text style={[styles.roleText, { color: roleStyle.color }]}>{item.role}</Text>
            </View>
            <Pressable
              style={styles.changeRoleButton}
              onPress={() => handleRoleChange(item.id, item.role)}
            >
              <Text style={styles.changeRoleText}>Change</Text>
            </Pressable>
          </View>
        </View>
      </Card>
    );
  };

  const renderHeader = () => (
    <>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name or email..."
          placeholderTextColor={Colors.textSecondary}
          value={search}
          onChangeText={setSearch}
          onSubmitEditing={onSearch}
          returnKeyType="search"
        />
        <Pressable style={styles.searchButton} onPress={onSearch}>
          <Text style={styles.searchButtonText}>Search</Text>
        </Pressable>
      </View>

      {/* Role Filter */}
      <View style={styles.filterContainer}>
        {(['all', 'user', 'host', 'admin'] as RoleFilter[]).map((filter) => (
          <Pressable
            key={filter}
            style={[styles.filterButton, roleFilter === filter && styles.filterButtonActive]}
            onPress={() => setRoleFilter(filter)}
          >
            <Text
              style={[
                styles.filterButtonText,
                roleFilter === filter && styles.filterButtonTextActive,
              ]}
            >
              {filter.charAt(0).toUpperCase() + filter.slice(1)}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Results Count */}
      <Text style={styles.resultsCount}>
        {total} user{total !== 1 ? 's' : ''} found
      </Text>
    </>
  );

  if (loading && users.length === 0) {
    return <LoadingSpinner fullScreen text="Loading users..." />;
  }

  if (error && users.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
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
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <FlatList
        data={users}
        renderItem={renderUserItem}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>👥</Text>
            <Text style={styles.emptyText}>No users found</Text>
          </View>
        }
        ListFooterComponent={
          loadingMore ? (
            <View style={styles.loadingMore}>
              <LoadingSpinner size="small" />
            </View>
          ) : null
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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  listContent: {
    padding: Spacing.lg,
    paddingTop: Spacing.md,
  },
  searchContainer: {
    flexDirection: 'row',
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    ...Typography.body,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchButton: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    justifyContent: 'center',
  },
  searchButtonText: {
    ...Typography.bodyMedium,
    color: Colors.textInverse,
  },
  filterContainer: {
    flexDirection: 'row',
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  filterButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterButtonText: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
  },
  filterButtonTextActive: {
    color: Colors.textInverse,
    fontWeight: '600',
  },
  resultsCount: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },
  userCard: {
    marginBottom: Spacing.sm,
    padding: Spacing.md,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    ...Typography.h3,
    color: Colors.primary,
  },
  userInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  userName: {
    ...Typography.bodyMedium,
    color: Colors.text,
  },
  userEmail: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  userDate: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontSize: 10,
  },
  userActions: {
    alignItems: 'flex-end',
  },
  roleBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.xs,
  },
  roleText: {
    ...Typography.caption,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  changeRoleButton: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
  },
  changeRoleText: {
    ...Typography.caption,
    color: Colors.primary,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: Spacing.md,
  },
  emptyText: {
    ...Typography.body,
    color: Colors.textSecondary,
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
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  retryButtonText: {
    ...Typography.bodyMedium,
    color: Colors.textInverse,
  },
});
