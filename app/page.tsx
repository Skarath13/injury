import SettlementCalculator from '@/components/SettlementCalculator';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Script from 'next/script';

const structuredData = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "name": "California Auto Injury Settlement Calculator",
  "description": "Free California auto injury settlement calculator providing realistic estimates based on insurance industry data",
  "url": "https://cainjurysettlement.com",
  "applicationCategory": "LegalService",
  "operatingSystem": "Web Browser",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD"
  },
  "creator": {
    "@type": "Organization",
    "name": "CA Injury Settlement Calculator",
    "url": "https://cainjurysettlement.com"
  },
  "mainEntity": {
    "@type": "Calculator",
    "name": "Auto Injury Settlement Calculator",
    "description": "Calculate potential settlement amounts for California auto injury cases"
  },
  "audience": {
    "@type": "Audience",
    "audienceType": "Auto accident victims in California"
  },
  "featureList": [
    "Settlement estimation based on injury type",
    "Medical cost calculations",
    "Pain and suffering estimates",
    "Attorney fee calculations",
    "California-specific legal considerations"
  ],
  "serviceArea": {
    "@type": "State",
    "name": "California"
  }
};

const breadcrumbData = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "Home",
      "item": "https://cainjurysettlement.com"
    }
  ]
};

const faqData = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "How accurate is the California auto injury settlement calculator?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Our calculator provides estimates based on actual California settlement data and insurance industry patterns. However, every case is unique and actual settlements can vary significantly based on specific circumstances, evidence, and legal representation."
      }
    },
    {
      "@type": "Question", 
      "name": "What factors affect auto injury settlement amounts in California?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Key factors include injury severity, medical costs, lost wages, pain and suffering, fault percentage, policy limits, pre-existing conditions, and whether you have legal representation. Our calculator considers all these California-specific factors."
      }
    },
    {
      "@type": "Question",
      "name": "Do I need a lawyer for my California auto injury claim?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "While not required, having an attorney typically increases settlement amounts by 2-3x despite attorney fees. Our calculator shows both represented and unrepresented estimates to help you make an informed decision."
      }
    }
  ]
};

export default function Home() {
  return (
    <>
      <Script
        id="structured-data"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <Script
        id="breadcrumb-data"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbData) }}
      />
      <Script
        id="faq-data"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqData) }}
      />
      
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
        <Header />
        <main className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="max-w-4xl mx-auto">
          <section aria-label="Settlement Calculator">
            <SettlementCalculator />
          </section>
          
          <section className="mt-12" aria-label="Additional Information">
            <div className="bg-slate-50 rounded-lg p-6">
              <h2 className="text-2xl font-semibold text-slate-900 mb-4">Why Use Our California Settlement Calculator?</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-slate-800 mb-2">Based on Real Data</h3>
                  <p className="text-slate-600 text-sm">
                    Our calculator uses actual California settlement patterns and insurance industry practices, 
                    not inflated marketing promises.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-800 mb-2">California-Specific</h3>
                  <p className="text-slate-600 text-sm">
                    Designed specifically for California law, including comparative negligence rules, 
                    policy minimums, and local settlement patterns.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-800 mb-2">Comprehensive Factors</h3>
                  <p className="text-slate-600 text-sm">
                    Considers medical costs, lost wages, pain & suffering, age, injury severity, 
                    and whether you have legal representation.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-800 mb-2">Free & Private</h3>
                  <p className="text-slate-600 text-sm">
                    Completely free to use with calculations performed in your browser. 
                    We don't store your personal information.
                  </p>
                </div>
              </div>
              <div className="mt-6 pt-6 border-t border-slate-200">
                <p className="text-sm text-slate-600">
                  Need more information? Visit our <a href="/about" className="text-blue-600 hover:text-blue-700 underline">About page</a> to learn how our calculator works, 
                  or <a href="/contact" className="text-blue-600 hover:text-blue-700 underline">contact us</a> with questions.
                </p>
              </div>
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </div>
    </>
  );
}
