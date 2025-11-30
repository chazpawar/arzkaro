import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@services/firebase/config';
import { UserProfile, UserResponse } from './types';

/**
 * Fetches user profile from Firestore.
 * @param uid User ID
 * @returns Object containing user data or error message
 */
export const getUserProfile = async (uid: string): Promise<UserResponse> => {
  try {
    const docRef = doc(db, 'users', uid);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return { data: docSnap.data() as UserProfile, error: null };
    } else {
      return { data: null, error: 'User not found' };
    }
  } catch (error: any) {
    return { data: null, error: error.message };
  }
};

/**
 * Creates or updates a user profile in Firestore.
 * @param uid User ID
 * @param data User data to save
 * @returns Object containing error message if any
 */
export const updateUserProfile = async (
  uid: string,
  data: Partial<UserProfile>,
): Promise<{ error: string | null }> => {
  try {
    const docRef = doc(db, 'users', uid);
    // Use setDoc with merge: true to create if not exists or update if exists
    await setDoc(docRef, data, { merge: true });
    return { error: null };
  } catch (error: any) {
    return { error: error.message };
  }
};
