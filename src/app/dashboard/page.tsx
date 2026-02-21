
'use client';

import { Suspense, useEffect, useState, useMemo } from 'react';
import { doc, collection, query, orderBy } from 'firebase/firestore';
import { useUser, useFirestore, useDoc, useCollection } from '@/firebase';
import type { UserProfile } from '@/lib/firebase/user-profile-service';
import { requestWithdrawal, type WithdrawalRequestPayload } from '@/lib/firebase/withdrawal-service';
import { deleteValuation } from '@/lib/firebase/valuation-service';
import { upsertUserProfile, addCredits } from '@/lib/firebase/user-profile-service';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from 'zod';
import type { CarValuationFormInput } from '@/lib/schemas';
import { ValuationResultDisplay } from '@/components/report/ValuationResultDisplay';
import { DateRange } from "react-day-picker";
import { format } from "date-fns";
import { cn, toDate, formatCurrency, formatDateOnly } from "@/lib/utils";
import Script from "next/script";

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Wallet, ArrowDown, IndianRupee, Info, Car, Trash2, Eye, Calendar as CalendarIcon, Coins, CreditCard, Sparkles, ShoppingBag } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

interface Wallet {
    id: string;
    userId: string;
    balance: number;
    totalEarned: number;
    lastWithdrawalDate: Date | null;
}

interface WithdrawalRequest {
    id: string;
    userId: string;
    amount: number;
    upiId?: string;
    bankAccountNumber?: string;
    bankIfscCode?: string;
    status: 'requested' | 'paid' | 'rejected';
    requestedAt: Date | null;
    processedAt?: Date | null;
    rejectionReason?: string;
    transactionId?: string;
}

type ValuationDoc = CarValuationFormInput & { 
    id: string;
    createdAt: Date | null;
    valuationResult: any; 
};

const WithdrawalSchema = z.object({
  amount: z.coerce.number().min(1, { message: "Minimum withdrawal is ₹1." }),
  paymentMethod: z.enum(['upi', 'bank']),
  upiId: z.string().optional(),
  bankAccountNumber: z.string().optional(),
  bankIfscCode: z.string().optional(),
}).superRefine((data, ctx) => {
    if (data.paymentMethod === 'upi' && (!data.upiId || data.upiId.length < 3)) {
        ctx.addIssue({ code: 'custom', message: 'A valid UPI ID is required.', path: ['upiId'] });
    }
    if (data.paymentMethod === 'bank') {
        if (!data.bankAccountNumber || data.bankAccountNumber.length < 5) {
            ctx.addIssue({ code: 'custom', message: 'A valid bank account number is required.', path: ['bankAccountNumber'] });
        }
        if (!data.bankIfscCode || data.bankIfscCode.length < 5) {
            ctx.addIssue({ code: 'custom', message: 'A valid IFSC code is required.', path: ['bankIfscCode'] });
        }
    }
});

type WithdrawalFormInput = z.infer<typeof WithdrawalSchema>;

