import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '../src/components/Button';
import Card from '../src/components/Card';
import { Colors } from '../src/constants/Colors';
import { Spacing, Typography } from '../src/constants/Styles';

export default function ProfileScreen() {
    const router = useRouter();

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.avatarContainer}>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>👤</Text>
                    </View>
                </View>

                <Card style={styles.card}>
                    <Text style={styles.label}>Name</Text>
                    <Text style={styles.value}>John Doe</Text>
                </Card>

                <Card style={styles.card}>
                    <Text style={styles.label}>Email</Text>
                    <Text style={styles.value}>john.doe@example.com</Text>
                </Card>

                <Card style={styles.card}>
                    <Text style={styles.label}>Role</Text>
                    <Text style={styles.value}>Developer</Text>
                </Card>

                <Card style={styles.card}>
                    <Text style={styles.label}>Bio</Text>
                    <Text style={styles.value}>
                        Passionate about building beautiful mobile applications with React Native and Expo.
                    </Text>
                </Card>

                <View style={styles.buttonContainer}>
                    <Button
                        title="Edit Profile"
                        onPress={() => console.log('Edit profile')}
                        variant="primary"
                        size="large"
                    />
                    <Button
                        title="Back to Home"
                        onPress={() => router.back()}
                        variant="outline"
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
    },
    avatarText: {
        fontSize: 60,
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
    buttonContainer: {
        gap: Spacing.md,
        marginTop: Spacing.xl,
    },
});
