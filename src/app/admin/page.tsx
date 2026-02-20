'use client';

import { Suspense, useEffect, useState, useMemo } from 'react';
import Image from 'next/image';
import { doc, collection, query, orderBy, where, Timestamp, collectionGroup, type FieldValue } from 'firebase/firestore';
import { useUser, useFirestore, useDoc, useCollection } from '@/firebase';
import type { UserProfile } from '@/lib/firebase/user-profile-service';
import { approveWithdrawal, rejectWithdrawal } from '@/lib/firebase/withdrawal-service';
import { deleteUser } from '@/lib/firebase/user-profile-service';
import { upsertFreshCar, deleteFreshCar, type FreshCarData } from '@/lib/firebase/fresh-car-service';
import { useRouter } from 'next/navigation';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from 'zod';
import { useToast } from "@/hooks/use-toast";
import { DateRange } from "react-day-picker";
import { format } from "date-fns";
import { cn, toDate, formatCurrency, formatDateTime, formatDateOnly } from "@/lib/utils";
import { indianStates } from "@/lib/variants";
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
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle, CheckCircle, Shield, Users, Wallet, XCircle, Calendar as CalendarIcon, Download, Trash2, Plus, Flame, Edit, Car, History, MessageCircle } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';


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

const FreshCarSchema = z.object({
    title: z.string().min(5, "Title is required"),
    imageUrl: z.string().url("Valid image URL is required"),
    price: z.coerce.number().min(10000, "Price must be at least 10,000"),
    state: z.string().min(1, "State is required"),
    city: z.string().min(2, "City is required"),
    area: z.string().min(2, "Area is required"),
    ownerName: z.string().min(2, "Owner name is required"),
    ownerPhone: z.string().regex(/^\d{10}$/, "10-digit phone number required"),
    ownerWhatsapp: z.string().regex(/^\d{10}$/, "10-digit WhatsApp number required"),
    ownership: z.string().min(1, "Ownership is required"),
    isDirectOwner: z.boolean().default(true),
    year: z.coerce.number().min(1980, "Year must be 1980 or later"),
    km: z.coerce.number().min(0, "KM is required"),
    fuelType: z.string().min(1, "Fuel type is required"),
    transmission: z.string().min(1, "Transmission is required"),
    aiInsight: z.string().optional(),
});

type FreshCarFormInput = z.infer<typeof FreshCarSchema>;

