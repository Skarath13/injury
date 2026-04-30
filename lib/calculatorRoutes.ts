import { dateOnlyIsInFuture, dateOnlyIsValid } from '@/lib/demographics';
import type { BodyMapGender, InjuryCalculatorData } from '@/types/calculator';

export const ESTIMATE_BASE_PATH = '/estimate';

export const CALCULATOR_CAMPAIGN_QUERY_KEYS = new Set([
  'gclid',
  'gbraid',
  'wbraid'
]);

export type CalculatorStepSlug =
  | 'quick-facts'
  | 'injury-map'
  | 'treatment'
  | 'work-life'
  | 'unlock';

export type CalculatorUtilitySlug =
  | 'start'
  | 'preparing'
  | 'preview'
  | 'success';

export type CalculatorRouteSlug = CalculatorStepSlug | CalculatorUtilitySlug;

export type CalculatorRouteState =
  | { kind: 'start'; slug: 'start' }
  | { kind: 'step'; slug: CalculatorStepSlug; step: number }
  | { kind: 'preparing'; slug: 'preparing' }
  | { kind: 'preview'; slug: 'preview' }
  | { kind: 'success'; slug: 'success' };

export type CalculatorTransientState = {
  hasPreview: boolean;
  isPreparing: boolean;
  hasResults: boolean;
};

export type CalculatorProgressInput = {
  data: InjuryCalculatorData;
  bodyModel: BodyMapGender | '';
  workLifeBooleanAnswers?: {
    hasAttorney?: boolean;
  };
};

export const CALCULATOR_STEP_ROUTES: Array<{
  step: number;
  slug: CalculatorStepSlug;
  label: string;
}> = [
  { step: 1, slug: 'quick-facts', label: 'Quick Facts' },
  { step: 2, slug: 'injury-map', label: 'Injury Map' },
  { step: 3, slug: 'treatment', label: 'Treatment' },
  { step: 4, slug: 'work-life', label: 'Work & Daily Life' },
  { step: 5, slug: 'unlock', label: 'Unlock' }
];

export const ESTIMATE_ROUTE_SLUGS: CalculatorRouteSlug[] = [
  'start',
  ...CALCULATOR_STEP_ROUTES.map((route) => route.slug),
  'preparing',
  'preview',
  'success'
];

const STEP_ROUTE_BY_STEP = new Map(CALCULATOR_STEP_ROUTES.map((route) => [route.step, route]));
const STEP_ROUTE_BY_SLUG = new Map(CALCULATOR_STEP_ROUTES.map((route) => [route.slug, route]));

export function isCampaignQueryKey(key: string): boolean {
  return key.toLowerCase().startsWith('utm_') || CALCULATOR_CAMPAIGN_QUERY_KEYS.has(key.toLowerCase());
}

export function campaignSearchParamsFrom(search: string | URLSearchParams | null | undefined): URLSearchParams {
  const source = typeof search === 'string'
    ? new URLSearchParams(search.startsWith('?') ? search.slice(1) : search)
    : search || new URLSearchParams();
  const campaignParams = new URLSearchParams();

  source.forEach((value, key) => {
    if (isCampaignQueryKey(key)) {
      campaignParams.append(key, value);
    }
  });

  return campaignParams;
}

export function campaignSearchParamsFromRecord(
  values: Record<string, string | string[] | undefined>
): URLSearchParams {
  const params = new URLSearchParams();

  Object.entries(values).forEach(([key, value]) => {
    if (!isCampaignQueryKey(key) || value === undefined) return;

    if (Array.isArray(value)) {
      value.forEach((item) => params.append(key, item));
      return;
    }

    params.append(key, value);
  });

  return params;
}

export function appendCampaignSearchParams(path: string, search: string | URLSearchParams | null | undefined): string {
  const params = campaignSearchParamsFrom(search);
  const query = params.toString();
  return query ? `${path}?${query}` : path;
}

export function calculatorPathForSlug(slug: CalculatorRouteSlug): string {
  return `${ESTIMATE_BASE_PATH}/${slug}`;
}

export function calculatorPathForStep(step: number): string {
  const route = STEP_ROUTE_BY_STEP.get(clampCalculatorStep(step)) || CALCULATOR_STEP_ROUTES[0];
  return calculatorPathForSlug(route.slug);
}

export function calculatorPathForRoute(route: CalculatorRouteState): string {
  return calculatorPathForSlug(route.slug);
}

