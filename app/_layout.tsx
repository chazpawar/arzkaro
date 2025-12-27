import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '../src/contexts/auth-context';
import { Colors } from '../src/constants/Colors';
import { Fonts } from '../src/constants/Fonts';
import {
  useFonts,
  LeagueSpartan_100Thin,
  LeagueSpartan_200ExtraLight,
  LeagueSpartan_300Light,
  LeagueSpartan_400Regular,
  LeagueSpartan_500Medium,
  LeagueSpartan_600SemiBold,
  LeagueSpartan_700Bold,
  LeagueSpartan_800ExtraBold,
  LeagueSpartan_900Black,
} from '@expo-google-fonts/league-spartan';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    LeagueSpartan_100Thin,
    LeagueSpartan_200ExtraLight,
    LeagueSpartan_300Light,
    LeagueSpartan_400Regular,
    LeagueSpartan_500Medium,
    LeagueSpartan_600SemiBold,
    LeagueSpartan_700Bold,
    LeagueSpartan_800ExtraBold,
    LeagueSpartan_900Black,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

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
            fontFamily: Fonts.semiBold,
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
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="edit-profile"
          options={{
            headerShown: false,
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
