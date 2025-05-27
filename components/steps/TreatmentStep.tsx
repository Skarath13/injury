'use client';

import { UseFormRegister, UseFormWatch, FieldErrors } from 'react-hook-form';
import { InjuryCalculatorData } from '@/types/calculator';
import { 
  Stethoscope, Hospital, Scan, Pill, Syringe, 
  DollarSign, Activity, Heart
} from 'lucide-react';

interface Props {
  register: UseFormRegister<InjuryCalculatorData>;
  watch: UseFormWatch<InjuryCalculatorData>;
  errors: FieldErrors<InjuryCalculatorData>;
}

export default function TreatmentStep({ register, watch, errors }: Props) {
  const surgeryRecommended = watch('treatment.surgeryRecommended');
  
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Medical Treatment</h2>
        <p className="text-slate-600">Document all medical care received or recommended.</p>
      </div>

      <div className="space-y-6">
        {/* Emergency Care */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center">
            <Hospital className="w-4 h-4 mr-2 text-red-600" />
            Emergency & Urgent Care
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">
                Emergency Room Visits
              </label>
              <input
                type="number"
                {...register('treatment.emergencyRoomVisits', { min: 0 })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                placeholder="0"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">
                Urgent Care Visits
              </label>
              <input
                type="number"
                {...register('treatment.urgentCareVisits', { min: 0 })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                placeholder="0"
              />
            </div>
          </div>
        </div>

        {/* Therapy Sessions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center">
            <Activity className="w-4 h-4 mr-2 text-blue-600" />
            Therapy & Rehabilitation
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">
                Chiropractic Sessions
              </label>
              <input
                type="number"
                {...register('treatment.chiropracticSessions', { min: 0 })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                placeholder="0"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">
                Physical Therapy Sessions
              </label>
              <input
                type="number"
                {...register('treatment.physicalTherapySessions', { min: 0 })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                placeholder="0"
              />
            </div>
          </div>
        </div>

        {/* Imaging */}
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center">
            <Scan className="w-4 h-4 mr-2 text-purple-600" />
            Diagnostic Imaging
          </h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">
                X-Rays
              </label>
              <input
                type="number"
                {...register('treatment.xrays', { min: 0 })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                placeholder="0"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">
                MRIs
              </label>
              <input
                type="number"
                {...register('treatment.mris', { min: 0 })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                placeholder="0"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">
                CT Scans
              </label>
              <input
                type="number"
                {...register('treatment.ctScans', { min: 0 })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                placeholder="0"
              />
            </div>
          </div>
        </div>

        {/* Specialist Care */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center">
            <Stethoscope className="w-4 h-4 mr-2 text-green-600" />
            Specialist Treatment
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">
                Pain Management Visits
              </label>
              <input
                type="number"
                {...register('treatment.painManagementVisits', { min: 0 })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                placeholder="0"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">
                Orthopedic Consults
              </label>
              <input
                type="number"
                {...register('treatment.orthopedicConsults', { min: 0 })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                placeholder="0"
              />
            </div>
          </div>
          <div className="mt-4 space-y-3">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">
                <Syringe className="w-4 h-4 inline mr-1 text-green-600" />
                Number of Injections
              </label>
              <input
                type="number"
                {...register('treatment.injections', { min: 0 })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                placeholder="0"
              />
            </div>
            {watch('treatment.injections') > 0 && (
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1 block">
                  Primary Injection Type
                </label>
                <select
                  {...register('treatment.injectionType')}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                >
                  <option value="">Select type...</option>
                  <option value="tpi">Trigger Point Injections (TPIs) - $1,500-$3,500</option>
                  <option value="facet">Facet Joint Injections - $3,000-$7,000</option>
                  <option value="esi">Epidural Steroid Injections (ESIs) - $5,000-$10,000</option>
                  <option value="rfa">Radiofrequency Ablation (RFA) - $10,000-$20,000</option>
                  <option value="mixed">Mixed Types (Varies)</option>
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Surgery */}
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-slate-700 mb-3">Surgery</h3>
          <div className="space-y-3">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                {...register('treatment.surgeryRecommended')}
                className="w-4 h-4 text-orange-600 border-slate-300 rounded focus:ring-orange-500"
              />
              <span className="text-sm text-slate-700">Surgery Recommended by Doctor</span>
            </label>
            
            {surgeryRecommended && (
              <label className="flex items-center space-x-2 cursor-pointer ml-6">
                <input
                  type="checkbox"
                  {...register('treatment.surgeryCompleted')}
                  className="w-4 h-4 text-orange-600 border-slate-300 rounded focus:ring-orange-500"
                />
                <span className="text-sm text-slate-700">Surgery Completed</span>
              </label>
            )}
          </div>
        </div>

        {/* Medical Costs */}
        <div>
          <label className="flex items-center text-sm font-medium text-slate-700 mb-2">
            <DollarSign className="w-4 h-4 mr-2 text-slate-400" />
            Total Medical Bills (To Date)
          </label>
          
          <div className="mb-3">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                {...register('treatment.useEstimatedCosts')}
                className="w-4 h-4 text-amber-500 border-slate-300 rounded focus:ring-amber-500"
              />
              <span className="text-sm text-slate-700">
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
                  className="w-full pl-8 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  placeholder="15000"
                />
              </div>
              {errors.treatment?.totalMedicalCosts && (
                <p className="mt-1 text-sm text-red-600">{errors.treatment.totalMedicalCosts.message}</p>
              )}
              <p className="mt-1 text-xs text-slate-500">
                Include all medical bills, even if paid by insurance
              </p>
            </>
          ) : (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Estimated medical costs will be calculated based on:</strong>
              </p>
              <ul className="mt-2 text-sm text-blue-700 space-y-1">
                <li>• ER visits: $3,000-$8,000 each</li>
                <li>• Urgent Care visits: $500-$1,000 each</li>
                <li>• Chiro/PT sessions: $100-$200 each</li>
                <li>• Imaging (X-ray/MRI/CT): $500-$2,500 each</li>
                <li>• Specialist visits: $500-$1,000 each</li>
                <li>• Injections: Based on type selected</li>
              </ul>
            </div>
          )}
        </div>

        {/* Ongoing Treatment */}
        <div>
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              {...register('treatment.ongoingTreatment')}
              className="w-4 h-4 text-amber-500 border-slate-300 rounded focus:ring-amber-500"
            />
            <span className="text-sm font-medium text-slate-700">
              Still receiving treatment / Future treatment planned
            </span>
          </label>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <p className="text-sm text-amber-800">
          <strong>Treatment Cost Guide:</strong> ER visits: $3,000-$10,000 each. 
          Chiro/PT: $100-$200 per session. MRI: $1,500-$3,000. 
          Surgery: $30,000-$150,000+. Remember: Settlement value is based on total treatment, not just costs.
        </p>
      </div>
    </div>
  );
}