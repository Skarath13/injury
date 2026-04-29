import settlementLogicConfig from '@/config/settlement-logic.v1.json';
import { normalizeCounty } from '@/lib/californiaCounties';
import { normalizeGuidedInjuryData } from '@/lib/guidedInjurySignals';
import { BodyMapSelection, InjuryCalculatorData, SettlementResult } from '@/types/calculator';

type SettlementLogicConfig = typeof settlementLogicConfig;
type CountyVenueTier = keyof SettlementLogicConfig['countyVenue']['tiers'];
type SeverityBand = keyof SettlementLogicConfig['severityBands'];
type FactorImpact = SettlementResult['factors'][number]['impact'];
type MedicalCostRange = SettlementResult['medicalCostRange'];
type TreatmentProgressionKey =
  | 'none'
  | 'minimal'
  | 'softTissueBaseline'
  | 'softTissueWithAdders'
  | 'advancedDocumented'
  | 'interventionalOrSurgical';

const TREATMENT_COUNT_KEYS = [
  'ambulanceTransports',
  'emergencyRoomVisits',
  'urgentCareVisits',
  'hospitalAdmissionDays',
  'chiropracticSessions',
  'physicalTherapySessions',
  'occupationalTherapySessions',
  'xrays',
  'mris',
  'ctScans',
  'emgNerveStudies',
  'followUpDoctorVisits',
  'painManagementVisits',
  'orthopedicConsults',
  'neurologyConsults',
  'mentalHealthSessions',
  'tpiInjections',
  'facetInjections',
  'mbbInjections',
  'esiInjections',
  'rfaInjections',
  'prpInjections'
] as const;

function toNumber(value: unknown): number {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
}

function addFactor(
  factors: SettlementResult['factors'],
  factor: string,
  impact: FactorImpact,
  weight: number
) {
  factors.push({ factor, impact, weight });
}

function countyVenueTier(
  data: InjuryCalculatorData,
  config: SettlementLogicConfig
): CountyVenueTier {
  const county = normalizeCounty(data.accidentDetails.county || '');
  return (config.countyVenue.counties as Record<string, CountyVenueTier>)[county] || 'neutral';
}

