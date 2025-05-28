'use client';

import { UseFormRegister, UseFormWatch, FieldErrors, UseFormSetValue } from 'react-hook-form';
import { InjuryCalculatorData } from '@/types/calculator';
import { 
  Stethoscope, Hospital, Scan, Pill, Syringe, 
  DollarSign, Activity, Heart, Plus, Minus
} from 'lucide-react';
import InfoIcon from '@/components/InfoIcon';

interface Props {
  register: UseFormRegister<InjuryCalculatorData>;
  watch: UseFormWatch<InjuryCalculatorData>;
  setValue: UseFormSetValue<InjuryCalculatorData>;
  errors: FieldErrors<InjuryCalculatorData>;
}

interface NumberInputProps {
  label: string;
  fieldName: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  color?: 'red' | 'blue' | 'purple' | 'green' | 'orange';
}

function NumberInput({ label, fieldName, value, onChange, min = 0, max = 999, color = 'blue' }: NumberInputProps) {
  const increment = () => {
    if (value < max) onChange(value + 1);
  };
  
  const decrement = () => {
    if (value > min) onChange(value - 1);
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseInt(e.target.value) || 0;
    if (newValue >= min && newValue <= max) {
      onChange(newValue);
    }
  };

  const colorClasses = {
    red: 'border-red-300 focus:ring-red-500 focus:border-red-500',
    blue: 'border-blue-300 focus:ring-blue-500 focus:border-blue-500',
    purple: 'border-purple-300 focus:ring-purple-500 focus:border-purple-500',
    green: 'border-green-300 focus:ring-green-500 focus:border-green-500',
    orange: 'border-orange-300 focus:ring-orange-500 focus:border-orange-500',
  };

  const buttonColorClasses = {
    red: 'text-red-600 hover:bg-red-100 border-red-300',
    blue: 'text-blue-600 hover:bg-blue-100 border-blue-300',
    purple: 'text-purple-600 hover:bg-purple-100 border-purple-300',
    green: 'text-green-600 hover:bg-green-100 border-green-300',
    orange: 'text-orange-600 hover:bg-orange-100 border-orange-300',
  };
  
  return (
    <div className="space-y-2">
      <label className="text-xs sm:text-sm font-medium text-slate-700 block leading-tight">
        {label}
      </label>
      <div className="flex items-center space-x-2">
        <button
          type="button"
          onClick={decrement}
          disabled={value <= min}
          className={`w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center border rounded-lg transition-colors ${buttonColorClasses[color]} ${
            value <= min ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
          }`}
        >
          <Minus className="w-3 h-3 sm:w-4 sm:h-4" />
        </button>
        
        <input
          type="number"
          value={value}
          onChange={handleInputChange}
          min={min}
          max={max}
          className={`w-16 sm:w-20 px-2 py-2 text-center border rounded-lg focus:ring-2 focus:outline-none transition-colors text-sm ${colorClasses[color]}`}
        />
        
        <button
          type="button"
          onClick={increment}
          disabled={value >= max}
          className={`w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center border rounded-lg transition-colors ${buttonColorClasses[color]} ${
            value >= max ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
          }`}
        >
          <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
        </button>
      </div>
    </div>
  );
}

