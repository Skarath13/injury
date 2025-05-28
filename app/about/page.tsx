import type { Metadata } from 'next'
import { Calculator, Shield, Scale, Target } from 'lucide-react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

export const metadata: Metadata = {
  title: 'About Our CA Auto Injury Calculator | Realistic Settlement Estimates',
  description: 'Learn how our California auto injury settlement calculator works. Based on real insurance data, not inflated promises. Discover our methodology for accurate settlement estimates.',
  keywords: 'about settlement calculator, California auto injury estimates, how settlement calculator works, realistic settlement estimates',
  openGraph: {
    title: 'About Our CA Auto Injury Calculator | Realistic Settlement Estimates',
    description: 'Learn how our California auto injury settlement calculator works. Based on real insurance data, not inflated promises.',
    url: 'https://cainjurysettlement.com/about',
  },
  alternates: {
    canonical: 'https://cainjurysettlement.com/about',
  },
}

export default function About() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex flex-col">
      <Header />
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold text-slate-900 mb-4">About Our Settlement Calculator</h1>
        <p className="text-lg text-slate-600 mb-12">
          Empowering California accident victims with realistic settlement expectations based on actual data and patterns.
        </p>
        
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-slate-800 mb-6">Our Mission</h2>
          <p className="text-slate-600 mb-4">
            We created this calculator to provide California auto accident victims with transparent, data-driven settlement estimates. Too often, accident victims enter the settlement process with unrealistic expectations or no information at all. Our goal is to bridge this information gap.
          </p>
          <p className="text-slate-600">
            By analyzing patterns from thousands of California auto injury settlements, we provide estimates that reflect real-world outcomes rather than inflated marketing promises.
          </p>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-slate-800 mb-6">How It Works</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
              <div className="flex items-center mb-3">
                <Calculator className="w-6 h-6 text-blue-600 mr-3" />
                <h3 className="text-lg font-semibold text-slate-800">Data-Driven Estimates</h3>
              </div>
              <p className="text-slate-600">
                Our calculator uses actual California settlement data patterns to generate realistic estimates based on injury type, treatment, and impact factors.
              </p>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
              <div className="flex items-center mb-3">
                <Shield className="w-6 h-6 text-green-600 mr-3" />
                <h3 className="text-lg font-semibold text-slate-800">Privacy First</h3>
              </div>
              <p className="text-slate-600">
                All calculations happen in your browser. We don't store any personal information or case details you enter into the calculator.
              </p>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
              <div className="flex items-center mb-3">
                <Scale className="w-6 h-6 text-purple-600 mr-3" />
                <h3 className="text-lg font-semibold text-slate-800">Legal Reality</h3>
              </div>
              <p className="text-slate-600">
                We factor in real-world considerations like comparative negligence, policy limits, and attorney fees to provide net recovery estimates.
              </p>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
              <div className="flex items-center mb-3">
                <Target className="w-6 h-6 text-amber-600 mr-3" />
                <h3 className="text-lg font-semibold text-slate-800">Conservative Approach</h3>
              </div>
              <p className="text-slate-600">
                Our estimates tend to be conservative, reflecting typical insurance settlement values rather than best-case jury verdicts.
              </p>
            </div>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-slate-800 mb-6">Important Limitations</h2>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
            <ul className="space-y-3 text-slate-700">
              <li className="flex items-start">
                <span className="text-amber-600 mr-2">•</span>
                <span>This calculator provides estimates only and cannot predict your specific case outcome</span>
              </li>
              <li className="flex items-start">
                <span className="text-amber-600 mr-2">•</span>
                <span>Every case is unique with factors that may significantly affect value</span>
              </li>
              <li className="flex items-start">
                <span className="text-amber-600 mr-2">•</span>
                <span>We do not provide legal advice or attorney referrals</span>
              </li>
              <li className="flex items-start">
                <span className="text-amber-600 mr-2">•</span>
                <span>Consult with a qualified California personal injury attorney for case-specific advice</span>
              </li>
            </ul>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-slate-800 mb-6">Our Data Sources</h2>
          <p className="text-slate-600 mb-4">
            Our estimates are based on:
          </p>
          <ul className="space-y-2 text-slate-600">
            <li className="flex items-start">
              <span className="text-blue-600 mr-2">•</span>
              <span>Analysis of California auto injury settlement patterns</span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-600 mr-2">•</span>
              <span>Insurance industry settlement guidelines and practices</span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-600 mr-2">•</span>
              <span>California legal precedents and statutory requirements</span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-600 mr-2">•</span>
              <span>Medical cost data for common auto injury treatments</span>
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