function countyVenueMultiplier(
  data: InjuryCalculatorData,
  factors: SettlementResult['factors'],
  config: SettlementLogicConfig
): number {
  const county = normalizeCounty(data.accidentDetails.county || '');
  if (!county) return 1;

  const tierKey = countyVenueTier(data, config);
  const tier = config.countyVenue.tiers[tierKey];
  const multiplier = tier.multiplier || 1;
  const impact: FactorImpact = multiplier > 1 ? 'positive' : multiplier < 1 ? 'negative' : 'neutral';

  addFactor(
    factors,
    `${county} County venue tendency (${tier.label.replace(' county venue tendency', '')})`,
    impact,
    multiplier - 1
  );

  return multiplier;
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(',')}]`;
  }

  if (value && typeof value === 'object') {
    return `{${Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => `${JSON.stringify(key)}:${stableStringify(entry)}`)
      .join(',')}}`;
  }

  return JSON.stringify(value);
}

function fingerprint(value: unknown): string {
  const input = stableStringify(value);
  let hash = 2166136261;

  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return `fnv1a-${(hash >>> 0).toString(16).padStart(8, '0')}`;
}

export const SETTLEMENT_LOGIC = settlementLogicConfig;
export const SETTLEMENT_LOGIC_VERSION = settlementLogicConfig.version;
export const SETTLEMENT_LOGIC_HASH = fingerprint(settlementLogicConfig);

function zeroMedicalRange(): MedicalCostRange {
  return { low: 0, mid: 0, high: 0 };
}

function roundMedicalRange(range: MedicalCostRange): MedicalCostRange {
  return {
    low: Math.round(range.low),
    mid: Math.round(range.mid),
    high: Math.round(range.high)
  };
}

function mapMedicalRange(range: MedicalCostRange, mapper: (value: number) => number): MedicalCostRange {
  return {
    low: mapper(range.low),
    mid: mapper(range.mid),
    high: mapper(range.high)
  };
}

function addMedicalRange(left: MedicalCostRange, right: MedicalCostRange): MedicalCostRange {
  return {
    low: left.low + right.low,
    mid: left.mid + right.mid,
    high: left.high + right.high
  };
}

function treatmentRangeForSurgery(
  treatment: InjuryCalculatorData['treatment'],
  ranges: SettlementLogicConfig['treatmentCostRanges']
): MedicalCostRange {
  if (!treatment.surgeryRecommended && !treatment.surgeryCompleted) {
    return zeroMedicalRange();
  }

  if (treatment.surgeryType === 'minor') return ranges.surgeryMinor;
  if (treatment.surgeryType === 'moderate') return ranges.surgeryModerate;
  if (treatment.surgeryType === 'major') return ranges.surgeryMajor;

  return zeroMedicalRange();
}

export function estimateMedicalCostRange(
  treatment: InjuryCalculatorData['treatment'],
  config: SettlementLogicConfig = SETTLEMENT_LOGIC
): MedicalCostRange {
  const ranges = config.treatmentCostRanges;
  let total = zeroMedicalRange();

  for (const key of TREATMENT_COUNT_KEYS) {
    const count = Math.max(0, toNumber(treatment[key]));
    if (count === 0) continue;

    const unitRange = ranges[key];
    total = addMedicalRange(total, {
      low: count * unitRange.low,
      mid: count * unitRange.mid,
      high: count * unitRange.high
    });
  }

  total = addMedicalRange(total, treatmentRangeForSurgery(treatment, ranges));

  return roundMedicalRange(total);
}

export function estimateMedicalCosts(
  treatment: InjuryCalculatorData['treatment'],
  config: SettlementLogicConfig = SETTLEMENT_LOGIC
): number {
  return estimateMedicalCostRange(treatment, config).mid;
}

function totalInjections(treatment: InjuryCalculatorData['treatment']): number {
  return toNumber(treatment.tpiInjections) +
    toNumber(treatment.facetInjections) +
    toNumber(treatment.mbbInjections) +
    toNumber(treatment.esiInjections) +
    toNumber(treatment.rfaInjections) +
    toNumber(treatment.prpInjections);
}

function bodyMapSelections(data: InjuryCalculatorData): BodyMapSelection[] {
  return data.injuries.bodyMap || [];
}

function highestBodyMapSeverity(data: InjuryCalculatorData): number {
  return bodyMapSelections(data).reduce((highest, selection) => Math.max(highest, selection.severity), 0);
}

function bodyMapRegionCountAdder(selectionCount: number, config: SettlementLogicConfig): number {
  const adders = config.bodyMapSeverity.regionCountAdders;

  if (selectionCount >= 5) return adders['5'];
  if (selectionCount >= 3) return adders['3'];
  if (selectionCount >= 2) return adders['2'];
  return 0;
}

function calculateBodyMapGeneralDamagesMultiplier(
  data: InjuryCalculatorData,
  factors: SettlementResult['factors'],
  config: SettlementLogicConfig
): number {
  const selections = bodyMapSelections(data);

  if (selections.length === 0) return 0;

  const bodyConfig = config.bodyMapSeverity;
  const highValueRegions = new Set(bodyConfig.highValueRegions);
  const highestSeverity = highestBodyMapSeverity(data);
  const baseMultiplier = bodyConfig.generalDamagesMultipliers[
    String(highestSeverity) as keyof typeof bodyConfig.generalDamagesMultipliers
  ] || 0;
  const highestSeverityHighValue = selections.some((selection) => {
    const slug = selection.slug === 'hair' ? 'head' : selection.slug;
    return selection.severity === highestSeverity && highValueRegions.has(slug);
  });
  const highValueAdder = highestSeverityHighValue ? bodyConfig.highValueRegionAdder : 0;
  const regionCountAdder = bodyMapRegionCountAdder(selections.length, config);
  const multiplier = Math.min(
    bodyConfig.maxGeneralDamagesMultiplier,
    baseMultiplier + highValueAdder + regionCountAdder
  );

  addFactor(
    factors,
    `${selections.length} selected pain area${selections.length === 1 ? '' : 's'} (${highestSeverity}/4 max severity)`,
    'positive',
    multiplier
  );

  return multiplier;
}

function therapyVisitCount(treatment: InjuryCalculatorData['treatment']): number {
  return toNumber(treatment.chiropracticSessions) +
    toNumber(treatment.physicalTherapySessions) +
    toNumber(treatment.occupationalTherapySessions);
}

function treatmentModalityCount(treatment: InjuryCalculatorData['treatment']): number {
  const modalities = [
    toNumber(treatment.urgentCareVisits) > 0 || toNumber(treatment.followUpDoctorVisits) > 0,
    toNumber(treatment.emergencyRoomVisits) > 0 || toNumber(treatment.ambulanceTransports) > 0 || toNumber(treatment.hospitalAdmissionDays) > 0,
    therapyVisitCount(treatment) > 0,
    toNumber(treatment.xrays) > 0,
    toNumber(treatment.mris) > 0 || toNumber(treatment.ctScans) > 0 || toNumber(treatment.emgNerveStudies) > 0,
    toNumber(treatment.orthopedicConsults) > 0 || toNumber(treatment.neurologyConsults) > 0,
    toNumber(treatment.painManagementVisits) > 0,
    totalInjections(treatment) > 0,
    toNumber(treatment.mentalHealthSessions) > 0,
    treatment.surgeryRecommended || treatment.surgeryCompleted
  ];

  return modalities.filter(Boolean).length;
}

function treatmentProgressionKey(treatment: InjuryCalculatorData['treatment']): TreatmentProgressionKey {
  const injections = totalInjections(treatment);
  const therapyCount = therapyVisitCount(treatment);
  const advancedImaging = toNumber(treatment.mris) + toNumber(treatment.ctScans) + toNumber(treatment.emgNerveStudies);
  const specialistVisits = toNumber(treatment.orthopedicConsults) + toNumber(treatment.neurologyConsults);
  const minimalDocumentation = toNumber(treatment.urgentCareVisits) +
    toNumber(treatment.followUpDoctorVisits) +
    toNumber(treatment.xrays) +
    toNumber(treatment.mentalHealthSessions);
  const emergencyCare = toNumber(treatment.emergencyRoomVisits) + toNumber(treatment.ambulanceTransports);
  const hasSurgery = treatment.surgeryRecommended || treatment.surgeryCompleted;
  const hasPainManagementWithImaging = toNumber(treatment.painManagementVisits) > 0 && advancedImaging > 0;

  if (hasSurgery || injections >= 3) return 'interventionalOrSurgical';
  if (
    injections > 0 ||
    therapyCount >= 16 ||
    toNumber(treatment.hospitalAdmissionDays) > 0 ||
    hasPainManagementWithImaging
  ) {
    return 'advancedDocumented';
  }
  if (
    therapyCount >= 8 ||
    advancedImaging > 0 ||
    specialistVisits > 0 ||
    toNumber(treatment.painManagementVisits) > 0 ||
    treatment.ongoingTreatment
  ) {
    return 'softTissueWithAdders';
  }
  if (emergencyCare > 0 || therapyCount > 0) return 'softTissueBaseline';
  if (minimalDocumentation > 0) return 'minimal';

  return 'none';
}

function calculateTreatmentGeneralDamagesMultiplier(
  data: InjuryCalculatorData,
  factors: SettlementResult['factors'],
  config: SettlementLogicConfig
): number {
  const progression = config.treatmentProgression;
  const key = treatmentProgressionKey(data.treatment);
  const tier = progression[key];
  let multiplier = tier.multiplier;

  if (key !== 'none' && treatmentModalityCount(data.treatment) >= 2) {
    multiplier += progression.multiModalityAdder;
  }
  if (key === 'softTissueWithAdders') {
    multiplier = Math.min(multiplier, progression.softTissueWithAddersMax);
  }

  addFactor(
    factors,
    tier.label,
    multiplier > 0 ? 'positive' : 'neutral',
    multiplier
  );

  return multiplier;
}

function severityBandForMultiplier(
  generalDamagesMultiplier: number,
  config: SettlementLogicConfig
): SeverityBand {
  const bands = config.severityBands;

  if (generalDamagesMultiplier < (bands.low.maxGeneralDamagesMultiplier ?? Number.POSITIVE_INFINITY)) return 'low';
  if (generalDamagesMultiplier < (bands.moderate.maxGeneralDamagesMultiplier ?? Number.POSITIVE_INFINITY)) return 'moderate';
  if (generalDamagesMultiplier < (bands.elevated.maxGeneralDamagesMultiplier ?? Number.POSITIVE_INFINITY)) return 'elevated';
  if (generalDamagesMultiplier < (bands.high.maxGeneralDamagesMultiplier ?? Number.POSITIVE_INFINITY)) return 'high';
  return 'severe';
}

function generateExplanation(
  data: InjuryCalculatorData,
  severityBandLabel: string,
  generalDamagesMultiplier: number,
  lowEstimate: number,
  highEstimate: number
): string {
  const parts = [
    `This estimate is classified as: ${severityBandLabel}.`,
    `The range starts with estimated medical specials, then adds general damages using a ${generalDamagesMultiplier.toFixed(2)}x multiplier based on body-map severity, treatment progression, impact severity, age, and accident county venue context.`
  ];

  parts.push('Medical specials are estimated from treatment counts and configured reasonable-value cost ranges. Missed work days, prior accidents, and policy limits are not included in the estimate math.');

  if (data.accidentDetails.impactSeverity === 'low') {
    parts.push('Low-impact collisions can reduce the general-damages portion of the estimate.');
  }

  if (data.accidentDetails.faultPercentage > 0) {
    parts.push(`California comparative fault reduces the estimate by the reported ${data.accidentDetails.faultPercentage}% fault share.`);
  }

  if (data.insurance.hasAttorney) {
    const feePercentage = toNumber(data.insurance.attorneyContingency) || 33;
    const netLow = lowEstimate * (1 - feePercentage / 100);
    const netHigh = highEstimate * (1 - feePercentage / 100);
    parts.push(`If a ${feePercentage}% contingency fee applies, gross attorney-fee-adjusted recovery would be approximately $${Math.round(netLow).toLocaleString()} to $${Math.round(netHigh).toLocaleString()} before liens and costs.`);
  }

  parts.push('This is not legal advice, a guarantee, or a prediction of a specific outcome.');

  return parts.join(' ');
}

export function calculateSettlement(
  data: InjuryCalculatorData,
  config: SettlementLogicConfig = SETTLEMENT_LOGIC
): SettlementResult {
  data = normalizeGuidedInjuryData(data);
  const factors: SettlementResult['factors'] = [];
  const medicalCostRange = estimateMedicalCostRange(data.treatment, config);
  const medicalCosts = medicalCostRange.mid;
  addFactor(factors, 'Medical specials estimated from treatment ranges', 'neutral', 0);

  const specialsRange = medicalCostRange;
  const specials = specialsRange.mid;
  const bodyMapMultiplier = calculateBodyMapGeneralDamagesMultiplier(data, factors, config);
  const treatmentMultiplier = calculateTreatmentGeneralDamagesMultiplier(data, factors, config);
  let generalDamagesMultiplier = bodyMapMultiplier + treatmentMultiplier;

  const impactSeverity = data.accidentDetails.impactSeverity || 'moderate';
  const impactMultiplier = config.impactSeverityMultipliers[impactSeverity] || 1;
  generalDamagesMultiplier *= impactMultiplier;

  if (impactMultiplier !== 1) {
    addFactor(
      factors,
      `${impactSeverity.charAt(0).toUpperCase()}${impactSeverity.slice(1)} impact severity`,
      impactMultiplier > 1 ? 'positive' : 'negative',
      impactMultiplier - 1
    );
  }

  const age = toNumber(data.demographics.age);
  if (age > 0 && age < 30) {
    generalDamagesMultiplier *= config.ageModifiers.under30;
    addFactor(factors, 'Young age recovery modifier', 'negative', config.ageModifiers.under30 - 1);
  } else if (age > 65) {
    generalDamagesMultiplier *= config.ageModifiers.over65;
    addFactor(factors, 'Advanced age fragility modifier', 'positive', config.ageModifiers.over65 - 1);
  }

  generalDamagesMultiplier *= countyVenueMultiplier(data, factors, config);

  const generalDamagesRange = mapMedicalRange(
    specialsRange,
    (value) => value * generalDamagesMultiplier
  );
  let grossRange = addMedicalRange(specialsRange, generalDamagesRange);

  const faultReduction = Math.min(1, Math.max(0, toNumber(data.accidentDetails.faultPercentage) / 100));
  if (faultReduction > 0) {
    grossRange = mapMedicalRange(grossRange, (value) => value * (1 - faultReduction));
    addFactor(factors, `${Math.round(faultReduction * 100)}% comparative fault`, 'negative', -faultReduction);
  }

  const lowEstimate = Math.max(0, grossRange.low * config.rangeMultipliers.low);
  const midEstimate = Math.max(0, grossRange.mid * config.rangeMultipliers.mid);
  const highEstimate = Math.max(0, grossRange.high * config.rangeMultipliers.high);
  const severityBand = severityBandForMultiplier(generalDamagesMultiplier, config);
  const severityBandLabel = config.severityBands[severityBand].label;

  if (data.insurance.hasAttorney) {
    const feePercentage = toNumber(data.insurance.attorneyContingency) || 33;
    addFactor(factors, `Attorney fee selection (${feePercentage}%)`, 'neutral', 0);
  }

  return {
    lowEstimate: Math.round(lowEstimate),
    midEstimate: Math.round(midEstimate),
    highEstimate: Math.round(highEstimate),
    medicalCosts: Math.round(medicalCosts),
    medicalCostRange: roundMedicalRange(medicalCostRange),
    specials: Math.round(specials),
    severityBand,
    caseTier: severityBand,
    logicVersion: config.version,
    logicHash: SETTLEMENT_LOGIC_HASH,
    factors,
    explanation: generateExplanation(data, severityBandLabel, generalDamagesMultiplier, lowEstimate, highEstimate)
  };
}
