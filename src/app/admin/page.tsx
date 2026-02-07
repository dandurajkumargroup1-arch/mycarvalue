
'use client';

import { Suspense, useEffect, useState, useMemo } from 'react';
import { doc, collection, query, orderBy, where, Timestamp, collectionGroup, type FieldValue } from 'firebase/firestore';
import { useUser, useFirestore, useDoc, useCollection } from '@/firebase';
import type { UserProfile } from '@/lib/firebase/user-profile-service';
import { approveWithdrawal, rejectWithdrawal } from '@/lib/firebase/withdrawal-service';
import { deleteUser } from '@/lib/firebase/user-profile-service';
import { upsertAuctionCar, deleteAuctionCar, type AuctionCarData } from '@/lib/firebase/auction-service';
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
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle, CheckCircle, Shield, Users, Wallet, XCircle, Calendar as CalendarIcon, Download, Trash2, Gavel } from 'lucide-react';
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
    requestedAt: Date | null;
    processedAt?: Date | null;
    rejectionReason?: string;
    transactionId?: string;
}

interface AuctionCar {
  id: string;
  title: string;
  images: string[];
  status: 'scheduled' | 'live' | 'completed' | 'cancelled';
  startTime: Date | null;
  endTime: Date | null;
  currentBid: number;
  [key: string]: any; 
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

const AuctionCarSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(5, "Title is required."),
  images: z.string().min(10, "At least one image URL is required (one per line)."), 
  odometer: z.string().min(1, "Odometer is required."),
  fuelType: z.string().min(1, "Fuel type is required."),
  transmission: z.string().min(1, "Transmission is required."),
  ownership: z.string().min(1, "Ownership is required."),
  registration: z.string().min(1, "Registration is required."),
  sellerName: z.string().min(1, "Seller name is required."),
  sellerRating: z.coerce.number().min(0).max(5),
  sellerLocation: z.string().min(1, "Seller location is required."),
  startTime: z.date({ required_error: "Start time is required." }),
  endTime: z.date({ required_error: "End time is required." }),
  startPrice: z.coerce.number().min(1, "Start price must be positive."),
  reservePrice: z.coerce.number().min(1, "Reserve price must be positive."),
  status: z.enum(['scheduled', 'live', 'completed', 'cancelled']),
  conditionSummary: z.string().min(1, "Condition summary is required (item:status per line)."),
  inspectionReportUrl: z.string().url("Must be a valid URL.").optional().or(z.literal('')),
});

type AuctionCarFormInput = z.infer<typeof AuctionCarSchema>;

