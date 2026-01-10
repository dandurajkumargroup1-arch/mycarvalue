
import { FirebaseOptions } from "firebase/app";

export const getFirebaseConfig = (): FirebaseOptions => {
  const firebaseConfig: FirebaseOptions = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
  };

  // Check for missing environment variables
  const requiredKeys: (keyof FirebaseOptions)[] = ['apiKey', 'authDomain', 'projectId', 'appId'];
  const missingKeys = requiredKeys.filter(key => !firebaseConfig[key]);

  if (missingKeys.length > 0) {
    const message = `Missing Firebase config variables: ${missingKeys.join(', ')}. Please check your .env file and Vercel environment variables.`;
    console.error(message);
    // This error will be thrown to make sure the app doesn't run with incomplete configuration.
    if (typeof window !== 'undefined') {
      alert(message); // Alert on client-side
    }
    throw new Error(message);
  }
  
  return firebaseConfig;
};
