'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Calculator } from "lucide-react";
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0,
    }).format(value);
};

export default function EmiCalculatorPage() {
    const [principal, setPrincipal] = useState(500000);
    const [rate, setRate] = useState(9.5);
    const [tenure, setTenure] = useState(5); // in years

    const [emi, setEmi] = useState(0);
    const [totalInterest, setTotalInterest] = useState(0);
    const [totalPayment, setTotalPayment] = useState(0);

    useEffect(() => {
        const calculateEmi = () => {
            const p = principal;
            const r = rate / 12 / 100; // monthly rate
            const n = tenure * 12; // tenure in months

            if (p > 0 && r > 0 && n > 0) {
                const emiValue = (p * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
                const totalPaymentValue = emiValue * n;
                const totalInterestValue = totalPaymentValue - p;

                setEmi(emiValue);
                setTotalPayment(totalPaymentValue);
                setTotalInterest(totalInterestValue);
            } else {
                setEmi(0);
                setTotalPayment(0);
                setTotalInterest(0);
            }
        };
        calculateEmi();
    }, [principal, rate, tenure]);

    return (
        <div className="container mx-auto max-w-3xl py-12">
            <Card>
                <CardHeader className="text-center">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-4">
                        <Calculator className="h-8 w-8 text-primary" />
                    </div>
                    <CardTitle>EMI Calculator</CardTitle>
                    <CardDescription>Estimate your monthly car loan payments.</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                        <div>
                            <Label htmlFor="principal" className="flex justify-between items-center">
                                <span>Loan Amount</span>
                                <span className="font-bold text-primary">{formatCurrency(principal)}</span>
                            </Label>
                            <Slider
                                id="principal"
                                min={100000}
                                max={5000000}
                                step={50000}
                                value={[principal]}
                                onValueChange={(value) => setPrincipal(value[0])}
                                className="mt-2"
                            />
                        </div>
                        <div>
                            <Label htmlFor="rate" className="flex justify-between items-center">
                                <span>Interest Rate (% p.a.)</span>
                                 <span className="font-bold text-primary">{rate.toFixed(1)} %</span>
                            </Label>
                           <Slider
                                id="rate"
                                min={6}
                                max={18}
                                step={0.1}
                                value={[rate]}
                                onValueChange={(value) => setRate(value[0])}
                                className="mt-2"
                            />
                        </div>
                        <div>
                            <Label htmlFor="tenure" className="flex justify-between items-center">
                                <span>Loan Tenure (Years)</span>
                                 <span className="font-bold text-primary">{tenure} {tenure > 1 ? 'Years' : 'Year'}</span>
                            </Label>
                           <Slider
                                id="tenure"
                                min={1}
                                max={7}
                                step={1}
                                value={[tenure]}
                                onValueChange={(value) => setTenure(value[0])}
                                className="mt-2"
                            />
                        </div>
                    </div>
                    <div className="bg-primary/5 rounded-lg p-6 flex flex-col justify-center items-center text-center border">
                        <h3 className="text-muted-foreground">Monthly EMI</h3>
                        <p className="text-4xl font-bold text-primary my-2">{formatCurrency(emi)}</p>
                        <Separator className="my-4"/>
                        <div className="w-full space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Total Interest</span>
                                <span className="font-medium">{formatCurrency(totalInterest)}</span>
                            </div>
                             <div className="flex justify-between">
                                <span className="text-muted-foreground">Total Payment</span>
                                <span className="font-medium">{formatCurrency(totalPayment)}</span>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}