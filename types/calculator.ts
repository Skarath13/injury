export type BodyMapView = 'front' | 'back';
export type BodyMapGender = 'male' | 'female';
export type BodyMapSide = 'left' | 'right' | 'both' | 'common';
export type BodyMapSeverity = 1 | 2 | 3 | 4;

export type BodyMapSlug =
  | 'head'
  | 'hair'
  | 'neck'
  | 'trapezius'
  | 'deltoids'
  | 'chest'
  | 'biceps'
  | 'triceps'
  | 'forearm'
  | 'hands'
  | 'abs'
  | 'obliques'
  | 'upper-back'
  | 'lower-back'
  | 'adductors'
  | 'quadriceps'
  | 'hamstring'
  | 'gluteal'
  | 'knees'
  | 'tibialis'
  | 'calves'
  | 'ankles'
  | 'feet';

export interface BodyMapSelection {
  slug: BodyMapSlug;
  side: BodyMapSide;
  view: BodyMapView;
  severity: BodyMapSeverity;
  label: string;
}

export type GuidedInjuryCertainty =
  | 'none'
  | 'symptoms_only'
  | 'suspected_or_mentioned'
  | 'provider_confirmed'
  | 'unknown';

export type GuidedHeadStatus =
  | 'unanswered'
  | 'none'
  | 'symptoms_only'
  | 'doctor_mentioned_concussion'
  | 'confirmed_tbi'
  | 'not_sure';

export type GuidedSpineStatus =
  | 'unanswered'
  | 'none'
  | 'strain_sprain'
  | 'disc_or_mri_finding'
  | 'nerve_symptoms'
  | 'spinal_cord_warning'
  | 'not_sure';

export type GuidedFractureStatus = 'unanswered' | 'no' | 'maybe' | 'confirmed' | 'not_sure';

export type GuidedFractureArea =
  | 'face_skull'
  | 'ribs_chest'
  | 'arm_wrist_hand'
  | 'leg_ankle_foot'
  | 'spine_pelvis';

export type GuidedVisibleInternalStatus =
  | 'unanswered'
  | 'none'
  | 'visible_scarring'
  | 'internal_symptoms'
  | 'both'
  | 'not_sure';

export type GuidedPreExistingStatus =
  | 'unanswered'
  | 'no'
  | 'not_sure'
  | 'yes_minor'
  | 'yes_active_treatment_or_prior_claim';

export interface GuidedInjurySignals {
  head: {
    status: GuidedHeadStatus;
    certainty: GuidedInjuryCertainty;
    severity?: 'mild' | 'moderate' | 'severe';
  };
  spine: {
    status: GuidedSpineStatus;
    certainty: GuidedInjuryCertainty;
  };
  fracture: {
    status: GuidedFractureStatus;
    certainty: GuidedInjuryCertainty;
    areas: GuidedFractureArea[];
  };
  visibleOrInternal: {
    status: GuidedVisibleInternalStatus;
  };
  preExisting: {
    sameAreaStatus: GuidedPreExistingStatus;
  };
}

export interface InjuryCalculatorData {
  demographics: {
    age: number;
    occupation: string;
    annualIncome: number | string;
  };
  
  accidentDetails: {
    dateOfAccident: string;
    county: string;
    faultPercentage: number;
    priorAccidents: number;
    impactSeverity: 'low' | 'moderate' | 'severe' | 'catastrophic' | '';
  };
  
  injuries: {
    bodyMap: BodyMapSelection[];
    guidedSignals?: GuidedInjurySignals;
    primaryInjury: string;
    secondaryInjuries: string[];
    preExistingConditions: string[];
    fractures: string[];
    tbi: boolean;
    tbiSeverity?: 'mild' | 'moderate' | 'severe';
    spinalIssues: {
      herniation: boolean;
      nerveRootCompression: boolean;
      radiculopathy: boolean;
      myelopathy: boolean;
      preExistingDegeneration: boolean;
    };
  };
  
