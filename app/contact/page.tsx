import type { Metadata } from 'next'
import { Mail, MessageSquare, FileText } from 'lucide-react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

export const metadata: Metadata = {
  title: 'Contact Us | CA Auto Injury Settlement Calculator Support',
  description: 'Contact our California auto injury settlement calculator team. Get help with settlement estimates, calculator questions, or feedback. Free support for CA accident victims.',
  keywords: 'contact auto injury calculator, California settlement help, auto accident support, settlement calculator questions',
  openGraph: {
    title: 'Contact Us | CA Auto Injury Settlement Calculator Support',
    description: 'Contact our California auto injury settlement calculator team. Get help with settlement estimates and calculator questions.',
    url: 'https://cainjurysettlement.com/contact',
  },
  alternates: {
    canonical: 'https://cainjurysettlement.com/contact',
  },
}

export default function Contact() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex flex-col">
      <Header />
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold text-slate-900 mb-4">Contact Us</h1>
        <p className="text-lg text-slate-600 mb-12">
          We're here to help with questions about our settlement calculator or general inquiries about auto injury settlements in California.
        </p>
        
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
            <div className="flex items-center mb-4">
              <Mail className="w-6 h-6 text-blue-600 mr-3" />
              <h2 className="text-xl font-semibold text-slate-800">Email Support</h2>
            </div>
            <p className="text-slate-600 mb-4">
              For general inquiries and calculator feedback:
            </p>
            <a href="mailto:support@cainjurysettlement.com" className="text-blue-600 hover:text-blue-700 font-medium">
              support@cainjurysettlement.com
            </a>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
            <div className="flex items-center mb-4">
              <MessageSquare className="w-6 h-6 text-green-600 mr-3" />
              <h2 className="text-xl font-semibold text-slate-800">Response Time</h2>
            </div>
            <p className="text-slate-600">
              We typically respond to inquiries within 24-48 business hours. Please allow additional time during weekends and holidays.
            </p>
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 mb-12">
          <h2 className="text-xl font-semibold text-slate-800 mb-3">Important Disclaimer</h2>
          <p className="text-slate-700">
            We cannot provide legal advice or representation. This calculator provides estimates only. For legal advice specific to your case, please consult with a licensed California personal injury attorney.
          </p>
        </div>

        <div className="space-y-8">
          <section>
            <h2 className="text-2xl font-semibold text-slate-800 mb-4">Frequently Asked Questions</h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-slate-800 mb-2">Can you recommend an attorney?</h3>
                <p className="text-slate-600">
                  We do not provide attorney referrals. We recommend contacting the California State Bar's lawyer referral service for assistance finding qualified representation.
                </p>
              </div>
              
              <div>
                <h3 className="font-semibold text-slate-800 mb-2">How accurate are the settlement estimates?</h3>
                <p className="text-slate-600">
                  Our estimates are based on California settlement data patterns but should be considered general guidance only. Actual settlements vary significantly based on specific case details.
                </p>
              </div>
              
              <div>
                <h3 className="font-semibold text-slate-800 mb-2">Is my information stored when I use the calculator?</h3>
                <p className="text-slate-600">
                  No. All calculations are performed locally in your browser. We do not store any personal or case information you enter into the calculator.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-800 mb-4">Other Inquiries</h2>
            <div className="bg-slate-50 rounded-lg p-6 space-y-4">
              <div>
                <div className="flex items-center mb-2">
                  <FileText className="w-5 h-5 text-slate-600 mr-2" />
                  <h3 className="font-semibold text-slate-800">Privacy Concerns</h3>
                </div>
                <p className="text-slate-600">
                  Email: <a href="mailto:privacy@cainjurysettlement.com" className="text-blue-600 hover:text-blue-700">privacy@cainjurysettlement.com</a>
                </p>
              </div>
              
              <div>
                <div className="flex items-center mb-2">
                  <FileText className="w-5 h-5 text-slate-600 mr-2" />
                  <h3 className="font-semibold text-slate-800">Legal & Terms</h3>
                </div>
                <p className="text-slate-600">
                  Email: <a href="mailto:legal@cainjurysettlement.com" className="text-blue-600 hover:text-blue-700">legal@cainjurysettlement.com</a>
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
      <Footer />
    </div>
  )
}