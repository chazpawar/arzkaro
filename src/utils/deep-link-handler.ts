/**
 * Deep Link Handler
 * Handles incoming deep links using custom URL scheme (arzkaro://)
 * Supports links for events, users, groups, and trips
 */

import { useEffect } from 'react';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';

/**
 * Hook to handle deep linking throughout the app
 * Should be initialized in the root layout
 */
export function useDeepLinking() {
  const router = useRouter();

  useEffect(() => {
    // Handle the initial URL that opened the app (when app was closed)
    const handleInitialURL = async () => {
      try {
        const initialUrl = await Linking.getInitialURL();
        if (initialUrl) {
          console.log('[DEEP_LINK] App opened with URL:', initialUrl);
          handleDeepLink(initialUrl, router);
        }
      } catch (error) {
        console.error('[DEEP_LINK] Error getting initial URL:', error);
      }
    };

    handleInitialURL();

    // Handle URLs when app is already open
    const subscription = Linking.addEventListener('url', (event) => {
      console.log('[DEEP_LINK] URL received:', event.url);
      handleDeepLink(event.url, router);
    });

    // Cleanup
    return () => {
      subscription.remove();
    };
  }, [router]);
}

/**
 * Parse and handle a deep link URL
 * Supported formats:
 * - arzkaro://event/123
 * - arzkaro://user/rohit
 * - arzkaro://group/456
 * - arzkaro://trip/789
 */
function handleDeepLink(url: string, router: any) {
  try {
    const parsed = Linking.parse(url);
    console.log('[DEEP_LINK] Parsed URL:', JSON.stringify(parsed, null, 2));

    // Extract path segments
    // For "arzkaro://event/123", path will be "event/123"
    const path = parsed.path;

    if (!path) {
      console.warn('[DEEP_LINK] No path found in URL:', url);
      return;
    }

    // Split path into segments
    const segments = path.split('/').filter(Boolean);

    if (segments.length === 0) {
      console.warn('[DEEP_LINK] No segments found in path:', path);
      return;
    }

    const [type, id] = segments;

    if (!type || !id) {
      console.warn('[DEEP_LINK] Invalid path format:', path);
      return;
    }

    // Route to appropriate screen based on type
    switch (type.toLowerCase()) {
      case 'event':
        console.log('[DEEP_LINK] Navigating to event:', id);
        router.push(`/events/${id}`);
        break;

      case 'user':
        console.log('[DEEP_LINK] Navigating to user profile:', id);
        router.push(`/user-profile?id=${id}`);
        break;

      case 'group':
        console.log('[DEEP_LINK] Navigating to group:', id);
        // TODO: Add group screen route when available
        router.push(`/group/${id}`);
        break;

      case 'trip':
        console.log('[DEEP_LINK] Navigating to trip:', id);
        // Trips are events with trip_type, so use event route
        router.push(`/events/${id}`);
        break;

      default:
        console.warn('[DEEP_LINK] Unknown link type:', type);
    }
  } catch (error) {
    console.error('[DEEP_LINK] Error handling deep link:', error);
  }
}

/**
 * Generate a deep link URL for an event
 */
export function generateEventDeepLink(eventId: string): string {
  return `arzkaro://event/${eventId}`;
}

/**
 * Generate a deep link URL for a user profile
 */
export function generateUserDeepLink(userId: string): string {
  return `arzkaro://user/${userId}`;
}

/**
 * Generate a deep link URL for a group
 */
export function generateGroupDeepLink(groupId: string): string {
  return `arzkaro://group/${groupId}`;
}

/**
 * Generate a deep link URL for a trip
 */
export function generateTripDeepLink(tripId: string): string {
  return `arzkaro://trip/${tripId}`;
}