function AuctionCarDialog({ car, children }: { car?: AuctionCar, children: React.ReactNode }) {
    const [open, setOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const firestore = useFirestore();
    const { toast } = useToast();

    const form = useForm<AuctionCarFormInput>({
        resolver: zodResolver(AuctionCarSchema),
        defaultValues: car ? {
            ...car,
            images: car.images?.join('\n') || '',
            conditionSummary: car.conditionSummary?.map((c: any) => `${c.item}: ${c.status}`).join('\n') || '',
        } : {
            title: '',
            images: '',
            odometer: '',
            fuelType: 'Diesel',
            transmission: 'Automatic',
            ownership: '1st Owner',
            registration: '',
            sellerName: '',
            sellerRating: 5,
            sellerLocation: '',
            startPrice: 100000,
            reservePrice: 120000,
            status: 'scheduled',
            conditionSummary: 'Engine: Excellent\nExterior: Minor Scratches',
            inspectionReportUrl: '',
        },
    });

    useEffect(() => {
        if (car) {
            form.reset({
                ...car,
                images: car.images?.join('\n') || '',
                conditionSummary: car.conditionSummary?.map((c: any) => `${c.item}: ${c.status}`).join('\n') || '',
            });
        }
    }, [car, form]);

    const onSubmit = async (data: AuctionCarFormInput) => {
        if (!firestore) return;
        setIsSubmitting(true);

        try {
            const images = data.images.split('\n').map(url => url.trim()).filter(Boolean);
            const conditionSummary = data.conditionSummary.split('\n').map(line => {
                const parts = line.split(':');
                const item = parts[0]?.trim();
                const status = parts.slice(1).join(':').trim();
                return { item, status };
            }).filter(c => c.item && c.status);
            
            if (images.length === 0) {
                form.setError('images', { message: 'At least one image URL is required.' });
                setIsSubmitting(false);
                return;
            }

            const payload: AuctionCarData = { ...data, images, conditionSummary };
            await upsertAuctionCar(firestore, payload);
            
            toast({ title: `Auction car ${car ? 'updated' : 'created'} successfully.` });
            setOpen(false);
        } catch (error) {
            console.error("Error saving auction car:", error);
            toast({ variant: "destructive", title: "Error", description: "Could not save auction car." });
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{car ? 'Edit' : 'Add'} Auction Car</DialogTitle>
                    <DialogDescription>
                        Fill in the details for the car to be listed in the live auction.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <FormField control={form.control} name="title" render={({ field }) => ( <FormItem> <FormLabel>Title</FormLabel> <FormControl><Input placeholder="e.g., 2021 Hyundai Creta" {...field} /></FormControl> <FormMessage /> </FormItem> )} />
                             <FormField control={form.control} name="status" render={({ field }) => ( <FormItem> <FormLabel>Status</FormLabel> <Select onValueChange={field.onChange} value={field.value}> <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl> <SelectContent> <SelectItem value="scheduled">Scheduled</SelectItem> <SelectItem value="live">Live</SelectItem> <SelectItem value="completed">Completed</SelectItem> <SelectItem value="cancelled">Cancelled</SelectItem> </SelectContent> </Select> <FormMessage /> </FormItem> )} />
                             <FormField control={form.control} name="odometer" render={({ field }) => ( <FormItem> <FormLabel>Odometer</FormLabel> <FormControl><Input placeholder="e.g., 28,500 km" {...field} /></FormControl> <FormMessage /> </FormItem> )} />
                             <FormField control={form.control} name="fuelType" render={({ field }) => ( <FormItem> <FormLabel>Fuel Type</FormLabel> <FormControl><Input placeholder="e.g., Diesel" {...field} /></FormControl> <FormMessage /> </FormItem> )} />
                             <FormField control={form.control} name="transmission" render={({ field }) => ( <FormItem> <FormLabel>Transmission</FormLabel> <FormControl><Input placeholder="e.g., Automatic" {...field} /></FormControl> <FormMessage /> </FormItem> )} />
                             <FormField control={form.control} name="ownership" render={({ field }) => ( <FormItem> <FormLabel>Ownership</FormLabel> <FormControl><Input placeholder="e.g., 1st Owner" {...field} /></FormControl> <FormMessage /> </FormItem> )} />
                             <FormField control={form.control} name="registration" render={({ field }) => ( <FormItem> <FormLabel>Registration</FormLabel> <FormControl><Input placeholder="e.g., MH 14 (Pune)" {...field} /></FormControl> <FormMessage /> </FormItem> )} />
                             <FormField control={form.control} name="sellerName" render={({ field }) => ( <FormItem> <FormLabel>Seller Name</FormLabel> <FormControl><Input placeholder="e.g., AutoBest Deals" {...field} /></FormControl> <FormMessage /> </FormItem> )} />
                             <FormField control={form.control} name="sellerLocation" render={({ field }) => ( <FormItem> <FormLabel>Seller Location</FormLabel> <FormControl><Input placeholder="e.g., Pune, Maharashtra" {...field} /></FormControl> <FormMessage /> </FormItem> )} />
                             <FormField control={form.control} name="sellerRating" render={({ field }) => ( <FormItem> <FormLabel>Seller Rating</FormLabel> <FormControl><Input type="number" step="0.1" {...field} /></FormControl> <FormMessage /> </FormItem> )} />
                             <FormField control={form.control} name="startPrice" render={({ field }) => ( <FormItem> <FormLabel>Start Price</FormLabel> <FormControl><Input type="number" {...field} /></FormControl> <FormMessage /> </FormItem> )} />
                             <FormField control={form.control} name="reservePrice" render={({ field }) => ( <FormItem> <FormLabel>Reserve Price</FormLabel> <FormControl><Input type="number" {...field} /></FormControl> <FormMessage /> </FormItem> )} />

                             <FormField control={form.control} name="startTime" render={({ field }) => (
                                <FormItem className="flex flex-col">
                                    <FormLabel>Start Time</FormLabel>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                        <FormControl>
                                            <Button variant="outline" className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                                            {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                            </Button>
                                        </FormControl>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                            <Calendar mode="single" selected={field.value} onSelect={field.onChange} />
                                        </PopoverContent>
                                    </Popover>
                                    <FormMessage />
                                </FormItem>
                             )} />
                             <FormField control={form.control} name="endTime" render={({ field }) => (
                                <FormItem className="flex flex-col">
                                    <FormLabel>End Time</FormLabel>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                        <FormControl>
                                            <Button variant="outline" className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                                            {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                            </Button>
                                        </FormControl>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                            <Calendar mode="single" selected={field.value} onSelect={field.onChange} />
                                        </PopoverContent>
                                    </Popover>
                                    <FormMessage />
                                </FormItem>
                             )} />
                             
                             <FormField control={form.control} name="inspectionReportUrl" render={({ field }) => ( <FormItem> <FormLabel>Inspection Report URL</FormLabel> <FormControl><Input placeholder="https://example.com/report.pdf" {...field} /></FormControl> <FormMessage /> </FormItem> )} />
                        </div>
                        
                        <FormField control={form.control} name="images" render={({ field }) => ( <FormItem> <FormLabel>Image URLs</FormLabel> <FormControl><Textarea placeholder="One image URL per line" {...field} rows={4} /></FormControl> <FormMessage /> </FormItem> )} />
                        <FormField control={form.control} name="conditionSummary" render={({ field }) => ( <FormItem> <FormLabel>Condition Summary</FormLabel> <FormControl><Textarea placeholder="One item per line, e.g., Engine: Excellent" {...field} rows={5} /></FormControl> <FormMessage /> </FormItem> )} />
                        
                        <DialogFooter>
                            <DialogClose asChild><Button type="button" variant="secondary" disabled={isSubmitting}>Cancel</Button></DialogClose>
                            <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Saving...' : 'Save Car'}</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}


// --- Main Dashboard Component ---

function AdminDashboard() {
  const { user } = useUser();
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
  
  const auctionCarsQuery = useMemo(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'auctionCars'), orderBy('startTime', 'desc'));
  }, [firestore, user]);

  const { data: rawAuctionCars, isLoading: areAuctionsLoading } = useCollection(auctionCarsQuery);

  const auctionCars: AuctionCar[] | null = useMemo(() => {
    if (!rawAuctionCars) return null;
    return rawAuctionCars.map((car: any) => ({
        ...car,
        startTime: toDate(car.startTime),
        endTime: toDate(car.endTime),
    }));
  }, [rawAuctionCars]);


  // --- Derived Data ---

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
        const userDate = user.createdAt; // Already a Date object
        if (userDate) {
            return userDate >= from && userDate <= to;
        }
        return false;
      });
    }

    // Finally, sort the filtered data
    return data.sort((a, b) => {
        const timeA = a.createdAt?.getTime() ?? 0;
        const timeB = b.createdAt?.getTime() ?? 0;
        return timeB - timeA;
    });
  }, [allUsersData, usersDateRange, roleFilter]);

  const userMap = useMemo(() => allUsersData?.reduce((acc, user) => ({ ...acc, [user.id]: user }), {} as Record<string, UserProfile & { createdAt: Date | null; lastUpdatedAt: Date | null }>) || {}, [allUsersData]);

  const pendingRequests = useMemo(() => {
      if (!allRequestsData) return null;
      return allRequestsData
          .filter(req => req.status === 'requested')
          .sort((a, b) => {
             const timeA = a.requestedAt?.getTime() ?? 0;
             const timeB = b.requestedAt?.getTime() ?? 0;
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
        const reqDate = req.processedAt; // Already a Date object
        if (reqDate) {
            return reqDate >= from && reqDate <= to;
        }
        return false;
      });
    }

    return history.sort((a, b) => {
        const timeA = a.processedAt?.getTime() ?? 0;
        const timeB = b.processedAt?.getTime() ?? 0;
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
  
  const handleDeleteAuctionCar = async (carId: string) => {
    if (!firestore) return;
    try {
        await deleteAuctionCar(firestore, carId);
        toast({ title: "Auction Car Deleted" });
    } catch (error) {
        toast({ variant: "destructive", title: "Error", description: "Could not delete auction car." });
    }
  };


  const isLoading = isUsersLoading || isRequestsLoading || areAuctionsLoading;

  const recentUsers = useMemo(() => {
    if (!allUsersData) return [];
    return [...allUsersData]
        .sort((a, b) => {
            const timeA = a.createdAt?.getTime() ?? 0;
            const timeB = b.createdAt?.getTime() ?? 0;
            return timeB - timeA;
        })
        .filter(u => u.role !== 'Admin') // Show all roles except Admin
        .slice(0, 5);
  }, [allUsersData]);

  const cardDescriptions: Record<string, string> = {
    pending: 'Review pending requests for withdrawals.',
    history: 'Browse historical withdrawals.',
    auctions: 'Manage cars for live auctions.'
  };

  return (
    <div className="container mx-auto py-8 px-4 md:px-6 bg-background">
        <header className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
            <p className="text-muted-foreground">Manage withdrawals, users, and auctions.</p>
        </header>

        <main className="grid grid-cols-1 gap-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                    <Card>
                        <Tabs value={activeTab} onValueChange={setActiveTab}>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <CardTitle className="flex items-center gap-2"><Shield/> Management</CardTitle>
                                    <TabsList>
                                        <TabsTrigger value="pending">Pending</TabsTrigger>
                                        <TabsTrigger value="history">History</TabsTrigger>
                                        <TabsTrigger value="auctions">Auctions</TabsTrigger>
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
                             <TabsContent value="auctions">
                                <CardContent>
                                    <div className="flex justify-end mb-4">
                                        <AuctionCarDialog>
                                            <Button><Gavel className="mr-2" /> Add New Auction Car</Button>
                                        </AuctionCarDialog>
                                    </div>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Car</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead>Start Time</TableHead>
                                                <TableHead>Current Bid</TableHead>
                                                <TableHead className="text-right">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {areAuctionsLoading ? (
                                                 <TableRow><TableCell colSpan={5}><Skeleton className="h-8 w-full" /></TableCell></TableRow>
                                            ) : auctionCars && auctionCars.length > 0 ? (
                                                auctionCars.map(car => (
                                                    <TableRow key={car.id}>
                                                        <TableCell className="font-medium">{car.title}</TableCell>
                                                        <TableCell><Badge variant={car.status === 'live' ? 'destructive' : 'secondary'}>{car.status}</Badge></TableCell>
                                                        <TableCell>{formatDateTime(car.startTime)}</TableCell>
                                                        <TableCell>{formatCurrency(car.currentBid)}</TableCell>
                                                        <TableCell className="text-right space-x-2">
                                                            <AuctionCarDialog car={car}>
                                                                <Button variant="outline" size="sm">Edit</Button>
                                                            </AuctionCarDialog>
                                                             <AlertDialog>
                                                                <AlertDialogTrigger asChild>
                                                                    <Button variant="destructive" size="sm">Delete</Button>
                                                                </AlertDialogTrigger>
                                                                <AlertDialogContent>
                                                                    <AlertDialogHeader>
                                                                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                                        <AlertDialogDescription>This will permanently delete the auction for '{car.title}'.</AlertDialogDescription>
                                                                    </AlertDialogHeader>
                                                                    <AlertDialogFooter>
                                                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                        <AlertDialogAction onClick={() => handleDeleteAuctionCar(car.id)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                                                                    </AlertDialogFooter>
                                                                </AlertDialogContent>
                                                            </AlertDialog>
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            ) : (
                                                <TableRow>
                                                    <TableCell colSpan={5} className="h-24 text-center">No auction cars found.</TableCell>
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
                                    {recentUsers && recentUsers.map(user => (
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

  const authStatus = useMemo(() => {
    if (isUserLoading || (user && isProfileLoading)) {
      return 'loading';
    }
    if (!user) {
      // This case is handled by the useEffect redirect, but we keep it for clarity.
      return 'unauthorized';
    }
    const isHardcodedAdmin = user.email === 'rajmycarvalue@gmail.com';
    const isRoleAdmin = userProfile?.role === 'Admin';

    if (isHardcodedAdmin || isRoleAdmin) {
      return 'authorized';
    }

    return 'unauthorized';
  }, [user, isUserLoading, userProfile, isProfileLoading]);


  if (authStatus === 'loading') {
    return <AdminPageLoader />;
  }

  if (authStatus === 'authorized') {
    return <AdminDashboard />;
  }

  // 'unauthorized' is the only remaining status
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
