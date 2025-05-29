// Settlement calculation logic - standalone for Workers
function estimateMedicalCosts(treatment) {
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
  estimated += ctScans * 3500;
  
  // Specialist visits
  estimated += painManagementVisits * 750;
  estimated += orthopedicConsults * 750;
  
  // Injections
  estimated += tpiInjections * 2500;
  estimated += facetInjections * 5000;
  estimated += mbbInjections * 5000;
  estimated += esiInjections * 7500;
  estimated += rfaInjections * 15000;
  estimated += prpInjections * 2000;
  
  // Surgery costs if selected
  if (treatment.surgeryRecommended && treatment.surgeryType) {
    const surgeryCost = treatment.surgeryType === 'minor' ? 40000 :
                       treatment.surgeryType === 'moderate' ? 75000 :
                       treatment.surgeryType === 'major' ? 125000 : 0;
    estimated += surgeryCost;
  }
  
  return estimated;
}

function calculateSettlement(data) {
  let baseValue = 0;
  let multiplier = 1;
  const factors = [];
  
  // Start with medical costs
  const medicalCosts = data.treatment.useEstimatedCosts 
    ? estimateMedicalCosts(data.treatment)
    : (data.treatment.totalMedicalCosts || 0);
    
  baseValue = medicalCosts;
  
  // Add base pain & suffering value
  let painAndSufferingBase = 500;
  
  // Add pain & suffering based on treatment
  const treatment = data.treatment;
  painAndSufferingBase += (treatment.emergencyRoomVisits * 1500);
  painAndSufferingBase += (treatment.urgentCareVisits * 800);
  painAndSufferingBase += ((treatment.chiropracticSessions + treatment.physicalTherapySessions) * 150);
  painAndSufferingBase += (treatment.painManagementVisits * 1000);
  painAndSufferingBase += (treatment.orthopedicConsults * 800);
  
  // Injection pain & suffering
  painAndSufferingBase += (treatment.tpiInjections * 2000);
  painAndSufferingBase += (treatment.prpInjections * 2500);
  painAndSufferingBase += (treatment.facetInjections * 6000);
  painAndSufferingBase += (treatment.mbbInjections * 6000);
  painAndSufferingBase += (treatment.esiInjections * 8000);
  painAndSufferingBase += (treatment.rfaInjections * 10000);
  
  // Imaging pain & suffering
  painAndSufferingBase += (treatment.xrays * 300);
  painAndSufferingBase += (treatment.mris * 1000);
  painAndSufferingBase += (treatment.ctScans * 1200);
  
  // Treatment duration bonus
  if (treatment.ongoingTreatment) {
    painAndSufferingBase *= 1.25;
    factors.push({ factor: 'Ongoing Treatment', impact: 'positive', weight: 0.3 });
  }
  
  baseValue += painAndSufferingBase;
  
  // Add surgery GDs
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
    const surgeryGDs = surgeryCost * 0.5;
    baseValue += surgeryGDs;
    factors.push({ factor: 'Surgery Recommended', impact: 'positive', weight: 0.6 });
  }
  
  // TBI values
  if (data.injuries.tbi) {
    const tbiValue = data.injuries.tbiSeverity === 'severe' ? 200000 :
                     data.injuries.tbiSeverity === 'moderate' ? 80000 :
                     35000;
    baseValue += tbiValue;
    factors.push({ factor: 'Traumatic Brain Injury', impact: 'positive', weight: 0.9 });
  }
  
  // Impact severity modifier
  if (data.accidentDetails.impactSeverity === 'low') {
    multiplier *= 0.6;
    factors.push({ factor: 'Low Impact Collision', impact: 'negative', weight: -0.4 });
  } else if (data.accidentDetails.impactSeverity === 'moderate') {
    multiplier *= 1.0;
    factors.push({ factor: 'Moderate Impact', impact: 'neutral', weight: 0 });
  } else if (data.accidentDetails.impactSeverity === 'severe') {
    multiplier *= 1.3;
    factors.push({ factor: 'Severe Impact', impact: 'positive', weight: 0.3 });
  } else if (data.accidentDetails.impactSeverity === 'catastrophic') {
    multiplier *= 1.6;
    factors.push({ factor: 'Catastrophic Impact', impact: 'positive', weight: 0.6 });
  }
  
  // Continue with remaining calculations...
  const grossValue = baseValue * multiplier;
  const lowEstimate = grossValue * 0.7;
  const midEstimate = grossValue * 0.85;
  const highEstimate = grossValue;
  
  return {
    lowEstimate: Math.round(lowEstimate),
    midEstimate: Math.round(midEstimate),
    highEstimate: Math.round(highEstimate),
    medicalCosts: Math.round(medicalCosts),
    factors,
    explanation: 'Settlement estimate based on California industry data.'
  };
}

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
};

// Main worker handler
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: corsHeaders
      });
    }
    
    // API endpoint
    if (url.pathname === '/api/calculate' && request.method === 'POST') {
      try {
        const data = await request.json();
        
        if (!data || typeof data !== 'object') {
          return new Response(
            JSON.stringify({ error: 'Invalid request data' }),
            { 
              status: 400, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          );
        }
        
        const result = calculateSettlement(data);
        
        return new Response(
          JSON.stringify(result),
          { 
            status: 200, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
        
      } catch (error) {
        console.error('Calculation error:', error);
        return new Response(
          JSON.stringify({ error: 'Internal server error' }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }
    }
    
    // Static file serving
    try {
      let path = url.pathname;
      
      // Map root to index
      if (path === '/' || path === '') {
        path = '/index.html';
      }
      
      // Try to serve from assets
      const assetResponse = await env.ASSETS.fetch(new URL(path, request.url));
      
      if (assetResponse.ok) {
        const response = new Response(assetResponse.body, assetResponse);
        Object.entries(corsHeaders).forEach(([key, value]) => {
          response.headers.set(key, value);
        });
        return response;
      }
      
      // Try .html extension
      if (!path.endsWith('.html') && !path.includes('.')) {
        const htmlPath = path.endsWith('/') ? `${path}index.html` : `${path}.html`;
        const htmlResponse = await env.ASSETS.fetch(new URL(htmlPath, request.url));
        
        if (htmlResponse.ok) {
          const response = new Response(htmlResponse.body, htmlResponse);
          Object.entries(corsHeaders).forEach(([key, value]) => {
            response.headers.set(key, value);
          });
          return response;
        }
      }
      
      return new Response('Not Found', { 
        status: 404,
        headers: corsHeaders 
      });
      
    } catch (error) {
      console.error('Asset serving error:', error);
      return new Response('Internal Server Error', { 
        status: 500,
        headers: corsHeaders 
      });
    }
  }
};