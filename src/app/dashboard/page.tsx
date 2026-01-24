
'use client';

import { Suspense, useEffect, useState, useMemo } from 'react';
import { doc, collection, query, orderBy, limit, where, Timestamp } from 'firebase/firestore';
import { useUser, useFirestore, useDoc, useCollection, useMemoFirebase } from '@/firebase';
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


import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Wallet, ArrowDown, Ban, Check, Clock, IndianRupee, Info, AlertTriangle, Car, Trash2, Eye } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";


interface Wallet {
    id: string;
    userId: string;
    balance: number;
    totalEarned: number;
    lastWithdrawalDate: Timestamp | null;
}

interface WithdrawalRequest {
    id: string;
    userId: string;
    amount: number;
    upiId?: string;
    bankAccountNumber?: string;
    bankIfscCode?: string;
    status: 'requested' | 'paid' | 'rejected';
    requestedAt: Timestamp;
    processedAt?: Timestamp;
    rejectionReason?: string;
    transactionId?: string;
}

// Represents a valuation document from Firestore, including its ID
type ValuationDoc = CarValuationFormInput & { 
    id: string;
    createdAt: Timestamp;
    valuationResult: any; 
};


const WithdrawalSchema = z.object({
  amount: z.coerce.number().min(100, { message: "Minimum withdrawal is ₹100." }),
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

const formatCurrency = (value: number | undefined) => {
    if (value === undefined) return '...';
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0,
    }).format(value);
};

const formatDate = (timestamp: Timestamp | null | undefined) => {
    if (!timestamp) return 'N/A';
    return timestamp.toDate().toLocaleDateString('en-GB', {
        day: '2-digit', month: 'short', year: 'numeric'
    });
}

