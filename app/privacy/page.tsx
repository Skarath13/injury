import type { Metadata } from 'next'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

export const metadata: Metadata = {
  title: 'Privacy Policy | CA Auto Injury Calculator Data Protection',
  description: 'Privacy policy for California auto injury settlement calculator. Learn how we protect your data, CCPA compliance, and our commitment to never selling your information.',
  keywords: 'privacy policy, data protection, CCPA compliance, California privacy rights, settlement calculator privacy',
  openGraph: {
    title: 'Privacy Policy | CA Auto Injury Calculator Data Protection',
    description: 'Privacy policy for California auto injury settlement calculator. Learn how we protect your data and comply with privacy laws.',
    url: 'https://cainjurysettlement.com/privacy',
  },
  alternates: {
    canonical: 'https://cainjurysettlement.com/privacy',
  },
}

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex flex-col">
      <Header />
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold text-slate-900 mb-2">Privacy Policy</h1>
        <p className="text-sm text-slate-600 mb-8">Last updated: {new Date().toLocaleDateString()}</p>
        
        <div className="prose prose-lg max-w-none space-y-6">
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
            <p className="text-slate-700 font-semibold">
              Your Privacy Matters: We are committed to transparency about how we handle your data. This policy explains exactly what we collect, how we use it, and your rights.
            </p>
          </div>

          <section>
            <h2 className="text-2xl font-semibold text-slate-800 mb-4">1. Information We Collect</h2>
            
            <h3 className="text-lg font-semibold text-slate-700 mb-3">1.1 Calculator Input Data</h3>
            <p className="text-slate-600 mb-3">
              When you use our settlement calculator, you may enter:
            </p>
            <ul className="list-disc pl-6 text-slate-600 space-y-2 mb-4">
              <li>Personal demographics (age, occupation, income)</li>
              <li>Accident details (date, location, fault percentage)</li>
              <li>Medical information (injuries, treatments, costs)</li>
              <li>Insurance information (policy limits, attorney status)</li>
            </ul>
            <div className="bg-green-50 border border-green-200 p-3 rounded mb-4">
              <p className="text-slate-700 text-sm">
                <strong>Important:</strong> This data is processed entirely in your browser using client-side JavaScript. We do NOT transmit or store this information on our servers unless you explicitly opt-in to save your calculation.
              </p>
            </div>

            <h3 className="text-lg font-semibold text-slate-700 mb-3">1.2 Automatically Collected Information</h3>
            <ul className="list-disc pl-6 text-slate-600 space-y-2 mb-4">
              <li><strong>Device Information:</strong> Browser type, operating system, screen resolution, device type</li>
              <li><strong>Usage Data:</strong> Pages visited, time spent, click patterns, calculator features used</li>
              <li><strong>Network Information:</strong> IP address (anonymized), approximate location (city/state level), ISP</li>
              <li><strong>Referral Data:</strong> How you arrived at our site, search terms used</li>
            </ul>

            <h3 className="text-lg font-semibold text-slate-700 mb-3">1.3 Cookies and Similar Technologies</h3>
            <p className="text-slate-600 mb-3">We use the following types of cookies:</p>
            <ul className="list-disc pl-6 text-slate-600 space-y-2">
              <li><strong>Essential Cookies:</strong> Required for site functionality (session management, security)</li>
              <li><strong>Analytics Cookies:</strong> Google Analytics with IP anonymization enabled</li>
              <li><strong>Preference Cookies:</strong> Remember your cookie consent choice and calculator preferences</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-800 mb-4">2. How We Use Your Information</h2>
            
            <h3 className="text-lg font-semibold text-slate-700 mb-3">2.1 Primary Uses</h3>
            <ul className="list-disc pl-6 text-slate-600 space-y-2 mb-4">
              <li>Generate settlement estimates based on your inputs</li>
              <li>Improve calculator accuracy and features</li>
              <li>Provide customer support if you contact us</li>
              <li>Ensure website security and prevent fraud</li>
              <li>Comply with legal obligations</li>
            </ul>

            <h3 className="text-lg font-semibold text-slate-700 mb-3">2.2 Analytics and Improvements</h3>
            <p className="text-slate-600 mb-3">
              We analyze aggregated, anonymized usage data to:
            </p>
            <ul className="list-disc pl-6 text-slate-600 space-y-2">
              <li>Understand which calculator features are most useful</li>
              <li>Identify and fix technical issues</li>
              <li>Optimize site performance and user experience</li>
              <li>Develop new features based on user patterns</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-800 mb-4">3. Data Sharing and Sale</h2>
            
            <div className="bg-amber-50 border-l-4 border-amber-400 p-4 mb-4">
              <h3 className="text-lg font-semibold text-slate-800 mb-2">Our Commitment on Data Sales</h3>
              <p className="text-slate-700">
                <strong>We do NOT sell your personal information.</strong> We will never sell your calculator inputs, contact information, or any other personal data without your explicit, informed consent.
              </p>
            </div>

            <h3 className="text-lg font-semibold text-slate-700 mb-3">3.1 Limited Sharing Scenarios</h3>
            <p className="text-slate-600 mb-3">We may share your information only in these specific circumstances:</p>
            <ul className="list-disc pl-6 text-slate-600 space-y-2 mb-4">
              <li><strong>With Your Consent:</strong> Only when you explicitly opt-in and understand what data is being shared</li>
              <li><strong>Service Providers:</strong> Trusted vendors who help operate our site (hosting, analytics) under strict confidentiality agreements</li>
              <li><strong>Legal Requirements:</strong> When required by law, court order, or to protect rights and safety</li>
              <li><strong>Business Transfers:</strong> In the event of a merger or acquisition, with continued privacy protections</li>
            </ul>

            <h3 className="text-lg font-semibold text-slate-700 mb-3">3.2 Future Data Monetization</h3>
            <p className="text-slate-600 mb-3">
              If we ever consider monetizing user data in the future:
            </p>
            <ul className="list-disc pl-6 text-slate-600 space-y-2">
              <li>We will request explicit opt-in consent with clear explanations</li>
              <li>You will have full control to approve or deny any data sharing</li>
              <li>We will only share aggregated, anonymized data unless you specifically consent to more</li>
              <li>You can withdraw consent at any time</li>
              <li>We will provide clear value exchange and benefits for data sharing</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-800 mb-4">4. Data Security</h2>
            <p className="text-slate-600 mb-3">We implement multiple layers of security:</p>
            <ul className="list-disc pl-6 text-slate-600 space-y-2">
              <li><strong>Encryption:</strong> HTTPS/TLS for all data transmission</li>
              <li><strong>Access Controls:</strong> Limited employee access with authentication requirements</li>
              <li><strong>Client-Side Processing:</strong> Sensitive calculator data stays in your browser</li>
              <li><strong>Regular Audits:</strong> Security assessments and updates</li>
              <li><strong>Incident Response:</strong> Procedures to handle any potential breaches</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-800 mb-4">5. Data Retention</h2>
            <p className="text-slate-600 mb-3">Our data retention practices:</p>
            <ul className="list-disc pl-6 text-slate-600 space-y-2">
              <li><strong>Calculator Data:</strong> Not stored unless you opt-in; deleted from browser when you clear cache</li>
              <li><strong>Analytics Data:</strong> Aggregated data retained for 26 months per Google Analytics default</li>
              <li><strong>Contact Information:</strong> Retained as long as necessary to respond to your inquiry</li>
              <li><strong>Legal Records:</strong> Retained as required by law or for legitimate business purposes</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-800 mb-4">6. Your Rights and Choices</h2>
            
            <h3 className="text-lg font-semibold text-slate-700 mb-3">6.1 General Rights</h3>
            <p className="text-slate-600 mb-3">You have the right to:</p>
            <ul className="list-disc pl-6 text-slate-600 space-y-2 mb-4">
              <li><strong>Access:</strong> Request a copy of information we have about you</li>
              <li><strong>Correction:</strong> Request correction of inaccurate information</li>
              <li><strong>Deletion:</strong> Request deletion of your personal information</li>
              <li><strong>Opt-Out:</strong> Disable analytics tracking and marketing communications</li>
              <li><strong>Portability:</strong> Receive your data in a structured, machine-readable format</li>
              <li><strong>Withdraw Consent:</strong> Withdraw any consent you've previously given</li>
            </ul>

            <h3 className="text-lg font-semibold text-slate-700 mb-3">6.2 How to Exercise Your Rights</h3>
            <ul className="list-disc pl-6 text-slate-600 space-y-2">
              <li>Email us at privacy@cainjurysettlement.com with your request</li>
              <li>Include "Privacy Rights Request" in the subject line</li>
              <li>Provide enough information to verify your identity</li>
              <li>Specify which rights you want to exercise</li>
              <li>We will respond within 30 days (45 days for complex requests)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-800 mb-4">7. California Privacy Rights (CCPA)</h2>
            <div className="bg-blue-50 border border-blue-200 p-4 rounded mb-4">
              <p className="text-slate-700 font-semibold mb-2">California Residents Have Additional Rights:</p>
              <ul className="list-disc pl-6 text-slate-700 space-y-2">
                <li>Right to know what personal information we collect, use, and share</li>
                <li>Right to delete personal information (with some exceptions)</li>
                <li>Right to opt-out of the sale of personal information</li>
                <li>Right to non-discrimination for exercising privacy rights</li>
              </ul>
            </div>
            
            <h3 className="text-lg font-semibold text-slate-700 mb-3">Categories of Information We Collect</h3>
            <table className="w-full border-collapse border border-slate-300 mb-4">
              <thead>
                <tr className="bg-slate-100">
                  <th className="border border-slate-300 px-4 py-2 text-left">Category</th>
                  <th className="border border-slate-300 px-4 py-2 text-left">Examples</th>
                  <th className="border border-slate-300 px-4 py-2 text-left">Collected?</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-slate-300 px-4 py-2">Identifiers</td>
                  <td className="border border-slate-300 px-4 py-2">IP address, device ID</td>
                  <td className="border border-slate-300 px-4 py-2">Yes (anonymized)</td>
                </tr>
                <tr>
                  <td className="border border-slate-300 px-4 py-2">Personal Information</td>
                  <td className="border border-slate-300 px-4 py-2">Name, email (if provided)</td>
                  <td className="border border-slate-300 px-4 py-2">Only if you contact us</td>
                </tr>
                <tr>
                  <td className="border border-slate-300 px-4 py-2">Commercial Information</td>
                  <td className="border border-slate-300 px-4 py-2">Purchase history</td>
                  <td className="border border-slate-300 px-4 py-2">No</td>
                </tr>
                <tr>
                  <td className="border border-slate-300 px-4 py-2">Internet Activity</td>
                  <td className="border border-slate-300 px-4 py-2">Browsing history on our site</td>
                  <td className="border border-slate-300 px-4 py-2">Yes</td>
                </tr>
                <tr>
                  <td className="border border-slate-300 px-4 py-2">Geolocation</td>
                  <td className="border border-slate-300 px-4 py-2">Approximate location</td>
                  <td className="border border-slate-300 px-4 py-2">City/State level only</td>
                </tr>
              </tbody>
            </table>
            
            <p className="text-slate-600 mb-3">
              <strong>Do Not Sell My Personal Information:</strong> We do not sell personal information. However, you can opt-out of any future sales by emailing privacy@cainjurysettlement.com.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-800 mb-4">8. European Privacy Rights (GDPR)</h2>
            <p className="text-slate-600 mb-3">
              If you are in the European Economic Area (EEA), UK, or Switzerland, you have additional rights:
            </p>
            
            <h3 className="text-lg font-semibold text-slate-700 mb-3">Legal Basis for Processing</h3>
            <ul className="list-disc pl-6 text-slate-600 space-y-2 mb-4">
              <li><strong>Consent:</strong> For analytics cookies and marketing communications</li>
              <li><strong>Legitimate Interests:</strong> For providing and improving our service</li>
              <li><strong>Legal Obligations:</strong> When required by law</li>
            </ul>
            
            <h3 className="text-lg font-semibold text-slate-700 mb-3">Additional GDPR Rights</h3>
            <ul className="list-disc pl-6 text-slate-600 space-y-2">
              <li>Right to restrict processing of your data</li>
              <li>Right to object to processing based on legitimate interests</li>
              <li>Right to lodge a complaint with a supervisory authority</li>
              <li>Right to withdraw consent at any time</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-800 mb-4">9. Children's Privacy</h2>
            <p className="text-slate-600">
              Our service is not intended for children under 18. We do not knowingly collect personal information from children. If you are a parent and believe your child has provided us with personal information, please contact us immediately at privacy@cainjurysettlement.com.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-800 mb-4">10. International Data Transfers</h2>
            <p className="text-slate-600">
              Your information may be transferred to and processed in the United States where our servers are located. By using our service, you consent to this transfer. We ensure appropriate safeguards are in place to protect your information in accordance with this privacy policy.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-800 mb-4">11. Contact Information</h2>
            <div className="bg-slate-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-slate-800 mb-3">Privacy Officer</h3>
              <p className="text-slate-700 mb-4">
                For privacy-related inquiries, requests, or complaints:
              </p>
              <div className="space-y-2 text-slate-700">
                <p><strong>Email:</strong> privacy@cainjurysettlement.com</p>
                <p><strong>Response Time:</strong> Within 30 days</p>
                <p><strong>Address:</strong> California, USA</p>
              </div>
              
              <div className="mt-4 pt-4 border-t border-slate-200">
                <p className="text-sm text-slate-600">
                  When contacting us, please include as much detail as possible about your request or concern. We may need to verify your identity before processing certain requests.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-800 mb-4">12. Changes to This Policy</h2>
            <p className="text-slate-600 mb-3">
              We may update this privacy policy to reflect changes in our practices or for legal reasons. When we make changes:
            </p>
            <ul className="list-disc pl-6 text-slate-600 space-y-2">
              <li>We will update the "Last updated" date at the top</li>
              <li>For material changes, we will provide prominent notice on our website</li>
              <li>We may notify you by email if you've provided it</li>
              <li>Your continued use after changes means you accept the updated policy</li>
            </ul>
            <p className="text-slate-600 mt-4">
              We encourage you to review this policy periodically to stay informed about how we protect your information.
            </p>
          </section>
        </div>
      </div>
      <Footer />
    </div>
  )
}