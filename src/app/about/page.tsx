
import { Info, CheckCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export default function AboutPage() {
  const features = [
    {
      title: "True Market Value",
      description: "We don’t just show estimates; we analyze current market trends and actual sale prices to give you the most realistic car price."
    },
    {
      title: "Best Price Guarantee",
      description: "Our valuations aim to reflect what you can truly expect in the market, helping you sell or buy with confidence."
    },
    {
      title: "Inspection-Ready Values",
      description: "We factor in condition, mileage, location, and other key inputs — not just generic price ranges."
    },
    {
      title: "Easy to Use",
      description: "Just enter your car details and get a clear, unbiased valuation in seconds."
    }
  ];

  return (
    <div className="bg-secondary/50 py-16 md:py-24">
        <div className="container mx-auto max-w-4xl px-4 md:px-6">
            <div className="space-y-6 text-center">
                <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1 text-sm font-medium text-primary">
                <Info className="h-4 w-4" />
                About MyCarValue.in
                </div>
                <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl">
                  Accurate & Transparent Car Valuations
                </h1>
                <p className="text-muted-foreground md:text-lg max-w-3xl mx-auto">
                  At MyCarValue.in, we provide accurate and transparent car valuations you can trust. Unlike other platforms that show inconsistent or widely varied price ranges, our system delivers reliable and fair market prices based on real-world data and inspection-ready valuation.
                </p>
            </div>

            <div className="mt-16 grid gap-8 md:grid-cols-2">
              {features.map((feature, index) => (
                <Card key={index} className="shadow-sm hover:shadow-md transition-shadow">
                  <CardHeader className='flex-row items-center gap-4 space-y-0'>
                      <div className='p-2 bg-green-100 rounded-full'>
                        <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0" />
                      </div>
                      <CardTitle className='text-xl'>{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                      <p className="text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            <div className="mt-16 text-center max-w-3xl mx-auto">
                <p className="text-lg text-foreground">
                    Whether you’re selling, buying, or just checking your car’s worth, MyCarValue.in gives you the best valuation — no guesswork, no hidden surprises.
                </p>
            </div>
        </div>
    </div>
  );
}