export function routeStateForStep(step: number): CalculatorRouteState {
  const route = STEP_ROUTE_BY_STEP.get(clampCalculatorStep(step)) || CALCULATOR_STEP_ROUTES[0];
  return {
    kind: 'step',
    step: route.step,
    slug: route.slug
  };
}

export function routeStateForSlug(slug: CalculatorRouteSlug): CalculatorRouteState {
  if (slug === 'start') return { kind: 'start', slug };
  if (slug === 'preparing') return { kind: 'preparing', slug };
  if (slug === 'preview') return { kind: 'preview', slug };
  if (slug === 'success') return { kind: 'success', slug };

  const stepRoute = STEP_ROUTE_BY_SLUG.get(slug);
  if (!stepRoute) return { kind: 'start', slug: 'start' };

  return {
    kind: 'step',
    step: stepRoute.step,
    slug: stepRoute.slug
  };
}

export function parseEstimateSlug(slug: string | undefined): CalculatorRouteState | null {
  if (!slug) return null;
  if (!ESTIMATE_ROUTE_SLUGS.includes(slug as CalculatorRouteSlug)) return null;
  return routeStateForSlug(slug as CalculatorRouteSlug);
}

export function parseEstimatePath(pathname: string): CalculatorRouteState | null {
  if (pathname === ESTIMATE_BASE_PATH) return { kind: 'start', slug: 'start' };
  if (!pathname.startsWith(`${ESTIMATE_BASE_PATH}/`)) return null;

  const [slug, ...extraSegments] = pathname.slice(ESTIMATE_BASE_PATH.length + 1).split('/');
  if (extraSegments.length > 0) return null;

  return parseEstimateSlug(slug);
}

export function clampCalculatorStep(step: unknown): number {
  const numericStep = Number(step);
  if (!Number.isFinite(numericStep)) return 1;
  return Math.min(Math.max(Math.round(numericStep), 1), CALCULATOR_STEP_ROUTES.length);
}

export function quickFactsAreComplete(input: CalculatorProgressInput): boolean {
  const dateOfAccident = input.data.accidentDetails?.dateOfAccident || '';
  const impactSeverity = input.data.accidentDetails?.impactSeverity || '';

  return Boolean(
    dateOnlyIsValid(dateOfAccident) &&
    !dateOnlyIsInFuture(dateOfAccident) &&
    impactSeverity &&
    input.bodyModel
  );
}

export function injuryMapIsComplete(input: CalculatorProgressInput): boolean {
  return Boolean(input.data.injuries?.bodyMap?.length);
}

export function workLifeIsComplete(input: CalculatorProgressInput): boolean {
  if (input.data.impact?.hasWageLoss) {
    const hasOccupation = Boolean(input.data.demographics?.occupation);
    const hasAnnualIncome = Boolean(input.data.demographics?.annualIncome);
    if (!hasOccupation || !hasAnnualIncome) return false;
  }

  return typeof input.workLifeBooleanAnswers?.hasAttorney === 'boolean';
}

export function firstIncompleteStepForTargetStep(
  targetStep: number,
  input: CalculatorProgressInput
): number | null {
  const requestedStep = clampCalculatorStep(targetStep);

  if (requestedStep >= 2 && !quickFactsAreComplete(input)) return 1;
  if (requestedStep >= 3 && !injuryMapIsComplete(input)) return 2;
  if (requestedStep >= 5 && !workLifeIsComplete(input)) return 4;

  return null;
}

export function firstReachableStep(input: CalculatorProgressInput): number {
  if (!quickFactsAreComplete(input)) return 1;
  if (!injuryMapIsComplete(input)) return 2;
  if (!workLifeIsComplete(input)) return 4;
  return 5;
}

export function guardCalculatorRoute(
  requestedRoute: CalculatorRouteState,
  input: CalculatorProgressInput,
  transientState: CalculatorTransientState
): CalculatorRouteState {
  if (requestedRoute.kind === 'start') return requestedRoute;

  if (requestedRoute.kind === 'preparing') {
    return transientState.isPreparing
      ? requestedRoute
      : routeStateForStep(firstReachableStep(input));
  }

  if (requestedRoute.kind === 'preview') {
    return transientState.hasPreview
      ? requestedRoute
      : routeStateForStep(firstReachableStep(input));
  }

  if (requestedRoute.kind === 'success') {
    return transientState.hasResults
      ? requestedRoute
      : routeStateForStep(firstReachableStep(input));
  }

  const incompleteStep = firstIncompleteStepForTargetStep(requestedRoute.step, input);
  return incompleteStep ? routeStateForStep(incompleteStep) : requestedRoute;
}
