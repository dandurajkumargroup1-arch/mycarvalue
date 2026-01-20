
'use client';

import { useState, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Car, Download, ShieldCheck, TrendingUp, Tag, Target, Info } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";


// Helper component for displaying a single detail item in the report
const DetailItem = ({ label, value }: { label: string, value: string | number | undefined | null }) => {
    if (value === undefined || value === null || value === '') return null;
    return (
        <div>
            <p className="text-xs text-slate-500 capitalize">{label.replace(/([A-Z])/g, ' $1')}</p>
            <p className="font-medium text-slate-800 text-sm">{String(value)}</p>
        </div>
    );
};

// Helper component for report sections
const ReportSection = ({ title, children }: { title: string, children: React.ReactNode }) => (
    <section className="mt-8">
        <h2 className="text-base font-semibold text-slate-900 pb-2 border-b mb-4">{title}</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-4">
            {children}
        </div>
    </section>
);


const ValuationResultDisplay = ({ result, onNewValuation }: { result: { valuation: any; formData: any; }, onNewValuation: () => void }) => {
  const { valuation, formData } = result;
  const [clientData, setClientData] = useState<{ reportId: string; generatedOn: string; } | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    // This effect is safe because this component is only rendered on the client.
    const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
    const reportId = `MCV-${randomPart}`;

    const generatedOn = new Date().toLocaleDateString('en-GB', {
        day: 'numeric', month: 'long', year: 'numeric'
    });
    
    setClientData({ reportId, generatedOn });
  }, []);

 const handleDownloadPdf = async () => {
    setIsDownloading(true);
    try {
        const { default: jsPDF } = await import("jspdf");
        const { default: html2canvas } = await import("html2canvas");

        const reportElement = document.getElementById('report-content');
        if (!reportElement) {
            console.error("Report content element not found!");
            setIsDownloading(false);
            return;
        }

        const canvas = await html2canvas(reportElement, {
            scale: 2,
            useCORS: true,
            backgroundColor: '#ffffff'
        });

        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({
            orientation: 'p',
            unit: 'pt',
            format: 'a4'
        });

        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        
        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;
        const canvasAspectRatio = canvasWidth / canvasHeight;

        let finalPdfWidth = pdfWidth;
        let finalPdfHeight = pdfWidth / canvasAspectRatio;

        if (finalPdfHeight > pdfHeight) {
            finalPdfHeight = pdfHeight;
            finalPdfWidth = pdfHeight * canvasAspectRatio;
        }
        
        const xOffset = (pdfWidth - finalPdfWidth) / 2;
        const yOffset = (pdfHeight - finalPdfHeight) / 2;


        pdf.addImage(imgData, 'PNG', xOffset, yOffset, finalPdfWidth, finalPdfHeight);

        pdf.save(`mycarvalue-report-${clientData?.reportId || 'report'}.pdf`);
        
    } catch (err) {
        console.error("Error generating PDF:", err);
    } finally {
        setIsDownloading(false);
    }
  };
  
  const {
      make, model, variant, otherVariant, fuelType, transmission, manufactureYear, registrationYear, registrationState, ownership, odometer,
      engine, gearbox, clutch, battery, radiator, exhaust, suspension, steering, brakes,
      frontBumper, rearBumper, bonnet, roof, doors, fenders, paintQuality, scratches, dents, rust_areas, accidentHistory,
      seats, seatCovers, dashboard, steeringWheel, roofLining, floorMats, ac, infotainment, dashboardWarningLights,
      powerWindows, centralLocking, headlights, indicators, horn, reverseCamera, sensors, wipers,
      frontTyres, rearTyres, spareTyre, alloyWheels, wheelAlignment, newlyChanged,
      rcBook, insuranceDoc, puc, serviceRecords, duplicateKey, noc, airbags, abs, seatBelts, childLock, immobilizer,
      usageType, cityDriven, floodDamage, accident, serviceCenter,
      musicSystem, reverseParkingSensor, dashcam, fogLamps, gpsTracker
  } = formData || {};

  const finalVariant = variant === 'Other' && otherVariant ? otherVariant : variant;


  const inr = (value: number) => {
    if (isNaN(value)) return 'N/A';
    return `₹${Math.round(value).toLocaleString('en-IN')}`;
  }
  
  const depreciationSections = [
    { label: "Usage", value: valuation.u_usageDepreciationPercentage },
    { label: "Engine & Mechanical", value: valuation.e_engineDepreciationPercentage },
    { label: "Fluids", value: valuation.f_fluidsDepreciationPercentage },
    { label: "Exterior", value: valuation.ex_exteriorDepreciationPercentage },
    { label: "Interior", value: valuation.in_interiorDepreciationPercentage },
    { label: "Electrical", value: valuation.el_electricalDepreciationPercentage },
    { label: "Tyres", value: valuation.t_tyresDepreciationPercentage },
    { label: "Safety", value: valuation.s_safetyDepreciationPercentage },
    { label: "Documents", value: valuation.d_documentsDepreciationPercentage },
  ];

  const depreciationBreakdown = [
    { category: 'Odometer', value: valuation.depreciation.odometer },
    { category: 'Vehicle Age', value: valuation.depreciation.age },
    { category: 'Usage History', value: valuation.depreciation.usage },
    { category: 'Engine Condition', value: valuation.depreciation.engine },
    { category: 'Exterior Condition', value: valuation.depreciation.exterior },
    { category: 'Interior Condition', value: valuation.depreciation.interior },
    { category: 'Tyre Condition', value: valuation.depreciation.tyres },
    { category: 'Documents', value: valuation.depreciation.documents },
    { category: 'Other (Electrical, Safety, Fluids)', value: valuation.depreciation.electrical + valuation.depreciation.safety + valuation.depreciation.fluids },
  ].filter(item => item.value > 0);


  const formatValue = (val: any) => {
      if (val === undefined || val === null || val === '') return 'N/A';
      return String(val)
        .replace(/_/g, ' ')
        .replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
     <div className="bg-slate-100 p-2 md:p-8">
        <div id="report-content" className="bg-white text-slate-800 p-6 md:p-8 rounded-lg shadow-lg max-w-4xl mx-auto">
            
            <header className="flex justify-between items-start pb-4 border-b border-slate-200">
                <div>
                    <div className="flex items-center gap-2">
                        <Car className="h-7 w-7 text-slate-900"/>
                        <span className="font-bold text-xl text-slate-900">mycarvalue.in</span>
                    </div>
                    <p className="text-xs text-slate-500 ml-1">AI Valuation Report</p>
                </div>
                <div className="text-right">
                    <p className="font-semibold text-base text-slate-900">{make} {model}</p>
                    {clientData && <p className="text-xs text-slate-500">Report ID: {clientData.reportId} | Generated: {clientData.generatedOn}</p>}
                </div>
            </header>

            <section className="bg-slate-50 rounded-lg p-6 text-center my-8 border border-slate-200">
                <h3 className="text-sm font-semibold text-slate-700">Your Best Selling Price Estimate</h3>
                <p className="text-5xl font-bold tracking-tight my-2 text-slate-900">{inr(valuation.bestPrice)}</p>
                <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary border border-primary/20">
                    <ShieldCheck className="h-4 w-4"/>
                    Valuation Verified by mycarvalue.in
                </div>
            </section>
            
            <section className="my-8">
                <h2 className="text-base font-semibold text-slate-900 mb-3 text-center">Price Confidence Guide</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                    <Card className="p-4 bg-slate-50">
                        <TrendingUp className="mx-auto h-7 w-7 text-slate-600 mb-2"/>
                        <CardTitle className="text-lg">Market Value</CardTitle>
                        <CardDescription className="text-xl font-bold text-slate-800">{inr(valuation.marketValueMin)} - {inr(valuation.marketValueMax)}</CardDescription>
                    </Card>
                    <Card className="p-4 bg-slate-50 border-primary/50">
                        <Target className="mx-auto h-7 w-7 text-primary mb-2"/>
                        <CardTitle className="text-lg">Expected Final Deal</CardTitle>
                        <CardDescription className="text-xl font-bold text-primary">{inr(valuation.expectedFinalDeal)}</CardDescription>
                    </Card>
                    <Card className="p-4 bg-slate-50">
                        <Tag className="mx-auto h-7 w-7 text-slate-600 mb-2"/>
                        <CardTitle className="text-lg">Ideal Listing Price</CardTitle>
                        <CardDescription className="text-xl font-bold text-slate-800">{inr(valuation.idealListingPrice)}</CardDescription>
                    </Card>
                </div>
                 <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-center">
                    <Info className="inline-block h-5 w-5 text-blue-600 mr-2" />
                    <span className="text-sm text-blue-800">{valuation.buyerPsychologyTip}</span>
                </div>
            </section>

            <section className="grid grid-cols-1 md:grid-cols-2 gap-8 my-8">
                <div>
                    <h2 className="text-base font-semibold text-slate-900 mb-3">Price Calculation Summary</h2>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between"><span className="text-slate-600">Your Expected Price</span> <span className="font-medium text-slate-800">{inr(valuation.p0_expectedPrice)}</span></div>
                        <div className="flex justify-between"><span className="text-slate-600">After Odometer Depreciation ({valuation.od_odometerDepreciationPercentage.toFixed(1)}%)</span> <span className="font-medium text-slate-800">{inr(valuation.p1_afterOdometer)}</span></div>
                        <div className="flex justify-between"><span className="text-slate-600">After Condition Depreciation</span> <span className="font-medium text-slate-800">{inr(valuation.p9_afterAllSections)}</span></div>
                        <div className="flex justify-between"><span className="text-slate-600">After Age Depreciation ({valuation.yd_yearDepreciationPercentage.toFixed(1)}%)</span> <span className="font-medium text-slate-800">{inr(valuation.p10_afterYear)}</span></div>
                        {valuation.goodCarBonusApplied && <div className="flex justify-between text-emerald-600"><span className="font-medium">Good Car Bonus</span> <span className="font-medium">+ {inr(valuation.finalPrice - valuation.p10_afterYear)}</span></div>}
                        <div className="flex justify-between pt-2 border-t font-bold"><span className="text-slate-800">Final Assessed Value</span> <span className="text-slate-900">{inr(valuation.finalPrice)}</span></div>
                    </div>
                </div>
                <div>
                    <h2 className="text-base font-semibold text-slate-900 mb-3">Depreciation by Section (%)</h2>
                     <div className="space-y-2 text-sm">
                        {depreciationSections.map(sec => (
                            <div key={sec.label} className="flex justify-between">
                                <span className="text-slate-600">{sec.label}</span>
                                <span className="font-medium text-slate-800">{sec.value.toFixed(1)}%</span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
            
            <section className="my-8">
                 <h2 className="text-base font-semibold text-slate-900 mb-3 text-center">Depreciation Breakdown (Estimated Value Lost)</h2>
                 <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Depreciation Factor</TableHead>
                            <TableHead className="text-right">Value Lost</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {depreciationBreakdown.map((item) => (
                            <TableRow key={item.category}>
                                <TableCell className="font-medium">{item.category}</TableCell>
                                <TableCell className="text-right font-mono">-{inr(item.value)}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                 </Table>
            </section>

            <ReportSection title="Vehicle Details">
                <DetailItem label="Make" value={make} />
                <DetailItem label="Model" value={model} />
                <DetailItem label="Variant" value={finalVariant} />
                <DetailItem label="Fuel Type" value={fuelType} />
                <DetailItem label="Transmission" value={transmission} />
                <DetailItem label="Manufacture Year" value={manufactureYear} />
                <DetailItem label="Registration Year" value={registrationYear} />
                <DetailItem label="Registration State" value={registrationState} />
                <DetailItem label="Ownership" value={ownership} />
                <DetailItem label="Odometer" value={`${odometer} km`} />
            </ReportSection>

            <ReportSection title="Condition: Engine & Mechanical">
                <DetailItem label="Engine" value={formatValue(engine)} />
                <DetailItem label="Gearbox" value={formatValue(gearbox)} />
                <DetailItem label="Clutch" value={formatValue(clutch)} />
                <DetailItem label="Battery" value={formatValue(battery)} />
                <DetailItem label="Radiator" value={formatValue(radiator)} />
                <DetailItem label="Exhaust" value={formatValue(exhaust)} />
                <DetailItem label="Suspension" value={formatValue(suspension)} />
                <DetailItem label="Steering" value={formatValue(steering)} />
                <DetailItem label="Brakes" value={formatValue(brakes)} />
            </ReportSection>

            <ReportSection title="Condition: Exterior">
                <DetailItem label="Front Bumper" value={formatValue(frontBumper)} />
                <DetailItem label="Rear Bumper" value={formatValue(rearBumper)} />
                <DetailItem label="Bonnet" value={formatValue(bonnet)} />
                <DetailItem label="Roof" value={formatValue(roof)} />
                <DetailItem label="Doors" value={formatValue(doors)} />
                <DetailItem label="Fenders" value={formatValue(fenders)} />
                <DetailItem label="Paint Quality" value={formatValue(paintQuality)} />
                <DetailItem label="Scratches" value={`${scratches}`} />
                <DetailItem label="Dents" value={`${dents}`} />
                <DetailItem label="Rust Areas" value={formatValue(rust_areas)} />
                <DetailItem label="Accident History" value={formatValue(accidentHistory)} />
            </ReportSection>

            <ReportSection title="Condition: Interior">
                <DetailItem label="Seats" value={formatValue(seats)} />
                <DetailItem label="Seat Covers" value={formatValue(seatCovers)} />
                <DetailItem label="Dashboard" value={formatValue(dashboard)} />
                <DetailItem label="Steering Wheel" value={formatValue(steeringWheel)} />
                <DetailItem label="Roof Lining" value={formatValue(roofLining)} />
                <DetailItem label="Floor Mats" value={formatValue(floorMats)} />
                <DetailItem label="A/C" value={formatValue(ac)} />
                <DetailItem label="Infotainment" value={formatValue(infotainment)} />
                <DetailItem label="Dashboard Warning Lights" value={formatValue(dashboardWarningLights)} />
            </ReportSection>

            <ReportSection title="Condition: Electrical & Tyres">
                <DetailItem label="Power Windows" value={formatValue(powerWindows)} />
                <DetailItem label="Central Locking" value={formatValue(centralLocking)} />
                <DetailItem label="Headlights" value={formatValue(headlights)} />
                <DetailItem label="Indicators" value={formatValue(indicators)} />
                <DetailItem label="Horn" value={formatValue(horn)} />
                <DetailItem label="Reverse Camera" value={formatValue(reverseCamera)} />
                <DetailItem label="Parking Sensors" value={formatValue(sensors)} />
                <DetailItem label="Wipers" value={formatValue(wipers)} />
                <DetailItem label="Front Tyres Life" value={`${frontTyres}%`} />
                <DetailItem label="Rear Tyres Life" value={`${rearTyres}%`} />
                <DetailItem label="Spare Tyre" value={formatValue(spareTyre)} />
                <DetailItem label="Alloy Wheels" value={formatValue(alloyWheels)} />
                <DetailItem label="Wheel Alignment" value={formatValue(wheelAlignment)} />
                <DetailItem label="Tyres Newly Changed" value={formatValue(newlyChanged)} />
            </ReportSection>
            
            <ReportSection title="Documents & Safety">
                <DetailItem label="RC Book" value={formatValue(rcBook)} />
                <DetailItem label="Insurance" value={formatValue(insuranceDoc)} />
                <DetailItem label="PUC" value={formatValue(puc)} />
                <DetailItem label="Service Records" value={formatValue(serviceRecords)} />
                <DetailItem label="Duplicate Key" value={formatValue(duplicateKey)} />
                <DetailItem label="NOC" value={formatValue(noc)} />
                <DetailItem label="Airbags" value={formatValue(airbags)} />
                <DetailItem label="ABS" value={formatValue(abs)} />
                <DetailItem label="Seat Belts" value={formatValue(seatBelts)} />
                <DetailItem label="Child Lock" value={formatValue(childLock)} />
                <DetailItem label="Immobilizer" value={formatValue(immobilizer)} />
            </ReportSection>

            <ReportSection title="Usage & History">
                <DetailItem label="Usage Type" value={formatValue(usageType)} />
                <DetailItem label="Primarily City Driven" value={formatValue(cityDriven)} />
                <DetailItem label="Flood Damage" value={formatValue(floodDamage)} />
                <DetailItem label="Accident" value={formatValue(accident)} />
                <DetailItem label="Service Center" value={formatValue(serviceCenter)} />
            </ReportSection>

            <ReportSection title="Additional Features">
                <DetailItem label="Music System" value={formatValue(musicSystem)} />
                <DetailItem label="Reverse Parking Sensor" value={formatValue(reverseParkingSensor)} />
                <DetailItem label="Dashcam" value={formatValue(dashcam)} />
                <DetailItem label="Fog Lamps" value={formatValue(fogLamps)} />
                <DetailItem label="GPS Tracker" value={formatValue(gpsTracker)} />
            </ReportSection>


            <footer className="mt-10 pt-4 border-t border-slate-200 text-xs text-center text-slate-500">
                <p>mycarvalue1@gmail.com | +91-9492060040</p>
                <p className="mt-2">This is an AI-generated report and should be used as an estimate. Physical inspection may affect the final price.</p>
            </footer>
        </div>
        <div className="text-center pt-6 flex gap-4 justify-center print:hidden">
             <Button onClick={onNewValuation} size="lg" variant="outline">
                Start New Valuation
            </Button>
            <Button onClick={handleDownloadPdf} size="lg" disabled={!clientData || isDownloading}>
                {isDownloading ? (
                    'Downloading...'
                ) : (
                    <>
                        <Download className="mr-2 h-4 w-4" />
                        Download PDF
                    </>
                )}
            </Button>
        </div>
    </div>
  );
};

const ResultPageClient = () => {
    const [result, setResult] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isClient, setIsClient] = useState(false);
    const router = useRouter();

    useEffect(() => {
        setIsClient(true);
        if (typeof window === 'undefined') return;

        let storedResult: string | null = null;
        try {
            storedResult = localStorage.getItem('valuationResult');
        } catch (e) {
            console.error("LocalStorage is not available.", e);
            router.push('/');
            return;
        }

        if (storedResult) {
            try {
                const paid = localStorage.getItem("paymentSuccess");
                if (paid) {
                    setResult(JSON.parse(storedResult));
                } else {
                    router.push('/valuation');
                }
            } catch (error) {
                console.error("Failed to parse valuation result from localStorage", error);
                router.push('/');
            }
        } else {
             router.push('/');
        }
        
        setLoading(false);

    }, [router]);
    
    const handleNewValuation = () => {
        try {
            localStorage.removeItem('valuationResult');
            localStorage.removeItem('paymentSuccess');
            localStorage.removeItem('razorpay_payment_id');
        } catch (e) {
            console.error("Could not clear localStorage.", e);
        }
        router.push('/valuation');
    };

    if (!isClient || loading) {
        return (
            <div className="container mx-auto max-w-4xl py-12">
                <Skeleton className="h-[1200px] w-full" />
            </div>
        )
    }

    if (!result) {
        return (
            <div className="container mx-auto max-w-3xl py-12">
                 <Card className="shadow-lg text-center">
                    <CardHeader>
                        <CardTitle>Valuation Data Missing</CardTitle>
                        <CardDescription>Could not display the report. The data may have been cleared or payment was not completed.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button onClick={handleNewValuation}>Start New Valuation</Button>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="bg-slate-100">
            <div className="container mx-auto max-w-4xl py-8">
                <ValuationResultDisplay result={result} onNewValuation={handleNewValuation} />
            </div>
        </div>
    );
}

export default function ResultPage() {
    return (
        <Suspense fallback={
            <div className="container mx-auto max-w-4xl py-12">
                <Skeleton className="h-[1200px] w-full" />
            </div>
        }>
            <ResultPageClient />
        </Suspense>
    );
}
