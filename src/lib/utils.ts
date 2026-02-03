import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { Timestamp } from "firebase/firestore";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Safely converts a Firestore Timestamp (live or serialized) to a JS Date object.
 * Returns null if the input is not a valid Timestamp representation.
 * @param timestamp - The Firestore Timestamp or a serialized object with seconds.
 */
export const toDate = (timestamp: any): Date | null => {
    if (timestamp instanceof Timestamp) {
        return timestamp.toDate();
    }
    // This handles the case where the Timestamp was serialized during SSR
    if (timestamp && typeof timestamp.seconds === 'number') {
        return new Date(timestamp.seconds * 1000);
    }
    return null;
};

/**
 * Formats a number as Indian Rupees (INR) without fractional digits.
 * Returns '...' if the value is undefined.
 * @param value - The number to format.
 */
export const formatCurrency = (value: number | undefined) => {
    if (value === undefined) return '...';
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0,
    }).format(value);
};

/**
 * Formats a Firestore Timestamp into a readable date and time string (e.g., 27/07/2024, 14:30:15).
 * @param timestamp - The timestamp to format.
 */
export const formatDateTime = (timestamp: any): string => {
    const date = toDate(timestamp);
    return date ? date.toLocaleString('en-GB') : 'N/A';
};

/**
 * Formats a Firestore Timestamp into a readable date-only string (e.g., 27 Jul 2024).
 * @param timestamp - The timestamp to format.
 */
export const formatDateOnly = (timestamp: any): string => {
    const date = toDate(timestamp);
    if (!date) return 'N/A';
    return date.toLocaleDateString('en-GB', {
        day: '2-digit', month: 'short', year: 'numeric'
    });
}
