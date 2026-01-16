
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Sparkles, ShieldOff, Target, Lock, CheckCircle, Users, Wrench, Cog, Car, Power, AirVent, Armchair, Disc, GitPullRequest, FileText, BadgeCheck, Star, RefreshCw, Clock, ChevronsDown } from "lucide-react";
import { MotionDiv } from "@/components/motion-div";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { Card, CardContent } from "@/components/ui/card";

export default function Home() {
  const brandName = "mycarvalue.in";
  const title = "Don’t Sell Your Car Blindly. Know Its Real Value First.";
  const description = "This valuation helps you sell directly to buyers at the right price.";
  
  const buttonText = 'Get Your Car’s True Value Now';
  const buttonLink = '/valuation';
  const trustLine = "Just ₹149 for a detailed, AI-powered report.";

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
      <section className="w-full py-20 md:py-28 lg:py-32 flex items-center justify-center text-center bg-gradient-to-b from-secondary/50 to-background">
        <div className="container z-20 flex flex-col items-center p-4">
          <div 
            className="max-w-3xl"
          >
            <p className="font-semibold text-primary">{brandName}</p>
            <h1 className="text-3xl md:text-5xl font-bold tracking-tighter text-foreground mt-2">
              {title}
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">{description}</p>
            <div>
              <Button asChild size="lg" className="mt-8">
                <Link href={buttonLink}>
                  {buttonText} <Sparkles className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <p className="mt-3 text-sm text-muted-foreground">{trustLine}</p>
            </div>
          </div>
        </div>
      </section>
      
      <section className="py-16 lg:py-24 bg-background">
        <div className="container">
            <div className="text-center max-w-2xl mx-auto mb-12">
                <h2 className="text-3xl font-bold tracking-tighter">Why Choose mycarvalue.in?</h2>
                <p className="mt-4 text-muted-foreground">We provide a fast, unbiased, and data-driven valuation you can trust.</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
              {whyChooseUsFeatures.map((feature) => (
                <Card key={feature.stat} className="text-center p-6 shadow-sm hover:shadow-lg transition-shadow">
                  <div className="flex justify-center mb-3">
                    {feature.icon}
                  </div>
                  <p className="text-3xl font-bold text-primary">{feature.stat}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{feature.text}</p>
                </Card>
              ))}
            </div>
        </div>
      </section>
      
      <section className="py-16 lg:py-24 bg-secondary/50">
        <div className="container max-w-4xl text-center">
            <h2 className="text-3xl font-bold tracking-tighter mb-4">What We Check</h2>
            <p className="text-muted-foreground md:text-lg max-w-2xl mx-auto mb-12">
                Our comprehensive AI valuation covers the following items to give you the most accurate price.
            </p>
            <Card className="shadow-lg overflow-hidden">
                <CardContent className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                    {whatWeCheckImage && (
                        <div className="relative aspect-video rounded-lg overflow-hidden">
                            <Image
                                src={whatWeCheckImage.imageUrl}
                                alt="Car inspection points"
                                fill
                                style={{ objectFit: 'cover' }}
                                data-ai-hint={whatWeCheckImage.imageHint}
                            />
                        </div>
                    )}
                    <div className="grid grid-cols-2 gap-x-8 gap-y-4 text-left">
                        {inspectionItems.map((item) => (
                            <div key={item.name} className="flex items-center gap-3">
                                <div className="text-primary">{item.icon}</div>
                                <span className="font-medium">{item.name}</span>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
      </section>

      <section className="py-16 lg:py-24 bg-background">
        <div className="container max-w-3xl">
          <div className="flex items-center justify-center gap-3 rounded-lg bg-primary/10 p-4 border border-primary/20">
              <CheckCircle className="h-6 w-6 text-primary flex-shrink-0" />
              <p className="font-semibold text-primary text-center">
                  Pro Tip: Always check your car’s true value here before you talk to any dealer.
              </p>
          </div>
        </div>
      </section>

       <section className="py-16 lg:py-24 bg-secondary/50">
        <div className="container max-w-3xl">
          <div className="flex items-center justify-center gap-3 rounded-lg bg-background p-6 border">
              <Users className="h-8 w-8 text-primary flex-shrink-0" />
              <p className="text-lg font-semibold text-foreground">
                  Trusted by <span className="text-primary">3000+</span> people for fair car valuations.
              </p>
          </div>
        </div>
      </section>
    </>
  );
}
