import React from 'react';
import { Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@context/AuthContext';
import { COLORS } from '@theme';

import LoginScreen from '@screens/Auth/LoginScreen';
import RegisterScreen from '@screens/Auth/RegisterScreen';
import HomeScreen from '@screens/Home/HomeScreen';
import ChatsScreen from '@screens/Chat/ChatsScreen';
import TicketsScreen from '@screens/Ticket/TicketsScreen';
import ProfileScreen from '@screens/Profile/ProfileScreen';
import EventDetailsScreen from '@screens/Event/EventDetailsScreen';
import CreateEventScreen from '@screens/Event/CreateEventScreen';
import AllEventsScreen from '@screens/Event/AllEventsScreen';
import ChatRoomScreen from '@screens/Chat/ChatRoomScreen';
import TicketDetailScreen from '@screens/Ticket/TicketDetailScreen';
import EditProfileScreen from '@screens/Profile/EditProfileScreen';
import SettingsScreen from '@screens/Profile/SettingsScreen';
import FriendsScreen from '@screens/Friends/FriendsScreen';
import FriendRequestsScreen from '@screens/Friends/FriendRequestsScreen';
import UserProfileScreen from '@screens/Friends/UserProfileScreen';
import PaymentScreen from '@screens/Payment/PaymentScreen';
import HostRequestScreen from '@screens/Host/HostRequestScreen';
import HelpSupportScreen from '@screens/Profile/HelpSupportScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const TabNavigator = () => {
  const insets = useSafeAreaInsets();
  
  // Calculate bottom padding - use safe area inset on both platforms
  const bottomPadding = Platform.OS === 'ios' ? Math.max(insets.bottom, 10) : Math.max(insets.bottom, 10);
  const tabBarHeight = Platform.OS === 'ios' ? 60 + bottomPadding : 60 + bottomPadding;

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          if (route.name === 'HomeTab') {
            return <Ionicons name={focused ? 'compass' : 'compass-outline'} size={26} color={color} />;
          } else if (route.name === 'ChatsTab') {
            return <Ionicons name={focused ? 'chatbubble' : 'chatbubble-outline'} size={24} color={color} />;
          } else if (route.name === 'TicketsTab') {
            return <Ionicons name={focused ? 'ticket' : 'ticket-outline'} size={24} color={color} />;
          } else if (route.name === 'ProfileTab') {
            return <Ionicons name={focused ? 'person' : 'person-outline'} size={24} color={color} />;
          }

          return <Ionicons name="ellipse-outline" size={24} color={color} />;
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textGray,
        tabBarStyle: {
          backgroundColor: COLORS.white,
          borderTopWidth: 0,
          paddingBottom: bottomPadding,
          paddingTop: 8,
          height: tabBarHeight,
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
          marginTop: 2,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen name="HomeTab" component={HomeScreen} options={{ tabBarLabel: 'Explore' }} />
      <Tab.Screen name="ChatsTab" component={ChatsScreen} options={{ tabBarLabel: 'Chats' }} />
      <Tab.Screen name="TicketsTab" component={TicketsScreen} options={{ tabBarLabel: 'Tickets' }} />
      <Tab.Screen name="ProfileTab" component={ProfileScreen} options={{ tabBarLabel: 'Profile' }} />
    </Tab.Navigator>
  );
};

const AppNavigator = () => {
  const { isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login" screenOptions={{ headerShown: false }}>
        {/* Auth Screens */}
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        
        {/* Main App Screens */}
        <Stack.Screen name="Main" component={TabNavigator} />
        <Stack.Screen name="EventDetails" component={EventDetailsScreen} />
        <Stack.Screen name="CreateEvent" component={CreateEventScreen} />
        <Stack.Screen name="AllEvents" component={AllEventsScreen} />
        <Stack.Screen name="ChatRoom" component={ChatRoomScreen} />
        <Stack.Screen name="TicketDetail" component={TicketDetailScreen} />
        <Stack.Screen name="EditProfile" component={EditProfileScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
        <Stack.Screen name="Friends" component={FriendsScreen} />
        <Stack.Screen name="FriendRequests" component={FriendRequestsScreen} />
        <Stack.Screen name="UserProfile" component={UserProfileScreen} />
        <Stack.Screen name="Payment" component={PaymentScreen} />
        <Stack.Screen name="HostRequest" component={HostRequestScreen} />
        <Stack.Screen name="HelpSupport" component={HelpSupportScreen} />
        
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
