import React from 'react';
import { View, Text, StyleSheet, StatusBar, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../src/constants/Colors';
import { Spacing, Typography } from '../../src/constants/Styles';
import { useAuth } from '../../src/contexts/auth-context';
import AdminPayoutRequests from '../../src/components/admin/admin-payout-requests';
import EmptyState from '../../src/components/ui/empty-state';

export default function AdminPayoutsPage() {
  const router = useRouter();
  const { user, isAdmin } = useAuth();

  // Redirect non-admins
  if (!isAdmin) {
    return (
      <SafeAreaView style={styles.container}>
        <EmptyState
          title="Access Denied"
          emoji="🚫"
          message="Only administrators can access payout management."
          action={{
            label: 'Go Back',
            onPress: () => router.back(),
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
          message="Please sign in to access admin features."
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />

      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Payout Requests</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      {/* Content */}
      <AdminPayoutRequests adminId={user.id} />
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
    fontWeight: '600',
  },
  headerPlaceholder: {
    width: 40,
  },
});
