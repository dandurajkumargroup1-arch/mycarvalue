
'use client';

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Download, CarIcon, Lightbulb, TrendingUp, Target, ShieldCheck, MessageCircleWarning, ShieldQuestion } from "lucide-react";
import { format } from "date-fns";
import { Separator } from "@/components/ui/separator";

const DetailSection = ({ title, data }: { title: string, data: Record<string, any> }) => {
    const formatKey = (key: string) => {
        return key
            .replace(/([A-Z])/g, ' $1')
            .replace(/^./, (str) => str.toUpperCase());
    };

    const formatValue = (value: any) => {
        if (typeof value === 'boolean') return value ? 'Yes' : 'No';
        if (value === undefined || value === null || value === '') return 'N/A';
        if (value === 'immediate_sale') return 'Immediate Sale';
        if (value === 'price_check') return 'Just Price Check';
        if (value === 'market_value') return 'Knowing Market Value';
        return String(value);
    };

    const entries = Object.entries(data).filter(([_, value]) => value !== undefined && value !== null && value !== '');

    if (entries.length === 0) return null;

    return (
        <section className="mt-6 pt-6 border-t">
            <h2 className="text-xl font-bold text-gray-800 mb-4">{title}</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-4 text-sm">
                {entries.map(([key, value]) => (
                    <div key={key}>
                        <p className="text-gray-500">{formatKey(key)}</p>
                        <p className="font-medium text-gray-800">{formatValue(value)}</p>
                    </div>
                ))}
            </div>
        </section>
    );
};

