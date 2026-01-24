
"use client";

import { useState, useMemo, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Script from "next/script";
import { useRouter } from "next/navigation";
import type { User } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';

import { CarValuationSchema, type CarValuationFormInput } from '@/lib/schemas';
import { getValuationAction } from '@/lib/actions';
import { carMakesAndModelsAndVariants, indianStates } from "@/lib/variants";
import { useUser, useFirestore } from "@/firebase";
import { useToast } from "@/hooks/use-toast";
import { saveValuation } from "@/lib/firebase/valuation-service";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Sparkles, User as UserIcon, Lock, CreditCard, Info, Wrench, Car, Package, Power, Disc, Shield, FileText, History, PlusSquare, Droplets, ChevronRight } from "lucide-react";


const ValuationLoadingScreen = () => (
    <Card className="shadow-lg text-center">
        <CardContent className="p-8 md:p-12">
            <div className="inline-block animate-spin">
                <Sparkles className="h-16 w-16 text-primary" />
            </div>
            <h2 className="mt-6 text-2xl font-semibold">Calculating Your Best Price...</h2>
            <p className="mt-2 text-muted-foreground">
                Please hold on, our valuation engine is running the numbers.
            </p>
        </CardContent>
    </Card>
);

const PaymentDisplay = ({ onNewValuation, user, firestore }: { onNewValuation: () => void; user: User | null; firestore: Firestore | null; }) => {
  const router = useRouter();
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const startPayment = async () => {
    if (!user || !firestore) {
      toast({
        variant: "destructive",
        title: "Authentication Error",
        description: "User not signed in. Cannot proceed with payment.",
      });
      return;
    }
    
    if (!(window as any).Razorpay) {
      toast({
        variant: "destructive",
        title: "Payment Error",
        description: "Could not connect to payment gateway. Please refresh and try again.",
      });
      return;
    }

    try {
      // 1. Create Order on the server
      const orderResponse = await fetch('/api/razorpay', { method: 'POST' });
      if (!orderResponse.ok) {
        const errorData = await orderResponse.json();
        throw new Error(errorData.error || `Failed to create order. Status: ${orderResponse.status}`);
      }
      const order = await orderResponse.json();

      if (order.error) {
        throw new Error(order.error);
      }
      
      if (!order.key) {
        throw new Error("Razorpay key was not returned from the server.");
      }

      // 2. Open Razorpay Checkout
      const options = {
        key: order.key, // Use the key from the server response
        amount: order.amount,
        currency: order.currency,
        name: "mycarvalue.in",
        description: "Car Valuation Report",
        order_id: order.id,
        handler: function (response: any) {
          try {
            if (!response || !response.razorpay_payment_id) {
              throw new Error("Payment response is invalid or missing payment ID.");
            }
            localStorage.setItem("razorpay_payment_id", response.razorpay_payment_id);
            router.push('/payment-success');
          } catch (err: any) {
            console.error("Razorpay handler error:", err);
            toast({
              variant: "destructive",
              title: "Processing Error",
              description: "Payment was successful, but an error occurred while redirecting. Please contact support with your payment details.",
              duration: 9000,
            });
          }
        },
        prefill: {
          name: user.displayName || "Valued Customer",
          email: user.email || "customer@example.com",
        },
        theme: {
          color: "#2A9D8F",
        },
      };
      
      const rzp1 = new (window as any).Razorpay(options);
      rzp1.open();

    } catch (error: any) {
      console.error("Payment failed:", error);
      toast({
        variant: "destructive",
        title: "Payment Failed",
        description: error.message || "Could not create a payment order. Please try again.",
      });
    }
  };

  if (!isMounted) {
    return null; // Don't render anything on the server or before hydration
  }

  return (
    <>
      <Script
        id="razorpay-checkout-js"
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="lazyOnload" // Use lazyOnload for better performance
        onLoad={() => {
          setIsScriptLoaded(true);
        }}
      />
      <Card className="shadow-lg text-center">
        <CardHeader>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Lock className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="mt-4">Unlock Your Valuation Report</CardTitle>
          <CardDescription>Your detailed valuation is ready. Complete the payment to view and download your full report.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-6">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Payable Amount</p>
            <p className="text-4xl font-bold">₹149</p>
          </div>

          <Button onClick={startPayment} size="lg" disabled={!isScriptLoaded}>
              <CreditCard className="mr-2" />
              {isScriptLoaded ? 'Pay Now & View Report' : 'Loading Payment...'}
          </Button>
          
          <div className="text-xs text-muted-foreground mt-2">Secured by Razorpay</div>
          <Button variant="link" onClick={onNewValuation}>Start New Valuation</Button>
        </CardContent>
      </Card>
    </>
  );
};


