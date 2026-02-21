'use client';

import { Suspense, useEffect, useState, useMemo } from 'react';
import Image from 'next/image';
import { doc, collection, query, orderBy, collectionGroup, where } from 'firebase/firestore';
import { useUser, useFirestore, useDoc, useCollection } from '@/firebase';
import type { UserProfile } from '@/lib/firebase/user-profile-service';
import { approveWithdrawal, rejectWithdrawal } from '@/lib/firebase/withdrawal-service';
import { deleteUser, addCredits } from '@/lib/firebase/user-profile-service';
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/table';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle, Shield, Users, Wallet, Calendar as CalendarIcon, Download, Trash2, Plus, Edit, Car, History, FileText, Coins, Search, UserCheck } from 'lucide-react';
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
            ...car, 
            aiInsight: car.aiInsight || '',
            isDirectOwner: car.isDirectOwner ?? true
        } : {
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
                        <FormField control={form.control} name="price" render={({ field }) => (<FormItem><FormLabel>Price (INR)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
                        
                        <FormField control={form.control} name="year" render={({ field }) => (<FormItem><FormLabel>Year</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="km" render={({ field }) => (<FormItem><FormLabel>Kilometers (KM)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
                        
                        <FormField control={form.control} name="fuelType" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Fuel Type</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                    <SelectContent>
                                        <SelectItem value="petrol">Petrol</SelectItem>
                                        <SelectItem value="diesel">Diesel</SelectItem>
                                        <SelectItem value="cng">CNG</SelectItem>
                                        <SelectItem value="electric">Electric</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <FormField control={form.control} name="transmission" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Transmission</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                    <SelectContent>
                                        <SelectItem value="manual">Manual</SelectItem>
                                        <SelectItem value="automatic">Automatic</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )} />
                        
                        <FormField control={form.control} name="ownership" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Ownership</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                    <SelectContent>
                                        <SelectItem value="1st">1st Owner</SelectItem>
                                        <SelectItem value="2nd">2nd Owner</SelectItem>
                                        <SelectItem value="3rd">3rd Owner</SelectItem>
                                        <SelectItem value="4th+">4th+ Owner</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )} />
                        
                        <FormField control={form.control} name="isDirectOwner" render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                                <div className="space-y-0.5">
                                    <FormLabel>Direct Owner Listing</FormLabel>
                                </div>
                                <FormControl>
                                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                                </FormControl>
                            </FormItem>
                        )} />

                        <div className="col-span-full border-t pt-4 mt-2">
                             <h4 className="text-sm font-bold mb-4">Contact Details</h4>
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField control={form.control} name="ownerName" render={({ field }) => (<FormItem><FormLabel>Owner Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                                <FormField control={form.control} name="ownerPhone" render={({ field }) => (<FormItem><FormLabel>Phone Number</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                                <FormField control={form.control} name="ownerWhatsapp" render={({ field }) => (<FormItem><FormLabel>WhatsApp Number</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                             </div>
                        </div>
                    </div>
                    <FormField control={form.control} name="aiInsight" render={({ field }) => (<FormItem><FormLabel>Market Insight (Catchy 1-sentence description)</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <DialogFooter><Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Saving...' : 'Save Listing'}</Button></DialogFooter>
                </form></Form>
            </DialogContent>
        </Dialog>
    );
}

function UserManagementRow({ userProfile }: { userProfile: UserProfile }) {
    const firestore = useFirestore();
    const { toast } = useToast();
    const [isDeleting, setIsDeleting] = useState(false);
    const [addAmount, setAddAmount] = useState<string>("5");

    const handleAddCredits = async () => {
        if (!firestore) return;
        const amount = parseInt(addAmount);
        if (isNaN(amount) || amount === 0) return;
        
        try {
            await addCredits(firestore, userProfile.id, amount);
            toast({ title: "Credits Added", description: `${amount} credits added to ${userProfile.displayName}` });
            setAddAmount("5");
        } catch (e) {
            toast({ variant: 'destructive', title: "Error adding credits" });
        }
    };

    const handleDeleteUser = async () => {
        if (!firestore) return;
        setIsDeleting(true);
        try {
            await deleteUser(firestore, userProfile.id);
            toast({ title: "User Deleted" });
        } catch (e) {
            toast({ variant: 'destructive', title: "Error deleting user" });
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <TableRow>
            <TableCell>
                <div className="font-medium">{userProfile.displayName || 'No Name'}</div>
                <div className="text-xs text-muted-foreground">{userProfile.email}</div>
            </TableCell>
            <TableCell>
                <Badge variant="outline" className="text-[10px] uppercase font-bold">{userProfile.role}</Badge>
            </TableCell>
            <TableCell className="font-bold">
                <div className="flex items-center gap-1">
                    <Coins className="h-3 w-3 text-primary" />
                    {userProfile.credits || 0}
                </div>
            </TableCell>
            <TableCell>
                <div className="flex items-center gap-2">
                    <Input 
                        type="number" 
                        className="w-16 h-8 text-xs" 
                        value={addAmount} 
                        onChange={(e) => setAddAmount(e.target.value)}
                    />
                    <Button size="sm" variant="outline" className="h-8 text-xs" onClick={handleAddCredits}>
                        Add
                    </Button>
                </div>
            </TableCell>
            <TableCell className="text-right">
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" disabled={isDeleting}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Delete User Account?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This will permanently delete the user profile and all associated data (valuations, wallet). This action cannot be undone.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDeleteUser} className="bg-destructive">Delete User</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </TableCell>
        </TableRow>
    );
}

function AdminDashboard({ user }: { user: any }) {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('users');
  const [isExporting, setIsExporting] = useState<string | null>(null);
  const [userSearch, setUserSearch] = useState("");

  const usersQuery = useMemo(() => firestore ? query(collection(firestore, 'users'), orderBy('lastUpdatedAt', 'desc')) : null, [firestore]);
  const { data: rawUsers, isLoading: isUsersLoading } = useCollection<UserProfile>(usersQuery);
  const userMap = useMemo(() => rawUsers?.reduce((acc, u) => ({ ...acc, [u.id]: u }), {} as Record<string, UserProfile>) || {}, [rawUsers]);

  const filteredUsers = useMemo(() => {
    if (!rawUsers) return [];
    if (!userSearch) return rawUsers;
    const s = userSearch.toLowerCase();
    return rawUsers.filter(u => 
        (u.displayName?.toLowerCase().includes(s)) || 
        (u.email?.toLowerCase().includes(s)) ||
        (u.role?.toLowerCase().includes(s))
    );
  }, [rawUsers, userSearch]);

  const requestsQuery = useMemo(() => firestore ? collectionGroup(firestore, 'withdrawalRequests') : null, [firestore]);
  const { data: rawRequests } = useCollection<WithdrawalRequest>(requestsQuery);
  
  const sortedAndFilteredRequests = useMemo(() => {
    if (!rawRequests) return [];
    return rawRequests
        .filter(r => r.status === 'requested')
        .sort((a, b) => {
            const timeA = toDate(a.requestedAt)?.getTime() || 0;
            const timeB = toDate(b.requestedAt)?.getTime() || 0;
            return timeB - timeA;
        });
  }, [rawRequests]);

  const pendingRequests = sortedAndFilteredRequests;

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
        <header className="mb-8 flex justify-between items-center">
            <div>
                <h1 className="text-3xl font-bold">Admin Panel</h1>
                <p className="text-muted-foreground">Platform oversight and listing management.</p>
            </div>
            <Badge variant="secondary" className="px-3 py-1 bg-primary/10 text-primary border-primary/20">
                <Shield className="mr-2 h-4 w-4" /> Admin Access
            </Badge>
        </header>

        <main className="grid grid-cols-1 gap-8">
            <Card>
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <CardHeader className="flex flex-col md:flex-row justify-between items-start md:items-center border-b bg-muted/30 pb-4">
                        <TabsList className="bg-background border">
                            <TabsTrigger value="users"><Users className="mr-2 h-4 w-4" /> Users</TabsTrigger>
                            <TabsTrigger value="freshCars"><Car className="mr-2 h-4 w-4" /> Hot Listings</TabsTrigger>
                            <TabsTrigger value="pending" className="relative">
                                <Wallet className="mr-2 h-4 w-4" /> Withdrawals
                                {pendingRequests.length > 0 && (
                                    <span className="absolute -top-1 -right-1 h-4 w-4 bg-primary text-primary-foreground text-[10px] rounded-full flex items-center justify-center font-bold">
                                        {pendingRequests.length}
                                    </span>
                                )}
                            </TabsTrigger>
                        </TabsList>
                        
                        {activeTab === 'users' && (
                            <div className="relative w-full md:w-64 mt-4 md:mt-0">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input 
                                    placeholder="Search users..." 
                                    className="pl-8 bg-background" 
                                    value={userSearch} 
                                    onChange={(e) => setUserSearch(e.target.value)}
                                />
                            </div>
                        )}
                        {activeTab === 'freshCars' && <FreshCarDialog />}
                    </CardHeader>

                    <TabsContent value="users" className="mt-0">
                        <CardContent className="pt-6">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>User Details</TableHead>
                                        <TableHead>Role</TableHead>
                                        <TableHead>Credits</TableHead>
                                        <TableHead>Quick Add Credits</TableHead>
                                        <TableHead className="text-right">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isUsersLoading ? (
                                        [1, 2, 3].map(i => (
                                            <TableRow key={i}>
                                                <TableCell colSpan={5}><Skeleton className="h-12 w-full" /></TableCell>
                                            </TableRow>
                                        ))
                                    ) : filteredUsers.length > 0 ? (
                                        filteredUsers.map(u => <UserManagementRow key={u.id} userProfile={u} />)
                                    ) : (
                                        <TableRow><TableCell colSpan={5} className="h-24 text-center text-muted-foreground">No users found.</TableCell></TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </TabsContent>

                    <TabsContent value="pending" className="mt-0">
                        <CardContent className="pt-6">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>User</TableHead>
                                        <TableHead>Amount</TableHead>
                                        <TableHead>Details</TableHead>
                                        <TableHead className="text-right">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {pendingRequests.length > 0 ? pendingRequests.map(r => (
                                        <TableRow key={r.id}>
                                            <TableCell>
                                                <div className="font-medium">{userMap[r.userId]?.displayName || 'Unknown'}</div>
                                                <div className="text-xs text-muted-foreground">{userMap[r.userId]?.email || r.userId}</div>
                                            </TableCell>
                                            <TableCell className="font-bold text-primary">{formatCurrency(r.amount)}</TableCell>
                                            <TableCell className="text-xs">
                                                {r.upiId && <div className="text-[10px] font-mono">UPI: {r.upiId}</div>}
                                                {r.bankAccountNumber && <div className="text-[10px] font-mono">Bank: {r.bankAccountNumber} / {r.bankIfscCode}</div>}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button size="sm" onClick={() => approveWithdrawal(firestore!, r.userId, r.id, 'MANUAL_PAID')}>
                                                    <UserCheck className="mr-2 h-4 w-4" /> Mark Paid
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    )) : (
                                        <TableRow><TableCell colSpan={4} className="h-24 text-center text-muted-foreground">No pending requests.</TableCell></TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </TabsContent>

                    <TabsContent value="freshCars" className="mt-0">
                        <CardContent className="pt-6">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Listing</TableHead>
                                        <TableHead>Location</TableHead>
                                        <TableHead>Price</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {freshCars && freshCars.length > 0 ? freshCars.map(car => (
                                        <TableRow key={car.id}>
                                            <TableCell>
                                                <div className="font-medium">{car.title}</div>
                                                <div className="text-[10px] text-muted-foreground uppercase">{car.year} • {car.km.toLocaleString()} KM • {car.ownership}</div>
                                            </TableCell>
                                            <TableCell className="text-xs">
                                                {car.city}, {car.state}
                                            </TableCell>
                                            <TableCell className="font-bold">{formatCurrency(car.price)}</TableCell>
                                            <TableCell className="text-right flex justify-end gap-1">
                                                <Button variant="ghost" size="icon" onClick={() => handleDownloadPdf(car)} disabled={isExporting === car.id}>
                                                    <FileText className={cn("h-4 w-4", isExporting === car.id && "animate-pulse")}/>
                                                </Button>
                                                <FreshCarDialog car={car} />
                                                <Button variant="ghost" size="icon" onClick={() => handleDeleteFreshCar(car.id)}>
                                                    <Trash2 className="h-4 w-4 text-destructive"/>
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    )) : (
                                        <TableRow><TableCell colSpan={4} className="h-24 text-center text-muted-foreground">No listings added yet.</TableCell></TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </TabsContent>
                </Tabs>
            </Card>
        </main>
    </div>
  );
}

export default function AdminPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const userProfileRef = useMemo(() => (firestore && user) ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
  const { data: profile, isLoading: isProfileLoading } = useDoc<UserProfile>(userProfileRef);

  useEffect(() => { 
    if (!isUserLoading && !user) router.push('/login'); 
    else if (user && !isProfileLoading && user.email !== 'rajmycarvalue@gmail.com' && profile?.role !== 'Admin') {
        router.push('/dashboard');
    }
  }, [user, isUserLoading, router, profile, isProfileLoading]);

  if (isUserLoading || isProfileLoading) return <div className="p-20 text-center"><Skeleton className="h-12 w-64 mx-auto" /></div>;
  if (!user || (user.email !== 'rajmycarvalue@gmail.com' && profile?.role !== 'Admin')) return <div className="p-20 text-center">Unauthorized Access</div>;
  
  return <AdminDashboard user={user} />;
}
