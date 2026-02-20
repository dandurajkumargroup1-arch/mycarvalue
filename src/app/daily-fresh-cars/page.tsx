
'use client';

import { useMemo } from 'react';
import { collection, query, orderBy } from 'firebase/firestore';
import { useFirestore, useCollection } from '@/firebase';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Flame, MapPin, Calendar, Gauge, Fuel, Zap, Sparkles } from 'lucide-react';

interface DailyFreshCar {
    id: string;
    title: string;
    imageUrl: string;
    price: number;
    location: string;
    year: number;
    km: number;
    fuelType: string;
    transmission: string;
    aiInsight?: string;
    createdAt: any;
}

export default function DailyFreshCarsPage() {
    const firestore = useFirestore();

    const freshCarsQuery = useMemo(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'dailyFreshCars'), orderBy('createdAt', 'desc'));
    }, [firestore]);

    const { data: cars, isLoading, error } = useCollection<DailyFreshCar>(freshCarsQuery);

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
                    <p className="text-muted-foreground md:text-xl max-w-2xl mx-auto">
                        Hand-picked vehicles listed within the last 24 hours. Verified value, AI-analyzed insights.
                    </p>
                </header>

                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[1, 2, 3].map(i => <Skeleton key={i} className="h-[400px] w-full rounded-xl" />)}
                    </div>
                ) : cars && cars.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {cars.map((car) => (
                            <Card key={car.id} className="overflow-hidden group hover:shadow-xl transition-all border-secondary/50">
                                <div className="relative aspect-video">
                                    <Image
                                        src={car.imageUrl}
                                        alt={car.title}
                                        fill
                                        className="object-cover transition-transform group-hover:scale-105"
                                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                    />
                                    <div className="absolute top-3 left-3">
                                        <Badge className="bg-primary text-primary-foreground font-bold">FRESH</Badge>
                                    </div>
                                </div>
                                <CardHeader className="p-5">
                                    <div className="flex justify-between items-start mb-2">
                                        <CardTitle className="text-xl line-clamp-1">{car.title}</CardTitle>
                                        <p className="text-xl font-bold text-primary">{formatCurrency(car.price)}</p>
                                    </div>
                                    <div className="flex items-center text-sm text-muted-foreground gap-1">
                                        <MapPin className="h-3 w-3" /> {car.location}
                                    </div>
                                </CardHeader>
                                <CardContent className="px-5 pb-2">
                                    <div className="grid grid-cols-2 gap-y-3 text-sm">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="h-4 w-4 text-muted-foreground" />
                                            <span>{car.year}</span>
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
                                    
                                    {car.aiInsight && (
                                        <div className="mt-6 p-3 bg-primary/5 rounded-lg border border-primary/10">
                                            <p className="text-xs font-bold text-primary flex items-center gap-1 mb-1">
                                                <Sparkles className="h-3 w-3" /> AI INSIGHT
                                            </p>
                                            <p className="text-sm italic italic leading-snug">
                                                "{car.aiInsight}"
                                            </p>
                                        </div>
                                    )}
                                </CardContent>
                                <CardFooter className="p-5 pt-4 text-xs text-muted-foreground border-t bg-muted/20">
                                    Listed {formatDateTime(car.createdAt)}
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 bg-secondary/20 rounded-xl border border-dashed">
                        <Flame className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
                        <h2 className="text-xl font-semibold mb-2">No fresh cars today</h2>
                        <p className="text-muted-foreground">Check back later or get your own car valued now!</p>
                    </div>
                )}
            </div>
        </div>
    );
}
