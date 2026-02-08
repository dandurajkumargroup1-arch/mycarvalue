

'use client';

import { Suspense, useEffect, useState, useMemo, type ElementType } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { doc, collection, query, where, orderBy, limit } from 'firebase/firestore';

import { useUser, useFirestore, useDoc, useCollection } from '@/firebase';
import type { UserProfile } from '@/lib/firebase/user-profile-service';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Gavel, Clock, Users, Gauge, Fuel, GitPullRequest, User, MapPin, Star, FileText, CheckCircle, Shield, Cog, Car, Armchair, Disc, AlertTriangle
} from 'lucide-react';
import { formatCurrency, toDate } from '@/lib/utils';


// Simplified Bid History for now
const staticBidHistory = [
  { bidder: 'Bidder #345', amount: 1455000, time: '2s ago' },
  { bidder: 'You', amount: 1450000, time: '15s ago' },
  { bidder: 'Bidder #123', amount: 1445000, time: '28s ago' },
  { bidder: 'Bidder #678', amount: 1440000, time: '45s ago' },
];

const conditionIcons: { [key: string]: ElementType } = {
  'Engine': Cog,
  'Exterior': Car,
  'Interior': Armchair,
  'Tyres': Disc,
  'Accident History': Shield,
  'Brakes': Disc,
  'Default': FileText
};

const getConditionIcon = (item: string) => {
    const foundKey = Object.keys(conditionIcons).find(key => item.toLowerCase().includes(key.toLowerCase()));
    return foundKey ? conditionIcons[foundKey] : conditionIcons.Default;
}

