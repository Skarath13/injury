'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FieldErrors, UseFormRegister, UseFormSetValue, useForm } from 'react-hook-form';
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Briefcase,
  Check,
  ChevronLeft,
  ClipboardCheck,
  FileLock2,
  Lock,
  MapPin,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  X
} from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { BodyMapGender, EstimatePreviewResponse, InjuryCalculatorData, ResponsibleAttorney, SettlementResult } from '@/types/calculator';
import { bodyMapSummary, deriveBodyMapOnlyInjuryFields } from '@/lib/bodyMapInjuries';
import { createDefaultGuidedInjurySignals } from '@/lib/guidedInjurySignals';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
import SettlementPreviewGate from './SettlementPreviewGate';
import TurnstileWidget from './TurnstileWidget';
import EstimatePreparationLoader, { ESTIMATE_PREPARATION_MIN_MS } from './EstimatePreparationLoader';
import CountyCombobox from './CountyCombobox';
import InfoIcon from './InfoIcon';
import { cn } from '@/lib/utils';
import { readBrowserPrivacyChoices } from '@/lib/privacyChoices';

const STEPS = [
  { id: 1, name: 'Quick Facts', shortName: 'Facts', icon: MapPin },
  { id: 2, name: 'Injury Signals', shortName: 'Injury', icon: Stethoscope },
  { id: 3, name: 'Treatment', shortName: 'Care', icon: Activity },
  { id: 4, name: 'Work & Daily Life', shortName: 'Life', icon: Briefcase },
  { id: 5, name: 'Review & Unlock', shortName: 'Unlock', icon: FileLock2 }
];

const STEP_TRANSITION_MS = 2000;

const STEP_TRANSITION_MESSAGES: Record<number, string> = {
  1: 'Updating accident signals',
  2: 'Reading injury selections',
  3: 'Estimating medical specials',
  4: 'Updating claim impact'
};

const DRAFT_STORAGE_KEY = 'injury-calculator:draft:v1';
const DRAFT_VERSION = 1;
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

interface CalculatorDraft {
  version: typeof DRAFT_VERSION;
  data: InjuryCalculatorData;
  hasStarted: boolean;
  currentStep: number;
  bodyModel: BodyMapGender | '';
  savedAt: string;
}

