import { UseFormRegister, Control, UseFormWatch, FieldErrors } from 'react-hook-form';
import { Controller } from 'react-hook-form';
import { InjuryCalculatorData, COMMON_INJURIES, COMMON_FRACTURES, PRE_EXISTING_CONDITIONS } from '@/types/calculator';
import { Stethoscope, Brain, Bone, AlertCircle } from 'lucide-react';
import InfoIcon from '@/components/InfoIcon';

interface Props {
  register: UseFormRegister<InjuryCalculatorData>;
  control: Control<InjuryCalculatorData>;
  watch: UseFormWatch<InjuryCalculatorData>;
  errors: FieldErrors<InjuryCalculatorData>;
}

export default function InjuriesStep({ register, control, watch, errors }: Props) {
  const hasTBI = watch('injuries.tbi');
  
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Injury Details</h2>
        <p className="text-slate-600">Select all injuries diagnosed by medical professionals.</p>
        <p className="text-sm text-slate-500 mt-2">Fields marked with <span className="text-red-500">*</span> are required</p>
      </div>

      <div className="space-y-6">
        {/* Primary Injury */}
        <div>
          <label className="flex items-center text-sm font-medium text-slate-700 mb-2">
            <Stethoscope className="w-4 h-4 mr-2 text-slate-400" />
            Primary Injury (Most Significant) <span className="text-red-500">*</span>
            <InfoIcon content="Soft tissue injuries (whiplash, strains) rarely exceed $25,000. Fractures and herniations can reach $50,000-$150,000. Surgery cases may exceed $200,000." />
          </label>
          <select
            {...register('injuries.primaryInjury', { required: 'Please select primary injury' })}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          >
            <option value="">Select primary injury...</option>
            {COMMON_INJURIES.map(injury => (
              <option key={injury} value={injury}>{injury}</option>
            ))}
          </select>
          {errors.injuries?.primaryInjury && (
            <p className="mt-1 text-sm text-red-600">{errors.injuries.primaryInjury.message}</p>
          )}
        </div>

        {/* Secondary Injuries */}
        <div>
          <label className="text-sm font-medium text-slate-700 mb-2 block">
            Additional Injuries (Check all that apply)
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {COMMON_INJURIES.map(injury => (
              <label key={injury} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  value={injury}
                  {...register('injuries.secondaryInjuries')}
                  className="w-4 h-4 text-amber-500 border-slate-300 rounded focus:ring-amber-500"
                />
                <span className="text-sm text-slate-700">{injury}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Fractures */}
        <div>
          <label className="flex items-center text-sm font-medium text-slate-700 mb-2">
            <Bone className="w-4 h-4 mr-2 text-slate-400" />
            Fractures (Check all that apply)
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {COMMON_FRACTURES.map(fracture => (
              <label key={fracture} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  value={fracture}
                  {...register('injuries.fractures')}
                  className="w-4 h-4 text-amber-500 border-slate-300 rounded focus:ring-amber-500"
                />
                <span className="text-sm text-slate-700">{fracture}</span>
              </label>
            ))}
          </div>
        </div>

        {/* TBI Section */}
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <label className="flex items-center space-x-2 cursor-pointer mb-3">
            <input
              type="checkbox"
              {...register('injuries.tbi')}
              className="w-4 h-4 text-purple-600 border-slate-300 rounded focus:ring-purple-500"
            />
            <span className="flex items-center text-sm font-medium text-slate-700">
              <Brain className="w-4 h-4 mr-2 text-purple-600" />
              Traumatic Brain Injury (TBI) / Concussion
            </span>
          </label>
          
          {hasTBI && (
            <div className="ml-6">
              <label className="text-sm font-medium text-slate-700 mb-2 block">
                TBI Severity
              </label>
              <select
                {...register('injuries.tbiSeverity')}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="">Select severity...</option>
                <option value="mild">Mild (Concussion)</option>
                <option value="moderate">Moderate</option>
                <option value="severe">Severe</option>
              </select>
            </div>
          )}
        </div>

        {/* Spinal Issues */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-slate-700 mb-3">Spinal Issues</h4>
          <div className="space-y-2">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                {...register('injuries.spinalIssues.herniation')}
                className="w-4 h-4 text-red-600 border-slate-300 rounded focus:ring-red-500"
              />
              <span className="text-sm text-slate-700">Disc Herniation</span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                {...register('injuries.spinalIssues.nerveRootCompression')}
                className="w-4 h-4 text-red-600 border-slate-300 rounded focus:ring-red-500"
              />
              <span className="text-sm text-slate-700">Nerve Root Compression</span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                {...register('injuries.spinalIssues.radiculopathy')}
                className="w-4 h-4 text-red-600 border-slate-300 rounded focus:ring-red-500"
              />
              <span className="text-sm text-slate-700">Radiculopathy (Nerve Pain)</span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                {...register('injuries.spinalIssues.myelopathy')}
                className="w-4 h-4 text-red-600 border-slate-300 rounded focus:ring-red-500"
              />
              <span className="text-sm text-slate-700">Myelopathy (Spinal Cord Compression)</span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                {...register('injuries.spinalIssues.preExistingDegeneration')}
                className="w-4 h-4 text-red-600 border-slate-300 rounded focus:ring-red-500"
              />
              <span className="text-sm text-slate-700">Pre-existing Degeneration (Aggravated)</span>
            </label>
          </div>
        </div>

        {/* Pre-existing Conditions */}
        <div>
          <label className="flex items-center text-sm font-medium text-slate-700 mb-2">
            <AlertCircle className="w-4 h-4 mr-2 text-slate-400" />
            Pre-existing Conditions
            <InfoIcon content="Pre-existing conditions typically reduce settlement values by 20-50%" />
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {PRE_EXISTING_CONDITIONS.map(condition => (
              <label key={condition} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  value={condition}
                  {...register('injuries.preExistingConditions')}
                  className="w-4 h-4 text-amber-500 border-slate-300 rounded focus:ring-amber-500"
                />
                <span className="text-sm text-slate-700">{condition}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}