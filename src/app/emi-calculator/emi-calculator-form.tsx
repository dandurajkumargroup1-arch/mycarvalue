
"use client";

import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { IndianRupee } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

const formSchema = z.object({
  carPrice: z.coerce.number().min(10000, "Must be at least 10,000").max(5000000, "Must be at most 5,000,000"),
  downPayment: z.coerce.number().min(0),
  interest: z.coerce.number().min(0, "Must be at least 0%").max(20, "Must be at most 20%"),
  tenure: z.coerce.number().min(1, "Must be at least 1 year").max(7, "Must be at most 7 years"),
}).refine(data => data.downPayment <= data.carPrice, {
  message: "Down payment cannot exceed car price",
  path: ["downPayment"],
});

type FormData = z.infer<typeof formSchema>;

const COLORS = ["#0ea5e9", "#f59e0b"]; // sky-500, amber-500

export function EmiCalculatorForm() {
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      carPrice: 1000000,
      downPayment: 100000,
      interest: 9,
      tenure: 5,
    },
  });

  const { carPrice, downPayment, interest, tenure } = form.watch();

  const loanAmount = useMemo(() => carPrice - downPayment, [carPrice, downPayment]);

  const { emi, totalInterest, totalPayment, dailyPayment, yearlyPayment } = useMemo(() => {
    const principal = loanAmount;
    const rate = interest / 100 / 12;
    const months = tenure * 12;

    if (principal > 0 && rate > 0 && months > 0) {
      const emiValue = (principal * rate * Math.pow(1 + rate, months)) / (Math.pow(1 + rate, months) - 1);
      const totalPaymentValue = emiValue * months;
      const totalInterestValue = totalPaymentValue - principal;
      const dailyPaymentValue = totalPaymentValue / (tenure * 365);
      const yearlyPaymentValue = emiValue * 12;
      return {
        emi: emiValue,
        totalInterest: totalInterestValue,
        totalPayment: totalPaymentValue,
        dailyPayment: dailyPaymentValue,
        yearlyPayment: yearlyPaymentValue,
      };
    }
    // Handle case for 0 interest
    if (principal > 0 && interest === 0 && months > 0) {
      const emiValue = principal / months;
      const totalPaymentValue = principal;
      const totalInterestValue = 0;
      const dailyPaymentValue = totalPaymentValue / (tenure * 365);
      const yearlyPaymentValue = emiValue * 12;
      return {
        emi: emiValue,
        totalInterest: totalInterestValue,
        totalPayment: totalPaymentValue,
        dailyPayment: dailyPaymentValue,
        yearlyPayment: yearlyPaymentValue,
      };
    }
    return { emi: 0, totalInterest: 0, totalPayment: 0, dailyPayment: 0, yearlyPayment: 0 };
  }, [loanAmount, interest, tenure]);

  const chartData = useMemo(() => [
    { name: 'Loan Amount', value: loanAmount },
    { name: 'Total Interest', value: totalInterest },
  ], [loanAmount, totalInterest]);

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle>EMI Calculator with Down Payment</CardTitle>
        <CardDescription>Adjust the sliders to see your estimated monthly payment.</CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
        <div className="space-y-8">
          <Form {...form}>
            <form className="space-y-6">
              <FormField
                control={form.control}
                name="carPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Total Car Price (₹{field.value.toLocaleString('en-IN')})</FormLabel>
                    <FormControl>
                      <Slider
                        min={10000}
                        max={5000000}
                        step={10000}
                        value={[field.value]}
                        onValueChange={(value) => field.onChange(value[0])}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="downPayment"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Down Payment (₹{field.value.toLocaleString('en-IN')})</FormLabel>
                    <FormControl>
                      <Slider
                        min={0}
                        max={carPrice}
                        step={10000}
                        value={[field.value]}
                        onValueChange={(value) => field.onChange(value[0])}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="interest"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Interest Rate ({field.value.toFixed(2)}%)</FormLabel>
                    <FormControl>
                      <Slider
                        min={0}
                        max={20}
                        step={0.1}
                        value={[field.value]}
                        onValueChange={(value) => field.onChange(value[0])}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="tenure"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Loan Tenure ({field.value} {field.value > 1 ? 'Years' : 'Year'})</FormLabel>
                    <FormControl>
                      <Slider
                        min={1}
                        max={7}
                        step={1}
                        value={[field.value]}
                        onValueChange={(value) => field.onChange(value[0])}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </form>
          </Form>
        </div>
        <div className="flex flex-col items-center justify-between space-y-4 rounded-lg bg-muted p-6">
           <div className="text-center w-full">
                <p className="text-sm text-muted-foreground">Monthly EMI</p>
                <p className="text-4xl font-bold text-primary flex items-center justify-center">
                    <IndianRupee className="h-7 w-7" />
                    {emi.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                </p>
            </div>
            <div className="w-full h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    fill="#8884d8"
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                   <Tooltip
                    contentStyle={{
                      background: 'hsl(var(--background))',
                      borderRadius: 'var(--radius)',
                      borderColor: 'hsl(var(--border))',
                    }}
                    formatter={(value: number) => `₹${value.toLocaleString('en-IN')}`}
                  />
                  <Legend iconSize={10} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="w-full text-sm space-y-4">
                <div className='p-3 rounded-lg bg-background w-full space-y-2'>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Principal Loan</span>
                        <span className="font-bold">₹{loanAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                    </div>
                    <Separator/>
                     <div className="flex justify-between">
                        <span className="text-muted-foreground">Total Interest</span>
                        <span className="font-bold">₹{totalInterest.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                    </div>
                     <Separator/>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground font-semibold">Total Payment</span>
                        <span className="font-bold text-primary">₹{totalPayment.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                    </div>
                </div>

                 <div className='p-3 rounded-lg bg-background w-full space-y-2'>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Daily Payment</span>
                        <span className="font-bold">₹{dailyPayment.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                    </div>
                    <Separator/>
                     <div className="flex justify-between">
                        <span className="text-muted-foreground">Yearly Payment</span>
                        <span className="font-bold">₹{yearlyPayment.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                    </div>
                </div>
            </div>
        </div>
      </CardContent>
    </Card>
  );
}
