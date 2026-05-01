'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FieldErrors, UseFormRegister, UseFormSetValue, useForm } from 'react-hook-form';
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Briefcase,
  CalendarDays,
  Check,
  ChevronLeft,
  ClipboardCheck,
  FileLock2,
  KeyRound,
  Lock,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  RotateCcw,
  ShieldCheck,
  Stethoscope,
  User,
  X
} from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from '@/components/motion/react';
import {
  BodyMapGender,
  EstimateOnlyUnlockResponse,
  EstimatePreviewResponse,
  InjuryCalculatorData,
  ResponsibleAttorney,
  RestoreUnlockedEstimateResponse,
  SettlementResult,
  UnlockStartResponse,
  UnlockVerifyResponse
} from '@/types/calculator';
import { deriveBodyMapOnlyInjuryFields } from '@/lib/bodyMapInjuries';
import {
  calculatorAgeFromDemographics,
  dateInputValueForAge,
  dateOfBirthIsInAllowedRange,
  parseDateOnly
} from '@/lib/demographics';
import { createDefaultGuidedInjurySignals } from '@/lib/guidedInjurySignals';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Field, FieldContent, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { NativeSelect } from '@/components/ui/native-select';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import QuickFactsStep from './steps/QuickFactsStep';
import InjuriesStep from './steps/InjuriesStep';
import TreatmentStep from './steps/TreatmentStep';
import WorkLifeStep from './steps/WorkLifeStep';
import SettlementResults from './SettlementResults';
import EstimatePreparationLoader, { ESTIMATE_PREPARATION_MIN_MS } from './EstimatePreparationLoader';
import CountyCombobox from './CountyCombobox';
import InfoIcon from './InfoIcon';
import { fadeUpItem, gentleSpring, premiumEase, reducedMotionFade, softSpring, staggerContainer } from '@/components/motion/presets';
import { cn } from '@/lib/utils';
import { readBrowserPrivacyChoices } from '@/lib/privacyChoices';
import { applyWageLossDefaults } from '@/lib/wageLossDefaults';
import {
  CALCULATOR_DRAFT_NONE,
  CALCULATOR_DRAFT_PRESENT,
  CALCULATOR_DRAFT_STORAGE_KEY,
  CALCULATOR_DRAFT_VERSION,
  normalizeCalculatorDraft,
  setCalculatorDraftDocumentStatus,
  type CalculatorDraft,
  type WorkLifeBooleanAnswers,
  type WorkLifeBooleanField
} from '@/lib/calculatorDraft';
import {
  appendCampaignSearchParams,
  calculatorPathForRoute,
  guardCalculatorRoute,
  parseEstimatePath,
  parseEstimateSlug,
  routeStateForSlug,
  routeStateForStep,
  type CalculatorRouteState
} from '@/lib/calculatorRoutes';
import {
  clearUnlockedEstimateSession,
  readUnlockedEstimateSession,
  writeUnlockedEstimateSession
} from '@/lib/unlockedEstimateSession';

const STEPS = [
  { id: 1, name: 'Quick Facts', shortName: 'Facts', icon: MapPin },
  { id: 2, name: 'Injury Map', shortName: 'Injury', icon: Stethoscope },
  { id: 3, name: 'Treatment', shortName: 'Care', icon: Activity },
  { id: 4, name: 'Work & Daily Life', shortName: 'Life', icon: Briefcase },
  { id: 5, name: 'Unlock', shortName: 'Unlock', icon: FileLock2 }
];

const STEP_TRANSITION_MS = 1500;

const STEP_TRANSITION_MESSAGES: Record<number, string> = {
  1: 'Updating accident signals',
  2: 'Reading injury selections',
  3: 'Estimating medical specials',
  4: 'Updating claim impact'
};

const CALCULATOR_RESET_EVENT = 'injury-calculator:request-reset';
const HISTORY_STATE_KEY = 'injuryCalculator';

interface StepTransitionState {
  active: boolean;
  direction: 'forward' | 'back';
  targetStep: number;
  message: string;
}

const STEP_TRANSITION_STAGES: Record<number, string[]> = {
  1: ['Checking inputs', 'Updating accident signals', 'Opening injury map'],
  2: ['Reading body map', 'Updating injury profile', 'Opening treatment'],
  3: ['Reviewing care counts', 'Estimating medical specials', 'Opening daily impact'],
  4: ['Updating claim impact', 'Preparing review', 'Opening unlock']
};

const BACK_STEP_TRANSITION_STAGES = ['Saving changes', 'Loading previous section'];

function getStepTransitionStages(transition: StepTransitionState) {
  if (transition.direction === 'back') return BACK_STEP_TRANSITION_STAGES;

  const sourceStep = Math.max(1, transition.targetStep - 1);
  return STEP_TRANSITION_STAGES[sourceStep] || [
    'Checking inputs',
    transition.message || 'Updating case profile',
    'Opening next section'
  ];
}

interface ProfileItem {
  label: string;
  complete: boolean;
}

function getBrowserStorage(): Storage | null {
  if (typeof window === 'undefined') return null;

  const storage = window.localStorage;
  if (
    !storage ||
    typeof storage.getItem !== 'function' ||
    typeof storage.setItem !== 'function' ||
    typeof storage.removeItem !== 'function'
  ) {
    return null;
  }

  return storage;
}

function createDefaultCalculatorData(): InjuryCalculatorData {
  return {
    demographics: {
      age: 0,
      dateOfBirth: '',
      occupation: '',
      annualIncome: ''
    },
    accidentDetails: {
      dateOfAccident: '',
      county: '',
      faultPercentage: 0,
      priorAccidents: 0,
      impactSeverity: ''
    },
    injuries: {
      bodyMap: [],
      guidedSignals: createDefaultGuidedInjurySignals(),
      primaryInjury: '',
      secondaryInjuries: [],
      preExistingConditions: [],
      fractures: [],
      tbi: false,
      spinalIssues: {
        herniation: false,
        nerveRootCompression: false,
        radiculopathy: false,
        myelopathy: false,
        preExistingDegeneration: false
      }
    },
    treatment: {
      ambulanceTransports: 0,
      emergencyRoomVisits: 0,
      urgentCareVisits: 0,
      hospitalAdmissionDays: 0,
      chiropracticSessions: 0,
      physicalTherapySessions: 0,
      occupationalTherapySessions: 0,
      xrays: 0,
      mris: 0,
      ctScans: 0,
      emgNerveStudies: 0,
      followUpDoctorVisits: 0,
      painManagementVisits: 0,
      orthopedicConsults: 0,
      neurologyConsults: 0,
      mentalHealthSessions: 0,
      tpiInjections: 0,
      facetInjections: 0,
      mbbInjections: 0,
      esiInjections: 0,
      rfaInjections: 0,
      prpInjections: 0,
      surgeryRecommended: false,
      surgeryCompleted: false,
      totalMedicalCosts: 0,
      useEstimatedCosts: true,
      ongoingTreatment: false
    },
    impact: {
      hasWageLoss: false,
      missedWorkDays: 0,
      lossOfConsortium: false,
      emotionalDistress: false,
      dylanVLeggClaim: false,
      permanentImpairment: false
    },
    insurance: {
      policyLimitsKnown: false,
      hasAttorney: false
    }
  };
}

function prepareCalculatorDataForEstimate(data: InjuryCalculatorData): InjuryCalculatorData {
  return applyWageLossDefaults({
    ...data,
    demographics: {
      ...data.demographics,
      age: calculatorAgeFromDemographics(data.demographics)
    },
    accidentDetails: {
      ...data.accidentDetails,
      priorAccidents: 0
    },
    impact: {
      ...data.impact,
      missedWorkDays: 0,
      impairmentRating: undefined
    },
    insurance: {
      ...data.insurance,
      policyLimitsKnown: false,
      policyLimits: undefined,
      attorneyContingency: undefined
    }
  });
}

function clampStep(step: unknown) {
  const numericStep = Number(step);
  if (!Number.isFinite(numericStep)) return 1;
  return Math.min(Math.max(Math.round(numericStep), 1), STEPS.length);
}

function hasMeaningfulCalculatorProgress(data: InjuryCalculatorData, bodyModel: BodyMapGender | '') {
  return Boolean(
    bodyModel ||
    data.demographics.dateOfBirth ||
    data.accidentDetails.county ||
    data.accidentDetails.dateOfAccident ||
    data.accidentDetails.impactSeverity ||
    Number(data.accidentDetails.faultPercentage || 0) > 0 ||
    data.injuries.bodyMap?.length ||
    hasTreatmentSignal(data) ||
    data.impact.hasWageLoss ||
    data.impact.emotionalDistress ||
    data.impact.lossOfConsortium ||
    data.impact.permanentImpairment ||
    data.insurance.hasAttorney
  );
}

function workLifeBooleanAnswersFromData(data: InjuryCalculatorData): WorkLifeBooleanAnswers {
  const answers: WorkLifeBooleanAnswers = {};

  if (data.impact?.hasWageLoss) answers.hasWageLoss = true;
  if (data.impact?.emotionalDistress) answers.emotionalDistress = true;
  if (data.impact?.lossOfConsortium) answers.lossOfConsortium = true;
  if (data.impact?.permanentImpairment) answers.permanentImpairment = true;
  if (data.insurance?.hasAttorney) answers.hasAttorney = true;

  return answers;
}

function readCalculatorDraft(): CalculatorDraft | null {
  const storage = getBrowserStorage();
  if (!storage) {
    setCalculatorDraftDocumentStatus(CALCULATOR_DRAFT_NONE);
    return null;
  }

  try {
    const storedDraft = storage.getItem(CALCULATOR_DRAFT_STORAGE_KEY);
    if (!storedDraft) {
      setCalculatorDraftDocumentStatus(CALCULATOR_DRAFT_NONE);
      return null;
    }

    const parsedDraft = JSON.parse(storedDraft);
    const normalizedDraft = normalizeCalculatorDraft(parsedDraft, clampStep);
    if (!normalizedDraft) {
      storage.removeItem(CALCULATOR_DRAFT_STORAGE_KEY);
      setCalculatorDraftDocumentStatus(CALCULATOR_DRAFT_NONE);
      return null;
    }

    setCalculatorDraftDocumentStatus(CALCULATOR_DRAFT_PRESENT);
    return normalizedDraft;
  } catch {
    try {
      storage.removeItem(CALCULATOR_DRAFT_STORAGE_KEY);
    } catch {
      // Storage may be unavailable in private or restricted browser contexts.
    }
    setCalculatorDraftDocumentStatus(CALCULATOR_DRAFT_NONE);
    return null;
  }
}

function writeCalculatorDraft(draft: CalculatorDraft) {
  const storage = getBrowserStorage();
  if (!storage) {
    setCalculatorDraftDocumentStatus(CALCULATOR_DRAFT_NONE);
    return;
  }

  try {
    storage.setItem(CALCULATOR_DRAFT_STORAGE_KEY, JSON.stringify(draft));
    setCalculatorDraftDocumentStatus(CALCULATOR_DRAFT_PRESENT);
  } catch {
    // Storage may be unavailable in private or restricted browser contexts.
    setCalculatorDraftDocumentStatus(CALCULATOR_DRAFT_NONE);
  }
}

function clearCalculatorDraft() {
  const storage = getBrowserStorage();
  if (!storage) {
    setCalculatorDraftDocumentStatus(CALCULATOR_DRAFT_NONE);
    return;
  }

  try {
    storage.removeItem(CALCULATOR_DRAFT_STORAGE_KEY);
  } catch {
    // Storage may be unavailable in private or restricted browser contexts.
  }
  setCalculatorDraftDocumentStatus(CALCULATOR_DRAFT_NONE);
}

