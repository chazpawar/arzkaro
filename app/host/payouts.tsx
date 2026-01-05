import React from 'react';
import { View, Text, StyleSheet, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import BackButton from '../../src/components/ui/back-button';
import { Colors } from '../../src/constants/Colors';
import { Spacing, Typography } from '../../src/constants/Styles';
import { Fonts } from '../../src/constants/Fonts';
import { useAuth } from '../../src/contexts/auth-context';
import HostPayoutRequests from '../../src/components/host/host-payout-requests';
import EmptyState from '../../src/components/ui/empty-state';

export default function HostPayoutsPage() {
  const router = useRouter();
  const { user, isHost, isAdmin } = useAuth();

  // Redirect non-hosts
  if (!isHost && !isAdmin) {
    return (
      <SafeAreaView style={styles.container}>
        <EmptyState
          title="Become a Host"
          emoji="🎭"
          message="Apply to become a host to access payout features."
          action={{
            label: 'Apply Now',
            onPress: () => router.push('/host/request'),
          }}
        />
      </SafeAreaView>
    );
  }

  if (!user?.id) {
    return (
      <SafeAreaView style={styles.container}>
        <EmptyState
          title="Authentication Required"
          emoji="🔒"
          message="Please sign in to access payout requests."
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />

      {/* Header */}
      <View style={styles.header}>
        <BackButton variant="minimal" />
        <Text style={styles.headerTitle}>Payout Requests</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      {/* Content */}
      <HostPayoutRequests hostId={user.id} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    ...Typography.h4,
    color: Colors.text,
    fontFamily: Fonts.semiBold,
  },
  headerPlaceholder: {
    width: 40,
  },
});
