
'use client';

import {
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
  type Firestore,
  type FieldValue,
  deleteDoc,
} from 'firebase/firestore';
import type { User } from 'firebase/auth';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

/**
 * Defines the structure for a user profile document in Firestore.
 */
export interface UserProfile {
  id: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  role: 'Owner' | 'Agent' | 'Mechanic' | 'Admin';
  shopName?: string;
  location?: string;
  whatsappNumber?: string;
  vehicleNumber?: string;
  upiId?: string;
  bankAccountNumber?: string;
  bankIfscCode?: string;
  createdAt?: FieldValue;
  lastUpdatedAt?: FieldValue;
}


/**
 * Creates or updates a user's profile document in the 'users' collection.
 * This function checks for the document's existence to correctly handle
 * creation (with 'createdAt') versus updates.
 *
 * @param firestore - The Firestore instance.
 * @param user - The Firebase Auth User object.
 * @param data - Optional additional data to merge into the profile. For new users, this MUST contain the `role`.
 */
export async function upsertUserProfile(
  firestore: Firestore, 
  user: User,
  data?: Partial<Omit<UserProfile, 'id' | 'email' | 'photoURL'>>
): Promise<void> {
  if (!user) return;

  const userDocRef = doc(firestore, 'users', user.uid);

  // Firestore doesn't allow 'undefined' values, so we filter them out.
  const updateData: { [key: string]: any } = { ...data };
   Object.keys(updateData).forEach(key => {
    if (updateData[key] === undefined || updateData[key] === null || updateData[key] === '') {
      delete updateData[key];
    }
  });


  const baseData: Partial<UserProfile> = {
    id: user.uid,
    displayName: user.displayName, // Fallback from auth object
    email: user.email,
    photoURL: user.photoURL,
  };

  // Combine base auth data with provided data.
  // The spread of `updateData` will correctly overwrite `displayName` from `baseData` if it was provided from the form.
  const profileData: Partial<UserProfile> = {
    ...baseData,
    ...updateData,
    lastUpdatedAt: serverTimestamp(),
  };

  try {
    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists()) {
      // New user, set createdAt and require role.
      if (!profileData.role) {
        throw new Error("Role is required for new user profile creation.");
      }
      profileData.createdAt = serverTimestamp();
      await setDoc(userDocRef, profileData);
    } else {
      // Existing user, merge data to avoid overwriting createdAt.
      await setDoc(userDocRef, profileData, { merge: true });
    }
  } catch (error) {
    console.error('Error upserting user profile:', error);

    const permissionError = new FirestorePermissionError({
      path: userDocRef.path,
      operation: 'write',
      requestResourceData: profileData,
    });
    
    errorEmitter.emit('permission-error', permissionError);
    
    throw error;
  }
}


/**
 * Deletes a user's profile document from the 'users' collection.
 * Note: This does NOT delete the user from Firebase Authentication, only their Firestore data.
 * Subcollections (like valuations, wallet) will become orphaned.
 *
 * @param firestore - The Firestore instance.
 * @param userId - The ID of the user to delete.
 */
export async function deleteUser(
  firestore: Firestore,
  userId: string
): Promise<void> {
  if (!userId) {
    throw new Error('User ID is required to delete a user.');
  }

  const userDocRef = doc(firestore, 'users', userId);

  try {
    await deleteDoc(userDocRef);
  } catch (error) {
    console.error(`Error deleting user ${userId}:`, error);

    const permissionError = new FirestorePermissionError({
      path: userDocRef.path,
      operation: 'delete',
    });

    errorEmitter.emit('permission-error', permissionError);
    throw permissionError;
  }
}
