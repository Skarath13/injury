import { ResponsibleAttorney, SettlementResult } from '@/types/calculator';
import { 
  DollarSign, TrendingUp, TrendingDown, Minus, 
  AlertCircle, Calculator, ArrowLeft, Printer, Edit3,
  BarChart3, PieChart
} from 'lucide-react';

interface Props {
  results: SettlementResult;
  medicalCosts: number;
  hasAttorney: boolean;
  responsibleAttorney?: ResponsibleAttorney | null;
  leadDeliveryStatus?: string | null;
  onBack: () => void;
  onEdit?: () => void;
}

export default function SettlementResults({ results, medicalCosts, hasAttorney, responsibleAttorney, leadDeliveryStatus, onBack, onEdit }: Props) {
  const medicalRange = results.medicalCostRange || {
    low: medicalCosts,
    mid: medicalCosts,
    high: medicalCosts
  };
  const estimatedWageLoss = results.estimatedWageLoss || 0;
  const estimatedWorkLossDays = results.estimatedWorkLossDays || 0;
  const economicDamages = medicalCosts + estimatedWageLoss;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };
  
  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'positive': return 'text-green-600';
      case 'negative': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };
  
  const getImpactIcon = (impact: string) => {
    switch (impact) {
      case 'positive': return <TrendingUp className="w-4 h-4" />;
      case 'negative': return <TrendingDown className="w-4 h-4" />;
      default: return <Minus className="w-4 h-4" />;
    }
  };
  
  // Calculate percentages for visual breakdown
  const negotiatedMedical = hasAttorney ? medicalCosts * 0.4 : medicalCosts; // Only negotiate if has attorney
  const attorneyFees = hasAttorney ? results.midEstimate * 0.33 : 0;
  const takeHome = results.midEstimate - negotiatedMedical - attorneyFees;
  const total = results.midEstimate;
  
  const medicalPercentage = (negotiatedMedical / total) * 100;
  const attorneyPercentage = hasAttorney ? (attorneyFees / total) * 100 : 0;
  const takeHomePercentage = (takeHome / total) * 100;
  const noDeliveryMessage = (() => {
    switch (leadDeliveryStatus) {
      case 'estimate_only_no_delivery':
        return 'Estimate-only view: results were not sent to an attorney, and no phone verification was used.';
      case 'duplicate_30d_no_charge':
        return 'This phone was already used for a recent attorney-delivery request, so this is not treated as a new attorney lead.';
      case 'outside_california_no_delivery':
        return 'Attorney delivery is limited to California visitors, so this estimate is not treated as an attorney lead.';
      case 'outside_us_no_delivery':
        return 'Attorney delivery is limited to California visitors in the United States, so this estimate is not treated as an attorney lead.';
      case 'unknown_location_no_delivery':
        return 'We could not confirm California visitor eligibility, so this estimate is not treated as an attorney lead.';
      case 'too_fast_no_delivery':
        return 'Estimate-only view: phone verification was skipped because the form was completed before the 120-second lead-quality window.';
      case 'own_attorney_no_delivery':
        return 'Estimate-only view: results were not sent to an attorney because you indicated you already have or plan to hire an attorney.';
      case 'unmapped_no_attorney_delivery':
        return 'No active attorney advertiser is configured for this county; results were not sent to an attorney.';
      default:
        return null;
    }
  })();
  
  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="bg-slate-950 p-6 text-white">
        <h2 className="text-2xl font-bold">Insurance Settlement Estimate</h2>
        <p className="mt-1 text-sm text-slate-200">
          Severity band: <span className="font-semibold capitalize">{results.severityBand}</span>
        </p>
      </div>
      
      <div className="p-6 md:p-8 space-y-6">
        {responsibleAttorney && !noDeliveryMessage ? (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-slate-900 mb-1">Responsible Attorney Disclosure</h3>
            <p className="text-sm text-slate-700">{responsibleAttorney.disclosure}</p>
          </div>
        ) : (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <p className="text-sm text-slate-700">
              {noDeliveryMessage || 'No active attorney advertiser is configured for this county; results were not sent to an attorney.'}
            </p>
          </div>
        )}

        {/* Settlement Range with Visual Bar */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
            <BarChart3 className="w-5 h-5 mr-2 text-green-600" />
            Estimated Settlement Range (Gross)
          </h3>
          
          {/* Visual Range Bar */}
          <div className="mb-6">
            <div className="h-4 overflow-hidden rounded-full bg-gradient-to-r from-emerald-500 via-amber-400 to-red-500 shadow-inner" />
            <div className="flex justify-between mt-3 text-xs font-medium text-slate-600">
              <span>Conservative</span>
              <span>Upper Range</span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <div className="rounded-lg border bg-slate-50 p-4">
              <p className="text-xs sm:text-sm text-slate-600 mb-1 sm:mb-2">Conservative</p>
              <p className="text-lg sm:text-2xl font-bold text-slate-900 leading-tight">{formatCurrency(results.lowEstimate)}</p>
            </div>
            <div className="rounded-lg border bg-slate-50 p-4 text-right">
              <p className="text-xs sm:text-sm text-slate-600 mb-1 sm:mb-2">Upper Range</p>
              <p className="text-lg sm:text-2xl font-bold text-slate-900 leading-tight">{formatCurrency(results.highEstimate)}</p>
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t border-slate-200">
            <p className="text-xs text-slate-600">
              <AlertCircle className="w-3 h-3 inline mr-1" />
              This settlement range is total gross case value before attorney fees, medical liens, and costs
            </p>
          </div>
        </div>
        
        {/* Visual Pie Chart Breakdown */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
            <PieChart className="w-5 h-5 mr-2 text-blue-600" />
            Settlement Distribution (Visual)
          </h3>
          
          <div className="grid md:grid-cols-2 gap-6">
            {/* Pie Chart Visualization */}
            <div className="flex items-center justify-center">
              <div className="relative w-48 h-48">
                <svg viewBox="0 0 100 100" className="transform -rotate-90 w-full h-full">
                  {/* Medical Costs Slice */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="#ef4444"
                    strokeWidth="20"
                    strokeDasharray={`${medicalPercentage * 2.513} 251.3`}
                    strokeDashoffset="0"
                  />
                  {/* Attorney Fees Slice - only show if has attorney */}
                  {hasAttorney && (
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke="#f59e0b"
                      strokeWidth="20"
                      strokeDasharray={`${attorneyPercentage * 2.513} 251.3`}
                      strokeDashoffset={`-${medicalPercentage * 2.513}`}
                    />
                  )}
                  {/* Take Home Slice */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="20"
                    strokeDasharray={`${takeHomePercentage * 2.513} 251.3`}
                    strokeDashoffset={`-${(medicalPercentage + (hasAttorney ? attorneyPercentage : 0)) * 2.513}`}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-xs text-slate-600">Your Take</p>
                    <p className="text-lg font-bold text-green-600">{Math.round(takeHomePercentage)}%</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Legend */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-red-500 rounded mr-2"></div>
                  <span className="text-sm text-slate-700">
                    {hasAttorney ? "Medical Specials (After Estimated Resolution)" : "Estimated Medical Specials"}
                  </span>
                </div>
                <span className="text-sm font-medium">{formatCurrency(negotiatedMedical)}</span>
              </div>
              {hasAttorney && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-amber-500 rounded mr-2"></div>
                    <span className="text-sm text-slate-700">Attorney Fees (33%)</span>
                  </div>
                  <span className="text-sm font-medium">{formatCurrency(attorneyFees)}</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-green-500 rounded mr-2"></div>
                  <span className="text-sm text-slate-700">Your Take-Home</span>
                </div>
                <span className="text-sm font-bold text-green-600">{formatCurrency(takeHome)}</span>
              </div>
              <div className="pt-3 border-t border-blue-200">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-700">Total Settlement</span>
                  <span className="text-sm font-bold">{formatCurrency(results.midEstimate)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Settlement Breakdown */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
            <Calculator className="w-5 h-5 mr-2 text-slate-600" />
            Detailed Settlement Breakdown
          </h3>
          
          <div className="space-y-4">
            <div className="pb-4 border-b border-slate-200">
              <h4 className="text-sm font-semibold text-slate-700 mb-2">Estimated Medical Specials (Economic Damages)</h4>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm text-slate-600">Reasonable value range:</span>
                <span className="font-medium">{formatCurrency(medicalRange.low)} - {formatCurrency(medicalRange.high)}</span>
              </div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm text-slate-600">Estimated medical specials:</span>
                <span className="font-medium">{formatCurrency(medicalCosts)}</span>
              </div>
              {hasAttorney ? (
                <>
                  <div className="flex justify-between items-center text-green-700">
                    <span className="text-sm">Possible resolved lien / balance range:</span>
                    <span className="font-medium">{formatCurrency(medicalCosts * 0.2)} - {formatCurrency(medicalCosts * 0.6)}</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-2">
                    Medical lien and bill resolution depends on the provider, payer, claim facts, and any representation agreement.<br/>
                    Note: Medi-Cal/Medicare adjustments may involve separate rules and cannot be assumed from this estimate. The low end includes a calibration floor for display.
                  </p>
                </>
              ) : (
                <p className="text-xs text-slate-500 mt-2">
                  These are estimated reasonable values from treatment selections, not user-entered medical bills. The low end includes a calibration floor for display.
                </p>
              )}
            </div>

            {estimatedWageLoss > 0 && (
              <div className="pb-4 border-b border-slate-200">
                <h4 className="text-sm font-semibold text-slate-700 mb-2">Estimated Wage Loss (Economic Damages)</h4>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-slate-600">Estimated time away:</span>
                  <span className="font-medium">
                    {estimatedWorkLossDays} work day{estimatedWorkLossDays === 1 ? '' : 's'}
                  </span>
                </div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-slate-600">Estimated wage loss:</span>
                  <span className="font-medium">{formatCurrency(estimatedWageLoss)}</span>
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  Wage loss is estimated from occupation, income range, injury severity, treatment progression, and vehicle impact severity.
                </p>
              </div>
            )}
            
            <div>
              <h4 className="text-sm font-semibold text-slate-700 mb-2">Pain & Suffering (Non-Economic Damages)</h4>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm text-slate-600">Estimated Pain & Suffering:</span>
                <span className="font-medium">
                  {formatCurrency(Math.max(results.midEstimate - economicDamages, 500))}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                General damages are the pain-and-suffering portion added on top of economic damages, estimated from body-map severity, treatment progression, life impact, impact severity, age, and county venue context.
              </p>
            </div>
          </div>
        </div>
        
        {/* Factors Analysis with Visual Bars */}
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
            <BarChart3 className="w-5 h-5 mr-2 text-slate-600" />
            Settlement Factors Impact
          </h3>
          
          <div className="space-y-3">
            {results.factors.map((factor, index) => (
              <div key={index} className="space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className={getImpactColor(factor.impact)}>
                      {getImpactIcon(factor.impact)}
                    </span>
                    <span className="text-sm text-slate-700">{factor.factor}</span>
                  </div>
                  <span className={`text-sm font-medium ${getImpactColor(factor.impact)}`}>
                    {factor.impact === 'positive' ? '+' : factor.impact === 'negative' ? '-' : ''}{Math.round(factor.weight * 100)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-500 ${
                      factor.impact === 'positive' ? 'bg-green-500' : 
                      factor.impact === 'negative' ? 'bg-red-500' : 'bg-gray-400'
                    }`}
                    style={{ width: `${Math.min(Math.abs(factor.weight) * 100, 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Explanation */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-3">Analysis & Recommendations</h3>
          <div className="text-sm text-slate-700 whitespace-pre-line">{results.explanation}</div>
        </div>
        
        {/* Important Disclaimers */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-3 flex items-center">
            <AlertCircle className="w-5 h-5 mr-2 text-amber-600" />
            Important Considerations
          </h3>
          <ul className="space-y-2 text-sm text-amber-900">
            <li className="flex items-start">
              <span className="font-bold mr-2">•</span>
              <span>These are insurance settlement values, NOT jury verdict values</span>
            </li>
            <li className="flex items-start">
              <span className="font-bold mr-2">•</span>
              <span>Insurance companies don't use simple multipliers - they evaluate each factor individually</span>
            </li>
            <li className="flex items-start">
              <span className="font-bold mr-2">•</span>
              <span>Initial offers may not reflect every case factor or later treatment development</span>
            </li>
            <li className="flex items-start">
              <span className="font-bold mr-2">•</span>
              <span>Medical liens, provider balances, and payer reimbursement claims can reduce net recovery</span>
            </li>
            <li className="flex items-start">
              <span className="font-bold mr-2">•</span>
              <span>Settlement timing can affect value because treatment, liens, and evidence may change</span>
            </li>
            <li className="flex items-start">
              <span className="font-bold mr-2">•</span>
              <span>Every case is unique - consult with professionals for personalized advice</span>
            </li>
          </ul>
        </div>
        
        {/* Actions */}
        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 sm:gap-2 pt-4">
          <button
            onClick={onBack}
            className="flex items-center justify-center px-4 py-3 sm:py-2 bg-slate-200 text-slate-700 rounded-lg font-medium hover:bg-slate-300 transition-colors cursor-pointer text-sm sm:text-base"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Calculator
          </button>
          
          <div className="flex flex-col sm:flex-row gap-2">
            {onEdit && (
              <button
                onClick={onEdit}
                className="flex items-center justify-center px-4 py-3 sm:py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors cursor-pointer text-sm sm:text-base"
              >
                <Edit3 className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Edit Inputs</span>
                <span className="sm:hidden">Edit</span>
              </button>
            )}
            <button
              onClick={() => window.print()}
              className="flex items-center justify-center px-4 py-3 sm:py-2 bg-amber-500 text-white rounded-lg font-medium hover:bg-amber-600 transition-colors cursor-pointer text-sm sm:text-base"
            >
              <Printer className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Print Results</span>
              <span className="sm:hidden">Print</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
