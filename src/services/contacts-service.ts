import * as Contacts from 'expo-contacts';
import { Alert } from 'react-native';
import { supabase } from '../../backend/supabase';

export interface ContactMatch {
  id: string;
  full_name: string;
  email?: string;
  phone?: string;
  avatar_url?: string;
  match_source: 'email' | 'phone';
}

/**
 * Request permission to access device contacts
 */
export async function requestContactsPermission(): Promise<boolean> {
  try {
    const { status } = await Contacts.requestPermissionsAsync();

    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'ArzKaro needs access to your contacts to help you find friends who are already on the platform. We only use this to match phone numbers and emails - we never store your contacts on our servers.',
        [{ text: 'OK' }]
      );
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error requesting contacts permission:', error);
    return false;
  }
}

/**
 * Normalize phone number - remove all non-numeric characters
 */
function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, '');
}

/**
 * Fetch device contacts and find matches on ArzKaro platform
 */
export async function findFriendsFromContacts(): Promise<ContactMatch[]> {
  try {
    // Request permission if not already granted
    const hasPermission = await requestContactsPermission();
    if (!hasPermission) {
      return [];
    }

    // Fetch all contacts
    const { data: contactsData } = await Contacts.getContactsAsync({
      fields: [Contacts.Fields.Name, Contacts.Fields.Emails, Contacts.Fields.PhoneNumbers],
    });

    if (!contactsData || contactsData.length === 0) {
      return [];
    }

    // Extract and normalize emails and phone numbers
    const emails: string[] = [];
    const phones: string[] = [];

    for (const contact of contactsData) {
      // Extract emails
      if (contact.emails && contact.emails.length > 0) {
        for (const emailObj of contact.emails) {
          if (emailObj.email) {
            emails.push(emailObj.email.toLowerCase().trim());
          }
        }
      }

      // Extract phone numbers
      if (contact.phoneNumbers && contact.phoneNumbers.length > 0) {
        for (const phoneObj of contact.phoneNumbers) {
          if (phoneObj.number) {
            const normalized = normalizePhone(phoneObj.number);
            if (normalized.length >= 10) {
              phones.push(normalized);
            }
          }
        }
      }
    }

    // Remove duplicates
    const uniqueEmails = [...new Set(emails)];
    const uniquePhones = [...new Set(phones)];

    console.log(
      `Found ${uniqueEmails.length} unique emails and ${uniquePhones.length} unique phone numbers`
    );

    // Get current user to exclude them from results
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Query database for matching users by email
    const emailMatches: ContactMatch[] = [];
    if (uniqueEmails.length > 0) {
      const { data: emailUsers, error: emailError } = await supabase
        .from('profiles')
        .select('id, full_name, email, avatar_url')
        .in('email', uniqueEmails)
        .neq('id', user.id);

      if (emailError) {
        console.error('Error fetching email matches:', emailError);
      } else if (emailUsers) {
        emailMatches.push(
          ...emailUsers.map((u) => ({
            id: u.id,
            full_name: u.full_name || 'Unknown',
            email: u.email,
            avatar_url: u.avatar_url,
            match_source: 'email' as const,
          }))
        );
      }
    }

    // Query database for matching users by phone (stored in profiles table)
    const phoneMatches: ContactMatch[] = [];
    if (uniquePhones.length > 0) {
      const { data: phoneUsers, error: phoneError } = await supabase
        .from('profiles')
        .select('id, full_name, phone, avatar_url')
        .in('phone', uniquePhones)
        .neq('id', user.id);

      if (phoneError) {
        console.error('Error fetching phone matches:', phoneError);
      } else if (phoneUsers) {
        phoneMatches.push(
          ...phoneUsers.map((u) => ({
            id: u.id,
            full_name: u.full_name || 'Unknown',
            phone: u.phone,
            avatar_url: u.avatar_url,
            match_source: 'phone' as const,
          }))
        );
      }
    }

    // Combine and deduplicate matches (prefer email matches)
    const allMatches = [...emailMatches, ...phoneMatches];
    const uniqueMatches = new Map<string, ContactMatch>();

    for (const match of allMatches) {
      if (!uniqueMatches.has(match.id)) {
        uniqueMatches.set(match.id, match);
      }
    }

    const results = Array.from(uniqueMatches.values());
    console.log(`Found ${results.length} friends on ArzKaro`);

    return results;
  } catch (error) {
    console.error('Error finding friends from contacts:', error);
    throw error;
  }
}
