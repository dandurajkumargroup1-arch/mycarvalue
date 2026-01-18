
'use server';

import { CarValuationFormInput, CarValuationDataForAI } from './schemas';
import { calculateValuation } from './calculate-valuation';

/**
 * Server action to get car valuation.
 * It now uses a deterministic TypeScript function instead of an AI model.
 *
 * @param {CarValuationFormInput} data - The validated car data from the form.
 * @returns {Promise<object>} An object containing the valuation result.
 */
export async function getValuationAction(data: CarValuationFormInput) {
    const aiData: CarValuationDataForAI = {
        // Basic Info
        priceCheckReason: data.priceCheckReason,
        make: data.make,
        model: data.model,
        variant: data.variant,
        bodyType: data.bodyType,
        fuelType: data.fuelType,
        transmission: data.transmission,
        manufactureYear: data.manufactureYear,
        registrationYear: data.registrationYear,
        registrationState: data.registrationState,
        ownership: data.ownership,
        rcStatus: data.rcStatus,
        insurance: data.insurance,
        hypothecation: data.hypothecation,
        expectedPrice: data.expectedPrice,
        currentYear: new Date().getFullYear(),

        // Usage
        usage: {
            odometer: String(data.odometer),
            usageType: data.usageType,
            cityDriven: data.cityDriven,
            floodDamage: data.floodDamage,
            accident: data.accident,
            serviceCenter: data.serviceCenter,
        },
        
        // Nested sections
        engineMechanical: {
            engine: data.engine,
            gearbox: data.gearbox,
            clutch: data.clutch,
            battery: data.battery,
            radiator: data.radiator,
            exhaust: data.exhaust,
            suspension: data.suspension,
            steering: data.steering,
            brakes: data.brakes,
        },
        fluids: {
            engineOil: data.engineOil,
            coolant: data.coolant,
            brakeFluid: data.brakeFluid,
            washerFluid: data.washerFluid,
        },
        exterior: {
            frontBumper: data.frontBumper,
            rearBumper: data.rearBumper,
            bonnet: data.bonnet,
            roof: data.roof,
            doors: data.doors,
            fenders: data.fenders,
            paintQuality: data.paintQuality,
            accidentHistory: data.accidentHistory,
            scratches: data.scratches,
            dents: data.dents,
            rust_areas: data.rust_areas,
        },
        interior: {
            seats: data.seats,
            seatCovers: data.seatCovers,
            dashboard: data.dashboard,
            dashboardWarningLights: data.dashboardWarningLights,
            steeringWheel: data.steeringWheel,
            roofLining: data.roofLining,
            floorMats: data.floorMats,
            ac: data.ac,
            infotainment: data.infotainment,
        },
        electrical: {
            powerWindows: data.powerWindows,
            centralLocking: data.centralLocking,
            headlights: data.headlights,
            indicators: data.indicators,
            horn: data.horn,
            reverseCamera: data.reverseCamera,
            sensors: data.sensors,
            wipers: data.wipers,
        },
        tyres: {
            frontTyres: data.frontTyres,
            rearTyres: data.rearTyres,
            spareTyre: data.spareTyre,
            alloyWheels: data.alloyWheels,
            wheelAlignment: data.wheelAlignment,
            newlyChanged: data.newlyChanged,
        },
        safety: {
            airbags: data.airbags,
            abs: data.abs,
            seatBelts: data.seatBelts,
            childLock: data.childLock,
            immobilizer: data.immobilizer,
        },
        documents: {
            rcBook: data.rcBook,
            insuranceDoc: data.insuranceDoc,
            puc: data.puc,
            serviceRecords: data.serviceRecords,
            duplicateKey: data.duplicateKey,
            noc: data.noc,
        },
        additional: {
            musicSystem: data.musicSystem,
            reverseParkingSensor: data.reverseParkingSensor,
            dashcam: data.dashcam,
            fogLamps: data.fogLamps,
            gpsTracker: data.gpsTracker,
        },
    };

    try {
        const valuation = calculateValuation(aiData);
        return { valuation };
    } catch (error: any) {
        console.error("CRITICAL: getValuationAction failed", {
            errorMessage: error.message,
            errorStack: error.stack,
            errorDetails: error,
        });
        throw new Error("Failed to calculate car valuation.");
    }
}
