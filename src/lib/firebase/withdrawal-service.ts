'use client';

import {
  collection,
  addDoc,
  doc,
  serverTimestamp,
  runTransaction,
  type Firestore,
  increment,
  updateDoc,
  type FieldValue,
} from 'firebase/firestore';
import type { User } from 'firebase/auth';

export interface WithdrawalRequestPayload {
  amount: number;
  upiId?: string;
  bankAccountNumber?: string;
  bankIfscCode?: string;
}

export interface WithdrawalRequestData extends WithdrawalRequestPayload {
  userId: string;
  status: 'requested' | 'paid' | 'rejected';
  requestedAt: FieldValue;
}

/**
 * Creates a new withdrawal request for a mechanic.
 * Ensures the userId in the data matches the document path.
 */
export async function requestWithdrawal(
  firestore: Firestore,
  user: User,
  payload: WithdrawalRequestPayload
): Promise<void> {
  if (!user || !user.uid) {
    throw new Error('User is required to request a withdrawal.');
  }

  const withdrawalCollectionRef = collection(firestore, 'users', user.uid, 'withdrawalRequests');

  const withdrawalData: WithdrawalRequestData = {
    userId: user.uid,
    status: 'requested',
    requestedAt: serverTimestamp(),
    ...payload
  };

  try {
    await addDoc(withdrawalCollectionRef, withdrawalData);
  } catch (error) {
    console.error('Error creating withdrawal request:', error);
    throw error;
  }
}

/**
 * Approves a withdrawal request and updates the user's wallet balance.
 * Uses a transaction to ensure atomic updates and prevent over-withdrawal.
 */
export async function approveWithdrawal(
  firestore: Firestore,
  userId: string,
  requestId: string,
  transactionId: string,
): Promise<void> {
  if (!userId || !requestId) {
    throw new Error("Missing User ID or Request ID for approval.");
  }

  try {
    await runTransaction(firestore, async (transaction) => {
      const requestRef = doc(firestore, 'users', userId, 'withdrawalRequests', requestId);
      const requestDoc = await transaction.get(requestRef);

      if (!requestDoc.exists()) {
        throw new Error(`Withdrawal request not found for path: users/${userId}/withdrawalRequests/${requestId}. Please verify if the User ID in the record matches the actual document path.`);
      }

      const requestData = requestDoc.data();
      if (requestData.status !== 'requested') {
        throw new Error(`Request is already in status: ${requestData.status}`);
      }

      const amount = requestData.amount;
      const walletRef = doc(firestore, 'users', userId, 'wallet', 'main');
      const walletDoc = await transaction.get(walletRef);

      if (!walletDoc.exists()) {
        throw new Error("User wallet not found. Cannot process withdrawal.");
      }

      const currentBalance = walletDoc.data().balance || 0;
      if (currentBalance < amount) {
        throw new Error(`Insufficient wallet balance (Current: ₹${currentBalance}) to approve ₹${amount}.`);
      }
      
      // Update the request document
      transaction.update(requestRef, {
        status: 'paid',
        processedAt: serverTimestamp(),
        transactionId: transactionId,
      });
      
      // Update the user's wallet
      transaction.update(walletRef, {
        balance: increment(-amount),
        lastWithdrawalDate: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    });
  } catch (error) {
    console.error("Error in approveWithdrawal transaction:", error);
    throw error;
  }
}

/**
 * Rejects a withdrawal request with a reason.
 */
export async function rejectWithdrawal(
  firestore: Firestore,
  userId: string,
  requestId: string,
  rejectionReason: string,
): Promise<void> {
   try {
    const requestRef = doc(firestore, 'users', userId, 'withdrawalRequests', requestId);
    await updateDoc(requestRef, {
        status: 'rejected',
        processedAt: serverTimestamp(),
        rejectionReason: rejectionReason,
    });
  } catch (error) {
    console.error("Error rejecting withdrawal:", error);
    throw error;
  }
}
