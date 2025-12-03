import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '../src/contexts/AuthContext';

export default function RootLayout() {
    return (
        <AuthProvider>
            <StatusBar style="auto" />
            <Stack
                screenOptions={{
                    headerStyle: {
                        backgroundColor: '#6366f1',
                    },
                    headerTintColor: '#fff',
                    headerTitleStyle: {
                        fontWeight: '600',
                    },
                }}
            >
                <Stack.Screen
                    name="index"
                    options={{
                        title: 'Home',
                    }}
                />
                <Stack.Screen
                    name="profile"
                    options={{
                        title: 'Profile',
                    }}
                />
                <Stack.Screen
                    name="settings"
                    options={{
                        title: 'Settings',
                    }}
                />
            </Stack>
        </AuthProvider>
    );
}
