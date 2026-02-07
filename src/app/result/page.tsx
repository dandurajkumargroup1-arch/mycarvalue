

'use client';

import { useState, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ValuationResultDisplay } from "@/components/report/ValuationResultDisplay";


const ResultPageClient = () => {
    const [result, setResult] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isClient, setIsClient] = useState(false);
    const router = useRouter();

    useEffect(() => {
        setIsClient(true);
        if (typeof window === 'undefined') return;

        let storedResult: string | null = null;
        try {
            storedResult = localStorage.getItem('valuationResult');
        } catch (e) {
            console.error("LocalStorage is not available.", e);
            router.push('/');
            return;
        }

        if (storedResult) {
            try {
                const paid = localStorage.getItem("paymentSuccess");
                if (paid) {
                    setResult(JSON.parse(storedResult));
                } else {
                    router.push('/valuation');
                }
            } catch (error) {
                console.error("Failed to parse valuation result from localStorage", error);
                router.push('/');
            }
        } else {
             router.push('/');
        }
        
        setLoading(false);

    }, [router]);
    
    const handleNewValuation = () => {
        try {
            localStorage.removeItem('valuationResult');
            localStorage.removeItem('paymentSuccess');
            localStorage.removeItem('razorpay_payment_id');
        } catch (e) {
            console.error("Could not clear localStorage.", e);
        }
        router.push('/valuation');
    };

    if (!isClient || loading) {
        return (
            <div className="container mx-auto max-w-4xl py-12">
                <Skeleton className="h-[1200px] w-full" />
            </div>
        )
    }

    if (!result) {
        return (
            <div className="container mx-auto max-w-3xl py-12">
                 <Card className="shadow-lg text-center">
                    <CardHeader>
                        <CardTitle>Valuation Data Missing</CardTitle>
                        <CardDescription>Could not display the report. The data may have been cleared or payment was not completed.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button onClick={handleNewValuation}>Start New Valuation</Button>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="bg-secondary">
            <div className="container mx-auto max-w-4xl py-8">
                <ValuationResultDisplay result={result} onNewValuation={handleNewValuation} />
            </div>
        </div>
    );
}

export default function ResultPage() {
    return (
        <ResultPageClient />
    );
}
