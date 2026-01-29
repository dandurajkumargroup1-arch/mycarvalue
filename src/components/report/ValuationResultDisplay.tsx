
'use client';

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Car, Download, ShieldCheck, TrendingUp, Tag, Target, Info } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

// Helper component for displaying a single detail item in the report
const DetailItem = ({ label, value }: { label: string, value: string | number | undefined | null }) => {
    if (value === undefined || value === null || value === '') return null;
    return (
        <div>
            <p className="text-xs text-muted-foreground capitalize">{label.replace(/([A-Z])/g, ' $1')}</p>
            <p className="font-medium text-card-foreground text-sm">{String(value)}</p>
        </div>
    );
};

// Helper component for report sections
const ReportSection = ({ title, children }: { title: string, children: React.ReactNode }) => (
    <section className="mt-8">
        <h2 className="text-base font-semibold text-foreground pb-2 border-b mb-4">{title}</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-4">
            {children}
        </div>
    </section>
);


export const ValuationResultDisplay = ({ result, onNewValuation }: { result: { valuation: any; formData: any; }, onNewValuation: () => void }) => {
    
  // Robustly check if the result and its nested properties are valid.
  if (!result || !result.valuation || !result.formData) {
      return (
          <div className="bg-secondary p-2 md:p-8">
              <Card className="max-w-4xl mx-auto text-center">
                  <CardHeader>
                      <CardTitle>Error Displaying Report</CardTitle>
                      <CardDescription>The valuation data seems to be missing or corrupted. Please try creating a new valuation.</CardDescription>
                  </CardHeader>
                  <CardContent>
                      <Button onClick={onNewValuation}>Start New Valuation</Button>
                  </CardContent>
              </Card>
          </div>
      );
  }

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
    const reportElement = document.getElementById("report-content");

    if (!reportElement) {
        console.error("Report content element not found!");
        setIsDownloading(false);
        return;
    }

    reportElement.classList.add("pdf-render-mode");

    try {
        const canvas = await html2canvas(reportElement, {
            scale: 2,
            useCORS: true,
            backgroundColor: "#ffffff",
            width: reportElement.scrollWidth,
            height: reportElement.scrollHeight,
            windowWidth: reportElement.scrollWidth,
            windowHeight: reportElement.scrollHeight,
        });

        const pdf = new jsPDF({
            orientation: 'p',
            unit: 'px',
            format: [canvas.width, canvas.height],
        });

        pdf.addImage(canvas.toDataURL('image/png', 1.0), 'PNG', 0, 0, canvas.width, canvas.height);
        pdf.save(`mycarvalue-report-${clientData?.reportId || 'report'}.pdf`);

    } catch (err) {
        console.error("Error generating PDF:", err);
    } finally {
        reportElement.classList.remove("pdf-render-mode");
        setIsDownloading(false);
    }
  };
  
  const {
      displayName,
      vehicleNumber,
      make, model, variant, otherVariant, fuelType, transmission, manufactureYear, registrationYear, registrationState, ownership, odometer,
      engine, gearbox, clutch, battery, radiator, exhaust, suspension, steering, brakes,
      frontBumper, rearBumper, bonnet, roof, doors, fenders, paintQuality, scratches, dents, rust_areas, accidentHistory,
      seats, seatCovers, dashboard, steeringWheel, roofLining, floorMats, ac, infotainment, dashboardWarningLights,
      powerWindows, centralLocking, headlights, indicators, horn, reverseCamera, sensors, wipers,
      frontTyres, rearTyres, spareTyre, alloyWheels, wheelAlignment, newlyChanged,
      rcBook, insuranceDoc, puc, serviceRecords, duplicateKey, noc, airbags, abs, seatBelts, childLock, immobilizer,
      usageType, cityDriven, floodDamage, accident, serviceCenter,
      musicSystem, reverseParkingSensor, dashcam, fogLamps, gpsTracker,
      engineOil, coolant, brakeFluid, washerFluid,
  } = formData || {};

  const finalVariant = variant === 'Other' && otherVariant ? otherVariant : variant;


  const inr = (value: number) => {
    if (isNaN(value)) return 'N/A';
    return `₹${Math.round(value).toLocaleString('en-IN')}`;
  }
  
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
     <>
     <style jsx global>{`
      .pdf-render-mode {
        background: white !important;
        box-shadow: none !important;
        border: none !important;
        color: #1e293b; /* slate-800 */
      }
     `}</style>
     <div className="bg-secondary p-2 md:p-8">
        <div id="report-content" className="bg-card text-card-foreground p-6 md:p-8 rounded-lg shadow-lg max-w-4xl mx-auto">
            
            <header className="flex justify-between items-start pb-4 border-b">
                <div>
                    <div className="flex items-center gap-2">
                        <Car className="h-7 w-7 text-foreground"/>
                        <span className="font-bold text-xl text-foreground">mycarvalue.in</span>
                    </div>
                    <p className="text-xs text-muted-foreground ml-1">AI Valuation Report</p>
                </div>
                <div className="text-right">
                    <p className="font-semibold text-base text-foreground">{make} {model}</p>
                    {clientData && <p className="text-xs text-muted-foreground">Report ID: {clientData.reportId} | Generated: {clientData.generatedOn}</p>}
                </div>
            </header>

            <section className="mt-6 mb-8 p-4 bg-muted/50 rounded-lg border">
                <h2 className="text-sm font-semibold text-muted-foreground mb-3">Report For</h2>
                <div className="grid grid-cols-2 gap-4">
                    {displayName && (
                        <div>
                            <p className="text-xs text-muted-foreground">Customer Name</p>
                            <p className="font-medium text-card-foreground">{displayName}</p>
                        </div>
                    )}
                    {vehicleNumber && (
                        <div>
                            <p className="text-xs text-muted-foreground">Vehicle Number</p>
                            <p className="font-medium text-card-foreground uppercase">{vehicleNumber}</p>
                        </div>
                    )}
                </div>
            </section>

            <section className="bg-muted/50 rounded-lg p-6 flex flex-col items-center gap-2 my-8 border">
                <h3 className="text-sm font-semibold text-muted-foreground">Your Best Selling Price Estimate</h3>
                <p className="text-5xl font-bold tracking-tight text-foreground">{inr(valuation.bestPrice)}</p>
            </section>
            
            <section className="my-8">
                <h2 className="text-base font-semibold text-foreground mb-3 text-center">Price Confidence Guide</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                    <Card className="p-4 bg-muted/50">
                        <TrendingUp className="mx-auto h-7 w-7 text-muted-foreground mb-2"/>
                        <CardTitle className="text-sm font-medium text-muted-foreground">Market Range</CardTitle>
                        <CardDescription className="text-2xl font-bold text-card-foreground mt-1">{inr(valuation.marketValueMin)} - {inr(valuation.marketValueMax)}</CardDescription>
                    </Card>
                    <Card className="p-4 bg-muted/50 border-destructive/50">
                        <Target className="mx-auto h-7 w-7 text-destructive mb-2"/>
                        <CardTitle className="text-sm font-medium text-destructive">Fair Deal Price</CardTitle>
                        <CardDescription className="text-2xl font-bold text-destructive mt-1">{inr(valuation.expectedFinalDeal)}</CardDescription>
                    </Card>
                    <Card className="p-4 bg-muted/50">
                        <Tag className="mx-auto h-7 w-7 text-muted-foreground mb-2"/>
                        <CardTitle className="text-sm font-medium text-muted-foreground">Listing Price (For Ads)</CardTitle>
                        <CardDescription className="text-2xl font-bold text-card-foreground mt-1">{inr(valuation.idealListingPrice)}</CardDescription>
                    </Card>
                </div>
                 <div className="mt-4 p-3 bg-accent/10 border border-accent/20 rounded-lg text-center">
                    <Info className="inline-block h-5 w-5 text-primary mr-2" />
                    <span className="text-sm text-primary">{valuation.buyerPsychologyTip}</span>
                </div>
            </section>

            <section className="my-8">
                <div className="max-w-md mx-auto">
                    <h2 className="text-base font-semibold text-foreground mb-3">Price Calculation Summary</h2>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between"><span className="text-muted-foreground">Your Expected Price</span> <span className="font-medium text-card-foreground">{inr(valuation.p0_expectedPrice)}</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">After Odometer Depreciation ({(valuation.od_odometerDepreciationPercentage || 0).toFixed(1)}%)</span> <span className="font-medium text-card-foreground">{inr(valuation.p1_afterOdometer)}</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">After Condition Depreciation</span> <span className="font-medium text-card-foreground">{inr(valuation.p9_afterAllSections)}</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">After Age Depreciation ({(valuation.yd_yearDepreciationPercentage || 0).toFixed(1)}%)</span> <span className="font-medium text-card-foreground">{inr(valuation.p10_afterYear)}</span></div>
                        {valuation.goodCarBonusApplied && <div className="flex justify-between text-primary/90"><span className="font-medium">Good Car Bonus</span> <span className="font-medium">+ {inr(valuation.finalPrice - valuation.p10_afterYear)}</span></div>}
                        <div className="flex justify-between pt-2 border-t font-bold"><span className="text-foreground">Final Assessed Value</span> <span className="text-foreground">{inr(valuation.finalPrice)}</span></div>
                    </div>
                </div>
            </section>
            
            <section className="my-8">
                 <h2 className="text-base font-semibold text-foreground mb-3 text-center">Depreciation Breakdown (Estimated Value Lost)</h2>
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
            
            <ReportSection title="Condition: Fluids">
                <DetailItem label="Engine Oil" value={formatValue(engineOil)} />
                <DetailItem label="Coolant" value={formatValue(coolant)} />
                <DetailItem label="Brake Fluid" value={formatValue(brakeFluid)} />
                <DetailItem label="Washer Fluid" value={formatValue(washerFluid)} />
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


            <footer className="mt-10 pt-4 border-t text-xs text-center text-muted-foreground">
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
    </>
  );
};
