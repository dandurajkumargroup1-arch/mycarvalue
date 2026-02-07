
'use client';

import { Suspense, useEffect, useState, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { doc } from 'firebase/firestore';

import { useUser, useFirestore, useDoc } from '@/firebase';
import type { UserProfile } from '@/lib/firebase/user-profile-service';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Gavel, Clock, Users, Gauge, Fuel, GitPullRequest, User, MapPin, Star, FileText, CheckCircle, Shield, Cog, Car, Armchair, Disc, AlertTriangle
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';


const carForAuction = {
  title: '2021 Hyundai Creta SX(O)',
  images: [
    PlaceHolderImages.find(p => p.id === 'auction-car-main')!,
    PlaceHolderImages.find(p => p.id === 'auction-car-interior')!,
    PlaceHolderImages.find(p => p.id === 'auction-car-side')!,
    PlaceHolderImages.find(p => p.id === 'auction-car-engine')!,
  ].filter(Boolean),
  specs: {
    odometer: '28,500 km',
    fuelType: 'Diesel',
    transmission: 'Automatic',
    ownership: '1st Owner',
    registration: 'MH 14 (Pune)',
  },
  conditionSummary: [
    { item: 'Engine', status: 'Excellent', icon: Cog },
    { item: 'Exterior', status: 'Minor Scratches', icon: Car },
    { item: 'Interior', status: 'Clean', icon: Armchair },
    { item: 'Tyres', status: '75% Life Remaining', icon: Disc },
    { item: 'Accident History', status: 'None', icon: Shield },
  ],
  seller: {
    name: 'AutoBest Deals',
    rating: 4.8,
    location: 'Pune, Maharashtra',
  },
};

const bidHistory = [
  { bidder: 'Bidder #345', amount: 1455000, time: '2s ago' },
  { bidder: 'You', amount: 1450000, time: '15s ago' },
  { bidder: 'Bidder #123', amount: 1445000, time: '28s ago' },
  { bidder: 'Bidder #678', amount: 1440000, time: '45s ago' },
];

function LiveBidsDashboard() {
  const [mainImage, setMainImage] = useState(carForAuction.images[0]);

  return (
    <div className="container mx-auto py-8 px-4 md:px-6">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Gavel /> Live Auction: <span className="text-primary">{carForAuction.title}</span>
        </h1>
        <p className="text-muted-foreground">The auction is live. Place your bids now!</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Vehicle Info */}
        <div className="lg:col-span-2 space-y-8">
          <Card>
            <CardContent className="p-4">
              <div className="relative aspect-video w-full overflow-hidden rounded-lg mb-4">
                <Image
                  src={mainImage.imageUrl}
                  alt={mainImage.description}
                  fill
                  style={{objectFit: 'cover'}}
                  className="transition-transform duration-300 hover:scale-105"
                  data-ai-hint={mainImage.imageHint}
                />
              </div>
              <div className="grid grid-cols-4 gap-2">
                {carForAuction.images.map((image, index) => (
                  <div
                    key={index}
                    className={`relative aspect-video w-full overflow-hidden rounded-md cursor-pointer border-2 ${mainImage.imageUrl === image.imageUrl ? 'border-primary' : 'border-transparent'}`}
                    onClick={() => setMainImage(image)}
                  >
                    <Image src={image.imageUrl} alt={image.description} fill style={{objectFit: 'cover'}} data-ai-hint={image.imageHint} />
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
                  <div className="flex items-center gap-3"><Gauge className="text-primary" /><div><p className="text-muted-foreground">Odometer</p><p className="font-semibold">{carForAuction.specs.odometer}</p></div></div>
                  <div className="flex items-center gap-3"><Fuel className="text-primary" /><div><p className="text-muted-foreground">Fuel Type</p><p className="font-semibold">{carForAuction.specs.fuelType}</p></div></div>
                  <div className="flex items-center gap-3"><GitPullRequest className="text-primary" /><div><p className="text-muted-foreground">Transmission</p><p className="font-semibold">{carForAuction.specs.transmission}</p></div></div>
                  <div className="flex items-center gap-3"><User className="text-primary" /><div><p className="text-muted-foreground">Ownership</p><p className="font-semibold">{carForAuction.specs.ownership}</p></div></div>
                  <div className="flex items-center gap-3"><MapPin className="text-primary" /><div><p className="text-muted-foreground">Registration</p><p className="font-semibold">{carForAuction.specs.registration}</p></div></div>
              </div>
               <div className="mt-6 pt-6 border-t">
                  <h3 className="font-semibold mb-3">Condition Summary</h3>
                  <Table>
                    <TableBody>
                      {carForAuction.conditionSummary.map(({item, status, icon: Icon}) => (
                        <TableRow key={item}>
                          <TableCell className="font-medium flex items-center gap-2"><Icon className="text-muted-foreground h-5 w-5"/> {item}</TableCell>
                          <TableCell>{status}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <Button variant="outline" className="mt-4 w-full">
                    <Link href="/report-placeholder" className="flex items-center gap-2"><FileText /> View Full Inspection Report</Link>
                  </Button>
               </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Bidding Panel */}
        <div className="lg:col-span-1 space-y-8">
          <Card className="sticky top-24 shadow-xl">
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center gap-2">Live Auction <Badge>Live</Badge></CardTitle>
              <CardDescription>Ends in:</CardDescription>
              <p className="text-3xl font-bold text-destructive">01:23</p>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Current Highest Bid</p>
                  <p className="text-4xl font-bold text-primary">{formatCurrency(bidHistory[0].amount)}</p>
                  <Badge variant="secondary" className="mt-2 flex items-center gap-2 mx-auto w-fit">
                    <CheckCircle className="text-green-500 h-4 w-4"/> Reserve Price Met
                  </Badge>
                </div>
                <div className="p-3 bg-muted rounded-md text-center">
                  <p className="text-sm">Next minimum bid: <span className="font-bold">{formatCurrency(bidHistory[0].amount + 5000)}</span></p>
                </div>
                <Button className="w-full" size="lg">Place Your Bid</Button>
                <p className="text-xs text-center text-muted-foreground flex items-center justify-center gap-1"><Users/> {bidHistory.length + 5} bidders watching</p>
                 <div className="text-center mt-2">
                    <Badge variant="destructive" className="bg-red-500/10 text-red-500 border-red-500/20">You have been outbid!</Badge>
                </div>
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
                      <User className="text-primary"/> {carForAuction.seller.name}
                  </div>
                   <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin/> {carForAuction.seller.location}
                  </div>
                  <div className="flex items-center gap-2">
                      <Star className="text-amber-500 fill-amber-500"/>
                      <span className="font-bold">{carForAuction.seller.rating}</span>
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

  const authStatus = useMemo(() => {
    if (isUserLoading || (user && isProfileLoading)) {
      return 'loading';
    }
    if (!user) {
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
    return <LiveBidsPageLoader />;
  }

  if (authStatus === 'authorized') {
    return <LiveBidsDashboard />;
  }

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
        <Suspense fallback={<LiveBidsPageLoader />}>
            <LiveBidsPageComponent />
        </Suspense>
    );
}
