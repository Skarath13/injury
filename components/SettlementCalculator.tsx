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
  KeyRound,
  Lock,
  MapPin,
  MessageSquare,
  Phone,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  X
} from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import {
  BodyMapGender,
  EstimateOnlyUnlockResponse,
  EstimatePreviewResponse,
  InjuryCalculatorData,
  ResponsibleAttorney,
  SettlementResult,
  UnlockStartResponse,
  UnlockVerifyResponse
} from '@/types/calculator';
import { deriveBodyMapOnlyInjuryFields } from '@/lib/bodyMapInjuries';
import { calculatorAgeFromDemographics } from '@/lib/demographics';
import { createDefaultGuidedInjurySignals } from '@/lib/guidedInjurySignals';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Field, FieldContent, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
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
  { id: 5, name: 'Unlock', shortName: 'Unlock', icon: FileLock2 }
];

const STEP_TRANSITION_MS = 1500;

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
  return {
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

function buildProfileItems(data: InjuryCalculatorData, turnstileToken: string, currentStep = 1): ProfileItem[] {
  return [
    {
      label: 'Quick Facts',
      complete: currentStep > 1 || Boolean(data.accidentDetails.dateOfAccident && data.accidentDetails.impactSeverity)
    },
    {
      label: 'Injury Signals',
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
      label: 'Security Check',
      complete: Boolean(turnstileToken)
    }
  ];
}

function profileState(completedCount: number) {
  if (completedCount >= 5) return { label: 'Ready', helper: 'Your range can be prepared.', color: 'text-emerald-700' };
  if (completedCount >= 3) return { label: 'Useful', helper: 'A few steps can sharpen the range.', color: 'text-sky-700' };
  return { label: 'Started', helper: 'Add quick facts to build momentum.', color: 'text-amber-700' };
}

function ProfileStrengthCard({ data, turnstileToken, currentStep }: {
  data: InjuryCalculatorData;
  turnstileToken: string;
  currentStep: number;
}) {
  const items = buildProfileItems(data, turnstileToken, currentStep);
  const completedCount = items.filter((item) => item.complete).length;
  const strength = profileState(completedCount);
  const progressValue = Math.round((completedCount / items.length) * 100);
  const missingCount = items.filter((item) => !item.complete).length;

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
            {missingCount > 0 ? `${missingCount} checklist item${missingCount === 1 ? '' : 's'} left.` : strength.helper}
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
              <span className="block text-xs text-slate-500">{item.complete ? 'Complete' : 'Pending'}</span>
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

function unlockStatusMessage(status: string) {
  switch (status) {
    case 'too_fast_no_delivery':
      return 'Estimate-only unlock is available. Phone verification is skipped because this form was completed before the 120-second lead-quality window.';
    case 'own_attorney_no_delivery':
      return 'Estimate-only unlock is available because you indicated you already have or plan to hire an attorney.';
    case 'unmapped_no_attorney_delivery':
    case 'preview_no_attorney':
      return 'Estimate-only unlock is available because no active attorney advertiser is configured for this county.';
    case 'outside_california_no_delivery':
      return 'Estimate-only unlock is available. Attorney delivery is limited to California visitors.';
    case 'outside_us_no_delivery':
      return 'Estimate-only unlock is available. Attorney delivery is limited to visitors in the United States and California.';
    case 'unknown_location_no_delivery':
      return 'Estimate-only unlock is available. We could not confirm California visitor eligibility for attorney delivery.';
    default:
      return 'Estimate-only unlock is available without phone verification.';
  }
}

function LockedRangePreview({ preview }: { preview: EstimatePreviewResponse | null }) {
  return (
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
          <div className="h-3 overflow-hidden rounded-full bg-gradient-to-r from-emerald-500 via-amber-400 to-red-500 shadow-inner" />
          <div className="mt-3 grid grid-cols-2 gap-3">
            {['Conservative', 'Upper Range'].map((label) => (
              <div key={label} className="rounded-lg border bg-white p-3">
                <p className="text-xs font-medium text-muted-foreground">{label}</p>
                <p className="mt-1 select-none text-xl font-semibold tracking-tight text-slate-950 blur-sm" aria-hidden="true">
                  $••,•••
                </p>
              </div>
            ))}
          </div>
        </div>
        <div className="flex items-center justify-between gap-3 text-xs font-medium text-muted-foreground">
          <span>Conservative</span>
          <span>Upper Range</span>
        </div>
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
  onUnlocked: (results: SettlementResult, attorney: ResponsibleAttorney | null, leadDeliveryStatus: string) => void;
  onResetPreview: () => void;
}) {
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [consent, setConsent] = useState(false);
  const [otpSent, setOtpSent] = useState<UnlockStartResponse | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isUnlockingEstimateOnly, setIsUnlockingEstimateOnly] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
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
      const response = await fetch('/api/estimate/unlock/estimate-only', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: preview.sessionId })
      });
      const payload: EstimateOnlyUnlockResponse & { error?: string } = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || 'Unable to unlock the estimate.');
      }

      onUnlocked(payload.results, payload.responsibleAttorney, payload.leadDeliveryStatus);
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
          phone,
          consentToAttorneyShare: consent,
          phoneContactConsent: consent
        })
      });
      const payload: UnlockStartResponse & { error?: string } = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || 'Unable to send verification code.');
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
      const payload: UnlockVerifyResponse & { error?: string } = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || 'Unable to verify code.');
      }

      onUnlocked(payload.results, payload.responsibleAttorney, payload.leadDeliveryStatus);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to verify code.');
    } finally {
      setIsVerifying(false);
    }
  };

  if (!preview) {
    return (
      <Card className="border-slate-200 bg-slate-50/70 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles data-icon="inline-start" className="text-amber-600" />
            Prepare preview
          </CardTitle>
          <CardDescription>
            Complete the security check, then prepare the secure preview to choose the right unlock path.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (preview.unlockMode === 'estimate_only') {
    return (
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

          {error && (
            <Alert variant="destructive">
              <AlertCircle data-icon="inline-start" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              type="button"
              size="lg"
              className="h-11 bg-emerald-700 text-white hover:bg-emerald-600"
              onClick={unlockEstimateOnly}
              disabled={isUnlockingEstimateOnly}
            >
              <Sparkles data-icon="inline-start" />
              {isUnlockingEstimateOnly ? 'Unlocking...' : 'Unlock estimate'}
            </Button>
            <Button type="button" size="lg" variant="outline" className="h-11" onClick={onResetPreview}>
              Edit answers
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const attorney = preview.responsibleAttorney;

  return (
    <Card className="border-slate-200 bg-white shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <MessageSquare data-icon="inline-start" className="text-sky-700" />
          Phone verification
        </CardTitle>
        <CardDescription>
          Verify your phone to unlock the range and send the inquiry to the listed attorney advertiser.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        {attorney && (
          <Card className="border-amber-200 bg-amber-50 shadow-none">
            <CardHeader>
              <CardTitle className="text-sm">Attorney advertising disclosure</CardTitle>
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
                    Send my results to {attorney.name}
                  </FieldLabel>
                  <FieldDescription>
                    I give permission to send my calculator results and contact information to {attorney.name}, State Bar No. {attorney.barNumber}. This does not create an attorney-client relationship.
                  </FieldDescription>
                </FieldContent>
              </Field>
            </CardContent>
          </Card>
        )}

        <FieldGroup>
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
                placeholder="(555) 555-5555"
              />
              <Button
                type="button"
                onClick={startUnlock}
                disabled={isSending || !phone || !consent}
                className="h-10 bg-emerald-700 text-white hover:bg-emerald-600"
              >
                {isSending ? 'Sending...' : 'Send code'}
              </Button>
            </div>
            <FieldDescription>
              We use the phone number for this one-time unlock and, only with consent, attorney follow-up.
            </FieldDescription>
          </Field>

          {otpSent && (
            <Field>
              <FieldLabel>
                <KeyRound data-icon="inline-start" />
                4-digit code
              </FieldLabel>
              <FieldDescription>
                Code sent to {otpSent.maskedPhone}.
                {otpSent.duplicateWithin30Days && ' This phone was already used for a recent attorney-delivery request, so any attorney lead is marked duplicate/no-charge.'}
                {otpSent.devCode && ` Development code: ${otpSent.devCode}.`}
              </FieldDescription>
              <div className="grid gap-3 md:grid-cols-[1fr_auto]">
                <InputOTP maxLength={4} value={code} onChange={setCode}>
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                  </InputOTPGroup>
                </InputOTP>
                <Button
                  type="button"
                  onClick={verifyCode}
                  disabled={isVerifying || code.length !== 4}
                  className="h-10 bg-sky-700 text-white hover:bg-sky-600"
                >
                  {isVerifying ? 'Verifying...' : 'Unlock estimate'}
                </Button>
              </div>
            </Field>
          )}
        </FieldGroup>

        {error && (
          <Alert variant="destructive">
            <AlertCircle data-icon="inline-start" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="flex flex-col gap-2 sm:flex-row">
          <Button type="button" size="lg" variant="outline" className="h-11" onClick={onResetPreview}>
            Edit answers
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function ReviewUnlockStep({ data, register, setValue, errors, turnstileToken, onTurnstileToken, preview, onUnlocked, onResetPreview }: {
  data: InjuryCalculatorData;
  register: UseFormRegister<InjuryCalculatorData>;
  setValue: UseFormSetValue<InjuryCalculatorData>;
  errors: FieldErrors<InjuryCalculatorData>;
  turnstileToken: string;
  onTurnstileToken: (token: string) => void;
  preview: EstimatePreviewResponse | null;
  onUnlocked: (results: SettlementResult, attorney: ResponsibleAttorney | null, leadDeliveryStatus: string) => void;
  onResetPreview: () => void;
}) {
  const items = buildProfileItems(data, turnstileToken, STEPS.length);
  const completedCount = items.filter((item) => item.complete).length;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Badge variant="secondary" className="w-fit">Unlock</Badge>
        <h2 className="text-2xl font-semibold tracking-tight text-slate-950">Unlock</h2>
        <p className="max-w-2xl text-sm leading-6 text-slate-600">
          Check the form steps, complete the security check, then unlock the educational range.
        </p>
      </div>

      {!preview && (
        <Card className="border-slate-200 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <MapPin data-icon="inline-start" className="text-sky-700" />
              Accident county <span className="text-amber-600">*</span>
              <InfoIcon content="County is used for California-specific venue context, routing, and disclosure. It applies only a small estimate adjustment." />
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
            {items.map((item) => (
              <div key={item.label} className="flex items-center gap-3 rounded-lg border bg-slate-50 px-3 py-3">
                <span className={cn(
                  'flex size-6 flex-none items-center justify-center rounded-full ring-1',
                  item.complete
                    ? 'bg-emerald-700 text-white ring-emerald-700'
                    : 'bg-white text-slate-400 ring-slate-200'
                )}>
                  {item.complete ? <Check className="size-4" aria-hidden="true" /> : null}
                </span>
                <span className="min-w-0 flex-1 text-sm font-medium text-slate-800">{item.label}</span>
                <Badge variant={item.complete ? 'secondary' : 'outline'}>
                  {item.complete ? 'Complete' : 'Pending'}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="flex flex-col gap-4">
          <LockedRangePreview preview={preview} />
          <UnlockActionPanel preview={preview} onUnlocked={onUnlocked} onResetPreview={onResetPreview} />
        </div>
      </div>

      {!preview && (
        <Card className="border-slate-200 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ShieldCheck data-icon="inline-start" className="text-sky-700" />
              Security check
            </CardTitle>
            <CardDescription>Complete this before preparing your secure preview.</CardDescription>
          </CardHeader>
          <CardContent>
            <TurnstileWidget onToken={onTurnstileToken} />
          </CardContent>
        </Card>
      )}
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

  const beginLeadQualityTimer = useCallback(async () => {
    try {
      await fetch('/api/estimate/start', {
        method: 'POST',
        cache: 'no-store'
      });
    } catch (error) {
      console.warn('Unable to start lead-quality timer:', error);
    }
  }, []);

  const resumeSavedDraft = useCallback(async () => {
    if (!savedDraft) return;

    reset(savedDraft.data);
    clearTransientState();
    await beginLeadQualityTimer();
    const restoredStep = clampStep(savedDraft.currentStep);
    setBodyModel(savedDraft.bodyModel);
    setCurrentStep(restoredStep);
    setHasStarted(true);
    setSavedDraft(null);
    seedStepHistory(restoredStep);
    scrollToTop();
  }, [beginLeadQualityTimer, clearTransientState, reset, savedDraft, scrollToTop, seedStepHistory]);

  const startCalculator = useCallback(async () => {
    clearTransientState();
    await beginLeadQualityTimer();
    setHasStarted(true);
    setCurrentStep(1);
    seedStepHistory(1);
    scrollToTop();
  }, [beginLeadQualityTimer, clearTransientState, scrollToTop, seedStepHistory]);

  useEffect(() => {
    currentStepRef.current = currentStep;
  }, [currentStep]);

  useEffect(() => {
    if (!hasStarted || preview || showResults) return;

    const scrollFrame = window.requestAnimationFrame(() => {
      window.scrollTo({ top: 0, behavior: 'auto' });
    });

    return () => window.cancelAnimationFrame(scrollFrame);
  }, [currentStep, hasStarted, preview, showResults]);

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
    const calculatorData = prepareCalculatorDataForEstimate(data);

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
            calculatorData,
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
        {
          const fields: Array<'demographics.dateOfBirth' | 'demographics.occupation' | 'demographics.annualIncome'> = [
            'demographics.dateOfBirth'
          ];
          if (watchData.impact.hasWageLoss) {
            fields.push('demographics.occupation', 'demographics.annualIncome');
          }

          const stepIsValid = await trigger(fields);
          if (stepIsValid) {
            setValue('demographics.age', calculatorAgeFromDemographics(watchData.demographics), {
              shouldDirty: true,
              shouldValidate: false
            });
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
      if (preview) {
        setPreview(null);
      }
      stepTransitionLockedRef.current = true;
      const targetStep = currentStep - 1;
      writeCalculatorHistoryState('replaceState', { [HISTORY_STATE_KEY]: { step: targetStep } });
      void runStepTransition(targetStep, 'back', 'Loading previous section');
    }
  };

  const handleCalculate = () => {
    handleSubmit(onSubmit)();
  };

  const liveProfileItems = buildProfileItems(watchData, turnstileToken, currentStep);
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
                preview={preview}
                onResetPreview={() => {
                  setPreview(null);
                  setCalculationError(null);
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
            )}

            {!preview && (
            <div className="mt-8 rounded-lg border border-slate-200 bg-slate-50 p-2">
              <div className="grid w-full grid-cols-2 items-center gap-2">
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
                    <Sparkles data-icon="inline-start" />
                    {isCalculating ? 'Preparing...' : 'Prepare secure preview'}
                  </Button>
                )}
              </div>
            </div>
            )}

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
