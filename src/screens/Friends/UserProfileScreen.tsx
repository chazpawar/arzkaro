import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Platform,
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING } from '@theme';

// Mock user data
const MOCK_USER = {
  id: '1',
  name: 'John Doe',
  avatar: 'https://ui-avatars.com/api/?name=John+Doe&background=000&color=fff&size=200',
  bio: 'Music lover and event enthusiast. Always looking for the next great experience!',
  location: 'New York, USA',
  joinedDate: 'March 2023',
  friends: 156,
  eventsAttended: 24,
  mutualFriends: 12,
  interests: ['Music', 'Sports', 'Technology'],
  isFriend: false,
};

const UserProfileScreen = ({ navigation, route }: any) => {
  const userId = route?.params?.userId;

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
        <Text style={styles.headerTitle}>Profile</Text>
        <TouchableOpacity style={styles.moreButton}>
          <MaterialIcons name="more-horiz" size={24} color={COLORS.text} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <Image source={{ uri: MOCK_USER.avatar }} style={styles.avatar} />
          <Text style={styles.userName}>{MOCK_USER.name}</Text>
          <Text style={styles.userLocation}>
            <Ionicons name="location-outline" size={14} color="#999" /> {MOCK_USER.location}
          </Text>
          <Text style={styles.userBio}>{MOCK_USER.bio}</Text>

          {/* Stats */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{MOCK_USER.friends}</Text>
              <Text style={styles.statLabel}>Friends</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{MOCK_USER.eventsAttended}</Text>
              <Text style={styles.statLabel}>Events</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{MOCK_USER.mutualFriends}</Text>
              <Text style={styles.statLabel}>Mutual</Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.addFriendButton}>
              <MaterialIcons name="person-add" size={18} color={COLORS.white} />
              <Text style={styles.addFriendText}>Add Friend</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.messageButton}
              onPress={() => navigation.navigate('ChatRoom', { chatId: MOCK_USER.id, name: MOCK_USER.name })}
            >
              <Ionicons name="chatbubble-outline" size={18} color={COLORS.text} />
              <Text style={styles.messageText}>Message</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Interests */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Interests</Text>
          <View style={styles.interestsRow}>
            {MOCK_USER.interests.map((interest, index) => (
              <View key={index} style={styles.interestChip}>
                <Text style={styles.interestText}>{interest}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Info</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <MaterialIcons name="calendar-today" size={18} color="#999" />
              <Text style={styles.infoText}>Joined {MOCK_USER.joinedDate}</Text>
            </View>
            <View style={styles.infoRow}>
              <MaterialIcons name="location-on" size={18} color="#999" />
              <Text style={styles.infoText}>{MOCK_USER.location}</Text>
            </View>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
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
  moreButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.backgroundLight,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  scrollView: {
    flex: 1,
  },
  profileCard: {
    backgroundColor: COLORS.white,
    padding: SPACING.lg,
    alignItems: 'center',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: SPACING.md,
    borderWidth: 3,
    borderColor: COLORS.text,
  },
  userName: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  userLocation: {
    fontSize: 14,
    color: '#999',
    marginBottom: SPACING.sm,
  },
  userBio: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: SPACING.md,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  statItem: {
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
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
  },
  actionRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  addFriendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.text,
    paddingHorizontal: SPACING.lg,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 6,
  },
  addFriendText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.white,
  },
  messageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    paddingHorizontal: SPACING.lg,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 6,
  },
  messageText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  section: {
    marginTop: SPACING.sm,
    backgroundColor: COLORS.white,
    padding: SPACING.lg,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  interestsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
  },
  interestChip: {
    backgroundColor: '#f5f5f5',
    paddingHorizontal: SPACING.md,
    paddingVertical: 8,
    borderRadius: 16,
  },
  interestText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#666',
  },
  infoCard: {
    gap: SPACING.sm,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
  },
});

export default UserProfileScreen;
