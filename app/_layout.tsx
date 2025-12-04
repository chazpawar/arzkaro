import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '../src/contexts/auth-context';
import { Colors } from '../src/constants/colors';

export default function RootLayout() {
  return (
    <AuthProvider>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: Colors.background,
          },
          headerTintColor: Colors.text,
          headerTitleStyle: {
            fontWeight: '600',
          },
          contentStyle: {
            backgroundColor: Colors.background,
          },
          headerShadowVisible: false,
        }}
      >
        <Stack.Screen
          name="index"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="(tabs)"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="events/[id]"
          options={{
            headerShown: true,
            headerTransparent: true,
            headerTitle: '',
          }}
        />
        <Stack.Screen
          name="events/[id]/book"
          options={{
            title: 'Book Tickets',
            presentation: 'card',
          }}
        />
        <Stack.Screen
          name="events/[id]/chat"
          options={{
            title: 'Event Chat',
          }}
        />
        <Stack.Screen
          name="events/create"
          options={{
            title: 'Create Event',
            presentation: 'modal',
          }}
        />
        <Stack.Screen
          name="tickets/[id]"
          options={{
            title: 'Ticket Details',
          }}
        />
        <Stack.Screen
          name="chats/dm/[id]"
          options={{
            title: 'Chat',
          }}
        />
        <Stack.Screen
          name="profile"
          options={{
            title: 'Edit Profile',
          }}
        />
        <Stack.Screen
          name="settings"
          options={{
            title: 'Settings',
          }}
        />
        <Stack.Screen
          name="admin"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="host"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="auth/callback"
          options={{
            headerShown: false,
            presentation: 'transparentModal',
          }}
        />
      </Stack>
    </AuthProvider>
  );
}
