'use client';

import { useMemo, useState, useEffect } from 'react';
import { doc, collection, query, orderBy } from 'firebase/firestore';
import { useFirestore, useCollection, useUser, useDoc } from '@/firebase';
import { formatCurrency, formatDateTime, toDate } from '@/lib/utils';
import { indianStates } from '@/lib/variants';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Flame, MapPin, Calendar as CalendarIcon, Gauge, Fuel, Zap, Sparkles, User, Phone, Search, LogIn, Lock, Image as ImageIcon, ExternalLink, MessageCircle, Coins, Share2, Eye } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { DateRange } from "react-day-picker";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import type { UserProfile } from '@/lib/firebase/user-profile-service';
import { unlockCarListing } from '@/lib/firebase/user-profile-service';
import { useToast } from '@/hooks/use-toast';

interface DailyFreshCar {
    id: string;
    title: string;
    imageUrl: string;
    price: number;
    state: string;
    city: string;
    area: string;
    ownerName: string;
    ownerPhone: string;
    ownerWhatsapp: string;
    ownership: string;
    isDirectOwner: boolean;
    year: number;
    km: number;
    fuelType: string;
    transmission: string;
    aiInsight?: string;
    createdAt: any;
}

export default function DailyFreshCarsPage() {
    const firestore = useFirestore();
    const { user, isUserLoading } = useUser();
    const { toast } = useToast();
    const router = useRouter();
    const [hasMounted, setHasMounted] = useState(false);
    const [unlockingId, setUnlockingId] = useState<string | null>(null);

    useEffect(() => {
        setHasMounted(true);
    }, []);

    const userProfileRef = useMemo(() => {
        if (!firestore || !user) return null;
        return doc(firestore, 'users', user.uid);
    }, [firestore, user]);
    const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userProfileRef);

    const [stateFilter, setStateFilter] = useState<string>('all');
    const [cityFilter, setCityFilter] = useState<string>('all');
    const [areaFilter, setAreaFilter] = useState<string>('all');
    const [typeFilter, setTypeFilter] = useState<string>('all');
    const [dateRange, setDateRange] = useState<DateRange | undefined>();

    const freshCarsQuery = useMemo(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'dailyFreshCars'), orderBy('createdAt', 'desc'));
    }, [firestore]);

    const { data: rawCars, isLoading, error } = useCollection<DailyFreshCar>(freshCarsQuery);

    const availableCities = useMemo(() => {
        if (!rawCars) return [];
        let carsInState = rawCars;
        if (stateFilter !== 'all') {
            carsInState = carsInState.filter(car => car.state === stateFilter);
        }
        return Array.from(new Set(carsInState.map(car => car.city))).sort();
    }, [rawCars, stateFilter]);

    const availableAreas = useMemo(() => {
        if (!rawCars) return [];
        let carsInCity = rawCars;
        if (stateFilter !== 'all') {
            carsInCity = carsInCity.filter(car => car.state === stateFilter);
        }
        if (cityFilter !== 'all') {
            carsInCity = carsInCity.filter(car => car.city === cityFilter);
        }
        return Array.from(new Set(carsInCity.map(car => car.area))).sort();
    }, [rawCars, stateFilter, cityFilter]);

    useEffect(() => {
        setCityFilter('all');
        setAreaFilter('all');
    }, [stateFilter]);

    useEffect(() => {
        setAreaFilter('all');
    }, [cityFilter]);

    const filteredCars = useMemo(() => {
        if (!rawCars) return [];
        return rawCars.filter(car => {
            const matchesState = stateFilter === 'all' || car.state === stateFilter;
            const matchesCity = cityFilter === 'all' || car.city === cityFilter;
            const matchesArea = areaFilter === 'all' || car.area === areaFilter;
            const matchesType = typeFilter === 'all' || 
                               (typeFilter === 'direct' && car.isDirectOwner) ||
                               (typeFilter === 'dealer' && !car.isDirectOwner);
            
            const matchesDate = !dateRange?.from || (() => {
                const carDate = toDate(car.createdAt);
                if (!carDate) return false;
                const from = dateRange.from;
                const to = dateRange.to ? new Date(dateRange.to) : new Date(from);
                to.setHours(23, 59, 59, 999);
                return carDate >= from && carDate <= to;
            })();

            return matchesState && matchesCity && matchesArea && matchesType && matchesDate;
        });
    }, [rawCars, stateFilter, cityFilter, areaFilter, typeFilter, dateRange]);

    useEffect(() => {
        if (hasMounted && !isLoading && rawCars) {
            const params = new URLSearchParams(window.location.search);
            const carId = params.get('id');
            if (carId) {
                const element = document.getElementById(`car-${carId}`);
                if (element) {
                    setTimeout(() => {
                        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        element.classList.add('ring-4', 'ring-primary', 'ring-offset-4', 'transition-all', 'duration-1000');
                        setTimeout(() => element.classList.remove('ring-4', 'ring-primary', 'ring-offset-4'), 4000);
                    }, 800);
                }
            }
        }
    }, [hasMounted, isLoading, rawCars]);

    const handleUnlock = async (carId: string) => {
        if (!firestore || !user || !userProfile) return;
        
        if ((userProfile.credits || 0) < 1) {
            toast({
                variant: "destructive",
                title: "Insufficient Credits",
                description: "You need 1 credit to unlock this listing. Please top up in your dashboard.",
                action: <Button asChild size="sm" variant="outline"><Link href="/dashboard">Buy Credits</Link></Button>
            });
            return;
        }

        setUnlockingId(carId);
        try {
            await unlockCarListing(firestore, user.uid, carId);
            toast({ title: "Unlocked!", description: "Listing details are now visible." });
        } catch (err) {
            toast({ variant: "destructive", title: "Error", description: "Failed to unlock listing." });
        } finally {
            setUnlockingId(null);
        }
    };

    const handleShare = (car: DailyFreshCar) => {
        const shareUrl = `${window.location.origin}/daily-fresh-cars?id=${car.id}`;
        const shareText = `Check out this ${car.year} ${car.title} for ${formatCurrency(car.price)} on mycarvalue.in!`;

        if (typeof navigator !== 'undefined' && navigator.share) {
            navigator.share({
                title: car.title,
                text: shareText,
                url: shareUrl,
            }).catch(() => {
                navigator.clipboard.writeText(shareUrl);
                toast({ title: "Link Copied!", description: "Listing link copied to clipboard." });
            });
        } else {
            navigator.clipboard.writeText(shareUrl);
            toast({ title: "Link Copied!", description: "Listing link copied to clipboard." });
        }
    };

    if (!hasMounted || isUserLoading) {
        return (
            <div className="container mx-auto py-12 px-4 md:px-6 bg-background">
                <div className="text-center mb-12">
                    <Skeleton className="h-12 w-64 mb-4 mx-auto" />
                    <Skeleton className="h-6 w-96 mx-auto" />
                </div>
                <div className="space-y-6 max-w-4xl mx-auto">
                    {[1, 2, 3].map(i => (
                        <Card key={i} className="overflow-hidden">
                            <div className="flex flex-col md:flex-row p-5 gap-6">
                                <div className="flex-grow space-y-4">
                                    <Skeleton className="h-6 w-3/4" />
                                    <Skeleton className="h-4 w-1/2" />
                                    <Skeleton className="h-12 w-full" />
                                </div>
                                <Skeleton className="h-32 w-full md:w-48 rounded" />
                            </div>
                        </Card>
                    ))}
                </div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="container mx-auto py-20 px-4 flex flex-col items-center justify-center text-center">
                <div className="h-20 w-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                    <Lock className="h-10 w-10 text-primary" />
                </div>
                <h1 className="text-3xl font-bold mb-4">Browse Hot Market Listings</h1>
                <p className="text-muted-foreground max-w-md mb-8">
                    To maintain privacy and provide direct owner access, please login or register to browse these exclusive listings.
                </p>
                <div className="flex gap-4">
                    <Button asChild size="lg">
                        <Link href="/login?redirect=/daily-fresh-cars"><LogIn className="mr-2 h-4 w-4" /> Login to View</Link>
                    </Button>
                    <Button asChild variant="outline" size="lg">
                        <Link href="/register">Register Now</Link>
                    </Button>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container mx-auto py-20 text-center">
                <p className="text-destructive">Failed to load listings. Please try again later.</p>
            </div>
        );
    }

    return (
        <div className="bg-background min-h-screen">
            <div className="container mx-auto py-12 px-4 md:px-6">
                <header className="mb-12 text-center">
                    <div className="flex justify-center mb-4">
                        <div className="inline-flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full border border-primary/20">
                            <Coins className="h-4 w-4 text-primary" />
                            <span className="text-sm font-bold text-primary">{userProfile?.credits || 0} Credits Available</span>
                        </div>
                    </div>
                    <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1 text-sm font-medium text-primary mb-4">
                        <Flame className="h-4 w-4" />
                        Hot Deals
                    </div>
                    <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl mb-4">
                        Hot Market Listings
                    </h1>
                    <p className="text-muted-foreground md:text-xl max-w-2xl mx-auto mb-8">
                        Hand-picked vehicles and direct-owner deals. The best listings in the market, updated daily.
                    </p>

                    <Card className="max-w-6xl mx-auto p-4 md:p-6 bg-muted/20 border-secondary/50 shadow-sm">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
                            <div className="space-y-2 text-left">
                                <label className="text-xs font-semibold uppercase text-muted-foreground ml-1">State</label>
                                <Select value={stateFilter} onValueChange={setStateFilter}>
                                    <SelectTrigger className="bg-background"><SelectValue placeholder="Select State" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All States</SelectItem>
                                        {indianStates.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2 text-left">
                                <label className="text-xs font-semibold uppercase text-muted-foreground ml-1">City</label>
                                <Select value={cityFilter} onValueChange={setCityFilter} disabled={stateFilter === 'all'}>
                                    <SelectTrigger className="bg-background"><SelectValue placeholder={stateFilter === 'all' ? "Select State first" : "All Cities"} /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Cities</SelectItem>
                                        {availableCities.map(city => <SelectItem key={city} value={city}>{city}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2 text-left">
                                <label className="text-xs font-semibold uppercase text-muted-foreground ml-1">Area</label>
                                <Select value={areaFilter} onValueChange={setAreaFilter} disabled={cityFilter === 'all'}>
                                    <SelectTrigger className="bg-background"><SelectValue placeholder={cityFilter === 'all' ? "Select City first" : "All Areas"} /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Areas</SelectItem>
                                        {availableAreas.map(area => <SelectItem key={area} value={area}>{area}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2 text-left">
                                <label className="text-xs font-semibold uppercase text-muted-foreground ml-1">Seller Type</label>
                                <Select value={typeFilter} onValueChange={setTypeFilter}>
                                    <SelectTrigger className="bg-background"><SelectValue placeholder="All Sellers" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Sellers</SelectItem>
                                        <SelectItem value="direct">Direct Owner</SelectItem>
                                        <SelectItem value="dealer">Dealers</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2 text-left">
                                <label className="text-xs font-semibold uppercase text-muted-foreground ml-1">Listing Date</label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant={"outline"}
                                            className={cn(
                                                "w-full justify-start text-left font-normal bg-background",
                                                !dateRange && "text-muted-foreground"
                                            )}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {dateRange?.from ? (
                                                dateRange.to ? (
                                                    <>{format(dateRange.from, "LLL dd")} - {format(dateRange.to, "LLL dd")}</>
                                                ) : format(dateRange.from, "LLL dd")
                                            ) : <span>Select range</span>}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            initialFocus
                                            mode="range"
                                            defaultMonth={dateRange?.from}
                                            selected={dateRange}
                                            onSelect={setDateRange}
                                            numberOfMonths={2}
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>
                        </div>
                    </Card>
                </header>

                {isLoading ? (
                    <div className="space-y-6 max-w-4xl mx-auto">
                        {[1, 2, 3].map(i => <Skeleton key={i} className="h-40 w-full rounded-xl" />)}
                    </div>
                ) : filteredCars.length > 0 ? (
                    <div className="space-y-4 max-w-4xl mx-auto">
                        {filteredCars.map((car) => {
                            const isUnlocked = userProfile?.unlockedCars?.includes(car.id) || userProfile?.role === 'Admin';
                            
                            return (
                                <Card key={car.id} id={`car-${car.id}`} className="overflow-hidden group hover:shadow-md transition-all border-secondary/50">
                                    <div className="flex flex-col md:flex-row p-5 gap-6">
                                        <div className="flex-grow space-y-4 order-2 md:order-1">
                                            <div className="flex flex-wrap justify-between items-start gap-4">
                                                <div>
                                                    <CardTitle className="text-xl mb-1">{car.title}</CardTitle>
                                                    <div className="flex items-center text-sm text-muted-foreground gap-1">
                                                        <MapPin className="h-3 w-3" /> {car.area}, {car.city}, {car.state}
                                                    </div>
                                                </div>
                                                <div className="flex flex-col items-end">
                                                    <p className="text-2xl font-bold text-primary">{formatCurrency(car.price)}</p>
                                                    <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
                                                        Best Market Value
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 text-sm bg-secondary/30 p-3 rounded-lg border border-secondary/50">
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Year</span>
                                                    <div className="flex items-center gap-2">
                                                        <CalendarIcon className="h-3.5 w-3.5 text-primary" />
                                                        <span className="font-medium">{car.year}</span>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Kilometers</span>
                                                    <div className="flex items-center gap-2">
                                                        <Gauge className="h-3.5 w-3.5 text-primary" />
                                                        <span className="font-medium">{car.km.toLocaleString()} km</span>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Ownership</span>
                                                    <div className="flex items-center gap-2">
                                                        <User className="h-3.5 w-3.5 text-primary" />
                                                        <span className="font-medium">{car.ownership} Owner</span>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Fuel</span>
                                                    <div className="flex items-center gap-2">
                                                        <Fuel className="h-3.5 w-3.5 text-primary" />
                                                        <span className="font-medium capitalize">{car.fuelType}</span>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Gearbox</span>
                                                    <div className="flex items-center gap-2">
                                                        <Zap className="h-3.5 w-3.5 text-primary" />
                                                        <span className="font-medium capitalize">{car.transmission}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                                                {isUnlocked ? (
                                                    <div className="flex items-center gap-4">
                                                        <div className="flex items-center gap-2">
                                                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                                                <User className="h-4 w-4" />
                                                            </div>
                                                            <span className="font-semibold text-sm">{car.ownerName}</span>
                                                        </div>
                                                        <div className="flex gap-2">
                                                            <Button variant="outline" size="sm" asChild className="h-8 border-primary/20 hover:bg-primary/10 hover:text-primary">
                                                                <a href={`tel:${car.ownerPhone}`}>
                                                                    <Phone className="mr-2 h-3.5 w-3.5" /> {car.ownerPhone}
                                                                </a>
                                                            </Button>
                                                            <Button variant="outline" size="sm" asChild className="h-8 border-green-600/20 text-green-600 hover:bg-green-600/10 hover:text-green-600">
                                                                <a href={`https://wa.me/91${car.ownerWhatsapp}?text=Hi, I am interested in your ${car.title} listed on mycarvalue.in`} target="_blank" rel="noopener noreferrer">
                                                                    <MessageCircle className="mr-2 h-3.5 w-3.5" /> WhatsApp
                                                                </a>
                                                            </Button>
                                                            <Button variant="ghost" size="sm" onClick={() => handleShare(car)} className="h-8 text-muted-foreground hover:text-primary gap-2">
                                                                <Share2 className="h-3.5 w-3.5" /> Share
                                                            </Button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-3 p-2 bg-muted/50 rounded-lg border border-dashed flex-grow md:flex-grow-0">
                                                        <Lock className="h-4 w-4 text-muted-foreground" />
                                                        <div className="text-xs text-muted-foreground">
                                                            <p className="font-bold text-foreground">Contact Details Locked</p>
                                                            <p>Unlock to see name and phone number.</p>
                                                        </div>
                                                        <div className="flex items-center gap-2 ml-auto">
                                                            <Button 
                                                                size="sm" 
                                                                className="gap-2"
                                                                onClick={() => handleUnlock(car.id)}
                                                                disabled={unlockingId === car.id}
                                                            >
                                                                <Sparkles className="h-3.5 w-3.5" /> {unlockingId === car.id ? 'Unlocking...' : 'Unlock (1 Credit)'}
                                                            </Button>
                                                            <Button variant="ghost" size="icon" onClick={() => handleShare(car)} className="h-8 w-8 text-muted-foreground hover:text-primary">
                                                                <Share2 className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                )}
                                                <span className="text-[10px] text-muted-foreground">
                                                    Updated {formatDateTime(car.createdAt)}
                                                </span>
                                            </div>

                                            {car.aiInsight && (
                                                <div className="p-3 bg-primary/5 rounded-lg border border-primary/10 relative overflow-hidden">
                                                    <div className="absolute top-0 right-0 p-1">
                                                        <Sparkles className="h-3 w-3 text-primary/30" />
                                                    </div>
                                                    <p className="text-[10px] font-bold text-primary mb-1 uppercase tracking-tight">
                                                        Market Insight
                                                    </p>
                                                    <p className="text-xs italic leading-snug text-foreground/80">
                                                        "{car.aiInsight}"
                                                    </p>
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex-shrink-0 w-full md:w-48 space-y-3 order-1 md:order-2">
                                            <div className="relative aspect-video rounded border bg-muted/50 overflow-hidden flex flex-col items-center justify-center p-4 text-center">
                                                {isUnlocked ? (
                                                    <>
                                                        <Image 
                                                            src={car.imageUrl} 
                                                            alt={car.title} 
                                                            fill 
                                                            className="object-cover"
                                                        />
                                                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <a 
                                                                href={car.imageUrl} 
                                                                target="_blank" 
                                                                rel="noopener noreferrer" 
                                                                className="text-white font-bold text-xs flex items-center gap-1.5 hover:underline bg-background/20 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/30 shadow-xl"
                                                            >
                                                                <Eye className="h-4 w-4" /> View
                                                            </a>
                                                        </div>
                                                    </>
                                                ) : (
                                                    <div className="relative w-full h-full flex flex-col items-center justify-center">
                                                        <Image 
                                                            src={car.imageUrl} 
                                                            alt={car.title} 
                                                            fill 
                                                            className="object-cover blur-xl grayscale"
                                                        />
                                                        <div className="relative z-10 space-y-1">
                                                            <ImageIcon className="h-6 w-6 text-white mx-auto drop-shadow-md" />
                                                            <p className="text-[10px] font-bold text-white uppercase drop-shadow-md">Photo Locked</p>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                            {car.isDirectOwner && (
                                                <Badge className="w-full justify-center bg-green-600/10 text-green-600 border-green-600/20 font-bold uppercase py-1">
                                                    Direct Owner
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                </Card>
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-center py-20 bg-secondary/20 rounded-xl border border-dashed">
                        <Flame className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
                        <h2 className="text-xl font-semibold mb-2">No matching listings found</h2>
                        <p className="text-muted-foreground">Try adjusting your filters or check back later.</p>
                        <Button 
                            variant="link" 
                            className="mt-4"
                            onClick={() => {
                                setStateFilter('all');
                                setCityFilter('all');
                                setAreaFilter('all');
                                setTypeFilter('all');
                                setDateRange(undefined);
                            }}
                        >
                            Reset all filters
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
