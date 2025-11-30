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

// Mock friend request data
const MOCK_REQUESTS = [
  {
    id: '1',
    name: 'Jessica Brown',
    avatar: 'https://ui-avatars.com/api/?name=Jessica+Brown&background=000&color=fff&size=100',
    mutualFriends: 5,
    time: '2 hours ago',
  },
  {
    id: '2',
    name: 'David Lee',
    avatar: 'https://ui-avatars.com/api/?name=David+Lee&background=333&color=fff&size=100',
    mutualFriends: 12,
    time: '5 hours ago',
  },
  {
    id: '3',
    name: 'Amanda White',
    avatar: 'https://ui-avatars.com/api/?name=Amanda+White&background=555&color=fff&size=100',
    mutualFriends: 3,
    time: '1 day ago',
  },
];

const SUGGESTED_FRIENDS = [
  {
    id: '4',
    name: 'Chris Evans',
    avatar: 'https://ui-avatars.com/api/?name=Chris+Evans&background=222&color=fff&size=100',
    mutualFriends: 8,
  },
  {
    id: '5',
    name: 'Emma Watson',
    avatar: 'https://ui-avatars.com/api/?name=Emma+Watson&background=444&color=fff&size=100',
    mutualFriends: 15,
  },
  {
    id: '6',
    name: 'Tom Hardy',
    avatar: 'https://ui-avatars.com/api/?name=Tom+Hardy&background=666&color=fff&size=100',
    mutualFriends: 6,
  },
];

const FriendRequestsScreen = ({ navigation }: any) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [requests, setRequests] = useState(MOCK_REQUESTS);

  const handleAccept = (id: string) => {
    setRequests(requests.filter(r => r.id !== id));
  };

  const handleDecline = (id: string) => {
    setRequests(requests.filter(r => r.id !== id));
  };

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
        <Text style={styles.headerTitle}>Friend Requests</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color={COLORS.textGray} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search people..."
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

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Pending Requests */}
        {requests.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Pending Requests ({requests.length})</Text>
            {requests.map((request) => (
              <View key={request.id} style={styles.requestCard}>
                <Image source={{ uri: request.avatar }} style={styles.avatar} />
                <View style={styles.requestInfo}>
                  <Text style={styles.requestName}>{request.name}</Text>
                  <Text style={styles.requestMeta}>
                    {request.mutualFriends} mutual friends • {request.time}
                  </Text>
                </View>
                <View style={styles.requestActions}>
                  <TouchableOpacity
                    style={styles.acceptButton}
                    onPress={() => handleAccept(request.id)}
                  >
                    <Ionicons name="checkmark" size={18} color={COLORS.white} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.declineButton}
                    onPress={() => handleDecline(request.id)}
                  >
                    <Ionicons name="close" size={18} color="#999" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Suggested Friends */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>People You May Know</Text>
          {SUGGESTED_FRIENDS.map((friend) => (
            <View key={friend.id} style={styles.requestCard}>
              <Image source={{ uri: friend.avatar }} style={styles.avatar} />
              <View style={styles.requestInfo}>
                <Text style={styles.requestName}>{friend.name}</Text>
                <Text style={styles.requestMeta}>
                  {friend.mutualFriends} mutual friends
                </Text>
              </View>
              <TouchableOpacity style={styles.addButton}>
                <MaterialIcons name="person-add" size={18} color={COLORS.text} />
              </TouchableOpacity>
            </View>
          ))}
        </View>

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
  placeholder: {
    width: 40,
  },
  searchContainer: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
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
  scrollView: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  section: {
    padding: SPACING.md,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: SPACING.sm,
  },
  requestCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: SPACING.md,
  },
  requestInfo: {
    flex: 1,
  },
  requestName: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  requestMeta: {
    fontSize: 12,
    color: '#999',
  },
  requestActions: {
    flexDirection: 'row',
    gap: SPACING.xs,
  },
  acceptButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.text,
    justifyContent: 'center',
    alignItems: 'center',
  },
  declineButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default FriendRequestsScreen;