export default function TreatmentStep({ register, watch, setValue, errors }: Props) {
  const surgeryRecommended = watch('treatment.surgeryRecommended');
  
  // Watch all the numeric fields
  const emergencyRoomVisits = watch('treatment.emergencyRoomVisits') || 0;
  const urgentCareVisits = watch('treatment.urgentCareVisits') || 0;
  const chiropracticSessions = watch('treatment.chiropracticSessions') || 0;
  const physicalTherapySessions = watch('treatment.physicalTherapySessions') || 0;
  const xrays = watch('treatment.xrays') || 0;
  const mris = watch('treatment.mris') || 0;
  const ctScans = watch('treatment.ctScans') || 0;
  const painManagementVisits = watch('treatment.painManagementVisits') || 0;
  const orthopedicConsults = watch('treatment.orthopedicConsults') || 0;
  const tpiInjections = watch('treatment.tpiInjections') || 0;
  const facetInjections = watch('treatment.facetInjections') || 0;
  const esiInjections = watch('treatment.esiInjections') || 0;
  const rfaInjections = watch('treatment.rfaInjections') || 0;
  const mbbInjections = watch('treatment.mbbInjections') || 0;
  const prpInjections = watch('treatment.prpInjections') || 0;
  
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Medical Treatment</h2>
        <p className="text-slate-600">Document all medical care received or recommended.</p>
        <p className="text-sm text-slate-500 mt-2">
          If you just had the accident and haven't received treatment yet, you can skip this section.
        </p>
      </div>

      <div className="space-y-6">
        {/* Emergency Care */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center">
            <Hospital className="w-4 h-4 mr-2 text-red-600" />
            Emergency & Urgent Care
            <InfoIcon content="ER visits: $3,000-$10,000 each. Urgent Care visits: $500-$1,000 each." />
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <NumberInput
              label="Emergency Room Visits"
              fieldName="treatment.emergencyRoomVisits"
              value={emergencyRoomVisits}
              onChange={(value) => setValue('treatment.emergencyRoomVisits', value)}
              color="red"
            />
            <NumberInput
              label="Urgent Care Visits"
              fieldName="treatment.urgentCareVisits"
              value={urgentCareVisits}
              onChange={(value) => setValue('treatment.urgentCareVisits', value)}
              color="red"
            />
          </div>
        </div>

        {/* Therapy Sessions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center">
            <Activity className="w-4 h-4 mr-2 text-blue-600" />
            Therapy & Rehabilitation
            <InfoIcon content="Chiropractic/Physical Therapy: $100-$200 per session" />
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <NumberInput
              label="Chiropractic Sessions"
              fieldName="treatment.chiropracticSessions"
              value={chiropracticSessions}
              onChange={(value) => setValue('treatment.chiropracticSessions', value)}
              color="blue"
            />
            <NumberInput
              label="Physical Therapy Sessions"
              fieldName="treatment.physicalTherapySessions"
              value={physicalTherapySessions}
              onChange={(value) => setValue('treatment.physicalTherapySessions', value)}
              color="blue"
            />
          </div>
        </div>

        {/* Imaging */}
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center">
            <Scan className="w-4 h-4 mr-2 text-purple-600" />
            Diagnostic Imaging
            <InfoIcon content="X-rays: $500-$1,500. MRI: $1,500-$3,000. CT Scan: $1,000-$6,000." />
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
            <NumberInput
              label="X-Rays"
              fieldName="treatment.xrays"
              value={xrays}
              onChange={(value) => setValue('treatment.xrays', value)}
              color="purple"
            />
            <NumberInput
              label="MRIs"
              fieldName="treatment.mris"
              value={mris}
              onChange={(value) => setValue('treatment.mris', value)}
              color="purple"
            />
            <NumberInput
              label="CT Scans"
              fieldName="treatment.ctScans"
              value={ctScans}
              onChange={(value) => setValue('treatment.ctScans', value)}
              color="purple"
            />
          </div>
        </div>

        {/* Specialist Care */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center">
            <Stethoscope className="w-4 h-4 mr-2 text-green-600" />
            Specialist Treatment
            <InfoIcon content="Specialist visits: $500-$1,500 each" />
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <NumberInput
              label="Pain Management Visits"
              fieldName="treatment.painManagementVisits"
              value={painManagementVisits}
              onChange={(value) => setValue('treatment.painManagementVisits', value)}
              color="green"
            />
            <NumberInput
              label="Orthopedic Consults"
              fieldName="treatment.orthopedicConsults"
              value={orthopedicConsults}
              onChange={(value) => setValue('treatment.orthopedicConsults', value)}
              color="green"
            />
          </div>
          
          <div className="mt-6">
            <h4 className="text-sm font-medium text-slate-700 mb-4 flex items-center">
              <Syringe className="w-4 h-4 mr-2 text-green-600" />
              Injections Received
              <InfoIcon content="TPIs: $1,500-$3,500. Facet/MBB: $3,000-$7,000. ESIs: $5,000-$10,000. RFA: $10,000-$20,000. PRP: $1,000-$3,000." />
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <NumberInput
                label="Trigger Point Injections (TPIs)"
                fieldName="treatment.tpiInjections"
                value={tpiInjections}
                onChange={(value) => setValue('treatment.tpiInjections', value)}
                color="green"
              />
              <NumberInput
                label="Facet Joint Injections"
                fieldName="treatment.facetInjections"
                value={facetInjections}
                onChange={(value) => setValue('treatment.facetInjections', value)}
                color="green"
              />
              <NumberInput
                label="Epidural Steroid Injections (ESIs)"
                fieldName="treatment.esiInjections"
                value={esiInjections}
                onChange={(value) => setValue('treatment.esiInjections', value)}
                color="green"
              />
              <NumberInput
                label="Radiofrequency Ablation (RFA)"
                fieldName="treatment.rfaInjections"
                value={rfaInjections}
                onChange={(value) => setValue('treatment.rfaInjections', value)}
                color="green"
              />
              <NumberInput
                label="Medial Branch Blocks (MBB)"
                fieldName="treatment.mbbInjections"
                value={mbbInjections}
                onChange={(value) => setValue('treatment.mbbInjections', value)}
                color="green"
              />
              <NumberInput
                label="Platelet Rich Plasma (PRP)"
                fieldName="treatment.prpInjections"
                value={prpInjections}
                onChange={(value) => setValue('treatment.prpInjections', value)}
                color="green"
              />
            </div>
          </div>
        </div>

        {/* Surgery */}
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-slate-700 mb-3">Surgery
            <InfoIcon content="Surgery: $30,000-$150,000+. Settlement value is based on total treatment, not just costs." />
          </h3>
          <div className="space-y-3">
            <label className="flex items-start space-x-3 cursor-pointer">
              <input
                type="checkbox"
                {...register('treatment.surgeryRecommended')}
                className="w-4 h-4 text-orange-600 border-slate-300 rounded focus:ring-orange-500 mt-0.5"
              />
              <span className="text-sm text-slate-700">Surgery Recommended by Doctor</span>
            </label>
            
            {surgeryRecommended && (
              <>
                <label className="flex items-start space-x-3 cursor-pointer ml-7">
                  <input
                    type="checkbox"
                    {...register('treatment.surgeryCompleted')}
                    className="w-4 h-4 text-orange-600 border-slate-300 rounded focus:ring-orange-500 mt-0.5"
                  />
                  <span className="text-sm text-slate-700">Surgery Completed</span>
                </label>
                
                <div className="ml-7 mt-3">
                  <label className="text-sm font-medium text-slate-700 mb-2 block">
                    Surgery Type/Cost Range
                  </label>
                  <select
                    {...register('treatment.surgeryType')}
                    className="w-full px-3 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm"
                  >
                    <option value="">Select surgery type...</option>
                    <option value="minor">Minor Surgery ($30,000 - $50,000) - Arthroscopy, carpal tunnel, etc.</option>
                    <option value="moderate">Moderate Surgery ($50,000 - $100,000) - Disc surgery, joint repair, etc.</option>
                    <option value="major">Major Surgery ($100,000 - $150,000+) - Spinal fusion, joint replacement, etc.</option>
                  </select>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Medical Costs */}
        <div>
          <label className="flex items-center text-sm font-medium text-slate-700 mb-3">
            <DollarSign className="w-4 h-4 mr-2 text-slate-400" />
            Total Medical Bills (To Date)
            <InfoIcon content="Include all medical bills, even if paid by insurance" />
          </label>
          
          <div className="mb-4">
            <label className="flex items-start space-x-3 cursor-pointer">
              <input
                type="checkbox"
                {...register('treatment.useEstimatedCosts')}
                className="w-4 h-4 text-amber-500 border-slate-300 rounded focus:ring-amber-500 mt-0.5"
              />
              <span className="text-sm text-slate-700 leading-relaxed">
                I don't know my exact bills - use estimated amount based on my treatment
              </span>
            </label>
          </div>
          
          {!watch('treatment.useEstimatedCosts') ? (
            <>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500">$</span>
                <input
                  type="number"
                  {...register('treatment.totalMedicalCosts', { 
                    required: !watch('treatment.useEstimatedCosts') ? 'Medical costs are required' : false,
                    min: { value: 0, message: 'Invalid amount' }
                  })}
                  className="w-full pl-8 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm"
                  placeholder="15000"
                />
              </div>
              {errors.treatment?.totalMedicalCosts && (
                <p className="mt-1 text-sm text-red-600">{errors.treatment.totalMedicalCosts.message}</p>
              )}
            </>
          ) : (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800 font-medium mb-2">
                Estimated medical costs will be calculated based on:
              </p>
              <ul className="text-xs sm:text-sm text-blue-700 space-y-1 leading-relaxed">
                <li>• ER visits: $3,000-$8,000 each</li>
                <li>• Urgent Care visits: $500-$1,000 each</li>
                <li>• Chiro/PT sessions: $100-$200 each</li>
                <li>• Imaging (X-ray/MRI/CT): $500-$6,000 each</li>
                <li>• Specialist visits: $500-$1,500 each</li>
                <li>• Injections: Based on type selected</li>
              </ul>
            </div>
          )}
        </div>

        {/* Ongoing Treatment */}
        <div>
          <label className="flex items-start space-x-3 cursor-pointer">
            <input
              type="checkbox"
              {...register('treatment.ongoingTreatment')}
              className="w-4 h-4 text-amber-500 border-slate-300 rounded focus:ring-amber-500 mt-0.5"
            />
            <span className="text-sm font-medium text-slate-700">
              Still receiving treatment / Future treatment planned
            </span>
          </label>
        </div>
      </div>

    </div>
  );
}