function writeCalculatorHistoryState(method: 'pushState' | 'replaceState', state: unknown, url?: string) {
  if (typeof window === 'undefined') return;

  const historyMethod = Object.getPrototypeOf(window.history)?.[method] as
    | ((data: unknown, unused: string, url?: string) => void)
    | undefined;

  if (typeof historyMethod === 'function') {
    historyMethod.call(window.history, state, '', url);
    return;
  }

  window.history[method](state, '', url);
}

function calculatorHistoryState(route: CalculatorRouteState) {
  if (route.kind === 'step') {
    return {
      [HISTORY_STATE_KEY]: {
        view: 'step',
        step: route.step,
        slug: route.slug
      }
    };
  }

  return {
    [HISTORY_STATE_KEY]: {
      view: route.kind,
      slug: route.slug
    }
  };
}

function calculatorRoutesMatch(left: CalculatorRouteState, right: CalculatorRouteState) {
  if (left.kind !== right.kind) return false;
  if (left.kind === 'step' && right.kind === 'step') return left.step === right.step;
  return left.slug === right.slug;
}

function routeUrlWithCurrentCampaignParams(route: CalculatorRouteState) {
  if (typeof window === 'undefined') return calculatorPathForRoute(route);
  return appendCampaignSearchParams(calculatorPathForRoute(route), window.location.search);
}

function hasTreatmentSignal(data: InjuryCalculatorData) {
  const treatment = data.treatment;
  return Boolean(
    treatment.ambulanceTransports ||
    treatment.emergencyRoomVisits ||
    treatment.urgentCareVisits ||
    treatment.hospitalAdmissionDays ||
    treatment.chiropracticSessions ||
    treatment.physicalTherapySessions ||
    treatment.occupationalTherapySessions ||
    treatment.xrays ||
    treatment.mris ||
    treatment.ctScans ||
    treatment.emgNerveStudies ||
    treatment.followUpDoctorVisits ||
    treatment.painManagementVisits ||
    treatment.orthopedicConsults ||
    treatment.neurologyConsults ||
    treatment.mentalHealthSessions ||
    treatment.tpiInjections ||
    treatment.facetInjections ||
    treatment.mbbInjections ||
    treatment.esiInjections ||
    treatment.rfaInjections ||
    treatment.prpInjections ||
    treatment.surgeryRecommended ||
    treatment.surgeryCompleted ||
    treatment.ongoingTreatment
  );
}

function buildProfileItems(data: InjuryCalculatorData, currentStep = 1): ProfileItem[] {
  return [
    {
      label: 'Quick Facts',
      complete: currentStep > 1 || Boolean(data.accidentDetails.dateOfAccident && data.accidentDetails.impactSeverity)
    },
    {
      label: 'Injury Map',
      complete: currentStep > 2 || Boolean(data.injuries.primaryInjury || data.injuries.bodyMap?.length)
    },
    {
      label: 'Treatment',
      complete: currentStep > 3 || hasTreatmentSignal(data)
    },
    {
      label: 'Work & Daily Life',
      complete: currentStep > 4 || Boolean(data.demographics.dateOfBirth)
    },
    {
      label: 'Unlock Details',
      complete: Boolean(
        dateOfBirthIsInAllowedRange(data.demographics.dateOfBirth) &&
        data.accidentDetails.county
      )
    }
  ];
}

function profileState(completedCount: number) {
  if (completedCount >= 5) return { label: 'Ready', helper: 'Your range can be prepared.', color: 'text-emerald-700' };
  if (completedCount >= 3) return { label: 'Useful', helper: 'A few steps can sharpen the range.', color: 'text-sky-700' };
  return { label: 'Started', helper: 'Add quick facts to build momentum.', color: 'text-amber-700' };
}

function ProfileStrengthCard({ data, currentStep }: {
  data: InjuryCalculatorData;
  currentStep: number;
}) {
  const shouldReduceMotion = Boolean(useReducedMotion());
  const items = buildProfileItems(data, currentStep);
  const completedCount = items.filter((item) => item.complete).length;
  const strength = profileState(completedCount);
  const progressValue = Math.round((completedCount / items.length) * 100);
  const missingCount = items.filter((item) => !item.complete).length;

  return (
    <motion.div
      layout
      initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={shouldReduceMotion ? { duration: 0.08 } : { duration: 0.3, ease: premiumEase }}
    >
      <Card size="sm">
        <CardHeader>
          <CardTitle className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Case profile strength</CardTitle>
          <motion.p
            key={strength.label}
            className={`text-2xl font-semibold ${strength.color}`}
            initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={shouldReduceMotion ? { duration: 0.08 } : { duration: 0.22, ease: premiumEase }}
          >
            {strength.label}
          </motion.p>
        </CardHeader>

        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Progress value={progressValue} />
            <p className="text-sm text-muted-foreground">
              {missingCount > 0 ? `${missingCount} checklist item${missingCount === 1 ? '' : 's'} left.` : strength.helper}
            </p>
          </div>

          <motion.div
            className="flex flex-col gap-2"
            variants={staggerContainer}
            initial={shouldReduceMotion ? false : 'hidden'}
            animate="visible"
          >
            {items.map((item) => (
              <motion.div
                key={item.label}
                layout
                variants={fadeUpItem}
                className="flex items-start gap-2 rounded-lg bg-slate-50 px-3 py-2"
              >
                <motion.span
                  layout
                  className={`mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded-full ${
                    item.complete ? 'bg-emerald-600 text-white' : 'bg-white text-slate-400 ring-1 ring-slate-200'
                  }`}
                  animate={shouldReduceMotion ? undefined : { scale: item.complete ? [1, 1.12, 1] : 1 }}
                  transition={{ duration: 0.28, ease: premiumEase }}
                >
                  <AnimatePresence initial={false}>
                    {item.complete && (
                      <motion.span
                        key="check"
                        initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, scale: 0.65 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.65 }}
                        transition={shouldReduceMotion ? { duration: 0.08 } : softSpring}
                      >
                        <Check className="h-3.5 w-3.5" />
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.span>
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-slate-800">{item.label}</span>
                  <span className="block text-xs text-slate-500">{item.complete ? 'Complete' : 'Pending'}</span>
                </span>
              </motion.div>
            ))}
          </motion.div>

          <div className="rounded-lg border bg-muted/40 p-3 text-xs leading-5 text-muted-foreground">
            Step {currentStep} of {STEPS.length}: {STEPS[currentStep - 1].name}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function unlockStatusMessage(status: string) {
  switch (status) {
    case 'too_fast_no_delivery':
      return 'Estimate-only unlock is available for this session.';
    case 'own_attorney_no_delivery':
      return 'Estimate-only unlock is available because you indicated you already have or plan to hire an attorney.';
    case 'unmapped_no_attorney_delivery':
    case 'preview_no_attorney':
      return 'Estimate-only unlock is available because no named law firm or attorney sponsor is currently configured for this county.';
    case 'outside_california_no_delivery':
      return 'Estimate-only unlock is available for this session.';
    case 'outside_us_no_delivery':
      return 'Estimate-only unlock is available for this session.';
    case 'unknown_location_no_delivery':
      return 'Estimate-only unlock is available for this session.';
    default:
      return 'Estimate-only unlock is available.';
  }
}

async function parseApiResponse<T>(response: Response, fallbackMessage: string): Promise<T> {
  const rawText = await response.text();
  let payload: (T & { error?: string }) | null = null;

  if (rawText) {
    try {
      payload = JSON.parse(rawText) as T & { error?: string };
    } catch {
      payload = null;
    }
  }

  if (!response.ok) {
    const plainTextError = rawText.trim();
    const safePlainTextError = plainTextError &&
      !plainTextError.startsWith('<') &&
      !/^internal server error$/i.test(plainTextError)
      ? plainTextError.slice(0, 180)
      : '';
    const message = payload?.error ||
      safePlainTextError ||
      fallbackMessage;

    throw new Error(message);
  }

  if (!payload) {
    throw new Error(fallbackMessage);
  }

  return payload;
}

async function requestEstimateOnlyUnlock(sessionId: string): Promise<EstimateOnlyUnlockResponse> {
  const response = await fetch('/api/estimate/unlock/estimate-only', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId })
  });
  return parseApiResponse<EstimateOnlyUnlockResponse>(response, 'Unable to unlock the estimate.');
}

async function requestUnlockedEstimateRestore(sessionId: string): Promise<RestoreUnlockedEstimateResponse> {
  const response = await fetch('/api/estimate/unlock/restore', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId })
  });
  return parseApiResponse<RestoreUnlockedEstimateResponse>(
    response,
    'Unable to restore the unlocked estimate.'
  );
}

