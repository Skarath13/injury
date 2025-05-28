import { UseFormRegister, UseFormWatch, FieldErrors } from 'react-hook-form';
import { InjuryCalculatorData } from '@/types/calculator';
import { 
  Briefcase, Heart, Brain, Scale, 
  AlertTriangle, Shield, DollarSign
} from 'lucide-react';
import InfoIcon from '@/components/InfoIcon';

interface Props {
  register: UseFormRegister<InjuryCalculatorData>;
  watch: UseFormWatch<InjuryCalculatorData>;
  errors: FieldErrors<InjuryCalculatorData>;
}

export default function ImpactInsuranceStep({ register, watch, errors }: Props) {
  const permanentImpairment = watch('impact.permanentImpairment');
  const policyLimitsKnown = watch('insurance.policyLimitsKnown');
  const hasAttorney = watch('insurance.hasAttorney');
  
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Life Impact & Legal</h2>
        <p className="text-slate-600">How the accident has affected your life and legal considerations.</p>
      </div>

      {/* Life Impact Section */}
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-slate-800 border-b border-slate-200 pb-2">Life Impact</h3>
        
        {/* Work Impact */}
        <div>
          <label className="flex items-center text-sm font-medium text-slate-700 mb-2">
            <Briefcase className="w-4 h-4 mr-2 text-slate-400" />
            Total Work Days Missed
            <InfoIcon content="Include partial days and future expected missed days" />
          </label>
          <input
            type="number"
            {...register('impact.missedWorkDays', { 
              required: 'Please enter missed work days',
              min: { value: 0, message: 'Invalid number' }
            })}
            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            placeholder="0"
          />
          {errors.impact?.missedWorkDays && (
            <p className="mt-1 text-sm text-red-600">{errors.impact.missedWorkDays.message}</p>
          )}
        </div>

        {/* Emotional/Relationship Impact */}
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-slate-700 mb-3">Emotional & Relationship Impact
            <InfoIcon content="PTSD/Emotional distress: $1,000-$5,000 typical. Loss of consortium: $500-$3,000 typical. Dillon v. Legg claims: $1,000-$5,000 typical." />
          </h4>
          <div className="space-y-4">
            <label className="flex items-start space-x-3 cursor-pointer">
              <input
                type="checkbox"
                {...register('impact.lossOfConsortium')}
                className="w-4 h-4 text-purple-600 border-slate-300 rounded focus:ring-purple-500 mt-0.5"
              />
              <span className="text-sm text-slate-700">
                <Heart className="w-4 h-4 inline mr-1 text-purple-600" />
                Loss of Consortium (Impact on Marital Relationship)
              </span>
            </label>
            
            <label className="flex items-start space-x-3 cursor-pointer">
              <input
                type="checkbox"
                {...register('impact.emotionalDistress')}
                className="w-4 h-4 text-purple-600 border-slate-300 rounded focus:ring-purple-500 mt-0.5"
              />
              <span className="text-sm text-slate-700">
                <Brain className="w-4 h-4 inline mr-1 text-purple-600" />
                Significant Emotional Distress (Anxiety, Depression, PTSD)
              </span>
            </label>
            
            <label className="flex items-start space-x-3 cursor-pointer">
              <input
                type="checkbox"
                {...register('impact.dylanVLeggClaim')}
                className="w-4 h-4 text-purple-600 border-slate-300 rounded focus:ring-purple-500 mt-0.5"
              />
              <span className="text-sm text-slate-700">
                <Scale className="w-4 h-4 inline mr-1 text-purple-600" />
                Dillon v. Legg Claim (Witnessed Injury to Family Member)
                <InfoIcon content="California law allows recovery if you witnessed severe injury to a close family member" />
              </span>
            </label>
          </div>
        </div>

        {/* Permanent Impact */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-slate-700 mb-3">Long-term Impact
            <InfoIcon content="Permanent impairment: $3,000 per percentage point typical. Consider documenting: inability to participate in hobbies, difficulty with daily activities, impact on childcare, changes in sleep patterns, need for ongoing assistance." />
          </h4>
          <div className="space-y-4">
            <label className="flex items-start space-x-3 cursor-pointer">
              <input
                type="checkbox"
                {...register('impact.permanentImpairment')}
                className="w-4 h-4 text-red-600 border-slate-300 rounded focus:ring-red-500 mt-0.5"
              />
              <span className="text-sm text-slate-700">
                <AlertTriangle className="w-4 h-4 inline mr-1 text-red-600" />
                Permanent Impairment or Disability
              </span>
            </label>
            
            {permanentImpairment && (
              <div className="ml-7">
                <label className="text-sm font-medium text-slate-700 mb-1 block">
                  Impairment Rating (% if known)
                  <InfoIcon content="Whole person impairment rating from doctor (0-100%)" />
                </label>
                <input
                  type="number"
                  {...register('impact.impairmentRating', { 
                    min: { value: 0, message: 'Invalid rating' },
                    max: { value: 100, message: 'Invalid rating' }
                  })}
                  className="w-full px-3 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  placeholder="e.g., 15"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Insurance & Legal Section */}
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-slate-800 border-b border-slate-200 pb-2">Insurance & Legal</h3>
        <div className="text-slate-600 text-sm">
          Policy limits and legal representation affect your net recovery.
          <InfoIcon content="Settlement Timeline: 3-6 months for simple soft tissue cases with attorney, 6-12 months for moderate injuries, 12-24 months for serious injuries, 2-4 years for trial cases. Your net recovery will be reduced by attorney fees, medical liens, and case costs." />
        </div>

        {/* Policy Limits */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center">
            <Shield className="w-4 h-4 mr-2 text-blue-600" />
            Insurance Policy Limits
            <InfoIcon content="California minimum liability is only $15,000 per person. Many drivers carry only minimum coverage, which severely limits potential recovery." />
          </h4>
          
          <label className="flex items-start space-x-3 cursor-pointer mb-4">
            <input
              type="checkbox"
              {...register('insurance.policyLimitsKnown')}
              className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500 mt-0.5"
            />
            <span className="text-sm text-slate-700">
              I know the at-fault party's policy limits
            </span>
          </label>
          
          {policyLimitsKnown && (
            <div>
              <label className="flex items-center text-sm font-medium text-slate-700 mb-2">
                <DollarSign className="w-4 h-4 mr-2 text-slate-400" />
                Policy Limits (Per Person)
                <InfoIcon content="You cannot recover more than the policy limits unless the at-fault party has significant assets" />
              </label>
              <select
                {...register('insurance.policyLimits')}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              >
                <option value="">Select policy limits...</option>
                <option value="15000">$15,000 (CA Minimum)</option>
                <option value="25000">$25,000</option>
                <option value="30000">$30,000</option>
                <option value="50000">$50,000</option>
                <option value="100000">$100,000</option>
                <option value="250000">$250,000</option>
                <option value="500000">$500,000</option>
                <option value="1000000">$1,000,000+</option>
              </select>
            </div>
          )}
        </div>

        {/* Attorney Representation */}
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center">
            <Scale className="w-4 h-4 mr-2 text-purple-600" />
            Legal Representation
            <InfoIcon content="Attorney Benefits: Can increase settlement 2-3x, handle negotiations. Attorney Costs: 33-40% of settlement plus expenses ($5,000-$20,000 for litigation). Self-Representation: Keep 100% but typically receive lower offers. Medical liens may claim reimbursement from settlement." />
          </h4>
          
          <label className="flex items-start space-x-3 cursor-pointer mb-4">
            <input
              type="checkbox"
              {...register('insurance.hasAttorney')}
              className="w-4 h-4 text-purple-600 border-slate-300 rounded focus:ring-purple-500 mt-0.5"
            />
            <span className="text-sm text-slate-700">
              I have hired or plan to hire an attorney
            </span>
          </label>
          
          {hasAttorney && (
            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">
                Attorney Contingency Fee
                <InfoIcon content="Attorney fees are deducted from your gross settlement" />
              </label>
              <select
                {...register('insurance.attorneyContingency')}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              >
                <option value="">Select fee percentage...</option>
                <option value="25">25% (Pre-litigation settlement)</option>
                <option value="33">33.33% (Standard)</option>
                <option value="40">40% (If lawsuit filed)</option>
                <option value="45">45% (If case goes to trial)</option>
              </select>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}