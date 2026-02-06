'use client';

import { Suspense, useEffect, useState, useMemo } from 'react';
import { doc, collection, query, orderBy, where, Timestamp, collectionGroup, type FieldValue } from 'firebase/firestore';
import { useUser, useFirestore, useDoc, useCollection } from '@/firebase';
import type { UserProfile } from '@/lib/firebase/user-profile-service';
import { approveWithdrawal, rejectWithdrawal } from '@/lib/firebase/withdrawal-service';
import { deleteUser } from '@/lib/firebase/user-profile-service';
import { useRouter } from 'next/navigation';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from 'zod';
import { useToast } from "@/hooks/use-toast";
import { DateRange } from "react-day-picker";
import { format } from "date-fns";
import { cn, toDate, formatCurrency, formatDateTime } from "@/lib/utils";
import Papa from 'papaparse';


import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle, CheckCircle, Shield, Users, Wallet, XCircle, Calendar as CalendarIcon, Download, Trash2 } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';


interface WithdrawalRequest {
    id: string;
    userId: string;
    amount: number;
    upiId?: string;
    bankAccountNumber?: string;
    bankIfscCode?: string;
    status: 'requested' | 'paid' | 'rejected';
    requestedAt: Timestamp | FieldValue;
    processedAt?: Timestamp | FieldValue;
    rejectionReason?: string;
    transactionId?: string;
}

// --- Dialog Components ---

const ApproveDialogSchema = z.object({
  transactionId: z.string().min(5, { message: "Transaction ID is required." }),
});
type ApproveFormInput = z.infer<typeof ApproveDialogSchema>;

