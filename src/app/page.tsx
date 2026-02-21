import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Sparkles, ShieldOff, Target, Lock, CheckCircle, Users, Wrench, Cog, Car, Power, AirVent, Armchair, Disc, GitPullRequest, FileText, BadgeCheck, Star, RefreshCw, Clock, ChevronsDown, ChevronRight, Flame } from "lucide-react";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { Card, CardContent } from "@/components/ui/card";

export default function Home() {
  const brandName = "mycarvalue.in";
  const title = "Don’t Sell Your Car Blindly. Know Its Real Value First.";
  const description = "Get an instant, AI-powered valuation report for just ₹149. This helps you sell directly to buyers at the right price.";
  
  const buttonText = 'Get Your Car’s True Value Now';
  const buttonLink = '/valuation';
  const trustLine = "Join 3000+ satisfied car owners today.";

  const whyChooseUsFeatures = [
    {
      icon: <BadgeCheck className="h-8 w-8 text-primary" />,
      stat: "160+",
      text: "Check Points Analyzed",
    },
    {
      icon: <Star className="h-8 w-8 text-primary" />,
      stat: "4.8/5",
      text: "Rated by Our Users",
    },
    {
      icon: <Lock className="h-8 w-8 text-primary" />,
      stat: "100%",
      text: "Private & Secure",
    },
    {
      icon: <Clock className="h-8 w-8 text-primary" />,
      stat: "2 Mins",
      text: "Get Your Report Instantly",
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

  const whatWeCheckImage = PlaceHolderImages.find(p => p.id === 'what-we-check');

  return (
    <>
      <section className="relative w-full pt-12 pb-10 md:pt-20 md:pb-16 lg:pt-24 lg:pb-20 overflow-hidden bg-gradient-to-b from-secondary/50 to-background">
        <div className="container relative z-10 mx-auto px-4 md:px-6">
          <div className="flex flex-col items-center text-center">
            <div className="max-w-3xl space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                <Sparkles className="h-3.5 w-3.5" />
                #1 AI Car Valuation in India
              </div>
              <h1 className="text-3xl font-black tracking-tight sm:text-4xl md:text-5xl lg:text-6xl">
                Don't Sell Blindly. <br />
                <span className="text-primary underline underline-offset-4">Know Your Car's Worth.</span>
              </h1>
              <p className="max-w-[600px] mx-auto text-base text-muted-foreground sm:text-lg leading-relaxed">
                {description}
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Button asChild size="lg" className="w-full sm:w-auto font-black shadow-md shadow-primary/10">
                  <Link href={buttonLink}>
                    {buttonText} <ChevronRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="w-full sm:w-auto font-bold border-primary/20 hover:bg-primary/5">
                  <Link href="/daily-fresh-cars">
                    <Flame className="mr-2 h-4 w-4 text-primary" /> Hot Market Listings
                  </Link>
                </Button>
              </div>
              <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground font-medium">
                <div className="flex items-center gap-1.5">
                  <CheckCircle className="h-3.5 w-3.5 text-green-500" /> Secure Payment
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle className="h-3.5 w-3.5 text-green-500" /> Instant PDF
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle className="h-3.5 w-3.5 text-green-500" /> No Logins Needed
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      <section className="py-12 lg:py-20 bg-background">
        <div className="container">
            <div className="text-center max-w-2xl mx-auto mb-10">
                <h2 className="text-2xl font-bold tracking-tighter md:text-3xl">Why Choose mycarvalue.in?</h2>
                <p className="mt-3 text-muted-foreground text-base">We provide a fast, unbiased, and data-driven valuation you can trust.</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {whyChooseUsFeatures.map((feature) => (
                <Card key={feature.stat} className="text-center p-5 shadow-sm hover:shadow-md transition-shadow border-secondary/50">
                  <div className="flex justify-center mb-3">
                    {feature.icon}
                  </div>
                  <p className="text-2xl font-bold text-primary">{feature.stat}</p>
                  <p className="mt-1 text-xs text-muted-foreground font-semibold">{feature.text}</p>
                </Card>
              ))}
            </div>
        </div>
      </section>
      
      <section className="py-12 lg:py-20 bg-secondary/30">
        <div className="container max-w-5xl text-center">
            <h2 className="text-2xl font-bold tracking-tighter mb-3 md:text-3xl">What We Check</h2>
            <p className="text-muted-foreground md:text-base max-w-2xl mx-auto mb-10">
                Our comprehensive AI valuation covers every vital aspect of your vehicle to give you the most accurate market price.
            </p>
            <Card className="shadow-xl overflow-hidden border-none bg-background">
                <CardContent className="p-5 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                    {whatWeCheckImage && (
                        <div className="relative aspect-video rounded-xl overflow-hidden shadow-inner bg-muted">
                            <Image
                                src={whatWeCheckImage.imageUrl}
                                alt="Car inspection points"
                                fill
                                className="object-cover"
                                data-ai-hint={whatWeCheckImage.imageHint}
                            />
                        </div>
                    )}
                    <div className="grid grid-cols-2 gap-x-6 gap-y-4 text-left">
                        {inspectionItems.map((item) => (
                            <div key={item.name} className="flex items-center gap-2.5 group">
                                <div className="p-1.5 rounded-md bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                                    <div className="[&>svg]:h-4 [&>svg]:w-4">{item.icon}</div>
                                </div>
                                <span className="font-bold text-xs md:text-sm">{item.name}</span>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
      </section>

      <section className="py-12 lg:py-20 bg-background">
        <div className="container max-w-3xl">
          <div className="flex flex-col md:flex-row items-center justify-center gap-5 rounded-xl bg-primary/10 p-6 border border-primary/20 shadow-md">
              <div className="h-12 w-12 rounded-full bg-primary flex items-center justify-center text-primary-foreground flex-shrink-0 animate-bounce">
                <CheckCircle className="h-7 w-7" />
              </div>
              <div className="text-center md:text-left">
                <p className="text-lg font-black text-primary uppercase tracking-tight">Pro Tip</p>
                <p className="text-base font-medium text-foreground/90">
                    Always check your car’s true value here before you talk to any dealer or broker.
                </p>
              </div>
          </div>
        </div>
      </section>

       <section className="py-12 lg:py-20 bg-secondary/50">
        <div className="container max-w-4xl text-center">
          <div className="flex flex-col items-center gap-5">
              <div className="flex -space-x-3 mb-1">
                {[1,2,3,4,5].map(i => (
                    <div key={i} className="h-10 w-10 rounded-full border-2 border-background bg-muted flex items-center justify-center overflow-hidden">
                        <Image src={`https://picsum.photos/seed/${i}/100/100`} alt="User" width={40} height={40} />
                    </div>
                ))}
              </div>
              <p className="text-xl md:text-2xl font-black text-foreground max-w-2xl leading-tight">
                  Trusted by <span className="text-primary decoration-2 underline">3000+ people</span> across India for fair and unbiased car valuations.
              </p>
              <Button asChild size="lg" variant="secondary" className="rounded-full font-bold">
                <Link href="/valuation">Join Them Now</Link>
              </Button>
          </div>
        </div>
      </section>
    </>
  );
}