  treatment: {
    ambulanceTransports: number;
    emergencyRoomVisits: number;
    urgentCareVisits: number;
    hospitalAdmissionDays: number;
    chiropracticSessions: number;
    physicalTherapySessions: number;
    occupationalTherapySessions: number;
    xrays: number;
    mris: number;
    ctScans: number;
    emgNerveStudies: number;
    followUpDoctorVisits: number;
    painManagementVisits: number;
    orthopedicConsults: number;
    neurologyConsults: number;
    mentalHealthSessions: number;
    tpiInjections: number;
    facetInjections: number;
    mbbInjections: number;
    esiInjections: number;
    rfaInjections: number;
    prpInjections: number;
    surgeryRecommended: boolean;
    surgeryCompleted: boolean;
    surgeryType?: '' | 'minor' | 'moderate' | 'major';
    totalMedicalCosts: number;
    useEstimatedCosts: boolean;
    ongoingTreatment: boolean;
  };
  
  impact: {
    missedWorkDays: number;
    lossOfConsortium: boolean;
    emotionalDistress: boolean;
    dylanVLeggClaim: boolean;
    permanentImpairment: boolean;
    impairmentRating?: number;
  };
  
  insurance: {
    policyLimitsKnown: boolean;
    policyLimits?: number;
    hasAttorney: boolean;
    attorneyContingency?: number;
  };
}

export type SeverityBand = 'low' | 'moderate' | 'elevated' | 'high' | 'severe';

export interface SettlementResult {
  lowEstimate: number;
  midEstimate: number;
  highEstimate: number;
  medicalCosts: number;
  medicalCostRange: {
    low: number;
    mid: number;
    high: number;
  };
  specials: number;
  severityBand: SeverityBand;
  /** @deprecated Use severityBand. Kept for older preview/session payloads. */
  caseTier: string;
  logicVersion: string;
  logicHash: string;
  factors: {
    factor: string;
    impact: 'positive' | 'negative' | 'neutral';
    weight: number;
  }[];
  explanation: string;
}

export interface ResponsibleAttorney {
  id: string;
  name: string;
  barNumber: string;
  officeLocation: string;
  disclosure: string;
  consentCopyVersion: string;
}

export interface EstimatePreviewResponse {
  sessionId: string;
  expiresAt: string;
  county: string;
  severityBand: SeverityBand;
  /** @deprecated Use severityBand. Kept for older clients. */
  caseTier: string;
  blurredRangeLabel: string;
  summary: string;
  logicVersion: string;
  logicHash: string;
  routingVersion: string;
  responsibleAttorney: ResponsibleAttorney | null;
  requiresAttorneyConsent: boolean;
}

export interface UnlockStartResponse {
  maskedPhone: string;
  duplicateWithin30Days: boolean;
  provider: string;
  devCode?: string;
}

export interface UnlockVerifyResponse {
  results: SettlementResult;
  responsibleAttorney: ResponsibleAttorney | null;
  leadDeliveryStatus: string;
}

export interface EstimateOnlyUnlockResponse {
  results: SettlementResult;
  responsibleAttorney: null;
  leadDeliveryStatus: string;
}

export const COMMON_INJURIES = [
  'Whiplash / Neck Strain',
  'Back Strain / Sprain',
  'Shoulder Injury',
  'Knee Injury',
  'Concussion / Mild TBI',
  'Soft Tissue Damage',
  'Disc Herniation',
  'Rotator Cuff Tear',
  'Meniscus Tear',
  'Ligament Tear (ACL/MCL)',
  'Fracture',
  'Internal Injuries',
  'Scarring / Disfigurement',
  'PTSD / Psychological Injury'
];

export const COMMON_FRACTURES = [
  'Rib Fracture',
  'Clavicle (Collarbone) Fracture',
  'Wrist Fracture',
  'Ankle Fracture',
  'Vertebral Compression Fracture',
  'Facial Bone Fracture',
  'Pelvic Fracture',
  'Femur Fracture',
  'Tibia/Fibula Fracture',
  'Humerus Fracture'
];

export const PRE_EXISTING_CONDITIONS = [
  'Prior Back Problems',
  'Prior Neck Problems',
  'Arthritis',
  'Fibromyalgia',
  'Previous Surgery (Same Area)',
  'Diabetes',
  'Obesity',
  'Osteoporosis',
  'Previous Car Accident Injuries',
  'Chronic Pain Syndrome'
];
