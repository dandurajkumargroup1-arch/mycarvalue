'use client';

import { Suspense, useEffect, useState, useMemo } from 'react';
import { doc, collection, query, orderBy, limit, where, Timestamp, type FieldValue } from 'firebase/firestore';
import { useUser, useFirestore, useDoc, useCollection } from '@/firebase';
import type { UserProfile } from '@/lib/firebase/user-profile-service';
import { requestWithdrawal, type WithdrawalRequestPayload } from '@/lib/firebase/withdrawal-service';
import { deleteValuation } from '@/lib/firebase/valuation-service';
import { upsertUserProfile } from '@/lib/firebase/user-profile-service';
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


import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Wallet, ArrowDown, Ban, Check, Clock, IndianRupee, Info, AlertTriangle, Car, Trash2, Eye, Calendar as CalendarIcon } from 'lucide-react';
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

// Represents a valuation document from Firestore, including its ID
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

            // Save payment details for next time
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

function MechanicDashboard({ user, userProfile }: { user: any, userProfile: UserProfile }) {
    const firestore = useFirestore();

    // -- Data Fetching & Processing --
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
        return query(
            collection(firestore, 'users', user.uid, 'withdrawalRequests'), 
            orderBy('requestedAt', 'desc')
        );
    }, [firestore, user]);
    const { data: rawWithdrawalsData, isLoading: areWithdrawalsLoading, error: withdrawalsError } = useCollection<Omit<WithdrawalRequest, 'requestedAt' | 'processedAt'> & { requestedAt: any; processedAt: any; }>(withdrawalsQuery);
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

    // -- Derived Data --
    const withdrawals = useMemo(() => {
        if (!withdrawalsData) return null;
        return [...withdrawalsData].sort((a, b) => {
            const timeA = a.requestedAt?.getTime() ?? 0;
            const timeB = b.requestedAt?.getTime() ?? 0;
            return timeB - timeA;
        });
    }, [withdrawalsData]);

    const completedToday = useMemo(() => {
        if (!valuations) return 0;
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Start of today
        return valuations.filter(v => {
            const valuationDate = v.createdAt;
            return valuationDate && valuationDate >= today;
        }).length;
    }, [valuations]);

    const dailyLimit = 10; 
    const earningsPerReport = 15;
    const minWithdrawalAmount = 1;
    
    const remainingInspections = dailyLimit - completedToday;
    const isLimitReached = remainingInspections <= 0;

    const lastPendingRequest = useMemo(() => withdrawals?.find(w => w.status === 'requested'), [withdrawals]);
    
    const isWithdrawalEnabled = !isWalletLoading && !!wallet && wallet.balance >= minWithdrawalAmount && !lastPendingRequest;
    const lastWithdrawalStatus = lastPendingRequest 
        ? `Requested on ${formatDateOnly(lastPendingRequest.requestedAt)}` 
        : (wallet?.lastWithdrawalDate ? `Paid on ${formatDateOnly(wallet.lastWithdrawalDate)}` : 'No recent withdrawals');
    
    const dailyEarnings = completedToday * earningsPerReport;
    const weeklyEarnings = dailyEarnings * 7; // This is a placeholder calculation

    const isLoading = isWalletLoading || areWithdrawalsLoading || areValuationsLoading;
    if(isLoading) return <DashboardSkeleton />;

    return (
        <div className="container mx-auto py-8 px-4 md:px-6 bg-background">
            <header className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight">Mechanic Dashboard</h1>
                <p className="text-muted-foreground">Welcome back, {userProfile.displayName}! Here's your overview.</p>
            </header>

            <main className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2 space-y-6">
                    {/* Overview Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Completed Today</CardTitle>
                                <Check className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{completedToday}</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Remaining Today</CardTitle>
                                <Clock className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{remainingInspections}</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Wallet Balance</CardTitle>
                                <Wallet className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{formatCurrency(wallet?.balance)}</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
                                <IndianRupee className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{formatCurrency(wallet?.totalEarned)}</div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Daily Limit Indicator */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Daily Inspection Limit</CardTitle>
                            <CardDescription>
                                You can complete up to {dailyLimit} inspections per day.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Progress value={(completedToday / dailyLimit) * 100} className="mb-2" />
                            <p className="text-sm text-muted-foreground">
                                {completedToday} of {dailyLimit} inspections completed.
                            </p>
                            {isLimitReached ? (
                                <Button className="mt-4 w-full md:w-auto" disabled>
                                    <Ban className="mr-2"/> Limit Reached
                                </Button>
                            ) : (
                                <Button asChild className="mt-4 w-full md:w-auto">
                                    <Link href="/valuation">
                                        <Car className="mr-2"/> Create New Valuation
                                    </Link>
                                </Button>
                            )}
                        </CardContent>
                    </Card>

                    {/* Withdrawal History */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Withdrawal History</CardTitle>
                            <CardDescription>Your recent withdrawal requests and their status.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Amount</TableHead>
                                        <TableHead className="text-right">Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {withdrawalsError ? (
                                        <TableRow>
                                            <TableCell colSpan={3} className="h-24 text-center text-sm text-muted-foreground">
                                                Could not load withdrawal history due to a permissions error.
                                            </TableCell>
                                        </TableRow>
                                    ) : areWithdrawalsLoading ? (
                                        <TableRow>
                                            <TableCell colSpan={3} className="h-24 text-center">
                                                <Skeleton className="h-5 w-full" />
                                            </TableCell>
                                        </TableRow>
                                    ) : withdrawals && withdrawals.length > 0 ? (
                                        withdrawals.map((item) => (
                                            <TableRow key={item.id}>
                                                <TableCell>{formatDateOnly(item.requestedAt)}</TableCell>
                                                <TableCell className="font-medium">{formatCurrency(item.amount)}</TableCell>
                                                <TableCell className="text-right">
                                                    <Badge 
                                                        variant={item.status === 'paid' ? 'default' : item.status === 'rejected' ? 'destructive' : 'secondary'}
                                                    >
                                                        {item.status}
                                                    </Badge>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={3} className="h-24 text-center text-sm text-muted-foreground">
                                                No withdrawal history found.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6">
                    {/* Wallet & Earnings */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Wallet & Earnings</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-muted-foreground">Earnings per Report</span>
                                <span className="font-semibold">{formatCurrency(earningsPerReport)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-muted-foreground">Today's Earnings</span>
                                <span className="font-semibold">{formatCurrency(dailyEarnings)}</span>
                            </div>
                             <div className="flex justify-between items-center">
                                <span className="text-muted-foreground">This Week's Earnings</span>
                                <span className="font-semibold">{formatCurrency(weeklyEarnings)}</span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Withdrawal Section */}
                     <Card>
                        <CardHeader>
                            <CardTitle>Withdraw Funds</CardTitle>
                            <CardDescription>Withdrawals are processed once per week.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <WithdrawalDialog wallet={wallet} userProfile={userProfile} isWithdrawalEnabled={isWithdrawalEnabled}/>
                            <p className="text-xs text-muted-foreground mt-3 text-center">
                                Minimum withdrawal amount: {formatCurrency(minWithdrawalAmount)}.
                            </p>
                            <p className="text-xs text-muted-foreground mt-1 text-center">
                                Last withdrawal status: {lastWithdrawalStatus}.
                            </p>
                             {!!lastPendingRequest && <p className="text-xs text-primary mt-2 text-center">Your request is being processed. It will be credited to your account within 24-48 hours.</p>}
                        </CardContent>
                    </Card>
                    
                </div>
            </main>
        </div>
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

    const { data: rawValuations, isLoading, error } = useCollection<Omit<ValuationDoc, 'createdAt'> & { createdAt: any }>(valuationsQuery);
    const valuations = useMemo(() => {
        if (!rawValuations) return null;
        return rawValuations.map(v => ({ ...v, createdAt: toDate(v.createdAt) }));
    }, [rawValuations]);

    const filteredValuations = useMemo(() => {
        if (!valuations) return [];
        if (!valuationDateRange?.from) return valuations;
    
        const from = valuationDateRange.from;
        const to = valuationDateRange.to ? new Date(valuationDateRange.to) : new Date(from);
        to.setHours(23, 59, 59, 999);
    
        return valuations.filter(valuation => {
          const valuationDate = valuation.createdAt;
          if (valuationDate) {
            return valuationDate >= from && valuationDate <= to;
          }
          return false;
        });
    }, [valuations, valuationDateRange]);


    const formatDataForDisplay = (doc: ValuationDoc | null) => {
        if (!doc) return null;
        const { valuationResult, ...formData } = doc;
        return { valuation: valuationResult, formData };
    };
    
    const handleDelete = async () => {
        if (!firestore || !user || !selectedValuation) {
            toast({ variant: "destructive", title: "Error", description: "Could not delete the valuation." });
            return;
        }

        try {
            await deleteValuation(firestore, user, selectedValuation.id);
            toast({ title: "Success", description: "Valuation report deleted." });
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: "Failed to delete the report." });
        } finally {
            setIsDeleteAlertOpen(false);
            setSelectedValuation(null);
        }
    };


    return (
        <div className="container mx-auto py-8 px-4 md:px-6">
            <header className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                <p className="text-muted-foreground">Welcome back, {userProfile.displayName}! Here are your valuation reports.</p>
            </header>
            
            <Card>
                <CardHeader className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div>
                        <CardTitle>My Valuation Reports</CardTitle>
                        <CardDescription>View, filter, and manage your past reports.</CardDescription>
                    </div>
                     <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                id="date"
                                variant={"outline"}
                                className={cn(
                                    "w-full sm:w-auto sm:min-w-[260px] justify-start text-left font-normal",
                                    !valuationDateRange && "text-muted-foreground"
                                )}
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {valuationDateRange?.from ? (
                                    valuationDateRange.to ? (
                                        <>
                                            {format(valuationDateRange.from, "LLL dd, y")} -{" "}
                                            {format(valuationDateRange.to, "LLL dd, y")}
                                        </>
                                    ) : (
                                        format(valuationDateRange.from, "LLL dd, y")
                                    )
                                ) : (
                                    <span>Pick a date range</span>
                                )}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="end">
                            <Calendar
                                initialFocus
                                mode="range"
                                defaultMonth={valuationDateRange?.from}
                                selected={valuationDateRange}
                                onSelect={setValuationDateRange}
                                numberOfMonths={2}
                            />
                        </PopoverContent>
                    </Popover>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead><Car className="inline-block mr-2"/>Car</TableHead>
                                <TableHead>Vehicle Number</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading && (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-24 text-center">
                                        <Skeleton className="w-full h-8" />
                                    </TableCell>
                                </TableRow>
                            )}
                            {error && (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-24 text-center text-destructive">
                                        An error occurred while loading your reports. Please try again later.
                                    </TableCell>
                                </TableRow>
                            )}
                            {!isLoading && !error && filteredValuations && filteredValuations.length > 0 ? (
                                filteredValuations.map((valuation) => (
                                    <TableRow key={valuation.id}>
                                        <TableCell className="font-medium">{valuation.make} {valuation.model}</TableCell>
                                        <TableCell className="text-muted-foreground font-mono uppercase">{valuation.vehicleNumber || 'N/A'}</TableCell>
                                        <TableCell>{formatDateOnly(valuation.createdAt)}</TableCell>
                                        <TableCell className="text-right space-x-2">
                                            <Button variant="outline" size="sm" onClick={() => { setSelectedValuation(valuation); setIsViewReportOpen(true); }}>
                                                <Eye className="mr-2 h-4 w-4"/> View / Download
                                            </Button>
                                            <Button variant="destructive" size="sm" onClick={() => { setSelectedValuation(valuation); setIsDeleteAlertOpen(true); }}>
                                                <Trash2 className="mr-2 h-4 w-4"/> Delete
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                !isLoading && !error && (
                                    <TableRow>
                                        <TableCell colSpan={4} className="h-24 text-center">
                                            No valuation reports found for the selected period.
                                            <Button asChild variant="link"><Link href="/valuation">Create a new one</Link></Button>
                                        </TableCell>
                                    </TableRow>
                                )
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* View Report Dialog */}
            <Dialog open={isViewReportOpen} onOpenChange={setIsViewReportOpen}>
                <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Valuation Report</DialogTitle>
                        <DialogDescription>
                            Report for {selectedValuation?.make} {selectedValuation?.model}. You can download this report as a PDF.
                        </DialogDescription>
                    </DialogHeader>
                    {selectedValuation && (
                        <ValuationResultDisplay 
                            result={formatDataForDisplay(selectedValuation)!} 
                            onNewValuation={() => setIsViewReportOpen(false)}
                        />
                    )}
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the valuation report for the {selectedValuation?.make} {selectedValuation?.model}.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}


function DashboardSkeleton() {
    return (
        <div className="container mx-auto py-8 px-4 md:px-6">
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-5 w-80 mb-8" />
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2 space-y-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <Skeleton className="h-24" />
                        <Skeleton className="h-24" />
                        <Skeleton className="h-24" />
                        <Skeleton className="h-24" />
                    </div>
                    <Skeleton className="h-48" />
                    <Skeleton className="h-64" />
                </div>
                <div className="space-y-6">
                    <Skeleton className="h-48" />
                    <Skeleton className="h-40" />
                </div>
            </div>
        </div>
    );
}

function DashboardPageComponent() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();

  const userProfileRef = useMemo(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);

  const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userProfileRef);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login?redirect=/dashboard');
    }
  }, [user, isUserLoading, router]);

  useEffect(() => {
    // This effect handles redirecting admin users.
    // It runs after the component renders and when its dependencies change.
    if (!isUserLoading && user) {
      // Immediate check for hardcoded admin email
      if (user.email === 'rajmycarvalue@gmail.com') {
        router.push('/admin');
        return; // Early exit for the primary admin
      }
      // If not the hardcoded admin, check the role after the profile has loaded
      if (!isProfileLoading && userProfile?.role === 'Admin') {
        router.push('/admin');
      }
    }
  }, [user, isUserLoading, userProfile, isProfileLoading, router]);

  if (isUserLoading || !user || isProfileLoading) {
    return <DashboardSkeleton />;
  }
  
  // Admin users are being redirected by the useEffect. In the meantime, show a skeleton.
  // This check is robust because `userProfile?.role` safely handles a null profile.
  if (userProfile?.role === 'Admin' || user.email === 'rajmycarvalue@gmail.com') {
      return <DashboardSkeleton />;
  }
  
  // If we reach here, the user is not an admin.
  // Now we can safely assume they need a profile to see their specific dashboard.
  if (!userProfile) {
    // This can happen briefly if the user profile is still loading
    // or if the profile document doesn't exist yet for a new user.
    // Showing the skeleton is a safe default.
    return <DashboardSkeleton />;
  }

  if (userProfile.role === 'Mechanic') {
    return <MechanicDashboard user={user} userProfile={userProfile} />;
  }

  if (userProfile.role === 'Owner' || userProfile.role === 'Agent') {
    return <AgentOwnerDashboard user={user} userProfile={userProfile} />;
  }

  return (
    <div className="container mx-auto py-12 text-center">
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          An invalid user role was detected. Please contact support.
        </AlertDescription>
      </Alert>
    </div>
  );
}

export default function DashboardPage() {
    return (
        <Suspense fallback={<DashboardSkeleton />}>
            <DashboardPageComponent />
        </Suspense>
    );
}

    
