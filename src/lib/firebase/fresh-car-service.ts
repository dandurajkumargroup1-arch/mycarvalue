
'use client';

import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  serverTimestamp,
  type Firestore,
  addDoc,
  updateDoc
} from 'firebase/firestore';

export interface FreshCarData {
  id?: string;
  title: string;
  imageUrl: string;
  price: number;
  location: string;
  year: number;
  km: number;
  fuelType: string;
  transmission: string;
  aiInsight?: string;
}

/**
 * Creates or updates a Daily Fresh Car listing.
 */
export async function upsertFreshCar(
  firestore: Firestore,
  data: FreshCarData
): Promise<void> {
  const { id, ...carData } = data;
  const colRef = collection(firestore, 'dailyFreshCars');

  const payload = {
    ...carData,
    updatedAt: serverTimestamp(),
  };

  if (id) {
    const docRef = doc(firestore, 'dailyFreshCars', id);
    await updateDoc(docRef, payload);
  } else {
    await addDoc(colRef, {
      ...payload,
      createdAt: serverTimestamp(),
    });
  }
}

/**
 * Deletes a Fresh Car listing.
 */
export async function deleteFreshCar(
  firestore: Firestore,
  carId: string
): Promise<void> {
  const docRef = doc(firestore, 'dailyFreshCars', carId);
  await deleteDoc(docRef);
}
