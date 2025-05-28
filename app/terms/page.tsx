import type { Metadata } from 'next'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

export const metadata: Metadata = {
  title: 'Terms & Conditions | CA Auto Injury Calculator Legal Terms',
  description: 'Terms of use for California auto injury settlement calculator. Legal disclaimers, user responsibilities, and important limitations. Read before using our calculator.',
  keywords: 'terms of service, legal disclaimers, settlement calculator terms, California auto injury legal, user agreement',
  openGraph: {
    title: 'Terms & Conditions | CA Auto Injury Calculator Legal Terms',
    description: 'Terms of use and legal disclaimers for our California auto injury settlement calculator service.',
    url: 'https://cainjurysettlement.com/terms',
  },
  alternates: {
    canonical: 'https://cainjurysettlement.com/terms',
  },
}

export default function TermsAndConditions() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex flex-col">
      <Header />
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold text-slate-900 mb-2">Terms and Conditions</h1>
        <p className="text-sm text-slate-600 mb-8">Effective Date: {new Date().toLocaleDateString()}</p>
        
        <div className="prose prose-lg max-w-none space-y-6">
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
            <p className="text-slate-700 font-semibold">
              BINDING AGREEMENT: These Terms constitute a legally binding agreement. By using our calculator, you acknowledge that you have read, understood, and agree to be bound by these Terms.
            </p>
          </div>

          <section>
            <h2 className="text-2xl font-semibold text-slate-800 mb-4">1. Agreement to Terms</h2>
            <p className="text-slate-600 mb-3">
              By accessing, browsing, or using the California Auto Injury Settlement Calculator ("Service," "Website," "Calculator"), you agree to:
            </p>
            <ul className="list-disc pl-6 text-slate-600 space-y-2">
              <li>Be legally bound by these Terms and Conditions</li>
              <li>Our Privacy Policy (incorporated by reference)</li>
              <li>All applicable laws and regulations</li>
              <li>Be at least 18 years old or have parental consent</li>
            </ul>
            <p className="text-slate-600 mt-3">
              If you disagree with any part of these terms, you must immediately discontinue use of our Service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-800 mb-4">2. Service Description and Limitations</h2>
            
            <h3 className="text-lg font-semibold text-slate-700 mb-3">2.1 What We Provide</h3>
            <p className="text-slate-600 mb-3">
              The California Auto Injury Settlement Calculator is an educational tool that:
            </p>
            <ul className="list-disc pl-6 text-slate-600 space-y-2 mb-4">
              <li>Generates settlement estimates based on user inputs</li>
              <li>Uses California-specific data patterns and algorithms</li>
              <li>Provides general information about the settlement process</li>
              <li>Offers educational content about auto injury claims</li>
            </ul>

            <h3 className="text-lg font-semibold text-slate-700 mb-3">2.2 What We DON'T Provide</h3>
            <ul className="list-disc pl-6 text-slate-600 space-y-2">
              <li>Legal advice or representation</li>
              <li>Guaranteed or exact settlement amounts</li>
              <li>Medical advice or diagnosis</li>
              <li>Insurance claim filing services</li>
              <li>Attorney referrals or recommendations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-800 mb-4">3. Legal Disclaimers and Warnings</h2>
            
            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
              <h3 className="text-lg font-semibold text-slate-800 mb-2">NO ATTORNEY-CLIENT RELATIONSHIP</h3>
              <p className="text-slate-700">
                Using this calculator does NOT create an attorney-client relationship. We are NOT a law firm and do NOT provide legal representation or advice.
              </p>
            </div>

            <h3 className="text-lg font-semibold text-slate-700 mb-3">3.1 No Legal Advice</h3>
            <p className="text-slate-600 mb-3">
              The information provided by our calculator:
            </p>
            <ul className="list-disc pl-6 text-slate-600 space-y-2 mb-4">
              <li>Is for informational and educational purposes only</li>
              <li>Should not be relied upon as legal advice</li>
              <li>Cannot replace consultation with a qualified attorney</li>
              <li>May not apply to your specific circumstances</li>
              <li>Is based on general patterns, not guaranteed outcomes</li>
            </ul>

            <h3 className="text-lg font-semibold text-slate-700 mb-3">3.2 Statute of Limitations Warning</h3>
            <div className="bg-amber-50 border border-amber-200 p-3 rounded mb-4">
              <p className="text-slate-700">
                <strong>TIME LIMITS APPLY:</strong> California has strict deadlines (statutes of limitations) for filing personal injury claims. Generally, you have 2 years from the date of injury, but exceptions exist. Using this calculator does NOT stop or extend these deadlines. Consult an attorney immediately to protect your rights.
              </p>
            </div>

            <h3 className="text-lg font-semibold text-slate-700 mb-3">3.3 No Guarantee of Results</h3>
            <p className="text-slate-600">
              Settlement estimates are based on historical data and general patterns. Your actual case value may be significantly higher or lower based on factors including but not limited to: specific facts, evidence quality, witness credibility, jury composition, venue, opposing counsel, and insurance company practices.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-800 mb-4">4. Disclaimers of Warranties</h2>
            
            <h3 className="text-lg font-semibold text-slate-700 mb-3">4.1 "AS IS" Basis</h3>
            <p className="text-slate-600 mb-3">
              THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO:
            </p>
            <ul className="list-disc pl-6 text-slate-600 space-y-2 mb-4">
              <li>Warranties of merchantability</li>
              <li>Fitness for a particular purpose</li>
              <li>Non-infringement</li>
              <li>Accuracy or reliability of information</li>
              <li>Uninterrupted or error-free operation</li>
            </ul>

            <h3 className="text-lg font-semibold text-slate-700 mb-3">4.2 No Warranty of Accuracy</h3>
            <p className="text-slate-600">
              We do not warrant that settlement estimates will be accurate, current, complete, reliable, or error-free. The calculator uses algorithms based on historical patterns which may not reflect current or future settlement values.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-800 mb-4">5. User Conduct and Responsibilities</h2>
            
            <h3 className="text-lg font-semibold text-slate-700 mb-3">5.1 Acceptable Use</h3>
            <p className="text-slate-600 mb-3">You agree to use our Service only for lawful purposes and in accordance with these Terms. You agree NOT to:</p>
            <ul className="list-disc pl-6 text-slate-600 space-y-2 mb-4">
              <li>Provide false, misleading, or fraudulent information</li>
              <li>Use the Service to harass, abuse, or harm others</li>
              <li>Violate any applicable laws or regulations</li>
              <li>Infringe on intellectual property rights</li>
              <li>Attempt to gain unauthorized access to our systems</li>
              <li>Interfere with or disrupt the Service or servers</li>
              <li>Use automated systems or software to extract data (scraping)</li>
              <li>Reverse engineer or decompile any part of the Service</li>
              <li>Use the Service for commercial purposes without written permission</li>
              <li>Resell or redistribute our content or services</li>
            </ul>

            <h3 className="text-lg font-semibold text-slate-700 mb-3">5.2 Your Responsibilities</h3>
            <p className="text-slate-600 mb-3">You acknowledge and agree that:</p>
            <ul className="list-disc pl-6 text-slate-600 space-y-2">
              <li>You are solely responsible for evaluating the accuracy and usefulness of estimates</li>
              <li>You will not rely solely on our estimates for legal decisions</li>
              <li>You will seek appropriate professional advice when needed</li>
              <li>You are responsible for maintaining confidentiality of your information</li>
              <li>You will comply with all applicable laws in your use of the Service</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-800 mb-4">6. Intellectual Property Rights</h2>
            
            <h3 className="text-lg font-semibold text-slate-700 mb-3">6.1 Our Property</h3>
            <p className="text-slate-600 mb-3">
              All content and materials available on the Service, including but not limited to:
            </p>
            <ul className="list-disc pl-6 text-slate-600 space-y-2 mb-4">
              <li>Calculator algorithms and methodologies</li>
              <li>Text, graphics, logos, button icons, images</li>
              <li>Software code and compilation</li>
              <li>Audio and video clips</li>
              <li>Data compilations and databases</li>
              <li>All other content</li>
            </ul>
            <p className="text-slate-600 mb-4">
              Are owned by us or our licensors and protected by US and international copyright, trademark, patent, trade secret, and other intellectual property laws.
            </p>

            <h3 className="text-lg font-semibold text-slate-700 mb-3">6.2 Limited License</h3>
            <p className="text-slate-600 mb-3">
              We grant you a limited, non-exclusive, non-transferable, revocable license to access and use the Service for personal, non-commercial purposes only. This license does not include:
            </p>
            <ul className="list-disc pl-6 text-slate-600 space-y-2">
              <li>Resale or commercial use of the Service</li>
              <li>Collection and use of any content for machine learning or AI training</li>
              <li>Derivative uses of the Service or content</li>
              <li>Downloading or copying content except for personal use</li>
              <li>Any use of data mining, robots, or similar tools</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-800 mb-4">7. Limitation of Liability</h2>
            
            <div className="bg-red-50 border border-red-200 p-4 rounded mb-4">
              <p className="text-slate-700 font-semibold uppercase">
                IMPORTANT: READ THIS SECTION CAREFULLY AS IT LIMITS OUR LIABILITY TO YOU.
              </p>
            </div>

            <h3 className="text-lg font-semibold text-slate-700 mb-3">7.1 No Consequential Damages</h3>
            <p className="text-slate-600 mb-3">
              TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT SHALL WE BE LIABLE FOR:
            </p>
            <ul className="list-disc pl-6 text-slate-600 space-y-2 mb-4">
              <li>Indirect, incidental, special, exemplary, or consequential damages</li>
              <li>Loss of profits, revenue, data, or use</li>
              <li>Loss of goodwill or reputation</li>
              <li>Cost of substitute services</li>
              <li>Any damages based on reliance on calculator estimates</li>
              <li>Failure to meet any statute of limitations</li>
              <li>Any damages exceeding $100 USD</li>
            </ul>

            <h3 className="text-lg font-semibold text-slate-700 mb-3">7.2 Basis of the Bargain</h3>
            <p className="text-slate-600 mb-3">
              You acknowledge that we have offered the Service free of charge in reliance upon the limitations of liability and disclaimers set forth herein, which form an essential basis of the bargain between us.
            </p>

            <h3 className="text-lg font-semibold text-slate-700 mb-3">7.3 Some Jurisdictions</h3>
            <p className="text-slate-600">
              Some jurisdictions do not allow exclusion of implied warranties or limitation of liability for incidental or consequential damages. In such jurisdictions, our liability shall be limited to the greatest extent permitted by law.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-800 mb-4">8. Indemnification</h2>
            
            <h3 className="text-lg font-semibold text-slate-700 mb-3">8.1 Your Indemnification Obligations</h3>
            <p className="text-slate-600 mb-3">
              You agree to indemnify, defend, and hold harmless our company, affiliates, officers, directors, employees, agents, licensors, and suppliers (collectively, "Indemnified Parties") from and against all claims, losses, expenses, damages, and costs, including reasonable attorneys' fees, resulting from:
            </p>
            <ul className="list-disc pl-6 text-slate-600 space-y-2 mb-4">
              <li>Your violation of these Terms</li>
              <li>Your use or misuse of the Service</li>
              <li>Your violation of any third party rights</li>
              <li>Your violation of any applicable laws</li>
              <li>Any false or misleading information you provide</li>
              <li>Your negligent or wrongful conduct</li>
              <li>Any claim that your use caused damage to a third party</li>
            </ul>

            <h3 className="text-lg font-semibold text-slate-700 mb-3">8.2 Defense and Settlement</h3>
            <p className="text-slate-600">
              We reserve the right to assume exclusive defense and control of any matter subject to indemnification by you. You agree to cooperate with our defense of such claims. You will not settle any claim without our prior written consent.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-800 mb-4">9. Privacy and Data Protection</h2>
            <p className="text-slate-600 mb-3">
              Your use of the Service is governed by our <a href="/privacy" className="text-blue-600 hover:text-blue-700 underline">Privacy Policy</a>, which is incorporated into these Terms by reference. By using the Service, you:
            </p>
            <ul className="list-disc pl-6 text-slate-600 space-y-2">
              <li>Consent to our collection and use of data as described in the Privacy Policy</li>
              <li>Acknowledge that Internet transmissions are never completely secure</li>
              <li>Understand we cannot guarantee the security of information you transmit</li>
              <li>Agree to the data practices outlined in our Privacy Policy</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-800 mb-4">10. Termination</h2>
            
            <h3 className="text-lg font-semibold text-slate-700 mb-3">10.1 Termination by Us</h3>
            <p className="text-slate-600 mb-3">
              We may terminate or suspend your access to the Service immediately, without prior notice or liability, for any reason, including:
            </p>
            <ul className="list-disc pl-6 text-slate-600 space-y-2 mb-4">
              <li>Breach of these Terms</li>
              <li>Violation of applicable laws</li>
              <li>Conduct harmful to other users or our interests</li>
              <li>At our sole discretion for any reason</li>
            </ul>

            <h3 className="text-lg font-semibold text-slate-700 mb-3">10.2 Effect of Termination</h3>
            <p className="text-slate-600">
              Upon termination, your right to use the Service will immediately cease. All provisions of these Terms that by their nature should survive termination shall survive, including ownership provisions, warranty disclaimers, indemnity, and limitations of liability.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-800 mb-4">11. Modifications to Terms</h2>
            <p className="text-slate-600 mb-3">
              We reserve the right to modify these Terms at any time. When we make changes:
            </p>
            <ul className="list-disc pl-6 text-slate-600 space-y-2">
              <li>We will update the "Effective Date" at the top</li>
              <li>Material changes may be notified via website notice</li>
              <li>Your continued use constitutes acceptance of new Terms</li>
              <li>If you disagree with changes, you must stop using the Service</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-800 mb-4">12. Dispute Resolution</h2>
            
            <h3 className="text-lg font-semibold text-slate-700 mb-3">12.1 Governing Law</h3>
            <p className="text-slate-600 mb-4">
              These Terms and any dispute arising out of or related to them or the Service shall be governed by and construed in accordance with the laws of the State of California, without regard to conflict of law principles.
            </p>

            <h3 className="text-lg font-semibold text-slate-700 mb-3">12.2 Arbitration Agreement</h3>
            <div className="bg-amber-50 border border-amber-200 p-3 rounded mb-4">
              <p className="text-slate-700 font-semibold">
                PLEASE READ CAREFULLY: This section requires arbitration of disputes instead of jury trials or class actions.
              </p>
            </div>
            <p className="text-slate-600 mb-3">
              Any dispute arising from these Terms or your use of the Service shall be resolved through binding arbitration in accordance with the JAMS Streamlined Arbitration Rules. The arbitration shall be:
            </p>
            <ul className="list-disc pl-6 text-slate-600 space-y-2 mb-4">
              <li>Conducted in California</li>
              <li>Conducted by a single arbitrator</li>
              <li>Limited to your individual claims (no class actions)</li>
              <li>Confidential</li>
            </ul>

            <h3 className="text-lg font-semibold text-slate-700 mb-3">12.3 Class Action Waiver</h3>
            <p className="text-slate-600">
              YOU AGREE THAT ANY CLAIMS WILL BE BROUGHT IN YOUR INDIVIDUAL CAPACITY ONLY, AND NOT AS A PLAINTIFF OR CLASS MEMBER IN ANY PURPORTED CLASS OR REPRESENTATIVE PROCEEDING.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-800 mb-4">13. General Provisions</h2>
            
            <h3 className="text-lg font-semibold text-slate-700 mb-3">13.1 Entire Agreement</h3>
            <p className="text-slate-600 mb-4">
              These Terms, together with our Privacy Policy, constitute the entire agreement between you and us regarding the Service and supersede all prior agreements.
            </p>

            <h3 className="text-lg font-semibold text-slate-700 mb-3">13.2 Severability</h3>
            <p className="text-slate-600 mb-4">
              If any provision of these Terms is found to be invalid or unenforceable, the remaining provisions shall continue in full force and effect.
            </p>

            <h3 className="text-lg font-semibold text-slate-700 mb-3">13.3 No Waiver</h3>
            <p className="text-slate-600 mb-4">
              Our failure to enforce any right or provision of these Terms shall not be deemed a waiver of such right or provision.
            </p>

            <h3 className="text-lg font-semibold text-slate-700 mb-3">13.4 Assignment</h3>
            <p className="text-slate-600">
              You may not assign or transfer these Terms. We may assign our rights and obligations without restriction.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-800 mb-4">14. Contact Information</h2>
            <div className="bg-slate-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-slate-800 mb-3">Legal Department</h3>
              <p className="text-slate-700 mb-4">
                For questions about these Terms and Conditions:
              </p>
              <div className="space-y-2 text-slate-700">
                <p><strong>Email:</strong> legal@cainjurysettlement.com</p>
                <p><strong>Subject Line:</strong> "Terms of Service Inquiry"</p>
                <p><strong>Response Time:</strong> 5-7 business days</p>
                <p><strong>Address:</strong> California, USA</p>
              </div>
              
              <div className="mt-4 pt-4 border-t border-slate-200">
                <p className="text-sm text-slate-600">
                  For privacy-related inquiries, please contact privacy@cainjurysettlement.com. For general support, visit our <a href="/contact" className="text-blue-600 hover:text-blue-700 underline">Contact page</a>.
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