function FreshCarDialog({ car }: { car?: any }) {
    const [open, setOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const firestore = useFirestore();
    const { toast } = useToast();

    const form = useForm<FreshCarFormInput>({
        resolver: zodResolver(FreshCarSchema),
        defaultValues: car ? {
            title: car.title,
            imageUrl: car.imageUrl,
            price: car.price,
            state: car.state || '',
            city: car.city || '',
            area: car.area || '',
            ownerName: car.ownerName || '',
            ownerPhone: car.ownerPhone || '',
            ownerWhatsapp: car.ownerWhatsapp || '',
            ownership: car.ownership || '1st',
            isDirectOwner: car.isDirectOwner ?? true,
            year: car.year,
            km: car.km,
            fuelType: car.fuelType,
            transmission: car.transmission,
            aiInsight: car.aiInsight || '',
        } : {
            title: '',
            imageUrl: '',
            price: 500000,
            state: '',
            city: '',
            area: '',
            ownerName: '',
            ownerPhone: '',
            ownerWhatsapp: '',
            ownership: '1st',
            isDirectOwner: true,
            year: new Date().getFullYear(),
            km: 50000,
            fuelType: 'petrol',
            transmission: 'manual',
            aiInsight: '',
        }
    });

    const handleSave = async (data: FreshCarFormInput) => {
        if (!firestore) return;
        setIsSubmitting(true);
        try {
            await upsertFreshCar(firestore, { ...data, id: car?.id });
            toast({ title: "Success", description: car ? "Listing updated." : "New listing added to Hot Picks." });
            setOpen(false);
            if (!car) form.reset();
        } catch (error) {
            console.error(error);
            toast({ variant: 'destructive', title: "Error", description: "Failed to save listing." });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {car ? <Button variant="ghost" size="icon"><Edit className="h-4 w-4"/></Button> : <Button><Plus className="mr-2 h-4 w-4" /> Add Hot Listing</Button>}
            </DialogTrigger>
            <DialogContent className="max-w-3xl overflow-y-auto max-h-[90vh]">
                <DialogHeader>
                    <DialogTitle>{car ? 'Edit Listing' : 'Add Hot Market Listing'}</DialogTitle>
                    <DialogDescription>Manually manage featured car listings for the public 'Hot Market Listings' feed.</DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSave)} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField control={form.control} name="title" render={({ field }) => (
                                <FormItem className="col-span-full"><FormLabel>Car Title</FormLabel><FormControl><Input placeholder="e.g. 2021 Hyundai Creta SX" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField control={form.control} name="imageUrl" render={({ field }) => (
                                <FormItem className="col-span-full"><FormLabel>Image URL (Direct link to .jpg/.png)</FormLabel><FormControl><Input placeholder="https://..." {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            
                            <div className="col-span-full grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted/30 rounded-lg border">
                                <FormField control={form.control} name="state" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>State</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl><SelectTrigger><SelectValue placeholder="Select State" /></SelectTrigger></FormControl>
                                            <SelectContent>{indianStates.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                                <FormField control={form.control} name="city" render={({ field }) => (
                                    <FormItem><FormLabel>City</FormLabel><FormControl><Input placeholder="e.g. Mumbai" {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField control={form.control} name="area" render={({ field }) => (
                                    <FormItem><FormLabel>Area</FormLabel><FormControl><Input placeholder="e.g. Bandra" {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                            </div>

                            <div className="col-span-full grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-primary/5 rounded-lg border border-primary/10">
                                <FormField control={form.control} name="ownerName" render={({ field }) => (
                                    <FormItem><FormLabel>Owner Name</FormLabel><FormControl><Input placeholder="Name" {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField control={form.control} name="isDirectOwner" render={({ field }) => (
                                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 bg-background">
                                        <div className="space-y-0.5">
                                            <FormLabel>Direct Owner?</FormLabel>
                                        </div>
                                        <FormControl>
                                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                                        </FormControl>
                                    </FormItem>
                                )} />
                                <FormField control={form.control} name="ownerPhone" render={({ field }) => (
                                    <FormItem><FormLabel>Owner Phone</FormLabel><FormControl><Input placeholder="10 digits" {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField control={form.control} name="ownerWhatsapp" render={({ field }) => (
                                    <FormItem><FormLabel>WhatsApp Number</FormLabel><FormControl><Input placeholder="10 digits" {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                            </div>

                            <FormField control={form.control} name="price" render={({ field }) => (
                                <FormItem><FormLabel>Price (INR)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField control={form.control} name="year" render={({ field }) => (
                                <FormItem><FormLabel>Mfg Year</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField control={form.control} name="km" render={({ field }) => (
                                <FormItem><FormLabel>KM Driven</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField control={form.control} name="ownership" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Ownership</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger></FormControl>
                                        <SelectContent>
                                            <SelectItem value="1st">1st Owner</SelectItem>
                                            <SelectItem value="2nd">2nd Owner</SelectItem>
                                            <SelectItem value="3rd">3rd Owner</SelectItem>
                                            <SelectItem value="4th+">4th+ Owner</SelectItem>
                                        </SelectContent>
                                    </Select><FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="fuelType" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Fuel Type</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger></FormControl>
                                        <SelectContent><SelectItem value="petrol">Petrol</SelectItem><SelectItem value="diesel">Diesel</SelectItem><SelectItem value="cng">CNG</SelectItem><SelectItem value="electric">Electric</SelectItem></SelectContent>
                                    </Select><FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="transmission" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Transmission</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger></FormControl>
                                        <SelectContent><SelectItem value="manual">Manual</SelectItem><SelectItem value="automatic">Automatic</SelectItem></SelectContent>
                                    </Select><FormMessage />
                                </FormItem>
                            )} />
                        </div>
                        <FormField control={form.control} name="aiInsight" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Market Insight / Description</FormLabel>
                                <FormControl><Textarea placeholder="Describe why this car is a hot deal (e.g. low kms, single owner, mint condition)..." {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <DialogFooter>
                            <DialogClose asChild><Button type="button" variant="secondary">Cancel</Button></DialogClose>
                            <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Saving...' : 'Save Listing'}</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
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

function AdminDashboard({ user }: { user: any }) {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [usersDateRange, setUsersDateRange] = useState<DateRange | undefined>();
  const [withdrawalDateRange, setWithdrawalDateRange] = useState<DateRange | undefined>();
  const [roleFilter, setRoleFilter] = useState<string>('All');
  const [activeTab, setActiveTab] = useState('pending');

  // --- Data Fetching & Processing ---
  
  const usersQuery = useMemo(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'users'));
  }, [firestore, user]);

  const { data: rawAllUsersData, isLoading: isUsersLoading } = useCollection<Omit<UserProfile, 'createdAt' | 'lastUpdatedAt'> & { createdAt: any; lastUpdatedAt: any }>(usersQuery);

  const allUsersData = useMemo(() => {
    if (!rawAllUsersData) return null;
    return rawAllUsersData.map(user => ({
      ...user,
      createdAt: toDate(user.createdAt),
      lastUpdatedAt: toDate(user.lastUpdatedAt),
    }));
  }, [rawAllUsersData]);


  const allRequestsQuery = useMemo(() => {
    if (!firestore || !user) return null;
    return query(collectionGroup(firestore, 'withdrawalRequests'));
  }, [firestore, user]);

  const { data: rawAllRequestsData, isLoading: isRequestsLoading, error: requestsError } = useCollection<Omit<WithdrawalRequest, 'requestedAt' | 'processedAt'> & { requestedAt: any; processedAt: any }>(allRequestsQuery);
  
  const allRequestsData = useMemo(() => {
    if (!rawAllRequestsData) return null;
    return rawAllRequestsData.map(req => ({
      ...req,
      requestedAt: toDate(req.requestedAt),
      processedAt: toDate(req.processedAt),
    }));
  }, [rawAllRequestsData]);

  const freshCarsQuery = useMemo(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'dailyFreshCars'), orderBy('createdAt', 'desc'));
  }, [firestore, user]);
  const { data: freshCars, isLoading: isFreshCarsLoading } = useCollection<any>(freshCarsQuery);

  // --- Derived Data ---

  const filteredUsers = useMemo(() => {
    if (!allUsersData) return [];
    let data = allUsersData.filter(user => user.role !== 'Admin');
    if (roleFilter !== 'All') {
      data = data.filter(user => user.role === roleFilter);
    }
    if (usersDateRange?.from) {
      const from = usersDateRange.from;
      const to = usersDateRange.to ? new Date(usersDateRange.to) : new Date(from);
      to.setHours(23, 59, 59, 999);
      data = data.filter(user => {
        const userDate = user.createdAt;
        return userDate && userDate >= from && userDate <= to;
      });
    }
    return data.sort((a, b) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0));
  }, [allUsersData, usersDateRange, roleFilter]);

  const userMap = useMemo(() => allUsersData?.reduce((acc, user) => ({ ...acc, [user.id]: user }), {} as Record<string, UserProfile & { createdAt: Date | null; lastUpdatedAt: Date | null }>) || {}, [allUsersData]);

  const pendingRequests = useMemo(() => {
      if (!allRequestsData) return null;
      return allRequestsData.filter(req => req.status === 'requested')
          .sort((a, b) => (b.requestedAt?.getTime() ?? 0) - (a.requestedAt?.getTime() ?? 0));
  }, [allRequestsData]);

  const withdrawalHistory = useMemo(() => {
    if (!allRequestsData) return [];
    let history = allRequestsData.filter(req => req.status === 'paid' || req.status === 'rejected');
    if (withdrawalDateRange?.from) {
      const from = withdrawalDateRange.from;
      const to = withdrawalDateRange.to ? new Date(withdrawalDateRange.to) : new Date(from);
      to.setHours(23, 59, 59, 999);
      history = history.filter(req => {
        const reqDate = req.processedAt;
        return reqDate && reqDate >= from && reqDate <= to;
      });
    }
    return history.sort((a, b) => (b.processedAt?.getTime() ?? 0) - (a.processedAt?.getTime() ?? 0));
  }, [allRequestsData, withdrawalDateRange]);


  const handleDownloadCsv = () => {
    if (!withdrawalHistory || withdrawalHistory.length === 0) {
        toast({ title: "No Data", description: "There is no historical data to download." });
        return;
    }
    const dataToExport = withdrawalHistory.map(req => ({
        "Request ID": req.id,
        "Mechanic Name": userMap[req.userId]?.displayName || 'N/A',
        "Amount (INR)": req.amount,
        "Status": req.status,
        "Requested At": formatDateTime(req.requestedAt),
        "Processed At": formatDateTime(req.processedAt),
        "Transaction ID": req.transactionId || 'N/A',
    }));
    const csv = Papa.unparse(dataToExport);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `withdrawal-history-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };
  
  const handleDeleteUser = async (userId: string) => {
    if (!firestore) return;
    try {
        await deleteUser(firestore, userId);
        toast({ title: "User Deleted" });
    } catch (error) {
        toast({ variant: "destructive", title: "Deletion Failed" });
    }
  };

  const handleDeleteFreshCar = async (carId: string) => {
    if (!firestore) return;
    try {
        await deleteFreshCar(firestore, carId);
        toast({ title: "Listing Deleted" });
    } catch (e) {
        toast({ variant: 'destructive', title: "Error" });
    }
  }

  const cardDescriptions: Record<string, string> = {
    pending: 'Review pending requests for withdrawals.',
    history: 'Browse historical withdrawals.',
    freshCars: 'Manage featured Hot Listings for the public feed.',
  };

  return (
    <div className="container mx-auto py-8 px-4 md:px-6 bg-background">
        <header className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
            <p className="text-muted-foreground">Platform oversight and management.</p>
        </header>

        <main className="grid grid-cols-1 gap-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                    <Card>
                        <Tabs value={activeTab} onValueChange={setActiveTab}>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <CardTitle className="flex items-center gap-2">
                                        <Car className="h-5 w-5 text-primary" /> Management
                                    </CardTitle>
                                    <TabsList>
                                        <TabsTrigger value="pending" className="gap-2">
                                            <Wallet className="h-4 w-4" /> Withdrawals
                                        </TabsTrigger>
                                        <TabsTrigger value="freshCars" className="gap-2">
                                            <Car className="h-4 w-4" /> Hot Listings
                                        </TabsTrigger>
                                        <TabsTrigger value="history" className="gap-2">
                                            <History className="h-4 w-4" /> History
                                        </TabsTrigger>
                                    </TabsList>
                                </div>
                                <CardDescription>{cardDescriptions[activeTab]}</CardDescription>
                            </CardHeader>
                            
                            <TabsContent value="pending">
                                <CardContent>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>User / Shop</TableHead>
                                                <TableHead>Amount</TableHead>
                                                <TableHead>Requested At</TableHead>
                                                <TableHead className="text-right">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {isRequestsLoading ? (
                                                <TableRow><TableCell colSpan={4}><Skeleton className="h-8 w-full" /></TableCell></TableRow>
                                            ) : pendingRequests && pendingRequests.length > 0 ? (
                                                pendingRequests.map(req => (
                                                    <TableRow key={req.id}>
                                                        <TableCell>
                                                            <div className="font-medium">{userMap[req.userId]?.displayName || userMap[req.userId]?.email || 'Unknown'}</div>
                                                            <div className="text-xs text-muted-foreground">{userMap[req.userId]?.shopName || 'No Shop'}</div>
                                                        </TableCell>
                                                        <TableCell className="font-bold">{formatCurrency(req.amount)}</TableCell>
                                                        <TableCell className="text-xs">{formatDateTime(req.requestedAt)}</TableCell>
                                                        <TableCell className="text-right space-x-2">
                                                            <ApproveDialog request={req} />
                                                            <RejectDialog request={req} />
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            ) : <TableRow><TableCell colSpan={4} className="h-24 text-center">No pending requests.</TableCell></TableRow>}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </TabsContent>

                            <TabsContent value="freshCars">
                                <CardContent>
                                    <div className="flex justify-end mb-4"><FreshCarDialog /></div>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Car</TableHead>
                                                <TableHead>Price</TableHead>
                                                <TableHead className="text-right">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {isFreshCarsLoading ? (
                                                <TableRow><TableCell colSpan={3}><Skeleton className="h-8 w-full" /></TableCell></TableRow>
                                            ) : freshCars && freshCars.length > 0 ? (
                                                freshCars.map(car => (
                                                    <TableRow key={car.id}>
                                                        <TableCell>
                                                            <div className="flex items-center gap-3">
                                                                <div className="relative h-10 w-10 rounded overflow-hidden border bg-muted flex-shrink-0">
                                                                    <Image src={car.imageUrl} alt={car.title} fill className="object-cover" />
                                                                </div>
                                                                <div>
                                                                    <p className="font-medium text-sm">{car.title}</p>
                                                                    <p className="text-[10px] text-muted-foreground">{car.city}, {car.state}</p>
                                                                </div>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="font-bold text-sm">{formatCurrency(car.price)}</TableCell>
                                                        <TableCell className="text-right">
                                                            <div className="flex justify-end gap-1">
                                                                <FreshCarDialog car={car} />
                                                                <Button variant="ghost" size="icon" onClick={() => handleDeleteFreshCar(car.id)}><Trash2 className="h-4 w-4 text-destructive"/></Button>
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            ) : <TableRow><TableCell colSpan={3} className="text-center py-8 text-muted-foreground">No hot listings.</TableCell></TableRow>}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </TabsContent>

                            <TabsContent value="history">
                                <div className="px-6 pb-4 flex flex-wrap items-center justify-between gap-4">
                                     <Popover>
                                        <PopoverTrigger asChild>
                                            <Button variant="outline" size="sm" className="w-full sm:w-auto">
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                {withdrawalDateRange?.from ? (withdrawalDateRange.to ? `${format(withdrawalDateRange.from, "PP")} - ${format(withdrawalDateRange.to, "PP")}` : format(withdrawalDateRange.from, "PP")) : "Pick date range"}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                            <Calendar mode="range" selected={withdrawalDateRange} onSelect={setWithdrawalDateRange} numberOfMonths={2} />
                                        </PopoverContent>
                                    </Popover>
                                    <Button onClick={handleDownloadCsv} variant="outline" size="sm"><Download className="mr-2 h-4 w-4"/> CSV</Button>
                                </div>
                                <CardContent>
                                     <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>User</TableHead>
                                                <TableHead>Amount</TableHead>
                                                <TableHead>Status</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                             {withdrawalHistory && withdrawalHistory.length > 0 ? (
                                                withdrawalHistory.map(req => (
                                                    <TableRow key={req.id}>
                                                        <TableCell className="text-xs">{userMap[req.userId]?.displayName || 'N/A'}</TableCell>
                                                        <TableCell className="text-sm font-bold">{formatCurrency(req.amount)}</TableCell>
                                                        <TableCell><Badge variant={req.status === 'paid' ? 'default' : 'destructive'}>{req.status}</Badge></TableCell>
                                                    </TableRow>
                                                ))
                                            ) : <TableRow><TableCell colSpan={3} className="h-24 text-center">No history.</TableCell></TableRow>}
                                        </TableBody>
                                     </Table>
                                </CardContent>
                            </TabsContent>
                        </Tabs>
                    </Card>
                </div>
                
                <div className="space-y-8">
                     <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><Users/> Quick Stats</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-muted-foreground">Total Users</span>
                                <span className="font-bold">{allUsersData?.length || 0}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-muted-foreground">Withdrawal Volume</span>
                                <span className="font-bold">{formatCurrency(withdrawalHistory.reduce((acc, r) => acc + (r.status === 'paid' ? r.amount : 0), 0))}</span>
                            </div>
                        </CardContent>
                     </Card>

                     <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><Users/> Recent Users</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {allUsersData?.filter(u => u.role !== 'Admin').slice(0, 5).map(user => (
                                    <div key={user.id} className="flex items-center justify-between text-sm">
                                        <div>
                                            <p className="font-medium">{user.displayName}</p>
                                            <p className="text-[10px] text-muted-foreground">{user.email}</p>
                                        </div>
                                        <Badge variant="outline" className="text-[10px]">{user.role}</Badge>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                     </Card>
                </div>
            </div>
            
            <Card>
                <CardHeader>
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <CardTitle className="flex items-center gap-2"><Users/> All Users</CardTitle>
                        <CardDescription>Manage user profiles and roles.</CardDescription>
                    </div>
                    <div className="flex gap-2">
                        <Select value={roleFilter} onValueChange={setRoleFilter}>
                            <SelectTrigger className="w-auto min-w-[140px]"><SelectValue placeholder="Role" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="All">All Roles</SelectItem>
                                <SelectItem value="Owner">Owner</SelectItem>
                                <SelectItem value="Agent">Agent</SelectItem>
                                <SelectItem value="Mechanic">Mechanic</SelectItem>
                            </SelectContent>
                        </Select>
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
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isUsersLoading ? (
                                <TableRow><TableCell colSpan={4}><Skeleton className="h-8 w-full" /></TableCell></TableRow>
                            ) : filteredUsers.length > 0 ? (
                                filteredUsers.map(user => (
                                    <TableRow key={user.id}>
                                        <TableCell>
                                            <div className="font-medium text-sm">{user.displayName}</div>
                                            <div className="text-[10px] text-muted-foreground">{user.email}</div>
                                        </TableCell>
                                        <TableCell><Badge variant="secondary" className="text-[10px]">{user.role}</Badge></TableCell>
                                        <TableCell className="text-xs">{user.shopName || 'N/A'}</TableCell>
                                        <TableCell className="text-right">
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild><Button variant="destructive" size="icon" className="h-7 w-7"><Trash2 className="h-3.5 w-3.5" /></Button></AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader><AlertDialogTitle>Delete User?</AlertDialogTitle><AlertDialogDescription>This will delete all data for {user.displayName}.</AlertDialogDescription></AlertDialogHeader>
                                                    <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => handleDeleteUser(user.id)} className="bg-destructive">Delete</AlertDialogAction></AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : <TableRow><TableCell colSpan={4} className="text-center py-8">No users.</TableCell></TableRow>}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </main>
    </div>
  );
}


function AdminPageLoader() {
    return (
        <div className="container mx-auto py-8"><Skeleton className="h-8 w-64 mb-2" /><Skeleton className="h-5 w-80 mb-8" /></div>
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

  if (isUserLoading || (user && isProfileLoading)) return <AdminPageLoader />;
  if (!user) return <AdminPageLoader />;

  const isAuthorized = user.email === 'rajmycarvalue@gmail.com' || userProfile?.role === 'Admin';

  if (isAuthorized) return <AdminDashboard user={user} />;
  
  return (
    <div className="container mx-auto flex items-center justify-center py-20">
      <Alert variant="destructive" className="max-w-lg">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Access Denied</AlertTitle>
          <AlertDescription>Administrators only.</AlertDescription>
      </Alert>
    </div>
  );
}

export default function AdminPage() {
    return <AdminPageComponent />;
}
