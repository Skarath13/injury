import type { Metadata } from 'next'
import { Calculator, Shield, Scale, Target } from 'lucide-react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { DEFAULT_OPEN_GRAPH_IMAGE } from '@/lib/seo'

export const metadata: Metadata = {
  title: 'About Our CA Auto Injury Calculator',
  description: 'Learn how the California auto injury settlement calculator builds an educational case profile and phone-verified estimate.',
  keywords: 'about settlement calculator, California auto injury estimates, how settlement calculator works, realistic settlement estimates',
  openGraph: {
    title: 'About Our CA Auto Injury Calculator',
    description: 'Learn how the California auto injury settlement calculator builds an educational case profile and phone-verified estimate.',
    url: 'https://californiasettlementcalculator.com/about',
    images: [DEFAULT_OPEN_GRAPH_IMAGE],
  },
  alternates: {
    canonical: 'https://californiasettlementcalculator.com/about',
  },
}

export default function About() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex flex-col">
      <Header />
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold text-slate-900 mb-4">About Our Settlement Calculator</h1>
        <p className="text-lg text-slate-600 mb-12">
          Helping California accident victims organize the facts that commonly affect an educational insurance settlement estimate.
        </p>
        
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-slate-800 mb-6">Our Mission</h2>
          <p className="text-slate-600 mb-4">
            We created this calculator to help California auto accident victims organize key claim facts before reviewing an educational estimate. Too often, people enter the claim process with no framework for medical treatment, injury severity, liability, venue context, and case-value signals.
          </p>
          <p className="text-slate-600">
            The calculator uses a versioned settlement-logic configuration so the assumptions behind the estimate can be reviewed, audited, and updated without hiding the math in application code.
          </p>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-slate-800 mb-6">How It Works</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
              <div className="flex items-center mb-3">
                <Calculator className="w-6 h-6 text-blue-600 mr-3" />
                <h3 className="text-lg font-semibold text-slate-800">Configured Estimate Logic</h3>
              </div>
              <p className="text-slate-600">
                The estimate is driven by configured factors for body-map severity, treatment progression, medical specials, wage-loss context when selected, life-impact signals, impact severity, county venue context, age, and comparative fault.
              </p>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
              <div className="flex items-center mb-3">
                <Shield className="w-6 h-6 text-green-600 mr-3" />
                <h3 className="text-lg font-semibold text-slate-800">Phone Verification</h3>
              </div>
              <p className="text-slate-600">
                Exact estimate values are prepared server-side and shown after verification to reduce duplicate submissions.
              </p>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
              <div className="flex items-center mb-3">
                <Scale className="w-6 h-6 text-purple-600 mr-3" />
                <h3 className="text-lg font-semibold text-slate-800">Claim Factors</h3>
              </div>
              <p className="text-slate-600">
                The calculator includes California comparative fault, attorney-fee context when an attorney is involved, and county venue context.
              </p>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
              <div className="flex items-center mb-3">
                <Target className="w-6 h-6 text-amber-600 mr-3" />
                <h3 className="text-lg font-semibold text-slate-800">Reviewed Copy</h3>
              </div>
              <p className="text-slate-600">
                The copy avoids guarantees, automatic attorney assignment language, and promises about specific outcomes.
              </p>
            </div>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-slate-800 mb-4">Limits</h2>
          <p className="rounded-lg border border-slate-200 bg-white p-5 text-sm leading-6 text-slate-600">
            Estimates are educational, case outcomes vary, and filing deadlines still apply. The calculator does not provide legal advice or automatically assign attorneys.
          </p>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-slate-800 mb-6">Estimate Inputs</h2>
          <p className="text-slate-600 mb-4">
            The estimate can consider:
          </p>
          <ul className="space-y-2 text-slate-600">
            <li className="flex items-start">
              <span className="text-blue-600 mr-2">•</span>
              <span>Body-map injury areas and severity ratings</span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-600 mr-2">•</span>
              <span>Treatment type, medical specials, and treatment status</span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-600 mr-2">•</span>
              <span>California comparative fault and county venue context</span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-600 mr-2">•</span>
              <span>Context fields such as work disruption, attorney status, and daily-life impact without asking for policy limits or prior accidents</span>
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-slate-800 mb-6">Contact Us</h2>
          <p className="text-slate-600 mb-4">
            Have questions or feedback about our calculator? We'd love to hear from you.
          </p>
          <a href="/contact" className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors">
            Get in Touch
          </a>
        </section>
      </div>
      <Footer />
    </div>
  )
}
