import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Sparkles, CheckCircle, ChevronRight, Flame, BadgeCheck, Star, Lock, Clock, Wrench, Cog, Car, Power, AirVent, Armchair, Disc, ChevronsDown, GitPullRequest, FileText } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function Home() {
  const description = "Get an instant, AI-powered valuation report for just ₹149. Know your car's true market value before selling.";
  
  const buttonText = 'Get Your True Value Now';
  const buttonLink = '/valuation';

  const whyChooseUsFeatures = [
    {
      icon: <BadgeCheck className="h-8 w-8 text-primary" />,
      stat: "160+",
      text: "Check Points Analyzed",
    },
    {
      icon: <Star className="h-8 w-8 text-primary" />,
      stat: "4.8/5",
      text: "User Rating",
    },
    {
      icon: <Lock className="h-8 w-8 text-primary" />,
      stat: "100%",
      text: "Private & Secure",
    },
    {
      icon: <Clock className="h-8 w-8 text-primary" />,
      stat: "2 Mins",
      text: "Instant Report",
    },
  ];

  const inspectionItems = [
      { icon: <Wrench />, name: 'Additional Features' },
      { icon: <Cog />, name: 'Engine' },
      { icon: <Car />, name: 'Exterior' },
      { icon: <Power />, name: 'Electrical' },
      { icon: <AirVent />, name: 'AC' },
      { icon: <Armchair />, name: 'Interior' },
      { icon: <Disc />, name: 'Brakes' },
      { icon: <ChevronsDown />, name: 'Suspension' },
      { icon: <GitPullRequest />, name: 'Transmission' },
      { icon: <FileText />, name: 'Documents' },
  ];

  return (
    <>
      <section className="relative w-full pt-16 pb-12 md:pt-24 md:pb-20 overflow-hidden bg-gradient-to-b from-primary/5 via-background to-background">
        <div className="container relative z-10 mx-auto px-4 md:px-6">
          <div className="flex flex-col items-center text-center">
            <div className="max-w-4xl space-y-8">
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-xs font-bold text-primary uppercase tracking-wider">
                <Sparkles className="h-3.5 w-3.5" />
                India's #1 AI Car Valuation
              </div>
              <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
                Don't Sell Blindly. <br />
                <span className="bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">Know Your Worth.</span>
              </h1>
              <p className="max-w-[700px] mx-auto text-lg text-muted-foreground sm:text-xl md:text-2xl leading-relaxed">
                {description}
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                <Button asChild size="lg" className="w-full sm:w-auto font-black text-lg h-14 px-10 shadow-xl shadow-primary/20 rounded-full">
                  <Link href={buttonLink}>
                    {buttonText} <ChevronRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="w-full sm:w-auto font-bold border-primary/20 hover:bg-primary/5 h-14 px-10 rounded-full">
                  <Link href="/daily-fresh-cars">
                    <Flame className="mr-2 h-5 w-5 text-primary" /> Hot Market Listings
                  </Link>
                </Button>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4 text-[11px] text-muted-foreground font-bold uppercase tracking-widest pt-10">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-primary" /> Secure Payment
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-primary" /> Instant PDF Download
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-primary" /> No Dealer Spam
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      <section className="py-16 bg-background">
        <div className="container">
            <div className="text-center max-w-2xl mx-auto mb-12">
                <h2 className="text-3xl font-bold tracking-tight md:text-4xl text-foreground">Engineered for Accuracy</h2>
                <p className="mt-4 text-muted-foreground text-lg font-medium">We provide an unbiased, data-driven valuation report you can use to negotiate better.</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {whyChooseUsFeatures.map((feature) => (
                <Card key={feature.stat} className="text-center p-6 border-primary/10 hover:border-primary/30 transition-all shadow-sm rounded-2xl group">
                  <div className="flex justify-center mb-4 group-hover:scale-110 transition-transform">
                    {feature.icon}
                  </div>
                  <p className="text-3xl font-black text-foreground">{feature.stat}</p>
                  <p className="mt-2 text-sm text-muted-foreground font-bold uppercase tracking-tight">{feature.text}</p>
                </Card>
              ))}
            </div>
        </div>
      </section>
      
      <section className="py-20 bg-secondary/30">
        <div className="container max-w-6xl text-center">
            <h2 className="text-3xl font-bold tracking-tight mb-4 md:text-4xl">Comprehensive Inspection</h2>
            <p className="text-muted-foreground text-lg max-w-3xl mx-auto mb-12">
                Our AI model analyzes every vital aspect of your vehicle, from engine health to tire wear, ensuring the most accurate market price.
            </p>
            <Card className="shadow-2xl overflow-hidden border-none bg-background rounded-3xl">
                <CardContent className="p-8 md:p-16">
                    <div className="max-w-5xl mx-auto">
                        <div className="grid grid-cols-5 gap-x-2 gap-y-8 md:gap-8">
                            {inspectionItems.map((item) => (
                                <div key={item.name} className="flex flex-col items-center text-center gap-2 sm:gap-3 group">
                                    <div className="p-2.5 sm:p-4 rounded-xl sm:rounded-2xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-all duration-300">
                                        <div className="[&>svg]:h-5 [&>svg]:w-5 sm:[&>svg]:h-6 sm:[&>svg]:w-6">{item.icon}</div>
                                    </div>
                                    <span className="font-bold text-[10px] sm:text-sm text-foreground/80 leading-tight">{item.name}</span>
                                </div>
                            ))}
                        </div>
                        <div className="mt-16 flex justify-center">
                            <Button asChild size="lg" className="rounded-full px-12 h-14 text-lg font-bold">
                                <Link href="/valuation">See How It Works</Link>
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
      </section>

      <section className="py-20 bg-background">
        <div className="container max-w-4xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8 rounded-[2rem] bg-foreground text-white p-10 md:p-12 shadow-2xl relative overflow-hidden">
              <div className="relative z-10 flex flex-col gap-2 max-w-md text-left">
                <p className="text-primary font-black uppercase tracking-widest text-sm">Pro Tip for Sellers</p>
                <h3 className="text-2xl md:text-3xl font-bold">Always check your true value first.</h3>
                <p className="text-white/70 text-lg">Don't let dealers or brokers decide your car's price. Enter the negotiation with a professional AI report.</p>
              </div>
              <div className="relative z-10">
                <div className="h-20 w-20 rounded-full bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/20 animate-bounce">
                    <CheckCircle className="h-10 w-10" />
                </div>
              </div>
          </div>
        </div>
      </section>

       <section className="py-24 bg-secondary/50">
        <div className="container max-w-4xl text-center">
          <div className="flex flex-col items-center gap-8">
              <h2 className="text-3xl md:text-5xl font-black text-foreground max-w-3xl leading-tight">
                  Trusted by <span className="text-primary">5,000+ car owners</span> for fair market pricing.
              </h2>
              <Button asChild size="lg" className="rounded-full px-12 h-16 text-xl font-black">
                <Link href="/valuation">Get Your Report Now</Link>
              </Button>
          </div>
        </div>
      </section>
    </>
  );
}
