
'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { PieChart, Pie, Cell, Tooltip } from 'recharts';
import { ChartConfig, ChartContainer, ChartTooltipContent } from '@/components/ui/chart';
import { Skeleton } from '@/components/ui/skeleton';

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0,
    }).format(value);
};

// Represents the calculated EMI details
type EmiDetails = {
    principal: number;
    emi: number;
    totalInterest: number;
    totalPayment: number;
    dailyPayment: number;
    yearlyPayment: number;
};

export default function EmiCalculatorPage() {
    const [carPrice, setCarPrice] = useState(1000000);
    const [downPayment, setDownPayment] = useState(100000);
    const [rate, setRate] = useState(9.0);
    const [tenure, setTenure] = useState(5); // in years
    const [isClient, setIsClient] = useState(false);
    const [emiDetails, setEmiDetails] = useState<EmiDetails | null>(null);

    useEffect(() => {
        // This effect runs only on the client, after the initial render.
        // This makes it safe to perform calculations and update state.
        setIsClient(true);
    }, []);

    useEffect(() => {
        // We only run calculations on the client side.
        if (!isClient) return;

        const p = carPrice - downPayment;
        const r = rate / 12 / 100; // monthly rate
        const n = tenure * 12; // tenure in months

        let calculatedEmi = 0;
        let calculatedTotalPayment = 0;
        let calculatedTotalInterest = 0;

        if (p > 0 && n > 0) {
            if (rate === 0) {
                calculatedEmi = p / n;
                calculatedTotalPayment = p;
                calculatedTotalInterest = 0;
            } else {
                calculatedEmi = (p * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
                calculatedTotalPayment = calculatedEmi * n;
                calculatedTotalInterest = calculatedTotalPayment - p;
            }
        }
        
        setEmiDetails({
            principal: p,
            emi: calculatedEmi,
            totalPayment: calculatedTotalPayment,
            totalInterest: calculatedTotalInterest,
            dailyPayment: calculatedEmi / 30,
            yearlyPayment: calculatedEmi * 12,
        });

    }, [carPrice, downPayment, rate, tenure, isClient]);

    const chartConfig = {
        loanAmount: {
            label: 'Loan Amount',
        },
        totalInterest: {
            label: 'Total Interest',
        },
    } satisfies ChartConfig;

    const chartData = useMemo(() => {
        if (!isClient || !emiDetails || emiDetails.principal <= 0) return [];
        return [
            { name: 'loanAmount', value: emiDetails.principal, fill: 'hsl(var(--chart-1))' },
            { name: 'totalInterest', value: emiDetails.totalInterest, fill: 'hsl(var(--chart-2))' },
        ];
    }, [emiDetails, isClient]);
    
    const renderValue = (value: number | undefined) => {
        if (!isClient || value === undefined) {
            return <Skeleton className="h-5 w-24 inline-block"/>;
        }
        return formatCurrency(value);
    };
    
    const renderLargeValue = (value: number | undefined) => {
        if (!isClient || value === undefined) {
            return <Skeleton className="h-10 w-40 my-2" />;
        }
        return <p className="text-4xl font-bold text-primary my-2">{formatCurrency(value)}</p>;
    }

    return (
        <div className="container mx-auto max-w-4xl py-12">
            <Card>
                <CardHeader>
                    <CardTitle className="text-2xl font-bold tracking-tight">EMI Calculator with Down Payment</CardTitle>
                    <CardDescription>Adjust the sliders to see your estimated monthly payment.</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                    <div className="space-y-8 pt-2">
                        {/* Sliders are safe as their values are controlled by state */}
                        <div>
                            <Label htmlFor="carPrice" className="flex justify-between items-center mb-2">
                                <span>Total Car Price</span>
                                <span className="font-bold text-foreground">{formatCurrency(carPrice)}</span>
                            </Label>
                            <Slider
                                id="carPrice"
                                min={100000}
                                max={10000000}
                                step={50000}
                                value={[carPrice]}
                                onValueChange={(value) => {
                                    setCarPrice(value[0]);
                                    if(downPayment > value[0]){
                                        setDownPayment(value[0])
                                    }
                                }}
                            />
                        </div>
                        <div>
                            <Label htmlFor="downPayment" className="flex justify-between items-center mb-2">
                                <span>Down Payment</span>
                                <span className="font-bold text-foreground">{formatCurrency(downPayment)}</span>
                            </Label>
                           <Slider
                                id="downPayment"
                                min={0}
                                max={carPrice}
                                step={10000}
                                value={[downPayment]}
                                onValueChange={(value) => setDownPayment(value[0])}
                            />
                        </div>
                        <div>
                            <Label htmlFor="rate" className="flex justify-between items-center mb-2">
                                <span>Interest Rate (% p.a.)</span>
                                 <span className="font-bold text-foreground">{isClient ? rate.toFixed(2) : '...'} %</span>
                            </Label>
                           <Slider
                                id="rate"
                                min={0}
                                max={18}
                                step={0.05}
                                value={[rate]}
                                onValueChange={(value) => setRate(value[0])}
                            />
                        </div>
                        <div>
                            <Label htmlFor="tenure" className="flex justify-between items-center mb-2">
                                <span>Loan Tenure (Years)</span>
                                 <span className="font-bold text-foreground">{tenure} {tenure > 1 ? 'Years' : 'Year'}</span>
                            </Label>
                           <Slider
                                id="tenure"
                                min={1}
                                max={7}
                                step={1}
                                value={[tenure]}
                                onValueChange={(value) => setTenure(value[0])}
                            />
                        </div>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-6 flex flex-col items-center border">
                        <p className="text-sm text-muted-foreground">Monthly EMI</p>
                        {renderLargeValue(emiDetails?.emi)}

                        {!isClient ? (
                             <div className="mx-auto aspect-square h-48 flex items-center justify-center">
                                <Skeleton className="h-48 w-48 rounded-full" />
                            </div>
                        ) : chartData.length > 0 ? (
                            <ChartContainer config={chartConfig} className="mx-auto aspect-square h-48">
                                <PieChart>
                                    <Tooltip
                                        cursor={false}
                                        content={<ChartTooltipContent nameKey="name" indicator="dot" />}
                                    />
                                    <Pie
                                        data={chartData}
                                        dataKey="value"
                                        nameKey="name"
                                        innerRadius={50}
                                        strokeWidth={2}
                                    >
                                        {chartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.fill} />
                                        ))}
                                    </Pie>
                                </PieChart>
                            </ChartContainer>
                        ) : (
                           <div className="mx-auto aspect-square h-48 flex items-center justify-center text-sm text-muted-foreground">No loan data</div>
                        )}
                        
                        <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground my-6">
                            <div className="flex items-center gap-2">
                                <span className="h-2 w-2 rounded-full bg-[hsl(var(--chart-1))]"></span>
                                <span>Loan Amount</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="h-2 w-2 rounded-full bg-[hsl(var(--chart-2))]"></span>
                                <span>Total Interest</span>
                            </div>
                        </div>

                        <div className="w-full space-y-3 text-sm">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Principal Loan</span>
                                <span className="font-medium text-foreground">{renderValue(emiDetails?.principal)}</span>
                            </div>
                             <div className="flex justify-between">
                                <span className="text-muted-foreground">Total Interest</span>
                                <span className="font-medium text-foreground">{renderValue(emiDetails?.totalInterest)}</span>
                            </div>
                             <div className="flex justify-between font-semibold">
                                <span className="text-muted-foreground">Total Payment</span>
                                <span className="text-foreground">{renderValue(emiDetails?.totalPayment)}</span>
                            </div>
                            <Separator className="my-2"/>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Daily Payment</span>
                                <span className="font-medium text-foreground">{renderValue(emiDetails?.dailyPayment)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Yearly Payment</span>
                                <span className="font-medium text-foreground">{renderValue(emiDetails?.yearlyPayment)}</span>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
