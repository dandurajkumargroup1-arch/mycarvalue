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

  const heroImage = PlaceHolderImages.find(p => p.id === 'hero');
  const whatWeCheckImage = PlaceHolderImages.find(p => p.id === 'what-we-check');

  return (
    <>
      <section className="relative w-full pt-20 pb-16 md:pt-32 md:pb-24 lg:pt-40 lg:pb-32 overflow-hidden bg-gradient-to-b from-secondary/50 to-background">
        <div className="container relative z-10 mx-auto px-4 md:px-6">
          <div className="flex flex-col lg:flex-row items-center gap-12 text-center lg:text-left">
            <div className="flex-1 space-y-8">
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-bold text-primary">
                <Sparkles className="h-4 w-4" />
                #1 AI Car Valuation in India
              </div>
              <h1 className="text-4xl font-black tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
                Don't Sell Blindly. <br />
                <span className="text-primary underline underline-offset-8">Know Your Car's Worth.</span>
              </h1>
              <p className="max-w-[600px] mx-auto lg:mx-0 text-lg text-muted-foreground md:text-xl leading-relaxed">
                {description}
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                <Button asChild size="xl" className="w-full sm:w-auto font-black shadow-lg shadow-primary/20">
                  <Link href={buttonLink}>
                    {buttonText} <ChevronRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="xl" className="w-full sm:w-auto font-bold border-primary/20 hover:bg-primary/5">
                  <Link href="/daily-fresh-cars">
                    <Flame className="mr-2 h-5 w-5 text-primary" /> Hot Market Listings
                  </Link>
                </Button>
              </div>
              <div className="flex items-center justify-center lg:justify-start gap-6 text-sm text-muted-foreground font-medium">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" /> Secure Payment
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" /> Instant PDF
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" /> No Logins Needed
                </div>
              </div>
            </div>

            {heroImage && (
              <div className="flex-1 relative w-full max-w-[600px] aspect-[4/3] lg:aspect-square">
                <div className="absolute -inset-10 bg-primary/20 blur-[100px] rounded-full opacity-30 animate-pulse"></div>
                <div className="relative h-full w-full rounded-3xl border-[12px] border-secondary overflow-hidden shadow-2xl">
                  <Image
                    src={heroImage.imageUrl}
                    alt="Premium Car Inspection"
                    fill
                    className="object-cover"
                    priority
                    data-ai-hint={heroImage.imageHint}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                  <div className="absolute bottom-6 left-6 right-6 text-white text-left">
                    <p className="text-2xl font-bold">Inspection-Ready Values</p>
                    <p className="text-sm opacity-80">Based on 160+ real-world data points</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
      
      <section className="py-16 lg:py-24 bg-background">
        <div className="container">
            <div className="text-center max-w-2xl mx-auto mb-12">
                <h2 className="text-3xl font-bold tracking-tighter md:text-4xl">Why Choose mycarvalue.in?</h2>
                <p className="mt-4 text-muted-foreground text-lg">We provide a fast, unbiased, and data-driven valuation you can trust.</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
              {whyChooseUsFeatures.map((feature) => (
                <Card key={feature.stat} className="text-center p-6 shadow-sm hover:shadow-lg transition-shadow border-secondary/50">
                  <div className="flex justify-center mb-3">
                    {feature.icon}
                  </div>
                  <p className="text-3xl font-bold text-primary">{feature.stat}</p>
                  <p className="mt-1 text-sm text-muted-foreground font-semibold">{feature.text}</p>
                </Card>
              ))}
            </div>
        </div>
      </section>
      
      <section className="py-16 lg:py-24 bg-secondary/30">
        <div className="container max-w-5xl text-center">
            <h2 className="text-3xl font-bold tracking-tighter mb-4 md:text-4xl">What We Check</h2>
            <p className="text-muted-foreground md:text-lg max-w-2xl mx-auto mb-12">
                Our comprehensive AI valuation covers every vital aspect of your vehicle to give you the most accurate market price.
            </p>
            <Card className="shadow-2xl overflow-hidden border-none bg-background">
                <CardContent className="p-6 md:p-10 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                    {whatWeCheckImage && (
                        <div className="relative aspect-video rounded-2xl overflow-hidden shadow-inner bg-muted">
                            <Image
                                src={whatWeCheckImage.imageUrl}
                                alt="Car inspection points"
                                fill
                                className="object-cover"
                                data-ai-hint={whatWeCheckImage.imageHint}
                            />
                        </div>
                    )}
                    <div className="grid grid-cols-2 gap-x-8 gap-y-6 text-left">
                        {inspectionItems.map((item) => (
                            <div key={item.name} className="flex items-center gap-3 group">
                                <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                                    {item.icon}
                                </div>
                                <span className="font-bold text-sm md:text-base">{item.name}</span>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
      </section>

      <section className="py-16 lg:py-24 bg-background">
        <div className="container max-w-3xl">
          <div className="flex flex-col md:flex-row items-center justify-center gap-6 rounded-2xl bg-primary/10 p-8 border border-primary/20 shadow-lg">
              <div className="h-16 w-16 rounded-full bg-primary flex items-center justify-center text-primary-foreground flex-shrink-0 animate-bounce">
                <CheckCircle className="h-10 w-10" />
              </div>
              <div className="text-center md:text-left">
                <p className="text-xl font-black text-primary uppercase tracking-tight">Pro Tip</p>
                <p className="text-lg font-medium text-foreground/90">
                    Always check your car’s true value here before you talk to any dealer or broker.
                </p>
              </div>
          </div>
        </div>
      </section>

       <section className="py-16 lg:py-24 bg-secondary/50">
        <div className="container max-w-4xl text-center">
          <div className="flex flex-col items-center gap-6">
              <div className="flex -space-x-4 mb-2">
                {[1,2,3,4,5].map(i => (
                    <div key={i} className="h-12 w-12 rounded-full border-4 border-background bg-muted flex items-center justify-center overflow-hidden">
                        <Image src={`https://picsum.photos/seed/${i}/100/100`} alt="User" width={48} height={48} />
                    </div>
                ))}
              </div>
              <p className="text-2xl md:text-3xl font-black text-foreground max-w-2xl">
                  Trusted by <span className="text-primary decoration-4 underline">3000+ people</span> across India for fair and unbiased car valuations.
              </p>
              <Button asChild size="lg" variant="secondary" className="rounded-full">
                <Link href="/valuation">Join Them Now</Link>
              </Button>
          </div>
        </div>
      </section>
    </>
  );
}
