
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CheckCircle2, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useUser, useFirestore } from '@/firebase';
import { saveValuation } from '@/lib/firebase/valuation-service';
import { Skeleton } from '@/components/ui/skeleton';

export default function PaymentSuccessPage() {
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const [status, setStatus] = useState('processing'); // processing, success, error
  const [errorPaymentId, setErrorPaymentId] = useState<string | null>(null);

  useEffect(() => {
    const processPayment = async () => {
      if (isUserLoading || !user || !firestore) {
        return;
      }
      
      const paymentId = localStorage.getItem("razorpay_payment_id");
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
  }, [user, isUserLoading, firestore, router]);
  
  if (status === 'processing') {
    return (
       <div className="container mx-auto flex min-h-[60vh] items-center justify-center py-12">
          <Card className="w-full max-w-md text-center shadow-lg">
            <CardHeader>
              <CardTitle className="mt-4 text-2xl">Processing Payment...</CardTitle>
              <CardDescription>
                Please wait while we confirm your payment and save your report.
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
                There was an issue saving your report. Please contact support and provide them with your Payment ID: <br />
                <strong className="text-foreground mt-2 inline-block">{errorPaymentId}</strong>
              </CardDescription>
            </CardHeader>
          </Card>
       </div>
    );
  }

  return (
    <div className="container mx-auto flex min-h-[60vh] items-center justify-center py-12">
      <Card className="w-full max-w-md text-center shadow-lg">
        <CardHeader>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100"
          >
            <CheckCircle2 className="h-10 w-10 text-green-600" />
          </motion.div>
          <CardTitle className="mt-4 text-2xl">Payment Successful!</CardTitle>
          <CardDescription>
            Thank you! Your valuation report has been saved.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Redirecting to your report...
          </p>
          <div className="mt-4 flex justify-center">
            <div className="h-4 w-32 animate-pulse rounded-full bg-muted"></div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
