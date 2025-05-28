import { InjuryCalculatorData, SettlementResult } from '@/types/calculator';

function estimateMedicalCosts(treatment: InjuryCalculatorData['treatment']): number {
  let estimated = 0;
  
  // Convert string values to numbers to prevent concatenation issues
  const emergencyRoomVisits = Number(treatment.emergencyRoomVisits) || 0;
  const urgentCareVisits = Number(treatment.urgentCareVisits) || 0;
  const chiropracticSessions = Number(treatment.chiropracticSessions) || 0;
  const physicalTherapySessions = Number(treatment.physicalTherapySessions) || 0;
  const xrays = Number(treatment.xrays) || 0;
  const mris = Number(treatment.mris) || 0;
  const ctScans = Number(treatment.ctScans) || 0;
  const painManagementVisits = Number(treatment.painManagementVisits) || 0;
  const orthopedicConsults = Number(treatment.orthopedicConsults) || 0;
  const tpiInjections = Number(treatment.tpiInjections) || 0;
  const facetInjections = Number(treatment.facetInjections) || 0;
  const mbbInjections = Number(treatment.mbbInjections) || 0;
  const esiInjections = Number(treatment.esiInjections) || 0;
  const rfaInjections = Number(treatment.rfaInjections) || 0;
  const prpInjections = Number(treatment.prpInjections) || 0;
  
  // ER visits: $3,000-$8,000 (use lower end for estimates)
  estimated += emergencyRoomVisits * 3000;
  
  // Urgent care: $500-$1,000 (use lower end)
  estimated += urgentCareVisits * 500;
  
  // Chiro/PT sessions: $100-$200 (use lower end)
  estimated += (chiropracticSessions + physicalTherapySessions) * 100;
  
  // Imaging
  estimated += xrays * 500;
  estimated += mris * 2000;
  estimated += ctScans * 3500; // Updated to reflect $1,000-$6,000 range
  
  // Specialist visits
  estimated += painManagementVisits * 750;
  estimated += orthopedicConsults * 750;
  
  // Injections - now individual types
  estimated += tpiInjections * 2500;
  estimated += facetInjections * 5000;
  estimated += mbbInjections * 5000; // Same as facet
  estimated += esiInjections * 7500;
  estimated += rfaInjections * 15000;
  estimated += prpInjections * 2000; // Mid-range of $1,000-$3,000
  
  // Surgery costs if selected
  if (treatment.surgeryRecommended && treatment.surgeryType) {
    const surgeryCost = treatment.surgeryType === 'minor' ? 40000 :
                       treatment.surgeryType === 'moderate' ? 75000 :
                       treatment.surgeryType === 'major' ? 125000 : 0;
    estimated += surgeryCost;
  }
  
  return estimated;
}