const ValuationResultDisplay = ({ result, onNewValuation }: { result: { valuation: any; formData: any; } | null, onNewValuation: () => void }) => {
  const { valuation, formData } = result || {};
  const reportRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [reportId, setReportId] = useState('');

  useEffect(() => {
    // Generate a unique report ID when the component mounts
    const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
    setReportId(`MCV-${randomPart}`);
  }, []);

  if (!result || !valuation || !formData) {
    return (
      <Card className="shadow-lg text-center">
        <CardHeader>
            <CardTitle>Valuation Data Missing</CardTitle>
            <CardDescription>Could not display the report. Please try a new valuation.</CardDescription>
        </CardHeader>
        <CardContent>
            <Button onClick={onNewValuation}>Start New Valuation</Button>
        </CardContent>
      </Card>
    )
  }
  
  const {
      displayName, whatsappNumber, vehicleNumber,
      priceCheckReason, make, model, variant, fuelType, transmission, manufactureYear, registrationYear, registrationState, ownership,
      odometer, usageType, cityDriven, floodDamage, accident, serviceCenter,
      engine, gearbox, clutch, battery, radiator, exhaust, suspension, steering, brakes,
      frontBumper, rearBumper, bonnet, roof, doors, fenders, paintQuality, accidentHistory, scratches, dents, rust_areas,
      seats, seatCovers, dashboard, steeringWheel, roofLining, floorMats, ac, infotainment,
      powerWindows, centralLocking, headlights, indicators, horn, reverseCamera, sensors, wipers,
      frontTyres, rearTyres, spareTyre, alloyWheels, wheelAlignment,
      airbags, abs, seatBelts, childLock, immobilizer,
      rcBook, insuranceDoc, puc, serviceRecords, duplicateKey, noc,
      musicSystem, reverseParkingSensor, dashcam, fogLamps, gpsTracker
  } = formData || {};


  const handleDownloadReport = async () => {
    const reportElement = reportRef.current;
    if (!reportElement) return;

    setIsDownloading(true);

    try {
        const canvas = await html2canvas(reportElement, {
            scale: 2,
            useCORS: true,
            backgroundColor: '#ffffff',
        });

        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({
            orientation: 'p',
            unit: 'px',
            format: [canvas.width, canvas.height],
        });

        pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
        pdf.save(`mycarvalue.in-Report-${formData.make}-${formData.model}.pdf`);

    } catch (error) {
        console.error("Failed to download report:", error);
    } finally {
        setIsDownloading(false);
    }
  };
  
  const inr = (value: number, short = false) => {
    if (short) {
        return `₹${(value / 100000).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} L`;
    }
    return `₹${value.toLocaleString('en-IN')}`;
  }
  
  return (
     <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="overflow-y-auto">
        <div id="pdf-report-content" ref={reportRef} className="bg-white text-gray-800 p-8 rounded-lg border">
            <header className="flex justify-between items-start pb-4 border-b border-gray-200">
                <div className="flex items-center gap-2">
                    <CarIcon className="h-8 w-8 text-primary"/>
                    <div>
                        <h1 className="text-xl font-bold text-gray-800">mycarvalue.in</h1>
                        <p className="text-sm text-gray-500">AI Valuation Report</p>
                    </div>
                </div>
                <div className="text-right">
                    <p className="font-semibold">{formData.make} {formData.model}</p>
                    <p className="text-sm text-gray-500">For: {formData.displayName}</p>
                </div>
            </header>

            <section className="my-6 p-4 bg-gray-50 rounded-lg border text-xs text-gray-600">
                <div className="grid grid-cols-2 gap-4">
                    <div><span className="font-semibold">Report ID:</span> {reportId}</div>
                    <div><span className="font-semibold">Generated On:</span> {format(new Date(), "dd/MM/yyyy - HH:mm")}</div>
                    <div><span className="font-semibold">Location:</span> {formData.registrationState}</div>
                    <div><span className="font-semibold">Valuation Type:</span> Independent Market Analysis</div>
                </div>
                <Separator className="my-3"/>
                <div className="flex items-start gap-2 text-gray-500">
                    <ShieldCheck className="h-4 w-4 mt-0.5 flex-shrink-0 text-green-600" />
                    <p><span className="font-semibold text-gray-700">Disclaimer:</span> This valuation is generated independently using market trends and vehicle condition. It is not influenced by dealers or buyers.</p>
                </div>
            </section>
            
            <section className="bg-primary/5 rounded-lg p-6 text-center my-8 border border-primary/20">
                <h3 className="text-sm font-semibold text-primary">Your Final Estimated Price</h3>
                <p className="text-5xl font-bold text-primary tracking-tight mt-1">{inr(valuation.bestPrice)}</p>
            </section>

            <section className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                 <Card className="border-green-200 bg-green-50/50">
                    <CardHeader>
                        <CardTitle className="text-green-800">Price Confidence</CardTitle>
                        <CardDescription className="text-green-700">Use these insights to negotiate the best deal.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 text-sm">
                        <div className="flex justify-between items-center p-2 rounded-md bg-white">
                            <div className="flex items-center gap-2">
                                <TrendingUp className="text-green-600"/>
                                <span className="text-gray-600 font-medium">Fair Market Value</span>
                            </div>
                            <span className="font-bold text-green-700">{inr(valuation.marketValueMin, true)} - {inr(valuation.marketValueMax, true)}</span>
                        </div>
                        <div className="flex justify-between items-center p-2 rounded-md bg-white">
                            <div className="flex items-center gap-2">
                                <Target className="text-green-600"/>
                                <span className="text-gray-600 font-medium">Ideal Listing Price</span>
                            </div>
                            <span className="font-bold text-green-700">{inr(valuation.idealListingPrice, true)}</span>
                        </div>
                        <Separator className="my-2"/>
                         <div className="text-xs text-green-800 bg-green-100/70 p-3 rounded-md flex gap-2">
                            <Lightbulb className="h-4 w-4 flex-shrink-0 mt-0.5" />
                            <div>
                                <span className="font-semibold">Buyer Psychology Tip:</span> {valuation.buyerPsychologyTip}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-amber-800">What Buyers Usually Say</CardTitle>
                        <CardDescription className="text-amber-700">Be prepared for these negotiation tactics.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                        <div className="flex items-start gap-2 text-gray-600">
                            <MessageCircleWarning className="h-4 w-4 mt-0.5 flex-shrink-0 text-amber-600" />
                            <p>"Market is down right now."</p>
                        </div>
                        <div className="flex items-start gap-2 text-gray-600">
                             <MessageCircleWarning className="h-4 w-4 mt-0.5 flex-shrink-0 text-amber-600" />
                            <p>"A dealer is offering me much less for a similar car."</p>
                        </div>
                         <div className="flex items-start gap-2 text-gray-600">
                             <MessageCircleWarning className="h-4 w-4 mt-0.5 flex-shrink-0 text-amber-600" />
                            <p>"These minor scratches will cost a lot to fix."</p>
                        </div>
                        <Separator className="my-3"/>
                        <div className="flex items-start gap-3 p-3 rounded-md bg-amber-100/70 text-amber-900">
                            <ShieldQuestion className="h-4 w-4 mt-0.5 flex-shrink-0" />
                            <div>
                                <p className="font-semibold">Your Response:</p>
                                <p>Stick to the MyCarValue price range unless there are major, undisclosed defects. Your price is based on fair market data.</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </section>
            
            <DetailSection title="Vehicle Details" data={{ priceCheckReason, make, model, variant, fuelType, transmission, manufactureYear, registrationYear, registrationState, ownership, odometer: `${odometer} km` }} />
            <DetailSection title="Condition: Engine &amp; Mechanical" data={{ engine, gearbox, clutch, battery, radiator, exhaust, suspension, steering, brakes }} />
            <DetailSection title="Condition: Exterior" data={{ frontBumper, rearBumper, bonnet, roof, doors, fenders, paintQuality, scratches: `${scratches}`, dents: `${dents}`, rust_areas: rust_areas, accidentHistory }} />
            <DetailSection title="Condition: Interior" data={{ seats, seatCovers, dashboard, steeringWheel, roofLining, floorMats, ac, infotainment }} />
            <DetailSection title="Condition: Electrical &amp; Tyres" data={{ powerWindows, centralLocking, headlights, indicators, horn, reverseCamera, sensors, wipers, frontTyres: `${frontTyres}% life`, rearTyres: `${rearTyres}% life`, spareTyre, alloyWheels, wheelAlignment }} />
            <DetailSection title="Documents &amp; Safety" data={{ rcBook, insuranceDoc, puc, serviceRecords, duplicateKey, noc, airbags, abs, seatBelts, childLock, immobilizer }} />
            <DetailSection title="Usage &amp; History" data={{ usageType, cityDriven, floodDamage, accident, serviceCenter }} />
            <DetailSection title="Additional Features" data={{ musicSystem, reverseParkingSensor, dashcam, fogLamps, gpsTracker }} />

            <footer className="mt-10 pt-4 border-t border-gray-200 text-xs text-center text-gray-500">
                <p>&copy; {new Date().getFullYear()} mycarvalue.in. All rights reserved.</p>
                <p className="mt-2 text-gray-400">This is an AI-generated report and should be used as an estimate. Physical inspection may affect the final price.</p>
            </footer>
        </div>
        <div className="text-center pt-6 flex gap-4 justify-center">
             <Button onClick={onNewValuation} size="lg" variant="outline">
                Start New Valuation
            </Button>
            <Button onClick={handleDownloadReport} size="lg" disabled={isDownloading}>
                {isDownloading ? 'Downloading...' : <> <Download className="mr-2 h-4 w-4" /> Download Report </>}
            </Button>
        </div>
    </motion.div>
  );
};


export default function ResultPage() {
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const paid = localStorage.getItem("paymentSuccess");
        const storedResult = localStorage.getItem('valuationResult');

        if (!paid || !storedResult) {
            router.push('/');
            return;
        }

        if (storedResult) {
            try {
                setResult(JSON.parse(storedResult));
            } catch (error) {
                console.error("Failed to parse valuation result from localStorage", error);
                router.push('/'); // Redirect if data is corrupted
            }
        }
        setLoading(false);
    }, [router]);

    const handleNewValuation = () => {
        localStorage.removeItem('valuationResult');
        localStorage.removeItem('paymentSuccess');
        router.push('/valuation');
    }

    if (loading) {
        return (
            <div className="container mx-auto max-w-3xl py-12">
                <Skeleton className="h-96 w-full" />
            </div>
        )
    }

    return (
        <div className="container mx-auto max-w-3xl py-12">
            <ValuationResultDisplay result={result} onNewValuation={handleNewValuation} />
        </div>
    );
}
