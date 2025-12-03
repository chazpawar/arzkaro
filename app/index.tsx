import React from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '../src/components/Button';
import Card from '../src/components/Card';
import AuthScreen from '../src/components/AuthScreen';
import { Colors } from '../src/constants/Colors';
import { Spacing, Typography } from '../src/constants/Styles';
import { useAuth } from '../src/contexts/AuthContext';

export default function HomeScreen() {
    const router = useRouter();
    const { user, loading, signOut } = useAuth();

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.light.primary} />
            </View>
        );
    }

    if (!user) {
        return <AuthScreen />;
    }

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.header}>
                    <Text style={styles.title}>Welcome to Arzkaro! 🚀</Text>
                    <Text style={styles.subtitle}>
                        Your React Native Expo app with Supabase Auth
                    </Text>
                    {user.email && (
                        <Text style={styles.userEmail}>Signed in as: {user.email}</Text>
                    )}
                </View>

                <Card style={styles.card}>
                    <Text style={styles.cardTitle}>✨ Features</Text>
                    <Text style={styles.cardText}>• TypeScript support</Text>
                    <Text style={styles.cardText}>• Expo Router navigation</Text>
                    <Text style={styles.cardText}>• Supabase Auth with Google OAuth</Text>
                    <Text style={styles.cardText}>• Local EAS builds for iOS</Text>
                    <Text style={styles.cardText}>• Modern UI components</Text>
                    <Text style={styles.cardText}>• pnpm package manager</Text>
                </Card>

                <Card style={styles.card}>
                    <Text style={styles.cardTitle}>🎨 Design System</Text>
                    <Text style={styles.cardText}>
                        This app uses a custom design system with consistent colors,
                        typography, spacing, and reusable components.
                    </Text>
                </Card>

                <View style={styles.buttonContainer}>
                    <Button
                        title="View Profile"
                        onPress={() => router.push('/profile')}
                        variant="primary"
                        size="large"
                    />
                    <Button
                        title="Settings"
                        onPress={() => router.push('/settings')}
                        variant="outline"
                        size="large"
                    />
                    <Button
                        title="Sign Out"
                        onPress={signOut}
                        variant="outline"
                        size="large"
                    />
                </View>

                <View style={styles.footer}>
                    <Text style={styles.footerText}>
                        Built with ❤️ using Expo, React Native & Supabase
                    </Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.light.background,
    },
    container: {
        flex: 1,
        backgroundColor: Colors.light.background,
    },
    scrollContent: {
        padding: Spacing.lg,
        paddingBottom: Spacing.xl * 3, // Extra padding at bottom
    },
    header: {
        marginBottom: Spacing.xl,
    },
    title: {
        ...Typography.h1,
        color: Colors.light.text,
        marginBottom: Spacing.sm,
    },
    subtitle: {
        ...Typography.body,
        color: Colors.light.textSecondary,
        marginBottom: Spacing.xs,
    },
    userEmail: {
        ...Typography.bodySmall,
        color: Colors.light.primary,
        marginTop: Spacing.xs,
    },
    card: {
        marginBottom: Spacing.lg,
    },
    cardTitle: {
        ...Typography.h3,
        color: Colors.light.text,
        marginBottom: Spacing.md,
    },
    cardText: {
        ...Typography.body,
        color: Colors.light.textSecondary,
        marginBottom: Spacing.sm,
    },
    buttonContainer: {
        gap: Spacing.md,
        marginTop: Spacing.lg,
    },
    footer: {
        marginTop: Spacing.xl * 2,
        marginBottom: Spacing.xl,
        alignItems: 'center',
    },
    footerText: {
        ...Typography.bodySmall,
        color: Colors.light.textSecondary,
    },
});
