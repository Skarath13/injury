import settlementLogicConfig from '@/config/settlement-logic.v1.json';
import { BodyMapSelection, InjuryCalculatorData, SettlementResult } from '@/types/calculator';

type SettlementLogicConfig = typeof settlementLogicConfig;
type FactorImpact = SettlementResult['factors'][number]['impact'];

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

export function estimateMedicalCosts(
  treatment: InjuryCalculatorData['treatment'],
  config: SettlementLogicConfig = SETTLEMENT_LOGIC
): number {
  const costs = config.treatmentUnitCosts;
  const surgeryType = treatment.surgeryType;
  const surgeryCost = surgeryType === 'minor'
    ? costs.surgeryMinor
    : surgeryType === 'moderate'
      ? costs.surgeryModerate
      : surgeryType === 'major'
        ? costs.surgeryMajor
        : 0;

  return Math.round(
    toNumber(treatment.emergencyRoomVisits) * costs.emergencyRoomVisits +
    toNumber(treatment.urgentCareVisits) * costs.urgentCareVisits +
    toNumber(treatment.chiropracticSessions) * costs.chiropracticSessions +
    toNumber(treatment.physicalTherapySessions) * costs.physicalTherapySessions +
    toNumber(treatment.xrays) * costs.xrays +
    toNumber(treatment.mris) * costs.mris +
    toNumber(treatment.ctScans) * costs.ctScans +
    toNumber(treatment.painManagementVisits) * costs.painManagementVisits +
    toNumber(treatment.orthopedicConsults) * costs.orthopedicConsults +
    toNumber(treatment.tpiInjections) * costs.tpiInjections +
    toNumber(treatment.facetInjections) * costs.facetInjections +
    toNumber(treatment.mbbInjections) * costs.mbbInjections +
    toNumber(treatment.esiInjections) * costs.esiInjections +
    toNumber(treatment.rfaInjections) * costs.rfaInjections +
    toNumber(treatment.prpInjections) * costs.prpInjections +
    (treatment.surgeryRecommended || treatment.surgeryCompleted ? surgeryCost : 0)
  );
}

function allInjuryText(data: InjuryCalculatorData): string {
  return [
    data.injuries.primaryInjury,
    ...data.injuries.secondaryInjuries,
    ...data.injuries.fractures
  ].join(' ').toLowerCase();
}

