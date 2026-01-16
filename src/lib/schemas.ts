
import { z } from 'zod';

const requiredString = z.string().min(1, "This field is required");
const optionalString = z.string().optional();

// 0. Contact Details
const ContactDetailsSchema = z.object({
  displayName: requiredString,
  whatsappNumber: requiredString.regex(/^\d{10}$/, "Please enter a valid 10-digit WhatsApp number."),
  vehicleNumber: optionalString,
})

// Section 1: Basic Vehicle Information
const BasicInfoSchema = z.object({
  priceCheckReason: z.enum(["immediate_sale", "price_check", "market_value"]),
  make: requiredString,
  model: requiredString,
  variant: requiredString,
  bodyType: z.enum(["hatchback", "sedan", "suv", "muv_mpv", "coupe_convertible", "pickup_van"]),
  fuelType: z.enum(["petrol", "diesel", "cng", "electric"]),
  transmission: z.enum(["manual", "automatic"]),
  manufactureYear: z.coerce.number(),
  registrationYear: z.coerce.number(),
  registrationState: requiredString,
  ownership: z.enum(["1st", "2nd", "3rd", "4th+"]),
  rcStatus: z.enum(["active", "inactive", "pending"]),
  insurance: z.enum(["comprehensive", "third_party", "none"]),
  hypothecation: z.enum(["yes", "no"]),
  expectedPrice: z.coerce.number().min(1, "Expected price is required"),
});

// Section 2: Engine & Mechanical
const EngineMechanicalSchema = z.object({
  engine: z.enum(["smooth", "noise", "vibration", "other"]),
  gearbox: z.enum(["smooth", "hard_shifting", "noise", "other"]),
  clutch: z.enum(["normal", "hard", "slipping", "other"]),
  battery: z.enum(["new", "average", "weak", "not_working"]),
  radiator: z.enum(["good", "leakage", "overheating", "damaged"]),
  exhaust: z.enum(["normal_smoke", "noise", "smoke", "other"]),
  suspension: z.enum(["good", "noise", "bumpy", "worn_out"]),
  steering: z.enum(["normal", "play", "hard", "alignment"]),
  brakes: z.enum(["good", "needs_service", "weak"]),
});

// New Section: Fluids Check
const FluidsSchema = z.object({
  engineOil: z.enum(["ok", "low", "dirty", "replace"]),
  coolant: z.enum(["ok", "low", "leak"]),
  brakeFluid: z.enum(["ok", "low", "contaminated"]),
  washerFluid: z.enum(["ok", "low"]),
});

// Section 3: Exterior (Body & Paint)
const ExteriorSchema = z.object({
  frontBumper: z.enum(["original", "scratch", "repaint", "damaged"]),
  rearBumper: z.enum(["original", "scratch", "repaint", "damaged"]),
  bonnet: z.enum(["original", "scratch", "repaint", "dent"]),
  roof: z.enum(["original", "repaint", "dent"]),
  doors: z.enum(["original", "repaint_one", "repaint_multi", "dent"]),
  fenders: z.enum(["original", "scratch", "repaint", "dent"]),
  paintQuality: z.enum(["excellent", "average", "dull", "poor"]),
  accidentHistory: z.enum(["none", "minor", "major"]),
  scratches: z.enum(["0", "3-5", "6-10", ">10"]),
  dents: z.enum(["0", "1-2", "3-5", ">5"]),
  rust_areas: z.enum(["none", "minor", "visible", "structural"]),
});

// Section 4: Interior (Cabin Condition)
const InteriorSchema = z.object({
  seats: z.enum(["excellent", "good", "average", "poor"]),
  seatCovers: z.enum(["new", "average", "torn", "not_present"]),
  dashboard: z.enum(["excellent", "good", "average", "poor"]),
  dashboardWarningLights: z.enum(["normal", "minor", "critical"]),
  steeringWheel: z.enum(["excellent", "normal_wear", "worn_out", "damaged"]),
  roofLining: z.enum(["clean", "dirty", "sagging", "damaged"]),
  floorMats: z.enum(["present", "not_present"]),
  ac: z.enum(["working", "weak", "noise", "not_working"]),
  infotainment: z.enum(["working", "minor_issues", "touch_issue", "not_working"]),
});

