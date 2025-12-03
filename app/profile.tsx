import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '../src/components/Button';
import Card from '../src/components/Card';
import { Colors } from '../src/constants/Colors';
import { Spacing, Typography } from '../src/constants/Styles';
import { useAuth } from '../src/contexts/AuthContext';

export default function ProfileScreen() {
    const router = useRouter();
    const { user, signOut } = useAuth();
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    // Get user metadata from Google OAuth
    const userMetadata = user?.user_metadata;
    const fullName = userMetadata?.full_name || userMetadata?.name || 'Anonymous User';
    const email = user?.email || 'No email provided';
    const avatarUrl = userMetadata?.avatar_url || userMetadata?.picture;
    const provider = user?.app_metadata?.provider || 'email';

    const handleLogout = async () => {
        Alert.alert(
            'Sign Out',
            'Are you sure you want to sign out?',
            [
                {
                    text: 'Cancel',
                    style: 'cancel',
                },
                {
                    text: 'Sign Out',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            setIsLoggingOut(true);
                            await signOut();
                            // Navigation will be handled automatically by the auth state change
                        } catch (error) {
                            console.error('Logout error:', error);
                            Alert.alert('Error', 'Failed to sign out. Please try again.');
                            setIsLoggingOut(false);
                        }
                    },
                },
            ]
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.avatarContainer}>
                    {avatarUrl ? (
                        <Image
                            source={{ uri: avatarUrl }}
                            style={styles.avatarImage}
                        />
                    ) : (
                        <View style={styles.avatar}>
                            <Text style={styles.avatarText}>
                                {fullName.charAt(0).toUpperCase()}
                            </Text>
                        </View>
                    )}
                    <Text style={styles.userName}>{fullName}</Text>
                </View>

                <Card style={styles.card}>
                    <Text style={styles.label}>Email</Text>
                    <Text style={styles.value}>{email}</Text>
                </Card>

                <Card style={styles.card}>
                    <Text style={styles.label}>Sign-in Provider</Text>
                    <Text style={styles.value}>
                        {provider === 'google' ? 'Google' : provider.charAt(0).toUpperCase() + provider.slice(1)}
                    </Text>
                </Card>

                <Card style={styles.card}>
                    <Text style={styles.label}>User ID</Text>
                    <Text style={styles.valueSmall}>{user?.id || 'N/A'}</Text>
                </Card>

                <Card style={styles.card}>
                    <Text style={styles.label}>Account Created</Text>
                    <Text style={styles.value}>
                        {user?.created_at 
                            ? new Date(user.created_at).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                            })
                            : 'N/A'
                        }
                    </Text>
                </Card>

                <View style={styles.buttonContainer}>
                    <Button
                        title={isLoggingOut ? 'Signing Out...' : 'Sign Out'}
                        onPress={handleLogout}
                        variant="outline"
                        size="large"
                        disabled={isLoggingOut}
                    />
                    {isLoggingOut && (
                        <ActivityIndicator size="small" color={Colors.light.primary} style={styles.loader} />
                    )}
                    <Button
                        title="Back to Home"
                        onPress={() => router.back()}
                        variant="primary"
                        size="large"
                    />
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
    avatarContainer: {
        alignItems: 'center',
        marginBottom: Spacing.xl,
    },
    avatar: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: Colors.light.primary,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: Spacing.md,
    },
    avatarImage: {
        width: 120,
        height: 120,
        borderRadius: 60,
        marginBottom: Spacing.md,
    },
    avatarText: {
        fontSize: 60,
        color: '#FFFFFF',
        fontWeight: 'bold',
    },
    userName: {
        ...Typography.h2,
        color: Colors.light.text,
        fontWeight: 'bold',
    },
    card: {
        marginBottom: Spacing.md,
    },
    label: {
        ...Typography.bodySmall,
        color: Colors.light.textSecondary,
        marginBottom: Spacing.xs,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    value: {
        ...Typography.body,
        color: Colors.light.text,
    },
    valueSmall: {
        ...Typography.bodySmall,
        color: Colors.light.text,
        fontFamily: 'monospace',
    },
    buttonContainer: {
        gap: Spacing.md,
        marginTop: Spacing.xl,
    },
    loader: {
        marginVertical: Spacing.sm,
    },
});
