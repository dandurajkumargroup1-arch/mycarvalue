
import { FirebaseOptions } from "firebase/app";

export const getFirebaseConfig = (): FirebaseOptions => {
  const firebaseConfig: FirebaseOptions = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID",
    measurementId: "G-VELXQSRWCW"
  };

  // Temporarily bypass the check to use hardcoded values.
  // This is to get the app running. Best practice is to use environment variables.
  const requiredKeys: (keyof FirebaseOptions)[] = ['apiKey', 'authDomain', 'projectId', 'appId'];
  const missingKeys = requiredKeys.filter(key => {
    const value = firebaseConfig[key];
    // A simple check for placeholder values.
    return !value || value.startsWith('YOUR_');
  });

  if (missingKeys.length > 0) {
    const message = `Firebase configuration is incomplete. Please replace placeholder values in src/firebase/config.ts. Missing: ${missingKeys.join(', ')}`;
    console.warn(message);
    // This error is thrown to prevent the app from running with an incomplete config.
    throw new Error(message);
  }
  
  return firebaseConfig;
};
