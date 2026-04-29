'use client';

import { UseFormRegister, UseFormWatch, FieldErrors, UseFormSetValue } from 'react-hook-form';
import { InjuryCalculatorData } from '@/types/calculator';
import { 
  Stethoscope, Hospital, Scan, Pill, Syringe, 
  DollarSign, Activity, Heart, Plus, Minus
} from 'lucide-react';
import InfoIcon from '@/components/InfoIcon';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Field, FieldContent, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { NativeSelect } from '@/components/ui/native-select';

interface Props {
  register: UseFormRegister<InjuryCalculatorData>;
  watch: UseFormWatch<InjuryCalculatorData>;
  setValue: UseFormSetValue<InjuryCalculatorData>;
  errors: FieldErrors<InjuryCalculatorData>;
}

interface NumberInputProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  color?: 'red' | 'blue' | 'purple' | 'green' | 'orange';
}

function NumberInput({ label, value, onChange, min = 0, max = 999 }: NumberInputProps) {
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

  return (
    <Field>
      <FieldLabel>{label}</FieldLabel>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="icon-lg"
          onClick={decrement}
          disabled={value <= min}
          aria-label={`Decrease ${label}`}
        >
          <Minus />
        </Button>
        
        <Input
          type="number"
          value={value}
          onChange={handleInputChange}
          min={min}
          max={max}
          className="w-20 text-center"
        />
        
        <Button
          type="button"
          variant="outline"
          size="icon-lg"
          onClick={increment}
          disabled={value >= max}
          aria-label={`Increase ${label}`}
        >
          <Plus />
        </Button>
      </div>
    </Field>
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
  const surgeryCompleted = watch('treatment.surgeryCompleted');
  const useEstimatedCosts = watch('treatment.useEstimatedCosts');
  const ongoingTreatment = watch('treatment.ongoingTreatment');
  
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold tracking-tight text-slate-950">Treatment so far</h2>
        <p className="max-w-2xl text-sm leading-6 text-slate-600">
          Add what you know. If you do not have bills yet, use the treatment-based estimate option and keep moving.
        </p>
      </div>

      <div className="space-y-6">
        {/* Emergency Care */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center">
            <Hospital className="w-4 h-4 mr-2 text-red-600" />
            Emergency & Urgent Care
            <InfoIcon content="Used to estimate medical specials when exact bills are not available." />
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <NumberInput
              label="Emergency Room Visits"
              value={emergencyRoomVisits}
              onChange={(value) => setValue('treatment.emergencyRoomVisits', value)}
              color="red"
            />
            <NumberInput
              label="Urgent Care Visits"
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
            <InfoIcon content="Therapy volume can affect the treatment profile used by the estimate." />
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <NumberInput
              label="Chiropractic Sessions"
              value={chiropracticSessions}
              onChange={(value) => setValue('treatment.chiropracticSessions', value)}
              color="blue"
            />
            <NumberInput
              label="Physical Therapy Sessions"
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
            <InfoIcon content="Imaging can add treatment cost and objective injury context." />
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
            <NumberInput
              label="X-Rays"
              value={xrays}
              onChange={(value) => setValue('treatment.xrays', value)}
              color="purple"
            />
            <NumberInput
              label="MRIs"
              value={mris}
              onChange={(value) => setValue('treatment.mris', value)}
              color="purple"
            />
            <NumberInput
              label="CT Scans"
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
            <InfoIcon content="Specialist care is one treatment signal in the calculation." />
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <NumberInput
              label="Pain Management Visits"
              value={painManagementVisits}
              onChange={(value) => setValue('treatment.painManagementVisits', value)}
              color="green"
            />
            <NumberInput
              label="Orthopedic Consults"
              value={orthopedicConsults}
              onChange={(value) => setValue('treatment.orthopedicConsults', value)}
              color="green"
            />
          </div>
          
          <div className="mt-6">
            <h4 className="text-sm font-medium text-slate-700 mb-4 flex items-center">
              <Syringe className="w-4 h-4 mr-2 text-green-600" />
              Injections Received
              <InfoIcon content="Injection types are used as treatment and severity signals in the estimate." />
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <NumberInput
                label="Trigger Point Injections (TPIs)"
                value={tpiInjections}
                onChange={(value) => setValue('treatment.tpiInjections', value)}
                color="green"
              />
              <NumberInput
                label="Facet Joint Injections"
                value={facetInjections}
                onChange={(value) => setValue('treatment.facetInjections', value)}
                color="green"
              />
              <NumberInput
                label="Epidural Steroid Injections (ESIs)"
                value={esiInjections}
                onChange={(value) => setValue('treatment.esiInjections', value)}
                color="green"
              />
              <NumberInput
                label="Radiofrequency Ablation (RFA)"
                value={rfaInjections}
                onChange={(value) => setValue('treatment.rfaInjections', value)}
                color="green"
              />
              <NumberInput
                label="Medial Branch Blocks (MBB)"
                value={mbbInjections}
                onChange={(value) => setValue('treatment.mbbInjections', value)}
                color="green"
              />
              <NumberInput
                label="Platelet Rich Plasma (PRP)"
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
            <InfoIcon content="Surgery recommendation or completion can change the case tier. Settlement value still depends on the full fact pattern." />
          </h3>
          <div className="flex flex-col gap-3">
            <Field orientation="horizontal">
              <Checkbox
                id="surgeryRecommended"
                checked={surgeryRecommended}
                onCheckedChange={(checked) => setValue('treatment.surgeryRecommended', checked === true, { shouldDirty: true })}
              />
              <FieldLabel htmlFor="surgeryRecommended">Surgery recommended by doctor</FieldLabel>
            </Field>
            
            {surgeryRecommended && (
              <>
                <Field orientation="horizontal" className="ml-7">
                  <Checkbox
                    id="surgeryCompleted"
                    checked={surgeryCompleted}
                    onCheckedChange={(checked) => setValue('treatment.surgeryCompleted', checked === true, { shouldDirty: true })}
                  />
                  <FieldLabel htmlFor="surgeryCompleted">Surgery completed</FieldLabel>
                </Field>
                
                <Field className="ml-7 mt-3">
                  <FieldLabel>Surgery type/cost range</FieldLabel>
                  <NativeSelect
                    {...register('treatment.surgeryType')}
                    className="w-full"
                  >
                    <option value="">Select surgery type...</option>
                    <option value="minor">Minor Surgery ($30,000 - $50,000) - Arthroscopy, carpal tunnel, etc.</option>
                    <option value="moderate">Moderate Surgery ($50,000 - $100,000) - Disc surgery, joint repair, etc.</option>
                    <option value="major">Major Surgery ($100,000 - $150,000+) - Spinal fusion, joint replacement, etc.</option>
                  </NativeSelect>
                </Field>
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
            <Field orientation="horizontal">
              <Checkbox
                id="useEstimatedCosts"
                checked={useEstimatedCosts}
                onCheckedChange={(checked) => setValue('treatment.useEstimatedCosts', checked === true, { shouldDirty: true, shouldValidate: true })}
              />
              <FieldContent>
                <FieldLabel htmlFor="useEstimatedCosts">I don't know my exact bills</FieldLabel>
                <FieldDescription>Use estimated amount based on my treatment.</FieldDescription>
              </FieldContent>
            </Field>
          </div>
          
          {!useEstimatedCosts ? (
            <>
              <Field data-invalid={Boolean(errors.treatment?.totalMedicalCosts)}>
                <FieldLabel>Total medical bills</FieldLabel>
                <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500">$</span>
                <Input
                  type="number"
                  {...register('treatment.totalMedicalCosts', { 
                    required: !useEstimatedCosts ? 'Medical costs are required' : false,
                    min: { value: 0, message: 'Invalid amount' }
                  })}
                  className="pl-8"
                  placeholder="15000"
                  aria-invalid={Boolean(errors.treatment?.totalMedicalCosts)}
                />
                </div>
                <FieldError>{errors.treatment?.totalMedicalCosts?.message}</FieldError>
              </Field>
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
          <Field orientation="horizontal">
            <Checkbox
              id="ongoingTreatment"
              checked={ongoingTreatment}
              onCheckedChange={(checked) => setValue('treatment.ongoingTreatment', checked === true, { shouldDirty: true })}
            />
            <FieldLabel htmlFor="ongoingTreatment">Still receiving treatment / future treatment planned</FieldLabel>
          </Field>
        </div>
      </div>

    </div>
  );
}
