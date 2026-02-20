
'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CheckCircle2, AlertTriangle, Coins, Car } from 'lucide-react';
import { useUser, useFirestore } from '@/firebase';
import { saveValuation } from '@/lib/firebase/valuation-service';
import { Skeleton } from '@/components/ui/skeleton';

function PaymentSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const [status, setStatus] = useState('processing'); // processing, success, error
  const [errorPaymentId, setErrorPaymentId] = useState<string | null>(null);

  const isCredits = searchParams.get('type') === 'credits';

  useEffect(() => {
    const processPayment = async () => {
      if (isUserLoading || !user || !firestore) {
        return;
      }
      
      const paymentId = localStorage.getItem("razorpay_payment_id");

      // Handle Credit Purchase Flow
      if (isCredits) {
        setStatus('success');
        const timer = setTimeout(() => {
          router.push('/daily-fresh-cars');
        }, 3000);
        return () => clearTimeout(timer);
      }

      // Handle Valuation Flow
      const storedResult = localStorage.getItem('valuationResult');

      if (!paymentId || !storedResult) {
        console.error("Missing payment data. Redirecting.");
        router.push('/');
        return;
      }
      
      try {
        const fullResult = JSON.parse(storedResult);

        await saveValuation(firestore, user, {
          paymentId: paymentId,
          ...fullResult.formData,
          valuationResult: fullResult.valuation,
          comparableListingsResult: null,
          imageQualityResult: null,
        });

        localStorage.setItem("paymentSuccess", "true");
        localStorage.removeItem('razorpay_payment_id');
        setStatus('success');

        const timer = setTimeout(() => {
          router.push('/result');
        }, 2000);

        return () => clearTimeout(timer);

      } catch (error) {
        console.error("Failed to save valuation post-payment:", error);
        // If saving fails, store the payment ID to show it to the user.
        setErrorPaymentId(paymentId);
        setStatus('error');
      }
    };

    processPayment();
  }, [user, isUserLoading, firestore, router, isCredits]);
  
  if (status === 'processing') {
    return (
       <div className="container mx-auto flex min-h-[60vh] items-center justify-center py-12">
          <Card className="w-full max-w-md text-center shadow-lg">
            <CardHeader>
              <CardTitle className="mt-4 text-2xl">Processing Payment...</CardTitle>
              <CardDescription>
                Please wait while we confirm your payment and update your account.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Skeleton className="w-full h-10" />
              <p className="text-xs text-muted-foreground mt-4">This may take a moment. Do not refresh the page.</p>
            </CardContent>
          </Card>
       </div>
    );
  }

  if (status === 'error') {
     return (
       <div className="container mx-auto flex min-h-[60vh] items-center justify-center py-12">
          <Card className="w-full max-w-md text-center shadow-lg border-destructive">
             <CardHeader>
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
                <AlertTriangle className="h-6 w-6 text-destructive" />
              </div>
              <CardTitle className="mt-4 text-2xl text-destructive">Payment Error</CardTitle>
              <CardDescription>
                There was an issue processing your request. Please contact support and provide them with your Payment ID: <br />
                <strong className="text-foreground mt-2 inline-block">{errorPaymentId}</strong>
              </CardDescription>
            </CardHeader>
          </Card>
       </div>
    );
  }

  return (
    <div className="container mx-auto flex min-h-[60vh] items-center justify-center py-12 px-4">
      <Card className="w-full max-w-md text-center shadow-lg">
        <CardHeader>
          <div
            className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10"
          >
            {isCredits ? <Coins className="h-10 w-10 text-primary" /> : <CheckCircle2 className="h-10 w-10 text-primary" />}
          </div>
          <CardTitle className="mt-4 text-2xl">
            {isCredits ? 'Credits Added Successfully!' : 'Payment Successful!'}
          </CardTitle>
          <CardDescription>
            {isCredits 
              ? 'Your credits have been added to your wallet.' 
              : 'Thank you! Your valuation report has been saved.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-muted-foreground text-sm">
            {isCredits 
              ? 'Redirecting you to Hot Market Listings to start unlocking deals...' 
              : 'Redirecting to your detailed report...'}
          </p>
          <div className="flex flex-col gap-2">
            <Button asChild className="w-full">
                {isCredits ? (
                    <Link href="/daily-fresh-cars"><Car className="mr-2 h-4 w-4" /> Go to Hot Listings</Link>
                ) : (
                    <Link href="/result">View My Report</Link>
                )}
            </Button>
          </div>
          <div className="mt-4 flex justify-center">
            <div className="h-1 w-32 overflow-hidden rounded-full bg-muted">
                <div className="h-full bg-primary animate-progress-fast"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function PaymentSuccessPage() {
    return (
        <Suspense fallback={
            <div className="container mx-auto flex min-h-[60vh] items-center justify-center py-12">
                <Skeleton className="h-64 w-full max-w-md" />
            </div>
        }>
            <PaymentSuccessContent />
        </Suspense>
    );
}
