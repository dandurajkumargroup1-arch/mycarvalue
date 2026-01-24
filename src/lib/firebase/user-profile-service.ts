
'use client';

import {
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
  type Firestore,
  type FieldValue,
  deleteDoc,
  collection,
  query,
  where,
  getDocs,
  writeBatch,
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
    displayName: data?.displayName || user.displayName, // Prioritize form data over auth object
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
 * Deletes a user's profile document AND all their associated data from Firestore.
 * This performs a recursive delete by first removing documents from subcollections.
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
    // A Firestore transaction or batch can contain up to 500 operations.
    // This is sufficient for most user deletion cases. For users with extreme amounts
    // of data, a more robust solution using batched deletions or a Cloud Function
    // would be necessary.
    const batch = writeBatch(firestore);

    // 1. Find and delete all carValuations for the user
    const valuationsRef = collection(userDocRef, 'carValuations');
    const valuationsSnapshot = await getDocs(valuationsRef);
    valuationsSnapshot.forEach(doc => batch.delete(doc.ref));

    // 2. Find and delete the wallet subcollection for the user
    const walletRef = collection(userDocRef, 'wallet');
    const walletSnapshot = await getDocs(walletRef);
    walletSnapshot.forEach(doc => batch.delete(doc.ref));
    
    // 3. Find and delete all withdrawalRequests by the user from the root collection
    const withdrawalsRootRef = collection(firestore, 'withdrawalRequests');
    const withdrawalsQuery = query(withdrawalsRootRef, where('userId', '==', userId));
    const withdrawalsSnapshot = await getDocs(withdrawalsQuery);
    withdrawalsSnapshot.forEach(doc => batch.delete(doc.ref));

    // 4. Finally, delete the main user document
    batch.delete(userDocRef);

    // Commit all deletes in a single atomic operation
    await batch.commit();

  } catch (error) {
    console.error(`Error deleting user ${userId} and their data:`, error);

    const permissionError = new FirestorePermissionError({
      path: userDocRef.path,
      operation: 'delete',
    });

    errorEmitter.emit('permission-error', permissionError);
    throw permissionError;
  }
}
