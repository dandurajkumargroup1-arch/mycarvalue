'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { PieChart, Pie, Cell, Tooltip } from 'recharts';
import { ChartConfig, ChartContainer, ChartTooltipContent } from '@/components/ui/chart';

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0,
    }).format(value);
};

export default function EmiCalculatorPage() {
    const [carPrice, setCarPrice] = useState(1000000);
    const [downPayment, setDownPayment] = useState(100000);
    const [rate, setRate] = useState(9.0);
    const [tenure, setTenure] = useState(5); // in years

    const [principal, setPrincipal] = useState(0);
    const [emi, setEmi] = useState(0);
    const [totalInterest, setTotalInterest] = useState(0);
    const [totalPayment, setTotalPayment] = useState(0);
    const [dailyPayment, setDailyPayment] = useState(0);
    const [yearlyPayment, setYearlyPayment] = useState(0);

    useEffect(() => {
        const p = carPrice - downPayment;
        setPrincipal(p);

        const r = rate / 12 / 100; // monthly rate
        const n = tenure * 12; // tenure in months

        if (p > 0 && r > 0 && n > 0) {
            const emiValue = (p * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
            const totalPaymentValue = emiValue * n;
            const totalInterestValue = totalPaymentValue - p;

            setEmi(emiValue);
            setTotalPayment(totalPaymentValue);
            setTotalInterest(totalInterestValue);
            setDailyPayment(emiValue / 30);
            setYearlyPayment(emiValue * 12);
        } else {
            setEmi(0);
            setTotalPayment(p);
            setTotalInterest(0);
            setDailyPayment(0);
            setYearlyPayment(0);
        }
    }, [carPrice, downPayment, rate, tenure]);

    const chartData = useMemo(() => [
        { name: 'Loan Amount', value: principal, fill: "hsl(var(--chart-1))" },
        { name: 'Total Interest', value: totalInterest, fill: "hsl(var(--chart-2))"  },
    ], [principal, totalInterest]);

    const chartConfig: ChartConfig = {
        'Loan Amount': {
            label: 'Loan Amount',
            color: 'hsl(var(--chart-1))',
        },
        'Total Interest': {
            label: 'Total Interest',
            color: 'hsl(var(--chart-2))',
        },
    };

    return (
        <div className="container mx-auto max-w-4xl py-12">
            <Card>
                <CardHeader>
                    <CardTitle className="text-2xl font-bold tracking-tight">EMI Calculator with Down Payment</CardTitle>
                    <CardDescription>Adjust the sliders to see your estimated monthly payment.</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                    <div className="space-y-8 pt-2">
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
                                 <span className="font-bold text-foreground">{rate.toFixed(2)} %</span>
                            </Label>
                           <Slider
                                id="rate"
                                min={6}
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
                        <p className="text-4xl font-bold text-primary my-2">{formatCurrency(emi)}</p>

                        <ChartContainer config={chartConfig} className="mx-auto aspect-square h-48">
                            <PieChart>
                                <Tooltip
                                    cursor={false}
                                    content={<ChartTooltipContent hideLabel indicator="dot" />}
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
                        
                        <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground mb-6">
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
                                <span className="font-medium text-foreground">{formatCurrency(principal)}</span>
                            </div>
                             <div className="flex justify-between">
                                <span className="text-muted-foreground">Total Interest</span>
                                <span className="font-medium text-foreground">{formatCurrency(totalInterest)}</span>
                            </div>
                             <div className="flex justify-between font-semibold">
                                <span className="text-muted-foreground">Total Payment</span>
                                <span className="text-foreground">{formatCurrency(totalPayment)}</span>
                            </div>
                            <Separator className="my-2"/>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Daily Payment</span>
                                <span className="font-medium text-foreground">{formatCurrency(dailyPayment)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Yearly Payment</span>
                                <span className="font-medium text-foreground">{formatCurrency(yearlyPayment)}</span>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
