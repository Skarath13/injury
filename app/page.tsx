import SettlementCalculator from '@/components/SettlementCalculator';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-slate-900 mb-4">
              California Auto Injury Settlement Calculator
            </h1>
            <p className="text-lg text-slate-600 mb-2">
              Get a realistic estimate of your potential settlement
            </p>
            <p className="text-sm text-slate-500 max-w-2xl mx-auto">
              Based on actual insurance industry data and practices. This tool provides realistic ranges, 
              not inflated promises. Remember: most soft tissue injuries settle between $5,000-$25,000.
            </p>
          </div>
          
          <div className="mb-8 bg-amber-50 border border-amber-200 rounded-lg p-4">
            <p className="text-sm text-amber-800">
              <strong>Disclaimer:</strong> This calculator provides estimates only. Actual settlements vary based on 
              numerous factors. Consult with a qualified attorney for legal advice specific to your case.
            </p>
          </div>
          
          <SettlementCalculator />
          
          <div className="mt-12 space-y-4">
            {/* Ad space placeholder */}
            <div className="bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <p className="text-gray-500">Advertisement Space</p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
