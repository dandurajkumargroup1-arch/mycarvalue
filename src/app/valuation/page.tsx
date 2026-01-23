
'use client';

import { Suspense, useState } from 'react';
import { ValuationForm } from './valuation-form';
import { Sparkles, LogIn } from 'lucide-react';
import { useUser, useAuth, useFirestore } from '@/firebase';
import { Button } from '@/components/ui/button';
import { GoogleAuthProvider, signInWithPopup, type User } from 'firebase/auth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { doc, getDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { RoleSelectionDialog } from '@/components/RoleSelectionDialog';
import { upsertUserProfile } from '@/lib/firebase/user-profile-service';


// This increases the serverless function timeout for this page to 120 seconds.
// It's necessary for the AI valuation to complete without timing out on Vercel.
export const maxDuration = 120;

function ValuationPageComponent() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [showRoleDialog, setShowRoleDialog] = useState(false);
  const [pendingUser, setPendingUser] = useState<User | null>(null);

  const handleGoogleSignIn = async () => {
    if (!auth || !firestore) return;
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const signedInUser = result.user;

      const userDocRef = doc(firestore, 'users', signedInUser.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        await upsertUserProfile(firestore, signedInUser, {});
        toast({
          title: "Signed In",
          description: `Welcome back, ${signedInUser.displayName}!`,
        });
      } else {
        setPendingUser(signedInUser);
        setShowRoleDialog(true);
      }
    } catch (error: any) {
      if (error.code !== 'auth/popup-closed-by-user' && error.code !== 'auth/cancelled-popup-request') {
        console.error("Google sign-in error", error);
      }
    }
  };

  const handleRoleSelected = async (role: 'Owner' | 'Agent' | 'Mechanic') => {
    if (pendingUser && firestore) {
        await upsertUserProfile(firestore, pendingUser, { role });
        toast({
            title: "Welcome!",
            description: `Your profile as a ${role} has been created.`,
        });
        setShowRoleDialog(false);
        setPendingUser(null);
    }
  };

  const renderContent = () => {
    if (isUserLoading) {
      return (
        <div className="mt-12">
          <Skeleton className="h-64 w-full" />
        </div>
      );
    }

    if (!user) {
      return (
        <Card className="mt-12 text-center shadow-lg">
          <CardHeader>
            <CardTitle>Sign In to Get Your Car Valuation</CardTitle>
            <CardDescription>
              Please sign in to continue.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleGoogleSignIn} size="lg">
              <LogIn className="mr-2 h-4 w-4" />
              Sign in with Google
            </Button>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="mt-12">
        <ValuationForm />
      </div>
    );
  };

  return (
    <>
      <RoleSelectionDialog 
        open={showRoleDialog} 
        onOpenChange={setShowRoleDialog}
        onRoleSelect={handleRoleSelected} 
      />
      <div className="bg-background">
        <div className="container mx-auto max-w-3xl py-12 px-4 md:px-6">
          <div className="space-y-4 text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1 text-sm font-medium text-primary">
              <Sparkles className="h-4 w-4" />
              AI Car Valuation
            </div>
            <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl">
              Find Your Car's True Market Value
            </h1>
            <p className="text-muted-foreground md:text-xl">
              Fill out the form below to get an instant, AI-powered valuation for your car in the Indian market.
            </p>
          </div>
          {renderContent()}
        </div>
      </div>
    </>
  );
}


export default function ValuationPage() {
  return (
    <Suspense fallback={
        <div className="container mx-auto max-w-3xl py-12 px-4 md:px-6">
            <Skeleton className="h-screen w-full" />
        </div>
    }>
      <ValuationPageComponent />
    </Suspense>
  )
}
