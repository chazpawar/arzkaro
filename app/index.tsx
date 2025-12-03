import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '../src/components/Button';
import Card from '../src/components/Card';
import { Colors } from '../src/constants/Colors';
import { Spacing, Typography } from '../src/constants/Styles';

export default function HomeScreen() {
    const router = useRouter();

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.header}>
                    <Text style={styles.title}>Welcome to Arzkaro! 🚀</Text>
                    <Text style={styles.subtitle}>
                        Your React Native Expo app with local EAS builds
                    </Text>
                </View>

                <Card style={styles.card}>
                    <Text style={styles.cardTitle}>✨ Features</Text>
                    <Text style={styles.cardText}>• TypeScript support</Text>
                    <Text style={styles.cardText}>• Expo Router navigation</Text>
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
                </View>

                <View style={styles.footer}>
                    <Text style={styles.footerText}>
                        Built with ❤️ using Expo & React Native
                    </Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.light.background,
    },
    scrollContent: {
        padding: Spacing.lg,
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
        marginTop: Spacing.xl,
        alignItems: 'center',
    },
    footerText: {
        ...Typography.bodySmall,
        color: Colors.light.textSecondary,
    },
});
