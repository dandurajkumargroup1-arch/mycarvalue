
import type { CarValuationDataForAI } from './schemas';

// Define the output structure
interface ValuationOutput {
  bestPrice: number;
  p0_expectedPrice: number;
  p1_afterOdometer: number;
  p9_afterAllSections: number;
  p10_afterYear: number;
  finalPrice: number;
  sellerProtectionApplied: boolean;
  goodCarBonusApplied: boolean;
  od_odometerDepreciationPercentage: number;
  yd_yearDepreciationPercentage: number;
  u_usageDepreciationPercentage: number;
  e_engineDepreciationPercentage: number;
  ex_exteriorDepreciationPercentage: number;
  in_interiorDepreciationPercentage: number;
  el_electricalDepreciationPercentage: number;
  t_tyresDepreciationPercentage: number;
  s_safetyDepreciationPercentage: number;
  d_documentsDepreciationPercentage: number;
  // New Price Confidence fields
  marketValueMin: number;
  marketValueMax: number;
  idealListingPrice: number;
  expectedFinalDeal: number;
  buyerPsychologyTip: string;
}

// Mappings for depreciation percentages based on form values
// These would be more robust in a real app, perhaps from a config file.
const depreciationMaps = {
    engine: { smooth: 0, noise: 2, vibration: 4, other: 8 },
    gearbox: { smooth: 0, hard_shifting: 2, noise: 4, other: 6 },
    clutch: { normal: 0, hard: 2, slipping: 4, other: 6 },
    battery: { new: 0, average: 1, weak: 2, not_working: 3 },
    radiator: { good: 0, leakage: 1, overheating: 3, damaged: 5 },
    exhaust: { normal_smoke: 0, noise: 1, smoke: 2, other: 4 },
    suspension: { good: 0, noise: 2, bumpy: 4, worn_out: 6 },
    steering: { normal: 0, play: 1, hard: 3, alignment: 2 },
    brakes: { good: 0, needs_service: 2, weak: 4 },
    frontBumper: { original: 0, scratch: 1, repaint: 2, damaged: 3 },
    rearBumper: { original: 0, scratch: 1, repaint: 2, damaged: 3 },
    bonnet: { original: 0, scratch: 1, repaint: 2, dent: 3 },
    roof: { original: 0, repaint: 1, dent: 2 },
    doors: { original: 0, repaint_one: 2, repaint_multi: 4, dent: 3 },
    fenders: { original: 0, scratch: 1, repaint: 2, dent: 3 },
    paintQuality: { excellent: 0, average: 2, dull: 4, poor: 6 },
    accidentHistory: { none: 0, minor: 5, major: 15 },
    scratches: { '0': 0, '3-5': 1, '6-10': 2, '>10': 3 },
    dents: { '0': 0, '1-2': 1, '3-5': 2, '>5': 4 },
    rust_areas: { none: 0, minor: 2, visible: 5, structural: 10 },
    seats: { excellent: 0, good: 1, average: 2, poor: 4 },
    seatCovers: { new: 0, average: 0.5, torn: 1, not_present: 0 },
    dashboard: { excellent: 0, good: 1, average: 2, poor: 3 },
    steeringWheel: { excellent: 0, normal_wear: 0.5, worn_out: 1, damaged: 2 },
    roofLining: { clean: 0, dirty: 0.5, sagging: 2, damaged: 3 },
    floorMats: { present: 0, not_present: 0.5 },
    ac: { working: 0, weak: 2, noise: 1, not_working: 4 },
    infotainment: { working: 0, minor_issues: 0.5, touch_issue: 2, not_working: 3 },
    powerWindows: { all_working: 0, one_not_working: 1, multiple_not_working: 2, none_working: 3 },
    centralLocking: { working: 0, not_working: 1 },
    headlights: { working: 0, not_working: 0.5 },
    indicators: { working: 0, not_working: 0.5 },
    horn: { working: 0, not_working: 0.5 },
    reverseCamera: { working: 0, minor_issue: 0.5, not_working: 1, na: 0 },
    sensors: { working: 0, some_not_working: 0.5, not_working: 1, na: 0 },
    wipers: { working: 0, not_working: 0.5 },
    frontTyres: { '75-100': 0, '50-74': 1, '25-49': 2, '0-24': 3 },
    rearTyres: { '75-100': 0, '50-74': 1, '25-49': 2, '0-24': 3 },
    spareTyre: { usable: 0, worn: 1, not_present: 2 },
    alloyWheels: { yes: 0, no: 0 },
    wheelAlignment: { ok: 0, needed: 1 },
    airbags: { dual_multiple: 0, driver_only: 1, none: 2, deployed_faulty: 5 },
    abs: { yes: 0, no: 1 },
    seatBelts: { all_working: 0, one_not_working: 0.5, multiple_not_working: 1 },
    childLock: { yes: 0, no: 0 },
    immobilizer: { yes: 0, no: 0 },
    rcBook: { original: 0, duplicate: 5, lost: 10 },
    insuranceDoc: { comprehensive: 0, third_party: 1, expired_30: 2, expired_90: 4, none: 6 },
    puc: { valid: 0, expired: 0.5, not_available: 1 },
    serviceRecords: { full: 0, partial: 2, none: 4 },
    duplicateKey: { available: 0, not_available: 2 },
    noc: { not_required: 0, available: 0, pending: 1, not_available: 3 },
};

