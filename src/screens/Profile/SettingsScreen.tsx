import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Alert,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING } from '@theme';
import { useAuth } from '@context/AuthContext';

const SettingsScreen = ({ navigation }: any) => {
  const { user } = useAuth();

  const handleChangePassword = () => {
    Alert.alert('Change Password', 'Password change functionality coming soon!');
  };

  const handleCompleteKYC = () => {
    Alert.alert('Complete KYC', 'KYC verification coming soon!');
  };

  const handleChangePhoneNumber = () => {
    Alert.alert('Change Phone Number', 'Phone number change coming soon!');
  };

  const handleTerms = () => {
    Alert.alert('Terms & Conditions', 'Terms and conditions will be displayed here.');
  };

  const handlePrivacyPolicy = () => {
    Alert.alert('Privacy Policy', 'Privacy policy will be displayed here.');
  };

  const handleSupportContact = () => {
    Alert.alert(
      'Contact Support',
      'How would you like to reach us?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Email', onPress: () => Linking.openURL('mailto:support@arzkaro.com') },
        { text: 'Call', onPress: () => Linking.openURL('tel:+911234567890') },
      ]
    );
  };

  const settingsItems = [
    { 
      icon: 'lock-closed-outline', 
      label: 'Change Password', 
      onPress: handleChangePassword,
    },
    { 
      icon: 'shield-checkmark-outline', 
      label: 'Complete KYC', 
      onPress: handleCompleteKYC,
    },
    { 
      icon: 'call-outline', 
      label: 'Change Phone Number', 
      onPress: handleChangePhoneNumber,
    },
    { 
      icon: 'person-outline', 
      label: 'Edit Your Profile', 
      onPress: () => navigation.navigate('EditProfile'),
    },
    ...(!user?.isHost ? [{ 
      icon: 'star-outline', 
      label: 'Become a Host', 
      onPress: () => navigation.navigate('HostRequest'),
    }] : []),
    { 
      icon: 'document-text-outline', 
      label: 'Terms & Conditions', 
      onPress: handleTerms,
    },
    { 
      icon: 'shield-outline', 
      label: 'Privacy Policy', 
      onPress: handlePrivacyPolicy,
    },
    { 
      icon: 'headset-outline', 
      label: 'Support Contact', 
      onPress: handleSupportContact,
    },
  ];

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
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
      >
        {/* Menu Items */}
        <View style={styles.menuContainer}>
          {settingsItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.menuItem}
              onPress={item.onPress}
              activeOpacity={0.7}
            >
              <View style={styles.menuLeft}>
                <Ionicons name={item.icon as any} size={20} color={COLORS.black} />
                <Text style={styles.menuLabel}>{item.label}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={COLORS.textGray} />
            </TouchableOpacity>
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
    borderBottomColor: COLORS.border,
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
    color: COLORS.black,
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  menuContainer: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.black,
  },
});

export default SettingsScreen;
