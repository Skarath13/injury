'use client';

import React, { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import {
  Activity,
  AlertCircle,
  ArrowRight,
  Briefcase,
  Check,
  ChevronLeft,
  ClipboardCheck,
  FileLock2,
  Lock,
  MapPin,
  ShieldCheck,
  Sparkles,
  Stethoscope
} from 'lucide-react';
import { BodyMapGender, EstimatePreviewResponse, InjuryCalculatorData, ResponsibleAttorney, SettlementResult } from '@/types/calculator';
import { bodyMapSummary } from '@/lib/bodyMapInjuries';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import QuickFactsStep from './steps/QuickFactsStep';
import InjuriesStep from './steps/InjuriesStep';
import TreatmentStep from './steps/TreatmentStep';
import WorkLifeStep from './steps/WorkLifeStep';
import SettlementResults from './SettlementResults';
import SettlementPreviewGate from './SettlementPreviewGate';
import TurnstileWidget from './TurnstileWidget';
import EstimatePreparationLoader, { ESTIMATE_PREPARATION_MIN_MS } from './EstimatePreparationLoader';

const STEPS = [
  { id: 1, name: 'Quick Facts', shortName: 'Facts', icon: MapPin },
  { id: 2, name: 'Injury Signals', shortName: 'Injury', icon: Stethoscope },
  { id: 3, name: 'Treatment So Far', shortName: 'Care', icon: Activity },
  { id: 4, name: 'Work & Daily Life', shortName: 'Life', icon: Briefcase },
  { id: 5, name: 'Review & Unlock', shortName: 'Unlock', icon: FileLock2 }
];

interface Props {
  showIntroContent?: boolean;
}

interface ProfileItem {
  label: string;
  value: string;
  complete: boolean;
}

function hasTreatmentSignal(data: InjuryCalculatorData) {
  const treatment = data.treatment;
  return Boolean(
    treatment.useEstimatedCosts ||
    Number(treatment.totalMedicalCosts) > 0 ||
    treatment.emergencyRoomVisits ||
    treatment.urgentCareVisits ||
    treatment.chiropracticSessions ||
    treatment.physicalTherapySessions ||
    treatment.xrays ||
    treatment.mris ||
    treatment.ctScans ||
    treatment.painManagementVisits ||
    treatment.orthopedicConsults ||
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

function hasLifeSignal(data: InjuryCalculatorData) {
  return Boolean(
    Number(data.impact.missedWorkDays) > 0 ||
    data.impact.emotionalDistress ||
    data.impact.lossOfConsortium ||
    data.impact.permanentImpairment ||
    data.demographics.annualIncome ||
    data.demographics.occupation
  );
}

function describeTreatment(data: InjuryCalculatorData) {
  if (data.treatment.useEstimatedCosts) return 'Estimate bills from treatment';
  if (Number(data.treatment.totalMedicalCosts) > 0) return `$${Number(data.treatment.totalMedicalCosts).toLocaleString()} bills entered`;
  if (hasTreatmentSignal(data)) return 'Treatment details entered';
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
      label: 'Treatment so far',
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

function ReviewUnlockStep({ data, turnstileToken, onTurnstileToken }: {
  data: InjuryCalculatorData;
  turnstileToken: string;
  onTurnstileToken: (token: string) => void;
}) {
  const items = buildProfileItems(data, turnstileToken);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold tracking-tight text-slate-950">Review and unlock</h2>

      <div className="grid gap-4 lg:grid-cols-[1fr_0.9fr]">
        <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900">
            <ClipboardCheck className="h-4 w-4 text-emerald-700" />
            Your case profile
          </h3>
          <div className="space-y-2">
            {items.slice(0, 7).map((item) => (
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

export default function SettlementCalculator({ showIntroContent = true }: Props) {
  const [currentStep, setCurrentStep] = useState(1);
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState<SettlementResult | null>(null);
  const [preview, setPreview] = useState<EstimatePreviewResponse | null>(null);
  const [responsibleAttorney, setResponsibleAttorney] = useState<ResponsibleAttorney | null>(null);
  const [leadDeliveryStatus, setLeadDeliveryStatus] = useState<string | null>(null);
  const [showValidationError, setShowValidationError] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [calculationError, setCalculationError] = useState<string | null>(null);
  const [turnstileToken, setTurnstileToken] = useState('');
  const [bodyModel, setBodyModel] = useState<BodyMapGender>('male');

  const { register, handleSubmit, watch, setValue, trigger, formState: { errors } } = useForm<InjuryCalculatorData>({
    defaultValues: {
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
        emergencyRoomVisits: 0,
        urgentCareVisits: 0,
        chiropracticSessions: 0,
        physicalTherapySessions: 0,
        xrays: 0,
        mris: 0,
        ctScans: 0,
        painManagementVisits: 0,
        orthopedicConsults: 0,
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
    }
  });

  const watchData = watch();

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
            turnstileToken
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
          'accidentDetails.county',
          'accidentDetails.dateOfAccident',
          'accidentDetails.impactSeverity'
        ]);
      case 2:
        return trigger('injuries.primaryInjury');
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

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const nextStep = async () => {
    const isValid = await validateCurrentStep();

    if (!isValid) {
      setShowValidationError(true);
      setTimeout(() => setShowValidationError(false), 3000);
      return;
    }

    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
      scrollToTop();
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      scrollToTop();
    }
  };

  const handleCalculate = () => {
    handleSubmit(onSubmit)();
  };

  const nextButtonLabel = useMemo(() => {
    if (currentStep === 1) return 'Save quick facts';
    if (currentStep === 4) return 'Review and unlock';
    return 'Continue';
  }, [currentStep]);
  const liveProfileItems = buildProfileItems(watchData, turnstileToken);
  const liveCompletedCount = liveProfileItems.filter((item) => item.complete).length;
  const liveStrength = profileState(liveCompletedCount);

  if (showResults && results) {
    return (
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
        }}
        onEdit={() => {
          setShowResults(false);
          setPreview(null);
          setCurrentStep(5);
        }}
      />
    );
  }

  if (isCalculating) {
    return <EstimatePreparationLoader />;
  }

  if (preview) {
    return (
      <SettlementPreviewGate
        preview={preview}
        onBack={() => {
          setPreview(null);
          setCurrentStep(5);
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
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      {showIntroContent && currentStep === 1 && (
        <section className="min-w-0">
          <div className="flex min-w-0 w-full max-w-[calc(100vw-2rem)] items-center rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:max-w-none sm:p-7 lg:p-10">
            <header id="page-header">
              <h1 className="text-3xl font-semibold leading-[1.05] tracking-tight text-slate-950 sm:text-5xl">
                <span className="block">Estimate Your California</span>
                <span className="block">Auto Injury Claim</span>
              </h1>
            </header>
          </div>
        </section>
      )}

      <div className={`grid min-w-0 gap-5 ${currentStep === 1 ? 'grid-cols-1' : 'lg:grid-cols-[300px_1fr]'}`}>
        <div className={`${currentStep === 1 ? 'hidden' : 'hidden lg:sticky lg:top-4 lg:block lg:self-start'}`}>
          <ProfileStrengthCard data={watchData} turnstileToken={turnstileToken} currentStep={currentStep} />
        </div>

        <div className="min-w-0 w-full max-w-[calc(100vw-2rem)] overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm sm:max-w-none" data-form-container>
          <div className="border-b border-slate-200 bg-slate-50/80 p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-700">
                  {STEPS[currentStep - 1].name} · <span className={liveStrength.color}>{liveStrength.label}</span>
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
            <div className="mt-4 hidden grid-cols-5 gap-2 text-xs font-medium text-slate-500 sm:grid">
              {STEPS.map((step) => (
                <span key={step.id} className={currentStep >= step.id ? 'text-emerald-800' : ''}>{step.shortName}</span>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="p-5 sm:p-7">
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
                bodyModel={bodyModel}
              />
            )}

            {currentStep === 3 && (
              <TreatmentStep register={register} watch={watch} setValue={setValue} errors={errors} />
            )}

            {currentStep === 4 && (
              <WorkLifeStep register={register} watch={watch} setValue={setValue} errors={errors} />
            )}

            {currentStep === 5 && (
              <ReviewUnlockStep data={watchData} turnstileToken={turnstileToken} onTurnstileToken={setTurnstileToken} />
            )}

            <div className="sticky bottom-0 z-20 mt-8 rounded-lg border border-slate-200 bg-white/95 p-3 backdrop-blur sm:static sm:bg-slate-50 sm:backdrop-blur-0">
              <div className="flex items-center justify-between gap-3">
                <Button
                  type="button"
                  onClick={prevStep}
                  disabled={currentStep === 1}
                  variant="outline"
                  size="lg"
                >
                  <ChevronLeft data-icon="inline-start" />
                  Back
                </Button>

                {currentStep < STEPS.length ? (
                  <Button
                    type="button"
                    onClick={nextStep}
                    size="lg"
                    className="flex-1 bg-amber-500 text-slate-950 hover:bg-amber-400 sm:flex-none"
                  >
                    {nextButtonLabel}
                    <ArrowRight data-icon="inline-end" />
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={handleCalculate}
                    disabled={isCalculating}
                    size="lg"
                    className="flex-1 bg-emerald-700 text-white hover:bg-emerald-600 sm:flex-none"
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
        </div>
      </div>

    </div>
  );
}
