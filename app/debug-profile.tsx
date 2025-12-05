import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { supabase } from '../backend/supabase';
import { useAuth } from '../src/contexts/auth-context';
import { Colors } from '../src/constants/colors';
import { Spacing, Typography } from '../src/constants/styles';

export default function DebugProfileScreen() {
  const router = useRouter();
  const { user, profile, role, isAdmin, isHost } = useAuth();
  const [dbProfile, setDbProfile] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDirectFromDB = async () => {
    if (!user?.id) return;

    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        setError(error.message);
      } else {
        setDbProfile(data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDirectFromDB();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>🐛 Profile Debug Screen</Text>

        {/* User Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Auth User</Text>
          <Text style={styles.code}>ID: {user?.id}</Text>
          <Text style={styles.code}>Email: {user?.email}</Text>
        </View>

        {/* Auth Context Profile */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Auth Context Profile</Text>
          <Text style={styles.code}>Role: {profile?.role || 'null'}</Text>
          <Text style={styles.code}>Is Admin: {isAdmin ? 'YES' : 'NO'}</Text>
          <Text style={styles.code}>Is Host: {isHost ? 'YES' : 'NO'}</Text>
          <Text style={styles.code}>Computed Role: {role}</Text>
          <Text style={styles.code}>Full Name: {profile?.full_name || 'null'}</Text>
          <Text style={styles.code}>Email: {profile?.email || 'null'}</Text>
          <Text style={styles.code}>Host Approved: {profile?.is_host_approved ? 'YES' : 'NO'}</Text>
        </View>

        {/* Direct DB Query */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Direct Database Query</Text>
          {loading && <Text style={styles.loading}>Loading...</Text>}
          {error && <Text style={styles.error}>Error: {error}</Text>}
          {dbProfile && (
            <>
              <Text style={styles.code}>Role: {dbProfile.role}</Text>
              <Text style={styles.code}>
                Is Host Approved: {dbProfile.is_host_approved ? 'YES' : 'NO'}
              </Text>
              <Text style={styles.code}>Full Name: {dbProfile.full_name}</Text>
              <Text style={styles.code}>Email: {dbProfile.email}</Text>
              <Text style={styles.code}>Created: {dbProfile.created_at}</Text>
              <Text style={styles.code}>Updated: {dbProfile.updated_at}</Text>
            </>
          )}
        </View>

        {/* Comparison */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⚠️ Mismatch Check</Text>
          {profile && dbProfile && (
            <>
              {profile.role !== dbProfile.role && (
                <Text style={styles.error}>
                  🚨 ROLE MISMATCH!{'\n'}
                  Context: {profile.role} vs DB: {dbProfile.role}
                </Text>
              )}
              {profile.role === dbProfile.role && (
                <Text style={styles.success}>✅ Roles match: {profile.role}</Text>
              )}
            </>
          )}
        </View>

        <Pressable style={styles.button} onPress={fetchDirectFromDB}>
          <Text style={styles.buttonText}>Refresh DB Query</Text>
        </Pressable>

        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Back</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: Spacing.lg,
  },
  title: {
    ...Typography.h2,
    color: Colors.text,
    marginBottom: Spacing.xl,
    textAlign: 'center',
  },
  section: {
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: 8,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    ...Typography.h4,
    color: Colors.primary,
    marginBottom: Spacing.sm,
    fontWeight: '700',
  },
  code: {
    ...Typography.bodySmall,
    fontFamily: 'monospace',
    color: Colors.text,
    marginBottom: 4,
  },
  loading: {
    ...Typography.body,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
  error: {
    ...Typography.body,
    color: Colors.error,
    fontWeight: '600',
  },
  success: {
    ...Typography.body,
    color: Colors.success,
    fontWeight: '600',
  },
  button: {
    backgroundColor: Colors.primary,
    padding: Spacing.md,
    borderRadius: 8,
    marginBottom: Spacing.md,
  },
  buttonText: {
    ...Typography.bodyMedium,
    color: Colors.textInverse,
    textAlign: 'center',
    fontWeight: '600',
  },
  backButton: {
    backgroundColor: Colors.surfaceSecondary,
    padding: Spacing.md,
    borderRadius: 8,
  },
  backButtonText: {
    ...Typography.bodyMedium,
    color: Colors.text,
    textAlign: 'center',
  },
});
