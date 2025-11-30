import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Platform,
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING } from '@theme';

// Mock friends data
const MOCK_FRIENDS = [
  {
    id: '1',
    name: 'John Doe',
    avatar: 'https://ui-avatars.com/api/?name=John+Doe&background=000&color=fff&size=100',
    bio: 'Music lover and event enthusiast',
    mutualFriends: 12,
    isOnline: true,
    lastSeen: 'Online',
  },
  {
    id: '2',
    name: 'Sarah Wilson',
    avatar: 'https://ui-avatars.com/api/?name=Sarah+Wilson&background=333&color=fff&size=100',
    bio: 'Sports fan and fitness coach',
    mutualFriends: 8,
    isOnline: true,
    lastSeen: 'Online',
  },
  {
    id: '3',
    name: 'Mike Johnson',
    avatar: 'https://ui-avatars.com/api/?name=Mike+Johnson&background=555&color=fff&size=100',
    bio: 'Tech enthusiast and startup founder',
    mutualFriends: 5,
    isOnline: false,
    lastSeen: '2 hours ago',
  },
  {
    id: '4',
    name: 'Emily Chen',
    avatar: 'https://ui-avatars.com/api/?name=Emily+Chen&background=222&color=fff&size=100',
    bio: 'Festival lover | Concert goer',
    mutualFriends: 15,
    isOnline: false,
    lastSeen: 'Yesterday',
  },
  {
    id: '5',
    name: 'Alex Kumar',
    avatar: 'https://ui-avatars.com/api/?name=Alex+Kumar&background=444&color=fff&size=100',
    bio: 'Cricket fanatic | IPL addict',
    mutualFriends: 20,
    isOnline: true,
    lastSeen: 'Online',
  },
  {
    id: '6',
    name: 'Priya Sharma',
    avatar: 'https://ui-avatars.com/api/?name=Priya+Sharma&background=666&color=fff&size=100',
    bio: 'Dance | Music | Life',
    mutualFriends: 7,
    isOnline: false,
    lastSeen: '5 minutes ago',
  },
];

const FriendsScreen = ({ navigation }: any) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');

  const filteredFriends = MOCK_FRIENDS.filter(friend => {
    const matchesSearch = friend.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = activeFilter === 'all' || (activeFilter === 'online' && friend.isOnline);
    return matchesSearch && matchesFilter;
  });

  const onlineFriendsCount = MOCK_FRIENDS.filter(f => f.isOnline).length;

  const renderFriendCard = (friend: typeof MOCK_FRIENDS[0]) => (
    <TouchableOpacity
      key={friend.id}
      style={styles.friendCard}
      onPress={() => navigation.navigate('UserProfile', { userId: friend.id })}
      activeOpacity={0.7}
    >
      <View style={styles.avatarContainer}>
        <Image source={{ uri: friend.avatar }} style={styles.avatar} />
        {friend.isOnline && <View style={styles.onlineIndicator} />}
      </View>

      <View style={styles.friendInfo}>
        <Text style={styles.friendName}>{friend.name}</Text>
        <Text style={styles.friendBio} numberOfLines={1}>{friend.bio}</Text>
        <View style={styles.metaRow}>
          <MaterialIcons name="people" size={12} color="#999" />
          <Text style={styles.metaText}>{friend.mutualFriends} mutual</Text>
          <View style={styles.metaDot} />
          <Text style={[styles.metaText, friend.isOnline && styles.onlineText]}>
            {friend.lastSeen}
          </Text>
        </View>
      </View>

      <View style={styles.friendActions}>
        <TouchableOpacity
          style={styles.messageButton}
          onPress={() => navigation.navigate('ChatRoom', { chatId: friend.id, name: friend.name })}
        >
          <Ionicons name="chatbubble-outline" size={18} color={COLORS.text} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={24} color={COLORS.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Friends</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('FriendRequests')}
        >
          <MaterialIcons name="person-add" size={22} color={COLORS.text} />
        </TouchableOpacity>
      </View>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{MOCK_FRIENDS.length}</Text>
          <Text style={styles.statLabel}>Friends</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{onlineFriendsCount}</Text>
          <Text style={styles.statLabel}>Online</Text>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color={COLORS.textGray} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search friends..."
            placeholderTextColor={COLORS.textGray}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={COLORS.textGray} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterTab, activeFilter === 'all' && styles.filterTabActive]}
          onPress={() => setActiveFilter('all')}
        >
          <Text style={[styles.filterText, activeFilter === 'all' && styles.filterTextActive]}>
            All Friends
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterTab, activeFilter === 'online' && styles.filterTabActive]}
          onPress={() => setActiveFilter('online')}
        >
          <View style={styles.onlineDot} />
          <Text style={[styles.filterText, activeFilter === 'online' && styles.filterTextActive]}>
            Online ({onlineFriendsCount})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Friends List */}
      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {filteredFriends.length > 0 ? (
          filteredFriends.map(renderFriendCard)
        ) : (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIcon}>
              <MaterialIcons name="people-outline" size={48} color="#999" />
            </View>
            <Text style={styles.emptyTitle}>No Friends Found</Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery ? 'Try a different search term' : 'Start adding friends to see them here'}
            </Text>
            <TouchableOpacity
              style={styles.findFriendsButton}
              onPress={() => navigation.navigate('FriendRequests')}
            >
              <Text style={styles.findFriendsText}>Find Friends</Text>
            </TouchableOpacity>
          </View>
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 50 : 40,
    paddingBottom: SPACING.sm,
    paddingHorizontal: SPACING.md,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.backgroundLight,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  statItem: {
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
  },
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: '#e0e0e0',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
  },
  statLabel: {
    fontSize: 12,
    color: '#999',
    fontWeight: '500',
  },
  searchContainer: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.white,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundLight,
    borderRadius: 25,
    paddingHorizontal: SPACING.md,
    height: 50,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
    marginLeft: SPACING.sm,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.white,
    gap: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f5f5f5',
    gap: 6,
  },
  filterTabActive: {
    backgroundColor: COLORS.text,
  },
  filterText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
  },
  filterTextActive: {
    color: COLORS.white,
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4CAF50',
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  scrollContent: {
    padding: SPACING.md,
  },
  friendCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: SPACING.md,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4CAF50',
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  friendInfo: {
    flex: 1,
  },
  friendName: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  friendBio: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 11,
    color: '#999',
  },
  onlineText: {
    color: '#4CAF50',
    fontWeight: '500',
  },
  metaDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#999',
    marginHorizontal: 4,
  },
  friendActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  messageButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xxl,
    marginTop: SPACING.xl,
  },
  emptyIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: SPACING.lg,
  },
  findFriendsButton: {
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.text,
    borderRadius: 20,
  },
  findFriendsText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.white,
  },
});

export default FriendsScreen;