function fractureKey(fracture: string): keyof SettlementLogicConfig['fractureAdders'] {
  const normalized = fracture.toLowerCase();

  if (normalized.includes('skull')) return 'skull';
  if (normalized.includes('facial')) return 'facial';
  if (normalized.includes('spine') || normalized.includes('vertebral')) return 'spine';
  if (normalized.includes('rib')) return 'ribs';
  if (normalized.includes('arm') || normalized.includes('humerus')) return 'arm';
  if (normalized.includes('wrist')) return 'wrist';
  if (normalized.includes('hand')) return 'hand';
  if (normalized.includes('leg') || normalized.includes('femur') || normalized.includes('tibia') || normalized.includes('fibula')) return 'leg';
  if (normalized.includes('ankle')) return 'ankle';
  if (normalized.includes('foot')) return 'foot';
  if (normalized.includes('pelv')) return 'pelvis';
  if (normalized.includes('clavicle') || normalized.includes('collar')) return 'clavicle';

  return 'default';
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

function bodyMapHasHighValueSeverity(
  data: InjuryCalculatorData,
  config: SettlementLogicConfig,
  minimumSeverity: number
): boolean {
  const highValueRegions = new Set(config.bodyMapSeverity.highValueRegions);

  return bodyMapSelections(data).some((selection) => (
    selection.severity >= minimumSeverity && highValueRegions.has(selection.slug === 'hair' ? 'head' : selection.slug)
  ));
}

function calculateBodyMapAdder(
  data: InjuryCalculatorData,
  factors: SettlementResult['factors'],
  config: SettlementLogicConfig
): number {
  const selections = bodyMapSelections(data);

  if (selections.length === 0) return 0;

  const bodyConfig = config.bodyMapSeverity;
  const highValueRegions = new Set(bodyConfig.highValueRegions);
  let total = 0;

  for (const selection of selections) {
    const baseAdder = bodyConfig.severityAdders[String(selection.severity) as keyof typeof bodyConfig.severityAdders] || 0;
    const slug = selection.slug === 'hair' ? 'head' : selection.slug;
    const regionalMultiplier = highValueRegions.has(slug) ? bodyConfig.highValueRegionMultiplier : 1;
    total += Math.round(baseAdder * regionalMultiplier);
  }

  if (selections.length >= bodyConfig.multiRegionThreshold) {
    total += bodyConfig.multiRegionAdder;
  }

  const capped = Math.min(total, bodyConfig.maxTotalAdder);
  const highestSeverity = highestBodyMapSeverity(data);

  addFactor(
    factors,
    `${selections.length} selected pain area${selections.length === 1 ? '' : 's'} (${highestSeverity}/4 max severity)`,
    highestSeverity >= 3 ? 'positive' : 'neutral',
    Math.min(0.35, capped / 50000)
  );

  return capped;
}

function determineCaseTier(
  data: InjuryCalculatorData,
  config: SettlementLogicConfig = SETTLEMENT_LOGIC
): keyof SettlementLogicConfig['caseTiers'] {
  const text = allInjuryText(data);
  const spinal = data.injuries.spinalIssues;
  const fractureCount = data.injuries.fractures.length;
  const injectionCount = totalInjections(data.treatment);
  const therapyCount = toNumber(data.treatment.chiropracticSessions) + toNumber(data.treatment.physicalTherapySessions);
  const bodySeverity = highestBodyMapSeverity(data);
  const bodyOnlyHardSignal = bodyMapHasHighValueSeverity(data, config, config.bodyMapSeverity.hardTissueSeverity);

  const hasSurgery = data.treatment.surgeryCompleted || data.treatment.surgeryRecommended;
  const seriousFracture = data.injuries.fractures.some((fracture) => {
    const key = fractureKey(fracture);
    return ['skull', 'facial', 'spine', 'pelvis', 'leg'].includes(key);
  });

  if (
    data.accidentDetails.impactSeverity === 'catastrophic' ||
    data.injuries.tbiSeverity === 'severe' ||
    spinal.myelopathy
  ) {
    return 'catastrophic';
  }

  if (
    hasSurgery ||
    seriousFracture ||
    injectionCount >= 3 ||
    data.injuries.tbiSeverity === 'moderate'
  ) {
    return 'serious_or_surgical';
  }

  if (
    fractureCount > 0 ||
    spinal.herniation ||
    spinal.nerveRootCompression ||
    spinal.radiculopathy ||
    data.injuries.tbi ||
    text.includes('tear') ||
    text.includes('disc') ||
    (
      bodyOnlyHardSignal &&
      (
        data.accidentDetails.impactSeverity === 'severe' ||
        toNumber(data.treatment.emergencyRoomVisits) > 0 ||
        toNumber(data.treatment.mris) > 0 ||
        toNumber(data.treatment.ctScans) > 0
      )
    )
  ) {
    return 'hard_tissue_or_light_fracture';
  }

  if (
    therapyCount >= 8 ||
    injectionCount > 0 ||
    toNumber(data.treatment.mris) > 0 ||
    toNumber(data.treatment.ctScans) > 0 ||
    data.treatment.ongoingTreatment ||
    bodySeverity >= config.bodyMapSeverity.softTissueWithAddersSeverity
  ) {
    return 'soft_tissue_with_adders';
  }

  return 'soft_tissue';
}

function calculateFixedAdders(
  data: InjuryCalculatorData,
  factors: SettlementResult['factors'],
  config: SettlementLogicConfig
): number {
  const adders = config.fixedAdders;
  const fractures = config.fractureAdders;
  const spinal = data.injuries.spinalIssues;
  let value = 0;

  if (data.treatment.ongoingTreatment) {
    value += adders.ongoingTreatment;
    addFactor(factors, 'Ongoing treatment documented', 'positive', 0.15);
  }

  if (data.injuries.tbi) {
    const tbiValue = data.injuries.tbiSeverity === 'severe'
      ? adders.tbiSevere
      : data.injuries.tbiSeverity === 'moderate'
        ? adders.tbiModerate
        : adders.tbiMild;
    value += tbiValue;
    addFactor(factors, 'Traumatic brain injury or concussion', 'positive', 0.65);
  }

  if (spinal.herniation) value += adders.spinalHerniation;
  if (spinal.nerveRootCompression) value += adders.spinalNerveRootCompression;
  if (spinal.radiculopathy) value += adders.spinalRadiculopathy;
  if (spinal.myelopathy) value += adders.spinalMyelopathy;
  if (spinal.preExistingDegeneration) value += adders.spinalPreExistingDegeneration;

  const spinalCount = Object.values(spinal).filter(Boolean).length;
  if (spinalCount > 0) {
    addFactor(factors, `${spinalCount} objective spinal finding${spinalCount === 1 ? '' : 's'}`, 'positive', 0.55);
  }

  for (const fracture of data.injuries.fractures) {
    const key = fractureKey(fracture);
    value += fractures[key] || fractures.default;
  }

  if (data.injuries.fractures.length > 0) {
    addFactor(factors, `${data.injuries.fractures.length} fracture${data.injuries.fractures.length === 1 ? '' : 's'}`, 'positive', 0.65);
  }

  value += calculateBodyMapAdder(data, factors, config);

  const text = allInjuryText(data);
  if (text.includes('scar') || text.includes('disfigurement')) {
    const isFacial = text.includes('facial') || data.injuries.fractures.some((fracture) => fractureKey(fracture) === 'facial');
    value += isFacial ? adders.facialScarring : adders.generalScarring;
    addFactor(factors, isFacial ? 'Facial scarring or disfigurement' : 'Scarring or disfigurement', 'positive', 0.45);
  }

  if (data.impact.permanentImpairment) {
    const rating = Math.max(1, toNumber(data.impact.impairmentRating) || 10);
    value += rating * adders.permanentImpairmentPerPoint;
    addFactor(factors, `Permanent impairment (${rating}% rating used)`, 'positive', 0.65);
  }

  if (data.impact.emotionalDistress) {
    value += adders.emotionalDistress;
    addFactor(factors, 'Emotional distress or PTSD symptoms', 'positive', 0.15);
  }

  if (data.impact.lossOfConsortium) {
    value += adders.lossOfConsortium;
    addFactor(factors, 'Loss of consortium impact', 'positive', 0.1);
  }

  if (data.impact.dylanVLeggClaim) {
    value += adders.dillonVLegg;
    addFactor(factors, 'Dillon v. Legg bystander claim facts', 'positive', 0.1);
  }

  return value;
}

function generateExplanation(
  data: InjuryCalculatorData,
  tierLabel: string,
  lowEstimate: number,
  highEstimate: number
): string {
  const parts = [
    `This estimate is classified as: ${tierLabel}.`,
    'The range is an educational insurance settlement estimate based on configured treatment costs, specials, objective injury indicators, comparative fault, and available policy limits.'
  ];

  if (data.treatment.useEstimatedCosts) {
    parts.push('Because exact medical specials were not provided, the calculation used configured treatment-cost estimates.');
  }

  if (data.accidentDetails.impactSeverity === 'low') {
    parts.push('Low-impact collisions can create causation disputes and reduce settlement value.');
  }

  if (data.accidentDetails.faultPercentage > 0) {
    parts.push(`California comparative fault reduces the estimate by the reported ${data.accidentDetails.faultPercentage}% fault share.`);
  }

  if (data.insurance.policyLimitsKnown && data.insurance.policyLimits && data.insurance.policyLimits < highEstimate) {
    parts.push('The high end is limited by the available insurance policy limit provided.');
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
  const factors: SettlementResult['factors'] = [];
  const medicalCosts = data.treatment.useEstimatedCosts
    ? estimateMedicalCosts(data.treatment, config)
    : toNumber(data.treatment.totalMedicalCosts);

  if (data.treatment.useEstimatedCosts) {
    addFactor(factors, 'Medical specials estimated from treatment inputs', 'neutral', 0);
  }

  const annualIncome = toNumber(data.demographics.annualIncome);
  const missedWorkDays = toNumber(data.impact.missedWorkDays);
  const lostWages = Math.round((annualIncome / 250) * missedWorkDays);
  const specials = Math.max(0, medicalCosts + lostWages);

  if (lostWages > 0) {
    addFactor(factors, 'Lost wage specials included', lostWages > 5000 ? 'positive' : 'neutral', lostWages > 5000 ? 0.25 : 0);
  }

  const caseTier = determineCaseTier(data, config);
  const tier = config.caseTiers[caseTier];
  addFactor(factors, tier.label, 'neutral', tier.specialsMultiplier);

  let grossValue = specials * tier.specialsMultiplier;
  grossValue += calculateFixedAdders(data, factors, config);

  const impactSeverity = data.accidentDetails.impactSeverity || 'moderate';
  const impactMultiplier = config.impactSeverityMultipliers[impactSeverity] || 1;
  grossValue *= impactMultiplier;

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
    grossValue *= config.ageModifiers.under30;
    addFactor(factors, 'Young age recovery modifier', 'negative', config.ageModifiers.under30 - 1);
  } else if (age > 65) {
    grossValue *= config.ageModifiers.over65;
    addFactor(factors, 'Advanced age fragility modifier', 'positive', config.ageModifiers.over65 - 1);
  }

  const preExistingCount = data.injuries.preExistingConditions.length;
  if (preExistingCount > 0) {
    const reduction = Math.min(
      config.preExistingConditionReductionCap,
      preExistingCount * config.preExistingConditionReductionPerCondition
    );
    grossValue *= (1 - reduction);
    addFactor(factors, `${preExistingCount} pre-existing condition${preExistingCount === 1 ? '' : 's'}`, 'negative', -reduction);
  }

  const priorAccidents = toNumber(data.accidentDetails.priorAccidents);
  if (priorAccidents > 0) {
    const reduction = Math.min(
      config.priorAccidentReductionCap,
      priorAccidents * config.priorAccidentReductionPerAccident
    );
    grossValue *= (1 - reduction);
    addFactor(factors, `${priorAccidents} prior accident${priorAccidents === 1 ? '' : 's'}`, 'negative', -reduction);
  }

  const faultReduction = Math.min(1, Math.max(0, toNumber(data.accidentDetails.faultPercentage) / 100));
  if (faultReduction > 0) {
    grossValue *= (1 - faultReduction);
    addFactor(factors, `${Math.round(faultReduction * 100)}% comparative fault`, 'negative', -faultReduction);
  }

  const policyLimit = data.insurance.policyLimitsKnown ? toNumber(data.insurance.policyLimits) : 0;
  if (policyLimit > 0 && grossValue > policyLimit) {
    grossValue = policyLimit;
    addFactor(factors, 'Limited by provided insurance policy limit', 'negative', -0.9);
  }

  const lowEstimate = Math.max(0, grossValue * config.rangeMultipliers.low);
  const midEstimate = Math.max(0, grossValue * config.rangeMultipliers.mid);
  const highEstimate = Math.max(0, grossValue * config.rangeMultipliers.high);

  if (data.insurance.hasAttorney) {
    const feePercentage = toNumber(data.insurance.attorneyContingency) || 33;
    addFactor(factors, `Attorney fee selection (${feePercentage}%)`, 'neutral', 0);
  }

  return {
    lowEstimate: Math.round(lowEstimate),
    midEstimate: Math.round(midEstimate),
    highEstimate: Math.round(highEstimate),
    medicalCosts: Math.round(medicalCosts),
    specials: Math.round(specials),
    caseTier,
    logicVersion: config.version,
    logicHash: SETTLEMENT_LOGIC_HASH,
    factors,
    explanation: generateExplanation(data, tier.label, lowEstimate, highEstimate)
  };
}
