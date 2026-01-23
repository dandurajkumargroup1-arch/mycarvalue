
'use client';

import { Suspense, useEffect, useState, useMemo } from 'react';
import { doc, collection, query, orderBy, where, Timestamp } from 'firebase/firestore';
import { useUser, useFirestore, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import type { UserProfile } from '@/lib/firebase/user-profile-service';
import { approveWithdrawal, rejectWithdrawal } from '@/lib/firebase/withdrawal-service';
import { useRouter } from 'next/navigation';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from 'zod';
import { useToast } from "@/hooks/use-toast";

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle, CheckCircle, Shield, Users, Wallet, XCircle } from 'lucide-react';


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

const formatCurrency = (value: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(value);
const formatDate = (timestamp: Timestamp) => timestamp.toDate().toLocaleString('en-GB');

// --- Dialog Components ---

const ApproveDialogSchema = z.object({
  transactionId: z.string().min(5, { message: "Transaction ID is required." }),
});
type ApproveFormInput = z.infer<typeof ApproveDialogSchema>;

function ApproveDialog({ request, onApproved }: { request: WithdrawalRequest, onApproved: () => void }) {
    const [open, setOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const firestore = useFirestore();
    const { toast } = useToast();

    const form = useForm<ApproveFormInput>({ resolver: zodResolver(ApproveDialogSchema), defaultValues: { transactionId: '' }});

    const handleApprove = async (data: ApproveFormInput) => {
        if (!firestore) return;
        setIsSubmitting(true);
        try {
            await approveWithdrawal(firestore, request.id, data.transactionId);
            toast({ title: "Success", description: "Withdrawal marked as paid." });
            onApproved();
            setOpen(false);
        } catch (error) {
            console.error(error);
            toast({ variant: 'destructive', title: "Error", description: "Failed to approve withdrawal." });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm" variant="outline" className="text-green-600 border-green-600 hover:bg-green-50 hover:text-green-700">Approve</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Approve Withdrawal</DialogTitle>
                    <DialogDescription>Enter the transaction ID after making the manual payment.</DialogDescription>
                </DialogHeader>
                 <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleApprove)} className="space-y-4">
                        <FormField control={form.control} name="transactionId" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Transaction/UTR ID</FormLabel>
                                <FormControl><Input placeholder="Enter payment reference ID" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <DialogFooter>
                            <DialogClose asChild><Button type="button" variant="secondary" disabled={isSubmitting}>Cancel</Button></DialogClose>
                            <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Approving...' : 'Confirm Approval'}</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}

const RejectDialogSchema = z.object({
  rejectionReason: z.string().min(10, { message: "A brief reason for rejection is required." }),
});
type RejectFormInput = z.infer<typeof RejectDialogSchema>;

function RejectDialog({ request, onRejected }: { request: WithdrawalRequest, onRejected: () => void }) {
    const [open, setOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const firestore = useFirestore();
    const { toast } = useToast();

    const form = useForm<RejectFormInput>({ resolver: zodResolver(RejectDialogSchema), defaultValues: { rejectionReason: '' }});

    const handleReject = async (data: RejectFormInput) => {
        if (!firestore) return;
        setIsSubmitting(true);
        try {
            await rejectWithdrawal(firestore, request.id, data.rejectionReason);
            toast({ title: "Success", description: "Withdrawal has been rejected." });
            onRejected();
            setOpen(false);
        } catch (error) {
             console.error(error);
            toast({ variant: 'destructive', title: "Error", description: "Failed to reject withdrawal." });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm" variant="destructive">Reject</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Reject Withdrawal</DialogTitle>
                    <DialogDescription>Provide a reason for rejecting this request.</DialogDescription>
                </DialogHeader>
                 <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleReject)} className="space-y-4">
                        <FormField control={form.control} name="rejectionReason" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Reason for Rejection</FormLabel>
                                <FormControl><Input placeholder="e.g., Invalid UPI ID" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <DialogFooter>
                            <DialogClose asChild><Button type="button" variant="secondary" disabled={isSubmitting}>Cancel</Button></DialogClose>
                            <Button type="submit" variant="destructive" disabled={isSubmitting}>{isSubmitting ? 'Rejecting...' : 'Confirm Rejection'}</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}

// --- Main Dashboard Component ---

function AdminDashboard() {
  const firestore = useFirestore();
  const { toast } = useToast();
  
  // Fetch all users to create a name map
  const usersQuery = useMemoFirebase(() => firestore ? collection(firestore, 'users') : null, [firestore]);
  const { data: usersData, isLoading: isUsersLoading } = useCollection<UserProfile>(usersQuery);
  const userMap = useMemo(() => usersData?.reduce((acc, user) => ({ ...acc, [user.id]: user }), {} as Record<string, UserProfile>) || {}, [usersData]);

  // Fetch pending withdrawal requests
  const requestsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'withdrawalRequests'), where('status', '==', 'requested'), orderBy('requestedAt', 'asc'));
  }, [firestore]);
  const { data: requests, isLoading: isRequestsLoading, error: requestsError } = useCollection<WithdrawalRequest>(requestsQuery);

  const [refreshKey, setRefreshKey] = useState(0);
  const forceRefresh = () => setRefreshKey(k => k + 1);

  if (requestsError) {
      toast({variant: 'destructive', title: 'Error', description: 'Could not load withdrawal requests. Check security rules.'});
  }

  const isLoading = isUsersLoading || isRequestsLoading;

  const recentUsers = useMemo(() => {
    return usersData
        ?.filter(u => u.role === 'Mechanic' || u.role === 'Agent')
        .sort((a, b) => (b.createdAt as any)?.toMillis() - (a.createdAt as any)?.toMillis())
        .slice(0, 5) || [];
  }, [usersData]);

  return (
    <div className="container mx-auto py-8 px-4 md:px-6 bg-background">
        <header className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
            <p className="text-muted-foreground">Manage withdrawals and view user activity.</p>
        </header>

        <main className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Wallet/> Pending Withdrawal Requests</CardTitle>
                        <CardDescription>Review and process manual payment requests from mechanics.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Mechanic</TableHead>
                                    <TableHead>Amount</TableHead>
                                    <TableHead>Payment Details</TableHead>
                                    <TableHead>Requested At</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow><TableCell colSpan={5}><Skeleton className="h-8 w-full" /></TableCell></TableRow>
                                ) : requests && requests.length > 0 ? (
                                    requests.map(req => (
                                        <TableRow key={req.id}>
                                            <TableCell className="font-medium">{userMap[req.userId]?.displayName || 'Unknown User'}</TableCell>
                                            <TableCell>{formatCurrency(req.amount)}</TableCell>
                                            <TableCell className="text-xs">
                                                {req.upiId && <p><strong>UPI:</strong> {req.upiId}</p>}
                                                {req.bankAccountNumber && <p><strong>Acct:</strong> {req.bankAccountNumber}</p>}
                                                {req.bankIfscCode && <p><strong>IFSC:</strong> {req.bankIfscCode}</p>}
                                            </TableCell>
                                            <TableCell>{formatDate(req.requestedAt)}</TableCell>
                                            <TableCell className="text-right space-x-2">
                                                <ApproveDialog request={req} onApproved={forceRefresh} />
                                                <RejectDialog request={req} onRejected={forceRefresh} />
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-24 text-center">
                                            <CheckCircle className="mx-auto h-8 w-8 text-green-500 mb-2"/>
                                            No pending requests. All caught up!
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
            <div>
                 <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Users/> Recent Users</CardTitle>
                        <CardDescription>Newest mechanics and agents.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? <Skeleton className="h-40 w-full" /> : (
                            <div className="space-y-4">
                                {recentUsers.map(user => (
                                    <div key={user.id} className="flex items-center justify-between">
                                        <div>
                                            <p className="font-medium">{user.displayName}</p>
                                            <p className="text-sm text-muted-foreground">{user.shopName} - {user.location}</p>
                                        </div>
                                        <Badge variant={user.role === 'Mechanic' ? 'secondary' : 'outline'}>{user.role}</Badge>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                 </Card>
            </div>
        </main>
    </div>
  );
}


// --- Page Loader and Auth Guard ---

function AdminPageLoader() {
    return (
        <div className="container mx-auto py-8">
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-5 w-80 mb-8" />
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                <div className="lg:col-span-2"><Skeleton className="h-64" /></div>
                <div><Skeleton className="h-48" /></div>
            </div>
        </div>
    );
}

function AdminPageComponent() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();

  const userProfileRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);

  const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userProfileRef);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login?redirect=/admin');
    }
  }, [user, isUserLoading, router]);

  if (isUserLoading || !user || isProfileLoading) {
    return <AdminPageLoader />;
  }

  if (userProfile?.role !== 'Admin') {
    return (
      <div className="container mx-auto flex items-center justify-center py-20">
        <Alert variant="destructive" className="max-w-lg">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Access Denied</AlertTitle>
            <AlertDescription>
                You do not have permission to view this page. This area is for administrators only.
            </AlertDescription>
        </Alert>
      </div>
    );
  }

  return <AdminDashboard />;
}

export default function AdminPage() {
    return (
        <Suspense fallback={<AdminPageLoader />}>
            <AdminPageComponent />
        </Suspense>
    );
}

    