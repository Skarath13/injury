'use client';

import { UseFormRegister, UseFormSetValue, UseFormWatch, FieldErrors } from 'react-hook-form';
import { InjuryCalculatorData } from '@/types/calculator';
import { User, Briefcase, DollarSign } from 'lucide-react';

interface Props {
  register: UseFormRegister<InjuryCalculatorData>;
  setValue: UseFormSetValue<InjuryCalculatorData>;
  watch: UseFormWatch<InjuryCalculatorData>;
  errors: FieldErrors<InjuryCalculatorData>;
}

export default function DemographicsStep({ register, setValue, watch, errors }: Props) {
  const annualIncome = watch('demographics.annualIncome');
  
  const formatCurrency = (value: number | string): string => {
    const numValue = typeof value === 'string' ? parseFloat(value.replace(/,/g, '')) : value;
    if (isNaN(numValue)) return '';
    return numValue.toLocaleString('en-US', { maximumFractionDigits: 0 });
  };
  
  const handleIncomeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^\d]/g, '');
    const numValue = parseInt(value) || 0;
    setValue('demographics.annualIncome', numValue);
  };
  
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Personal Information</h2>
        <p className="text-slate-600">Basic information helps estimate lost wages and life impact.</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="flex items-center text-sm font-medium text-slate-700 mb-2">
            <User className="w-4 h-4 mr-2 text-slate-400" />
            Age
          </label>
          <input
            type="number"
            {...register('demographics.age', { 
              required: 'Age is required',
              min: { value: 1, message: 'Invalid age' },
              max: { value: 120, message: 'Invalid age' }
            })}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            placeholder="35"
          />
          {errors.demographics?.age && (
            <p className="mt-1 text-sm text-red-600">{errors.demographics.age.message}</p>
          )}
        </div>

        <div>
          <label className="flex items-center text-sm font-medium text-slate-700 mb-2">
            <Briefcase className="w-4 h-4 mr-2 text-slate-400" />
            Occupation
          </label>
          <input
            type="text"
            {...register('demographics.occupation', { required: 'Occupation is required' })}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            placeholder="e.g., Teacher, Construction Worker, Office Manager"
          />
          {errors.demographics?.occupation && (
            <p className="mt-1 text-sm text-red-600">{errors.demographics.occupation.message}</p>
          )}
        </div>

        <div>
          <label className="flex items-center text-sm font-medium text-slate-700 mb-2">
            <DollarSign className="w-4 h-4 mr-2 text-slate-400" />
            Annual Income (Before Taxes)
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500">$</span>
            <input
              type="text"
              value={formatCurrency(annualIncome)}
              onChange={handleIncomeChange}
              className="w-full pl-8 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              placeholder="50,000"
            />
            <input
              type="hidden"
              {...register('demographics.annualIncome', { 
                required: 'Income is required',
                min: { value: 0, message: 'Invalid income' }
              })}
            />
          </div>
          {errors.demographics?.annualIncome && (
            <p className="mt-1 text-sm text-red-600">{errors.demographics.annualIncome.message}</p>
          )}
          <p className="mt-1 text-xs text-slate-500">
            Higher income typically results in higher lost wage claims
          </p>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>Why this matters:</strong> Age affects recovery time and future medical needs. 
          Occupation determines physical demands and lost wages. Income directly impacts economic damages.
        </p>
      </div>
    </div>
  );
}