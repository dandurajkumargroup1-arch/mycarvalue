
'use client';

import {
  doc,
  setDoc,
  serverTimestamp,
  type Firestore,
  type FieldValue,
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
  whatsappNumber?: string;
  vehicleNumber?: string;
  createdAt?: FieldValue;
  lastUpdatedAt?: FieldValue;
}


/**
 * Creates or updates a user's profile document in the 'users' collection.
 * Uses setDoc with { merge: true } to avoid overwriting existing data.
 * This function is non-blocking.
 *
 * @param firestore - The Firestore instance.
 * @param user - The Firebase Auth User object.
 * @param data - Optional additional data to merge into the profile.
 */
export async function upsertUserProfile(
  firestore: Firestore, 
  user: User,
  data?: Partial<UserProfile>
): Promise<void> {
  if (!user) return;

  const userDocRef = doc(firestore, 'users', user.uid);

  const profileData: Partial<UserProfile> = {
    id: user.uid,
    displayName: user.displayName,
    email: user.email,
    photoURL: user.photoURL,
    ...data, // Merge additional data if provided
    lastUpdatedAt: serverTimestamp(),
  };

  // On initial creation, we also set the createdAt timestamp.
  // We can check if the data being passed includes a creation-specific field
  // or handle it gracefully with setDoc merge. For simplicity, we can just merge.
  // A more complex logic could check for document existence first.
  const finalData = {
    ...profileData,
    createdAt: serverTimestamp(), // Will only be set on creation with a more complex rule or logic
  };

  try {
    // Using setDoc with merge: true will create the document if it doesn't exist,
    // or update it if it does, without overwriting the whole document.
    // 'createdAt' will be overwritten on every update with this simple approach.
    // A better approach for production would be to use a transaction or
    // separate create and update functions. For this case, we keep it simple.
    await setDoc(userDocRef, {
      ...profileData, // Use the profile data that has lastUpdatedAt
    }, { merge: true });

    // To prevent createdAt from being overwritten on every upsert, we can do a quick check
    // and only add it if it's a new document, but that requires a `getDoc` call first.
    // For now, we will rely on a rule in firestore.rules to protect it, or accept this behavior.
    
  } catch (error) {
    console.error('Error upserting user profile:', error);

    const permissionError = new FirestorePermissionError({
      path: userDocRef.path,
      operation: 'write',
      requestResourceData: profileData,
    });
    
    errorEmitter.emit('permission-error', permissionError);
    
    // Re-throw the original error if you want the caller to be aware of it
    throw error;
  }
}

    