'use client';

import { Suspense, useEffect, useState, useMemo } from 'react';
import Image from 'next/image';
import { doc, collection, query, orderBy, collectionGroup } from 'firebase/firestore';
import { useUser, useFirestore, useDoc, useCollection } from '@/firebase';
import type { UserProfile } from '@/lib/firebase/user-profile-service';
import { approveWithdrawal, rejectWithdrawal } from '@/lib/firebase/withdrawal-service';
import { deleteUser } from '@/lib/firebase/user-profile-service';
import { upsertFreshCar, deleteFreshCar } from '@/lib/firebase/fresh-car-service';
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
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

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
import { AlertTriangle, Shield, Users, Wallet, Calendar as CalendarIcon, Download, Trash2, Plus, Edit, Car, History, FileText } from 'lucide-react';
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
        defaultValues: car ? { ...car, aiInsight: car.aiInsight || '' } : {
            title: '', imageUrl: '', price: 500000, state: '', city: '', area: '', ownerName: '', ownerPhone: '', ownerWhatsapp: '', ownership: '1st', isDirectOwner: true, year: new Date().getFullYear(), km: 50000, fuelType: 'petrol', transmission: 'manual', aiInsight: '',
        }
    });

    const handleSave = async (data: FreshCarFormInput) => {
        if (!firestore) return;
        setIsSubmitting(true);
        try {
            await upsertFreshCar(firestore, { ...data, id: car?.id });
            toast({ title: "Success", description: car ? "Listing updated." : "Listing added." });
            setOpen(false);
        } catch (error) {
            toast({ variant: 'destructive', title: "Error" });
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
                <DialogHeader><DialogTitle>{car ? 'Edit Listing' : 'Add Hot Listing'}</DialogTitle></DialogHeader>
                <Form {...form}><form onSubmit={form.handleSubmit(handleSave)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField control={form.control} name="title" render={({ field }) => (<FormItem className="col-span-full"><FormLabel>Car Title</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="imageUrl" render={({ field }) => (<FormItem className="col-span-full"><FormLabel>Image URL</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="state" render={({ field }) => (
                            <FormItem><FormLabel>State</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent>{indianStates.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="city" render={({ field }) => (<FormItem><FormLabel>City</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="area" render={({ field }) => (<FormItem><FormLabel>Area</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="price" render={({ field }) => (<FormItem><FormLabel>Price</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="ownerName" render={({ field }) => (<FormItem><FormLabel>Owner</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="ownerPhone" render={({ field }) => (<FormItem><FormLabel>Phone</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="ownerWhatsapp" render={({ field }) => (<FormItem><FormLabel>WhatsApp</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="year" render={({ field }) => (<FormItem><FormLabel>Year</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="km" render={({ field }) => (<FormItem><FormLabel>KM</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
                    </div>
                    <FormField control={form.control} name="aiInsight" render={({ field }) => (<FormItem><FormLabel>Insight</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <DialogFooter><Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Saving...' : 'Save'}</Button></DialogFooter>
                </form></Form>
            </DialogContent>
        </Dialog>
    );
}

function AdminDashboard({ user }: { user: any }) {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('pending');
  const [isExporting, setIsExporting] = useState<string | null>(null);

  const usersQuery = useMemo(() => firestore ? query(collection(firestore, 'users')) : null, [firestore]);
  const { data: rawUsers } = useCollection<UserProfile>(usersQuery);
  const userMap = useMemo(() => rawUsers?.reduce((acc, u) => ({ ...acc, [u.id]: u }), {} as Record<string, UserProfile>) || {}, [rawUsers]);

  const requestsQuery = useMemo(() => firestore ? query(collectionGroup(firestore, 'withdrawalRequests')) : null, [firestore]);
  const { data: rawRequests } = useCollection<WithdrawalRequest>(requestsQuery);
  const pendingRequests = useMemo(() => rawRequests?.filter(r => r.status === 'requested') || [], [rawRequests]);

  const freshCarsQuery = useMemo(() => firestore ? query(collection(firestore, 'dailyFreshCars'), orderBy('createdAt', 'desc')) : null, [firestore]);
  const { data: freshCars } = useCollection<any>(freshCarsQuery);

  const handleDeleteFreshCar = async (id: string) => {
    if (!firestore) return;
    try { await deleteFreshCar(firestore, id); toast({ title: "Deleted" }); } catch (e) { toast({ variant: 'destructive', title: "Error" }); }
  };

  const handleDownloadPdf = async (car: any) => {
    setIsExporting(car.id);
    const root = document.createElement('div');
    root.style.cssText = 'position:fixed;top:-10000px;width:800px;background:white;padding:40px;font-family:sans-serif;color:#0f172a;';
    root.innerHTML = `<div style="border:2px solid #f9c70a;padding:30px;border-radius:8px;">
        <h1 style="font-size:28px;margin:0;">mycarvalue<span style="color:#f9c70a;">.in</span></h1>
        <p style="color:#64748b;margin-bottom:30px;">Premium Listing Summary</p>
        <h2 style="font-size:24px;margin-bottom:10px;">${car.year} ${car.title}</h2>
        <div style="background:#f9c70a;display:inline-block;padding:8px 16px;border-radius:6px;font-size:24px;font-weight:800;margin-bottom:30px;">${formatCurrency(car.price)}</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:30px;">
            <div style="background:#f8fafc;padding:15px;border-radius:6px;">KM: <b>${car.km.toLocaleString()}</b></div>
            <div style="background:#f8fafc;padding:15px;border-radius:6px;">Owner: <b>${car.ownership}</b></div>
            <div style="background:#f8fafc;padding:15px;border-radius:6px;">Fuel: <b>${car.fuelType}</b></div>
            <div style="background:#f8fafc;padding:15px;border-radius:6px;">Loc: <b>${car.city}</b></div>
        </div>
        ${car.aiInsight ? `<div style="border-left:4px solid #f9c70a;background:#fffbeb;padding:15px;"><i>"${car.aiInsight}"</i></div>` : ''}
        <p style="text-align:center;margin-top:40px;font-size:12px;color:#64748b;">Visit mycarvalue.in for contact details and full inspection report.</p>
    </div>`;
    document.body.appendChild(root);
    try {
        const canvas = await html2canvas(root, { scale: 2 });
        const pdf = new jsPDF('p', 'mm', 'a4');
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, 210, (canvas.height * 210) / canvas.width);
        pdf.save(`Listing-${car.title.replace(/\s+/g, '-')}.pdf`);
    } finally {
        document.body.removeChild(root);
        setIsExporting(null);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
        <header className="mb-8"><h1 className="text-3xl font-bold">Admin Panel</h1></header>
        <main className="grid grid-cols-1 gap-8">
            <Card><Tabs value={activeTab} onValueChange={setActiveTab}>
                <CardHeader className="flex flex-row justify-between items-center"><CardTitle>Management</CardTitle><TabsList><TabsTrigger value="pending">Withdrawals</TabsTrigger><TabsTrigger value="freshCars">Hot Listings</TabsTrigger></TabsList></CardHeader>
                <TabsContent value="pending"><CardContent><Table><TableHeader><TableRow><TableHead>User</TableHead><TableHead>Amount</TableHead><TableHead className="text-right">Action</TableHead></TableRow></TableHeader>
                    <TableBody>{pendingRequests.map(r => (
                        <TableRow key={r.id}><TableCell>{userMap[r.userId]?.displayName || r.userId}</TableCell><TableCell>{formatCurrency(r.amount)}</TableCell><TableCell className="text-right"><Button size="sm" onClick={() => approveWithdrawal(firestore!, r.userId, r.id, 'MANUAL_PAID')}>Paid</Button></TableCell></TableRow>
                    ))}</TableBody></Table></CardContent></TabsContent>
                <TabsContent value="freshCars"><CardContent><div className="flex justify-end mb-4"><FreshCarDialog /></div><Table><TableHeader><TableRow><TableHead>Car</TableHead><TableHead>Price</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                    <TableBody>{freshCars?.map(car => (
                        <TableRow key={car.id}><TableCell>{car.title}</TableCell><TableCell>{formatCurrency(car.price)}</TableCell><TableCell className="text-right flex justify-end gap-1">
                            <Button variant="ghost" size="icon" onClick={() => handleDownloadPdf(car)} disabled={isExporting === car.id}><FileText className={cn("h-4 w-4", isExporting === car.id && "animate-pulse")}/></Button>
                            <FreshCarDialog car={car} /><Button variant="ghost" size="icon" onClick={() => handleDeleteFreshCar(car.id)}><Trash2 className="h-4 w-4 text-destructive"/></Button>
                        </TableCell></TableRow>
                    ))}</TableBody></Table></CardContent></TabsContent>
            </Tabs></Card>
        </main>
    </div>
  );
}

export default function AdminPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const userProfileRef = useMemo(() => (firestore && user) ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
  const { data: profile } = useDoc<UserProfile>(userProfileRef);

  useEffect(() => { if (!isUserLoading && !user) router.push('/login'); }, [user, isUserLoading, router]);
  if (!user || (user.email !== 'rajmycarvalue@gmail.com' && profile?.role !== 'Admin')) return <div className="p-20 text-center">Unauthorized</div>;
  return <AdminDashboard user={user} />;
}
