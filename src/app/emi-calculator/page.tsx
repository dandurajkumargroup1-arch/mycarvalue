
import { Calculator, Banknote, Percent, CalendarClock } from 'lucide-react';
import { EmiCalculatorForm } from './emi-calculator-form';

export default function EmiCalculatorPage() {
  return (
    <div className="bg-secondary/50">
      <div className="container mx-auto max-w-4xl py-12 px-4 md:px-6">
        <div className="space-y-4 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1 text-sm font-medium text-primary">
            <Calculator className="h-4 w-4" />
            Car Loan EMI Calculator
          </div>
          <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl">
            Plan Your Car Purchase
          </h1>
          <p className="text-muted-foreground md:text-xl max-w-2xl mx-auto">
            Estimate your monthly car loan payments with our easy-to-use EMI calculator, now with a down payment option.
          </p>
        </div>
        <div className="mt-12">
          <EmiCalculatorForm />
        </div>
      </div>

      <div className="py-16 bg-background">
        <div className="container mx-auto max-w-5xl px-4 md:px-6">
            <div className="space-y-4 text-center mb-12">
                <h2 className="text-3xl font-bold tracking-tighter">How It Works</h2>
                <p className="text-muted-foreground md:text-lg max-w-2xl mx-auto">
                    Understand the key factors that determine your monthly loan payment.
                </p>
            </div>
            <div className="grid gap-8 md:grid-cols-4">
                <div className="flex flex-col items-center text-center p-6 bg-card border rounded-lg">
                    <Banknote className="h-10 w-10 text-primary mb-4" />
                    <h3 className="text-xl font-semibold mb-2">Car Price</h3>
                    <p className="text-muted-foreground">The total price of the car you wish to purchase.</p>
                </div>
                <div className="flex flex-col items-center text-center p-6 bg-card border rounded-lg">
                    <Banknote className="h-10 w-10 text-primary mb-4" />
                    <h3 className="text-xl font-semibold mb-2">Down Payment</h3>
                    <p className="text-muted-foreground">The initial amount you pay upfront. A higher down payment reduces your loan amount and EMI.</p>
                </div>
                <div className="flex flex-col items-center text-center p-6 bg-card border rounded-lg">
                    <Percent className="h-10 w-10 text-primary mb-4" />
                    <h3 className="text-xl font-semibold mb-2">Interest Rate</h3>
                    <p className="text-muted-foreground">The percentage charged by the lender on the loan amount.</p>
                </div>
                <div className="flex flex-col items-center text-center p-6 bg-card border rounded-lg">
                    <CalendarClock className="h-10 w-10 text-primary mb-4" />
                    <h3 className="text-xl font-semibold mb-2">Loan Tenure</h3>
                    <p className="text-muted-foreground">The duration over which you agree to repay the loan, typically in years.</p>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}