function WithdrawalDialog({ wallet, userProfile, isWithdrawalEnabled }: { wallet: Wallet | null, userProfile: UserProfile, isWithdrawalEnabled: boolean }) {
    const [open, setOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const firestore = useFirestore();
    const { user } = useUser();
    const { toast } = useToast();

    const form = useForm<WithdrawalFormInput>({
        resolver: zodResolver(WithdrawalSchema),
        defaultValues: {
            amount: 1,
            paymentMethod: 'upi',
            upiId: userProfile?.upiId || '',
            bankAccountNumber: userProfile?.bankAccountNumber || '',
            bankIfscCode: userProfile?.bankIfscCode || '',
        },
    });
    
    useEffect(() => {
        if(userProfile) {
            form.setValue('upiId', userProfile.upiId || '');
            form.setValue('bankAccountNumber', userProfile.bankAccountNumber || '');
            form.setValue('bankIfscCode', userProfile.bankIfscCode || '');
        }
    }, [userProfile, form]);

    const handleWithdrawal = async (data: WithdrawalFormInput) => {
        if (!firestore || !user || !wallet) return;

        if (data.amount > wallet.balance) {
            form.setError('amount', { message: "Amount cannot be more than your balance." });
            return;
        }

        setIsSubmitting(true);
        try {
            const payload: WithdrawalRequestPayload = {
                amount: data.amount,
                ...(data.paymentMethod === 'upi' ? { upiId: data.upiId } : {}),
                ...(data.paymentMethod === 'bank' ? { bankAccountNumber: data.bankAccountNumber, bankIfscCode: data.bankIfscCode } : {}),
            }
            await requestWithdrawal(firestore, user, payload);

            const profileUpdate: Partial<UserProfile> = {
                upiId: data.upiId,
                bankAccountNumber: data.bankAccountNumber,
                bankIfscCode: data.bankIfscCode
            }
            if (Object.values(profileUpdate).some(v => v)) {
                await upsertUserProfile(firestore, user, profileUpdate);
            }
            
            toast({
                title: "Withdrawal Requested",
                description: "Your request has been submitted and will be processed within 2-3 working days.",
            });
            setOpen(false);
            form.reset();

        } catch (error) {
            toast({
                variant: 'destructive',
                title: "Request Failed",
                description: "Could not submit your withdrawal request. Please try again.",
            });
        } finally {
            setIsSubmitting(false);
        }
    }
    
    const paymentMethod = form.watch('paymentMethod');

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="w-full" disabled={!isWithdrawalEnabled}>
                    <ArrowDown className="mr-2" /> Withdraw Balance
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Request Withdrawal</DialogTitle>
                    <DialogDescription>
                        Payments are processed manually.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                <form onSubmit={form.handleSubmit(handleWithdrawal)} className="space-y-4">
                    <div className="p-4 bg-muted/50 rounded-md text-center">
                        <p className="text-sm text-muted-foreground">Available Balance</p>
                        <p className="text-2xl font-bold">{formatCurrency(wallet?.balance)}</p>
                    </div>
                     <FormField
                        control={form.control}
                        name="amount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Amount</FormLabel>
                            <FormControl>
                              <Input type="number" placeholder="1" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                     <FormField
                        control={form.control}
                        name="paymentMethod"
                        render={({ field }) => (
                          <FormItem className="space-y-3">
                            <FormLabel>Payment Method</FormLabel>
                            <FormControl>
                                <Tabs defaultValue="upi" className="w-full" onValueChange={(value) => field.onChange(value as 'upi' | 'bank')}>
                                    <TabsList className="grid w-full grid-cols-2">
                                        <TabsTrigger value="upi">UPI</TabsTrigger>
                                        <TabsTrigger value="bank">Bank Transfer</TabsTrigger>
                                    </TabsList>
                                </Tabs>
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      {paymentMethod === 'upi' && (
                           <FormField
                            control={form.control}
                            name="upiId"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>UPI ID</FormLabel>
                                <FormControl>
                                  <Input placeholder="your-name@oksbi" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                      )}

                      {paymentMethod === 'bank' && (
                        <div className="space-y-4">
                           <FormField
                            control={form.control}
                            name="bankAccountNumber"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Bank Account Number</FormLabel>
                                <FormControl>
                                  <Input placeholder="Account Number" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                           <FormField
                            control={form.control}
                            name="bankIfscCode"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>IFSC Code</FormLabel>
                                <FormControl>
                                  <Input placeholder="IFSC Code" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      )}
                      
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button type="button" variant="secondary" disabled={isSubmitting}>Cancel</Button>
                        </DialogClose>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? 'Submitting...' : 'Submit Request'}
                        </Button>
                    </DialogFooter>
                </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}

function CreditPackCard({ credits, price, badge }: { credits: number, price: number, badge?: string }) {
    const { user } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();
    const router = useRouter();
    const [isPurchasing, setIsPurchasing] = useState(false);

    const handleBuy = async () => {
        if (!user || !firestore) {
            toast({ variant: "destructive", title: "Auth Required", description: "Please login to purchase credits." });
            return;
        }

        if (!(window as any).Razorpay) {
            toast({ variant: "destructive", title: "Error", description: "Payment gateway unavailable. Please refresh." });
            return;
        }

        setIsPurchasing(true);
        try {
            const res = await fetch('/api/razorpay', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ amount: price, type: 'credits' })
            });
            const order = await res.json();

            const options = {
                key: order.key,
                amount: order.amount,
                currency: order.currency,
                name: "mycarvalue.in",
                description: `${credits} Hot Listing Credits`,
                order_id: order.id,
                handler: async function (response: any) {
                    try {
                        await addCredits(firestore, user.uid, credits);
                        localStorage.setItem("razorpay_payment_id", response.razorpay_payment_id);
                        toast({ 
                            title: "Purchase Successful!", 
                            description: `${credits} credits added to your account.`,
                            className: "bg-green-600 text-white" 
                        });
                        router.push('/payment-success?type=credits');
                    } catch (e) {
                        toast({ variant: "destructive", title: "Sync Error", description: "Payment successful but credits update failed. Contact support." });
                    }
                },
                prefill: {
                    name: user.displayName || "",
                    email: user.email || ""
                },
                theme: { color: "#7c3aed" }
            };

            const rzp = new (window as any).Razorpay(options);
            rzp.open();
        } catch (error) {
            toast({ variant: "destructive", title: "Payment Error", description: "Could not initiate payment." });
        } finally {
            setIsPurchasing(false);
        }
    };

    return (
        <div className="flex items-center justify-between p-5 border rounded-xl bg-card hover:border-primary/50 transition-all shadow-sm group">
            <div className="space-y-1">
                <div className="flex items-center gap-2">
                    <p className="font-bold text-lg">{credits} Credit{credits > 1 ? 's' : ''}</p>
                    {badge && <Badge variant="secondary" className="text-[10px] uppercase font-black tracking-tighter bg-primary/10 text-primary border-primary/20">{badge}</Badge>}
                </div>
                <p className="text-3xl font-black text-foreground">₹{price}</p>
                <p className="text-xs text-muted-foreground">Unlock {credits} hot owner details</p>
            </div>
            <div>
                <Button 
                    onClick={handleBuy} 
                    disabled={isPurchasing}
                    className="rounded-full px-6 font-bold bg-gradient-to-r from-primary to-orange-500 hover:from-primary/90 hover:to-orange-600 shadow-md group-hover:scale-105 transition-transform"
                >
                    {isPurchasing ? (
                        <div className="flex items-center gap-2"><div className="h-3 w-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div> Processing...</div>
                    ) : (
                        <>Pay Now <Sparkles className="ml-2 h-4 w-4" /></>
                    )}
                </Button>
            </div>
        </div>
    );
}

