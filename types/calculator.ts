export interface InjuryCalculatorData {
  demographics: {
    age: number;
    occupation: string;
    annualIncome: number;
  };
  
  accidentDetails: {
    dateOfAccident: string;
    faultPercentage: number;
    priorAccidents: number;
    impactSeverity: 'low' | 'moderate' | 'severe' | 'catastrophic' | '';
  };
  
  injuries: {
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
    emergencyRoomVisits: number;
    urgentCareVisits: number;
    chiropracticSessions: number;
    physicalTherapySessions: number;
    xrays: number;
    mris: number;
    ctScans: number;
    painManagementVisits: number;
    orthopedicConsults: number;
    injections: number;
    injectionType?: 'tpi' | 'facet' | 'esi' | 'rfa' | 'mixed';
    surgeryRecommended: boolean;
    surgeryCompleted: boolean;
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

export interface SettlementResult {
  lowEstimate: number;
  midEstimate: number;
  highEstimate: number;
  medicalCosts: number;
  factors: {
    factor: string;
    impact: 'positive' | 'negative' | 'neutral';
    weight: number;
  }[];
  explanation: string;
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