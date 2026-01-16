import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Calculator } from "lucide-react";

export default function EmiCalculatorPage() {
  return (
    <div className="container mx-auto max-w-3xl py-12">
      <Card>
        <CardHeader className="text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-4">
                <Calculator className="h-8 w-8 text-primary" />
            </div>
            <CardTitle>EMI Calculator</CardTitle>
            <CardDescription>This feature is coming soon. Check back later!</CardDescription>
        </CardHeader>
        <CardContent>
            <p className="text-center text-muted-foreground">
                We are working hard to bring you an easy-to-use EMI calculator to help you plan your car purchase.
            </p>
        </CardContent>
      </Card>
    </div>
  );
}
