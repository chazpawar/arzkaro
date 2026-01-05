/**
 * Share Utilities
 * Helper functions for sharing content using native share dialogs
 * Generates deep links and triggers native share sheet
 */

import * as Sharing from 'expo-sharing';
import { Alert, Platform, Share } from 'react-native';
import {
  generateEventDeepLink,
  generateUserDeepLink,
  generateGroupDeepLink,
  generateTripDeepLink,
} from './deep-link-handler';

/**
 * Share an event with others
 * @param eventId - The event ID to share
 * @param eventTitle - The event title for the share message
 */
export async function shareEvent(eventId: string, eventTitle: string): Promise<void> {
  try {
    const deepLink = generateEventDeepLink(eventId);
    const message = `Check out "${eventTitle}" on ArzKaro!\n\n${deepLink}`;

    await shareContent(message, 'Share Event');
  } catch (error) {
    console.error('[SHARE] Error sharing event:', error);
    Alert.alert('Share Failed', 'Unable to share this event. Please try again.');
  }
}

/**
 * Share a user profile
 * @param userId - The user ID to share
 * @param userName - The user name for the share message
 */
export async function shareUserProfile(userId: string, userName: string): Promise<void> {
  try {
    const deepLink = generateUserDeepLink(userId);
    const message = `Check out ${userName}'s profile on ArzKaro!\n\n${deepLink}`;

    await shareContent(message, 'Share Profile');
  } catch (error) {
    console.error('[SHARE] Error sharing user profile:', error);
    Alert.alert('Share Failed', 'Unable to share this profile. Please try again.');
  }
}

/**
 * Share a group
 * @param groupId - The group ID to share
 * @param groupName - The group name for the share message
 */
export async function shareGroup(groupId: string, groupName: string): Promise<void> {
  try {
    const deepLink = generateGroupDeepLink(groupId);
    const message = `Join "${groupName}" on ArzKaro!\n\n${deepLink}`;

    await shareContent(message, 'Share Group');
  } catch (error) {
    console.error('[SHARE] Error sharing group:', error);
    Alert.alert('Share Failed', 'Unable to share this group. Please try again.');
  }
}

/**
 * Share a trip
 * @param tripId - The trip ID to share
 * @param tripTitle - The trip title for the share message
 */
export async function shareTrip(tripId: string, tripTitle: string): Promise<void> {
  try {
    const deepLink = generateTripDeepLink(tripId);
    const message = `Check out "${tripTitle}" trip on ArzKaro!\n\n${deepLink}`;

    await shareContent(message, 'Share Trip');
  } catch (error) {
    console.error('[SHARE] Error sharing trip:', error);
    Alert.alert('Share Failed', 'Unable to share this trip. Please try again.');
  }
}

/**
 * Internal function to handle sharing content
 * Uses native share dialog on iOS/Android
 */
async function shareContent(message: string, dialogTitle: string): Promise<void> {
  try {
    // Check if sharing is available
    const isAvailable = await Sharing.isAvailableAsync();

    if (!isAvailable) {
      console.warn('[SHARE] Sharing not available on this platform');
      Alert.alert('Share Unavailable', 'Sharing is not available on this device.');
      return;
    }

    // On iOS and Android, we can use the native Share API via React Native
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      await Share.share(
        {
          message,
          title: dialogTitle,
        },
        {
          dialogTitle,
        }
      );
    } else {
      // Fallback for web or other platforms
      console.log('[SHARE] Share message:', message);
      Alert.alert('Share', message);
    }
  } catch (error: any) {
    // User cancelled share or error occurred
    if (error?.message !== 'User did not share') {
      throw error;
    }
  }
}