function ApproveDialog({ request }: { request: WithdrawalRequest }) {
    const [open, setOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const firestore = useFirestore();
    const { toast } = useToast();

    const form = useForm<ApproveFormInput>({ resolver: zodResolver(ApproveDialogSchema), defaultValues: { transactionId: '' }});

    const handleApprove = async (data: ApproveFormInput) => {
        if (!firestore) return;
        setIsSubmitting(true);
        try {
            await approveWithdrawal(firestore, request.userId, request.id, data.transactionId);
            toast({ title: "Success", description: "Withdrawal marked as paid." });
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
                <Button size="sm" variant="secondary">Approve</Button>
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

function RejectDialog({ request }: { request: WithdrawalRequest }) {
    const [open, setOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const firestore = useFirestore();
    const { toast } = useToast();

    const form = useForm<RejectFormInput>({ resolver: zodResolver(RejectDialogSchema), defaultValues: { rejectionReason: '' }});

    const handleReject = async (data: RejectFormInput) => {
        if (!firestore) return;
        setIsSubmitting(true);
        try {
            await rejectWithdrawal(firestore, request.userId, request.id, data.rejectionReason);
            toast({ title: "Success", description: "Withdrawal has been rejected." });
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
  const [usersDateRange, setUsersDateRange] = useState<DateRange | undefined>();
  const [withdrawalDateRange, setWithdrawalDateRange] = useState<DateRange | undefined>();
  const [roleFilter, setRoleFilter] = useState<string>('All');
  
  // Fetch all users to create a name map
  const usersQuery = useMemo(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'users'));
  }, [firestore]);

  const { data: allUsersData, isLoading: isUsersLoading } = useCollection<UserProfile>(usersQuery);

  const filteredUsers = useMemo(() => {
    if (!allUsersData) return [];

    // Always filter out Admins first
    let data = allUsersData.filter(user => user.role !== 'Admin');

    // Then filter by the selected role
    if (roleFilter !== 'All') {
      data = data.filter(user => user.role === roleFilter);
    }
    
    // Then filter by date
    if (usersDateRange?.from) {
      const from = usersDateRange.from;
      const to = usersDateRange.to ? new Date(usersDateRange.to) : new Date(from);
      to.setHours(23, 59, 59, 999);

      data = data.filter(user => {
        const userDate = toDate(user.createdAt);
        if (userDate) {
            return userDate >= from && userDate <= to;
        }
        return false;
      });
    }

    // Finally, sort the filtered data
    return data.sort((a, b) => {
        const timeA = toDate(a.createdAt)?.getTime() ?? 0;
        const timeB = toDate(b.createdAt)?.getTime() ?? 0;
        return timeB - timeA;
    });
  }, [allUsersData, usersDateRange, roleFilter]);

  const userMap = useMemo(() => allUsersData?.reduce((acc, user) => ({ ...acc, [user.id]: user }), {} as Record<string, UserProfile>) || {}, [allUsersData]);

  // Fetch ALL withdrawal requests using a collection group query
  const allRequestsQuery = useMemo(() => {
    if (!firestore) return null;
    return query(collectionGroup(firestore, 'withdrawalRequests'));
  }, [firestore]);
  const { data: allRequestsData, isLoading: isRequestsLoading, error: requestsError } = useCollection<WithdrawalRequest>(allRequestsQuery);

  const pendingRequests = useMemo(() => {
      if (!allRequestsData) return null;
      return allRequestsData
          .filter(req => req.status === 'requested')
          .sort((a, b) => {
             const timeA = toDate(a.requestedAt)?.getTime() ?? 0;
             const timeB = toDate(b.requestedAt)?.getTime() ?? 0;
             return timeB - timeA;
          });
  }, [allRequestsData]);

  const withdrawalHistory = useMemo(() => {
    if (!allRequestsData) return [];
    let history = allRequestsData.filter(req => req.status === 'paid' || req.status === 'rejected');
    
    if (withdrawalDateRange?.from) {
      const from = withdrawalDateRange.from;
      const to = withdrawalDateRange.to ? new Date(withdrawalDateRange.to) : new Date(from);
      to.setHours(23, 59, 59, 999);

      history = history.filter(req => {
        const reqDate = toDate(req.processedAt);
        if (reqDate) {
            return reqDate >= from && reqDate <= to;
        }
        return false;
      });
    }

    return history.sort((a, b) => {
        const timeA = toDate(a.processedAt)?.getTime() ?? 0;
        const timeB = toDate(b.processedAt)?.getTime() ?? 0;
        return timeB - timeA;
    });
  }, [allRequestsData, withdrawalDateRange]);


  if (requestsError) {
      toast({variant: 'destructive', title: 'Error', description: 'Could not load withdrawal requests. Check security rules.'});
  }

  const handleDownloadCsv = () => {
    if (!withdrawalHistory || withdrawalHistory.length === 0) {
        toast({ title: "No Data", description: "There is no historical data to download for the selected range." });
        return;
    }

    const dataToExport = withdrawalHistory.map(req => ({
        "Request ID": req.id,
        "Mechanic Name": userMap[req.userId]?.displayName || 'N/A',
        "Mechanic Email": userMap[req.userId]?.email || 'N/A',
        "Amount (INR)": req.amount,
        "Status": req.status,
        "Requested At": formatDateTime(req.requestedAt),
        "Processed At": formatDateTime(req.processedAt),
        "Payment Method": req.upiId ? 'UPI' : 'Bank Transfer',
        "UPI ID": req.upiId || 'N/A',
        "Bank Account": req.bankAccountNumber || 'N/A',
        "IFSC Code": req.bankIfscCode || 'N/A',
        "Transaction ID": req.transactionId || 'N/A',
        "Rejection Reason": req.rejectionReason || 'N/A',
    }));

    const csv = Papa.unparse(dataToExport);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `withdrawal-history-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const handleDeleteUser = async (userId: string) => {
    if (!firestore) {
        toast({ variant: "destructive", title: "Error", description: "Database service not available." });
        return;
    }
    try {
        await deleteUser(firestore, userId);
        toast({ title: "User Deleted", description: "The user profile has been successfully deleted." });
    } catch (error) {
        console.error("Delete user error:", error);
        toast({ variant: "destructive", title: "Deletion Failed", description: "Could not delete the user." });
    }
  };


  const isLoading = isUsersLoading || isRequestsLoading;

  const recentUsers = useMemo(() => {
    if (!allUsersData) return [];
    return [...allUsersData]
        .sort((a, b) => {
            const timeA = toDate(a.createdAt)?.getTime() ?? 0;
            const timeB = toDate(b.createdAt)?.getTime() ?? 0;
            return timeB - timeA;
        })
        .filter(u => u.role !== 'Admin') // Show all roles except Admin
        .slice(0, 5);
  }, [allUsersData]);

  return (
    <div className="container mx-auto py-8 px-4 md:px-6 bg-background">
        <header className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
            <p className="text-muted-foreground">Manage withdrawals and view user activity.</p>
        </header>

        <main className="grid grid-cols-1 gap-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                    <Card>
                        <Tabs defaultValue="pending">
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <CardTitle className="flex items-center gap-2"><Wallet/> Withdrawal Requests</CardTitle>
                                    <TabsList>
                                        <TabsTrigger value="pending">Pending</TabsTrigger>
                                        <TabsTrigger value="history">History</TabsTrigger>
                                    </TabsList>
                                </div>
                                <CardDescription>Review pending requests or browse historical withdrawals.</CardDescription>
                            </CardHeader>
                            <TabsContent value="pending">
                                <CardContent>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>User / Shop</TableHead>
                                                <TableHead>Amount</TableHead>
                                                <TableHead>Payment Details</TableHead>
                                                <TableHead>Requested At</TableHead>
                                                <TableHead className="text-right">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {isRequestsLoading ? (
                                                <TableRow><TableCell colSpan={5}><Skeleton className="h-8 w-full" /></TableCell></TableRow>
                                            ) : pendingRequests && pendingRequests.length > 0 ? (
                                                pendingRequests.map(req => (
                                                    <TableRow key={req.id}>
                                                        <TableCell>
                                                            {isUsersLoading ? <Skeleton className="h-5 w-32" /> : (
                                                                <>
                                                                    <div className="font-medium">{userMap[req.userId]?.displayName || userMap[req.userId]?.email || 'Unknown User'}</div>
                                                                    {(userMap[req.userId]?.shopName || userMap[req.userId]?.location) && (
                                                                        <div className="text-xs text-muted-foreground">
                                                                            {[userMap[req.userId]?.shopName, userMap[req.userId]?.location].filter(Boolean).join(' - ')}
                                                                        </div>
                                                                    )}
                                                                </>
                                                            )}
                                                        </TableCell>
                                                        <TableCell>{formatCurrency(req.amount)}</TableCell>
                                                        <TableCell className="text-xs">
                                                            {req.upiId && <p><strong>UPI:</strong> {req.upiId}</p>}
                                                            {req.bankAccountNumber && <p><strong>Acct:</strong> {req.bankAccountNumber}</p>}
                                                            {req.bankIfscCode && <p><strong>IFSC:</strong> {req.bankIfscCode}</p>}
                                                        </TableCell>
                                                        <TableCell>{formatDateTime(req.requestedAt)}</TableCell>
                                                        <TableCell className="text-right space-x-2">
                                                            <ApproveDialog request={req} />
                                                            <RejectDialog request={req} />
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            ) : (
                                                <TableRow>
                                                    <TableCell colSpan={5} className="h-24 text-center">
                                                        <CheckCircle className="mx-auto h-8 w-8 text-primary mb-2"/>
                                                        No pending requests. All caught up!
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </TabsContent>
                            <TabsContent value="history">
                                <div className="px-6 pb-4 flex flex-wrap items-center justify-between gap-4">
                                     <Popover>
                                        <PopoverTrigger asChild>
                                            <Button
                                                id="withdrawal-date"
                                                variant={"outline"}
                                                className={cn(
                                                    "w-auto min-w-[260px] justify-start text-left font-normal",
                                                    !withdrawalDateRange && "text-muted-foreground"
                                                )}
                                            >
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                {withdrawalDateRange?.from ? (
                                                    withdrawalDateRange.to ? (
                                                        <>
                                                            {format(withdrawalDateRange.from, "LLL dd, y")} -{" "}
                                                            {format(withdrawalDateRange.to, "LLL dd, y")}
                                                        </>
                                                    ) : (
                                                        format(withdrawalDateRange.from, "LLL dd, y")
                                                    )
                                                ) : (
                                                    <span>Pick a date range</span>
                                                )}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                            <Calendar
                                                initialFocus
                                                mode="range"
                                                defaultMonth={withdrawalDateRange?.from}
                                                selected={withdrawalDateRange}
                                                onSelect={setWithdrawalDateRange}
                                                numberOfMonths={2}
                                            />
                                        </PopoverContent>
                                    </Popover>
                                    <Button onClick={handleDownloadCsv} variant="outline" size="sm">
                                        <Download className="mr-2 h-4 w-4"/>
                                        Download CSV
                                    </Button>
                                </div>
                                <CardContent>
                                     <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Mechanic</TableHead>
                                                <TableHead>Amount</TableHead>
                                                <TableHead>Processed At</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead>Txn ID</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                             {isRequestsLoading ? (
                                                <TableRow><TableCell colSpan={5}><Skeleton className="h-8 w-full" /></TableCell></TableRow>
                                            ) : withdrawalHistory && withdrawalHistory.length > 0 ? (
                                                withdrawalHistory.map(req => (
                                                    <TableRow key={req.id}>
                                                        <TableCell className="font-medium">
                                                             {isUsersLoading ? <Skeleton className="h-5 w-24" /> : (userMap[req.userId]?.displayName || userMap[req.userId]?.email || 'N/A')}
                                                        </TableCell>
                                                        <TableCell>{formatCurrency(req.amount)}</TableCell>
                                                        <TableCell>{formatDateTime(req.processedAt)}</TableCell>
                                                        <TableCell><Badge variant={req.status === 'paid' ? 'default' : 'destructive'}>{req.status}</Badge></TableCell>
                                                        <TableCell className="text-xs font-mono">{req.transactionId || 'N/A'}</TableCell>
                                                    </TableRow>
                                                ))
                                            ) : (
                                                 <TableRow>
                                                    <TableCell colSpan={5} className="h-24 text-center">
                                                        No historical records found for the selected period.
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                     </Table>
                                </CardContent>
                            </TabsContent>
                        </Tabs>
                    </Card>
                </div>
                <div>
                     <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><Users/> Recent Users</CardTitle>
                            <CardDescription>Newest Owners, Agents, and Mechanics.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {isUsersLoading ? <Skeleton className="h-40 w-full" /> : (
                                <div className="space-y-4">
                                    {recentUsers.map(user => (
                                        <div key={user.id} className="flex items-center justify-between">
                                            <div>
                                                <p className="font-medium">{user.displayName}</p>
                                                <p className="text-sm text-muted-foreground">{user.shopName ? `${user.shopName} - ${user.location}`: user.email}</p>
                                            </div>
                                            <Badge variant={user.role === 'Mechanic' ? 'secondary' : user.role === 'Agent' ? 'outline' : 'default'}>{user.role}</Badge>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                     </Card>
                </div>
            </div>
            
            <Card>
                <CardHeader>
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <CardTitle className="flex items-center gap-2"><Users/> All Users</CardTitle>
                        <CardDescription>Browse and manage all registered users, filtered by role or date.</CardDescription>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <Select value={roleFilter} onValueChange={setRoleFilter}>
                            <SelectTrigger className="w-auto min-w-[180px]">
                                <SelectValue placeholder="Filter by role" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="All">All Roles</SelectItem>
                                <SelectItem value="Owner">Owner</SelectItem>
                                <SelectItem value="Agent">Agent</SelectItem>
                                <SelectItem value="Mechanic">Mechanic</SelectItem>
                            </SelectContent>
                        </Select>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    id="date"
                                    variant={"outline"}
                                    className={cn(
                                        "w-auto min-w-[260px] justify-start text-left font-normal",
                                        !usersDateRange && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {usersDateRange?.from ? (
                                        usersDateRange.to ? (
                                            <>
                                                {format(usersDateRange.from, "LLL dd, y")} -{" "}
                                                {format(usersDateRange.to, "LLL dd, y")}
                                            </>
                                        ) : (
                                            format(usersDateRange.from, "LLL dd, y")
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
                                    defaultMonth={usersDateRange?.from}
                                    selected={usersDateRange}
                                    onSelect={setUsersDateRange}
                                    numberOfMonths={2}
                                />
                            </PopoverContent>
                        </Popover>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>User</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead>Shop / Location</TableHead>
                                <TableHead>Joined</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isUsersLoading ? (
                                <TableRow><TableCell colSpan={5} className="h-24 text-center"><Skeleton className="h-8 w-full" /></TableCell></TableRow>
                            ) : filteredUsers && filteredUsers.length > 0 ? (
                                filteredUsers.map(user => (
                                    <TableRow key={user.id}>
                                        <TableCell>
                                            <div className="font-medium">{user.displayName}</div>
                                            <div className="text-xs text-muted-foreground">{user.email}</div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={user.role === 'Mechanic' ? 'secondary' : user.role === 'Agent' ? 'outline' : 'default'}>{user.role}</Badge>
                                        </TableCell>
                                        <TableCell>
                                            {user.shopName ? (
                                                <div>
                                                    <div className="font-medium">{user.shopName}</div>
                                                    <div className="text-xs text-muted-foreground">{user.location}</div>
                                                </div>
                                            ) : 'N/A'}
                                        </TableCell>
                                        <TableCell>{formatDateTime(user.createdAt)}</TableCell>
                                        <TableCell className="text-right">
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button variant="destructive" size="icon">
                                                        <Trash2 className="h-4 w-4" />
                                                        <span className="sr-only">Delete User</span>
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            This will permanently delete the user '{user.displayName}' and their Firestore data. This action cannot be undone.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                        <AlertDialogAction onClick={() => handleDeleteUser(user.id)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center">
                                        No users found.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

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
            <Skeleton className="h-96 mt-8" />
        </div>
    );
}

function AdminPageComponent() {
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
      router.push('/login?redirect=/admin');
    }
  }, [user, isUserLoading, router]);

  // Wait for auth to resolve first
  if (isUserLoading || !user) {
    return <AdminPageLoader />;
  }
  
  // Determine admin status with robust logic
  const isHardcodedAdmin = user.email === 'rajmycarvalue@gmail.com';
  // We can only check role-based admin after profile is loaded
  const isRoleAdmin = !isProfileLoading && userProfile?.role === 'Admin';
  
  // If it's the hardcoded admin, we don't need to wait for the profile.
  // If it's not the hardcoded admin, we MUST wait for the profile to load.
  if (!isHardcodedAdmin && isProfileLoading) {
      return <AdminPageLoader />;
  }

  // Now we can make the final decision to grant access
  if (isHardcodedAdmin || isRoleAdmin) {
    return <AdminDashboard />;
  }

  // If we reach here, the user is not an admin.
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

export default function AdminPage() {
    return (
        <Suspense fallback={<AdminPageLoader />}>
            <AdminPageComponent />
        </Suspense>
    );
}
