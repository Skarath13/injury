'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { 
  User, Calendar, Car, Stethoscope, BrainCircuit, 
  DollarSign, AlertCircle, ChevronRight, ChevronLeft,
  Briefcase, Heart, Shield, Calculator
} from 'lucide-react';
import { InjuryCalculatorData, SettlementResult } from '@/types/calculator';
import DemographicsStep from './steps/DemographicsStep';
import AccidentStep from './steps/AccidentStep';
import InjuriesStep from './steps/InjuriesStep';
import TreatmentStep from './steps/TreatmentStep';
import ImpactInsuranceStep from './steps/ImpactInsuranceStep';
import SettlementResults from './SettlementResults';

const STEPS = [
  { id: 1, name: 'Demographics', icon: User },
  { id: 2, name: 'Accident Details', icon: Car },
  { id: 3, name: 'Injuries', icon: Stethoscope },
  { id: 4, name: 'Treatment', icon: BrainCircuit },
  { id: 5, name: 'Impact & Legal', icon: Briefcase },
];

function estimateMedicalCosts(treatment: InjuryCalculatorData['treatment']): number {
  let estimated = 0;
  
  // ER visits: $3,000-$8,000 (use lower end for estimates)
  estimated += treatment.emergencyRoomVisits * 3000;
  
  // Urgent care: $500-$1,000 (use lower end)
  estimated += treatment.urgentCareVisits * 500;
  
  // Chiro/PT sessions: $100-$200 (use lower end)
  estimated += (treatment.chiropracticSessions + treatment.physicalTherapySessions) * 100;
  
  // Imaging - updated CT scan to use higher estimate
  estimated += treatment.xrays * 500;
  estimated += treatment.mris * 2000;
  estimated += treatment.ctScans * 3000; // Updated to mid-range of $1,000-$6,000
  
  // Specialist visits - updated to mid-range
  estimated += treatment.painManagementVisits * 1000;
  estimated += treatment.orthopedicConsults * 1000;
  
  // Injections - now handle individual types
  estimated += treatment.tpiInjections * 2500;
  estimated += treatment.facetInjections * 5000;
  estimated += treatment.mbbInjections * 5000; // Same as facet
  estimated += treatment.esiInjections * 7500;
  estimated += treatment.rfaInjections * 15000;
  estimated += treatment.prpInjections * 2000; // Mid-range of $1,000-$3,000
  
  // Surgery costs based on type
  if (treatment.surgeryRecommended && treatment.surgeryType) {
    const surgeryCost = treatment.surgeryType === 'minor' ? 40000 :
                       treatment.surgeryType === 'moderate' ? 75000 :
                       treatment.surgeryType === 'major' ? 125000 : 0;
    estimated += surgeryCost;
  }
  
  return estimated;
}

interface Props {
  showIntroContent?: boolean;
}

