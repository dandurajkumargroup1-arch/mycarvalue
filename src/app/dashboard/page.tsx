
'use client';

import { Suspense, useEffect } from 'react';
import { doc } from 'firebase/firestore';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import type { UserProfile } from '@/lib/firebase/user-profile-service';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Wallet, ArrowDown, Ban, Check, Clock, DollarSign, Info, AlertTriangle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';


const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0,
    }).format(value);
};

// Placeholder data for the mechanic dashboard
const mechanicData = {
  todayInspections: {
    completed: 2,
    total: 5,
  },
  wallet: {
    balance: 1250.75,
    totalEarnings: 15230.50,
    lastWithdrawalStatus: 'Paid on 15th July',
    earningsPerReport: 15,
  },
  reports: {
    totalCompleted: 1015,
  },
  earnings: {
    daily: 30,
    weekly: 450,
  },
  withdrawal: {
    minAmount: 100,
    isWithdrawalEnabled: true, // This would be based on weekly logic
    history: [
      { date: '2024-07-22', amount: 2500, status: 'Requested' },
      { date: '2024-07-15', amount: 2000, status: 'Paid' },
      { date: '2024-07-08', amount: 1500, status: 'Paid' },
      { date: '2024-07-01', amount: 1800, status: 'Paid' },
    ],
  },
};


function MechanicDashboard() {
    const remainingInspections = mechanicData.todayInspections.total - mechanicData.todayInspections.completed;
    const isLimitReached = remainingInspections <= 0;

    return (
        <div className="container mx-auto py-8 px-4 md:px-6 bg-background">
            <header className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight">Mechanic Dashboard</h1>
                <p className="text-muted-foreground">Welcome back! Here's your overview for today.</p>
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
                                <div className="text-2xl font-bold">{mechanicData.todayInspections.completed}</div>
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
                                <div className="text-2xl font-bold">{formatCurrency(mechanicData.wallet.balance)}</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
                                <DollarSign className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{formatCurrency(mechanicData.wallet.totalEarnings)}</div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Daily Limit Indicator */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Daily Inspection Limit</CardTitle>
                            <CardDescription>
                                You can complete up to {mechanicData.todayInspections.total} inspections per day.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Progress value={(mechanicData.todayInspections.completed / mechanicData.todayInspections.total) * 100} className="mb-2" />
                            <p className="text-sm text-muted-foreground">
                                {mechanicData.todayInspections.completed} of {mechanicData.todayInspections.total} inspections completed.
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
                                    {mechanicData.withdrawal.history.map((item, index) => (
                                        <TableRow key={index}>
                                            <TableCell>{item.date}</TableCell>
                                            <TableCell className="font-medium">{formatCurrency(item.amount)}</TableCell>
                                            <TableCell className="text-right">
                                                <Badge variant={item.status === 'Paid' ? 'default' : 'secondary'} className={item.status === 'Paid' ? 'bg-green-600 hover:bg-green-700' : ''}>{item.status}</Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))}
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
                                <span className="font-semibold">{formatCurrency(mechanicData.wallet.earningsPerReport)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-muted-foreground">Total Reports Completed</span>
                                <span className="font-semibold">{mechanicData.reports.totalCompleted}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-muted-foreground">Today's Earnings</span>
                                <span className="font-semibold">{formatCurrency(mechanicData.earnings.daily)}</span>
                            </div>
                             <div className="flex justify-between items-center">
                                <span className="text-muted-foreground">This Week's Earnings</span>
                                <span className="font-semibold">{formatCurrency(mechanicData.earnings.weekly)}</span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Withdrawal Section */}
                     <Card>
                        <CardHeader>
                            <CardTitle>Withdraw Funds</CardTitle>
                            <CardDescription>Withdrawals are processed weekly.</CardDescription>
                        </CardHeader>
                        <CardContent>
                             <Button className="w-full" disabled={!mechanicData.withdrawal.isWithdrawalEnabled}>
                                <ArrowDown className="mr-2" /> Withdraw Balance
                            </Button>
                            <p className="text-xs text-muted-foreground mt-3 text-center">
                                Minimum withdrawal amount: {formatCurrency(mechanicData.withdrawal.minAmount)}.
                            </p>
                            <p className="text-xs text-muted-foreground mt-1 text-center">
                                Last withdrawal status: {mechanicData.wallet.lastWithdrawalStatus}.
                            </p>
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
      return <MechanicDashboard />;
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
