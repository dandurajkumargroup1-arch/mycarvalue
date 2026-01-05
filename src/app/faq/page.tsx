
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
  } from "@/components/ui/accordion";
import { HelpCircle } from "lucide-react";

const faqItems = [
    {
      question: "Is this car price accurate?",
      answer: "Our valuation is based on recent market prices, car age, mileage, fuel type, and demand in your city. The price shown is a fair market estimate to help you understand your car’s real value before selling."
    },
    {
      question: "Why does the valuation cost ₹149?",
      answer: "The fee covers the cost of using advanced AI models to analyze millions of data points, ensuring you get the most accurate and unbiased valuation possible. This small investment helps you make a much bigger, informed decision."
    },
    {
      question: "Do you buy cars or share my details with dealers?",
      answer: "No. We do not buy cars, and we do not share your data with dealers or third parties. This is an independent price-check service only."
    },
    {
      question: "Will the final selling price be exactly the same?",
      answer: "The final price may vary based on physical inspection, car condition, and market demand. Our report gives you a realistic price range so you know what price you should accept."
    },
    {
      question: "Can I use this report to negotiate with dealers or buyers?",
      answer: "Yes. Many users use this report as a reference while talking to dealers or buyers to avoid low offers and sell with confidence."
    }
  ];

export default function FaqPage() {
    return (
        <section className="py-16 lg:py-24 bg-secondary/50">
        <div className="container max-w-3xl">
          <div className="space-y-4 text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1 text-sm font-medium text-primary">
              <HelpCircle className="h-4 w-4" />
              Frequently Asked Questions
            </div>
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">
              Your Questions, Answered
            </h2>
            <p className="text-muted-foreground md:text-lg">
              Here are some of the most common questions about our car valuation service.
            </p>
          </div>

          <div className="mt-12">
            <Accordion type="single" collapsible className="w-full">
              {faqItems.map((item, index) => (
                 <AccordionItem value={`item-${index + 1}`} key={index}>
                  <AccordionTrigger className="text-lg font-semibold text-left">{item.question}</AccordionTrigger>
                  <AccordionContent className="text-base text-muted-foreground">
                    {item.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>
    );
}
