
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
  getDoc,
  increment,
  runTransaction,
  query,
  where,
  getDocs,
  limit,
} from 'firebase/firestore';
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
 * Saves a completed car valuation and updates the user's profile in a single atomic transaction.
 * If the user is a mechanic, it also robustly creates or updates their wallet.
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
  const userDocRef = doc(firestore, `users/${userId}`);

  // First, check if user is a mechanic to decide if we need to check for duplicates
  const userDocSnap = await getDoc(userDocRef);
  const isMechanic = userDocSnap.exists() && userDocSnap.data().role === 'Mechanic';

  // If the user is a mechanic and a vehicle number is provided, check for duplicates.
  if (isMechanic && valuationData.vehicleNumber) {
    const valuationCollectionRef = collection(firestore, `users/${userId}/carValuations`);
    const q = query(
      valuationCollectionRef,
      where('vehicleNumber', '==', valuationData.vehicleNumber),
      limit(1)
    );

    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      // A valuation for this vehicle number already exists for this mechanic.
      // Throw a specific error that can be caught by the UI.
      throw new Error(`A valuation for vehicle number '${valuationData.vehicleNumber}' already exists. You cannot submit a duplicate.`);
    }
  }

  const valuationCollectionRef = collection(firestore, `users/${userId}/carValuations`);
  const walletRef = doc(firestore, `users/${userId}/wallet/main`);

  // Clean data for Firestore
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
      id: userId,
      whatsappNumber: valuationData.whatsappNumber,
      vehicleNumber: valuationData.vehicleNumber,
      lastUpdatedAt: serverTimestamp(),
  };

  Object.keys(userProfileUpdate).forEach(key => {
    const value = userProfileUpdate[key];
    if (value === undefined || value === null || value === '') {
        delete userProfileUpdate[key];
    }
  });

  try {
    await runTransaction(firestore, async (transaction) => {
      // --- ALL READS MUST GO FIRST ---
      const walletDoc = isMechanic ? await transaction.get(walletRef) : null;

      // --- ALL WRITES GO AFTER READS ---
      // 1. Set the new valuation document
      const newValuationDocRef = doc(valuationCollectionRef);
      transaction.set(newValuationDocRef, valuationRecord);
    
      // 2. Update the user's main profile document (will create if it doesn't exist)
      transaction.set(userDocRef, userProfileUpdate, { merge: true });

      // 3. If user is a mechanic, handle wallet creation or update
      if (isMechanic) {
          const earningsPerReport = 15;

          if (walletDoc && walletDoc.exists()) {
              // Wallet exists, so we update it with increment
              transaction.update(walletRef, {
                  balance: increment(earningsPerReport),
                  totalEarned: increment(earningsPerReport),
                  updatedAt: serverTimestamp(),
              });
          } else {
              // Wallet does not exist, so we create it with the initial amount
              transaction.set(walletRef, {
                  userId: userId,
                  balance: earningsPerReport,
                  totalEarned: earningsPerReport,
                  lastWithdrawalDate: null,
                  updatedAt: serverTimestamp(),
              });
          }
      }
    });
  } catch (error) {
    // If the error is our custom duplicate error, re-throw it so the UI can catch it.
    if (error instanceof Error && error.message.includes('already exists')) {
        throw error;
    }
    
    console.error('Error in saveValuation transaction:', error);
    throw error;
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
    throw error;
  }
}
