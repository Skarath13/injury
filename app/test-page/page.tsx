import type { Metadata } from 'next'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Site Structure Test | CA Auto Injury Settlement Calculator',
  description: 'Test page for Google Search Console URL inspection and site structure validation. Internal linking and navigation test.',
  robots: {
    index: false, // Don't index this test page
    follow: true,
  },
}

export default function TestPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex flex-col">
      <Header />
      <main className="container mx-auto px-4 py-8 flex-grow">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-slate-900 mb-6">Site Structure & Link Test Page</h1>
          
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-8">
            <p className="text-amber-800">
              <strong>Note:</strong> This is a test page for Google Search Console URL inspection and site structure validation. 
              It's set to noindex to avoid appearing in search results.
            </p>
          </div>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-slate-800 mb-4">Internal Site Navigation</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white border border-slate-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-slate-700 mb-3">Main Pages</h3>
                <ul className="space-y-2">
                  <li><Link href="/" className="text-blue-600 hover:text-blue-700 underline">🏠 Home - Settlement Calculator</Link></li>
                  <li><Link href="/about" className="text-blue-600 hover:text-blue-700 underline">ℹ️ About Our Calculator</Link></li>
                  <li><Link href="/contact" className="text-blue-600 hover:text-blue-700 underline">📞 Contact Us</Link></li>
                </ul>
              </div>
              
              <div className="bg-white border border-slate-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-slate-700 mb-3">Legal Pages</h3>
                <ul className="space-y-2">
                  <li><Link href="/privacy" className="text-blue-600 hover:text-blue-700 underline">🔒 Privacy Policy</Link></li>
                  <li><Link href="/terms" className="text-blue-600 hover:text-blue-700 underline">📄 Terms & Conditions</Link></li>
                </ul>
              </div>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-slate-800 mb-4">SEO & Technical Information</h2>
            <div className="bg-slate-50 rounded-lg p-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-slate-700 mb-3">Site Features</h3>
                  <ul className="text-sm text-slate-600 space-y-1">
                    <li>✅ Responsive mobile design</li>
                    <li>✅ Semantic HTML structure</li>
                    <li>✅ Structured data (JSON-LD)</li>
                    <li>✅ Open Graph meta tags</li>
                    <li>✅ XML sitemap</li>
                    <li>✅ Robots.txt file</li>
                    <li>✅ Canonical URLs</li>
                    <li>✅ HTTPS ready</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold text-slate-700 mb-3">Performance</h3>
                  <ul className="text-sm text-slate-600 space-y-1">
                    <li>✅ Next.js 15 optimization</li>
                    <li>✅ Image optimization enabled</li>
                    <li>✅ Compression enabled</li>
                    <li>✅ Security headers</li>
                    <li>✅ Cookie consent (GDPR/CCPA)</li>
                    <li>✅ PWA ready</li>
                    <li>✅ Anti-aliased fonts</li>
                    <li>✅ Accessibility ARIA labels</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-slate-800 mb-4">Key Landing Pages for SEO</h2>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-slate-800">Primary Target: "California Auto Injury Settlement Calculator"</h3>
                  <p className="text-sm text-slate-600">Main calculator page with comprehensive form and realistic estimates</p>
                  <Link href="/" className="text-blue-600 hover:text-blue-700 underline text-sm">→ Visit Calculator</Link>
                </div>
                
                <div>
                  <h3 className="font-semibold text-slate-800">Secondary: "How Auto Injury Calculator Works"</h3>
                  <p className="text-sm text-slate-600">Detailed explanation of methodology and data sources</p>
                  <Link href="/about" className="text-blue-600 hover:text-blue-700 underline text-sm">→ Learn More</Link>
                </div>
                
                <div>
                  <h3 className="font-semibold text-slate-800">Support: "California Auto Injury Calculator Support"</h3>
                  <p className="text-sm text-slate-600">Contact form and frequently asked questions</p>
                  <Link href="/contact" className="text-blue-600 hover:text-blue-700 underline text-sm">→ Get Help</Link>
                </div>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-800 mb-4">Technical Files</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white border border-slate-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-slate-700 mb-3">Search Engine Files</h3>
                <ul className="text-sm space-y-2">
                  <li><a href="/robots.txt" className="text-blue-600 hover:text-blue-700 underline" target="_blank">🤖 robots.txt</a></li>
                  <li><a href="/sitemap.xml" className="text-blue-600 hover:text-blue-700 underline" target="_blank">🗺️ sitemap.xml</a></li>
                  <li><a href="/google-site-verification.html" className="text-blue-600 hover:text-blue-700 underline" target="_blank">🔍 Google Verification</a></li>
                </ul>
              </div>
              
              <div className="bg-white border border-slate-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-slate-700 mb-3">App Metadata</h3>
                <ul className="text-sm space-y-2">
                  <li><a href="/manifest.json" className="text-blue-600 hover:text-blue-700 underline" target="_blank">📱 App Manifest</a></li>
                </ul>
              </div>
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  )
}