function MechanicDashboard({ user, userProfile }: { user: any, userProfile: UserProfile }) {
    const firestore = useFirestore();

    const walletQuery = useMemo(() => {
        if (!firestore || !user) return null;
        return collection(firestore, 'users', user.uid, 'wallet');
    }, [firestore, user]);
    const { data: rawWalletData, isLoading: isWalletLoading } = useCollection<Omit<Wallet, 'lastWithdrawalDate'> & { lastWithdrawalDate: any }>(walletQuery);
    const walletData = useMemo(() => {
        if (!rawWalletData) return null;
        return rawWalletData.map(w => ({ ...w, lastWithdrawalDate: toDate(w.lastWithdrawalDate) }));
    }, [rawWalletData]);
    const wallet = walletData?.[0] || null;

    const withdrawalsQuery = useMemo(() => {
        if (!firestore || !user) return null;
        return query(collection(firestore, 'users', user.uid, 'withdrawalRequests'), orderBy('requestedAt', 'desc'));
    }, [firestore, user]);
    const { data: rawWithdrawalsData, isLoading: areWithdrawalsLoading } = useCollection<Omit<WithdrawalRequest, 'requestedAt' | 'processedAt'> & { requestedAt: any; processedAt: any; }>(withdrawalsQuery);
    const withdrawalsData = useMemo(() => {
        if (!rawWithdrawalsData) return null;
        return rawWithdrawalsData.map(w => ({ ...w, requestedAt: toDate(w.requestedAt), processedAt: toDate(w.processedAt) }));
    }, [rawWithdrawalsData]);

    const valuationsQuery = useMemo(() => {
        if (!firestore || !user) return null;
        return query(collection(firestore, 'users', user.uid, 'carValuations'), orderBy('createdAt', 'desc'));
    }, [firestore, user]);
    const { data: rawValuations, isLoading: areValuationsLoading } = useCollection<Omit<ValuationDoc, 'createdAt'> & { createdAt: any }>(valuationsQuery);
    const valuations = useMemo(() => {
        if (!rawValuations) return null;
        return rawValuations.map(v => ({ ...v, createdAt: toDate(v.createdAt) }));
    }, [rawValuations]);

    const completedToday = useMemo(() => {
        if (!valuations) return 0;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return valuations.filter(v => v.createdAt && v.createdAt >= today).length;
    }, [valuations]);

    const dailyLimit = 10; 
    const minWithdrawalAmount = 1;
    const remainingInspections = dailyLimit - completedToday;
    const lastPendingRequest = withdrawalsData?.find(w => w.status === 'requested');
    const isWithdrawalEnabled = !isWalletLoading && !!wallet && wallet.balance >= minWithdrawalAmount && !lastPendingRequest;

    if (isWalletLoading || areWithdrawalsLoading || areValuationsLoading) return <DashboardSkeleton />;

    return (
        <div className="container mx-auto py-8 px-4 md:px-6 bg-background">
            <Script id="rzp-checkout" src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
            <header className="mb-8 flex flex-wrap justify-between items-end gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Mechanic Dashboard</h1>
                    <p className="text-muted-foreground">Welcome back, {userProfile.displayName}!</p>
                </div>
                <div className="flex items-center gap-3 bg-primary/10 border border-primary/20 px-4 py-2 rounded-lg">
                    <Coins className="h-5 w-5 text-primary" />
                    <div className="text-sm">
                        <p className="font-bold text-primary">{userProfile.credits || 0} Credits</p>
                        <p className="text-[10px] uppercase font-bold text-muted-foreground">For Hot Listings</p>
                    </div>
                </div>
            </header>

            <main className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                <div className="lg:hidden block">
                    <TopUpCreditsCard />
                </div>

                <div className="lg:col-span-2 space-y-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <Card><CardHeader className="pb-2"><CardTitle className="text-xs uppercase text-muted-foreground">Today</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{completedToday}</div></CardContent></Card>
                        <Card><CardHeader className="pb-2"><CardTitle className="text-xs uppercase text-muted-foreground">Left</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{remainingInspections}</div></CardContent></Card>
                        <Card><CardHeader className="pb-2"><CardTitle className="text-xs uppercase text-muted-foreground">Wallet</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{formatCurrency(wallet?.balance)}</div></CardContent></Card>
                        <Card><CardHeader className="pb-2"><CardTitle className="text-xs uppercase text-muted-foreground">Total Earned</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{formatCurrency(wallet?.totalEarned)}</div></CardContent></Card>
                    </div>

                    <Card>
                        <CardHeader><CardTitle>Daily Limit</CardTitle></CardHeader>
                        <CardContent>
                            <Progress value={(completedToday / dailyLimit) * 100} className="mb-2" />
                            <Button asChild className="mt-4 w-full" disabled={remainingInspections <= 0}>
                                <Link href="/valuation"><Car className="mr-2"/> New Valuation</Link>
                            </Button>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader><CardTitle>Recent Withdrawals</CardTitle></CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Amount</TableHead><TableHead className="text-right">Status</TableHead></TableRow></TableHeader>
                                <TableBody>
                                    {withdrawalsData?.length ? withdrawalsData.map(item => (
                                        <TableRow key={item.id}>
                                            <TableCell className="text-xs">{formatDateOnly(item.requestedAt)}</TableCell>
                                            <TableCell className="font-medium text-xs">{formatCurrency(item.amount)}</TableCell>
                                            <TableCell className="text-right"><Badge variant={item.status === 'paid' ? 'default' : 'secondary'} className="text-[10px]">{item.status}</Badge></TableCell>
                                        </TableRow>
                                    )) : <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground h-20">No withdrawals yet.</TableCell></TableRow>}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6">
                    <div className="hidden lg:block">
                        <TopUpCreditsCard />
                    </div>

                    <Card>
                        <CardHeader><CardTitle>Withdraw Funds</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <WithdrawalDialog wallet={wallet} userProfile={userProfile} isWithdrawalEnabled={isWithdrawalEnabled}/>
                            {lastPendingRequest && <p className="text-xs text-primary text-center italic">Request for {formatCurrency(lastPendingRequest.amount)} is processing...</p>}
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    );
}

function TopUpCreditsCard() {
    return (
        <Card className="border-primary/20 shadow-lg overflow-hidden h-fit">
            <CardHeader className="bg-gradient-to-br from-primary/10 to-orange-500/10 border-b">
                <CardTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-primary" /> Top Up Credits</CardTitle>
                <CardDescription>Unlock hot leads and owner details.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
                <CreditPackCard credits={1} price={5} badge="Trial" />
                <CreditPackCard credits={5} price={25} />
                <CreditPackCard credits={10} price={49} />
                <CreditPackCard credits={20} price={99} />
            </CardContent>
        </Card>
    );
}

function AgentOwnerDashboard({ user, userProfile }: { user: any, userProfile: UserProfile }) {
    const firestore = useFirestore();
    const { toast } = useToast();
    
    const [selectedValuation, setSelectedValuation] = useState<ValuationDoc | null>(null);
    const [isViewReportOpen, setIsViewReportOpen] = useState(false);
    const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
    const [valuationDateRange, setValuationDateRange] = useState<DateRange | undefined>();

    const valuationsQuery = useMemo(() => {
        if (!firestore || !user) return null;
        return query(collection(firestore, 'users', user.uid, 'carValuations'), orderBy('createdAt', 'desc'));
    }, [firestore, user]);

    const { data: rawValuations } = useCollection<Omit<ValuationDoc, 'createdAt'> & { createdAt: any }>(valuationsQuery);
    const valuations = useMemo(() => rawValuations?.map(v => ({ ...v, createdAt: toDate(v.createdAt) })) || null, [rawValuations]);

    const filteredValuations = useMemo(() => {
        if (!valuations) return [];
        if (!valuationDateRange?.from) return valuations;
        const from = valuationDateRange.from;
        const to = valuationDateRange.to ? new Date(valuationDateRange.to) : new Date(from);
        to.setHours(23, 59, 59, 999);
        return valuations.filter(v => v.createdAt && v.createdAt >= from && v.createdAt <= to);
    }, [valuations, valuationDateRange]);

    const handleDelete = async () => {
        if (!firestore || !user || !selectedValuation) return;
        try {
            await deleteValuation(firestore, user, selectedValuation.id);
            toast({ title: "Success", description: "Report deleted." });
        } catch (e) {
            toast({ variant: "destructive", title: "Error" });
        } finally {
            setIsDeleteAlertOpen(false);
            setSelectedValuation(null);
        }
    };

    return (
        <div className="container mx-auto py-8 px-4 md:px-6">
            <Script id="rzp-checkout" src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
            <header className="mb-8 flex flex-wrap justify-between items-end gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                    <p className="text-muted-foreground">Manage your valuations and credits.</p>
                </div>
                <div className="flex items-center gap-3 bg-primary/10 border border-primary/20 px-4 py-2 rounded-lg">
                    <Coins className="h-5 w-5 text-primary" />
                    <div className="text-sm">
                        <p className="font-bold text-primary">{userProfile.credits || 0} Credits</p>
                        <p className="text-[10px] uppercase font-bold text-muted-foreground">Available to unlock</p>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:hidden block mb-8">
                    <TopUpCreditsCard />
                </div>

                <div className="lg:col-span-2 space-y-8">
                    <Card>
                        <CardHeader className="flex flex-col sm:flex-row justify-between gap-4">
                            <div><CardTitle>My Reports</CardTitle><CardDescription>Your past AI valuations.</CardDescription></div>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" size="sm" className="bg-background">
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {valuationDateRange?.from ? format(valuationDateRange.from, "PP") : "Filter by date"}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="end">
                                    <Calendar mode="range" selected={valuationDateRange} onSelect={setValuationDateRange} numberOfMonths={2} />
                                </PopoverContent>
                            </Popover>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader><TableRow><TableHead>Car</TableHead><TableHead>Vehicle #</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                                <TableBody>
                                    {filteredValuations.length > 0 ? filteredValuations.map(v => (
                                        <TableRow key={v.id}>
                                            <TableCell className="font-medium text-xs">{v.make} {v.model}</TableCell>
                                            <TableCell className="text-muted-foreground font-mono text-[10px] uppercase">{v.vehicleNumber || 'N/A'}</TableCell>
                                            <TableCell className="text-right space-x-1">
                                                <Button variant="outline" size="sm" className="h-7 px-2" onClick={() => { setSelectedValuation(v); setIsViewReportOpen(true); }}><Eye className="h-3 w-3"/></Button>
                                                <Button variant="destructive" size="sm" className="h-7 px-2" onClick={() => { setSelectedValuation(v); setIsDeleteAlertOpen(true); }}><Trash2 className="h-3 w-3"/></Button>
                                            </TableCell>
                                        </TableRow>
                                    )) : <TableRow><TableCell colSpan={3} className="h-24 text-center text-muted-foreground">No reports found.</TableCell></TableRow>}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>

                <div className="hidden lg:block space-y-8">
                    <TopUpCreditsCard />
                </div>
            </div>

            <Dialog open={isViewReportOpen} onOpenChange={setIsViewReportOpen}>
                <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
                    {selectedValuation && <ValuationResultDisplay result={{ valuation: selectedValuation.valuationResult, formData: selectedValuation }} onNewValuation={() => setIsViewReportOpen(false)} />}
                </DialogContent>
            </Dialog>

            <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader><AlertDialogTitle>Delete Report?</AlertDialogTitle><AlertDialogDescription>This cannot be undone.</AlertDialogDescription></AlertDialogHeader>
                    <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleDelete} className="bg-destructive">Delete</AlertDialogAction></AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

function DashboardSkeleton() {
    return (
        <div className="container mx-auto py-8 px-4 md:px-6">
            <Skeleton className="h-8 w-64 mb-8" />
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2 space-y-6"><Skeleton className="h-48" /><Skeleton className="h-64" /></div>
                <div className="space-y-6"><Skeleton className="h-48" /><Skeleton className="h-40" /></div>
            </div>
        </div>
    );
}

export default function DashboardPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();

  const userProfileRef = useMemo(() => (firestore && user) ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
  const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userProfileRef);

  useEffect(() => {
    if (!isUserLoading && !user) router.push('/login?redirect=/dashboard');
    else if (user && !isProfileLoading && (user.email === 'rajmycarvalue@gmail.com' || userProfile?.role === 'Admin')) router.push('/admin');
  }, [user, isUserLoading, userProfile, isProfileLoading, router]);

  if (isUserLoading || isProfileLoading || !user || !userProfile) return <DashboardSkeleton />;

  return userProfile.role === 'Mechanic' ? <MechanicDashboard user={user} userProfile={userProfile} /> : <AgentOwnerDashboard user={user} userProfile={userProfile} />;
}
