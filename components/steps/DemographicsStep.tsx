'use client';

import { UseFormRegister, UseFormSetValue, UseFormWatch, FieldErrors } from 'react-hook-form';
import { InjuryCalculatorData } from '@/types/calculator';
import { User, Briefcase, DollarSign } from 'lucide-react';
import InfoIcon from '@/components/InfoIcon';

interface Props {
  register: UseFormRegister<InjuryCalculatorData>;
  setValue: UseFormSetValue<InjuryCalculatorData>;
  watch: UseFormWatch<InjuryCalculatorData>;
  errors: FieldErrors<InjuryCalculatorData>;
}

export default function DemographicsStep({ register, setValue, watch, errors }: Props) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Personal Information</h2>
        <p className="text-slate-600">Basic information helps estimate lost wages and life impact.</p>
        <p className="text-sm text-slate-500 mt-2">Fields marked with <span className="text-red-500">*</span> are required</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="flex items-center text-sm font-medium text-slate-700 mb-2">
            <User className="w-4 h-4 mr-2 text-slate-400" />
            Age <span className="text-red-500">*</span>
            <InfoIcon content="Age affects recovery time and future medical needs. Younger victims may have longer future care needs, while older victims may have complications that increase settlements." />
          </label>
          <input
            type="number"
            {...register('demographics.age', { 
              required: 'Age is required',
              min: { value: 18, message: 'Must be at least 18' },
              max: { value: 100, message: 'Must be 100 or less' },
              valueAsNumber: true
            })}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            placeholder="35"
            min="18"
            max="100"
            step="1"
          />
          {errors.demographics?.age && (
            <p className="mt-1 text-sm text-red-600">{errors.demographics.age.message}</p>
          )}
        </div>

        <div>
          <label className="flex items-center text-sm font-medium text-slate-700 mb-2">
            <Briefcase className="w-4 h-4 mr-2 text-slate-400" />
            Occupation <span className="text-red-500">*</span>
            <InfoIcon content="Your occupation determines physical demands and lost wages. Physical jobs that you can't return to typically result in higher settlements due to career impact." />
          </label>
          <select
            {...register('demographics.occupation', { required: 'Occupation is required' })}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          >
            <option value="">Select occupation...</option>
            <option value="Professional/Office Worker">Professional/Office Worker</option>
            <option value="Healthcare Worker">Healthcare Worker</option>
            <option value="Education/Teacher">Education/Teacher</option>
            <option value="Construction/Manual Labor">Construction/Manual Labor</option>
            <option value="Transportation/Delivery">Transportation/Delivery</option>
            <option value="Retail/Service Industry">Retail/Service Industry</option>
            <option value="Self-Employed/Business Owner">Self-Employed/Business Owner</option>
            <option value="Retired">Retired</option>
            <option value="Other">Other</option>
          </select>
          {errors.demographics?.occupation && (
            <p className="mt-1 text-sm text-red-600">{errors.demographics.occupation.message}</p>
          )}
        </div>

        <div>
          <label className="flex items-center text-sm font-medium text-slate-700 mb-2">
            <DollarSign className="w-4 h-4 mr-2 text-slate-400" />
            Annual Income (Before Taxes) <span className="text-red-500">*</span>
            <InfoIcon content="Higher income typically results in higher lost wage claims. This directly impacts economic damages calculations in your settlement." />
          </label>
          <select
            {...register('demographics.annualIncome', { 
              required: 'Income is required',
              validate: value => (value && Number(value) > 0) || 'Please select an income range'
            })}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          >
            <option value="">Select income range...</option>
            <option value="20000">Under $25,000</option>
            <option value="37500">$25,000 - $50,000</option>
            <option value="62500">$50,000 - $75,000</option>
            <option value="87500">$75,000 - $100,000</option>
            <option value="125000">$100,000 - $150,000</option>
            <option value="175000">$150,000 - $200,000</option>
            <option value="250000">Over $200,000</option>
          </select>
          {errors.demographics?.annualIncome && (
            <p className="mt-1 text-sm text-red-600">{errors.demographics.annualIncome.message}</p>
          )}
        </div>
      </div>

    </div>
  );
}