function LockedRangePreview({ preview }: { preview: EstimatePreviewResponse | null }) {
  const shouldReduceMotion = Boolean(useReducedMotion());

  return (
    <motion.div
      layout
      initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={shouldReduceMotion ? { duration: 0.08 } : { duration: 0.3, ease: premiumEase }}
    >
      <Card className="border-emerald-200 bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Lock data-icon="inline-start" className="text-emerald-700" />
            Your range is ready
          </CardTitle>
          <CardDescription>
            {preview ? preview.summary : 'Prepare the secure preview to unlock your estimated range.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="rounded-lg border bg-slate-50 p-3">
            <div className="flex flex-col gap-2">
              <div
                className="h-3 rounded-full bg-gradient-to-r from-emerald-500 via-amber-400 to-red-500 shadow-inner"
                aria-hidden="true"
              />
              <div className="flex items-center justify-between gap-3 text-xs font-medium text-muted-foreground">
                <span>Likely</span>
                <span>Potential</span>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3">
              {['Likely', 'Potential'].map((label, index) => (
                <motion.div
                  key={label}
                  className="rounded-lg border bg-white p-3"
                  initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={shouldReduceMotion ? { duration: 0.08 } : { duration: 0.28, delay: index * 0.06, ease: premiumEase }}
                >
                  <p className="text-xs font-medium text-muted-foreground">{label}</p>
                  <p className="mt-1 select-none text-xl font-semibold tracking-tight text-slate-950 blur-sm" aria-hidden="true">
                    $••,•••
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

const DOB_MONTHS = [
  { value: '01', label: 'January' },
  { value: '02', label: 'February' },
  { value: '03', label: 'March' },
  { value: '04', label: 'April' },
  { value: '05', label: 'May' },
  { value: '06', label: 'June' },
  { value: '07', label: 'July' },
  { value: '08', label: 'August' },
  { value: '09', label: 'September' },
  { value: '10', label: 'October' },
  { value: '11', label: 'November' },
  { value: '12', label: 'December' }
];

function padDatePart(value: string | number) {
  return String(value).padStart(2, '0');
}

function datePartsFromDateOfBirth(value: string | undefined) {
  const parsed = parseDateOnly(value);

  return {
    month: parsed ? padDatePart(parsed.month) : '',
    day: parsed ? padDatePart(parsed.day) : '',
    year: parsed ? String(parsed.year) : ''
  };
}

function DateOfBirthAgeCheck({
  value,
  register,
  setValue,
  error
}: {
  value: string | undefined;
  register: UseFormRegister<InjuryCalculatorData>;
  setValue: UseFormSetValue<InjuryCalculatorData>;
  error?: string;
}) {
  const [parts, setParts] = useState(() => datePartsFromDateOfBirth(value));
  const parsedMinimumDate = parseDateOnly(dateInputValueForAge(100));
  const parsedMaximumDate = parseDateOnly(dateInputValueForAge(18));
  const minimumYear = parsedMinimumDate?.year || new Date().getFullYear() - 100;
  const maximumYear = parsedMaximumDate?.year || new Date().getFullYear() - 18;
  const yearOptions = useMemo(() => {
    const years: string[] = [];
    for (let year = maximumYear; year >= minimumYear; year -= 1) {
      years.push(String(year));
    }
    return years;
  }, [maximumYear, minimumYear]);
  const selectedMonth = Number(parts.month || 0);
  const selectedYear = Number(parts.year || maximumYear);
  const daysInSelectedMonth = selectedMonth
    ? new Date(selectedYear, selectedMonth, 0).getDate()
    : 31;
  const dayOptions = useMemo(() => (
    Array.from({ length: daysInSelectedMonth }, (_, index) => padDatePart(index + 1))
  ), [daysInSelectedMonth]);

  useEffect(() => {
    const parsed = parseDateOnly(value);
    if (!parsed) return;

    const nextParts = datePartsFromDateOfBirth(value);
    setParts((currentParts) => (
      currentParts.month === nextParts.month &&
      currentParts.day === nextParts.day &&
      currentParts.year === nextParts.year
        ? currentParts
        : nextParts
    ));
  }, [value]);

  const updatePart = (part: 'month' | 'day' | 'year', nextValue: string) => {
    const nextParts = { ...parts, [part]: nextValue };
    const nextMonth = Number(nextParts.month || 0);
    const nextYear = Number(nextParts.year || maximumYear);
    const nextDaysInMonth = nextMonth ? new Date(nextYear, nextMonth, 0).getDate() : 31;

    if (Number(nextParts.day || 0) > nextDaysInMonth) {
      nextParts.day = '';
    }

    setParts(nextParts);

    if (nextParts.month && nextParts.day && nextParts.year) {
      setValue('demographics.dateOfBirth', `${nextParts.year}-${nextParts.month}-${nextParts.day}`, {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: true
      });
    } else if (value) {
      setValue('demographics.dateOfBirth', '', {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: Boolean(error)
      });
    }
  };

  return (
    <Card className="border-sky-200 bg-sky-50/70 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <CalendarDays data-icon="inline-start" className="text-sky-700" />
          Date of Birth <span className="text-amber-600">*</span>
        </CardTitle>
        <CardDescription>
          Confirm you are 18 or older before unlocking the estimate. Age is used only for age-related settlement assumptions.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <FieldGroup>
          <Field data-invalid={Boolean(error)}>
            <input
              type="hidden"
              {...register('demographics.dateOfBirth', {
                required: 'Date of Birth is required',
                validate: (dateOfBirth) => (
                  dateOfBirthIsInAllowedRange(dateOfBirth) ||
                  'Enter a Date of Birth for someone age 18 to 100'
                )
              })}
            />
            <div className="grid gap-3 sm:grid-cols-[1.2fr_0.8fr_0.9fr]">
              <Field>
                <FieldLabel htmlFor="date-of-birth-month">Month</FieldLabel>
                <NativeSelect
                  id="date-of-birth-month"
                  value={parts.month}
                  onChange={(event) => updatePart('month', event.target.value)}
                  aria-invalid={Boolean(error)}
                  className="w-full [&_[data-slot=native-select]]:h-11 [&_[data-slot=native-select]]:text-base"
                >
                  <option value="">Month</option>
                  {DOB_MONTHS.map((month) => (
                    <option key={month.value} value={month.value}>{month.label}</option>
                  ))}
                </NativeSelect>
              </Field>
              <Field>
                <FieldLabel htmlFor="date-of-birth-day">Day</FieldLabel>
                <NativeSelect
                  id="date-of-birth-day"
                  value={parts.day}
                  onChange={(event) => updatePart('day', event.target.value)}
                  aria-invalid={Boolean(error)}
                  className="w-full [&_[data-slot=native-select]]:h-11 [&_[data-slot=native-select]]:text-base"
                >
                  <option value="">Day</option>
                  {dayOptions.map((day) => (
                    <option key={day} value={day}>{Number(day)}</option>
                  ))}
                </NativeSelect>
              </Field>
              <Field>
                <FieldLabel htmlFor="date-of-birth-year">Year</FieldLabel>
                <NativeSelect
                  id="date-of-birth-year"
                  value={parts.year}
                  onChange={(event) => updatePart('year', event.target.value)}
                  aria-invalid={Boolean(error)}
                  className="w-full [&_[data-slot=native-select]]:h-11 [&_[data-slot=native-select]]:text-base"
                >
                  <option value="">Year</option>
                  {yearOptions.map((year) => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </NativeSelect>
              </Field>
            </div>
            <FieldDescription>
              Use the standard month, day, and year picker. The exact date is not displayed in the checklist.
            </FieldDescription>
            <FieldError>{error}</FieldError>
          </Field>
        </FieldGroup>
      </CardContent>
    </Card>
  );
}

function UnlockActionPanel({
  preview,
  onUnlocked,
  onResetPreview
}: {
  preview: EstimatePreviewResponse | null;
  onUnlocked: (
    sessionId: string,
    results: SettlementResult,
    attorney: ResponsibleAttorney | null,
    leadDeliveryStatus: string
  ) => void;
  onResetPreview: () => void;
}) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [consent, setConsent] = useState(false);
  const [otpSent, setOtpSent] = useState<UnlockStartResponse | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isUnlockingEstimateOnly, setIsUnlockingEstimateOnly] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const shouldReduceMotion = Boolean(useReducedMotion());
  const panelMotion = reducedMotionFade(shouldReduceMotion);
  const otpLength = otpSent?.otpLength || 6;
  const contactReady = Boolean(
    firstName.trim() &&
    lastName.trim() &&
    email.trim() &&
    phone.trim() &&
    consent
  );

  useEffect(() => {
    setFirstName('');
    setLastName('');
    setEmail('');
    setPhone('');
    setCode('');
    setConsent(false);
    setOtpSent(null);
    setError(null);
  }, [preview?.sessionId]);

  const unlockEstimateOnly = async () => {
    if (!preview) return;

    setError(null);
    setIsUnlockingEstimateOnly(true);

    try {
      const payload = await requestEstimateOnlyUnlock(preview.sessionId);
      onUnlocked(preview.sessionId, payload.results, payload.responsibleAttorney, payload.leadDeliveryStatus);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to unlock the estimate.');
    } finally {
      setIsUnlockingEstimateOnly(false);
    }
  };

  const startUnlock = async () => {
    if (!preview) return;

    setError(null);
    setIsSending(true);

    try {
      const response = await fetch('/api/estimate/unlock/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: preview.sessionId,
          firstName,
          lastName,
          email,
          phone,
          consentToAttorneyShare: consent,
          phoneContactConsent: consent
        })
      });
      const payload = await parseApiResponse<UnlockStartResponse>(
        response,
        'Unable to send verification code.'
      );

      if (payload.provider === 'skipped_duplicate_no_charge' || payload.otpLength === 0) {
        const unlocked = await requestEstimateOnlyUnlock(preview.sessionId);
        onUnlocked(preview.sessionId, unlocked.results, unlocked.responsibleAttorney, unlocked.leadDeliveryStatus);
        return;
      }

      setOtpSent(payload);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to send verification code.');
    } finally {
      setIsSending(false);
    }
  };

  const verifyCode = async () => {
    if (!preview) return;

    setError(null);
    setIsVerifying(true);

    try {
      const response = await fetch('/api/estimate/unlock/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: preview.sessionId,
          code
        })
      });
      const payload = await parseApiResponse<UnlockVerifyResponse>(
        response,
        'Unable to verify code.'
      );

      onUnlocked(preview.sessionId, payload.results, payload.responsibleAttorney, payload.leadDeliveryStatus);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to verify code.');
    } finally {
      setIsVerifying(false);
    }
  };

  if (!preview) {
    return null;
  }

  if (preview.unlockMode === 'estimate_only') {
    return (
      <motion.div {...panelMotion}>
        <Card className="border-slate-200 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ShieldCheck data-icon="inline-start" className="text-emerald-700" />
              Unlock estimate
            </CardTitle>
            <CardDescription>{unlockStatusMessage(preview.leadDeliveryStatus)}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <Alert>
              <AlertDescription>
                No phone number is needed for this estimate-only unlock.
              </AlertDescription>
            </Alert>

            <AnimatePresence initial={false}>
              {error && (
                <motion.div key="estimate-only-error" {...reducedMotionFade(shouldReduceMotion)}>
                  <Alert variant="destructive">
                    <AlertCircle data-icon="inline-start" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                type="button"
                size="lg"
                className="h-11 bg-emerald-700 text-white hover:bg-emerald-600"
                onClick={unlockEstimateOnly}
                disabled={isUnlockingEstimateOnly}
              >
                {isUnlockingEstimateOnly ? (
                  'Unlocking...'
                ) : (
                  <>
                    Unlock
                    <ArrowRight data-icon="inline-end" />
                  </>
                )}
              </Button>
              <Button type="button" size="lg" variant="outline" className="h-11" onClick={onResetPreview}>
                Edit answers
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  const attorney = preview.responsibleAttorney;

  return (
    <motion.div {...panelMotion}>
    <Card className="border-slate-200 bg-white shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <MessageSquare data-icon="inline-start" className="text-sky-700" />
          Contact verification
        </CardTitle>
        <CardDescription>
          Verify your phone to unlock the range and, only if you consent, send the inquiry to the named law firm or attorney shown below.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        {attorney && (
          <Card className="border-amber-200 bg-amber-50 shadow-none">
            <CardHeader>
              <CardTitle className="text-sm">Named sponsor disclosure</CardTitle>
              <CardDescription>{attorney.disclosure}</CardDescription>
            </CardHeader>
            <CardContent>
              <Field orientation="horizontal">
                <Checkbox
                  id="attorney-consent"
                  checked={consent}
                  onCheckedChange={(checked) => setConsent(checked === true)}
                />
                <FieldContent>
                  <FieldLabel htmlFor="attorney-consent">
                    I choose to send my results and contact information to {attorney.name}
                  </FieldLabel>
                  <FieldDescription>
                    I give permission to send my calculator results, name, email, and phone number to {attorney.name}, State Bar No. {attorney.barNumber}. I also agree that {attorney.name} or the responsible law firm may call, text, or email me about this auto injury inquiry, including by automated technology. Consent is not required to view my estimate, this does not create an attorney-client relationship, and the firm may decline representation.
                  </FieldDescription>
                </FieldContent>
              </Field>
            </CardContent>
          </Card>
        )}

        <FieldGroup>
          <div className="grid gap-3 md:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="unlock-first-name">
                <User data-icon="inline-start" />
                First name
              </FieldLabel>
              <Input
                id="unlock-first-name"
                value={firstName}
                onChange={(event) => setFirstName(event.target.value)}
                autoComplete="given-name"
                placeholder="First name"
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="unlock-last-name">
                <User data-icon="inline-start" />
                Last name
              </FieldLabel>
              <Input
                id="unlock-last-name"
                value={lastName}
                onChange={(event) => setLastName(event.target.value)}
                autoComplete="family-name"
                placeholder="Last name"
              />
            </Field>
          </div>

          <Field>
            <FieldLabel htmlFor="unlock-email">
              <Mail data-icon="inline-start" />
              Email
            </FieldLabel>
            <Input
              id="unlock-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              placeholder="you@example.com"
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="unlock-phone">
              <Phone data-icon="inline-start" />
              Mobile phone
            </FieldLabel>
            <div className="grid gap-3 md:grid-cols-[1fr_auto]">
              <Input
                id="unlock-phone"
                type="tel"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                autoComplete="tel"
                placeholder="(555) 555-5555"
              />
              <Button
                type="button"
                onClick={startUnlock}
                disabled={isSending || !contactReady}
                className="h-10 bg-emerald-700 text-white hover:bg-emerald-600"
              >
                {isSending ? 'Sending...' : 'Send code'}
              </Button>
            </div>
            <FieldDescription>
              We use this number for a one-time SMS verification code and, only with your consent, follow-up by the named law firm or attorney shown above. Your name and email are sent only with this attorney inquiry. Message and data rates may apply. See the <a href="/terms" className="font-medium text-sky-700 underline">Terms</a> and <a href="/privacy" className="font-medium text-sky-700 underline">Privacy Policy</a>.
            </FieldDescription>
          </Field>

          <AnimatePresence initial={false}>
            {otpSent && (
              <motion.div key="otp-field" {...reducedMotionFade(shouldReduceMotion)} layout>
                <Field>
                  <FieldLabel>
                    <KeyRound data-icon="inline-start" />
                    6-digit code
                  </FieldLabel>
                  <FieldDescription>
                    Code sent to {otpSent.maskedPhone}.
                    {otpSent.duplicateWithin30Days && ' This phone was already used for a recent sponsored-contact request, so this session is estimate-only.'}
                    {otpSent.devCode && ` Development code: ${otpSent.devCode}.`}
                  </FieldDescription>
                  <div className="grid gap-3 md:grid-cols-[1fr_auto]">
                    <InputOTP maxLength={otpLength} value={code} onChange={setCode}>
                      <InputOTPGroup>
                        <InputOTPSlot index={0} />
                        <InputOTPSlot index={1} />
                        <InputOTPSlot index={2} />
                        <InputOTPSlot index={3} />
                        <InputOTPSlot index={4} />
                        <InputOTPSlot index={5} />
                      </InputOTPGroup>
                    </InputOTP>
                    <Button
                      type="button"
                      onClick={verifyCode}
                      disabled={isVerifying || code.length !== otpLength}
                      className="h-10 bg-sky-700 text-white hover:bg-sky-600"
                    >
                      {isVerifying ? 'Verifying...' : 'Unlock estimate'}
                    </Button>
                  </div>
                </Field>
              </motion.div>
            )}
          </AnimatePresence>
        </FieldGroup>

        <AnimatePresence initial={false}>
          {error && (
            <motion.div key="phone-error" {...reducedMotionFade(shouldReduceMotion)}>
              <Alert variant="destructive">
                <AlertCircle data-icon="inline-start" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Button type="button" size="lg" variant="outline" className="h-11" onClick={onResetPreview}>
            Edit answers
          </Button>
        </div>
      </CardContent>
    </Card>
    </motion.div>
  );
}

function ReviewUnlockStep({ data, register, setValue, errors, preview, onUnlocked, onResetPreview }: {
  data: InjuryCalculatorData;
  register: UseFormRegister<InjuryCalculatorData>;
  setValue: UseFormSetValue<InjuryCalculatorData>;
  errors: FieldErrors<InjuryCalculatorData>;
  preview: EstimatePreviewResponse | null;
  onUnlocked: (
    sessionId: string,
    results: SettlementResult,
    attorney: ResponsibleAttorney | null,
    leadDeliveryStatus: string
  ) => void;
  onResetPreview: () => void;
}) {
  const shouldReduceMotion = Boolean(useReducedMotion());
  const items = buildProfileItems(data, STEPS.length);
  const completedCount = items.filter((item) => item.complete).length;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Badge variant="secondary" className="w-fit">Unlock</Badge>
        <h2 className="text-2xl font-semibold tracking-tight text-slate-950">Unlock</h2>
        <p className="max-w-2xl text-sm leading-6 text-slate-600">
          Confirm Date of Birth and accident county, then unlock the educational range.
        </p>
      </div>

      {!preview && (
        <div className="grid gap-4 lg:grid-cols-2">
          <DateOfBirthAgeCheck
            value={data.demographics.dateOfBirth}
            register={register}
            setValue={setValue}
            error={errors.demographics?.dateOfBirth?.message}
          />

          <Card className="border-slate-200 bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <MapPin data-icon="inline-start" className="text-sky-700" />
                Accident county <span className="text-amber-600">*</span>
                <InfoIcon content="County is used for California-specific venue context and estimate assumptions. It applies only a small estimate adjustment." />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CountyCombobox
                id="review-accident-county"
                value={data.accidentDetails.county}
                error={errors.accidentDetails?.county?.message}
                onValueChange={(county) => setValue('accidentDetails.county', county, {
                  shouldDirty: true,
                  shouldTouch: true,
                  shouldValidate: true
                })}
              />
              <input
                type="hidden"
                {...register('accidentDetails.county', { required: 'Choose a county from the list' })}
              />
              {errors.accidentDetails?.county && (
                <p className="mt-2 text-sm text-red-600">{errors.accidentDetails.county.message}</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[0.85fr_1.15fr]">
        <Card className="border-slate-200 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ClipboardCheck data-icon="inline-start" className="text-emerald-700" />
              Completion checklist
            </CardTitle>
            <CardDescription>{completedCount} of {items.length} steps complete</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <motion.div
              className="flex flex-col gap-2"
              variants={staggerContainer}
              initial={shouldReduceMotion ? false : 'hidden'}
              animate="visible"
            >
            {items.map((item) => (
              <motion.div
                key={item.label}
                layout
                variants={fadeUpItem}
                className="flex items-center gap-3 rounded-lg border bg-slate-50 px-3 py-3"
              >
                <motion.span
                  layout
                  className={cn(
                  'flex size-6 flex-none items-center justify-center rounded-full ring-1',
                  item.complete
                    ? 'bg-emerald-700 text-white ring-emerald-700'
                    : 'bg-white text-slate-400 ring-slate-200'
                  )}
                  animate={shouldReduceMotion ? undefined : { scale: item.complete ? [1, 1.14, 1] : 1 }}
                  transition={{ duration: 0.3, ease: premiumEase }}
                >
                  <AnimatePresence initial={false}>
                    {item.complete ? (
                      <motion.span
                        key="complete"
                        initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, scale: 0.7 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.7 }}
                        transition={shouldReduceMotion ? { duration: 0.08 } : softSpring}
                      >
                        <Check className="size-4" aria-hidden="true" />
                      </motion.span>
                    ) : null}
                  </AnimatePresence>
                </motion.span>
                <span className="min-w-0 flex-1 text-sm font-medium text-slate-800">{item.label}</span>
                <Badge variant={item.complete ? 'secondary' : 'outline'}>
                  {item.complete ? 'Complete' : 'Pending'}
                </Badge>
              </motion.div>
            ))}
            </motion.div>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-4">
          <LockedRangePreview preview={preview} />
          <UnlockActionPanel preview={preview} onUnlocked={onUnlocked} onResetPreview={onResetPreview} />
        </div>
      </div>

    </div>
  );
}

function StepTransitionOverlay({ transition }: { transition: StepTransitionState }) {
  const reducedMotion = useReducedMotion();
  const shouldReduceMotion = Boolean(reducedMotion);
  const [progressValue, setProgressValue] = useState(0);
  const stages = useMemo(() => getStepTransitionStages(transition), [
    transition.direction,
    transition.message,
    transition.targetStep
  ]);

  useEffect(() => {
    if (!transition.active) return;

    if (shouldReduceMotion) {
      setProgressValue(86);
      return;
    }

    const startValue = transition.direction === 'forward' ? 8 : 18;
    const endValue = transition.direction === 'forward' ? 96 : 84;
    setProgressValue(startValue);

    const progressFrame = window.requestAnimationFrame(() => {
      setProgressValue(endValue);
    });

    return () => window.cancelAnimationFrame(progressFrame);
  }, [shouldReduceMotion, transition.active, transition.direction, transition.targetStep]);

  return (
    <AnimatePresence>
      {transition.active && (
        <motion.div
          aria-live="polite"
          role="status"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/30 px-5 backdrop-blur-sm"
          data-step-transition-overlay
          initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: shouldReduceMotion ? 0.08 : 0.18, ease: 'easeOut' }}
        >
          <motion.div
            className="w-full max-w-sm"
            initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 18, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.98 }}
            transition={{
              duration: shouldReduceMotion ? 0.08 : 0.28,
              ease: [0.22, 1, 0.36, 1]
            }}
          >
            <Card className="overflow-hidden rounded-xl border-slate-200/80 bg-white/95 shadow-2xl">
              <CardContent className="flex flex-col gap-4 p-4">
                <div className="flex items-center gap-3">
                  <span className="relative flex size-12 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
                    {!shouldReduceMotion && (
                      <>
                        <motion.span
                          className="absolute inset-0 rounded-full border border-emerald-300/70"
                          animate={{ scale: [0.82, 1.55], opacity: [0.58, 0] }}
                          transition={{ duration: 1, repeat: Infinity, ease: 'easeOut' }}
                          aria-hidden="true"
                        />
                        <motion.span
                          className="absolute inset-1 rounded-full bg-[conic-gradient(from_0deg,transparent_0deg,rgba(16,185,129,0.32)_72deg,transparent_140deg)]"
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1.15, repeat: Infinity, ease: 'linear' }}
                          aria-hidden="true"
                        />
                      </>
                    )}
                    <span className="relative flex size-9 items-center justify-center rounded-full bg-white text-emerald-700 shadow-sm ring-1 ring-emerald-200">
                      <Activity className="size-5" aria-hidden="true" />
                    </span>
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-950">{transition.message}</p>
                    <p className="text-xs text-muted-foreground">One moment while we update this section.</p>
                  </div>
                </div>

                <Progress
                  value={progressValue}
                  aria-label="Section transition progress"
                  className="h-1.5 bg-emerald-950/10"
                  indicatorClassName={cn(
                    'bg-emerald-600',
                    shouldReduceMotion ? 'duration-150' : 'duration-1000 ease-out'
                  )}
                />

                <div className="grid gap-2">
                  {stages.map((stage, index) => (
                    <motion.div
                      key={`${stage}-${index}`}
                      className="flex items-center gap-2 rounded-lg bg-slate-50 px-2.5 py-2 ring-1 ring-slate-200/70"
                      initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        duration: shouldReduceMotion ? 0 : 0.24,
                        delay: shouldReduceMotion ? 0 : 0.12 + index * 0.12,
                        ease: 'easeOut'
                      }}
                    >
                      <motion.span
                        className={cn(
                          'size-1.5 shrink-0 rounded-full',
                          index === stages.length - 1 ? 'bg-sky-500' : 'bg-emerald-600'
                        )}
                        animate={
                          shouldReduceMotion
                            ? { opacity: 1 }
                            : { opacity: [0.45, 1, 0.45], scale: [1, 1.28, 1] }
                        }
                        transition={{
                          duration: 0.9,
                          repeat: shouldReduceMotion ? 0 : Infinity,
                          delay: index * 0.1
                        }}
                        aria-hidden="true"
                      />
                      <span className="text-xs font-medium text-slate-700">{stage}</span>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function StartCalculatorScreen({
  onResume,
  onStart,
  onStartOver
}: {
  onResume: () => void;
  onStart: () => void;
  onStartOver: () => void;
}) {
  const trustPoints = [
    'California-specific claim factors',
    'Real-world claim insight, not generic guesswork',
    'Free to use. No gimmicks. No charge.',
    'No AI used to derive claim value',
    'Educational estimate, not legal or professional advice',
    'Treatment-based medical estimate, not raw bill entry'
  ];
  const shouldReduceMotion = Boolean(useReducedMotion());

  return (
    <motion.section
      aria-labelledby="calculator-start-heading"
      className="mx-auto max-w-6xl overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(22rem,28rem)]"
      variants={staggerContainer}
      initial={false}
      animate="visible"
    >
      <motion.div className="aspect-[16/17] w-full overflow-hidden bg-slate-100 lg:hidden" variants={fadeUpItem}>
        <img
          src="/marketing/settlement-hero.webp"
          alt="California auto accident claimant reviewing an estimate on a phone near a parked car"
          width={1080}
          height={1920}
          fetchPriority="high"
          decoding="async"
          className="h-full w-full object-cover object-[center_30%]"
        />
      </motion.div>

      <div className="p-6 sm:p-8 lg:flex lg:min-h-[560px] lg:flex-col lg:justify-center lg:p-10 xl:min-h-[620px] xl:p-12">
        <motion.h1
          id="calculator-start-heading"
          className="max-w-3xl text-3xl font-semibold leading-[1.05] tracking-tight text-slate-950 sm:text-5xl lg:max-w-2xl"
          variants={fadeUpItem}
        >
          Estimate Your California Auto Injury Claim
        </motion.h1>
        <motion.p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg" variants={fadeUpItem}>
          Answer a few guided questions to prepare an educational settlement range.
        </motion.p>

        <motion.div className="calculator-draft-resume mt-7 rounded-lg border border-emerald-200 bg-emerald-50 p-4" variants={fadeUpItem}>
          <p className="text-sm font-semibold text-slate-950">You have a saved estimate in progress.</p>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            Resume where you left off, or start over and clear the saved draft.
          </p>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <Button
              type="button"
              onClick={onResume}
              size="lg"
              className="h-12 bg-emerald-700 px-5 text-base text-white hover:bg-emerald-600"
            >
              Resume
              <ArrowRight data-icon="inline-end" />
            </Button>
            <Button
              type="button"
              onClick={onStartOver}
              size="lg"
              variant="outline"
              className="h-12 px-5 text-base"
            >
              Start over
            </Button>
          </div>
        </motion.div>

        <motion.div className="calculator-draft-start mt-7" variants={fadeUpItem}>
            <Button
              type="button"
              onClick={onStart}
              size="lg"
              className="h-12 w-full bg-amber-500 px-5 text-base text-slate-950 hover:bg-amber-400 sm:w-auto"
            >
              Start my estimate
              <ArrowRight data-icon="inline-end" />
            </Button>
        </motion.div>

        <motion.div className="mt-8 hidden grid-cols-2 gap-3 lg:grid" variants={staggerContainer}>
          {trustPoints.map((point) => (
            <motion.div
              key={point}
              className="flex min-h-14 items-center gap-3 rounded-lg bg-slate-50 px-3 py-3 ring-1 ring-slate-200"
              variants={fadeUpItem}
              whileHover={shouldReduceMotion ? undefined : { y: -2 }}
              transition={gentleSpring}
            >
              <span className="flex h-7 w-7 flex-none items-center justify-center rounded-full bg-emerald-700 text-white">
                <Check className="h-4 w-4" aria-hidden="true" />
              </span>
              <span className="text-sm font-medium leading-5 text-slate-800">{point}</span>
            </motion.div>
          ))}
        </motion.div>
      </div>

      <motion.aside
        className="hidden border-l border-slate-200 bg-slate-50 p-4 lg:grid lg:h-[560px] lg:grid-rows-[minmax(0,1.08fr)_minmax(0,0.92fr)] lg:gap-4 xl:h-[620px] xl:p-5"
        variants={staggerContainer}
        aria-label="Calculator preview imagery"
      >
        <motion.div className="min-h-0 overflow-hidden rounded-lg bg-slate-100 shadow-sm ring-1 ring-slate-200" variants={fadeUpItem}>
          <img
            src="/marketing/settlement-hero.webp"
            alt="California auto accident claimant reviewing an estimate on a phone near a parked car"
            width={1080}
            height={1920}
            fetchPriority="high"
            decoding="async"
            className="h-full w-full object-cover object-[center_35%]"
          />
        </motion.div>
        <motion.div className="min-h-0 overflow-hidden rounded-lg bg-white shadow-sm ring-1 ring-slate-200" variants={fadeUpItem}>
          <img
            src="/marketing/settlement-trust.webp"
            alt="Young woman with a neck brace reviewing her settlement on a phone at a kitchen table"
            width={1080}
            height={1920}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover object-[center_32%]"
          />
        </motion.div>
      </motion.aside>

      <aside className="border-t border-slate-200 bg-slate-50 lg:hidden">
        <motion.div className="grid gap-3 p-5 sm:grid-cols-2 sm:p-6 xl:grid-cols-3" variants={staggerContainer}>
          {trustPoints.map((point) => (
            <motion.div
              key={point}
              className="flex items-center gap-3 rounded-lg bg-white px-3 py-3 ring-1 ring-slate-200"
              variants={fadeUpItem}
              whileHover={shouldReduceMotion ? undefined : { y: -2 }}
              transition={gentleSpring}
            >
              <span className="flex h-7 w-7 flex-none items-center justify-center rounded-full bg-emerald-700 text-white">
                <Check className="h-4 w-4" aria-hidden="true" />
              </span>
              <span className="text-sm font-medium text-slate-800">{point}</span>
            </motion.div>
          ))}
        </motion.div>
        <motion.div className="aspect-[16/17] w-full overflow-hidden border-t border-slate-200 bg-white" variants={fadeUpItem}>
          <img
            src="/marketing/settlement-trust.webp"
            alt="Young woman with a neck brace reviewing her settlement on a phone at a kitchen table"
            width={1080}
            height={1920}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover object-center"
          />
        </motion.div>
      </aside>
    </motion.section>
  );
}

function AbandonResetDialog({
  open,
  onOpenChange,
  onConfirm
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="max-w-[calc(100%-1.5rem)] gap-0 overflow-hidden p-0 sm:max-w-md"
      >
        <DialogHeader className="gap-0 border-b border-slate-200 bg-slate-50/90 p-5 pr-12 sm:p-6 sm:pr-14">
          <div className="flex items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-700 ring-1 ring-red-100">
              <AlertTriangle aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <DialogTitle className="text-lg font-semibold leading-6 text-slate-950">
                Start over?
              </DialogTitle>
              <DialogDescription className="mt-1.5 text-sm leading-6 text-slate-600">
                This will clear your saved progress and return you to the beginning.
              </DialogDescription>
            </div>
          </div>
          <DialogClose asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="absolute right-3 top-3"
              aria-label="Close start over confirmation"
            >
              <X aria-hidden="true" />
            </Button>
          </DialogClose>
        </DialogHeader>

        <div className="flex flex-col gap-3 p-5 sm:p-6">
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <p className="text-sm font-medium text-slate-950">What gets cleared</p>
            <div className="mt-3 grid gap-2 text-sm leading-5 text-slate-600">
              <div className="flex gap-2">
                <Check className="mt-0.5 text-emerald-700" aria-hidden="true" />
                <span>Your answers and saved draft on this device</span>
              </div>
              <div className="flex gap-2">
                <Check className="mt-0.5 text-emerald-700" aria-hidden="true" />
                <span>Any preview or temporary calculator state</span>
              </div>
            </div>
          </div>

          <div className="rounded-lg bg-amber-50 px-4 py-3 text-sm leading-5 text-amber-950 ring-1 ring-amber-200">
            No estimate will be submitted by starting over. You can keep working and nothing changes.
          </div>
        </div>

        <DialogFooter className="mx-0 mb-0 flex-col gap-2 rounded-none rounded-b-lg bg-slate-50/90 px-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] pt-4 sm:flex-row sm:px-6 sm:pb-5">
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="h-11 w-full sm:w-auto"
            onClick={() => onOpenChange(false)}
          >
            Keep working
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="lg"
            className="h-11 w-full border-red-200 bg-red-600 text-white hover:bg-red-700 focus-visible:border-red-500 focus-visible:ring-red-200 sm:w-auto"
            onClick={onConfirm}
          >
            <RotateCcw data-icon="inline-start" />
            Abandon and reset
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface SettlementCalculatorProps {
  initialEstimateSlug?: string | null;
}

export default function SettlementCalculator({ initialEstimateSlug = null }: SettlementCalculatorProps) {
  const initialEstimateRoute = useMemo(() => parseEstimateSlug(initialEstimateSlug || undefined), [initialEstimateSlug]);
  const initialEstimateRouteRef = useRef(initialEstimateRoute);
  const [hasStarted, setHasStarted] = useState(() => Boolean(initialEstimateRoute && initialEstimateRoute.kind !== 'start'));
  const [currentStep, setCurrentStep] = useState(1);
  const [savedDraft, setSavedDraft] = useState<CalculatorDraft | null>(null);
  const [hasHydratedDraft, setHasHydratedDraft] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState<SettlementResult | null>(null);
  const [preview, setPreview] = useState<EstimatePreviewResponse | null>(null);
  const [responsibleAttorney, setResponsibleAttorney] = useState<ResponsibleAttorney | null>(null);
  const [leadDeliveryStatus, setLeadDeliveryStatus] = useState<string | null>(null);
  const [showValidationError, setShowValidationError] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isRestoringUnlockedEstimate, setIsRestoringUnlockedEstimate] = useState(() => (
    initialEstimateRoute?.kind === 'success'
  ));
  const [calculationError, setCalculationError] = useState<string | null>(null);
  const [isAbandonDialogOpen, setIsAbandonDialogOpen] = useState(false);
  const [bodyModel, setBodyModel] = useState<BodyMapGender | ''>('');
  const [bodyModelError, setBodyModelError] = useState<string | null>(null);
  const [workLifeBooleanAnswers, setWorkLifeBooleanAnswers] = useState<WorkLifeBooleanAnswers>(() => (
    workLifeBooleanAnswersFromData(createDefaultCalculatorData())
  ));
  const [stepTransition, setStepTransition] = useState<StepTransitionState>({
    active: false,
    direction: 'forward',
    targetStep: 1,
    message: ''
  });
  const stepTransitionLockedRef = useRef(false);
  const currentStepRef = useRef(currentStep);
  const hasStartedRef = useRef(hasStarted);
  const previewRef = useRef(preview);
  const resultsRef = useRef(results);
  const showResultsRef = useRef(showResults);
  const isCalculatingRef = useRef(isCalculating);
  const bodyModelRef = useRef(bodyModel);
  const workLifeBooleanAnswersRef = useRef(workLifeBooleanAnswers);
  const hasHandledInitialRouteRef = useRef(false);

  const { register, handleSubmit, watch, setValue, trigger, setError, clearErrors, reset, getValues, formState: { errors } } = useForm<InjuryCalculatorData>({
    defaultValues: createDefaultCalculatorData()
  });

  const watchData = watch();
  const shouldReduceMotion = Boolean(useReducedMotion());

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, []);

  const runStepTransition = useCallback(async (
    targetStep: number,
    direction: StepTransitionState['direction'],
    message: string
  ) => {
    setStepTransition({
      active: true,
      direction,
      targetStep,
      message
    });

    await new Promise((resolve) => window.setTimeout(resolve, STEP_TRANSITION_MS));

    setCurrentStep(targetStep);
    scrollToTop();
    setStepTransition({
      active: false,
      direction,
      targetStep,
      message: ''
    });
    stepTransitionLockedRef.current = false;
  }, [scrollToTop]);

  const replaceHistoryWithLanding = useCallback(() => {
    if (typeof window === 'undefined') return;

    const startRoute = routeStateForSlug('start');
    const shouldUseEstimateUrl = window.location.pathname.startsWith('/estimate');
    writeCalculatorHistoryState(
      'replaceState',
      calculatorHistoryState(startRoute),
      shouldUseEstimateUrl ? routeUrlWithCurrentCampaignParams(startRoute) : undefined
    );
  }, []);

  const writeCalculatorRouteHistory = useCallback((method: 'pushState' | 'replaceState', route: CalculatorRouteState) => {
    if (typeof window === 'undefined') return;

    writeCalculatorHistoryState(
      method,
      calculatorHistoryState(route),
      routeUrlWithCurrentCampaignParams(route)
    );
  }, []);

  const pushStepHistory = useCallback((step: number) => {
    writeCalculatorRouteHistory('pushState', routeStateForStep(clampStep(step)));
  }, [writeCalculatorRouteHistory]);

  const replaceStepHistory = useCallback((step: number) => {
    writeCalculatorRouteHistory('replaceState', routeStateForStep(clampStep(step)));
  }, [writeCalculatorRouteHistory]);

  const seedStepHistory = useCallback((step: number) => {
    replaceHistoryWithLanding();
    pushStepHistory(step);
  }, [pushStepHistory, replaceHistoryWithLanding]);

  const clearTransientState = useCallback(() => {
    setPreview(null);
    setResults(null);
    setResponsibleAttorney(null);
    setLeadDeliveryStatus(null);
    setShowResults(false);
    setShowValidationError(false);
    setIsCalculating(false);
    setIsRestoringUnlockedEstimate(false);
    setCalculationError(null);
    setBodyModelError(null);
    clearErrors();
  }, [clearErrors]);

  const showTemporaryValidationError = useCallback(() => {
    setShowValidationError(true);
    window.setTimeout(() => setShowValidationError(false), 3000);
  }, []);

  const requestAbandonReset = useCallback(() => {
    setIsAbandonDialogOpen(true);
  }, []);

  const resetCalculatorToStart = useCallback(() => {
    clearCalculatorDraft();
    clearUnlockedEstimateSession();
    reset(createDefaultCalculatorData());
    clearTransientState();
    setSavedDraft(null);
    setHasStarted(false);
    setCurrentStep(1);
    setBodyModel('');
    setWorkLifeBooleanAnswers(workLifeBooleanAnswersFromData(createDefaultCalculatorData()));
    setStepTransition({
      active: false,
      direction: 'forward',
      targetStep: 1,
      message: ''
    });
    stepTransitionLockedRef.current = false;
    setIsAbandonDialogOpen(false);
    replaceHistoryWithLanding();
    scrollToTop();
  }, [clearTransientState, replaceHistoryWithLanding, reset, scrollToTop]);

  const handleBodyModelChange = useCallback((nextBodyModel: BodyMapGender) => {
    setBodyModel(nextBodyModel);
    setBodyModelError(null);
  }, []);

  const handleWorkLifeBooleanAnswerChange = useCallback((field: WorkLifeBooleanField, value: boolean) => {
    setWorkLifeBooleanAnswers((currentAnswers) => ({
      ...currentAnswers,
      [field]: value
    }));
    if (field === 'hasAttorney') {
      clearErrors('insurance.hasAttorney');
    }
  }, [clearErrors]);

  const activeOrSavedDraftExists = useCallback(() => {
    return Boolean(
      hasStartedRef.current ||
      hasMeaningfulCalculatorProgress(getValues(), bodyModel) ||
      readCalculatorDraft()
    );
  }, [bodyModel, getValues]);

  const handleCalculatorResetRequest = useCallback(() => {
    if (activeOrSavedDraftExists()) {
      requestAbandonReset();
      return;
    }

    setHasStarted(false);
    setCurrentStep(1);
    clearTransientState();
    replaceHistoryWithLanding();
    scrollToTop();
  }, [activeOrSavedDraftExists, clearTransientState, replaceHistoryWithLanding, requestAbandonReset, scrollToTop]);

  const beginLeadQualityTimer = useCallback(async () => {
    // Missing timer state already falls back to estimate-only unlock on the server.
  }, []);

  const resumeSavedDraft = useCallback(async () => {
    const draftToResume = savedDraft ?? readCalculatorDraft();
    if (!draftToResume) {
      setSavedDraft(null);
      setCalculatorDraftDocumentStatus(CALCULATOR_DRAFT_NONE);
      return;
    }

    reset(draftToResume.data);
    clearTransientState();
    await beginLeadQualityTimer();
    const draftWorkLifeAnswers = {
      ...workLifeBooleanAnswersFromData(draftToResume.data),
      ...draftToResume.workLifeBooleanAnswers
    };
    const requestedRoute = routeStateForStep(clampStep(draftToResume.currentStep));
    const restoredRoute = guardCalculatorRoute(
      requestedRoute,
      {
        data: draftToResume.data,
        bodyModel: draftToResume.bodyModel,
        workLifeBooleanAnswers: draftWorkLifeAnswers
      },
      {
        hasPreview: false,
        isPreparing: false,
        hasResults: false
      }
    );
    const restoredStep = restoredRoute.kind === 'step' ? restoredRoute.step : 1;
    setBodyModel(draftToResume.bodyModel);
    setWorkLifeBooleanAnswers(draftWorkLifeAnswers);
    setCurrentStep(restoredStep);
    setHasStarted(true);
    setSavedDraft(null);
    seedStepHistory(restoredStep);
    if (!calculatorRoutesMatch(requestedRoute, restoredRoute)) {
      showTemporaryValidationError();
    }
    scrollToTop();
  }, [
    beginLeadQualityTimer,
    clearTransientState,
    reset,
    savedDraft,
    scrollToTop,
    seedStepHistory,
    showTemporaryValidationError
  ]);

  const startCalculator = useCallback(async () => {
    clearUnlockedEstimateSession();
    clearTransientState();
    setWorkLifeBooleanAnswers(workLifeBooleanAnswersFromData(getValues()));
    await beginLeadQualityTimer();
    setHasStarted(true);
    setCurrentStep(1);
    seedStepHistory(1);
    scrollToTop();
  }, [beginLeadQualityTimer, clearTransientState, getValues, scrollToTop, seedStepHistory]);

  const showUnlockedEstimate = useCallback((
    sessionId: string,
    unlockedResults: SettlementResult,
    attorney: ResponsibleAttorney | null,
    deliveryStatus: string,
    historyMethod: 'pushState' | 'replaceState' = 'pushState'
  ) => {
    writeUnlockedEstimateSession(sessionId);
    setResults(unlockedResults);
    setResponsibleAttorney(attorney);
    setLeadDeliveryStatus(deliveryStatus);
    setPreview(null);
    setShowResults(true);
    setHasStarted(true);
    setCurrentStep(5);
    setCalculationError(null);
    setIsCalculating(false);
    setIsRestoringUnlockedEstimate(false);
    writeCalculatorRouteHistory(historyMethod, routeStateForSlug('success'));
    scrollToTop();
  }, [scrollToTop, writeCalculatorRouteHistory]);

  useEffect(() => {
    currentStepRef.current = currentStep;
  }, [currentStep]);

  useEffect(() => {
    previewRef.current = preview;
  }, [preview]);

  useEffect(() => {
    resultsRef.current = results;
  }, [results]);

  useEffect(() => {
    showResultsRef.current = showResults;
  }, [showResults]);

  useEffect(() => {
    isCalculatingRef.current = isCalculating;
  }, [isCalculating]);

  useEffect(() => {
    bodyModelRef.current = bodyModel;
  }, [bodyModel]);

  useEffect(() => {
    workLifeBooleanAnswersRef.current = workLifeBooleanAnswers;
  }, [workLifeBooleanAnswers]);

  useEffect(() => {
    if (!hasStarted || preview || showResults) return;

    const scrollFrame = window.requestAnimationFrame(() => {
      window.scrollTo({ top: 0, behavior: 'auto' });
    });

    return () => window.cancelAnimationFrame(scrollFrame);
  }, [currentStep, hasStarted, preview, showResults]);

  useEffect(() => {
    if (hasStarted || showResults || isCalculating) return;

    let firstFrame: number | undefined;
    let secondFrame: number | undefined;
    const scrollToLandingTop = () => window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    const queueLandingTopScroll = () => {
      scrollToLandingTop();
      if (firstFrame !== undefined) window.cancelAnimationFrame(firstFrame);
      if (secondFrame !== undefined) window.cancelAnimationFrame(secondFrame);

      firstFrame = window.requestAnimationFrame(() => {
        scrollToLandingTop();
        secondFrame = window.requestAnimationFrame(scrollToLandingTop);
      });
    };

    const handleLandingEntry = () => queueLandingTopScroll();
    queueLandingTopScroll();
    window.addEventListener('pageshow', handleLandingEntry);
    window.addEventListener('popstate', handleLandingEntry);

    return () => {
      window.removeEventListener('pageshow', handleLandingEntry);
      window.removeEventListener('popstate', handleLandingEntry);
      if (firstFrame !== undefined) {
        window.cancelAnimationFrame(firstFrame);
      }
      if (secondFrame !== undefined) {
        window.cancelAnimationFrame(secondFrame);
      }
    };
  }, [hasStarted, isCalculating, showResults]);

  useEffect(() => {
    hasStartedRef.current = hasStarted;
  }, [hasStarted]);

  useEffect(() => {
    if (hasHandledInitialRouteRef.current) return;
    hasHandledInitialRouteRef.current = true;

    const requestedRoute = parseEstimatePath(window.location.pathname) || initialEstimateRouteRef.current;
    const draft = readCalculatorDraft();
    setSavedDraft(draft);
    setHasHydratedDraft(true);

    if (!requestedRoute) {
      replaceHistoryWithLanding();
      return;
    }

    if (requestedRoute.kind === 'start') {
      writeCalculatorRouteHistory('replaceState', requestedRoute);
      return;
    }

    const draftData = draft?.data ?? getValues();
    const draftBodyModel = draft?.bodyModel ?? bodyModelRef.current;
    const draftWorkLifeAnswers = {
      ...workLifeBooleanAnswersFromData(draftData),
      ...draft?.workLifeBooleanAnswers
    };
    const progressInput = {
      data: draftData,
      bodyModel: draftBodyModel,
      workLifeBooleanAnswers: draftWorkLifeAnswers
    };
    const applyInitialRoute = (guardedRoute: CalculatorRouteState) => {
      reset(draftData);
      clearTransientState();
      setBodyModel(draftBodyModel);
      setWorkLifeBooleanAnswers(draftWorkLifeAnswers);
      setHasStarted(true);
      setSavedDraft(null);
      setCurrentStep(guardedRoute.kind === 'step' ? guardedRoute.step : 1);
      writeCalculatorRouteHistory('replaceState', guardedRoute);
      void beginLeadQualityTimer();
      scrollToTop();

      if (!calculatorRoutesMatch(requestedRoute, guardedRoute)) {
        showTemporaryValidationError();
      }
    };

    if (requestedRoute.kind === 'success') {
      const unlockedEstimateSession = readUnlockedEstimateSession();

      if (unlockedEstimateSession) {
        reset(draftData);
        clearTransientState();
        setBodyModel(draftBodyModel);
        setWorkLifeBooleanAnswers(draftWorkLifeAnswers);
        setHasStarted(true);
        setSavedDraft(null);
        setCurrentStep(5);
        setIsRestoringUnlockedEstimate(true);
        writeCalculatorRouteHistory('replaceState', requestedRoute);
        void beginLeadQualityTimer();
        scrollToTop();

        void requestUnlockedEstimateRestore(unlockedEstimateSession.sessionId)
          .then((restored) => {
            showUnlockedEstimate(
              unlockedEstimateSession.sessionId,
              restored.results,
              restored.responsibleAttorney,
              restored.leadDeliveryStatus,
              'replaceState'
            );
          })
          .catch(() => {
            clearUnlockedEstimateSession();
            const guardedRoute = guardCalculatorRoute(requestedRoute, progressInput, {
              hasPreview: false,
              isPreparing: false,
              hasResults: false
            });
            applyInitialRoute(guardedRoute);
          })
          .finally(() => {
            setIsRestoringUnlockedEstimate(false);
          });

        return;
      }
    }

    applyInitialRoute(guardCalculatorRoute(requestedRoute, progressInput, {
      hasPreview: false,
      isPreparing: false,
      hasResults: false
    }));
  }, [
    beginLeadQualityTimer,
    clearTransientState,
    getValues,
    replaceHistoryWithLanding,
    reset,
    scrollToTop,
    showUnlockedEstimate,
    showTemporaryValidationError,
    writeCalculatorRouteHistory
  ]);

  useEffect(() => {
    if (!hasHydratedDraft) return;
    if (!hasStarted && !hasMeaningfulCalculatorProgress(watchData, bodyModel)) return;

    writeCalculatorDraft({
      version: CALCULATOR_DRAFT_VERSION,
      data: watchData,
      hasStarted,
      currentStep,
      bodyModel,
      workLifeBooleanAnswers,
      savedAt: new Date().toISOString()
    });
  }, [bodyModel, currentStep, hasHydratedDraft, hasStarted, watchData, workLifeBooleanAnswers]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleResetEvent = () => handleCalculatorResetRequest();
    window.addEventListener(CALCULATOR_RESET_EVENT, handleResetEvent);

    return () => window.removeEventListener(CALCULATOR_RESET_EVENT, handleResetEvent);
  }, [handleCalculatorResetRequest]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handlePopState = () => {
      const requestedRoute = parseEstimatePath(window.location.pathname);

      if (!requestedRoute) {
        if (!hasStartedRef.current) return;

        if (currentStepRef.current > 1) {
          const previousStep = currentStepRef.current - 1;
          setCurrentStep(previousStep);
          replaceStepHistory(previousStep);
          setShowValidationError(false);
          setCalculationError(null);
          scrollToTop();
          return;
        }

        requestAbandonReset();
        pushStepHistory(currentStepRef.current);
        return;
      }

      if (requestedRoute.kind === 'start') {
        if (hasStartedRef.current) {
          requestAbandonReset();
          if (showResultsRef.current && resultsRef.current) {
            writeCalculatorRouteHistory('pushState', routeStateForSlug('success'));
            return;
          }
          pushStepHistory(currentStepRef.current);
        }
        return;
      }

      const guardedRoute = guardCalculatorRoute(
        requestedRoute,
        {
          data: getValues(),
          bodyModel: bodyModelRef.current,
          workLifeBooleanAnswers: workLifeBooleanAnswersRef.current
        },
        {
          hasPreview: Boolean(previewRef.current),
          isPreparing: isCalculatingRef.current,
          hasResults: Boolean(showResultsRef.current && resultsRef.current)
        }
      );

      const wasRouteRedirected = !calculatorRoutesMatch(requestedRoute, guardedRoute);

      if (wasRouteRedirected) {
        writeCalculatorRouteHistory('replaceState', guardedRoute);
        showTemporaryValidationError();
      }

      if (guardedRoute.kind === 'step') {
        setHasStarted(true);
        setShowResults(false);
        if (previewRef.current) {
          setPreview(null);
        }
        setCurrentStep(guardedRoute.step);
        if (!wasRouteRedirected) {
          setShowValidationError(false);
        }
        setCalculationError(null);
        scrollToTop();
        return;
      }

      if (guardedRoute.kind === 'preview') {
        setHasStarted(true);
        setShowResults(false);
        setCurrentStep(5);
        scrollToTop();
        return;
      }

      if (guardedRoute.kind === 'success') {
        setHasStarted(true);
        setPreview(null);
        setShowResults(true);
        scrollToTop();
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [
    getValues,
    pushStepHistory,
    replaceStepHistory,
    requestAbandonReset,
    scrollToTop,
    showTemporaryValidationError,
    writeCalculatorRouteHistory
  ]);

  const onSubmit = async (data: InjuryCalculatorData) => {
    setCalculationError(null);
    clearUnlockedEstimateSession();
    const calculatorData = prepareCalculatorDataForEstimate(data);

    try {
      writeCalculatorRouteHistory('pushState', routeStateForSlug('preparing'));
      setIsCalculating(true);
      const requestPreview = async () => {
        const response = await fetch('/api/estimate/preview', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            calculatorData,
            privacyChoiceSnapshot: readBrowserPrivacyChoices()
          })
        });

        return parseApiResponse<EstimatePreviewResponse>(
          response,
          'Unable to prepare the estimate preview.'
        );
      };

      const [previewResponse] = await Promise.all([
        requestPreview(),
        new Promise((resolve) => window.setTimeout(resolve, ESTIMATE_PREPARATION_MIN_MS))
      ]);
      setResults(null);
      setResponsibleAttorney(null);
      setLeadDeliveryStatus(null);
      setShowResults(false);

      if (previewResponse.unlockMode === 'estimate_only') {
        const unlocked = await requestEstimateOnlyUnlock(previewResponse.sessionId);
        showUnlockedEstimate(
          previewResponse.sessionId,
          unlocked.results,
          unlocked.responsibleAttorney,
          unlocked.leadDeliveryStatus,
          'replaceState'
        );
        return;
      }

      setPreview(previewResponse);
      writeCalculatorRouteHistory('replaceState', routeStateForSlug('preview'));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      console.error('Calculation error:', error);
      setCalculationError(error instanceof Error ? error.message : 'Unable to prepare your estimate. Please try again.');
      writeCalculatorRouteHistory('replaceState', routeStateForStep(5));
    } finally {
      setIsCalculating(false);
    }
  };

  const validateStep = async (step: number) => {
    switch (step) {
      case 1:
        {
          const requiredFieldsAreValid = await trigger([
            'accidentDetails.dateOfAccident',
            'accidentDetails.impactSeverity'
          ]);
          const bodyModelIsValid = Boolean(bodyModel);
          setBodyModelError(bodyModelIsValid ? null : 'Choose a body model');

          return requiredFieldsAreValid && bodyModelIsValid;
        }
      case 2:
        if (!watchData.injuries.bodyMap?.length) {
          setError('injuries.primaryInjury', {
            type: 'manual',
            message: 'Tap at least one injury area'
          });
          return false;
        }

        {
          const derived = deriveBodyMapOnlyInjuryFields(watchData.injuries);
          setValue('injuries.primaryInjury', derived.primaryInjury, { shouldDirty: true, shouldValidate: true });
          setValue('injuries.secondaryInjuries', derived.secondaryInjuries, { shouldDirty: true });
          setValue('injuries.fractures', derived.fractures, { shouldDirty: true });
          setValue('injuries.preExistingConditions', derived.preExistingConditions, { shouldDirty: true });
          setValue('injuries.tbi', derived.tbi, { shouldDirty: true });
          setValue('injuries.tbiSeverity', derived.tbiSeverity, { shouldDirty: true });
          setValue('injuries.spinalIssues', derived.spinalIssues, { shouldDirty: true });
        }

        clearErrors('injuries.primaryInjury');
        return true;
      case 3:
        return true;
      case 4:
        {
          const attorneyQuestionIsAnswered = typeof workLifeBooleanAnswers.hasAttorney === 'boolean';

          if (!attorneyQuestionIsAnswered) {
            setError('insurance.hasAttorney', {
              type: 'manual',
              message: 'Choose yes or no before continuing'
            });
          } else {
            clearErrors('insurance.hasAttorney');
          }

          const stepIsValid = attorneyQuestionIsAnswered;
          if (stepIsValid) {
            const dataWithWageDefaults = applyWageLossDefaults(getValues());
            setValue('demographics.age', calculatorAgeFromDemographics(watchData.demographics), {
              shouldDirty: true,
              shouldValidate: false
            });
            if (watchData.impact.hasWageLoss) {
              setValue('demographics.occupation', dataWithWageDefaults.demographics.occupation, {
                shouldDirty: true,
                shouldValidate: false
              });
              setValue('demographics.annualIncome', dataWithWageDefaults.demographics.annualIncome, {
                shouldDirty: true,
                shouldValidate: false
              });
            }
            setValue('impact.missedWorkDays', 0, {
              shouldDirty: true,
              shouldValidate: false
            });
            setValue('impact.impairmentRating', undefined, {
              shouldDirty: true,
              shouldValidate: false
            });
            setValue('insurance.attorneyContingency', undefined, {
              shouldDirty: true,
              shouldValidate: false
            });
          }

          return stepIsValid;
        }
      case 5:
        {
          const unlockFieldsAreValid = await trigger([
            'demographics.dateOfBirth',
            'accidentDetails.county'
          ]);
          return unlockFieldsAreValid;
        }
      default:
        return true;
    }
  };

  const validateCurrentStep = () => validateStep(currentStep);

  const nextStep = async () => {
    if (stepTransitionLockedRef.current || stepTransition.active) return;
    stepTransitionLockedRef.current = true;

    const isValid = await validateCurrentStep();

    if (!isValid) {
      stepTransitionLockedRef.current = false;
      showTemporaryValidationError();
      return;
    }

    setShowValidationError(false);

    if (currentStep < STEPS.length) {
      pushStepHistory(currentStep + 1);
      await runStepTransition(
        currentStep + 1,
        'forward',
        STEP_TRANSITION_MESSAGES[currentStep] || 'Updating case profile'
      );
      return;
    }

    stepTransitionLockedRef.current = false;
  };

  const prevStep = () => {
    if (stepTransitionLockedRef.current || stepTransition.active) return;

    if (currentStep === 1) {
      requestAbandonReset();
      return;
    }

    if (currentStep > 1) {
      if (preview) {
        setPreview(null);
      }
      stepTransitionLockedRef.current = true;
      const targetStep = currentStep - 1;
      replaceStepHistory(targetStep);
      void runStepTransition(targetStep, 'back', 'Loading previous section');
    }
  };

  const handleStepJump = async (requestedStep: number) => {
    if (stepTransitionLockedRef.current || stepTransition.active || isCalculating) return;

    const targetStep = clampStep(requestedStep);
    if (targetStep === currentStep) return;

    setCalculationError(null);

    if (targetStep < currentStep) {
      if (preview) {
        setPreview(null);
      }
      setShowValidationError(false);
      stepTransitionLockedRef.current = true;
      replaceStepHistory(targetStep);
      await runStepTransition(targetStep, 'back', 'Loading previous section');
      return;
    }

    stepTransitionLockedRef.current = true;
    setShowValidationError(false);

    for (let step = currentStep; step < targetStep; step += 1) {
      const stepIsValid = await validateStep(step);

      if (!stepIsValid) {
        if (step === currentStep) {
          stepTransitionLockedRef.current = false;
          showTemporaryValidationError();
          return;
        }

        pushStepHistory(step);
        await runStepTransition(
          step,
          'forward',
          STEP_TRANSITION_MESSAGES[step - 1] || 'Opening required section'
        );
        showTemporaryValidationError();
        return;
      }
    }

    if (preview) {
      setPreview(null);
    }
    pushStepHistory(targetStep);
    await runStepTransition(
      targetStep,
      'forward',
      STEP_TRANSITION_MESSAGES[Math.max(1, targetStep - 1)] || `Opening ${STEPS[targetStep - 1].name}`
    );
  };

  const handleCalculate = async () => {
    const isValid = await validateCurrentStep();
    if (!isValid) {
      showTemporaryValidationError();
      return;
    }

    setShowValidationError(false);
    handleSubmit(onSubmit)();
  };

  const liveProfileItems = buildProfileItems(watchData, currentStep);
  const liveCompletedCount = liveProfileItems.filter((item) => item.complete).length;
  const liveStrength = profileState(liveCompletedCount);
  const stepProgress = Math.round((currentStep / STEPS.length) * 100);
  const desktopRailProgress = ((currentStep - 0.5) / STEPS.length) * 100;
  const abandonDialog = (
    <AbandonResetDialog
      open={isAbandonDialogOpen}
      onOpenChange={setIsAbandonDialogOpen}
      onConfirm={resetCalculatorToStart}
    />
  );

  if (showResults && results) {
    return (
      <>
        <motion.div
          key="settlement-results"
          initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={shouldReduceMotion ? { duration: 0.08 } : { duration: 0.38, ease: premiumEase }}
        >
          <SettlementResults
            results={results}
            medicalCosts={results.medicalCosts}
            hasAttorney={watch('insurance.hasAttorney') || false}
            responsibleAttorney={responsibleAttorney}
            leadDeliveryStatus={leadDeliveryStatus}
            onBack={() => {
              clearUnlockedEstimateSession();
              setShowResults(false);
              setPreview(null);
              setCurrentStep(1);
              pushStepHistory(1);
            }}
            onEdit={() => {
              clearUnlockedEstimateSession();
              setShowResults(false);
              setPreview(null);
              setCurrentStep(5);
              pushStepHistory(5);
            }}
            onStartOver={requestAbandonReset}
          />
        </motion.div>
        {abandonDialog}
      </>
    );
  }

  if (isCalculating || isRestoringUnlockedEstimate) {
    return (
      <>
        <motion.div
          key="estimate-loader"
          initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={shouldReduceMotion ? { duration: 0.08 } : { duration: 0.3, ease: premiumEase }}
        >
          <EstimatePreparationLoader />
        </motion.div>
        {abandonDialog}
      </>
    );
  }

  if (!hasStarted) {
    return (
      <>
        <StartCalculatorScreen
          onResume={resumeSavedDraft}
          onStart={startCalculator}
          onStartOver={requestAbandonReset}
        />
        {abandonDialog}
      </>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <div className={`grid min-w-0 gap-5 ${currentStep === 1 ? 'grid-cols-1' : 'lg:grid-cols-[280px_minmax(0,1fr)] xl:grid-cols-[300px_minmax(0,1fr)]'}`}>
        <div className={`${currentStep === 1 ? 'hidden' : 'hidden lg:sticky lg:top-4 lg:block lg:self-start'}`}>
          <ProfileStrengthCard data={watchData} currentStep={currentStep} />
        </div>

        <motion.div
          layout
          className={cn(
            'relative min-w-0 w-full max-w-[calc(100vw-2rem)] overflow-visible rounded-lg border border-slate-200 bg-white shadow-sm sm:max-w-none',
            currentStep === 1 && 'lg:mx-auto lg:max-w-5xl'
          )}
          data-form-container
          initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={shouldReduceMotion ? { duration: 0.08 } : { duration: 0.34, ease: premiumEase }}
        >
          <div className={cn(
            'rounded-t-lg border-b border-slate-200 bg-slate-50/80 p-4 transition duration-150',
            stepTransition.active && 'pointer-events-none opacity-55 blur-[1px]'
          )}>
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-700">
                  {STEPS[currentStep - 1].name} · <span className={liveStrength.color}>{liveStrength.label}</span>
                </p>
                <p className="mt-1 text-xs font-medium text-slate-500">
                  Step {currentStep} of {STEPS.length} · {stepProgress}% complete
                </p>
              </div>
              <div className="hidden shrink-0 items-center gap-1 sm:flex lg:hidden" aria-hidden="true">
                {STEPS.map((step) => {
                  const Icon = step.icon;
                  return (
                    <motion.div
                      key={step.id}
                      className={`flex h-8 w-8 items-center justify-center rounded-lg transition sm:h-9 sm:w-9 ${
                        currentStep >= step.id
                          ? 'bg-emerald-700 text-white'
                          : 'bg-white text-slate-400 ring-1 ring-slate-200'
                      }`}
                      title={step.name}
                      animate={shouldReduceMotion ? undefined : {
                        scale: currentStep === step.id ? 1.06 : 1,
                        y: currentStep === step.id ? -1 : 0
                      }}
                      whileHover={shouldReduceMotion ? undefined : { y: -2 }}
                      transition={softSpring}
                    >
                      <Icon className="h-4 w-4" aria-hidden="true" />
                    </motion.div>
                  );
                })}
              </div>
              <div className="hidden shrink-0 items-center gap-1 lg:flex" aria-label="Calculator steps">
                {STEPS.map((step) => {
                  const Icon = step.icon;
                  const isCurrentStep = currentStep === step.id;
                  const isStepReached = currentStep >= step.id;
                  const stepControlsDisabled = stepTransition.active || isCalculating;

                  return (
                    <motion.button
                      key={step.id}
                      type="button"
                      onClick={() => void handleStepJump(step.id)}
                      disabled={stepControlsDisabled || isCurrentStep}
                      aria-current={isCurrentStep ? 'step' : undefined}
                      aria-label={isCurrentStep ? `${step.name} step, current` : `Go to ${step.name} step`}
                      className={cn(
                        'flex h-9 w-9 items-center justify-center rounded-lg transition focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-default disabled:opacity-100',
                        isStepReached
                          ? 'bg-emerald-700 text-white'
                          : 'bg-white text-slate-400 ring-1 ring-slate-200',
                        !isCurrentStep && !stepControlsDisabled && 'cursor-pointer hover:-translate-y-0.5 hover:ring-slate-300'
                      )}
                      title={isCurrentStep ? `${step.name} step` : `Go to ${step.name} step`}
                      animate={shouldReduceMotion ? undefined : {
                        scale: isCurrentStep ? 1.06 : 1,
                        y: isCurrentStep ? -1 : 0
                      }}
                      whileHover={shouldReduceMotion || isCurrentStep || stepControlsDisabled ? undefined : { y: -2 }}
                      transition={softSpring}
                    >
                      <Icon className="h-4 w-4" aria-hidden="true" />
                    </motion.button>
                  );
                })}
              </div>
            </div>
            <Progress
              value={stepProgress}
              aria-label={`Calculator progress: ${stepProgress}% complete`}
              className="mt-4 h-2 bg-slate-200 lg:hidden"
              indicatorClassName="bg-emerald-700"
            />
            <div
              className="mt-4 hidden h-2 overflow-hidden rounded-full bg-slate-200 lg:block"
              role="presentation"
              aria-hidden="true"
            >
              <div
                className="h-full rounded-full bg-emerald-700 transition-[width] duration-300 ease-out"
                style={{ width: `${desktopRailProgress}%` }}
              />
            </div>
            <div className="mt-4 hidden grid-cols-5 gap-2 text-xs font-medium text-slate-500 sm:grid lg:hidden">
              {STEPS.map((step) => (
                <span key={step.id} className={currentStep >= step.id ? 'text-emerald-800' : ''}>{step.shortName}</span>
              ))}
            </div>
            <div className="mt-4 hidden grid-cols-5 text-center text-xs font-medium text-slate-500 lg:grid">
              {STEPS.map((step) => (
                <span key={step.id} className={cn('px-1', currentStep >= step.id ? 'text-emerald-800' : '')}>{step.shortName}</span>
              ))}
            </div>
          </div>

          <form
            onSubmit={handleSubmit(onSubmit)}
            className={cn(
              'p-5 transition duration-150 sm:p-7',
              stepTransition.active && 'pointer-events-none opacity-55 blur-[1px]'
            )}
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={`calculator-step-${currentStep}`}
                initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -8 }}
                transition={shouldReduceMotion ? { duration: 0.08 } : { duration: 0.26, ease: premiumEase }}
              >
                {currentStep === 1 && (
                  <QuickFactsStep
                    register={register}
                    watch={watch}
                    setValue={setValue}
                    errors={errors}
                    bodyModel={bodyModel}
                    bodyModelError={bodyModelError}
                    onBodyModelChange={handleBodyModelChange}
                  />
                )}

                {currentStep === 2 && (
                  <InjuriesStep
                    register={register}
                    watch={watch}
                    setValue={setValue}
                    errors={errors}
                    bodyModel={bodyModel || 'male'}
                  />
                )}

                {currentStep === 3 && (
                  <TreatmentStep register={register} watch={watch} setValue={setValue} errors={errors} />
                )}

                {currentStep === 4 && (
                  <WorkLifeStep
                    register={register}
                    watch={watch}
                    setValue={setValue}
                    errors={errors}
                    booleanAnswers={workLifeBooleanAnswers}
                    onBooleanAnswerChange={handleWorkLifeBooleanAnswerChange}
                  />
                )}

                {currentStep === 5 && (
                  <ReviewUnlockStep
                    data={watchData}
                    register={register}
                    setValue={setValue}
                    errors={errors}
                    preview={preview}
                    onResetPreview={() => {
                      setPreview(null);
                      setCalculationError(null);
                      replaceStepHistory(5);
                    }}
                    onUnlocked={(sessionId, unlockedResults, attorney, deliveryStatus) => {
                      showUnlockedEstimate(sessionId, unlockedResults, attorney, deliveryStatus);
                    }}
                  />
                )}
              </motion.div>
            </AnimatePresence>

            {!preview && (
            <div className="mt-8 rounded-lg border border-slate-200 bg-slate-50 p-2">
              <div className="grid w-full grid-cols-2 items-center gap-2 sm:ml-auto sm:max-w-md">
                <Button
                  type="button"
                  onClick={prevStep}
                  disabled={stepTransition.active}
                  variant="outline"
                  size="lg"
                  className="h-12 w-full min-w-0 justify-center"
                >
                  <ChevronLeft data-icon="inline-start" />
                  Back
                </Button>

                {currentStep < STEPS.length ? (
                  <Button
                    type="button"
                    onClick={nextStep}
                    disabled={stepTransition.active}
                    size="lg"
                    className="h-12 w-full min-w-0 justify-center bg-amber-500 text-slate-950 hover:bg-amber-400"
                  >
                    Continue
                    <ArrowRight data-icon="inline-end" />
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={handleCalculate}
                    disabled={isCalculating || stepTransition.active}
                    size="lg"
                    className="h-12 w-full min-w-0 justify-center bg-emerald-700 text-white hover:bg-emerald-600"
                  >
                    {isCalculating ? (
                      'Preparing...'
                    ) : (
                      <>
                        Unlock
                        <ArrowRight data-icon="inline-end" />
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
            )}

            <AnimatePresence initial={false}>
              {showValidationError && (
                <motion.div key="validation-error" {...reducedMotionFade(shouldReduceMotion)}>
                  <Alert className="mt-4" variant="destructive">
                    <AlertCircle data-icon="inline-start" />
                    <AlertDescription>
                      {currentStep === 5
                        ? 'Please complete Date of Birth and accident county before preparing your estimate.'
                        : 'Please complete the required fields before continuing.'}
                    </AlertDescription>
                  </Alert>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence initial={false}>
              {calculationError && (
                <motion.div key="calculation-error" {...reducedMotionFade(shouldReduceMotion)}>
                  <Alert className="mt-4" variant="destructive">
                    <AlertCircle data-icon="inline-start" />
                    <AlertDescription>{calculationError}</AlertDescription>
                  </Alert>
                </motion.div>
              )}
            </AnimatePresence>
          </form>
          <StepTransitionOverlay transition={stepTransition} />
          {abandonDialog}
        </motion.div>
      </div>

      <div className="flex justify-center pt-6">
        <Button
          type="button"
          onClick={requestAbandonReset}
          disabled={stepTransition.active}
          variant="outline"
          size="lg"
          className="border-slate-300 bg-white text-slate-700 shadow-sm hover:bg-slate-50"
        >
          <RotateCcw data-icon="inline-start" />
          Start over
        </Button>
      </div>

    </div>
  );
}
