'use client';

import { useState, useEffect } from 'react';
import { onAuthStateChanged, User, Auth } from 'firebase/auth';
import { useAuth } from '@/firebase/provider';

export interface UserAuthHookResult {
  user: User | null;
  isUserLoading: boolean;
  userError: Error | null;
}

// This file is being kept for potential future use but the primary useUser hook is now in provider.tsx
// to avoid circular dependencies and export conflicts.

// The original hook is commented out to prevent build warnings/errors.
// /**
//  * Hook specifically for accessing the authenticated user's state.
//  * This provides the User object, loading status, and any auth errors.
//  * @returns {UserAuthHookResult} Object with user, isUserLoading, userError.
//  */
// export const useUser = (): UserAuthHookResult => {
//   const auth = useAuth();
//   const [user, setUser] = useState<User | null>(null);
//   const [isUserLoading, setIsUserLoading] = useState(true);
//   const [userError, setUserError] = useState<Error | null>(null);

//   useEffect(() => {
//     if (!auth) {
//       setIsUserLoading(false);
//       setUserError(new Error("Auth service not available."));
//       return;
//     }

//     const unsubscribe = onAuthStateChanged(
//       auth,
//       (firebaseUser) => {
//         setUser(firebaseUser);
        
//         setIsUserLoading(false);
//       },
//       (error) => {
//         console.error("useUser: onAuthStateChanged error:", error);
//         setUserError(error);
//         setIsUserLoading(false);
//       }
//     );

//     // Cleanup subscription on unmount
//     return () => unsubscribe();
//   }, [auth]);

//   return { user, isUserLoading, userError };
// };
