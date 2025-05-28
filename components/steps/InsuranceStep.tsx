import { UseFormRegister, UseFormWatch, FieldErrors } from 'react-hook-form';
import { InjuryCalculatorData } from '@/types/calculator';
import { Shield, DollarSign, Scale, AlertCircle } from 'lucide-react';
import InfoIcon from '@/components/InfoIcon';

interface Props {
  register: UseFormRegister<InjuryCalculatorData>;
  watch: UseFormWatch<InjuryCalculatorData>;
  errors: FieldErrors<InjuryCalculatorData>;
}

export default function InsuranceStep({ register, watch, errors }: Props) {
  const policyLimitsKnown = watch('insurance.policyLimitsKnown');
  const hasAttorney = watch('insurance.hasAttorney');
  
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Insurance & Legal</h2>
        <div className="text-slate-600">Policy limits and legal representation affect your net recovery.
          <InfoIcon content="Settlement Timeline: 3-6 months for simple soft tissue cases with attorney, 6-12 months for moderate injuries, 12-24 months for serious injuries, 2-4 years for trial cases. Your net recovery will be reduced by attorney fees, medical liens, and case costs." />
        </div>
      </div>

      <div className="space-y-6">
        {/* Policy Limits */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center">
            <Shield className="w-4 h-4 mr-2 text-blue-600" />
            Insurance Policy Limits
            <InfoIcon content="California minimum liability is only $15,000 per person. Many drivers carry only minimum coverage, which severely limits potential recovery." />
          </h3>
          
          <label className="flex items-center space-x-2 cursor-pointer mb-3">
            <input
              type="checkbox"
              {...register('insurance.policyLimitsKnown')}
              className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
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
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
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
          <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center">
            <Scale className="w-4 h-4 mr-2 text-purple-600" />
            Legal Representation
            <InfoIcon content="Attorney Benefits: Can increase settlement 2-3x, handle negotiations. Attorney Costs: 33-40% of settlement plus expenses ($5,000-$20,000 for litigation). Self-Representation: Keep 100% but typically receive lower offers. Medical liens may claim reimbursement from settlement." />
          </h3>
          
          <label className="flex items-center space-x-2 cursor-pointer mb-3">
            <input
              type="checkbox"
              {...register('insurance.hasAttorney')}
              className="w-4 h-4 text-purple-600 border-slate-300 rounded focus:ring-purple-500"
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
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
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

        {/* Important Considerations */}

        {/* Settlement Timeline */}
      </div>

    </div>
  );
}