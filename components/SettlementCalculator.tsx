'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { 
  User, Calendar, Car, Stethoscope, BrainCircuit, 
  DollarSign, AlertCircle, ChevronRight, ChevronLeft,
  Briefcase, Heart, Shield
} from 'lucide-react';
import { InjuryCalculatorData, SettlementResult } from '@/types/calculator';
import DemographicsStep from './steps/DemographicsStep';
import AccidentStep from './steps/AccidentStep';
import InjuriesStep from './steps/InjuriesStep';
import TreatmentStep from './steps/TreatmentStep';
import ImpactStep from './steps/ImpactStep';
import InsuranceStep from './steps/InsuranceStep';
import SettlementResults from './SettlementResults';
import { calculateSettlement } from '@/lib/settlementCalculator';

const STEPS = [
  { id: 1, name: 'Demographics', icon: User },
  { id: 2, name: 'Accident Details', icon: Car },
  { id: 3, name: 'Injuries', icon: Stethoscope },
  { id: 4, name: 'Treatment', icon: BrainCircuit },
  { id: 5, name: 'Life Impact', icon: Heart },
  { id: 6, name: 'Insurance', icon: Shield },
];

function estimateMedicalCosts(treatment: InjuryCalculatorData['treatment']): number {
  let estimated = 0;
  
  // ER visits: $3,000-$8,000 (use lower end for estimates)
  estimated += treatment.emergencyRoomVisits * 3000;
  
  // Urgent care: $500-$1,000 (use lower end)
  estimated += treatment.urgentCareVisits * 500;
  
  // Chiro/PT sessions: $100-$200 (use lower end)
  estimated += (treatment.chiropracticSessions + treatment.physicalTherapySessions) * 100;
  
  // Imaging
  estimated += treatment.xrays * 500;
  estimated += treatment.mris * 2000;
  estimated += treatment.ctScans * 1500;
  
  // Specialist visits
  estimated += treatment.painManagementVisits * 750;
  estimated += treatment.orthopedicConsults * 750;
  
  // Injections
  if (treatment.injections > 0) {
    const injectionCost = treatment.injectionType === 'tpi' ? 2500 :
                         treatment.injectionType === 'facet' ? 5000 :
                         treatment.injectionType === 'esi' ? 7500 :
                         treatment.injectionType === 'rfa' ? 15000 : 5000;
    estimated += treatment.injections * injectionCost;
  }
  
  return estimated;
}

export default function SettlementCalculator() {
  const [currentStep, setCurrentStep] = useState(1);
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState<SettlementResult | null>(null);
  
  const { register, handleSubmit, control, watch, setValue, formState: { errors } } = useForm<InjuryCalculatorData>({
    defaultValues: {
      demographics: {
        age: 35,
        occupation: '',
        annualIncome: 50000,
      },
      accidentDetails: {
        dateOfAccident: '',
        faultPercentage: 0,
        priorAccidents: 0,
        impactSeverity: '',
      },
      injuries: {
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
          preExistingDegeneration: false,
        },
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
        injections: 0,
        injectionType: undefined,
        surgeryRecommended: false,
        surgeryCompleted: false,
        totalMedicalCosts: 0,
        useEstimatedCosts: false,
        ongoingTreatment: false,
      },
      impact: {
        missedWorkDays: 0,
        lossOfConsortium: false,
        emotionalDistress: false,
        dylanVLeggClaim: false,
        permanentImpairment: false,
      },
      insurance: {
        policyLimitsKnown: false,
        hasAttorney: false,
      },
    },
  });

  const onSubmit = (data: InjuryCalculatorData) => {
    const calculatedResults = calculateSettlement(data);
    setResults(calculatedResults);
    setShowResults(true);
  };

  const nextStep = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleCalculate = () => {
    handleSubmit(onSubmit)();
  };

  if (showResults && results) {
    return (
      <SettlementResults 
        results={results} 
        medicalCosts={results.medicalCosts}
        onBack={() => {
          setShowResults(false);
          setCurrentStep(1);
        }}
        onEdit={() => {
          setShowResults(false);
          // Keep the current step so user can continue where they left off
        }}
      />
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
      {/* Progress Bar */}
      <div className="bg-slate-100 p-4">
        <div className="flex items-center justify-between mb-4">
          {STEPS.map((step, index) => {
            const Icon = step.icon;
            return (
              <div key={step.id} className="flex items-center">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                  currentStep >= step.id 
                    ? 'bg-amber-500 text-white' 
                    : 'bg-slate-300 text-slate-500'
                }`}>
                  <Icon className="w-5 h-5" />
                </div>
                {index < STEPS.length - 1 && (
                  <div className={`w-12 sm:w-20 h-1 ${
                    currentStep > step.id ? 'bg-amber-500' : 'bg-slate-300'
                  }`} />
                )}
              </div>
            );
          })}
        </div>
        <p className="text-center text-sm font-medium text-slate-700">
          Step {currentStep} of {STEPS.length}: {STEPS[currentStep - 1].name}
        </p>
      </div>

      {/* Form Content */}
      <form onSubmit={handleSubmit(onSubmit)} className="p-6 md:p-8">
        {currentStep === 1 && (
          <DemographicsStep register={register} setValue={setValue} watch={watch} errors={errors} />
        )}
        
        {currentStep === 2 && (
          <AccidentStep register={register} watch={watch} errors={errors} />
        )}
        
        {currentStep === 3 && (
          <InjuriesStep register={register} control={control} watch={watch} errors={errors} />
        )}
        
        {currentStep === 4 && (
          <TreatmentStep register={register} watch={watch} errors={errors} />
        )}
        
        {currentStep === 5 && (
          <ImpactStep register={register} watch={watch} errors={errors} />
        )}
        
        {currentStep === 6 && (
          <InsuranceStep register={register} watch={watch} errors={errors} />
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8">
          <button
            type="button"
            onClick={prevStep}
            disabled={currentStep === 1}
            className={`flex items-center px-4 py-2 rounded-lg font-medium transition-colors ${
              currentStep === 1 
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                : 'bg-slate-200 text-slate-700 hover:bg-slate-300 cursor-pointer'
            }`}
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Previous
          </button>
          
          {currentStep < STEPS.length ? (
            <button
              type="button"
              onClick={nextStep}
              className="flex items-center px-4 py-2 bg-amber-500 text-white rounded-lg font-medium hover:bg-amber-600 transition-colors cursor-pointer"
            >
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleCalculate}
              className="flex items-center px-6 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors cursor-pointer"
            >
              <DollarSign className="w-4 h-4 mr-1" />
              Calculate Settlement
            </button>
          )}
        </div>
      </form>
    </div>
  );
}