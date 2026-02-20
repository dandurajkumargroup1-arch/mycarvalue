
'use client';

import { useMemo, useState, useEffect } from 'react';
import { collection, query, orderBy } from 'firebase/firestore';
import { useFirestore, useCollection, useUser } from '@/firebase';
import { formatCurrency, formatDateTime } from '@/lib/utils';
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
import { Flame, MapPin, Calendar, Gauge, Fuel, Zap, Sparkles, User, Phone, Search, LogIn, Lock } from 'lucide-react';

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
    const router = useRouter();

    const [stateFilter, setStateFilter] = useState<string>('all');
    const [cityFilter, setCityFilter] = useState<string>('');
    const [areaFilter, setAreaFilter] = useState<string>('');
    const [typeFilter, setTypeFilter] = useState<string>('all');

    const freshCarsQuery = useMemo(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'dailyFreshCars'), orderBy('createdAt', 'desc'));
    }, [firestore]);

    const { data: rawCars, isLoading, error } = useCollection<DailyFreshCar>(freshCarsQuery);

    const filteredCars = useMemo(() => {
        if (!rawCars) return [];
        return rawCars.filter(car => {
            const matchesState = stateFilter === 'all' || car.state === stateFilter;
            const matchesCity = !cityFilter || car.city.toLowerCase().includes(cityFilter.toLowerCase());
            const matchesArea = !areaFilter || car.area.toLowerCase().includes(areaFilter.toLowerCase());
            const matchesType = typeFilter === 'all' || 
                               (typeFilter === 'direct' && car.isDirectOwner) ||
                               (typeFilter === 'dealer' && !car.isDirectOwner);
            return matchesState && matchesCity && matchesArea && matchesType;
        });
    }, [rawCars, stateFilter, cityFilter, areaFilter, typeFilter]);

    if (!isUserLoading && !user) {
        return (
            <div className="container mx-auto py-20 px-4 flex flex-col items-center justify-center text-center">
                <div className="h-20 w-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                    <Lock className="h-10 w-10 text-primary" />
                </div>
                <h1 className="text-3xl font-bold mb-4">Browse Daily Fresh Cars</h1>
                <p className="text-muted-foreground max-w-md mb-8">
                    To maintain privacy and provide direct owner access, please login or register to browse daily fresh listings.
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
                <p className="text-destructive">Failed to load fresh cars. Please try again later.</p>
            </div>
        );
    }

    return (
        <div className="bg-background min-h-screen">
            <div className="container mx-auto py-12 px-4 md:px-6">
                <header className="mb-12 text-center">
                    <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1 text-sm font-medium text-primary mb-4">
                        <Flame className="h-4 w-4" />
                        Fresh Picks
                    </div>
                    <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl mb-4">
                        Daily Fresh Cars
                    </h1>
                    <p className="text-muted-foreground md:text-xl max-w-2xl mx-auto mb-8">
                        Hand-picked vehicles listed within the last 24 hours. Verified value, AI-analyzed insights.
                    </p>

                    {/* Filters */}
                    <Card className="max-w-5xl mx-auto p-4 md:p-6 bg-muted/20 border-secondary/50">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                            <div className="space-y-2 text-left">
                                <label className="text-xs font-semibold uppercase text-muted-foreground">State</label>
                                <Select value={stateFilter} onValueChange={setStateFilter}>
                                    <SelectTrigger><SelectValue placeholder="Select State" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All States</SelectItem>
                                        {indianStates.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2 text-left">
                                <label className="text-xs font-semibold uppercase text-muted-foreground">City</label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input 
                                        className="pl-9" 
                                        placeholder="Search city..." 
                                        value={cityFilter}
                                        onChange={(e) => setCityFilter(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2 text-left">
                                <label className="text-xs font-semibold uppercase text-muted-foreground">Area</label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input 
                                        className="pl-9" 
                                        placeholder="Search area..." 
                                        value={areaFilter}
                                        onChange={(e) => setAreaFilter(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2 text-left">
                                <label className="text-xs font-semibold uppercase text-muted-foreground">Seller Type</label>
                                <Select value={typeFilter} onValueChange={setTypeFilter}>
                                    <SelectTrigger><SelectValue placeholder="All Sellers" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Sellers</SelectItem>
                                        <SelectItem value="direct">Direct Owner</SelectItem>
                                        <SelectItem value="dealer">Dealers</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </Card>
                </header>

                {isLoading || isUserLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[1, 2, 3].map(i => <Skeleton key={i} className="h-[500px] w-full rounded-xl" />)}
                    </div>
                ) : filteredCars.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {filteredCars.map((car) => (
                            <Card key={car.id} className="overflow-hidden group hover:shadow-xl transition-all border-secondary/50 flex flex-col">
                                <div className="relative aspect-video">
                                    <Image
                                        src={car.imageUrl}
                                        alt={car.title}
                                        fill
                                        className="object-cover transition-transform group-hover:scale-105"
                                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                    />
                                    <div className="absolute top-3 left-3 flex gap-2">
                                        <Badge className="bg-primary text-primary-foreground font-bold uppercase">Fresh</Badge>
                                        {car.isDirectOwner && <Badge className="bg-green-600 text-white font-bold uppercase">Direct Owner</Badge>}
                                    </div>
                                </div>
                                <CardHeader className="p-5 pb-2">
                                    <div className="flex justify-between items-start mb-2">
                                        <CardTitle className="text-xl line-clamp-1">{car.title}</CardTitle>
                                        <p className="text-xl font-bold text-primary">{formatCurrency(car.price)}</p>
                                    </div>
                                    <div className="flex items-center text-sm text-muted-foreground gap-1">
                                        <MapPin className="h-3 w-3" /> {car.area}, {car.city}, {car.state}
                                    </div>
                                </CardHeader>
                                <CardContent className="px-5 pb-4 flex-grow">
                                    <div className="grid grid-cols-2 gap-y-3 text-sm mb-6">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="h-4 w-4 text-muted-foreground" />
                                            <span>{car.year} Model</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Gauge className="h-4 w-4 text-muted-foreground" />
                                            <span>{car.km.toLocaleString()} km</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Fuel className="h-4 w-4 text-muted-foreground" />
                                            <span className="capitalize">{car.fuelType}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Zap className="h-4 w-4 text-muted-foreground" />
                                            <span className="capitalize">{car.transmission}</span>
                                        </div>
                                    </div>
                                    
                                    <div className="p-4 bg-muted/50 rounded-lg border space-y-3">
                                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Contact Owner</p>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                                    <User className="h-4 w-4" />
                                                </div>
                                                <span className="font-medium">{car.ownerName}</span>
                                            </div>
                                            <Button variant="outline" size="sm" asChild className="h-8">
                                                <a href={`tel:${car.ownerPhone}`}>
                                                    <Phone className="mr-2 h-3 w-3" /> {car.ownerPhone}
                                                </a>
                                            </Button>
                                        </div>
                                    </div>

                                    {car.aiInsight && (
                                        <div className="mt-4 p-3 bg-primary/5 rounded-lg border border-primary/10">
                                            <p className="text-xs font-bold text-primary flex items-center gap-1 mb-1">
                                                <Sparkles className="h-3 w-3" /> AI INSIGHT
                                            </p>
                                            <p className="text-sm italic leading-snug">
                                                "{car.aiInsight}"
                                            </p>
                                        </div>
                                    )}
                                </CardContent>
                                <CardFooter className="p-5 pt-4 text-xs text-muted-foreground border-t bg-muted/20 mt-auto">
                                    Listed {formatDateTime(car.createdAt)}
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 bg-secondary/20 rounded-xl border border-dashed">
                        <Flame className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
                        <h2 className="text-xl font-semibold mb-2">No matching cars found</h2>
                        <p className="text-muted-foreground">Try adjusting your filters or check back later.</p>
                        <Button 
                            variant="link" 
                            className="mt-4"
                            onClick={() => {
                                setStateFilter('all');
                                setCityFilter('');
                                setAreaFilter('');
                                setTypeFilter('all');
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
