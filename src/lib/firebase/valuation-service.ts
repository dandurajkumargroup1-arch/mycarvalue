
'use client';

import {
  collection,
  addDoc,
  serverTimestamp,
  type Firestore,
  type FieldValue,
  writeBatch,
  doc,
  deleteDoc,
} from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { CarValuationFormInput } from '@/lib/schemas';
import type { User } from 'firebase/auth';


/**
 * Interface for the data that will be saved to Firestore.
 * It combines the AI valuation data with user and payment details.
 */
export interface ValuationData extends CarValuationFormInput {
  userId: string;
  paymentId: string;
  valuationResult: any; // The full JSON response from the AI
  comparableListingsResult: any; // The full JSON response for listings
  imageQualityResult: any; // The full JSON response for image quality
  createdAt?: FieldValue;
}

/**
 * Saves a completed car valuation and updates the user's profile in a single batch.
 * This function is non-blocking and handles errors via the global error emitter.
 *
 * @param firestore - The Firestore instance.
 * @param user - The authenticated Firebase User object.
 * @param valuationData - The complete valuation data object from the form.
 */
export async function saveValuation(
  firestore: Firestore,
  user: User,
  valuationData: Omit<ValuationData, 'userId' | 'createdAt'>
): Promise<void> {
  if (!user || !user.uid) {
    throw new Error('User is required to save a valuation.');
  }
  
  const userId = user.uid;
  const valuationCollectionRef = collection(firestore, `users/${userId}/carValuations`);
  const userDocRef = doc(firestore, `users/${userId}`);

  // Firestore doesn't allow 'undefined', null, or empty string values. We clean the object.
  const cleanedData: { [key: string]: any } = { ...valuationData };
  Object.keys(cleanedData).forEach(key => {
    const value = cleanedData[key];
    if (value === undefined || value === null || value === '') {
      delete cleanedData[key];
    }
  });

  const valuationRecord = {
    ...cleanedData,
    userId: userId,
    createdAt: serverTimestamp(),
  };
  
  const userProfileUpdate: { [key: string]: any } = {
      displayName: valuationData.displayName || user.displayName,
      whatsappNumber: valuationData.whatsappNumber,
      vehicleNumber: valuationData.vehicleNumber,
      lastUpdatedAt: serverTimestamp(),
  };

  // Clean the user profile update object as well
  Object.keys(userProfileUpdate).forEach(key => {
    const value = userProfileUpdate[key];
    if (value === undefined || value === null || value === '') {
        delete userProfileUpdate[key];
    }
  });


  // Create a batch to perform multiple writes as a single atomic unit.
  const batch = writeBatch(firestore);

  // 1. Add the new valuation document to the carValuations subcollection
  const newValuationDocRef = doc(valuationCollectionRef); // Create a reference for a new document
  batch.set(newValuationDocRef, valuationRecord);
  
  // 2. Update the user's main profile document with contact details
  batch.set(userDocRef, userProfileUpdate, { merge: true });


  try {
    await batch.commit();
  } catch (error) {
    console.error('Error saving valuation and updating user profile:', error);
    
    const permissionError = new FirestorePermissionError({
      path: `users/${userId}`, // A representative path for the batch operation
      operation: 'write', // Use a generic 'write' for batch operations
      requestResourceData: { valuationRecord, userProfileUpdate },
    });
    
    errorEmitter.emit('permission-error', permissionError);
    // Re-throw the custom error so the UI can catch it.
    throw permissionError;
  }
}

/**
 * Deletes a specific car valuation document for a user.
 *
 * @param firestore - The Firestore instance.
 * @param user - The authenticated Firebase User object.
 * @param valuationId - The ID of the car valuation document to delete.
 */
export async function deleteValuation(
  firestore: Firestore,
  user: User,
  valuationId: string
): Promise<void> {
  if (!user || !user.uid) {
    throw new Error('User is required to delete a valuation.');
  }
  
  const docRef = doc(firestore, `users/${user.uid}/carValuations/${valuationId}`);
  
  try {
    await deleteDoc(docRef);
  } catch (error) {
    console.error(`Error deleting valuation ${valuationId}:`, error);
    
    const permissionError = new FirestorePermissionError({
      path: docRef.path,
      operation: 'delete',
    });
    
    errorEmitter.emit('permission-error', permissionError);
    throw permissionError;
  }
}
