import SettlementCalculator from '@/components/SettlementCalculator';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const structuredData = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "name": "California Auto Injury Settlement Calculator",
  "description": "California auto injury settlement calculator providing educational insurance settlement estimates after phone verification",
  "url": "https://californiasettlementcalculator.com",
  "applicationCategory": "LegalService",
  "operatingSystem": "Web Browser",
  "creator": {
    "@type": "Organization",
    "name": "CA Injury Settlement Calculator",
    "url": "https://californiasettlementcalculator.com"
  },
  "mainEntity": {
    "@type": "Calculator",
    "name": "Auto Injury Settlement Calculator",
    "description": "Prepare an educational settlement estimate for California auto injury cases"
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
      "item": "https://californiasettlementcalculator.com"
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
      "text": "The calculator provides educational estimates based on configured insurance-claim factors. Every case is unique, and actual settlements can vary significantly based on facts, evidence, medical treatment, liability, insurance limits, and legal advice."
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
        "text": "A lawyer is not required to use this calculator. If a responsible attorney advertiser is available for your accident county, you may choose whether to send results to that specifically named attorney. This does not create an attorney-client relationship."
      }
    }
  ]
};

export default function Home() {
  return (
    <>
      <script
        id="structured-data"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <script
        id="breadcrumb-data"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbData) }}
      />
      <script
        id="faq-data"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqData) }}
      />
      
      <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50">
        <Header />
        <main className="container mx-auto px-4 sm:px-6 py-5 sm:py-8">
        <div className="mx-auto max-w-6xl">
          <section aria-label="Settlement Calculator">
            <SettlementCalculator />
          </section>
        </div>
      </main>
      <Footer />
    </div>
    </>
  );
}
