'use client';

import { UseFormRegister, UseFormWatch, FieldErrors } from 'react-hook-form';
import { InjuryCalculatorData } from '@/types/calculator';
import { Calendar, Car, AlertTriangle, Zap, AlertCircle } from 'lucide-react';
import InfoIcon from '@/components/InfoIcon';

interface Props {
  register: UseFormRegister<InjuryCalculatorData>;
  watch: UseFormWatch<InjuryCalculatorData>;
  errors: FieldErrors<InjuryCalculatorData>;
}

export default function AccidentStep({ register, watch, errors }: Props) {
  const today = new Date().toISOString().split('T')[0];
  
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Accident Details</h2>
        <p className="text-slate-600">Information about the accident and fault determination.</p>
        <p className="text-sm text-slate-500 mt-2">Fields marked with <span className="text-red-500">*</span> are required</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="flex items-center text-sm font-medium text-slate-700 mb-2">
            <Calendar className="w-4 h-4 mr-2 text-slate-400" />
            Date of Accident <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type="date"
              {...register('accidentDetails.dateOfAccident', { required: 'Accident date is required' })}
              max={today}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent cursor-pointer"
              placeholder="Click to select date"
            />
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
          {errors.accidentDetails?.dateOfAccident && (
            <p className="mt-1 text-sm text-red-600">{errors.accidentDetails.dateOfAccident.message}</p>
          )}
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700 mb-3 block">
            <Car className="w-4 h-4 inline mr-2 text-slate-400" />
            How much were YOU at fault?
            <InfoIcon content="In California, your fault percentage directly reduces your settlement. For example, if you're 30% at fault and damages are $100,000, you can only recover $70,000." />
          </label>
          
          <div className="bg-gradient-to-r from-green-50 to-red-50 rounded-lg p-5">
            <div className="text-center mb-4">
              <div className="text-3xl font-bold">
                <span className="text-slate-600">{watch('accidentDetails.faultPercentage') || 0}%</span>
                <span className="text-lg font-normal text-slate-500 ml-2">My Fault</span>
              </div>
              {watch('accidentDetails.faultPercentage') === 0 && (
                <p className="text-sm text-green-600 mt-1">Not at fault - Full recovery possible</p>
              )}
              {watch('accidentDetails.faultPercentage') > 0 && watch('accidentDetails.faultPercentage') <= 25 && (
                <p className="text-sm text-yellow-600 mt-1">Minor fault - Small reduction</p>
              )}
              {watch('accidentDetails.faultPercentage') > 25 && watch('accidentDetails.faultPercentage') <= 50 && (
                <p className="text-sm text-orange-600 mt-1">Partial fault - Significant reduction</p>
              )}
              {watch('accidentDetails.faultPercentage') > 50 && (
                <p className="text-sm text-red-600 mt-1">Majority fault - Major reduction</p>
              )}
            </div>
            
            <input
              type="range"
              {...register('accidentDetails.faultPercentage', {
                required: 'Fault percentage is required',
                min: 0,
                max: 100
              })}
              min="0"
              max="100"
              step="5"
              className="w-full mb-3"
            />
            
            <div className="flex justify-between text-xs font-medium">
              <span className="text-green-700">0%<br/>Not My Fault</span>
              <span className="text-yellow-700">25%</span>
              <span className="text-orange-700">50%</span>
              <span className="text-orange-800">75%</span>
              <span className="text-red-700">100%<br/>All My Fault</span>
            </div>
          </div>
          
          {errors.accidentDetails?.faultPercentage && (
            <p className="mt-2 text-sm text-red-600">{errors.accidentDetails.faultPercentage.message}</p>
          )}
          
        </div>

        <div>
          <label className="flex items-center text-sm font-medium text-slate-700 mb-2">
            <Zap className="w-4 h-4 mr-2 text-slate-400" />
            Impact Severity <span className="text-red-500">*</span>
            <InfoIcon content="Low impact collisions often result in lower settlements due to causation disputes. Higher severity impacts typically correlate with more serious injuries and higher settlements." />
          </label>
          <select
            {...register('accidentDetails.impactSeverity', { 
              required: 'Please select impact severity'
            })}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          >
            <option value="">Select impact severity...</option>
            <option value="low">Low Impact (Bumper tap, parking lot speed, &lt; 10 mph)</option>
            <option value="moderate">Moderate Impact (Visible damage, airbags may deploy, 10-30 mph)</option>
            <option value="severe">Severe Impact (Major damage, significant crush, 30-50 mph)</option>
            <option value="catastrophic">Catastrophic (Extreme forces, rollover/multi-impact, life-threatening)</option>
          </select>
          {errors.accidentDetails?.impactSeverity && (
            <p className="mt-1 text-sm text-red-600">{errors.accidentDetails.impactSeverity.message}</p>
          )}
        </div>

        <div>
          <label className="flex items-center text-sm font-medium text-slate-700 mb-2">
            <AlertTriangle className="w-4 h-4 mr-2 text-slate-400" />
            Prior Accidents (Last 5 Years) <span className="text-red-500">*</span>
            <InfoIcon content="Prior accidents can affect credibility and reduce settlement values. Insurers may argue that your injuries were pre-existing from previous accidents." />
          </label>
          <select
            {...register('accidentDetails.priorAccidents', { 
              required: 'Please select number of prior accidents'
            })}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          >
            <option value="">Select...</option>
            <option value="0">None</option>
            <option value="1">1 accident</option>
            <option value="2">2 accidents</option>
            <option value="3">3 accidents</option>
            <option value="4">4+ accidents</option>
          </select>
          {errors.accidentDetails?.priorAccidents && (
            <p className="mt-1 text-sm text-red-600">{errors.accidentDetails.priorAccidents.message}</p>
          )}
        </div>
      </div>

    </div>
  );
}