function WithdrawalDialog({ wallet, userProfile, isWithdrawalEnabled }: { wallet: Wallet | null, userProfile: UserProfile, isWithdrawalEnabled: boolean }) {
    const [open, setOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const firestore = useFirestore();
    const { user } = useUser();
    const { toast } = useToast();

    const form = useForm<WithdrawalFormInput>({
        resolver: zodResolver(WithdrawalSchema),
        defaultValues: {
            amount: 100,
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
                        Enter amount and payment details. Payments are processed manually.
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
                              <Input type="number" placeholder="100" {...field} />
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

    // -- Data Fetching --
    const walletQuery = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return collection(firestore, 'users', user.uid, 'wallet');
    }, [firestore, user]);
    const { data: walletData, isLoading: isWalletLoading } = useCollection<Wallet>(walletQuery);
    const wallet = walletData?.[0];

    const withdrawalsQuery = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return query(
            collection(firestore, 'withdrawalRequests'), 
            where('userId', '==', user.uid),
            orderBy('requestedAt', 'desc'), 
            limit(10)
        );
    }, [firestore, user]);
    const { data: withdrawals, isLoading: areWithdrawalsLoading } = useCollection<WithdrawalRequest>(withdrawalsQuery);
    
    // -- Hardcoded Data & Business Logic --
    // TODO: Fetch this from a backend configuration in a real app
    const inspections = { completed: 2, total: 5 };
    const earningsPerReport = 15;
    const minWithdrawalAmount = 100;
    
    const remainingInspections = inspections.total - inspections.completed;
    const isLimitReached = remainingInspections <= 0;

    const lastPendingRequest = useMemo(() => withdrawals?.find(w => w.status === 'requested'), [withdrawals]);
    const lastWithdrawalDate = wallet?.lastWithdrawalDate;
    const canWithdrawToday = useMemo(() => {
        if (!lastWithdrawalDate) return true; // No previous withdrawal
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        return lastWithdrawalDate.toDate() < sevenDaysAgo;
    }, [lastWithdrawalDate]);
    
    const isWithdrawalEnabled = !isWalletLoading && !!wallet && wallet.balance >= minWithdrawalAmount && !lastPendingRequest && canWithdrawToday;
    const lastWithdrawalStatus = lastPendingRequest 
        ? `Requested on ${formatDate(lastPendingRequest.requestedAt)}` 
        : (wallet?.lastWithdrawalDate ? `Paid on ${formatDate(wallet.lastWithdrawalDate)}` : 'No recent withdrawals');
    
    const dailyEarnings = inspections.completed * earningsPerReport;
    const weeklyEarnings = dailyEarnings * 7; // This is a placeholder calculation

    const isLoading = isWalletLoading || areWithdrawalsLoading;
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
                                <div className="text-2xl font-bold">{inspections.completed}</div>
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
                                You can complete up to {inspections.total} inspections per day.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Progress value={(inspections.completed / inspections.total) * 100} className="mb-2" />
                            <p className="text-sm text-muted-foreground">
                                {inspections.completed} of {inspections.total} inspections completed.
                            </p>
                            <Button className="mt-4 w-full md:w-auto" disabled={isLimitReached}>
                                {isLimitReached ? <><Ban className="mr-2"/> Limit Reached</> : 'Accept New Inspection'}
                            </Button>
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
                                    {withdrawals && withdrawals.length > 0 ? withdrawals.map((item) => (
                                        <TableRow key={item.id}>
                                            <TableCell>{formatDate(item.requestedAt)}</TableCell>
                                            <TableCell className="font-medium">{formatCurrency(item.amount)}</TableCell>
                                            <TableCell className="text-right">
                                                <Badge 
                                                    variant={item.status === 'paid' ? 'default' : item.status === 'rejected' ? 'destructive' : 'secondary'} 
                                                    className={item.status === 'paid' ? 'bg-green-600 hover:bg-green-700' : ''}
                                                >
                                                    {item.status}
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    )) : (
                                        <TableRow>
                                            <TableCell colSpan={3} className="text-center">No withdrawal history found.</TableCell>
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
                             {!canWithdrawToday && <p className="text-xs text-amber-600 mt-2 text-center">You can make another withdrawal request in {7 - new Date().getDay()} days.</p>}
                             {!!lastPendingRequest && <p className="text-xs text-amber-600 mt-2 text-center">You have a pending withdrawal request.</p>}
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

    const valuationsQuery = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return query(collection(firestore, 'users', user.uid, 'carValuations'), orderBy('createdAt', 'desc'));
    }, [firestore, user]);

    const { data: valuations, isLoading } = useCollection<ValuationDoc>(valuationsQuery);

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
                <CardHeader>
                    <CardTitle>My Valuation Reports</CardTitle>
                    <CardDescription>View, download, or delete your past reports.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead><Car className="inline-block mr-2"/>Car</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading && (
                                <TableRow>
                                    <TableCell colSpan={3} className="h-24 text-center">
                                        <Skeleton className="w-full h-8" />
                                    </TableCell>
                                </TableRow>
                            )}
                            {!isLoading && valuations && valuations.length > 0 ? (
                                valuations.map((valuation) => (
                                    <TableRow key={valuation.id}>
                                        <TableCell className="font-medium">{valuation.make} {valuation.model}</TableCell>
                                        <TableCell>{formatDate(valuation.createdAt)}</TableCell>
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
                                !isLoading && (
                                    <TableRow>
                                        <TableCell colSpan={3} className="h-24 text-center">
                                            No valuation reports found.
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

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login?redirect=/dashboard');
    }
  }, [user, isUserLoading, router]);

  const userProfileRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);

  const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userProfileRef);

  useEffect(() => {
    // This effect handles redirecting admin users.
    // It runs after the component renders and when its dependencies change.
    if (!isUserLoading && user) {
      const isHardcodedAdmin = user.email === 'rajmycarvalue@gmail.com';
      // The check for role happens only after the profile is loaded.
      const isRoleAdmin = !isProfileLoading && userProfile?.role === 'Admin';
      
      if (isHardcodedAdmin || isRoleAdmin) {
        router.push('/admin');
      }
    }
  }, [user, isUserLoading, userProfile, isProfileLoading, router]);

  if (isUserLoading || !user || isProfileLoading) {
    return <DashboardSkeleton />;
  }
  
  // Admin users are being redirected by the useEffect. In the meantime, show a skeleton.
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
