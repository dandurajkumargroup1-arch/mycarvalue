
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useUser, useFirestore } from '@/firebase';
import { saveValuation } from '@/lib/firebase/valuation-service';
import { Skeleton } from '@/components/ui/skeleton';

export default function PaymentSuccessPage() {
  const router = useRouter();
  const { user } = useUser();
  const firestore = useFirestore();
  const [status, setStatus] = useState('processing'); // processing, success, error

  useEffect(() => {
    const processPayment = async () => {
      const paymentId = localStorage.getItem("razorpay_payment_id");
      const storedResult = localStorage.getItem('valuationResult');

      if (!paymentId || !storedResult || !user || !firestore) {
        // If essential data is missing, redirect home.
        console.error("Missing payment data, user, or firestore. Redirecting.");
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

        // Mark local state as successful
        localStorage.setItem("paymentSuccess", "true");

        // Clean up temporary storage
        localStorage.removeItem('razorpay_payment_id');

        setStatus('success');

        // Redirect to the result page after a short delay
        const timer = setTimeout(() => {
          router.push('/result');
        }, 2000);

        return () => clearTimeout(timer);

      } catch (error) {
        console.error("Failed to save valuation post-payment:", error);
        setStatus('error');
        // Optionally, you could redirect to an error page or show a toast
      }
    };

    processPayment();
  }, [user, firestore, router]);
  
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
              <CardTitle className="mt-4 text-2xl text-destructive">Payment Error</CardTitle>
              <CardDescription>
                There was an issue saving your report after payment. Please contact support.
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

    