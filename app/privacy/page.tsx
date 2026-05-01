import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { buildPageMetadata } from '@/lib/seo'

export const metadata = buildPageMetadata({
  title: 'Privacy Policy | CA Auto Injury Calculator Data Protection',
  description: 'Privacy policy for California auto injury settlement calculator. Learn about calculator sessions, data use, privacy choices, and California privacy rights.',
  path: '/privacy',
  keywords: [
    'privacy policy',
    'data protection',
    'CCPA compliance',
    'California privacy rights',
    'settlement calculator privacy'
  ]
});

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex flex-col">
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
              <li>Insurance and claim context, including policy-limit awareness and existing-attorney status</li>
            </ul>
            <div className="bg-green-50 border border-green-200 p-3 rounded mb-4">
              <p className="text-slate-700 text-sm">
                <strong>Important:</strong> Calculator inputs are transmitted to our Cloudflare Worker to generate and temporarily store an estimate session. If the unlock flow shows a named law firm or attorney sponsor, you can view your estimate without sending contact information, or you can choose to send your results and contact information to that named sponsor with your explicit consent.
              </p>
            </div>

            <h3 className="text-lg font-semibold text-slate-700 mb-3">1.2 Estimate Unlock and Security Data</h3>
            <ul className="list-disc pl-6 text-slate-600 space-y-2 mb-4">
              <li>Session ID, unlock status, timestamps, and duplicate-check status</li>
              <li>Accident county and attorney-contact availability status</li>
              <li>First name, last name, email address, and mobile phone number only if a named attorney contact option is displayed and you choose to use SMS verification and attorney delivery</li>
              <li>Hashed IP address and hashed browser/device metadata for fraud prevention and audit logs</li>
            </ul>

            <h3 className="text-lg font-semibold text-slate-700 mb-3">1.3 Automatically Collected Information</h3>
            <ul className="list-disc pl-6 text-slate-600 space-y-2 mb-4">
              <li><strong>Device Information:</strong> Browser type, operating system, screen resolution, device type</li>
              <li><strong>Usage Data:</strong> Pages visited, time spent, click patterns, calculator features used, when analytics are enabled through your privacy choices</li>
              <li><strong>Network Information:</strong> Hashed IP address, approximate location (city/state/country level), ISP, and California visitor eligibility status</li>
              <li><strong>Traffic Source Data:</strong> How you arrived at our site, search terms used</li>
            </ul>

            <h3 className="text-lg font-semibold text-slate-700 mb-3">1.4 Cookies and Similar Technologies</h3>
            <p className="text-slate-600 mb-3">We use the following types of cookies:</p>
            <ul className="list-disc pl-6 text-slate-600 space-y-2">
              <li><strong>Essential Cookies:</strong> Required for site functionality (session management, security)</li>
              <li><strong>Analytics Cookies:</strong> Analytics measurement only if enabled through Your Privacy Choices</li>
              <li><strong>Marketing Pixels:</strong> Advertising or retargeting pixels only if enabled through Your Privacy Choices and not blocked by a browser opt-out signal</li>
              <li><strong>Preference Cookies:</strong> Remember your privacy choices and calculator preferences</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-800 mb-4">2. How We Use Your Information</h2>
            
            <h3 className="text-lg font-semibold text-slate-700 mb-3">2.1 Primary Uses</h3>
            <ul className="list-disc pl-6 text-slate-600 space-y-2 mb-4">
              <li>Generate settlement estimates based on your inputs</li>
              <li>Create a temporary estimate session for the secure unlock flow</li>
              <li>Improve calculator accuracy and features</li>
              <li>Prevent duplicate, fake, or automated submissions</li>
              <li>Limit website access and security-sensitive flows to eligible visitors</li>
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
                We do not send calculator submissions to a law firm or attorney unless you explicitly choose the named attorney contact option shown in the unlock flow. You can view your estimate without attorney delivery.
              </p>
            </div>

            <h3 className="text-lg font-semibold text-slate-700 mb-3">3.1 Limited Sharing Scenarios</h3>
            <p className="text-slate-600 mb-3">We may share your information only in these specific circumstances:</p>
            <ul className="list-disc pl-6 text-slate-600 space-y-2 mb-4">
              <li><strong>With Your Consent:</strong> Only when you explicitly opt in to send your results and contact information to the named law firm or attorney sponsor shown before submission</li>
              <li><strong>Service Providers:</strong> Cloudflare for hosting, Workers, D1, and KV; SMS/OTP providers for optional SMS verification; analytics providers if enabled</li>
              <li><strong>Named Sponsor Recipient:</strong> If you consent, calculator results and contact information may be sent only to the specifically identified law firm or attorney sponsor shown before submission. We may receive compensation for a sponsored contact submission.</li>
              <li><strong>Marketing Providers:</strong> If you allow marketing pixels, advertising platforms may receive limited browsing or event data for ad measurement or retargeting, subject to your choices and browser privacy signals</li>
              <li><strong>Legal Requirements:</strong> When required by law, court order, or to protect rights and safety</li>
              <li><strong>Business Transfers:</strong> In the event of a merger or acquisition, with continued privacy protections</li>
            </ul>

            <h3 className="text-lg font-semibold text-slate-700 mb-3">3.2 Future Data Monetization</h3>
            <p className="text-slate-600 mb-3">
              If we ever consider monetizing user data in the future:
            </p>
            <ul className="list-disc pl-6 text-slate-600 space-y-2">
              <li>We will request explicit opt-in consent with clear explanations</li>
              <li>You will have full control to approve or deny any sponsored contact submission and marketing-pixel sharing</li>
              <li>We will only share aggregated, anonymized data unless you specifically consent to more</li>
              <li>You can withdraw consent at any time</li>
              <li>We will provide clear value exchange and benefits for data sharing</li>
            </ul>
            <p className="text-slate-600 mt-3">
              A repeat sponsored contact submission for the same hashed phone number, or a session we cannot confirm as California-eligible, is not treated as a new sponsored contact submission.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-800 mb-4">4. Data Security</h2>
            <p className="text-slate-600 mb-3">We implement multiple layers of security:</p>
            <ul className="list-disc pl-6 text-slate-600 space-y-2">
              <li><strong>Encryption:</strong> HTTPS/TLS for all data transmission</li>
              <li><strong>Access Controls:</strong> Limited employee access with authentication requirements</li>
              <li><strong>Server-Side Controls:</strong> Estimate sessions are handled through Cloudflare Workers and audit logs use hashed metadata where practical</li>
              <li><strong>Location Controls:</strong> We use coarse IP-based location signals to support California-specific estimate logic and fraud prevention</li>
              <li><strong>Regular Audits:</strong> Security assessments and updates</li>
              <li><strong>Incident Response:</strong> Procedures to handle any potential breaches</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-800 mb-4">5. Data Retention</h2>
            <p className="text-slate-600 mb-3">Our data retention practices:</p>
            <ul className="list-disc pl-6 text-slate-600 space-y-2">
              <li><strong>Calculator Data:</strong> Temporarily stored for estimate unlock and audit purposes; consented named-attorney contact records may be retained longer for compliance and dispute prevention</li>
              <li><strong>Access Logs:</strong> Hashed IP/user-agent access logs and coarse location decisions may be retained for fraud prevention, duplicate prevention, and compliance review</li>
              <li><strong>OTP Data:</strong> SMS verification codes expire quickly and are stored only as hashed values or through the verification provider</li>
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
              <li><strong>Opt-Out:</strong> Disable analytics tracking, marketing pixels, sponsored contact submissions, and marketing communications</li>
              <li><strong>Portability:</strong> Receive your data in a structured, machine-readable format</li>
              <li><strong>Withdraw Consent:</strong> Withdraw any consent you've previously given</li>
            </ul>

            <h3 className="text-lg font-semibold text-slate-700 mb-3">6.2 How to Exercise Your Rights</h3>
            <ul className="list-disc pl-6 text-slate-600 space-y-2">
              <li>Email us at <a href="mailto:contact@californiasettlementcalculator.com" className="font-medium text-sky-700 underline">contact@californiasettlementcalculator.com</a> with your request</li>
              <li>Include "Privacy Rights Request" in the subject line</li>
              <li>Provide enough information to verify your identity</li>
              <li>Specify which rights you want to exercise</li>
              <li>We will respond within 30 days (45 days for complex requests)</li>
            </ul>
          </section>

          <section id="ccpa-rights">
            <h2 className="text-2xl font-semibold text-slate-800 mb-4">7. California Privacy Rights (CCPA)</h2>
            <div className="bg-blue-50 border border-blue-200 p-4 rounded mb-4">
              <p className="text-slate-700 font-semibold mb-2">California Residents Have Additional Rights:</p>
              <ul className="list-disc pl-6 text-slate-700 space-y-2">
                <li>Right to know what personal information we collect, use, and share</li>
                <li>Right to delete personal information (with some exceptions)</li>
                <li>Right to opt-out of the sale or sharing of personal information</li>
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
                  <td className="border border-slate-300 px-4 py-2">IP address hash, session ID, and phone/email hashes only if an optional SMS attorney contact flow is used</td>
                  <td className="border border-slate-300 px-4 py-2">Yes, except phone/email hashes only if that optional flow is used</td>
                </tr>
                <tr>
                  <td className="border border-slate-300 px-4 py-2">Personal Information</td>
                  <td className="border border-slate-300 px-4 py-2">Estimate inputs, and name, email, phone number, or contact consent only if a named sponsored contact flow is used</td>
                  <td className="border border-slate-300 px-4 py-2">Yes for estimate inputs; optional for sponsored contact details</td>
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
                  <td className="border border-slate-300 px-4 py-2">Accident county, approximate network location, and California visitor eligibility status</td>
                  <td className="border border-slate-300 px-4 py-2">Yes</td>
                </tr>
              </tbody>
            </table>
            
            <p id="do-not-sell-or-share" className="text-slate-600 mb-3 scroll-mt-24">
              <strong>Do Not Sell/Share:</strong> You may opt out of marketing-pixel sale/share activity through <a href="#privacy-choices" className="font-medium text-sky-700 underline">Your Privacy Choices</a> or by emailing <a href="mailto:contact@californiasettlementcalculator.com" className="font-medium text-sky-700 underline">contact@californiasettlementcalculator.com</a> with "Do Not Sell/Share" in the subject line. We honor browser Global Privacy Control signals where detected. You can view your estimate without sending results or contact information to a named sponsor.
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
              Our service is not intended for children under 18. We do not knowingly collect personal information from children. If you are a parent and believe your child has provided us with personal information, please contact us immediately at <a href="mailto:contact@californiasettlementcalculator.com" className="font-medium text-sky-700 underline">contact@californiasettlementcalculator.com</a>.
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
                <p><strong>Email:</strong> <a href="mailto:contact@californiasettlementcalculator.com" className="font-medium text-sky-700 underline">contact@californiasettlementcalculator.com</a></p>
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
