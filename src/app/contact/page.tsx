
import { Mail, Phone, MapPin, MessageSquare } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

export default function ContactPage() {
  return (
    <div className="bg-secondary/50 py-16 md:py-24">
      <div className="container mx-auto max-w-2xl px-4 md:px-6">
        <div className="space-y-4 text-center">
          <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl">
            Get in Touch
          </h1>
          <p className="text-muted-foreground md:text-xl">
            We'd love to hear from you. Here's how you can reach us.
          </p>
        </div>

        <div className="mt-12">
          <Card className="overflow-hidden shadow-lg">
            <CardHeader className="bg-muted/30">
              <CardTitle>Contact Information</CardTitle>
              <CardDescription>Our team is available to assist you.</CardDescription>
            </CardHeader>
            <CardContent className="p-6 text-base">
              <div className="flex flex-col space-y-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <Mail className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                      <p className="font-semibold text-lg">Email</p>
                      <p className="text-muted-foreground">For any inquiries, please email us.</p>
                      <a href="mailto:mycarvalue1@gmail.com" className="font-medium text-primary hover:underline">
                          mycarvalue1@gmail.com
                      </a>
                  </div>
                </div>
                
                <Separator />

                <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                        <MessageSquare className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <p className="font-semibold text-lg">Chat with us</p>
                        <p className="text-muted-foreground">Get quick support on WhatsApp.</p>
                        <a href="https://wa.me/919492060040" target="_blank" rel="noopener noreferrer" className="font-medium text-primary hover:underline">
                            +91 9492060040
                        </a>
                    </div>
                </div>

                <Separator />

                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <Phone className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                      <p className="font-semibold text-lg">Phone</p>
                      <p className="text-muted-foreground">Give us a call for immediate assistance.</p>
                      <a href="tel:+919492060040" className="font-medium text-primary hover:underline">
                          +91 9492060040
                      </a>
                  </div>
                </div>

                <Separator />

                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <MapPin className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                      <p className="font-semibold text-lg">Our Office</p>
                      <p className="text-muted-foreground">
                          Bangalore, 560045, India
                      </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
