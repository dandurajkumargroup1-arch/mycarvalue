'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Handshake } from 'lucide-react';

const referralSchema = z.object({
  referrerName: z.string().min(2, { message: 'Please enter your name.' }),
  referrerContact: z.string().min(10, { message: 'Please enter your contact number or email.' }),
  friendName: z.string().min(2, { message: "Please enter your friend's name." }),
  friendContact: z.string().min(10, { message: "Please enter your friend's contact number." }),
  carDetails: z.string().optional(),
});

type ReferralFormValues = z.infer<typeof referralSchema>;

export default function ReferPage() {
  const { toast } = useToast();
  const form = useForm<ReferralFormValues>({
    resolver: zodResolver(referralSchema),
    defaultValues: {
      referrerName: '',
      referrerContact: '',
      friendName: '',
      friendContact: '',
      carDetails: '',
    },
  });

  const onSubmit = (data: ReferralFormValues) => {
    console.log('Referral data:', data);
    toast({
      title: 'Referral Submitted!',
      description: "Thank you for referring your friend. We'll be in touch!",
    });
    form.reset();
  };

  return (
    <div className="container mx-auto max-w-2xl py-12">
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-4">
            <Handshake className="h-8 w-8 text-primary" />
          </div>
          <CardTitle>Refer a Friend</CardTitle>
          <CardDescription>Know someone selling their car? Refer them and get rewarded!</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="referrerName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Your Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Your Name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="referrerContact"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Your Contact (Mobile or Email)</FormLabel>
                      <FormControl>
                        <Input placeholder="Your Contact Info" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="border-t pt-6 space-y-4">
                 <FormField
                  control={form.control}
                  name="friendName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Friend's Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Friend's Name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="friendContact"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Friend's Mobile Number</FormLabel>
                      <FormControl>
                        <Input placeholder="Friend's Mobile Number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="carDetails"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Car Details (e.g., Maruti Swift 2018) (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Car Make, Model, and Year" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <Button type="submit" className="w-full">Submit Referral</Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
