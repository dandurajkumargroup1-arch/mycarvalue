
'use client';

import { Suspense, useEffect, useState, useMemo } from 'react';
import { doc, collection, query, orderBy, limit, where, Timestamp } from 'firebase/firestore';
import { useUser, useFirestore, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import type { UserProfile } from '@/lib/firebase/user-profile-service';
import { requestWithdrawal } from '@/lib/firebase/withdrawal-service';
import { upsertUserProfile } from '@/lib/firebase/user-profile-service';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Wallet, ArrowDown, Ban, Check, Clock, DollarSign, Info, AlertTriangle, Banknote } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
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
    upiId: string;
    status: 'requested' | 'paid' | 'rejected';
    requestedAt: Timestamp;
    processedAt?: Timestamp;
    rejectionReason?: string;
    transactionId?: string;
}

const WithdrawalSchema = z.object({
  amount: z.coerce.number().min(100, { message: "Minimum withdrawal is ₹100." }),
  upiId: z.string().min(3, { message: "UPI ID is required." }),
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
            upiId: userProfile?.upiId || '',
        },
    });
    
    useEffect(() => {
        if(userProfile?.upiId) {
            form.setValue('upiId', userProfile.upiId);
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
            await requestWithdrawal(firestore, user, data.amount, data.upiId);

            // Save UPI ID for next time
            if (data.upiId !== userProfile.upiId) {
                await upsertUserProfile(firestore, user, { upiId: data.upiId });
            }
            
            toast({
                title: "Withdrawal Requested",
                description: "Your request has been submitted and will be processed within 2-3 working days.",
            });
            setOpen(false);

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
                        Enter the amount you wish to withdraw. Payments are processed manually via UPI/Bank Transfer.
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
                        name="upiId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>UPI ID or Bank Details</FormLabel>
                            <FormControl>
                              <Input placeholder="your-upi@oksbi" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
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
    const { toast } = useToast();

    // -- Data Fetching --
    const walletQuery = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return collection(firestore, 'users', user.uid, 'wallet');
    }, [firestore, user]);
    const { data: walletData, isLoading: isWalletLoading } = useCollection<Wallet>(walletQuery);
    const wallet = walletData?.[0]; // Assume one wallet per user

    const withdrawalsQuery = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return query(collection(firestore, 'users', user.uid, 'withdrawalRequests'), orderBy('requestedAt', 'desc'), limit(10));
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
        : `Paid on ${formatDate(wallet?.lastWithdrawalDate)}`;
    
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
                                <DollarSign className="h-4 w-4 text-muted-foreground" />
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

  if (isUserLoading || isProfileLoading) {
      return <DashboardSkeleton />;
  }

  if (!user || !userProfile) {
      return null; // Redirect is handled by useEffect
  }

  if (userProfile.role === 'Mechanic') {
      return <MechanicDashboard user={user} userProfile={userProfile} />;
  }

  if (userProfile.role === 'Owner' || userProfile.role === 'Agent') {
      return (
        <div className="container mx-auto flex min-h-[60vh] items-center justify-center py-12">
            <Card className="w-full max-w-md text-center shadow-lg">
                <CardHeader>
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-4">
                        <Info className="h-8 w-8 text-primary" />
                    </div>
                    <CardTitle>Welcome, {userProfile.displayName || 'User'}</CardTitle>
                    <CardDescription>
                        Your personal dashboard is under construction. For now, you can get a new car valuation.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Button asChild>
                        <Link href="/valuation">Go to Valuation</Link>
                    </Button>
                </CardContent>
            </Card>
        </div>
      );
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