export function calculateSettlement(data: InjuryCalculatorData): SettlementResult {
  let baseValue = 0;
  let multiplier = 1;
  const factors: SettlementResult['factors'] = [];
  
  // Base value from medical costs (usually 1.5x to 5x medical bills)
  const medicalCosts = data.treatment.useEstimatedCosts 
    ? estimateMedicalCosts(data.treatment)
    : (data.treatment.totalMedicalCosts || 0);
    
  if (data.treatment.useEstimatedCosts) {
    factors.push({ factor: 'Using Estimated Medical Costs', impact: 'neutral', weight: 0 });
  }
  let medicalMultiplier = 1.5; // Reduced default multiplier
  
  // Adjust medical multiplier based on injury severity
  if (data.injuries.primaryInjury.includes('Fracture') || 
      data.injuries.primaryInjury.includes('Herniation') ||
      data.injuries.primaryInjury.includes('Tear')) {
    medicalMultiplier = 2;
  }
  
  if (data.treatment.surgeryCompleted) {
    medicalMultiplier = 2.5;
    factors.push({ factor: 'Surgery Completed', impact: 'positive', weight: 0.8 });
  } else if (data.treatment.surgeryRecommended) {
    medicalMultiplier = 2.2;
    factors.push({ factor: 'Surgery Recommended', impact: 'positive', weight: 0.6 });
  }
  
  baseValue = medicalCosts * medicalMultiplier;
  
  // Add base pain & suffering value
  let painAndSufferingBase = 500; // Minimum pain & suffering
  
  // Add pain & suffering based on treatment
  const treatment = data.treatment;
  painAndSufferingBase += (treatment.emergencyRoomVisits * 500); // Up to 500 GDs for ER
  painAndSufferingBase += (treatment.urgentCareVisits * 200); // Up to 200 for urgent care
  painAndSufferingBase += ((treatment.chiropracticSessions + treatment.physicalTherapySessions) * 50);
  painAndSufferingBase += (treatment.painManagementVisits * 200);
  painAndSufferingBase += (treatment.orthopedicConsults * 200);
  
  // Injection pain & suffering - minor vs major types
  painAndSufferingBase += (treatment.tpiInjections * 1000); // Minor injection type
  painAndSufferingBase += (treatment.prpInjections * 1000); // Minor injection type
  painAndSufferingBase += (treatment.facetInjections * 4000); // Major injection type
  painAndSufferingBase += (treatment.mbbInjections * 4000); // Major injection type  
  painAndSufferingBase += (treatment.esiInjections * 5000); // Major injection type
  painAndSufferingBase += (treatment.rfaInjections * 5000); // Major injection type
  
  // Imaging pain & suffering (indicates injury severity)
  painAndSufferingBase += (treatment.xrays * 100);
  painAndSufferingBase += (treatment.mris * 300);
  painAndSufferingBase += (treatment.ctScans * 400);
  
  // Treatment duration bonus
  if (treatment.ongoingTreatment) {
    painAndSufferingBase *= 1.25;
    factors.push({ factor: 'Ongoing Treatment', impact: 'positive', weight: 0.3 });
  }
  
  baseValue += painAndSufferingBase;
  
  // Add value for specific injuries
  if (data.injuries.tbi) {
    const tbiValue = data.injuries.tbiSeverity === 'severe' ? 50000 :
                     data.injuries.tbiSeverity === 'moderate' ? 25000 : 12000;
    baseValue += tbiValue;
    factors.push({ factor: 'Traumatic Brain Injury', impact: 'positive', weight: 0.9 });
  }
  
  // Impact severity modifier - more significant impact
  if (data.accidentDetails.impactSeverity === 'low') {
    multiplier *= 0.6;
    factors.push({ factor: 'Low Impact Collision', impact: 'negative', weight: -0.5 });
  } else if (data.accidentDetails.impactSeverity === 'moderate') {
    multiplier *= 0.9;
    factors.push({ factor: 'Moderate Impact', impact: 'neutral', weight: 0 });
  } else if (data.accidentDetails.impactSeverity === 'severe') {
    multiplier *= 1.15;
    factors.push({ factor: 'Severe Impact', impact: 'positive', weight: 0.3 });
  } else if (data.accidentDetails.impactSeverity === 'catastrophic') {
    multiplier *= 1.35;
    factors.push({ factor: 'Catastrophic Impact', impact: 'positive', weight: 0.5 });
  }
  
  // Spinal issues
  const spinalIssueCount = Object.values(data.injuries.spinalIssues).filter(v => v).length;
  if (spinalIssueCount > 0) {
    baseValue += spinalIssueCount * 8000;
    factors.push({ factor: `${spinalIssueCount} Spinal Issues`, impact: 'positive', weight: 0.7 });
  }
  
  // Fractures
  if (data.injuries.fractures.length > 0) {
    baseValue += data.injuries.fractures.length * 10000;
    factors.push({ factor: `${data.injuries.fractures.length} Fractures`, impact: 'positive', weight: 0.6 });
  }
  
  // Injections value (updated realistic values)
  const totalInjections = data.treatment.tpiInjections + data.treatment.facetInjections + 
                         data.treatment.mbbInjections + data.treatment.esiInjections + 
                         data.treatment.rfaInjections + data.treatment.prpInjections;
  
  if (totalInjections > 0) {
    let injectionValue = 0;
    
    if (data.treatment.tpiInjections > 0) {
      injectionValue += data.treatment.tpiInjections * 2500;
      factors.push({ factor: `${data.treatment.tpiInjections} Trigger Point Injections`, impact: 'positive', weight: 0.4 });
    }
    
    if (data.treatment.facetInjections > 0) {
      injectionValue += data.treatment.facetInjections * 5000;
      factors.push({ factor: `${data.treatment.facetInjections} Facet Joint Injections`, impact: 'positive', weight: 0.5 });
    }
    
    if (data.treatment.mbbInjections > 0) {
      injectionValue += data.treatment.mbbInjections * 5000;
      factors.push({ factor: `${data.treatment.mbbInjections} Medial Branch Blocks`, impact: 'positive', weight: 0.5 });
    }
    
    if (data.treatment.esiInjections > 0) {
      injectionValue += data.treatment.esiInjections * 7500;
      factors.push({ factor: `${data.treatment.esiInjections} Epidural Steroid Injections`, impact: 'positive', weight: 0.6 });
    }
    
    if (data.treatment.rfaInjections > 0) {
      injectionValue += data.treatment.rfaInjections * 15000;
      factors.push({ factor: `${data.treatment.rfaInjections} RF Ablation Procedures`, impact: 'positive', weight: 0.7 });
    }
    
    if (data.treatment.prpInjections > 0) {
      injectionValue += data.treatment.prpInjections * 2000;
      factors.push({ factor: `${data.treatment.prpInjections} PRP Injections`, impact: 'positive', weight: 0.4 });
    }
    
    baseValue += injectionValue;
  }
  
  // Lost wages
  const annualIncome = Number(data.demographics.annualIncome) || 0;
  const dailyWage = annualIncome / 250; // Assuming 250 work days
  const lostWages = data.impact.missedWorkDays * dailyWage;
  baseValue += lostWages;
  if (lostWages > 5000) {
    factors.push({ factor: 'Significant Lost Wages', impact: 'positive', weight: 0.4 });
  }
  
  // Pain and suffering modifiers
  if (data.impact.permanentImpairment) {
    const impairmentValue = (data.impact.impairmentRating || 10) * 1500;
    baseValue += impairmentValue;
    factors.push({ factor: 'Permanent Impairment', impact: 'positive', weight: 0.9 });
  }
  
  if (data.impact.emotionalDistress) {
    baseValue += 2000;
    factors.push({ factor: 'Emotional Distress/PTSD', impact: 'positive', weight: 0.1 });
  }
  
  if (data.impact.lossOfConsortium) {
    baseValue += 1000;
    factors.push({ factor: 'Loss of Consortium', impact: 'positive', weight: 0.1 });
  }
  
  if (data.impact.dylanVLeggClaim) {
    baseValue += 1500;
    factors.push({ factor: 'Dillon v. Legg Claim', impact: 'positive', weight: 0.1 });
  }
  
  // Age modifier
  if (data.demographics.age < 30) {
    multiplier *= 1.1;
    factors.push({ factor: 'Young Age (Longer Recovery Impact)', impact: 'positive', weight: 0.2 });
  } else if (data.demographics.age > 65) {
    multiplier *= 0.85;
    factors.push({ factor: 'Advanced Age', impact: 'negative', weight: -0.2 });
  }
  
  // Pre-existing conditions reduction
  if (data.injuries.preExistingConditions.length > 0) {
    const reduction = Math.min(0.5, data.injuries.preExistingConditions.length * 0.15);
    multiplier *= (1 - reduction);
    factors.push({ 
      factor: `${data.injuries.preExistingConditions.length} Pre-existing Conditions`, 
      impact: 'negative', 
      weight: -0.5 
    });
  }
  
  // Prior accidents reduction
  if (data.accidentDetails.priorAccidents > 0) {
    const reduction = Math.min(0.3, data.accidentDetails.priorAccidents * 0.1);
    multiplier *= (1 - reduction);
    factors.push({ 
      factor: `${data.accidentDetails.priorAccidents} Prior Accidents`, 
      impact: 'negative', 
      weight: -0.3 
    });
  }
  
  // Impact severity modifier
  if (data.accidentDetails.impactSeverity) {
    if (data.accidentDetails.impactSeverity === 'low') {
      multiplier *= 0.8;
      factors.push({ factor: 'Minor Impact Collision', impact: 'negative', weight: -0.3 });
    } else if (data.accidentDetails.impactSeverity === 'severe') {
      multiplier *= 1.15;
      factors.push({ factor: 'Severe Impact Collision', impact: 'positive', weight: 0.3 });
    }
  }
  
  // Comparative negligence
  const faultReduction = data.accidentDetails.faultPercentage / 100;
  const negligenceMultiplier = 1 - faultReduction;
  
  if (faultReduction > 0) {
    factors.push({ 
      factor: `${data.accidentDetails.faultPercentage}% Comparative Negligence`, 
      impact: 'negative', 
      weight: -0.8 
    });
  }
  
  // Policy limits cap
  let cappedByPolicy = false;
  if (data.insurance.policyLimitsKnown && data.insurance.policyLimits) {
    cappedByPolicy = true;
  }
  
  // Calculate final estimates
  const grossValue = baseValue * multiplier * negligenceMultiplier;
  
  // Apply policy limits if known
  const policyLimit = data.insurance.policyLimits || Infinity;
  const cappedGrossValue = Math.min(grossValue, policyLimit);
  
  if (cappedByPolicy && grossValue > policyLimit) {
    factors.push({ 
      factor: 'Limited by Insurance Policy', 
      impact: 'negative', 
      weight: -0.9 
    });
  }
  
  // Calculate ranges (accounting for negotiation variance)
  const lowEstimate = cappedGrossValue * 0.7;
  const midEstimate = cappedGrossValue * 0.85;
  const highEstimate = cappedGrossValue;
  
  // Attorney fees reduction for net calculation note
  if (data.insurance.hasAttorney) {
    const feePercentage = data.insurance.attorneyContingency || 33;
    factors.push({ 
      factor: `Attorney Fees (${feePercentage}% of gross)`, 
      impact: 'neutral', 
      weight: 0 
    });
  }
  
  // Generate explanation
  let explanation = generateExplanation(data, lowEstimate, highEstimate);
  
  return {
    lowEstimate: Math.round(lowEstimate),
    midEstimate: Math.round(midEstimate),
    highEstimate: Math.round(highEstimate),
    medicalCosts: Math.round(medicalCosts),
    factors,
    explanation
  };
}

