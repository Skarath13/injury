import Link from 'next/link';
import Footer from '@/components/Footer';
import Header from '@/components/Header';
import {
  buildPageMetadata,
  createBreadcrumbJsonLd
} from '@/lib/seo';
import { SEO_GUIDES } from '@/lib/seoGuides';

export const metadata = buildPageMetadata({
  title: 'California Auto Injury Settlement Guides',
  description:
    'Browse California auto injury settlement guides about calculators, settlement offers, insurance, pain and suffering, liens, timelines, comparative fault, and claim value factors.',
  path: '/guides',
  keywords: [
    'California auto injury settlement guides',
    'California settlement calculator guides',
    'car accident settlement calculator California',
    'personal injury settlement calculator California'
  ]
});

const featuredSlugs = new Set([
  'california-car-accident-settlement-factors',
  'california-personal-injury-settlement-calculator',
  'california-settlement-offer-calculator',
  'california-auto-insurance-settlement-calculator'
]);

export default function GuidesPage() {
  const breadcrumbJsonLd = createBreadcrumbJsonLd([
    { name: 'Calculator', path: '/' },
    { name: 'Guides', path: '/guides' }
  ]);
  const featuredGuides = SEO_GUIDES.filter((guide) => featuredSlugs.has(guide.slug));
  const supportingGuides = SEO_GUIDES.filter((guide) => !featuredSlugs.has(guide.slug));

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50 text-slate-950">
      <script
        id="guides-breadcrumb-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <Header />
      <main className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <nav aria-label="Breadcrumb" className="mb-6 text-sm text-slate-500">
            <Link href="/" className="font-medium text-sky-700 hover:text-sky-900">
              Calculator
            </Link>
            <span className="mx-2">/</span>
            <span>Guides</span>
          </nav>

          <header className="border-b border-slate-200 pb-8">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-emerald-700">
              California settlement library
            </p>
            <h1 className="mt-3 max-w-4xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
              California Auto Injury Settlement Guides
            </h1>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-700">
              Use these guides to understand the claim factors behind the calculator: injury severity, treatment,
              settlement offers, insurance context, pain and suffering, comparative fault, timelines, liens, and net
              payout considerations.
            </p>
          </header>

          <section aria-labelledby="featured-guides" className="py-8">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 id="featured-guides" className="text-2xl font-semibold text-slate-950">
                  Start Here
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                  These pages match the highest-intent calculator and settlement-offer searches.
                </p>
              </div>
              <Link
                href="/"
                className="inline-flex min-h-11 items-center justify-center rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-amber-400"
              >
                Start the calculator
              </Link>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {featuredGuides.map((guide) => (
                <Link
                  key={guide.slug}
                  href={`/${guide.slug}`}
                  className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:border-amber-300 hover:shadow-md"
                >
                  <h3 className="text-lg font-semibold text-slate-950">{guide.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-700">{guide.description}</p>
                </Link>
              ))}
            </div>
          </section>

          <section aria-labelledby="all-guides" className="border-t border-slate-200 pt-8">
            <h2 id="all-guides" className="text-2xl font-semibold text-slate-950">
              More Settlement Topics
            </h2>
            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {supportingGuides.map((guide) => (
                <Link
                  key={guide.slug}
                  href={`/${guide.slug}`}
                  className="rounded-lg border border-slate-200 bg-white p-4 text-sm font-semibold leading-6 text-slate-800 shadow-sm transition hover:border-amber-300 hover:text-slate-950"
                >
                  {guide.title}
                </Link>
              ))}
            </div>
          </section>

          <section aria-labelledby="scope-note" className="mt-10 rounded-lg border border-amber-200 bg-amber-50 p-5">
            <h2 id="scope-note" className="text-xl font-semibold text-slate-950">
              Calculator Scope
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-700">
              These guides are for California auto injury claims. The calculator does not provide legal advice, tax
              advice, workers compensation estimates, or carrier-specific payout promises.
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
