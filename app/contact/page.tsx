import { Mail, MessageSquare, FileText } from 'lucide-react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { buildPageMetadata } from '@/lib/seo'

export const metadata = buildPageMetadata({
  title: 'Contact Us | CA Auto Injury Settlement Calculator Support',
  description: 'Contact the California auto injury settlement calculator team for calculator questions, privacy requests, or feedback.',
  path: '/contact',
  keywords: [
    'contact auto injury calculator',
    'California settlement help',
    'auto accident support',
    'settlement calculator questions'
  ]
});

export default function Contact() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex flex-col">
      <Header />
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold text-slate-900 mb-4">Contact Us</h1>
        <p className="text-lg text-slate-600 mb-3">
          We're here to help with questions about our settlement calculator or general inquiries about auto injury settlements in California.
        </p>
        <p className="mb-12 text-sm text-slate-500">
          We cannot provide legal advice or representation.
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
            <a href="mailto:contact@californiasettlementcalculator.com" className="text-blue-600 hover:text-blue-700 font-medium">
              contact@californiasettlementcalculator.com
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

        <div className="space-y-8">
          <section>
            <h2 className="text-2xl font-semibold text-slate-800 mb-4">Frequently Asked Questions</h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-slate-800 mb-2">Can you recommend an attorney?</h3>
                <p className="text-slate-600">
                  No. We do not recommend, match, assign, or route users to attorneys. No law firm or attorney contact option is currently active.
                </p>
              </div>
              
              <div>
                <h3 className="font-semibold text-slate-800 mb-2">How accurate are the settlement estimates?</h3>
                <p className="text-slate-600">
                  Estimates are based on configured claim factors and should be considered educational guidance only. Actual settlements vary significantly based on specific case details.
                </p>
              </div>
              
              <div>
                <h3 className="font-semibold text-slate-800 mb-2">Is my information stored when I use the calculator?</h3>
                <p className="text-slate-600">
                  Estimate sessions are processed through our Cloudflare Worker and may be temporarily stored for verification, fraud prevention, consent, and audit purposes. See the Privacy Policy for details.
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
                  <h3 className="font-semibold text-slate-800">Calculator Support</h3>
                </div>
                <p className="text-slate-600">
                  Email: <a href="mailto:support@californiasettlementcalculator.com" className="text-blue-600 hover:text-blue-700">support@californiasettlementcalculator.com</a>
                </p>
              </div>

              <div>
                <div className="flex items-center mb-2">
                  <FileText className="w-5 h-5 text-slate-600 mr-2" />
                  <h3 className="font-semibold text-slate-800">Privacy Concerns</h3>
                </div>
                <p className="text-slate-600">
                  Email: <a href="mailto:privacy@californiasettlementcalculator.com" className="text-blue-600 hover:text-blue-700">privacy@californiasettlementcalculator.com</a>
                </p>
              </div>
              
              <div>
                <div className="flex items-center mb-2">
                  <FileText className="w-5 h-5 text-slate-600 mr-2" />
                  <h3 className="font-semibold text-slate-800">Legal & Terms</h3>
                </div>
                <p className="text-slate-600">
                  Email: <a href="mailto:legal@californiasettlementcalculator.com" className="text-blue-600 hover:text-blue-700">legal@californiasettlementcalculator.com</a>
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
