import { Info, Target, Sparkles, ShieldCheck } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="bg-secondary py-12 md:py-20">
        <div className="container mx-auto max-w-5xl px-4 md:px-6">
            <div className="space-y-6 text-center">
                <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1 text-sm font-medium text-primary">
                <Info className="h-4 w-4" />
                About AutoValue.in
                </div>
                <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl">
                Empowering Car Owners with Fair Valuations
                </h1>
                <p className="text-muted-foreground md:text-xl max-w-3xl mx-auto">
                Our mission is to bring transparency and accuracy to the used car market. We believe every car owner deserves to know their vehicle's true worth, free from bias and negotiation pressure.
                </p>
            </div>

            <div className="mt-16 grid gap-8 md:grid-cols-3">
                <div className="flex flex-col items-center text-center p-6 bg-background rounded-lg shadow-sm">
                    <Target className="h-10 w-10 text-primary mb-4" />
                    <h3 className="text-xl font-semibold mb-2">Unbiased & Accurate</h3>
                    <p className="text-muted-foreground">Our AI model analyzes millions of data points from the Indian market to provide valuations you can trust. We don't buy cars, so our only goal is to give you an accurate price.</p>
                </div>
                <div className="flex flex-col items-center text-center p-6 bg-background rounded-lg shadow-sm">
                    <Sparkles className="h-10 w-10 text-primary mb-4" />
                    <h3 className="text-xl font-semibold mb-2">AI-Powered Intelligence</h3>
                    <p className="text-muted-foreground">We leverage cutting-edge generative AI to create a sophisticated pricing model that understands over 50 different factors affecting a car's value, from its variant to its service history.</p>
                </div>
                <div className="flex flex-col items-center text-center p-6 bg-background rounded-lg shadow-sm">
                    <ShieldCheck className="h-10 w-10 text-primary mb-4" />
                    <h3 className="text-xl font-semibold mb-2">Private & Secure</h3>
                    <p className="text-muted-foreground">Your privacy is important. Valuations are 100% anonymous, and your data is never stored or shared. Get the information you need with complete peace of mind.</p>
                </div>
            </div>
        </div>
    </div>
  );
}
