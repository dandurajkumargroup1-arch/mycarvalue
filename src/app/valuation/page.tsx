
'use client';

import { useState } from 'react';
import { ValuationForm } from './valuation-form';
import { Sparkles, LogIn, Eye, Lock } from 'lucide-react';
import { useUser, useAuth } from '@/firebase';
import { Button } from '@/components/ui/button';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Suspense } from 'react';

function ValuationPageComponent() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();

  const handleGoogleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      if (auth) {
        await signInWithPopup(auth, provider);
      }
    } catch (error: any) {
      if (error.code !== 'auth/popup-closed-by-user' && error.code !== 'auth/cancelled-popup-request') {
        console.error("Google sign-in error", error);
      }
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
  );
}


export default function ValuationPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ValuationPageComponent />
    </Suspense>
  )
}