function generateExplanation(
  data: InjuryCalculatorData, 
  lowEstimate: number, 
  highEstimate: number
): string {
  let explanation = '';
  
  // Determine case category
  if (highEstimate < 25000) {
    explanation = 'This appears to be a minor soft tissue injury case. ';
  } else if (highEstimate < 100000) {
    explanation = 'This appears to be a moderate injury case. ';
  } else {
    explanation = 'This appears to be a serious injury case. ';
  }
  
  // Impact severity consideration
  if (data.accidentDetails.impactSeverity === 'low') {
    explanation += 'The low impact nature will make causation challenging to prove. ';
  }
  
  // Add specific insights
  if (data.treatment.surgeryCompleted || data.treatment.surgeryRecommended) {
    explanation += 'The need for surgery significantly increases case value. ';
  }
  
  if (data.injuries.preExistingConditions.length > 0) {
    explanation += 'Pre-existing conditions will likely be used to argue for a reduction. ';
  }
  
  if (data.accidentDetails.faultPercentage > 25) {
    explanation += 'Your shared fault substantially reduces the settlement value. ';
  }
  
  if (data.insurance.policyLimitsKnown && data.insurance.policyLimits && 
      data.insurance.policyLimits < highEstimate) {
    explanation += 'The settlement is capped by available insurance limits. ';
  }
  
  // Add reality check
  explanation += '\n\nRemember: These are insurance settlement values, not jury verdict values. Insurance companies do not use simple multipliers - they consider medical specials, injury severity, treatment duration, and comparative fault. Initial offers are typically 30-50% below these estimates. ';
  
  if (data.insurance.hasAttorney) {
    const feePercentage = data.insurance.attorneyContingency || 33;
    const netLow = lowEstimate * (1 - feePercentage / 100);
    const netHigh = highEstimate * (1 - feePercentage / 100);
    explanation += `With attorney fees, your net recovery would be approximately $${Math.round(netLow).toLocaleString()} to $${Math.round(netHigh).toLocaleString()}.`;
  }
  
  return explanation;
}