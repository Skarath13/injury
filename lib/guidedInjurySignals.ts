import { deriveBodyMapOnlyInjuryFields } from '@/lib/bodyMapInjuries';
import type {
  BodyMapSelection,
  GuidedInjurySignals,
  InjuryCalculatorData
} from '@/types/calculator';

export function createDefaultGuidedInjurySignals(): GuidedInjurySignals {
  return {
    head: {
      status: 'unanswered',
      certainty: 'unknown'
    },
    spine: {
      status: 'unanswered',
      certainty: 'unknown'
    },
    fracture: {
      status: 'unanswered',
      certainty: 'unknown',
      areas: []
    },
    visibleOrInternal: {
      status: 'unanswered'
    },
    preExisting: {
      sameAreaStatus: 'unanswered'
    }
  };
}

export function withDefaultGuidedInjurySignals(
  signals?: Partial<GuidedInjurySignals>
): GuidedInjurySignals {
  const defaults = createDefaultGuidedInjurySignals();

  return {
    head: {
      ...defaults.head,
      ...signals?.head
    },
    spine: {
      ...defaults.spine,
      ...signals?.spine
    },
    fracture: {
      ...defaults.fracture,
      ...signals?.fracture,
      areas: signals?.fracture?.areas || defaults.fracture.areas
    },
    visibleOrInternal: {
      ...defaults.visibleOrInternal,
      ...signals?.visibleOrInternal
    },
    preExisting: {
      ...defaults.preExisting,
      ...signals?.preExisting
    }
  };
}

export function defaultUnansweredGuidedInjurySignals(
  signals: GuidedInjurySignals | undefined,
  _bodyMap: BodyMapSelection[] = []
): GuidedInjurySignals {
  return withDefaultGuidedInjurySignals(signals);
}

export function deriveGuidedLegacyInjuryFields(
  injuries: InjuryCalculatorData['injuries']
): Pick<
  InjuryCalculatorData['injuries'],
  'primaryInjury' |
  'secondaryInjuries' |
  'preExistingConditions' |
  'fractures' |
  'tbi' |
  'tbiSeverity' |
  'spinalIssues'
> {
  return deriveBodyMapOnlyInjuryFields(injuries);
}

export function normalizeGuidedInjuryData(data: InjuryCalculatorData): InjuryCalculatorData {
  const derived = deriveBodyMapOnlyInjuryFields(data.injuries);

  return {
    ...data,
    injuries: {
      ...data.injuries,
      ...derived,
      guidedSignals: data.injuries.guidedSignals
        ? withDefaultGuidedInjurySignals(data.injuries.guidedSignals)
        : data.injuries.guidedSignals
    }
  };
}