interface ProfileItem {
  label: string;
  value: string;
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
      age: 35,
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

function clampStep(step: unknown) {
  const numericStep = Number(step);
  if (!Number.isFinite(numericStep)) return 1;
  return Math.min(Math.max(Math.round(numericStep), 1), STEPS.length);
}

function hasMeaningfulCalculatorProgress(data: InjuryCalculatorData, bodyModel: BodyMapGender | '') {
  return Boolean(
    bodyModel ||
    data.accidentDetails.county ||
    data.accidentDetails.dateOfAccident ||
    data.accidentDetails.impactSeverity ||
    Number(data.accidentDetails.faultPercentage || 0) > 0 ||
    Number(data.accidentDetails.priorAccidents || 0) > 0 ||
    data.injuries.bodyMap?.length ||
    hasTreatmentSignal(data) ||
    Number(data.impact.missedWorkDays || 0) > 0 ||
    data.impact.emotionalDistress ||
    data.impact.lossOfConsortium ||
    data.impact.permanentImpairment ||
    data.demographics.occupation ||
    data.demographics.annualIncome ||
    data.insurance.policyLimitsKnown ||
    data.insurance.policyLimits ||
    data.insurance.hasAttorney
  );
}

function readCalculatorDraft(): CalculatorDraft | null {
  const storage = getBrowserStorage();
  if (!storage) return null;

  try {
    const storedDraft = storage.getItem(DRAFT_STORAGE_KEY);
    if (!storedDraft) return null;

    const parsedDraft = JSON.parse(storedDraft) as Partial<CalculatorDraft>;
    if (
      parsedDraft?.version !== DRAFT_VERSION ||
      !parsedDraft.data ||
      typeof parsedDraft.data !== 'object'
    ) {
      storage.removeItem(DRAFT_STORAGE_KEY);
      return null;
    }

    return {
      version: DRAFT_VERSION,
      data: parsedDraft.data as InjuryCalculatorData,
      hasStarted: Boolean(parsedDraft.hasStarted),
      currentStep: clampStep(parsedDraft.currentStep),
      bodyModel: parsedDraft.bodyModel === 'female' || parsedDraft.bodyModel === 'male' ? parsedDraft.bodyModel : '',
      savedAt: typeof parsedDraft.savedAt === 'string' ? parsedDraft.savedAt : new Date().toISOString()
    };
  } catch {
    try {
      storage.removeItem(DRAFT_STORAGE_KEY);
    } catch {
      // Storage may be unavailable in private or restricted browser contexts.
    }
    return null;
  }
}

function writeCalculatorDraft(draft: CalculatorDraft) {
  const storage = getBrowserStorage();
  if (!storage) return;

  try {
    storage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
  } catch {
    // Storage may be unavailable in private or restricted browser contexts.
  }
}

function clearCalculatorDraft() {
  const storage = getBrowserStorage();
  if (!storage) return;

  try {
    storage.removeItem(DRAFT_STORAGE_KEY);
  } catch {
    // Storage may be unavailable in private or restricted browser contexts.
  }
}

function writeCalculatorHistoryState(method: 'pushState' | 'replaceState', state: unknown) {
  if (typeof window === 'undefined') return;

  const historyMethod = Object.getPrototypeOf(window.history)?.[method] as
    | ((data: unknown, unused: string) => void)
    | undefined;

  if (typeof historyMethod === 'function') {
    historyMethod.call(window.history, state, '');
    return;
  }

  window.history[method](state, '');
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

function treatmentSelectionCount(data: InjuryCalculatorData) {
  const treatment = data.treatment;
  return [
    treatment.ambulanceTransports,
    treatment.emergencyRoomVisits,
    treatment.urgentCareVisits,
    treatment.hospitalAdmissionDays,
    treatment.chiropracticSessions,
    treatment.physicalTherapySessions,
    treatment.occupationalTherapySessions,
    treatment.xrays,
    treatment.mris,
    treatment.ctScans,
    treatment.emgNerveStudies,
    treatment.followUpDoctorVisits,
    treatment.painManagementVisits,
    treatment.orthopedicConsults,
    treatment.neurologyConsults,
    treatment.mentalHealthSessions,
    treatment.tpiInjections,
    treatment.facetInjections,
    treatment.mbbInjections,
    treatment.esiInjections,
    treatment.rfaInjections,
    treatment.prpInjections
  ].reduce((total, value) => total + Number(value || 0), 0);
}

function hasLifeSignal(data: InjuryCalculatorData) {
  return Boolean(
    Number(data.impact.missedWorkDays) > 0 ||
    data.impact.emotionalDistress ||
    data.impact.lossOfConsortium ||
    data.impact.permanentImpairment
  );
}

function describeTreatment(data: InjuryCalculatorData) {
  const count = treatmentSelectionCount(data);
  if (count > 0) return `${count} treatment item${count === 1 ? '' : 's'} selected`;
  if (data.treatment.surgeryRecommended || data.treatment.surgeryCompleted) return 'Surgery details added';
  if (data.treatment.ongoingTreatment) return 'Ongoing treatment noted';
  return 'Not added yet';
}

function buildProfileItems(data: InjuryCalculatorData, turnstileToken: string): ProfileItem[] {
  return [
    {
      label: 'Accident county',
      value: data.accidentDetails.county ? `${data.accidentDetails.county} County` : 'Not selected',
      complete: Boolean(data.accidentDetails.county)
    },
    {
      label: 'Accident timing',
      value: data.accidentDetails.dateOfAccident || 'Not selected',
      complete: Boolean(data.accidentDetails.dateOfAccident)
    },
    {
      label: 'Vehicle damage',
      value: data.accidentDetails.impactSeverity ? data.accidentDetails.impactSeverity : 'Not selected',
      complete: Boolean(data.accidentDetails.impactSeverity)
    },
    {
      label: 'Injury signal',
      value: bodyMapSummary(data.injuries.bodyMap),
      complete: Boolean(data.injuries.primaryInjury || data.injuries.bodyMap?.length)
    },
    {
      label: 'Treatment',
      value: describeTreatment(data),
      complete: hasTreatmentSignal(data)
    },
    {
      label: 'Work and life impact',
      value: hasLifeSignal(data) ? 'Impact details added' : 'Optional',
      complete: hasLifeSignal(data)
    },
    {
      label: 'Claim context',
      value: `${Number(data.accidentDetails.faultPercentage || 0)}% fault`,
      complete: true
    },
    {
      label: 'Human verification',
      value: turnstileToken ? 'Ready' : 'Pending',
      complete: Boolean(turnstileToken)
    }
  ];
}

function profileState(completedCount: number) {
  if (completedCount >= 7) return { label: 'Ready', helper: 'Your range can be prepared.', color: 'text-emerald-700' };
  if (completedCount >= 4) return { label: 'Useful', helper: 'A few details can sharpen the range.', color: 'text-sky-700' };
  return { label: 'Started', helper: 'Add quick facts to build momentum.', color: 'text-amber-700' };
}

function ProfileStrengthCard({ data, turnstileToken, currentStep }: {
  data: InjuryCalculatorData;
  turnstileToken: string;
  currentStep: number;
}) {
  const items = buildProfileItems(data, turnstileToken);
  const completedCount = items.filter((item) => item.complete).length;
  const strength = profileState(completedCount);
  const progressValue = Math.round((completedCount / items.length) * 100);
  const missingCount = items.filter((item) => !item.complete && item.label !== 'Human verification').length;

  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Case profile strength</CardTitle>
        <p className={`text-2xl font-semibold ${strength.color}`}>{strength.label}</p>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Progress value={progressValue} />
          <p className="text-sm text-muted-foreground">
            {missingCount > 0 ? `${missingCount} detail${missingCount === 1 ? '' : 's'} left to sharpen your range.` : strength.helper}
          </p>
        </div>

      <div className="flex flex-col gap-2">
        {items.map((item) => (
          <div key={item.label} className="flex items-start gap-2 rounded-lg bg-slate-50 px-3 py-2">
            <span className={`mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded-full ${
              item.complete ? 'bg-emerald-600 text-white' : 'bg-white text-slate-400 ring-1 ring-slate-200'
            }`}>
              {item.complete ? <Check className="h-3.5 w-3.5" /> : null}
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-medium text-slate-800">{item.label}</span>
              <span className="block truncate text-xs text-slate-500">{item.value}</span>
            </span>
          </div>
        ))}
      </div>

      <div className="rounded-lg border bg-muted/40 p-3 text-xs leading-5 text-muted-foreground">
        Step {currentStep} of {STEPS.length}: {STEPS[currentStep - 1].name}
      </div>
      </CardContent>
    </Card>
  );
}

function ReviewUnlockStep({ data, register, setValue, errors, turnstileToken, onTurnstileToken }: {
  data: InjuryCalculatorData;
  register: UseFormRegister<InjuryCalculatorData>;
  setValue: UseFormSetValue<InjuryCalculatorData>;
  errors: FieldErrors<InjuryCalculatorData>;
  turnstileToken: string;
  onTurnstileToken: (token: string) => void;
}) {
  const items = buildProfileItems(data, turnstileToken);
  const reviewItems = items.filter((item) => item.label !== 'Accident county').slice(0, 6);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold tracking-tight text-slate-950">Review and unlock</h2>

      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <label
          htmlFor="review-accident-county"
          className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-800"
        >
          <MapPin className="h-4 w-4 text-sky-700" />
          Accident county <span className="text-amber-600">*</span>
          <InfoIcon content="County is used for California-specific venue context, routing, and disclosure. It applies only a small estimate adjustment." />
        </label>
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
      </section>

      <div className="grid gap-4 lg:grid-cols-[1fr_0.9fr]">
        <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900">
            <ClipboardCheck className="h-4 w-4 text-emerald-700" />
            Your case profile
          </h3>
          <div className="space-y-2">
            {reviewItems.map((item) => (
              <div key={item.label} className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2">
                <span className="text-sm text-slate-600">{item.label}</span>
                <span className="max-w-[55%] truncate text-right text-sm font-medium text-slate-900">{item.value}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="relative overflow-hidden rounded-lg border border-emerald-200 bg-emerald-50 p-4 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Lock className="h-4 w-4 text-emerald-700" />
            <h3 className="text-sm font-semibold text-slate-950">Your range is ready</h3>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            {['Conservative', 'Most likely', 'Upper range'].map((label) => (
              <div key={label} className="rounded-lg border border-emerald-200 bg-white p-3">
                <p className="text-[11px] font-medium text-slate-500">{label}</p>
                <p className="mt-2 select-none text-lg font-semibold text-emerald-800 blur-sm" aria-hidden="true">$--,---</p>
              </div>
            ))}
          </div>
          <div className="absolute inset-x-4 bottom-4 rounded-lg border border-amber-200 bg-white/95 px-3 py-2 text-center text-xs font-semibold text-slate-800 shadow-sm">
            Verify your phone to view exact numbers.
          </div>
        </section>
      </div>

      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-start gap-3">
          <ShieldCheck className="mt-0.5 h-5 w-5 flex-none text-sky-700" />
          <div>
            <h3 className="text-sm font-semibold text-slate-950">Security check</h3>
          </div>
        </div>
        <TurnstileWidget onToken={onTurnstileToken} />
      </section>
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
  savedDraft,
  onResume,
  onStart,
  onStartOver
}: {
  savedDraft: CalculatorDraft | null;
  onResume: () => void;
  onStart: () => void;
  onStartOver: () => void;
}) {
  const trustPoints = [
    'California-specific claim factors',
    'Real-world claim insight, not generic guesswork',
    'Free to use. No gimmicks. No charge.',
    'No AI used to derive claim value',
    'Educational estimate, not legal or professional advice'
  ];

  return (
    <section
      aria-labelledby="calculator-start-heading"
      className="mx-auto max-w-4xl overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm"
    >
      <div className="grid gap-0 lg:grid-cols-[1fr_280px]">
        <div className="p-6 sm:p-8 lg:p-10">
          <h1
            id="calculator-start-heading"
            className="max-w-3xl text-3xl font-semibold leading-[1.05] tracking-tight text-slate-950 sm:text-5xl"
          >
            Estimate Your California Auto Injury Claim
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
            Answer a few guided questions to prepare an educational settlement range.
          </p>

          {savedDraft ? (
            <div className="mt-7 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
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
                  Resume saved estimate
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
            </div>
          ) : (
            <div className="mt-7">
              <Button
                type="button"
                onClick={onStart}
                size="lg"
                className="h-12 w-full bg-amber-500 px-5 text-base text-slate-950 hover:bg-amber-400 sm:w-auto"
              >
                Start my estimate
                <ArrowRight data-icon="inline-end" />
              </Button>
            </div>
          )}
        </div>

        <aside className="border-t border-slate-200 bg-slate-50 p-5 sm:p-6 lg:border-l lg:border-t-0">
          <div className="flex h-full flex-col justify-center gap-3">
            {trustPoints.map((point) => (
              <div key={point} className="flex items-center gap-3 rounded-lg bg-white px-3 py-3 ring-1 ring-slate-200">
                <span className="flex h-7 w-7 flex-none items-center justify-center rounded-full bg-emerald-700 text-white">
                  <Check className="h-4 w-4" aria-hidden="true" />
                </span>
                <span className="text-sm font-medium text-slate-800">{point}</span>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </section>
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

export default function SettlementCalculator() {
  const [hasStarted, setHasStarted] = useState(false);
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
  const [calculationError, setCalculationError] = useState<string | null>(null);
  const [isAbandonDialogOpen, setIsAbandonDialogOpen] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState('');
  const [bodyModel, setBodyModel] = useState<BodyMapGender | ''>('');
  const [stepTransition, setStepTransition] = useState<StepTransitionState>({
    active: false,
    direction: 'forward',
    targetStep: 1,
    message: ''
  });
  const stepTransitionLockedRef = useRef(false);
  const currentStepRef = useRef(currentStep);
  const hasStartedRef = useRef(hasStarted);

  const { register, handleSubmit, watch, setValue, trigger, setError, clearErrors, reset, getValues, formState: { errors } } = useForm<InjuryCalculatorData>({
    defaultValues: createDefaultCalculatorData()
  });

  const watchData = watch();

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
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

    writeCalculatorHistoryState('replaceState', { [HISTORY_STATE_KEY]: { view: 'landing' } });
  }, []);

  const pushStepHistory = useCallback((step: number) => {
    if (typeof window === 'undefined') return;

    writeCalculatorHistoryState('pushState', { [HISTORY_STATE_KEY]: { step: clampStep(step) } });
  }, []);

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
    setCalculationError(null);
    setTurnstileToken('');
    clearErrors();
  }, [clearErrors]);

  const requestAbandonReset = useCallback(() => {
    setIsAbandonDialogOpen(true);
  }, []);

  const resetCalculatorToStart = useCallback(() => {
    clearCalculatorDraft();
    reset(createDefaultCalculatorData());
    clearTransientState();
    setSavedDraft(null);
    setHasStarted(false);
    setCurrentStep(1);
    setBodyModel('');
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

  const resumeSavedDraft = useCallback(() => {
    if (!savedDraft) return;

    reset(savedDraft.data);
    clearTransientState();
    const restoredStep = clampStep(savedDraft.currentStep);
    setBodyModel(savedDraft.bodyModel);
    setCurrentStep(restoredStep);
    setHasStarted(true);
    setSavedDraft(null);
    seedStepHistory(restoredStep);
    scrollToTop();
  }, [clearTransientState, reset, savedDraft, scrollToTop, seedStepHistory]);

  const startCalculator = useCallback(() => {
    clearTransientState();
    setHasStarted(true);
    setCurrentStep(1);
    seedStepHistory(1);
    scrollToTop();
  }, [clearTransientState, scrollToTop, seedStepHistory]);

  useEffect(() => {
    currentStepRef.current = currentStep;
  }, [currentStep]);

  useEffect(() => {
    hasStartedRef.current = hasStarted;
  }, [hasStarted]);

  useEffect(() => {
    replaceHistoryWithLanding();
    setSavedDraft(readCalculatorDraft());
    setHasHydratedDraft(true);
  }, [replaceHistoryWithLanding]);

  useEffect(() => {
    if (!hasHydratedDraft) return;
    if (!hasStarted && !hasMeaningfulCalculatorProgress(watchData, bodyModel)) return;

    writeCalculatorDraft({
      version: DRAFT_VERSION,
      data: watchData,
      hasStarted,
      currentStep,
      bodyModel,
      savedAt: new Date().toISOString()
    });
  }, [bodyModel, currentStep, hasHydratedDraft, hasStarted, watchData]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleResetEvent = () => handleCalculatorResetRequest();
    window.addEventListener(CALCULATOR_RESET_EVENT, handleResetEvent);

    return () => window.removeEventListener(CALCULATOR_RESET_EVENT, handleResetEvent);
  }, [handleCalculatorResetRequest]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handlePopState = () => {
      if (!hasStartedRef.current) return;

      const activeStep = currentStepRef.current;

      if (activeStep > 1) {
        const previousStep = activeStep - 1;
        setCurrentStep(previousStep);
        setShowValidationError(false);
        setCalculationError(null);
        pushStepHistory(previousStep);
        scrollToTop();
        return;
      }

      requestAbandonReset();
      pushStepHistory(currentStepRef.current);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [pushStepHistory, requestAbandonReset, scrollToTop]);

  const onSubmit = async (data: InjuryCalculatorData) => {
    setCalculationError(null);

    try {
      if (!turnstileToken) {
        throw new Error('Please complete the security check before preparing your estimate.');
      }

      setIsCalculating(true);
      const requestPreview = async () => {
        const response = await fetch('/api/estimate/preview', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            calculatorData: data,
            turnstileToken,
            privacyChoiceSnapshot: readBrowserPrivacyChoices()
          })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Unable to prepare the estimate preview.');
        }

        return response.json() as Promise<EstimatePreviewResponse>;
      };

      const [previewResponse] = await Promise.all([
        requestPreview(),
        new Promise((resolve) => window.setTimeout(resolve, ESTIMATE_PREPARATION_MIN_MS))
      ]);
      setPreview(previewResponse);
      setResults(null);
      setShowResults(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      console.error('Calculation error:', error);
      setCalculationError(error instanceof Error ? error.message : 'Unable to prepare your estimate. Please try again.');
    } finally {
      setIsCalculating(false);
    }
  };

  const validateCurrentStep = async () => {
    switch (currentStep) {
      case 1:
        return trigger([
          'accidentDetails.dateOfAccident',
          'accidentDetails.impactSeverity'
        ]);
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
        return trigger([
          'demographics.age',
          'impact.missedWorkDays',
          'impact.impairmentRating'
        ]);
      case 5:
        return Boolean(turnstileToken);
      default:
        return true;
    }
  };

  const nextStep = async () => {
    if (stepTransitionLockedRef.current || stepTransition.active) return;
    stepTransitionLockedRef.current = true;

    const isValid = await validateCurrentStep();

    if (!isValid) {
      stepTransitionLockedRef.current = false;
      setShowValidationError(true);
      setTimeout(() => setShowValidationError(false), 3000);
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
      stepTransitionLockedRef.current = true;
      const targetStep = currentStep - 1;
      writeCalculatorHistoryState('replaceState', { [HISTORY_STATE_KEY]: { step: targetStep } });
      void runStepTransition(targetStep, 'back', 'Loading previous section');
    }
  };

  const handleCalculate = () => {
    handleSubmit(onSubmit)();
  };

  const liveProfileItems = buildProfileItems(watchData, turnstileToken);
  const liveCompletedCount = liveProfileItems.filter((item) => item.complete).length;
  const liveStrength = profileState(liveCompletedCount);
  const stepProgress = Math.round((currentStep / STEPS.length) * 100);
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
        <SettlementResults
          results={results}
          medicalCosts={results.medicalCosts}
          hasAttorney={watch('insurance.hasAttorney') || false}
          responsibleAttorney={responsibleAttorney}
          leadDeliveryStatus={leadDeliveryStatus}
          onBack={() => {
            setShowResults(false);
            setPreview(null);
            setCurrentStep(1);
            pushStepHistory(1);
          }}
          onEdit={() => {
            setShowResults(false);
            setPreview(null);
            setCurrentStep(5);
            pushStepHistory(5);
          }}
        />
        {abandonDialog}
      </>
    );
  }

  if (isCalculating) {
    return (
      <>
        <EstimatePreparationLoader />
        {abandonDialog}
      </>
    );
  }

  if (preview) {
    return (
      <>
        <SettlementPreviewGate
          preview={preview}
          onBack={() => {
            setPreview(null);
            setCurrentStep(5);
            pushStepHistory(5);
          }}
          onUnlocked={(unlockedResults, attorney, deliveryStatus) => {
            setResults(unlockedResults);
            setResponsibleAttorney(attorney);
            setLeadDeliveryStatus(deliveryStatus);
            setPreview(null);
            setShowResults(true);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />
        {abandonDialog}
      </>
    );
  }

  if (!hasStarted) {
    return (
      <>
        <StartCalculatorScreen
          savedDraft={savedDraft}
          onResume={resumeSavedDraft}
          onStart={startCalculator}
          onStartOver={requestAbandonReset}
        />
        {abandonDialog}
      </>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div className={`grid min-w-0 gap-5 ${currentStep === 1 ? 'grid-cols-1' : 'lg:grid-cols-[300px_1fr]'}`}>
        <div className={`${currentStep === 1 ? 'hidden' : 'hidden lg:sticky lg:top-4 lg:block lg:self-start'}`}>
          <ProfileStrengthCard data={watchData} turnstileToken={turnstileToken} currentStep={currentStep} />
        </div>

        <div className="relative min-w-0 w-full max-w-[calc(100vw-2rem)] overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm sm:max-w-none" data-form-container>
          <div className={cn(
            'border-b border-slate-200 bg-slate-50/80 p-4 transition duration-150',
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
              <div className="hidden shrink-0 items-center gap-1 sm:flex">
                {STEPS.map((step) => {
                  const Icon = step.icon;
                  return (
                    <div
                      key={step.id}
                      className={`flex h-8 w-8 items-center justify-center rounded-lg transition sm:h-9 sm:w-9 ${
                        currentStep >= step.id
                          ? 'bg-emerald-700 text-white'
                          : 'bg-white text-slate-400 ring-1 ring-slate-200'
                      }`}
                      title={step.name}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                  );
                })}
              </div>
            </div>
            <Progress
              value={stepProgress}
              aria-label={`Calculator progress: ${stepProgress}% complete`}
              className="mt-4 h-2 bg-slate-200"
              indicatorClassName="bg-emerald-700"
            />
            <div className="mt-4 hidden grid-cols-5 gap-2 text-xs font-medium text-slate-500 sm:grid">
              {STEPS.map((step) => (
                <span key={step.id} className={currentStep >= step.id ? 'text-emerald-800' : ''}>{step.shortName}</span>
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
            {currentStep === 1 && (
              <QuickFactsStep
                register={register}
                watch={watch}
                setValue={setValue}
                errors={errors}
                bodyModel={bodyModel}
                onBodyModelChange={setBodyModel}
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
              <WorkLifeStep register={register} watch={watch} setValue={setValue} errors={errors} />
            )}

            {currentStep === 5 && (
              <ReviewUnlockStep
                data={watchData}
                register={register}
                setValue={setValue}
                errors={errors}
                turnstileToken={turnstileToken}
                onTurnstileToken={setTurnstileToken}
              />
            )}

            <div className="sticky bottom-0 z-20 mt-8 rounded-lg border border-slate-200 bg-white/95 p-2 pb-[calc(0.5rem_+_env(safe-area-inset-bottom))] backdrop-blur sm:static sm:bg-slate-50 sm:pb-2 sm:backdrop-blur-0">
              <div className="flex w-full items-stretch gap-2">
                <Button
                  type="button"
                  onClick={prevStep}
                  disabled={stepTransition.active}
                  variant="outline"
                  size="lg"
                  className="h-12 min-w-0 flex-1 justify-center"
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
                    className="h-12 min-w-0 flex-1 justify-center bg-amber-500 text-slate-950 hover:bg-amber-400"
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
                    className="h-12 min-w-0 flex-1 justify-center bg-emerald-700 text-white hover:bg-emerald-600"
                  >
                    <Sparkles data-icon="inline-start" />
                    {isCalculating ? 'Preparing...' : 'Prepare secure preview'}
                  </Button>
                )}
              </div>
            </div>

            {showValidationError && (
              <Alert className="mt-4" variant="destructive">
                <AlertCircle data-icon="inline-start" />
                <AlertDescription>{currentStep === 5 ? 'Please complete the security check before preparing your estimate.' : 'Please complete the required fields before continuing.'}</AlertDescription>
              </Alert>
            )}

            {calculationError && (
              <Alert className="mt-4" variant="destructive">
                <AlertCircle data-icon="inline-start" />
                <AlertDescription>{calculationError}</AlertDescription>
              </Alert>
            )}
          </form>
          <StepTransitionOverlay transition={stepTransition} />
          {abandonDialog}
        </div>
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