export function ValuationForm() {
  const { user } = useUser();
  const firestore = useFirestore();
  const [loading, setLoading] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [activeTab, setActiveTab] = useState("contact");
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<CarValuationFormInput>({
    resolver: zodResolver(CarValuationSchema),
    defaultValues: {
        displayName: "",
        whatsappNumber: "",
        vehicleNumber: "",
        priceCheckReason: undefined,
        make: "",
        model: "",
        variant: "",
        otherVariant: "",
        bodyType: undefined,
        manufactureYear: undefined,
        registrationYear: undefined,
        registrationState: "",
        expectedPrice: undefined,
        ownership: undefined,
        rcStatus: undefined,
        insurance: undefined,
        hypothecation: undefined,
        odometer: "",
        usageType: undefined,
        cityDriven: undefined,
        floodDamage: undefined,
        accident: undefined,
        serviceCenter: undefined,
        engine: undefined,
        gearbox: undefined,
        clutch: undefined,
        battery: undefined,
        radiator: undefined,
        exhaust: undefined,
        suspension: undefined,
        steering: undefined,
        brakes: undefined,
        engineOil: undefined,
        coolant: undefined,
        brakeFluid: undefined,
        washerFluid: undefined,
        frontBumper: undefined,
        rearBumper: undefined,
        bonnet: undefined,
        roof: undefined,
        doors: undefined,
        fenders: undefined,
        paintQuality: undefined,
        accidentHistory: undefined,
        scratches: undefined,
        dents: undefined,
        rust_areas: undefined,
        seats: undefined,
        seatCovers: undefined,
        dashboard: undefined,
        dashboardWarningLights: undefined,
        steeringWheel: undefined,
        roofLining: undefined,
        floorMats: undefined,
        ac: undefined,
        infotainment: undefined,
        powerWindows: undefined,
        centralLocking: undefined,
        headlights: undefined,
        indicators: undefined,
        horn: undefined,
        reverseCamera: undefined,
        sensors: undefined,
        wipers: undefined,
        frontTyres: undefined,
        rearTyres: undefined,
        spareTyre: undefined,
        alloyWheels: undefined,
        wheelAlignment: undefined,
        newlyChanged: undefined,
        airbags: undefined,
        abs: undefined,
        seatBelts: undefined,
        childLock: undefined,
        immobilizer: undefined,
        rcBook: undefined,
        insuranceDoc: undefined,
        puc: undefined,
        serviceRecords: undefined,
        duplicateKey: undefined,
        noc: undefined,
        musicSystem: undefined,
        reverseParkingSensor: undefined,
        dashcam: undefined,
        fogLamps: undefined,
        gpsTracker: undefined,
    },
  });

  const { watch, setValue } = form;
  const watchedMake = watch("make");
  const watchedModel = watch("model");
  const watchedVariant = watch("variant");

  const models = useMemo(() => {
    if (watchedMake && carMakesAndModelsAndVariants[watchedMake]) {
      return Object.keys(carMakesAndModelsAndVariants[watchedMake]);
    }
    return [];
  }, [watchedMake]);
  
  const variants = useMemo(() => {
    if (watchedMake && watchedModel && carMakesAndModelsAndVariants[watchedMake]?.[watchedModel]) {
      return carMakesAndModelsAndVariants[watchedMake][watchedModel];
    }
    return [];
  }, [watchedMake, watchedModel]);

  useEffect(() => {
    if (user && !form.getValues('displayName')) {
      setValue('displayName', user.displayName || '');
    }
  }, [user, setValue, form]);

  const onSubmit = async (data: CarValuationFormInput) => {
    setLoading(true);

    if (!user || !firestore) {
        toast({ variant: "destructive", title: "Error", description: "User not authenticated. Cannot proceed." });
        setLoading(false);
        return;
    }

    try {
        const result = await getValuationAction(data);
        const fullResult = { valuation: result.valuation, formData: data };

        await saveValuation(firestore, user, {
            paymentId: `test-${Date.now()}`,
            ...data,
            valuationResult: result.valuation,
            comparableListingsResult: null,
            imageQualityResult: null,
        });
        
        localStorage.setItem('valuationResult', JSON.stringify(fullResult));
        localStorage.setItem('paymentSuccess', 'true');

        router.push('/result');

    } catch (error: any) {
        console.error("Valuation Action Error:", error);
        
        let description = "An unexpected error occurred during valuation or saving.";
        if (error.message?.includes("already exists")) {
            description = error.message;
        } else if (error.message?.includes("429") || error.message?.toLowerCase().includes("quota")) {
            description = "Our AI is currently busy. Please try again in 30 seconds.";
        }

        toast({
            variant: "destructive",
            title: "Valuation Failed",
            description: description,
        });
    } finally {
        setLoading(false);
    }
  };


  const sections = [
    { value: "contact", title: "Contact", icon: <UserIcon /> },
    { value: "basic", title: "Basic Info", icon: <Info /> },
    { value: "history", title: "Usage", icon: <History /> },
    { value: "engine", title: "Engine", icon: <Wrench /> },
    { value: "fluids", title: "Fluids", icon: <Droplets /> },
    { value: "exterior", title: "Exterior", icon: <Car /> },
    { value: "interior", title: "Interior", icon: <Package /> },
    { value: "electrical", title: "Electrical", icon: <Power /> },
    { value: "tyres", title: "Tyres", icon: <Disc /> },
    { value: "safety", title: "Safety", icon: <Shield /> },
    { value: "documents", title: "Docs", icon: <FileText /> },
    { value: "additional", title: "Features", icon: <PlusSquare /> },
  ];

  const currentIndex = sections.findIndex(s => s.value === activeTab);
  const isLastSection = currentIndex === sections.length - 1;

  const handleNextSection = () => {
    const nextIndex = currentIndex + 1;
    if (nextIndex < sections.length) {
        setActiveTab(sections[nextIndex].value);
    }
  };

  if (loading) {
    return <ValuationLoadingScreen />;
  }

  if (showPayment) {
    return <PaymentDisplay user={user} firestore={firestore} onNewValuation={() => {
        setShowPayment(false);
        localStorage.removeItem('valuationResult');
        localStorage.removeItem('paymentSuccess');
        localStorage.removeItem('razorpay_payment_id');
    }} />;
  }

  const renderSelect = (name: keyof CarValuationFormInput, label: string, options: {value: string, label: string}[], placeholder?: string) => (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <Select onValueChange={field.onChange} value={field.value as string ?? ''}>
            <FormControl><SelectTrigger><SelectValue placeholder={placeholder || "Select an option"} /></SelectTrigger></FormControl>
            <SelectContent>
              {options.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  );
  
  const renderRadioGroup = (name: keyof CarValuationFormInput, label: string, options: {value: string, label: string}[]) => (
     <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
            <RadioGroup
              onValueChange={field.onChange}
              value={field.value as string ?? ''}
              className="flex flex-wrap items-center gap-4"
            >
              {options.map(opt => (
                <FormItem key={opt.value} className="flex items-center space-x-2">
                  <FormControl>
                    <RadioGroupItem value={opt.value} />
                  </FormControl>
                  <FormLabel className="font-normal">{opt.label}</FormLabel>
                </FormItem>
              ))}
            </RadioGroup>
          <FormMessage />
        </FormItem>
      )}
    />
  );

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle>Car Valuation Details</CardTitle>
        <CardDescription>
          Fill in the details of your car to get an accurate valuation. The more details, the better the price.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
              <div className="relative">
                <ScrollArea className="w-full whitespace-nowrap md:hidden">
                  <TabsList className="inline-flex h-auto p-1">
                      {sections.map((section) => (
                        <TabsTrigger
                          key={section.value}
                          value={section.value}
                          className="w-full justify-start gap-2 px-3 py-2 text-left"
                        >
                          <div className="[&>svg]:size-5">{section.icon}</div>
                          <span>{section.title}</span>
                        </TabsTrigger>
                      ))}
                  </TabsList>
                  <ScrollBar orientation="horizontal" />
                </ScrollArea>
                <p className="flex items-center justify-end text-xs text-muted-foreground mt-2 md:hidden">
                    Scroll for more sections <ChevronRight className="h-4 w-4 ml-1" />
                </p>

                <div className="md:grid md:grid-cols-[200px_1fr] md:gap-8">
                  {/* Desktop Tabs */}
                  <TabsList className="hidden md:flex flex-col h-auto justify-start p-2 gap-1 w-full bg-muted/50">
                    {sections.map((section) => (
                      <TabsTrigger
                        key={section.value}
                        value={section.value}
                        className="w-full justify-start gap-2 px-3 py-2 text-left"
                      >
                        <div className="[&>svg]:size-5">{section.icon}</div>
                        <span>{section.title}</span>
                      </TabsTrigger>
                    ))}
                  </TabsList>

                  {/* Form Content */}
                  <div className="mt-4 md:mt-0">
                    <TabsContent value="contact" className="mt-0">
                      <h3 className="text-lg font-semibold mb-4">Contact Details</h3>
                      <div className="space-y-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField control={form.control} name="displayName" render={({ field }) => ( <FormItem> <FormLabel>Name</FormLabel> <FormControl><Input placeholder="Your full name" {...field} value={field.value ?? ''} /></FormControl> <FormMessage /> </FormItem> )} />
                        <FormField control={form.control} name="whatsappNumber" render={({ field }) => ( <FormItem> <FormLabel>WhatsApp Number</FormLabel> <FormControl><Input type="tel" placeholder="e.g., 9876543210" {...field} value={field.value ?? ''} /></FormControl> <FormMessage /> </FormItem> )} />
                        <FormField control={form.control} name="vehicleNumber" render={({ field }) => ( <FormItem> <FormLabel>Vehicle Number (Optional)</FormLabel> <FormControl><Input placeholder="e.g., AP09BUXXXX" {...field} value={field.value ?? ''} /></FormControl> <FormMessage /> </FormItem> )} />
                      </div>
                    </TabsContent>

                    <TabsContent value="basic" className="mt-0">
                      <h3 className="text-lg font-semibold mb-4">Basic Vehicle Information</h3>
                      <div className="space-y-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                        {renderSelect("priceCheckReason", "Check price for", [{value: "immediate_sale", label: "Immediate sale"}, {value: "price_check", label: "Just price check"}, {value: "market_value", label: "Knowing the market value"}], "Select a reason")}
                        <FormField control={form.control} name="make" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Make</FormLabel>
                            <Select onValueChange={(value) => { field.onChange(value); form.setValue('model', ''); form.setValue('variant', ''); }} value={field.value ?? ''}>
                              <FormControl><SelectTrigger><SelectValue placeholder="Select Make" /></SelectTrigger></FormControl>
                              <SelectContent>{Object.keys(carMakesAndModelsAndVariants).map(make => <SelectItem key={make} value={make}>{make}</SelectItem>)}</SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <FormField control={form.control} name="model" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Model</FormLabel>
                            <Select onValueChange={(value) => { field.onChange(value); form.setValue('variant', ''); }} value={field.value ?? ''} disabled={!watchedMake}>
                              <FormControl><SelectTrigger><SelectValue placeholder="Select Model" /></SelectTrigger></FormControl>
                              <SelectContent>{models.map(model => <SelectItem key={model} value={model}>{model}</SelectItem>)}</SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <FormField control={form.control} name="variant" render={({ field }) => ( 
                          <FormItem>
                            <FormLabel>Variant</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value ?? ''} disabled={!watchedModel || variants.length === 0}>
                                <FormControl><SelectTrigger><SelectValue placeholder="Select Variant" /></SelectTrigger></FormControl>
                                <SelectContent>{variants.map(variant => <SelectItem key={variant} value={variant}>{variant}</SelectItem>)}</SelectContent>
                              </Select>
                            <FormMessage />
                          </FormItem> 
                        )} />
                         {watchedVariant === 'Other' && (
                            <FormField
                                control={form.control}
                                name="otherVariant"
                                render={({ field }) => (
                                <FormItem className="md:col-span-2">
                                    <FormLabel>Please Specify Other Variant</FormLabel>
                                    <FormControl>
                                    <Input placeholder="Enter variant name" {...field} value={field.value ?? ''} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                        )}
                        {renderSelect("bodyType", "Body Type", [
                            {value: "hatchback", label: "Hatchback – Compact & city friendly"},
                            {value: "sedan", label: "Sedan – Comfort & elegance"},
                            {value: "suv", label: "SUV – Power & ground clearance"},
                            {value: "muv_mpv", label: "MUV/MPV – Family & space"},
                            {value: "coupe_convertible", label: "Coupe/Convertible – Sporty & luxury"},
                            {value: "pickup_van", label: "Pickup/Van – Utility & commercial"},
                        ], "Select Body Type")}
                        {renderSelect("fuelType", "Fuel Type", [{value: "petrol", label: "Petrol"}, {value: "diesel", label: "Diesel"}, {value: "cng", label: "CNG"}, {value: "electric", label: "Electric"}], "Select Fuel Type")}
                        {renderSelect("transmission", "Transmission", [{value: "manual", label: "Manual"}, {value: "automatic", label: "Automatic"}], "Select Transmission")}
                        <FormField control={form.control} name="manufactureYear" render={({ field }) => ( <FormItem> <FormLabel>Year of Manufacture</FormLabel> <Select onValueChange={(val) => field.onChange(Number(val))} value={field.value ? String(field.value) : ''}> <FormControl><SelectTrigger><SelectValue placeholder="Select Year" /></SelectTrigger></FormControl> <SelectContent>{Array.from({ length: new Date().getFullYear() - 1979 }, (_, i) => new Date().getFullYear() - i).map(year => <SelectItem key={year} value={String(year)}>{year}</SelectItem>)}</SelectContent> </Select> <FormMessage /> </FormItem> )} />
                        <FormField control={form.control} name="registrationYear" render={({ field }) => ( <FormItem> <FormLabel>Year of Registration</FormLabel> <Select onValueChange={(val) => field.onChange(Number(val))} value={field.value ? String(field.value) : ''}> <FormControl><SelectTrigger><SelectValue placeholder="Select Year" /></SelectTrigger></FormControl> <SelectContent>{Array.from({ length: new Date().getFullYear() - 1979 }, (_, i) => new Date().getFullYear() - i).map(year => <SelectItem key={year} value={String(year)}>{year}</SelectItem>)}</SelectContent> </Select> <FormMessage /> </FormItem> )} />
                        <FormField control={form.control} name="registrationState" render={({ field }) => ( <FormItem> <FormLabel>Registration State</FormLabel> <Select onValueChange={field.onChange} value={field.value ?? ''}> <FormControl><SelectTrigger><SelectValue placeholder="Select State" /></SelectTrigger></FormControl> <SelectContent>{indianStates.map(state => <SelectItem key={state} value={state}>{state}</SelectItem>)}</SelectContent> </Select> <FormMessage /> </FormItem> )} />
                        {renderSelect("ownership", "Ownership", [{value: "1st", label: "1st Owner"}, {value: "2nd", label: "2nd Owner"}, {value: "3rd", label: "3rd Owner"}, {value: "4th+", label: "4th+ Owner"}], "Select Ownership")}
                        {renderSelect("rcStatus", "RC Status", [{value: "active", label: "Active"}, {value: "inactive", label: "Inactive"}, {value: "pending", label: "Pending"}], "Select RC Status")}
                        {renderSelect("insurance", "Insurance", [{value: "comprehensive", label: "Comprehensive"}, {value: "third_party", label: "Third-party"}, {value: "none", label: "None"}], "Select Insurance")}
                        {renderRadioGroup("hypothecation", "Hypothecation", [{value: "yes", label: "Yes"}, {value: "no", label: "No"}])}
                        <FormField control={form.control} name="expectedPrice" render={({ field }) => ( <FormItem> <FormLabel>Expected Price</FormLabel> <FormControl><Input type="number" placeholder="e.g., 500000" value={field.value ?? ''} onChange={e => field.onChange(e.target.value === '' ? '' : Number(e.target.value))} /></FormControl> <FormMessage /> </FormItem> )} />
                      </div>
                    </TabsContent>

                    <TabsContent value="history" className="mt-0">
                        <h3 className="text-lg font-semibold mb-4">Usage &amp; History</h3>
                        <div className="space-y-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField control={form.control} name="odometer" render={({ field }) => ( <FormItem> <FormLabel>Odometer (km)</FormLabel> <FormControl><Input type="number" placeholder="e.g., 45000" {...field} value={field.value ?? ''} /></FormControl> <FormMessage /> </FormItem> )} />
                            {renderSelect("usageType", "Usage Type", [{value: "personal", label: "Personal"}, {value: "commercial", label: "Commercial"}], "Select Usage Type")}
                            {renderRadioGroup("cityDriven", "Primarily City Driven", [{value: "yes", label: "Yes"}, {value: "no", label: "No"}])}
                            {renderRadioGroup("floodDamage", "Flood Damage", [{value: "yes", label: "Yes"}, {value: "no", label: "No"}])}
                            {renderRadioGroup("accident", "Accident History", [{value: "yes", label: "Yes"}, {value: "no", label: "No"}])}
                            {renderSelect("serviceCenter", "Service Center", [{value: "authorized", label: "Authorized"}, {value: "local", label: "Local Garage"}, {value: "mixed", label: "Mixed"}], "Select Service Center")}
                        </div>
                    </TabsContent>

                    <TabsContent value="engine" className="mt-0">
                        <h3 className="text-lg font-semibold mb-4">Engine &amp; Mechanical</h3>
                        <div className="space-y-4 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                            {renderSelect("engine", "Engine", [{value: "smooth", label: "Excellent / Smooth"}, {value: "noise", label: "Good / Minor Noise"}, {value: "vibration", label: "Average / Vibration"}, {value: "other", label: "Poor / Overhaul Needed"}], "Select Engine Condition")}
                            {renderSelect("gearbox", "Gearbox", [{value: "smooth", label: "Smooth Shifting"}, {value: "hard_shifting", label: "Minor Hard Shift"}, {value: "noise", label: "Noise / Delay"}, {value: "other", label: "Repair Required"}], "Select Gearbox Condition")}
                            {renderSelect("clutch", "Clutch", [{value: "normal", label: "Excellent"}, {value: "hard", label: "Slightly Hard"}, {value: "slipping", label: "Slipping"}, {value: "other", label: "Replacement Needed"}], "Select Clutch Condition")}
                            {renderSelect("battery", "Battery", [{value: "new", label: "New / Good"}, {value: "average", label: "Average"}, {value: "weak", label: "Weak"}, {value: "not_working", label: "Not Working"}], "Select Battery Condition")}
                            {renderSelect("radiator", "Radiator", [{value: "good", label: "No Leakage"}, {value: "leakage", label: "Minor Issue"}, {value: "overheating", label: "Overheating"}, {value: "damaged", label: "Major Damage"}], "Select Radiator Condition")}
                            {renderSelect("exhaust", "Exhaust", [{value: "normal_smoke", label: "Normal"}, {value: "noise", label: "Noise"}, {value: "smoke", label: "Smoke"}, {value: "other", label: "Replacement Needed"}], "Select Exhaust Condition")}
                            {renderSelect("suspension", "Suspension", [{value: "good", label: "Smooth"}, {value: "noise", label: "Slight Noise"}, {value: "bumpy", label: "Bumpy Ride"}, {value: "worn_out", label: "Worn Out"}], "Select Suspension Condition")}
                            {renderSelect("steering", "Steering", [{value: "normal", label: "Perfect"}, {value: "play", label: "Slight Play"}, {value: "hard", label: "Hard Steering"}, {value: "alignment", label: "Alignment Issue"}], "Select Steering Condition")}
                            {renderSelect("brakes", "Brakes", [{value: "good", label: "Good"}, {value: "needs_service", label: "Needs Service"}, {value: "weak", label: "Weak"}], "Select Brakes Condition")}
                        </div>
                    </TabsContent>
                    
                    <TabsContent value="fluids" className="mt-0">
                        <h3 className="text-lg font-semibold mb-4">Fluids Check</h3>
                        <div className="space-y-4 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                            {renderSelect("engineOil", "Engine Oil", [{value: "ok", label: "OK"}, {value: "low", label: "Low"}, {value: "dirty", label: "Dirty"}, {value: "replace", label: "Needs Replacement"}], "Select Engine Oil Condition")}
                            {renderSelect("coolant", "Coolant", [{value: "ok", label: "OK"}, {value: "low", label: "Low"}, {value: "leak", label: "Leak"}], "Select Coolant Condition")}
                            {renderSelect("brakeFluid", "Brake Fluid", [{value: "ok", label: "OK"}, {value: "low", label: "Low"}, {value: "contaminated", label: "Contaminated"}], "Select Brake Fluid Condition")}
                            {renderSelect("washerFluid", "Washer Fluid", [{value: "ok", label: "OK"}, {value: "low", label: "Low"}], "Select Washer Fluid Condition")}
                        </div>
                    </TabsContent>

                    <TabsContent value="exterior" className="mt-0">
                        <h3 className="text-lg font-semibold mb-4">Exterior (Body &amp; Paint)</h3>
                        <div className="space-y-4 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                            {renderSelect("frontBumper", "Front Bumper", [{value: "original", label: "Excellent / Original"}, {value: "scratch", label: "Minor Scratches"}, {value: "repaint", label: "Repainted"}, {value: "damaged", label: "Dent / Damage"}], "Select Condition")}
                            {renderSelect("rearBumper", "Rear Bumper", [{value: "original", label: "Excellent / Original"}, {value: "scratch", label: "Minor Scratches"}, {value: "repaint", label: "Repainted"}, {value: "damaged", label: "Dent / Damage"}], "Select Condition")}
                            {renderSelect("bonnet", "Bonnet", [{value: "original", label: "Excellent / Original"}, {value: "scratch", label: "Minor Scratches"}, {value: "repaint", label: "Repainted"}, {value: "dent", label: "Dent / Damage"}], "Select Condition")}
                            {renderSelect("roof", "Roof", [{value: "original", label: "Original"}, {value: "repaint", label: "Repainted"}, {value: "dent", label: "Dent / Damage"}], "Select Condition")}
                            {renderSelect("doors", "Doors (All)", [{value: "original", label: "All Original"}, {value: "repaint_one", label: "1 Door Repainted"}, {value: "repaint_multi", label: "Multiple Repainted"}, {value:"dent", label: "Dent / Damage"}], "Select Condition")}
                            {renderSelect("fenders", "Fenders", [{value: "original", label: "Excellent / Original"}, {value: "scratch", label: "Minor Scratches"}, {value: "repaint", label: "Repainted"}, {value: "dent", label: "Dent / Damage"}], "Select Condition")}
                            {renderSelect("paintQuality", "Paint Quality", [{value: "excellent", label: "Excellent / Glossy"}, {value: "average", label: "Average"}, {value: "dull", label: "Dull / Faded"}, {value: "poor", label: "Poor"}], "Select Paint Quality")}
                            {renderSelect("scratches", "Scratch Count", [{value: "0", label: "None / Few"}, {value: "3-5", label: "3 - 5"}, {value: "6-10", label: "6 - 10"}, {value: ">10", label: "More than 10"}], "Select Scratch Count")}
                            {renderSelect("dents", "Dent Count", [{value: "0", label: "None"}, {value: "1-2", label: "1 - 2"}, {value: "3-5", label: "3 - 5"}, {value: ">5", label: "More than 5"}], "Select Dent Count")}
                            {renderSelect("rust_areas", "Rust", [{value: "none", label: "No Rust"}, {value: "minor", label: "Minor Surface Rust"}, {value: "visible", label: "Visible Rust"}, {value: "structural", label: "Structural Rust"}], "Select Rust Condition")}
                            {renderSelect("accidentHistory", "Accident History", [{value: "none", label: "None"}, {value: "minor", label: "Minor"}, {value: "major", label: "Major"}], "Select Accident History")}
                        </div>
                    </TabsContent>

                    <TabsContent value="interior" className="mt-0">
                        <h3 className="text-lg font-semibold mb-4">Interior (Cabin Condition)</h3>
                        <div className="space-y-4 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                            {renderSelect("seats", "Seats", [{value: "excellent", label: "Excellent / Clean"}, {value: "good", label: "Good / Minor Wear"}, {value: "average", label: "Average"}, {value: "poor", label: "Poor / Damaged"}], "Select Seat Condition")}
                            {renderSelect("seatCovers", "Seat Covers", [{value: "new", label: "New / Good"}, {value: "average", label: "Average"}, {value: "torn", label: "Torn / Worn"}, {value: "not_present", label: "Not Present"}], "Select Seat Cover Condition")}
                            {renderSelect("dashboard", "Dashboard", [{value: "excellent", label: "Excellent / Clean"}, {value: "good", label: "Good / Minor Wear"}, {value: "average", label: "Average"}, {value: "poor", label: "Poor / Damaged"}], "Select Dashboard Condition")}
                            {renderSelect("dashboardWarningLights", "Dashboard Warning Lights", [{value: "normal", label: "All lights normal"}, {value: "minor", label: "Minor warning"}, {value: "critical", label: "Critical warning"}], "Select Warning Light Status")}
                            {renderSelect("steeringWheel", "Steering Wheel", [{value: "excellent", label: "Excellent"}, {value: "normal_wear", label: "Normal Wear"}, {value: "worn_out", label: "Worn Out"}, {value: "damaged", label: "Damaged"}], "Select Steering Wheel Condition")}
                            {renderSelect("roofLining", "Roof Lining", [{value: "clean", label: "Clean"}, {value: "dirty", label: "Slightly Dirty"}, {value: "sagging", label: "Sagging / Stained"}, {value: "damaged", label: "Damaged"}], "Select Roof Lining Condition")}
                            {renderRadioGroup("floorMats", "Floor Mats", [{value: "present", label: "Present"}, {value: "not_present", label: "Not Present"}])}
                            {renderSelect("ac", "A/C", [{value: "working", label: "Cooling Well"}, {value: "weak", label: "Cooling Less"}, {value: "noise", label: "Noise / Smell"}, {value: "not_working", label: "Not Working"}], "Select A/C Condition")}
                            {renderSelect("infotainment", "Infotainment", [{value: "working", label: "Working Perfect"}, {value: "minor_issues", label: "Minor Issues"}, {value: "touch_issue", label: "Touch / Sound Issue"}, {value: "not_working", label: "Not Working"}], "Select Infotainment Condition")}
                        </div>
                    </TabsContent>

                    <TabsContent value="electrical" className="mt-0">
                        <h3 className="text-lg font-semibold mb-4">Electrical &amp; Electronics</h3>
                        <div className="space-y-4 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                            {renderSelect("powerWindows", "Power Windows", [{value: "all_working", label: "All Working"}, {value: "one_not_working", label: "1 Window Not Working"}, {value: "multiple_not_working", label: "Multiple Not Working"}, {value: "none_working", label: "None Working"}], "Select Power Window Condition")}
                            {renderRadioGroup("centralLocking", "Central Locking", [{value: "working", label: "Working"}, {value: "not_working", label: "Not Working"}])}
                            {renderRadioGroup("headlights", "Headlights", [{value: "working", label: "Working"}, {value: "not_working", label: "Not Working"}])}
                            {renderRadioGroup("indicators", "Indicators", [{value: "working", label: "Working"}, {value: "not_working", label: "Not Working"}])}
                            {renderRadioGroup("horn", "Horn", [{value: "working", label: "Working"}, {value: "not_working", label: "Not Working"}])}
                            {renderSelect("reverseCamera", "Reverse Camera", [{value: "working", label: "Working"},{value: "minor_issue", label: "Minor Issue"}, {value: "not_working", label: "Not Working"}, {value: "na", label: "Not Applicable"}], "Select Reverse Camera Condition")}
                            {renderSelect("sensors", "Parking Sensors", [{value: "working", label: "Working"}, {value: "some_not_working", label: "Some Not Working"}, {value: "not_working", label: "Not Working"}, {value: "na", label: "Not Applicable"}], "Select Sensor Condition")}
                            {renderRadioGroup("wipers", "Wipers", [{value: "working", label: "Working"}, {value: "not_working", label: "Not Working"}])}
                        </div>
                    </TabsContent>

                    <TabsContent value="tyres" className="mt-0">
                        <h3 className="text-lg font-semibold mb-4">Tyres &amp; Wheels</h3>
                        <div className="space-y-4 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                            {renderSelect("frontTyres", "Front Tyres Life", [{value: "75-100", label: "75% - 100%"}, {value: "50-74", label: "50% - 74%"}, {value: "25-49", label: "25% - 49%"}, {value: "0-24", label: "Below 25%"}], "Select Tyre Life")}
                            {renderSelect("rearTyres", "Rear Tyres Life", [{value: "75-100", label: "75% - 100%"}, {value: "50-74", label: "50% - 74%"}, {value: "25-49", label: "25% - 49%"}, {value: "0-24", label: "Below 25%"}], "Select Tyre Life")}
                            {renderSelect("spareTyre", "Spare Tyre", [{value: "usable", label: "Present (Usable)"}, {value: "worn", label: "Present (Worn)"}, {value: "not_present", label: "Not Present"}], "Select Spare Tyre Condition")}
                            {renderRadioGroup("alloyWheels", "Alloy Wheels", [{value: "yes", label: "Yes"}, {value: "no", label: "No"}])}
                            {renderSelect("wheelAlignment", "Wheel Alignment", [{value: "ok", label: "OK"}, {value: "needed", label: "Needed"}], "Select Alignment Condition")}
                            {renderRadioGroup("newlyChanged", "Recently Changed (All Tyres)", [{value: "yes", label: "Yes (within 6 months)"}, {value: "no", label: "No"}])}
                        </div>
                    </TabsContent>

                    <TabsContent value="safety" className="mt-0">
                        <h3 className="text-lg font-semibold mb-4">Safety Features</h3>
                        <div className="space-y-4 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                            {renderSelect("airbags", "Airbags", [{value: "dual_multiple", label: "Dual / Multiple Airbags"}, {value: "driver_only", label: "Driver Airbag Only"}, {value: "none", label: "No Airbags"}, {value: "deployed_faulty", label: "Deployed / Faulty"}], "Select Airbag Configuration")}
                            {renderRadioGroup("abs", "ABS", [{value: "yes", label: "Yes"}, {value: "no", label: "No"}])}
                            {renderSelect("seatBelts", "Seat Belts", [{value: "all_working", label: "All Working"}, {value: "one_not_working", label: "One Not Working"}, {value: "multiple_not_working", label: "Multiple Not Working"}], "Select Seat Belts Status")}
                            {renderRadioGroup("childLock", "Child Lock", [{value: "yes", label: "Yes"}, {value: "no", label: "No"}])}
                            {renderRadioGroup("immobilizer", "Immobilizer", [{value: "yes", label: "Yes"}, {value: "no", label: "No"}])}
                        </div>
                    </TabsContent>

                    <TabsContent value="documents" className="mt-0">
                        <h3 className="text-lg font-semibold mb-4">Documents</h3>
                        <div className="space-y-4 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                            {renderSelect("rcBook", "RC Book", [{value: "original", label: "Original (Incl. Smart Card/Digital)"}, {value: "duplicate", label: "Duplicate RC"}, {value: "lost", label: "Lost / Not Available"}], "Select RC Book Status")}
                            {renderSelect("insuranceDoc", "Insurance", [{value: "comprehensive", label: "Valid Comprehensive"}, {value: "third_party", label: "Valid Third-Party"}, {value: "expired_30", label: "Expired (<= 30 days)"}, {value: "expired_90", label: "Expired (> 30 days)"}, {value: "none", label: "Not Available"}], "Select Insurance Status")}
                            {renderSelect("puc", "PUC", [{value: "valid", label: "Valid"}, {value: "expired", label: "Expired"}, {value: "not_available", label: "Not Available"}], "Select PUC Status")}
                            {renderSelect("serviceRecords", "Service Records", [{value: "full", label: "Full History Available"}, {value: "partial", label: "Partial History"}, {value: "none", label: "Not Available"}], "Select Service Records Status")}
                            {renderSelect("duplicateKey", "Duplicate Key", [{value: "available", label: "Available"}, {value: "not_available", label: "Not Available"}], "Select Duplicate Key Status")}
                            {renderSelect("noc", "NOC", [{value: "not_required", label: "Not Required"}, {value: "available", label: "Available"}, {value: "pending", label: "Pending"}, {value: "required_but_not_available", label: "Required but Not Available"}], "Select NOC Status")}
                        </div>
                    </TabsContent>

                    <TabsContent value="additional" className="mt-0">
                        <h3 className="text-lg font-semibold mb-4">Additional Features</h3>
                        <div className="space-y-4 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                            {renderRadioGroup("musicSystem", "Music System", [{value: "yes", label: "Yes"}, {value: "no", label: "No"}])}
                            {renderRadioGroup("reverseParkingSensor", "Reverse Parking Sensor", [{value: "yes", label: "Yes"}, {value: "no", label: "No"}])}
                            {renderRadioGroup("dashcam", "Dashcam", [{value: "yes", label: "Yes"}, {value: "no", "label": "No"}])}
                            {renderRadioGroup("fogLamps", "Fog Lamps", [{value: "yes", label: "Yes"}, {value: "no", label: "No"}])}
                            {renderRadioGroup("gpsTracker", "GPS Tracker", [{value: "yes", label: "Yes"}, {value: "no", label: "No"}])}
                        </div>
                    </TabsContent>
                  </div>
                </div>
              </div>
            </Tabs>

            <div id="submission-section" className="pt-6 space-y-4">
                <div className="flex flex-col items-center justify-center">
                    {isLastSection ? (
                        <Button type="submit" className="w-full" size="lg" disabled={loading}>
                            <Sparkles className="mr-2 h-4 w-4" />
                            {loading ? 'Analyzing & Saving...' : 'Get Valuation & Save Report'}
                        </Button>
                    ) : (
                        <Button type="button" onClick={handleNextSection} className="w-full" size="lg">
                            Next Section <ChevronRight className="mr-2 h-4" />
                        </Button>
                    )}
                </div>

                {!form.formState.isValid && form.formState.isSubmitted && (
                    <p className="text-sm font-medium text-destructive text-center">Please fill out all required fields before proceeding.</p>
                )}
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
