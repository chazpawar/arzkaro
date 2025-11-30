import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING } from '@theme';
import { useAuth } from '@context/AuthContext';
import Header from '@components/common/Header';

// Mock chat data
const MOCK_CHATS = [
  {
    id: '1',
    name: 'General Event Chat',
    avatar: 'https://ui-avatars.com/api/?name=GE&background=e0e0e0&color=666&size=100',
    lastMessage: 'See you there!',
    timestamp: '2 min ago',
    unreadCount: 3,
    isGroup: true,
    members: 48,
    type: 'group',
  },
  {
    id: '2',
    name: 'Organizers',
    avatar: 'https://ui-avatars.com/api/?name=O&background=e0e0e0&color=666&size=100',
    lastMessage: 'Tickets sent',
    timestamp: '15 min ago',
    unreadCount: 0,
    isGroup: false,
    type: 'organizer',
  },
  {
    id: '3',
    name: 'Friends: Adi, Ravi',
    avatar: 'https://ui-avatars.com/api/?name=AR&background=e0e0e0&color=666&size=100',
    lastMessage: "Let's meet at 6",
    timestamp: '1 hour ago',
    unreadCount: 1,
    isGroup: true,
    members: 3,
    type: 'friends',
  },
  {
    id: '4',
    name: 'One-on-One: Sarah',
    avatar: 'https://ui-avatars.com/api/?name=S&background=e0e0e0&color=666&size=100',
    lastMessage: 'See you tomorrow',
    timestamp: '3 hours ago',
    unreadCount: 0,
    isGroup: false,
    type: 'direct',
  },
  {
    id: '5',
    name: 'Announcement',
    avatar: 'https://ui-avatars.com/api/?name=A&background=e0e0e0&color=666&size=100',
    lastMessage: 'Read this!',
    timestamp: 'Yesterday',
    unreadCount: 5,
    isGroup: true,
    members: 234,
    type: 'announcement',
  },
];

const FILTER_TABS = ['All', 'Unread', 'Groups', 'Friends'];

const ChatsScreen = ({ navigation }: any) => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');

  const filteredChats = MOCK_CHATS.filter(chat => {
    const matchesSearch = chat.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = activeFilter === 'All' || 
      (activeFilter === 'Unread' && chat.unreadCount > 0) || 
      (activeFilter === 'Groups' && chat.isGroup) || 
      (activeFilter === 'Friends' && chat.type === 'friends');
    return matchesSearch && matchesFilter;
  });

  const getIconForType = (type: string) => {
    switch (type) {
      case 'group':
        return 'people';
      case 'organizer':
        return 'person';
      case 'friends':
        return 'people';
      case 'announcement':
        return 'notifications';
      default:
        return 'star';
    }
  };

  const renderChatItem = (chat: typeof MOCK_CHATS[0]) => (
    <TouchableOpacity
      key={chat.id}
      style={styles.chatItem}
      onPress={() => navigation.navigate('ChatRoom', { chatId: chat.id, name: chat.name })}
      activeOpacity={0.7}
    >
      <View style={styles.avatarContainer}>
        <View style={styles.iconAvatar}>
          <MaterialIcons name={getIconForType(chat.type) as any} size={22} color={COLORS.textGray} />
        </View>
      </View>

      <View style={styles.chatContent}>
        <Text style={styles.chatName} numberOfLines={1}>{chat.name}</Text>
        <Text style={styles.lastMessage} numberOfLines={1}>{chat.lastMessage}</Text>
      </View>

      {chat.unreadCount > 0 && (
        <View style={styles.unreadBadge}>
          <Text style={styles.unreadCount}>{chat.unreadCount}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Chat List */}
      <ScrollView style={styles.chatList} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header with Logo and Search */}
        <Header
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="Search conversations..."
        />

        {/* Filter Tabs */}
        <View style={styles.filterContainer}>
          {FILTER_TABS.map((filter) => (
            <TouchableOpacity
              key={filter}
              style={[
                styles.filterTab,
                activeFilter === filter && styles.filterTabActive
              ]}
              onPress={() => setActiveFilter(filter)}
            >
              <Text style={[
                styles.filterText,
                activeFilter === filter && styles.filterTextActive
              ]}>{filter}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Chat Items */}
        <View style={styles.chatsContainer}>
          {filteredChats.length > 0 ? (
            filteredChats.map(renderChatItem)
          ) : (
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <Ionicons name="chatbubbles-outline" size={48} color={COLORS.textGray} />
              </View>
              <Text style={styles.emptyTitle}>No Conversations</Text>
              <Text style={styles.emptySubtitle}>
                Start chatting with friends or join event groups
              </Text>
            </View>
          )}
        </View>
        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    gap: SPACING.sm,
  },
  filterTab: {
    paddingHorizontal: SPACING.md,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.backgroundLight,
  },
  filterTabActive: {
    backgroundColor: COLORS.primary,
  },
  filterText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  filterTextActive: {
    color: COLORS.white,
  },
  chatList: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  chatsContainer: {
    paddingHorizontal: SPACING.lg,
  },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  avatarContainer: {
    marginRight: SPACING.md,
  },
  iconAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.backgroundLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatContent: {
    flex: 1,
  },
  chatName: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.black,
    marginBottom: 2,
  },
  lastMessage: {
    fontSize: 13,
    color: COLORS.textGray,
  },
  unreadBadge: {
    backgroundColor: COLORS.accentLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 24,
    alignItems: 'center',
  },
  unreadCount: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xxl,
    marginTop: SPACING.xxl,
  },
  emptyIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.backgroundLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.black,
    marginBottom: SPACING.xs,
  },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.textGray,
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default ChatsScreen;
