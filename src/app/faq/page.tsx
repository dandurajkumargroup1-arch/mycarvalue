import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { HelpCircle } from "lucide-react";

export default function FaqPage() {
    const faqs = [
        {
            question: "How accurate is the valuation?",
            answer: "Our valuation is AI-powered and uses over 160 data points, along with current market trends, to provide a highly accurate estimate. However, it is intended as a guide, and the final price can be affected by a physical inspection."
        },
        {
            question: "Why does it cost ₹149?",
            answer: "The fee covers the cost of running our advanced AI models and maintaining the market data that powers our valuations. This allows us to provide an independent, unbiased report without influence from dealers."
        },
        {
            question: "How long does it take to get the report?",
            answer: "After you fill out the form and complete the payment, your detailed valuation report is generated and available to you instantly."
        },
        {
            question: "Is my personal data secure?",
            answer: "Yes, we take your privacy very seriously. Your data is 100% private and secure. We only use the information you provide to generate your car valuation report."
        }
    ];

  return (
    <div className="container mx-auto max-w-3xl py-12">
      <Card>
        <CardHeader className="text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-4">
                <HelpCircle className="h-8 w-8 text-primary" />
            </div>
            <CardTitle>Frequently Asked Questions</CardTitle>
            <CardDescription>Find answers to common questions below.</CardDescription>
        </CardHeader>
        <CardContent>
            <Accordion type="single" collapsible className="w-full">
                {faqs.map((faq, index) => (
                    <AccordionItem value={`item-${index}`} key={index}>
                        <AccordionTrigger>{faq.question}</AccordionTrigger>
                        <AccordionContent className="text-muted-foreground">
                            {faq.answer}
                        </AccordionContent>
                    </AccordionItem>
                ))}
            </Accordion>
        </CardContent>
      </Card>
    </div>
  );
}
