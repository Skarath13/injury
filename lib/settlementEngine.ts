import settlementLogicConfig from '@/config/settlement-logic.v1.json';
import { normalizeCounty } from '@/lib/californiaCounties';
import { calculatorAgeFromDemographics } from '@/lib/demographics';
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

function rangeFromMidpoint(midpoint: number, spread: MedicalCostRange): MedicalCostRange {
  return {
    low: midpoint * spread.low,
    mid: midpoint * spread.mid,
    high: midpoint * spread.high
  };
}

function applyMedicalSpecialsLowFloor(
  range: MedicalCostRange,
  config: SettlementLogicConfig
): MedicalCostRange {
  const lowFloor = range.mid * config.medicalSpecialsLowFloorRatio;

  return {
    low: Math.min(range.mid, Math.max(range.low, lowFloor)),
    mid: range.mid,
    high: range.high
  };
}

function calibrateUpperGeneralDamages(
  range: MedicalCostRange,
  medicalMidpoint: number,
  config: SettlementLogicConfig
): MedicalCostRange {
  const calibratedHigh = medicalMidpoint +
    ((range.high - medicalMidpoint) * config.upperGeneralDamagesCalibrationFactor);

  return {
    ...range,
    high: Math.max(range.mid, calibratedHigh)
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

  return roundMedicalRange(applyMedicalSpecialsLowFloor(total, config));
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

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function occupationDemandMultiplier(data: InjuryCalculatorData, config: SettlementLogicConfig): number {
  const multipliers = config.wageLossEstimate.occupationDemandMultipliers;
  const occupation = String(data.demographics.occupation || 'Other') as keyof typeof multipliers;

  return multipliers[occupation] ?? multipliers.Other ?? 1;
}

function calculateEstimatedWageLoss(
  data: InjuryCalculatorData,
  progressionKey: TreatmentProgressionKey,
  factors: SettlementResult['factors'],
  config: SettlementLogicConfig
) {
  if (!data.impact.hasWageLoss) {
    return { amount: 0, days: 0 };
  }

  const wageConfig = config.wageLossEstimate;
  const highestSeverity = highestBodyMapSeverity(data);
  const bodySeverityAdder = wageConfig.bodySeverityAdders[
    String(highestSeverity) as keyof typeof wageConfig.bodySeverityAdders
  ] || 0;
  const impactSeverity = data.accidentDetails.impactSeverity || 'moderate';
  const impactMultiplier = wageConfig.impactSeverityMultipliers[
    impactSeverity as keyof typeof wageConfig.impactSeverityMultipliers
  ] || 1;
  const estimatedDays = Math.round(clamp(
    (wageConfig.treatmentBaseDays[progressionKey] + bodySeverityAdder) *
      occupationDemandMultiplier(data, config) *
      impactMultiplier,
    0,
    wageConfig.maxEstimatedDays
  ));
  const annualIncome = Math.max(0, toNumber(data.demographics.annualIncome));
  const amount = Math.round((annualIncome / wageConfig.workdaysPerYear) * estimatedDays);

  if (amount > 0 && estimatedDays > 0) {
    addFactor(
      factors,
      `Estimated wage loss (${estimatedDays} work day${estimatedDays === 1 ? '' : 's'})`,
      'positive',
      Math.min(amount / Math.max(annualIncome, 1), 1)
    );
  }

  return {
    amount,
    days: estimatedDays
  };
}

function lifeImpactContextMultiplier(
  data: InjuryCalculatorData,
  progressionKey: TreatmentProgressionKey,
  config: SettlementLogicConfig
) {
  const lifeConfig = config.lifeImpactModifiers;
  const highestSeverity = highestBodyMapSeverity(data);
  const bodyContext = lifeConfig.bodySeverityContext[
    String(highestSeverity) as keyof typeof lifeConfig.bodySeverityContext
  ] || 1;
  const treatmentContext = lifeConfig.treatmentContext[progressionKey] || 1;

  return (bodyContext + treatmentContext) / 2;
}

function calculateLifeImpactGeneralDamagesAdder(
  data: InjuryCalculatorData,
  progressionKey: TreatmentProgressionKey,
  factors: SettlementResult['factors'],
  config: SettlementLogicConfig
) {
  const lifeConfig = config.lifeImpactModifiers;
  const contextMultiplier = lifeImpactContextMultiplier(data, progressionKey, config);
  const entries: Array<{ label: string; weight: number }> = [];

  if (data.impact.emotionalDistress) {
    entries.push({
      label: 'Emotional distress weighted to injury profile',
      weight: lifeConfig.bases.emotionalDistress * contextMultiplier
    });
  }

  if (data.impact.lossOfConsortium) {
    entries.push({
      label: 'Relationship or household impact weighted to injury profile',
      weight: lifeConfig.bases.lossOfConsortium * contextMultiplier
    });
  }

  if (data.impact.permanentImpairment) {
    entries.push({
      label: 'Permanent impairment weighted to injury profile',
      weight: lifeConfig.bases.permanentImpairment * contextMultiplier
    });
  }

  const rawTotal = entries.reduce((total, entry) => total + entry.weight, 0);
  if (rawTotal <= 0) return 0;

  const capRatio = rawTotal > lifeConfig.maxTotalAdder
    ? lifeConfig.maxTotalAdder / rawTotal
    : 1;

  return entries.reduce((total, entry) => {
    const cappedWeight = entry.weight * capRatio;
    addFactor(factors, entry.label, 'positive', cappedWeight);
    return total + cappedWeight;
  }, 0);
}

function calculateTreatmentGeneralDamagesMultiplier(
  data: InjuryCalculatorData,
  factors: SettlementResult['factors'],
  config: SettlementLogicConfig,
  key: TreatmentProgressionKey = treatmentProgressionKey(data.treatment)
): number {
  const progression = config.treatmentProgression;
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
  highEstimate: number,
  estimatedWageLoss: number,
  estimatedWorkLossDays: number
): string {
  const parts = [
    `This estimate is classified as: ${severityBandLabel}.`,
    `The settlement range is total gross case value: estimated medical specials plus general damages using a ${generalDamagesMultiplier.toFixed(2)}x multiplier based on body-map severity, treatment progression, life-impact signals, impact severity, age, and accident county venue context.`
  ];

  parts.push('General damages are the pain-and-suffering portion added on top of medical specials. Medical specials are estimated from treatment counts and configured reasonable-value cost ranges; the displayed low end includes a calibration floor and is not a user-entered bill. When wage loss is selected, wage loss is estimated from occupation, income range, injury severity, treatment progression, and vehicle impact severity. User-entered missed work days, prior accidents, and policy limits are not included in the estimate math.');

  if (estimatedWageLoss > 0 && estimatedWorkLossDays > 0) {
    parts.push(`Estimated wage loss adds approximately $${Math.round(estimatedWageLoss).toLocaleString()} based on ${estimatedWorkLossDays} expected work day${estimatedWorkLossDays === 1 ? '' : 's'} away.`);
  }

  if (data.accidentDetails.impactSeverity === 'low') {
    parts.push('Low-impact collisions can reduce the general-damages portion of the estimate.');
  }

  if (data.accidentDetails.faultPercentage > 0) {
    parts.push(`California comparative fault reduces the estimate by the reported ${data.accidentDetails.faultPercentage}% fault share.`);
  }

  if (data.insurance.hasAttorney) {
    const feePercentage = 33;
    const netLow = lowEstimate * (1 - feePercentage / 100);
    const netHigh = highEstimate * (1 - feePercentage / 100);
    parts.push(`If a standard ${feePercentage}% contingency fee applies, gross attorney-fee-adjusted recovery would be approximately $${Math.round(netLow).toLocaleString()} to $${Math.round(netHigh).toLocaleString()} before liens and costs.`);
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

  const treatmentKey = treatmentProgressionKey(data.treatment);
  const estimatedWorkLoss = calculateEstimatedWageLoss(data, treatmentKey, factors, config);
  const specials = medicalCosts + estimatedWorkLoss.amount;
  const bodyMapMultiplier = calculateBodyMapGeneralDamagesMultiplier(data, factors, config);
  const treatmentMultiplier = calculateTreatmentGeneralDamagesMultiplier(data, factors, config, treatmentKey);
  let generalDamagesMultiplier = bodyMapMultiplier + treatmentMultiplier;
  generalDamagesMultiplier += calculateLifeImpactGeneralDamagesAdder(data, treatmentKey, factors, config);

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

  const age = calculatorAgeFromDemographics(data.demographics);
  if (age > 0 && age < 30) {
    generalDamagesMultiplier *= config.ageModifiers.under30;
    addFactor(factors, 'Young age recovery modifier', 'negative', config.ageModifiers.under30 - 1);
  } else if (age > 65) {
    generalDamagesMultiplier *= config.ageModifiers.over65;
    addFactor(factors, 'Advanced age fragility modifier', 'positive', config.ageModifiers.over65 - 1);
  }

  generalDamagesMultiplier *= countyVenueMultiplier(data, factors, config);

  const severityBand = severityBandForMultiplier(generalDamagesMultiplier, config);
  const severityBandLabel = config.severityBands[severityBand].label;
  const minorCaseRangeBoost = impactSeverity === 'low' &&
    generalDamagesMultiplier <= config.minorCaseRangeBoost.maxGeneralDamagesMultiplier
    ? config.minorCaseRangeBoost.multiplier
    : 1;
  const grossMidpoint = (medicalCosts + (medicalCosts * generalDamagesMultiplier)) * minorCaseRangeBoost;
  const rangeSpread = minorCaseRangeBoost !== 1
    ? config.minorCaseRangeBoost.rangeSpread
    : config.rangeSpreads[severityBand];
  let grossRange = rangeFromMidpoint(grossMidpoint, rangeSpread);
  grossRange = calibrateUpperGeneralDamages(grossRange, medicalCosts, config);
  if (estimatedWorkLoss.amount > 0) {
    grossRange = addMedicalRange(grossRange, {
      low: estimatedWorkLoss.amount,
      mid: estimatedWorkLoss.amount,
      high: estimatedWorkLoss.amount
    });
  }

  const faultReduction = Math.min(1, Math.max(0, toNumber(data.accidentDetails.faultPercentage) / 100));
  if (faultReduction > 0) {
    grossRange = mapMedicalRange(grossRange, (value) => value * (1 - faultReduction));
    addFactor(factors, `${Math.round(faultReduction * 100)}% comparative fault`, 'negative', -faultReduction);
  }

  const lowEstimate = Math.max(0, grossRange.low);
  const midEstimate = Math.max(0, grossRange.mid);
  const highEstimate = Math.max(0, grossRange.high);

  if (data.insurance.hasAttorney) {
    addFactor(factors, 'Attorney involvement noted', 'neutral', 0);
  }

  return {
    lowEstimate: Math.round(lowEstimate),
    midEstimate: Math.round(midEstimate),
    highEstimate: Math.round(highEstimate),
    medicalCosts: Math.round(medicalCosts),
    estimatedWageLoss: Math.round(estimatedWorkLoss.amount),
    estimatedWorkLossDays: estimatedWorkLoss.days,
    medicalCostRange: roundMedicalRange(medicalCostRange),
    specials: Math.round(specials),
    severityBand,
    caseTier: severityBand,
    logicVersion: config.version,
    logicHash: SETTLEMENT_LOGIC_HASH,
    factors,
    explanation: generateExplanation(
      data,
      severityBandLabel,
      generalDamagesMultiplier,
      lowEstimate,
      highEstimate,
      estimatedWorkLoss.amount,
      estimatedWorkLoss.days
    )
  };
}
