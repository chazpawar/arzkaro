import { Stack } from 'expo-router';
import { Colors } from '../../src/constants/Colors';

export default function HostLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: Colors.background,
        },
        headerTintColor: Colors.text,
        headerBackTitle: 'Back',
      }}
    >
      <Stack.Screen
        name="dashboard"
        options={{
          title: '',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="request"
        options={{
          title: 'Become a Host',
        }}
      />
      <Stack.Screen
        name="scanner"
        options={{
          title: 'Scan Tickets',
          presentation: 'fullScreenModal',
          headerShown: false,
        }}
      />
    </Stack>
  );
}