function getDepreciation(section: object, map: object): number {
    return Object.keys(section).reduce((total, key) => {
        const value = (section as any)[key];
        const depreciationMap = (map as any)[key];
        if (depreciationMap && value in depreciationMap) {
            return total + (depreciationMap[value] || 0);
        }
        return total;
    }, 0);
}


export function calculateValuation(carData: CarValuationDataForAI): ValuationOutput {

    // STEP 1: PRE-CALCULATION: DETERMINE SECTION DEPRECIATION PERCENTAGES
    const U = carData.usage.floodDamage === 'yes' || carData.usage.accident === 'yes' ? Math.min(15, 15) : 0;
    const E = Math.min(25, getDepreciation(carData.engineMechanical, depreciationMaps));
    
    // For exterior, combine the root level fields with the nested ones
    const exteriorCombined = { ...carData.exterior, scratches: carData.scratches, dents: carData.dents, rust_areas: carData.rust_areas };
    const EX = Math.min(15, getDepreciation(exteriorCombined, depreciationMaps));
    
    const IN = Math.min(10, getDepreciation(carData.interior, depreciationMaps));
    const EL = Math.min(8, getDepreciation(carData.electrical, depreciationMaps));
    const T = Math.min(6, getDepreciation(carData.tyres, depreciationMaps));
    const S = Math.min(5, getDepreciation(carData.safety, depreciationMaps));
    const D = Math.min(20, getDepreciation(carData.documents, depreciationMaps));

    // STEP 2: MAIN PRICE FORMULA
    const P0 = carData.expectedPrice;

    // Odometer Depreciation
    const km = Number(carData.usage.odometer);
    let OD = 0;
    if (km > 100000) OD = 9;
    else if (km > 80000) OD = 6;
    else if (km > 60000) OD = 5;
    else if (km > 40000) OD = 3;
    else if (km > 20000) OD = 1.5;
    const P1 = P0 * (1 - OD / 100);

    // Sectional Depreciation (Sequential)
    const P2 = P1 * (1 - U / 100);
    const P3 = P2 * (1 - E / 100);
    const P4 = P3 * (1 - EX / 100);
    const P5 = P4 * (1 - IN / 100);
    const P6 = P5 * (1 - EL / 100);
    const P7 = P6 * (1 - T / 100);
    const P8 = P7 * (1 - S / 100);
    const P9 = P8 * (1 - D / 100);

    // Year (Age) Depreciation
    const age = carData.currentYear - carData.manufactureYear;
    let YD = 0;
    if (age <= 1) YD = 2.5;
    else if (age <= 2) YD = 5;
    else if (age <= 3) YD = 7.5;
    else if (age <= 4) YD = 11.5;
    else if (age <= 5) YD = 16;
    else if (age <= 6) YD = 23;
    else if (age <= 7) YD = 30;
    else if (age <= 8) YD = 35;
    else if (age <= 9) YD = 40;
    else if (age <= 10) YD = 43;
    else if (age <= 15) YD = 46;
    else YD = 55; // for age > 15
    const P10 = P9 * (1 - YD / 100);

    // Seller Protection
    const MIN_PRICE = P0 * 0.40;
    let finalPrice = P10;
    let sellerProtectionApplied = false;
    if (P10 < MIN_PRICE) {
        finalPrice = MIN_PRICE;
        sellerProtectionApplied = true;
    }

    // Good Car Bonus
    let goodCarBonusApplied = false;
    if (E <= 10 && D <= 5) {
        finalPrice *= 1.05;
        goodCarBonusApplied = true;
    }

    // Final Price
    const bestPrice = Math.round(finalPrice / 1000) * 1000;

    // STEP 3: CALCULATE PRICE CONFIDENCE METRICS
    const expectedFinalDeal = bestPrice;
    const marketValueMin = Math.round((expectedFinalDeal * 0.96) / 1000) * 1000;
    const marketValueMax = Math.round((expectedFinalDeal * 1.02) / 1000) * 1000;
    const idealListingPrice = Math.round((expectedFinalDeal * 1.05) / 1000) * 1000;
    const buyerPsychologyTip = "Always list your car slightly higher than your target price. This creates a negotiation buffer and makes the buyer feel like they are getting a good deal.";


    return {
        bestPrice,
        p0_expectedPrice: P0,
        p1_afterOdometer: P1,
        p9_afterAllSections: P9,
        p10_afterYear: P10,
        finalPrice: finalPrice,
        sellerProtectionApplied,
        goodCarBonusApplied,
        od_odometerDepreciationPercentage: OD,
        yd_yearDepreciationPercentage: YD,
        u_usageDepreciationPercentage: U,
        e_engineDepreciationPercentage: E,
        ex_exteriorDepreciationPercentage: EX,
        in_interiorDepreciationPercentage: IN,
        el_electricalDepreciationPercentage: EL,
        t_tyresDepreciationPercentage: T,
        s_safetyDepreciationPercentage: S,
        d_documentsDepreciationPercentage: D,
        // Price Confidence
        marketValueMin,
        marketValueMax,
        idealListingPrice,
        expectedFinalDeal,
        buyerPsychologyTip,
    };
}