export default function SettlementCalculator({ showIntroContent = true }: Props) {
  const [currentStep, setCurrentStep] = useState(1);
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState<SettlementResult | null>(null);
  const [showValidationError, setShowValidationError] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [calculationError, setCalculationError] = useState<string | null>(null);
  
  const { register, handleSubmit, control, watch, setValue, trigger, formState: { errors } } = useForm<InjuryCalculatorData>({
    defaultValues: {
      demographics: {
        age: 35,
        occupation: '',
        annualIncome: 0,
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
        tpiInjections: 0,
        facetInjections: 0,
        mbbInjections: 0,
        esiInjections: 0,
        rfaInjections: 0,
        prpInjections: 0,
        surgeryRecommended: false,
        surgeryCompleted: false,
        surgeryType: undefined,
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

  const onSubmit = async (data: InjuryCalculatorData) => {
    setIsCalculating(true);
    setCalculationError(null);
    
    try {
      const response = await fetch('/api/calculate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Calculation failed');
      }
      
      const calculatedResults: SettlementResult = await response.json();
      setResults(calculatedResults);
      setShowResults(true);
      // Scroll to top when results are shown
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      console.error('Calculation error:', error);
      setCalculationError(error instanceof Error ? error.message : 'Unable to calculate settlement. Please try again.');
    } finally {
      setIsCalculating(false);
    }
  };

  const watchData = watch();
  
  const validateCurrentStep = async () => {
    // Trigger validation for current step
    const isValid = await trigger();
    
    // Additional custom validation for specific steps
    switch (currentStep) {
      case 1: // Demographics - all fields required
        return isValid && 
               watchData.demographics?.age > 0 &&
               watchData.demographics?.occupation?.trim() !== '' && 
               watchData.demographics?.annualIncome > 0;
      
      case 2: // Accident Details - date and severity required
        return isValid && 
               watchData.accidentDetails?.dateOfAccident !== '' && 
               watchData.accidentDetails?.impactSeverity !== '' &&
               watchData.accidentDetails?.priorAccidents !== undefined;
      
      case 3: // Injuries - primary injury required
        return isValid && watchData.injuries?.primaryInjury !== '';
      
      case 4: // Treatment - optional (they may have just had accident)
        return true;
      
      case 5: // Impact & Legal - optional but recommended
        return true; // Allow navigation even if empty
      
      default:
        return true;
    }
  };

  const scrollToTop = () => {
    // Scroll to the very top of the page for each step navigation
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

  if (showResults && results) {
    return (
      <SettlementResults 
        results={results} 
        medicalCosts={results.medicalCosts}
        hasAttorney={watch('insurance.hasAttorney') || false}
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
    <div className="space-y-6">
      {/* Header Content - Only show on first step */}
      {currentStep === 1 && (
        <div className="text-center space-y-6">
          <header id="page-header">
            <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-3 sm:mb-4 leading-tight">
              California Auto Injury Settlement Calculator
            </h1>
            <p className="text-lg sm:text-xl text-slate-600 mb-2 sm:mb-3">
              Get a realistic estimate of your potential settlement
            </p>
            <p className="text-sm sm:text-base text-slate-500 max-w-2xl mx-auto leading-relaxed">
              Based on actual insurance industry data and practices. This tool provides realistic ranges, 
              not inflated promises. Remember: most soft tissue injuries settle between $5,000-$25,000.
            </p>
          </header>
          
          <aside className="bg-amber-50 border border-amber-200 rounded-lg p-4 sm:p-5" role="complementary">
            <p className="text-sm sm:text-base text-amber-800 leading-relaxed">
              <strong>Disclaimer:</strong> This calculator provides estimates only. Actual settlements vary based on 
              numerous factors. Consult with a qualified attorney for legal advice specific to your case.
            </p>
          </aside>
        </div>
      )}
      
      {/* Form Container */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden" data-form-container>
      {/* Progress Bar */}
      <div className="bg-slate-100 p-4">
        <div className="flex justify-center mb-6 px-4">
          <div className="flex items-center max-w-md mx-auto">
            {STEPS.map((step, index) => {
              const Icon = step.icon;
              return (
                <React.Fragment key={step.id}>
                  <div className={`flex items-center justify-center w-10 h-10 md:w-12 md:h-12 rounded-full transition-all duration-200 ${
                    currentStep >= step.id 
                      ? 'bg-amber-500 text-white shadow-md' 
                      : 'bg-slate-300 text-slate-500'
                  }`}>
                    <Icon className="w-4 h-4 md:w-5 md:h-5" />
                  </div>
                  {index < STEPS.length - 1 && (
                    <div className={`w-8 md:w-12 h-1 transition-all duration-300 ${
                      currentStep > step.id ? 'bg-amber-500' : 'bg-slate-300'
                    }`} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
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
          <TreatmentStep register={register} watch={watch} setValue={setValue} errors={errors} />
        )}
        
        {currentStep === 5 && (
          <ImpactInsuranceStep register={register} watch={watch} errors={errors} />
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8 gap-3">
          <button
            type="button"
            onClick={prevStep}
            disabled={currentStep === 1}
            className={`flex items-center px-4 sm:px-5 py-3 sm:py-2 rounded-lg font-medium transition-colors text-sm sm:text-base ${
              currentStep === 1 
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                : 'bg-slate-200 text-slate-700 hover:bg-slate-300 cursor-pointer'
            }`}
          >
            <ChevronLeft className="w-4 h-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Previous</span>
            <span className="sm:hidden">Back</span>
          </button>
          
          {currentStep < STEPS.length ? (
            <button
              type="button"
              onClick={nextStep}
              className="flex items-center px-4 sm:px-5 py-3 sm:py-2 bg-amber-500 text-white rounded-lg font-medium hover:bg-amber-600 transition-colors cursor-pointer text-sm sm:text-base"
            >
              Next
              <ChevronRight className="w-4 h-4 ml-1 sm:ml-2" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleCalculate}
              disabled={isCalculating}
              className={`flex items-center px-4 sm:px-6 py-3 sm:py-2 rounded-lg font-medium transition-colors text-sm sm:text-base ${
                isCalculating 
                  ? 'bg-green-400 text-white cursor-not-allowed' 
                  : 'bg-green-600 text-white hover:bg-green-700 cursor-pointer'
              }`}
            >
              <Calculator className="w-4 h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">{isCalculating ? 'Calculating...' : 'Calculate Settlement'}</span>
              <span className="sm:hidden">{isCalculating ? 'Calculating...' : 'Calculate'}</span>
            </button>
          )}
        </div>
        
        {/* Validation Error Message */}
        {showValidationError && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center">
            <AlertCircle className="w-5 h-5 text-red-600 mr-2 flex-shrink-0" />
            <p className="text-sm text-red-700">
              Please fill in all required fields before continuing.
            </p>
          </div>
        )}
        
        {/* Calculation Error Message */}
        {calculationError && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center">
            <AlertCircle className="w-5 h-5 text-red-600 mr-2 flex-shrink-0" />
            <p className="text-sm text-red-700">
              {calculationError}
            </p>
          </div>
        )}
      </form>
      </div>
    </div>
  );
}