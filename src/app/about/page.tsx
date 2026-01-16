
import { Card, CardContent } from "@/components/ui/card";
import { Info, CheckCircle } from "lucide-react";

export default function AboutPage() {
  const features = [
    {
      title: "True Market Value",
      description: "We don't just show estimates; we analyze current market trends and actual sale prices to give you the most realistic car price.",
    },
    {
      title: "Best Price Guarantee",
      description: "Our valuations aim to reflect what you can truly expect in the market, helping you sell or buy with confidence.",
    },
    {
      title: "Inspection-Ready Values",
      description: "We factor in condition, mileage, location, and other key inputs — not just generic price ranges.",
    },
    {
      title: "Easy to Use",
      description: "Just enter your car details and get a clear, unbiased valuation in seconds.",
    },
  ];

  return (
    <div className="bg-background">
        <div className="container mx-auto max-w-4xl py-16 px-4 md:py-24 md:px-6">
            <div className="space-y-4 text-center">
                <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1 text-sm font-medium text-primary">
                    <Info className="h-4 w-4" />
                    About MyCarValue.in
                </div>
                <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl">
                    Accurate & Transparent Car Valuations
                </h1>
                <p className="text-muted-foreground md:text-xl max-w-3xl mx-auto">
                    At MyCarValue.in, we provide accurate and transparent car valuations you can trust. Unlike other platforms that show inconsistent or widely varied price ranges, our system delivers reliable and fair market prices based on real-world data and inspection-ready valuation.
                </p>
            </div>

            <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-2">
                {features.map((feature, index) => (
                    <Card key={index} className="p-6 text-left shadow-sm hover:shadow-md transition-shadow bg-secondary/30">
                        <div className="flex items-start gap-4">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-green-600">
                                <CheckCircle className="h-6 w-6" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold">{feature.title}</h3>
                                <p className="mt-1 text-muted-foreground">{feature.description}</p>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            <div className="mt-16 text-center">
                <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                    Whether you're selling, buying, or just checking your car's worth, MyCarValue.in gives you the best valuation — no guesswork, no hidden surprises.
                </p>
            </div>
        </div>
    </div>
  );
}
