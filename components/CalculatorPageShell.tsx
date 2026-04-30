import SettlementCalculator from '@/components/SettlementCalculator';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CalculatorSeoContent from '@/components/CalculatorSeoContent';
import { createCalculatorDraftBootstrapScript } from '@/lib/calculatorDraft';
import {
  DEFAULT_OPEN_GRAPH_IMAGE,
  HOME_FAQS,
  createBreadcrumbJsonLd,
  createFaqJsonLd,
  createImageObjectJsonLd,
  createOrganizationJsonLd,
  createWebApplicationJsonLd
} from '@/lib/seo';

interface CalculatorPageShellProps {
  initialEstimateSlug?: string | null;
}

export default function CalculatorPageShell({ initialEstimateSlug }: CalculatorPageShellProps) {
  const isCanonicalCalculatorPage = !initialEstimateSlug;
  const homeJsonLd = [
    createOrganizationJsonLd(),
    createWebApplicationJsonLd(),
    createBreadcrumbJsonLd([{ name: 'Calculator', path: '/' }]),
    createFaqJsonLd(HOME_FAQS),
    createImageObjectJsonLd(DEFAULT_OPEN_GRAPH_IMAGE)
  ];

  return (
    <>
      <script
        id="calculator-draft-bootstrap"
        dangerouslySetInnerHTML={{ __html: createCalculatorDraftBootstrapScript() }}
      />
      {isCanonicalCalculatorPage && homeJsonLd.map((jsonLd, index) => (
        <script
          key={index}
          id={`home-jsonld-${index}`}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      ))}

      <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50">
        <Header enableCalculatorReset />
        <main className="container mx-auto px-4 py-5 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
          <div className="mx-auto max-w-6xl">
            <section aria-label="Settlement Calculator">
              <SettlementCalculator initialEstimateSlug={initialEstimateSlug} />
            </section>
            {isCanonicalCalculatorPage && <CalculatorSeoContent />}
          </div>
        </main>
        <Footer />
      </div>
    </>
  );
}
