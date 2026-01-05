
'use client';

import {
  collection,
  addDoc,
  serverTimestamp,
  type Firestore,
  type FieldValue,
  writeBatch,
  doc,
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
export function saveValuation(
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

  // Firestore doesn't allow 'undefined' values. We need to clean the object.
  const cleanedData = { ...valuationData };
  Object.keys(cleanedData).forEach(key => {
    const typedKey = key as keyof typeof cleanedData;
    if (cleanedData[typedKey] === undefined) {
      delete cleanedData[typedKey];
    }
  });

  const valuationRecord = {
    ...cleanedData,
    userId: userId,
    createdAt: serverTimestamp(),
  };
  
  const userProfileUpdate = {
      displayName: valuationData.displayName || user.displayName,
      whatsappNumber: valuationData.whatsappNumber,
      vehicleNumber: valuationData.vehicleNumber,
      lastUpdatedAt: serverTimestamp(),
  };

  // Create a batch to perform multiple writes as a single atomic unit.
  const batch = writeBatch(firestore);

  // 1. Add the new valuation document to the carValuations subcollection
  const newValuationDocRef = doc(valuationCollectionRef); // Create a reference for a new document
  batch.set(newValuationDocRef, valuationRecord);
  
  // 2. Update the user's main profile document with contact details
  batch.set(userDocRef, userProfileUpdate, { merge: true });


  return new Promise((resolve, reject) => {
    batch.commit()
      .then(() => resolve())
      .catch((error) => {
        console.error('Error saving valuation and updating user profile:', error);
        
        const permissionError = new FirestorePermissionError({
          path: `users/${userId}`, // A representative path for the batch operation
          operation: 'write', // Use a generic 'write' for batch operations
          requestResourceData: { valuationRecord, userProfileUpdate },
        });
        
        errorEmitter.emit('permission-error', permissionError);
        reject(permissionError);
      });
  });
}