function LiveBidsDashboard({ user }: { user: any }) {
  const firestore = useFirestore();
  const [timeLeft, setTimeLeft] = useState('');
  
  const auctionCarsQuery = useMemo(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, 'auctionCars'),
      where('status', 'in', ['live', 'scheduled']),
      orderBy('startTime', 'asc'),
      limit(1)
    );
  }, [firestore, user]);

  const { data: auctionCars, isLoading: isAuctionLoading } = useCollection(auctionCarsQuery);
  
  const carForAuction = useMemo(() => {
    if (!auctionCars || auctionCars.length === 0) return null;
    const car = auctionCars[0];
    return {
      ...car,
      startTime: toDate(car.startTime),
      endTime: toDate(car.endTime)
    }
  }, [auctionCars]);
  
  const [mainImage, setMainImage] = useState(carForAuction?.images?.[0]);

  useEffect(() => {
    if (carForAuction?.images?.length) {
      setMainImage(carForAuction.images[0]);
    }
  }, [carForAuction]);

  useEffect(() => {
    if (!carForAuction?.endTime) return;

    const interval = setInterval(() => {
        const now = new Date();
        const end = carForAuction.endTime;
        if (end) {
            const diff = end.getTime() - now.getTime();
            if (diff <= 0) {
                setTimeLeft('Ended');
                clearInterval(interval);
            } else {
                const hours = Math.floor(diff / (1000 * 60 * 60));
                const minutes = Math.floor((diff / 1000 / 60) % 60);
                const seconds = Math.floor((diff / 1000) % 60);
                setTimeLeft(`${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`);
            }
        }
    }, 1000);

    return () => clearInterval(interval);
  }, [carForAuction?.endTime]);

  if (isAuctionLoading) {
    return <LiveBidsPageLoader />;
  }

  if (!carForAuction) {
    return (
      <div className="container mx-auto flex items-center justify-center py-20">
        <Alert className="max-w-lg">
            <Gavel className="h-4 w-4" />
            <AlertTitle>No Live Auctions</AlertTitle>
            <AlertDescription>
                There are no auctions scheduled or live at the moment. Please check back later.
            </AlertDescription>
        </Alert>
      </div>
    );
  }
  
  const bidHistory = [
    { bidder: 'Bidder #XXX', amount: carForAuction.currentBid, time: 'now' },
    ...staticBidHistory.filter(b => b.amount < carForAuction.currentBid)
  ];


  return (
    <div className="container mx-auto py-8 px-4 md:px-6">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Gavel /> Live Auction: <span className="text-primary">{carForAuction.title}</span>
        </h1>
        <p className="text-muted-foreground">The auction is {carForAuction.status}. Place your bids now!</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Vehicle Info */}
        <div className="lg:col-span-2 space-y-8">
          <Card>
            <CardContent className="p-4">
              <div className="relative aspect-video w-full overflow-hidden rounded-lg mb-4 bg-muted">
                {mainImage && (
                  <Image
                    src={mainImage}
                    alt={carForAuction.title || 'Main car image'}
                    fill
                    style={{objectFit: 'cover'}}
                    className="transition-transform duration-300 hover:scale-105"
                  />
                )}
              </div>
              <div className="grid grid-cols-4 gap-2">
                {carForAuction.images.map((image: string, index: number) => (
                  <div
                    key={index}
                    className={`relative aspect-video w-full overflow-hidden rounded-md cursor-pointer border-2 ${mainImage === image ? 'border-primary' : 'border-transparent'}`}
                    onClick={() => setMainImage(image)}
                  >
                    <Image src={image} alt={`${carForAuction.title} image ${index + 1}`} fill style={{objectFit: 'cover'}} />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Vehicle Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 text-sm">
                  <div className="flex items-center gap-3"><Gauge className="text-primary" /><div><p className="text-muted-foreground">Odometer</p><p className="font-semibold">{carForAuction.odometer}</p></div></div>
                  <div className="flex items-center gap-3"><Fuel className="text-primary" /><div><p className="text-muted-foreground">Fuel Type</p><p className="font-semibold">{carForAuction.fuelType}</p></div></div>
                  <div className="flex items-center gap-3"><GitPullRequest className="text-primary" /><div><p className="text-muted-foreground">Transmission</p><p className="font-semibold">{carForAuction.transmission}</p></div></div>
                  <div className="flex items-center gap-3"><User className="text-primary" /><div><p className="text-muted-foreground">Ownership</p><p className="font-semibold">{carForAuction.ownership}</p></div></div>
                  <div className="flex items-center gap-3"><MapPin className="text-primary" /><div><p className="text-muted-foreground">Registration</p><p className="font-semibold">{carForAuction.registration}</p></div></div>
              </div>
               <div className="mt-6 pt-6 border-t">
                  <h3 className="font-semibold mb-3">Condition Summary</h3>
                  <Table>
                    <TableBody>
                      {carForAuction.conditionSummary.map((summary: {item: string, status: string}) => {
                        const Icon = getConditionIcon(summary.item);
                        return (
                          <TableRow key={summary.item}>
                            <TableCell className="font-medium flex items-center gap-2"><Icon className="text-muted-foreground h-5 w-5"/> {summary.item}</TableCell>
                            <TableCell>{summary.status}</TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                  <Button variant="outline" className="mt-4 w-full" asChild>
                    <a href={carForAuction.inspectionReportUrl || '#'} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2" disabled={!carForAuction.inspectionReportUrl}>
                      <FileText /> View Full Inspection Report
                    </a>
                  </Button>
               </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Bidding Panel */}
        <div className="lg:col-span-1 space-y-8">
          <Card className="sticky top-24 shadow-xl">
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center gap-2">Live Auction <Badge variant={carForAuction.status === 'live' ? 'destructive' : 'secondary'}>{carForAuction.status}</Badge></CardTitle>
              <CardDescription>Ends in:</CardDescription>
              <p className="text-3xl font-bold text-destructive">{timeLeft || 'Loading...'}</p>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Current Highest Bid</p>
                  <p className="text-4xl font-bold text-primary">{formatCurrency(carForAuction.currentBid)}</p>
                  {carForAuction.currentBid >= carForAuction.reservePrice ? (
                      <Badge variant="secondary" className="mt-2 flex items-center gap-2 mx-auto w-fit">
                        <CheckCircle className="text-green-500 h-4 w-4"/> Reserve Price Met
                      </Badge>
                  ) : (
                      <Badge variant="outline" className="mt-2 flex items-center gap-2 mx-auto w-fit">
                        <Gavel className="h-4 w-4"/> Reserve Price Not Met
                      </Badge>
                  )}
                </div>
                <div className="p-3 bg-muted rounded-md text-center">
                  <p className="text-sm">Next minimum bid: <span className="font-bold">{formatCurrency(carForAuction.currentBid + 5000)}</span></p>
                </div>
                <Button className="w-full" size="lg" disabled={carForAuction.status !== 'live'}>Place Your Bid</Button>
                <p className="text-xs text-center text-muted-foreground flex items-center justify-center gap-1"><Users/> {bidHistory.length + 5} bidders watching</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Bid History</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Bidder</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead className="text-right">Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bidHistory.map((bid, index) => (
                    <TableRow key={index} className={bid.bidder === 'You' ? 'bg-primary/10' : ''}>
                      <TableCell className="font-medium">{bid.bidder}</TableCell>
                      <TableCell>{formatCurrency(bid.amount)}</TableCell>
                      <TableCell className="text-right text-xs text-muted-foreground">{bid.time}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          
          <Card>
              <CardHeader>
                  <CardTitle>Seller Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 font-semibold">
                      <User className="text-primary"/> {carForAuction.sellerName}
                  </div>
                   <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin/> {carForAuction.sellerLocation}
                  </div>
                  <div className="flex items-center gap-2">
                      <Star className="text-amber-500 fill-amber-500"/>
                      <span className="font-bold">{carForAuction.sellerRating}</span>
                      <span className="text-sm text-muted-foreground">/ 5.0</span>
                  </div>
              </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}


function LiveBidsPageLoader() {
    return (
        <div className="container mx-auto py-8 px-4 md:px-6">
            <header className="mb-8">
                <Skeleton className="h-9 w-3/4" />
                <Skeleton className="h-5 w-1/2 mt-2" />
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column */}
                <div className="lg:col-span-2 space-y-8">
                    <Card>
                        <CardContent className="p-4">
                            <Skeleton className="aspect-video w-full rounded-lg mb-4" />
                            <div className="grid grid-cols-4 gap-2">
                                <Skeleton className="aspect-video w-full" />
                                <Skeleton className="aspect-video w-full" />
                                <Skeleton className="aspect-video w-full" />
                                <Skeleton className="aspect-video w-full" />
                            </div>
                        </CardContent>
                    </Card>
                    <Skeleton className="h-96 w-full" />
                </div>

                {/* Right Column */}
                <div className="lg:col-span-1 space-y-8">
                    <Skeleton className="h-80 w-full" />
                    <Skeleton className="h-64 w-full" />
                    <Skeleton className="h-48 w-full" />
                </div>
            </div>
        </div>
    );
}

function LiveBidsPageComponent() {
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
      router.push('/login?redirect=/live-bids');
    }
  }, [user, isUserLoading, router]);

  // Show a loader while waiting for auth state or profile to load
  if (isUserLoading || (user && isProfileLoading)) {
    return <LiveBidsPageLoader />;
  }

  // After loading, if there is still no user, the redirect will trigger.
  // In the meantime, we can show a loader.
  if (!user) {
    return <LiveBidsPageLoader />;
  }

  // Once user and profile are loaded, check for authorization
  const isHardcodedAdmin = user.email === 'rajmycarvalue@gmail.com';
  const isRoleAdmin = userProfile?.role === 'Admin';
  const isAuthorized = isHardcodedAdmin || isRoleAdmin;
  
  if (isAuthorized) {
    return <LiveBidsDashboard user={user} />;
  }

  // If not authorized, show access denied message
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

export default function LiveBidsPage() {
    return (
        <LiveBidsPageComponent />
    );
}
