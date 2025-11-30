import React from 'react';
import { StatusBar, View, ActivityIndicator } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import { AuthProvider } from '@context/AuthContext';
import { TicketProvider } from '@context/TicketContext';
import AppNavigator from '@navigation/AppNavigator';
import { GluestackUIProvider } from '@/components/ui/gluestack-ui-provider';

const App = () => {
  const [fontsLoaded] = useFonts({
    'MaterialIcons': require('@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/MaterialIcons.ttf'),
    'Ionicons': require('@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/Ionicons.ttf'),
  });

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF' }}>
        <ActivityIndicator size="large" color="#6C5CE7" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <GluestackUIProvider mode="light">
        <AuthProvider>
          <TicketProvider>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
            <AppNavigator />
          </TicketProvider>
        </AuthProvider>
      </GluestackUIProvider>
    </SafeAreaProvider>
  );
};

export default App;
