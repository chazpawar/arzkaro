import React from 'react';
import { Tabs } from 'expo-router';
import { View, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../src/constants/Colors';
import { Fonts } from '../../src/constants/Fonts';
import { useAuth } from '../../src/contexts/auth-context';

interface TabIconProps {
  name: keyof typeof Ionicons.glyphMap | 'ticket-custom';
  focused: boolean;
  color: string;
}

function TabIcon({ name, focused: _focused, color }: TabIconProps) {
  // Special handling for ticket emoji
  if (name === 'ticket-custom') {
    return (
      <View style={styles.iconContainer}>
        <Text style={{ fontSize: 24 }}>🎟️</Text>
      </View>
    );
  }

  return (
    <View style={styles.iconContainer}>
      <Ionicons name={name as keyof typeof Ionicons.glyphMap} size={24} color={color} />
    </View>
  );
}

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const { isHost, effectiveRole } = useAuth();

  // Determine if user is viewing as host
  const showHostListings = isHost && effectiveRole === 'host';

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textSecondary,
        tabBarStyle: {
          backgroundColor: Colors.background,
          borderTopColor: Colors.borderLight,
          borderTopWidth: 1,
          height: 60 + insets.bottom,
          paddingBottom: insets.bottom,
          paddingTop: 8,
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontFamily: Fonts.medium,
          marginTop: 2,
          marginBottom: 4,
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="explore"
        options={{
          title: showHostListings ? 'Listings' : 'Explore',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon
              name={focused ? 'compass' : 'compass-outline'}
              focused={focused}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="chats"
        options={{
          title: 'Chats',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon
              name={focused ? 'chatbubbles' : 'chatbubbles-outline'}
              focused={focused}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="tickets"
        options={{
          title: 'Tickets',
          tabBarIcon: ({ focused: _focused, color }) => (
            <TabIcon name="ticket-custom" focused={_focused} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon name={focused ? 'person' : 'person-outline'} focused={focused} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
});
