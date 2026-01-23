
'use client';

import { Suspense, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ValuationForm } from './valuation-form';
import { Sparkles } from 'lucide-react';
import { useUser } from '@/firebase';
import { Skeleton } from '@/components/ui/skeleton';


// This increases the serverless function timeout for this page to 120 seconds.
// It's necessary for the AI valuation to complete without timing out on Vercel.
export const maxDuration = 120;

function ValuationPageComponent() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    // If auth state is resolved and there's no user, redirect to login.
    // Pass the current path as a redirect parameter.
    if (!isUserLoading && !user) {
      router.push('/login?redirect=/valuation');
    }
  }, [user, isUserLoading, router]);


  const renderContent = () => {
    // While loading or before redirecting, show a skeleton.
    if (isUserLoading || !user) {
      return (
        <div className="mt-12">
          <Skeleton className="h-64 w-full" />
           <p className="text-center mt-4 text-muted-foreground">Loading user details...</p>
        </div>
      );
    }

    // If user is loaded, show the form.
    return (
      <div className="mt-12">
        <ValuationForm />
      </div>
    );
  };

  return (
    <>
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
