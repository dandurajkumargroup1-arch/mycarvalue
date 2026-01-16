import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Phone, Mail } from "lucide-react";

export default function ContactPage() {
  return (
    <div className="container mx-auto max-w-3xl py-12">
      <Card>
        <CardHeader className="text-center">
             <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-4">
                <Phone className="h-8 w-8 text-primary" />
            </div>
            <CardTitle>Contact Us</CardTitle>
            <CardDescription>We're here to help. Reach out to us with any questions.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center space-y-4">
            <div className="flex items-center gap-4 p-4 rounded-lg border w-full max-w-sm justify-center">
                <Mail className="h-6 w-6 text-muted-foreground"/>
                <a href="mailto:mycarvalue1@gmail.com" className="font-medium text-primary hover:underline">
                    mycarvalue1@gmail.com
                </a>
            </div>
             <p className="text-sm text-muted-foreground text-center">
                Please include your Payment ID or registered email for faster support. We typically respond within 24 hours.
            </p>
        </CardContent>
      </Card>
    </div>
  );
}
