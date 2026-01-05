
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function PaymentSuccessPage() {
  const router = useRouter();

  useEffect(() => {
    // Mark payment as successful in localStorage
    localStorage.setItem("paymentSuccess", "true");

    // Redirect to the result page after a short delay
    const timer = setTimeout(() => {
      router.push('/result');
    }, 2000); // 2-second delay

    return () => clearTimeout(timer);
  }, [router]);

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
            Thank you for your payment. Your valuation report is being prepared.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Redirecting to your report shortly...
          </p>
          <div className="mt-4 flex justify-center">
            <div className="h-4 w-32 animate-pulse rounded-full bg-muted"></div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

    