import { SettlementResult } from '@/types/calculator';
import { 
  DollarSign, TrendingUp, TrendingDown, Minus, 
  AlertCircle, Calculator, ArrowLeft, Printer, Edit3
} from 'lucide-react';

interface Props {
  results: SettlementResult;
  medicalCosts: number;
  onBack: () => void;
  onEdit?: () => void;
}

export default function SettlementResults({ results, medicalCosts, onBack, onEdit }: Props) {
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
  
  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
      <div className="bg-gradient-to-r from-amber-500 to-amber-600 p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">Insurance Settlement Estimate</h2>
        <p className="text-amber-100">Realistic insurance settlement values (not jury verdict amounts)</p>
      </div>
      
      <div className="p-6 md:p-8 space-y-6">
        {/* Settlement Range */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
            <DollarSign className="w-5 h-5 mr-2 text-green-600" />
            Estimated Settlement Range (Gross)
          </h3>
          
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-sm text-slate-600 mb-1">Conservative</p>
              <p className="text-2xl font-bold text-slate-900">{formatCurrency(results.lowEstimate)}</p>
            </div>
            <div className="border-l border-r border-green-300">
              <p className="text-sm text-slate-600 mb-1">Most Likely</p>
              <p className="text-3xl font-bold text-green-600">{formatCurrency(results.midEstimate)}</p>
            </div>
            <div>
              <p className="text-sm text-slate-600 mb-1">Best Case</p>
              <p className="text-2xl font-bold text-slate-900">{formatCurrency(results.highEstimate)}</p>
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t border-green-200">
            <p className="text-xs text-green-800">
              <AlertCircle className="w-3 h-3 inline mr-1" />
              These are gross amounts before attorney fees, medical liens, and costs
            </p>
          </div>
        </div>
        
        {/* Settlement Breakdown */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
            <Calculator className="w-5 h-5 mr-2 text-blue-600" />
            Settlement Breakdown
          </h3>
          
          <div className="space-y-4">
            <div className="pb-4 border-b border-blue-200">
              <h4 className="text-sm font-semibold text-slate-700 mb-2">Medical Specials (Economic Damages)</h4>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm text-slate-600">Billed Medical Costs:</span>
                <span className="font-medium">{formatCurrency(medicalCosts)}</span>
              </div>
              <div className="flex justify-between items-center text-green-700">
                <span className="text-sm">After Attorney Negotiation (40-80% reduction):</span>
                <span className="font-medium">{formatCurrency(medicalCosts * 0.2)} - {formatCurrency(medicalCosts * 0.6)}</span>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                Good attorneys often negotiate 40-80% reductions through pre-contracted rates.<br/>
                Note: Medi-Cal/Medicare adjustments are pre-applied and cannot be profited from.
              </p>
            </div>
            
            <div>
              <h4 className="text-sm font-semibold text-slate-700 mb-2">Pain & Suffering (Non-Economic Damages)</h4>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm text-slate-600">Estimated Pain & Suffering:</span>
                <span className="font-medium">
                  {formatCurrency(results.midEstimate - medicalCosts > 0 ? results.midEstimate - medicalCosts : 0)}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                This is what you actually keep (minus attorney fees) for your pain, suffering, and life disruption
              </p>
            </div>
            
            <div className="pt-4 border-t border-blue-200">
              <h4 className="text-sm font-semibold text-slate-700 mb-2">Your Estimated Take-Home</h4>
              <div className="bg-white rounded-lg p-3">
                <div className="text-xs text-slate-600 mb-2">After medical bills and attorney fees (33%):</div>
                <div className="text-xl font-bold text-green-600">
                  {formatCurrency((results.midEstimate - (medicalCosts * 0.4)) * 0.67)}
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Assumes 60% medical reduction and standard 33% attorney contingency
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Factors Analysis */}
        <div className="bg-slate-50 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
            <Calculator className="w-5 h-5 mr-2 text-slate-600" />
            Settlement Factors Analysis
          </h3>
          
          <div className="space-y-2">
            {results.factors.map((factor, index) => (
              <div key={index} className="flex items-center justify-between py-2 border-b border-slate-200 last:border-0">
                <div className="flex items-center space-x-2">
                  <span className={getImpactColor(factor.impact)}>
                    {getImpactIcon(factor.impact)}
                  </span>
                  <span className="text-sm text-slate-700">{factor.factor}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        factor.impact === 'positive' ? 'bg-green-500' : 
                        factor.impact === 'negative' ? 'bg-red-500' : 'bg-gray-400'
                      }`}
                      style={{ width: `${Math.abs(factor.weight) * 100}%` }}
                    />
                  </div>
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
              <span>Initial insurance offers are typically 30-50% below fair value</span>
            </li>
            <li className="flex items-start">
              <span className="font-bold mr-2">•</span>
              <span>Medical liens can reduce your net recovery by 30-50%</span>
            </li>
            <li className="flex items-start">
              <span className="font-bold mr-2">•</span>
              <span>Settlement timing affects value - too early may leave money on the table</span>
            </li>
            <li className="flex items-start">
              <span className="font-bold mr-2">•</span>
              <span>Every case is unique - consult with professionals for personalized advice</span>
            </li>
          </ul>
        </div>
        
        {/* Actions */}
        <div className="flex justify-between items-center pt-4">
          <button
            onClick={onBack}
            className="flex items-center px-4 py-2 bg-slate-200 text-slate-700 rounded-lg font-medium hover:bg-slate-300 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Calculator
          </button>
          
          <div className="flex gap-2">
            {onEdit && (
              <button
                onClick={onEdit}
                className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors cursor-pointer"
              >
                <Edit3 className="w-4 h-4 mr-2" />
                Edit Inputs
              </button>
            )}
            <button
              onClick={() => window.print()}
              className="flex items-center px-4 py-2 bg-amber-500 text-white rounded-lg font-medium hover:bg-amber-600 transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4 mr-2" />
              Print Results
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}