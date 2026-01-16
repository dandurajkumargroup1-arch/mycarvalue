import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Info } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="container mx-auto max-w-3xl py-12">
      <Card>
        <CardHeader className="text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-4">
                <Info className="h-8 w-8 text-primary" />
            </div>
            <CardTitle>About Us</CardTitle>
            <CardDescription>Learn more about mycarvalue.in</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-muted-foreground text-center">
            <p>
                mycarvalue.in was created to empower car sellers with the knowledge they need to get a fair price for their vehicle.
            </p>
            <p>
                Our AI-powered valuation tool provides an unbiased, data-driven estimate based on hundreds of data points, giving you the confidence to negotiate effectively.
            </p>
        </CardContent>
      </Card>
    </div>
  );
}