// Section 5: Electrical & Electronics
const ElectricalSchema = z.object({
  powerWindows: z.enum(["all_working", "one_not_working", "multiple_not_working", "none_working"]),
  centralLocking: z.enum(["working", "not_working"]),
  headlights: z.enum(["working", "not_working"]),
  indicators: z.enum(["working", "not_working"]),
  horn: z.enum(["working", "not_working"]),
  reverseCamera: z.enum(["working", "minor_issue", "not_working", "na"]),
  sensors: z.enum(["working", "some_not_working", "not_working", "na"]),
  wipers: z.enum(["working", "not_working"]),
});

// Section 6: Tyres & Wheels
const TyresSchema = z.object({
  frontTyres: z.enum(["75-100", "50-74", "25-49", "0-24"]),
  rearTyres: z.enum(["75-100", "50-74", "25-49", "0-24"]),
  spareTyre: z.enum(["usable", "worn", "not_present"]),
  alloyWheels: z.enum(["yes", "no"]),
  wheelAlignment: z.enum(["ok", "needed"]),
});

// Section 7: Safety Features
const SafetySchema = z.object({
  airbags: z.enum(["dual_multiple", "driver_only", "none", "deployed_faulty"]),
  abs: z.enum(["yes", "no"]),
  seatBelts: z.enum(["all_working", "one_not_working", "multiple_not_working"]),
  childLock: z.enum(["yes", "no"]),
  immobilizer: z.enum(["yes", "no"]),
});

// Section 8: Documents
const DocumentsSchema = z.object({
  rcBook: z.enum(["original", "duplicate", "lost"]),
  insuranceDoc: z.enum(["comprehensive", "third_party", "expired_30", "expired_90", "none"]),
  puc: z.enum(["valid", "expired", "not_available"]),
  serviceRecords: z.enum(["full", "partial", "none"]),
  duplicateKey: z.enum(["available", "not_available"]),
  noc: z.enum(["not_required", "available", "pending", "not_available"]),
});

// Section 9: Usage & History
const UsageSchema = z.object({
  odometer: requiredString.regex(/^[0-9]+$/, "Odometer must be a valid number."),
  usageType: z.enum(["personal", "commercial"]),
  cityDriven: z.enum(["yes", "no"]),
  floodDamage: z.enum(["yes", "no"]),
  accident: z.enum(["yes", "no"]),
  serviceCenter: z.enum(["authorized", "local", "mixed"]),
});

// Section 10: Additional / Value-Add
const AdditionalSchema = z.object({
  musicSystem: z.enum(["yes", "no"]),
  reverseParkingSensor: z.enum(["yes", "no"]),
  dashcam: z.enum(["yes", "no"]),
  fogLamps: z.enum(["yes", "no"]),
  gpsTracker: z.enum(["yes", "no"]),
});

// This is the schema for the data that is passed to the AI models.
// It is separate from the form schema to distinguish between form input and AI input.
export const CarValuationDataForAISchema = BasicInfoSchema.extend({
    currentYear: z.number(),
    engineMechanical: EngineMechanicalSchema,
    fluids: FluidsSchema,
    exterior: ExteriorSchema,
    interior: InteriorSchema,
    electrical: ElectricalSchema,
    tyres: TyresSchema,
    safety: SafetySchema,
    documents: DocumentsSchema,
    usage: UsageSchema,
    additional: AdditionalSchema
});

export type CarValuationDataForAI = z.infer<typeof CarValuationDataForAISchema>;


// Zod schema for car valuation input, matching the form structure
export const CarValuationSchema = ContactDetailsSchema
    .merge(BasicInfoSchema)
    .merge(EngineMechanicalSchema)
    .merge(FluidsSchema)
    .merge(ExteriorSchema)
    .merge(InteriorSchema)
    .merge(ElectricalSchema)
    .merge(TyresSchema)
    .merge(SafetySchema)
    .merge(DocumentsSchema)
    .merge(UsageSchema)
    .merge(AdditionalSchema);

export type CarValuationFormInput = z.infer<typeof CarValuationSchema>;
