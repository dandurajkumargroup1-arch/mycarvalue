
"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Sparkles, ShieldOff, Target, Lock, CheckCircle, Users } from "lucide-react";
import { motion } from "framer-motion";

export default function Home() {
  const brandName = "mycarvalue.in";
  const title = "Don’t Sell Your Car Blindly. Know Its Real Value First.";
  const description = "Get an instant, independent car price estimate based on current Indian market demand — before you talk to dealers or buyers.";
  
  const buttonText = 'Get Your Car’s True Value Now';
  const buttonLink = '/valuation';
  const trustLine = "Just ₹149 for a detailed, AI-powered report.";

  const features = [
    {
      icon: <Lock className="h-8 w-8 text-primary" />,
      title: "100% Private",
      text: "Your data is never stored or shared. Valuations are completely anonymous, giving you peace of mind.",
    },
    {
      icon: <ShieldOff className="h-8 w-8 text-primary" />,
      title: "Truly Unbiased",
      text: "We don't buy or sell cars. Our only goal is to give you an accurate, fair-market price, free from any hidden agenda.",
    },
    {
      icon: <Target className="h-8 w-8 text-primary" />,
      title: "Pinpoint Accurate",
      text: "Our advanced AI model analyzes millions of real-time data points from the Indian market for ultimate precision.",
    },
  ];

  return (
    <>
      <section className="w-full py-20 md:py-28 lg:py-32 flex items-center justify-center text-center bg-gradient-to-b from-secondary/50 to-background">
        <div className="container z-20 flex flex-col items-center p-4">
          <motion.div 
            className="max-w-3xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <p className="font-semibold text-primary">{brandName}</p>
            <h1 className="text-3xl md:text-5xl font-bold tracking-tighter text-foreground mt-2">
              {title}
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">{description}</p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <Button asChild size="lg" className="mt-8">
                <Link href={buttonLink}>
                  {buttonText} <Sparkles className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <p className="mt-3 text-sm text-muted-foreground">{trustLine}</p>
            </motion.div>
          </motion.div>
        </div>
      </section>
      
      <section className="py-16 lg:py-24 bg-background">
        <div className="container">
            <div className="grid md:grid-cols-3 gap-8 md:gap-12">
              {features.map((feature) => (
                <div key={feature.title} className="text-center p-6 bg-card border rounded-lg shadow-sm">
                  <div className="flex justify-center mb-4">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-bold">{feature.title}</h3>
                  <p className="mt-2 text-muted-foreground">{feature.text}</p>
                </div>
              ))}
            </div>
        </div>
      </section>
      
      <section className="py-16 lg:py-24 bg-secondary/50">
        <div className="container max-w-3xl">
          <div className="flex items-center justify-center gap-3 rounded-lg bg-background p-6 border-t border-b">
              <Users className="h-8 w-8 text-primary flex-shrink-0" />
              <p className="text-lg font-semibold text-foreground">
                  Trusted by <span className="text-primary">3000+</span> people for fair car valuations.
              </p>
          </div>
        </div>
      </section>

      <section className="py-16 lg:py-24 bg-background">
        <div className="container max-w-3xl">
          <div className="flex items-center justify-center gap-3 rounded-lg bg-primary/10 p-4 border border-primary/20">
              <CheckCircle className="h-6 w-6 text-primary flex-shrink-0" />
              <p className="font-semibold text-primary text-center">
                  Tip: Always check your car’s value before talking to any dealer.
              </p>
          </div>
        </div>
      </section>
    </>
  );
}
