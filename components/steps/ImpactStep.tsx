import { UseFormRegister, UseFormWatch, FieldErrors } from 'react-hook-form';
import { InjuryCalculatorData } from '@/types/calculator';
import { 
  Briefcase, Heart, Brain, Scale, 
  AlertTriangle, Calendar
} from 'lucide-react';
import InfoIcon from '@/components/InfoIcon';

interface Props {
  register: UseFormRegister<InjuryCalculatorData>;
  watch: UseFormWatch<InjuryCalculatorData>;
  errors: FieldErrors<InjuryCalculatorData>;
}

export default function ImpactStep({ register, watch, errors }: Props) {
  const permanentImpairment = watch('impact.permanentImpairment');
  
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Life Impact</h2>
        <p className="text-slate-600">How the accident has affected your daily life and future.</p>
      </div>

      <div className="space-y-6">
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
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            placeholder="0"
          />
          {errors.impact?.missedWorkDays && (
            <p className="mt-1 text-sm text-red-600">{errors.impact.missedWorkDays.message}</p>
          )}
        </div>

        {/* Emotional/Relationship Impact */}
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-slate-700 mb-3">Emotional & Relationship Impact
            <InfoIcon content="PTSD/Emotional distress: $1,000-$5,000 typical. Loss of consortium: $500-$3,000 typical. Dillon v. Legg claims: $1,000-$5,000 typical." />
          </h3>
          <div className="space-y-3">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                {...register('impact.lossOfConsortium')}
                className="w-4 h-4 text-purple-600 border-slate-300 rounded focus:ring-purple-500"
              />
              <span className="text-sm text-slate-700">
                <Heart className="w-4 h-4 inline mr-1 text-purple-600" />
                Loss of Consortium (Impact on Marital Relationship)
              </span>
            </label>
            
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                {...register('impact.emotionalDistress')}
                className="w-4 h-4 text-purple-600 border-slate-300 rounded focus:ring-purple-500"
              />
              <span className="text-sm text-slate-700">
                <Brain className="w-4 h-4 inline mr-1 text-purple-600" />
                Significant Emotional Distress (Anxiety, Depression, PTSD)
              </span>
            </label>
            
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                {...register('impact.dylanVLeggClaim')}
                className="w-4 h-4 text-purple-600 border-slate-300 rounded focus:ring-purple-500"
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
          <h3 className="text-sm font-semibold text-slate-700 mb-3">Long-term Impact
            <InfoIcon content="Permanent impairment: $3,000 per percentage point typical. Consider documenting: inability to participate in hobbies, difficulty with daily activities, impact on childcare, changes in sleep patterns, need for ongoing assistance." />
          </h3>
          <div className="space-y-3">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                {...register('impact.permanentImpairment')}
                className="w-4 h-4 text-red-600 border-slate-300 rounded focus:ring-red-500"
              />
              <span className="text-sm text-slate-700">
                <AlertTriangle className="w-4 h-4 inline mr-1 text-red-600" />
                Permanent Impairment or Disability
              </span>
            </label>
            
            {permanentImpairment && (
              <div className="ml-6">
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
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  placeholder="e.g., 15"
                />
              </div>
            )}
          </div>
        </div>

        {/* Additional Information */}
      </div>

    </div>
  );
}