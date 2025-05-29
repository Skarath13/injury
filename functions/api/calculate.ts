export interface Env {
  // Add any environment variables here if needed
}

// Import types (these will be duplicated here to avoid import issues)
interface InjuryCalculatorData {
  demographics: {
    age: number;
    occupation: string;
    annualIncome: number;
  };
  accidentDetails: {
    dateOfAccident: string;
    faultPercentage: number;
    priorAccidents: number;
    impactSeverity: string;
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
    tpiInjections: number;
    facetInjections: number;
    mbbInjections: number;
    esiInjections: number;
    rfaInjections: number;
    prpInjections: number;
    surgeryRecommended: boolean;
    surgeryCompleted: boolean;
    surgeryType?: 'minor' | 'moderate' | 'major';
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

interface SettlementResult {
  lowEstimate: number;
  midEstimate: number;
  highEstimate: number;
  medicalCosts: number;
  factors: Array<{
    factor: string;
    impact: 'positive' | 'negative' | 'neutral';
    weight: number;
  }>;
  explanation: string;
}

// Move the medical cost estimation function here (server-side only)
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

// Server-side only calculation function
function calculateSettlement(data: InjuryCalculatorData): SettlementResult {
  let baseValue = 0;
  let multiplier = 1;
  const factors: SettlementResult['factors'] = [];
  
  // Start with medical costs (no multiplier)
  const medicalCosts = data.treatment.useEstimatedCosts 
    ? estimateMedicalCosts(data.treatment)
    : (data.treatment.totalMedicalCosts || 0);
    
  if (data.treatment.useEstimatedCosts) {
    factors.push({ factor: 'Using Estimated Medical Costs', impact: 'neutral', weight: 0 });
  }
  
  baseValue = medicalCosts;
  
  // Add base pain & suffering value
  let painAndSufferingBase = 500; // Minimum pain & suffering
  
  // Add pain & suffering based on treatment - Enhanced for realistic CA values
  const treatment = data.treatment;
  painAndSufferingBase += (treatment.emergencyRoomVisits * 1500); // Enhanced: ER visits indicate serious injury
  painAndSufferingBase += (treatment.urgentCareVisits * 800); // Enhanced urgent care multiplier
  painAndSufferingBase += ((treatment.chiropracticSessions + treatment.physicalTherapySessions) * 150); // Enhanced therapy multiplier
  painAndSufferingBase += (treatment.painManagementVisits * 1000); // Pain management indicates chronic pain
  painAndSufferingBase += (treatment.orthopedicConsults * 800);
  
  // Injection pain & suffering - Enhanced based on invasive nature
  painAndSufferingBase += (treatment.tpiInjections * 2000); // Enhanced for invasive procedure
  painAndSufferingBase += (treatment.prpInjections * 2500); // PRP indicates significant injury
  painAndSufferingBase += (treatment.facetInjections * 6000); // Major spinal procedure
  painAndSufferingBase += (treatment.mbbInjections * 6000); // Major diagnostic/therapeutic procedure
  painAndSufferingBase += (treatment.esiInjections * 8000); // Major spinal injection
  painAndSufferingBase += (treatment.rfaInjections * 10000); // Major ablation procedure
  
  // Imaging pain & suffering - Enhanced (indicates injury severity/complexity)
  painAndSufferingBase += (treatment.xrays * 300); // Basic diagnostic
  painAndSufferingBase += (treatment.mris * 1000); // Advanced imaging for serious injury
  painAndSufferingBase += (treatment.ctScans * 1200); // Emergency/trauma imaging
  
  // Treatment duration bonus
  if (treatment.ongoingTreatment) {
    painAndSufferingBase *= 1.25;
    factors.push({ factor: 'Ongoing Treatment', impact: 'positive', weight: 0.3 });
  }
  
  baseValue += painAndSufferingBase;
  
  // Add surgery GDs - 80% of surgery cost
  if (data.treatment.surgeryCompleted && data.treatment.surgeryType) {
    const surgeryCost = data.treatment.surgeryType === 'minor' ? 40000 :
                       data.treatment.surgeryType === 'moderate' ? 75000 :
                       data.treatment.surgeryType === 'major' ? 125000 : 0;
    const surgeryGDs = surgeryCost * 0.8;
    baseValue += surgeryGDs;
    factors.push({ factor: 'Surgery Completed', impact: 'positive', weight: 0.8 });
  } else if (data.treatment.surgeryRecommended && data.treatment.surgeryType) {
    const surgeryCost = data.treatment.surgeryType === 'minor' ? 40000 :
                       data.treatment.surgeryType === 'moderate' ? 75000 :
                       data.treatment.surgeryType === 'major' ? 125000 : 0;
    const surgeryGDs = surgeryCost * 0.5; // Less for recommended vs completed
    baseValue += surgeryGDs;
    factors.push({ factor: 'Surgery Recommended', impact: 'positive', weight: 0.6 });
  }
  
  // Add value for specific injuries - Enhanced based on CA research
  if (data.injuries.tbi) {
    // TBI settlements typically range from $100K-$5M in CA
    const tbiValue = data.injuries.tbiSeverity === 'severe' ? 200000 :  // Conservative end of $200K-$5M range
                     data.injuries.tbiSeverity === 'moderate' ? 80000 :   // Conservative end of $150K-$500K range
                     35000;  // Conservative end of $100K-$150K range for mild TBI
    baseValue += tbiValue;
    factors.push({ factor: 'Traumatic Brain Injury', impact: 'positive', weight: 0.9 });
  }
  
  // Impact severity modifier - direct multiplier on GDs
  if (data.accidentDetails.impactSeverity === 'low') {
    multiplier *= 0.6; // 40% reduction
    factors.push({ factor: 'Low Impact Collision', impact: 'negative', weight: -0.4 });
  } else if (data.accidentDetails.impactSeverity === 'moderate') {
    multiplier *= 1.0; // No change
    factors.push({ factor: 'Moderate Impact', impact: 'neutral', weight: 0 });
  } else if (data.accidentDetails.impactSeverity === 'severe') {
    multiplier *= 1.3; // 30% increase
    factors.push({ factor: 'Severe Impact', impact: 'positive', weight: 0.3 });
  } else if (data.accidentDetails.impactSeverity === 'catastrophic') {
    multiplier *= 1.6; // 60% increase
    factors.push({ factor: 'Catastrophic Impact', impact: 'positive', weight: 0.6 });
  }
  
  // Spinal issues - Enhanced based on CA herniated disc settlements ($10K-$500K)
  const spinalIssues = data.injuries.spinalIssues;
  let spinalValue = 0;
  let spinalIssueCount = 0;
  
  if (spinalIssues.herniation) {
    spinalValue += 25000; // Conservative end of $10K-$500K range for herniated discs
    spinalIssueCount++;
  }
  if (spinalIssues.nerveRootCompression) {
    spinalValue += 20000; // Nerve compression adds significant value
    spinalIssueCount++;
  }
  if (spinalIssues.radiculopathy) {
    spinalValue += 15000; // Radiating pain/numbness
    spinalIssueCount++;
  }
  if (spinalIssues.myelopathy) {
    spinalValue += 30000; // Spinal cord compression - more serious
    spinalIssueCount++;
  }
  if (spinalIssues.preExistingDegeneration) {
    spinalValue += 5000; // Less value due to pre-existing nature
    spinalIssueCount++;
  }
  
  if (spinalIssueCount > 0) {
    baseValue += spinalValue;
    factors.push({ factor: `${spinalIssueCount} Spinal Issues`, impact: 'positive', weight: 0.8 });
  }
  
  // Fractures - Enhanced based on CA research ($30K-$150K range)
  if (data.injuries.fractures.length > 0) {
    let fractureValue = 0;
    data.injuries.fractures.forEach(fracture => {
      switch (fracture) {
        case 'skull':
        case 'facial':
          fractureValue += 50000; // Facial/skull fractures often involve scarring
          break;
        case 'spine':
          fractureValue += 80000; // Spinal fractures are very serious
          break;
        case 'ribs':
          fractureValue += 12000; // Research shows $5K-$15K for ribs
          break;
        case 'arm':
        case 'wrist':
        case 'hand':
          fractureValue += 35000; // Arm fractures: $20K-$50K range
          break;
        case 'leg':
        case 'ankle':
        case 'foot':
          fractureValue += 45000; // Leg fractures higher value, affect mobility
          break;
        case 'pelvis':
          fractureValue += 60000; // Pelvic fractures are serious, long recovery
          break;
        case 'clavicle':
          fractureValue += 25000; // Collar bone fractures
          break;
        default:
          fractureValue += 30000; // Default fracture value (conservative end)
      }
    });
    baseValue += fractureValue;
    factors.push({ factor: `${data.injuries.fractures.length} Fractures`, impact: 'positive', weight: 0.8 });
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
      factors.push({ factor: `${data.treatment.esiInjections} Epidural Steroid Injections`, impact: 'positive', weight: 0.4 });
    }
    
    if (data.treatment.rfaInjections > 0) {
      injectionValue += data.treatment.rfaInjections * 15000;
      factors.push({ factor: `${data.treatment.rfaInjections} RF Ablation Procedures`, impact: 'positive', weight: 0.7 });
    }
    
    if (data.treatment.prpInjections > 0) {
      injectionValue += data.treatment.prpInjections * 2000;
      factors.push({ factor: `${data.treatment.prpInjections} PRP Injections`, impact: 'positive', weight: 0.1 });
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
  
  // Scarring and Disfigurement - Based on CA research ($30K-$150K range)
  const hasScarring = data.injuries.primaryInjury.toLowerCase().includes('scar') || 
                     data.injuries.secondaryInjuries.some(injury => injury.toLowerCase().includes('scar')) ||
                     data.injuries.primaryInjury.toLowerCase().includes('disfigurement') ||
                     data.injuries.secondaryInjuries.some(injury => injury.toLowerCase().includes('disfigurement'));
  
  if (hasScarring) {
    // Conservative end of $30K-$150K range, higher for facial injuries
    const facialScarring = data.injuries.fractures.includes('facial') || 
                          data.injuries.primaryInjury.toLowerCase().includes('facial') ||
                          data.injuries.secondaryInjuries.some(injury => injury.toLowerCase().includes('facial'));
    
    const scarringValue = facialScarring ? 45000 : 25000; // Higher for facial scarring
    baseValue += scarringValue;
    factors.push({ factor: facialScarring ? 'Facial Scarring/Disfigurement' : 'Scarring/Disfigurement', impact: 'positive', weight: 0.7 });
  }
  
  // Pain and suffering modifiers - Enhanced permanent impairment
  if (data.impact.permanentImpairment) {
    // Research shows $3,000 per percentage point typical in CA
    const impairmentValue = (data.impact.impairmentRating || 10) * 2500; // Conservative end of $3K per point
    baseValue += impairmentValue;
    factors.push({ factor: 'Permanent Impairment', impact: 'positive', weight: 0.9 });
  }
  
  // Enhanced emotional/psychological damages based on CA research
  if (data.impact.emotionalDistress) {
    baseValue += 3500; // Conservative end of $1K-$5K range for PTSD/emotional distress
    factors.push({ factor: 'Emotional Distress/PTSD', impact: 'positive', weight: 0.2 });
  }
  
  if (data.impact.lossOfConsortium) {
    baseValue += 2000; // Conservative end of $500-$3K range for loss of consortium
    factors.push({ factor: 'Loss of Consortium', impact: 'positive', weight: 0.2 });
  }
  
  if (data.impact.dylanVLeggClaim) {
    baseValue += 3000; // Conservative end of $1K-$5K range for Dillon v. Legg claims
    factors.push({ factor: 'Dillon v. Legg Claim', impact: 'positive', weight: 0.2 });
  }
  
  // Age modifier - eggshell plaintiff principle
  if (data.demographics.age < 30) {
    multiplier *= 0.8; // 20% decrease - younger people bounce back easier
    factors.push({ factor: 'Young Age (Faster Recovery)', impact: 'negative', weight: -0.2 });
  } else if (data.demographics.age > 65) {
    multiplier *= 1.2; // 20% increase - older people more fragile
    factors.push({ factor: 'Advanced Age (Fragile/Eggshell)', impact: 'positive', weight: 0.2 });
  }
  
  // Pre-existing conditions - Eggshell doctrine enhancement
  if (data.injuries.preExistingConditions.length > 0) {
    const enhancement = Math.min(0.15, data.injuries.preExistingConditions.length * 0.05);
    multiplier *= (1 + enhancement);
    factors.push({ 
      factor: `${data.injuries.preExistingConditions.length} Pre-existing Conditions (Eggshell Plaintiff)`, 
      impact: 'positive', 
      weight: enhancement 
    });
  }
  
  // Prior accidents reduction
  if (data.accidentDetails.priorAccidents > 0) {
    const reduction = Math.min(0.3, data.accidentDetails.priorAccidents * 0.1);
    multiplier *= (1 - reduction);
    factors.push({ 
      factor: `${data.accidentDetails.priorAccidents} Prior Accidents`, 
      impact: 'negative', 
      weight: -reduction 
    });
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
  
  // Determine case category - Updated for enhanced calculations
  if (highEstimate < 35000) {
    explanation = 'This appears to be a minor soft tissue injury case. ';
  } else if (highEstimate < 150000) {
    explanation = 'This appears to be a moderate injury case with significant treatment or complications. ';
  } else if (highEstimate < 500000) {
    explanation = 'This appears to be a serious injury case with major treatment requirements. ';
  } else {
    explanation = 'This appears to be a catastrophic injury case with life-altering consequences. ';
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
    explanation += 'Pre-existing conditions invoke the eggshell plaintiff doctrine - the defendant takes you as they find you. ';
  }
  
  if (data.accidentDetails.faultPercentage > 25) {
    explanation += 'Your shared fault substantially reduces the settlement value. ';
  }
  
  if (data.insurance.policyLimitsKnown && data.insurance.policyLimits && 
      data.insurance.policyLimits < highEstimate) {
    explanation += 'The settlement is capped by available insurance limits. ';
  }
  
  // Add reality check - Updated for enhanced calculations
  explanation += '\n\nThese estimates are based on actual California settlement data and realistic pain & suffering calculations. Insurance companies evaluate medical costs, injury severity, treatment complexity, permanence, and comparative fault. Initial offers are typically 30-50% below these estimates. For cases with fractures, TBI, spinal injuries, or scarring, settlement values often exceed simple medical cost multipliers due to permanent impact and pain & suffering. ';
  
  if (data.insurance.hasAttorney) {
    const feePercentage = data.insurance.attorneyContingency || 33;
    const netLow = lowEstimate * (1 - feePercentage / 100);
    const netHigh = highEstimate * (1 - feePercentage / 100);
    explanation += `With attorney fees, your net recovery would be approximately $${Math.round(netLow).toLocaleString()} to $${Math.round(netHigh).toLocaleString()}.`;
  }
  
  return explanation;
}

// Cloudflare Workers handler
export async function onRequestPost(context: {
  request: Request;
  env: Env;
  ctx: ExecutionContext;
}): Promise<Response> {
  try {
    const { request } = context;
    
    // Add CORS headers
    const headers = {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };
    
    // Handle OPTIONS request for CORS
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers });
    }
    
    // Get client IP for rate limiting (if needed)
    const clientIP = request.headers.get('CF-Connecting-IP') || 
                    request.headers.get('X-Forwarded-For') || 
                    'unknown';
    
    // Parse and validate request body
    const data: InjuryCalculatorData = await request.json();
    
    // Basic validation
    if (!data || typeof data !== 'object') {
      return new Response(
        JSON.stringify({ error: 'Invalid request data' }),
        { status: 400, headers }
      );
    }
    
    // Perform calculation on server
    const result = calculateSettlement(data);
    
    // Return results
    return new Response(
      JSON.stringify(result),
      { status: 200, headers }
    );
    
  } catch (error) {
    console.error('Settlement calculation error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        }
      }
    );
  }
}

// Also export for OPTIONS requests
export async function onRequestOptions(): Promise<Response> {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}