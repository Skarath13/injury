import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import {
  DEFAULT_OPEN_GRAPH_IMAGE,
  SITE_NAME,
  createArticleJsonLd,
  createBreadcrumbJsonLd,
  createFaqJsonLd,
  createImageObjectJsonLd
} from '@/lib/seo';
import {
  SEO_GUIDE_BY_SLUG,
  getSeoGuide,
  type SeoGuideSlug
} from '@/lib/seoGuides';

interface SeoGuidePageProps {
  slug: SeoGuideSlug;
}

export default function SeoGuidePage({ slug }: SeoGuidePageProps) {
  const guide = getSeoGuide(slug);
  const articleJsonLd = createArticleJsonLd({
    title: guide.title,
    description: guide.description,
    path: `/${guide.slug}`,
    dateModified: guide.lastReviewed
  });
  const breadcrumbJsonLd = createBreadcrumbJsonLd([
    { name: 'Calculator', path: '/' },
    { name: guide.title, path: `/${guide.slug}` }
  ]);
  const faqJsonLd = createFaqJsonLd(guide.faqs);
  const imageJsonLd = createImageObjectJsonLd(DEFAULT_OPEN_GRAPH_IMAGE);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50 text-slate-950">
      <script
        id={`${guide.slug}-article-jsonld`}
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <script
        id={`${guide.slug}-breadcrumb-jsonld`}
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        id={`${guide.slug}-faq-jsonld`}
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <script
        id={`${guide.slug}-image-jsonld`}
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(imageJsonLd) }}
      />

      <Header />
      <main className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <article className="mx-auto max-w-4xl">
          <nav aria-label="Breadcrumb" className="mb-6 text-sm text-slate-500">
            <Link href="/" className="font-medium text-sky-700 hover:text-sky-900">
              Calculator
            </Link>
            <span className="mx-2">/</span>
            <span>{guide.title}</span>
          </nav>

          <header className="border-b border-slate-200 pb-8">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-emerald-700">
              California auto injury guide
            </p>
            <h1 className="mt-3 max-w-3xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
              {guide.title}
            </h1>
            <p className="mt-5 text-lg leading-8 text-slate-700">{guide.directAnswer}</p>
            <div className="mt-5 flex flex-wrap gap-x-4 gap-y-2 text-sm text-slate-500">
              <span>By {guide.byline}</span>
              <span>Last reviewed {formatReviewDate(guide.lastReviewed)}</span>
            </div>
          </header>

          <section aria-labelledby="quick-answer" className="py-8">
            <h2 id="quick-answer" className="text-2xl font-semibold text-slate-950">
              Quick Takeaways
            </h2>
            <ul className="mt-4 grid gap-3">
              {guide.takeaways.map((takeaway) => (
                <li key={takeaway} className="rounded-lg border border-slate-200 bg-white p-4 text-slate-700 shadow-sm">
                  {takeaway}
                </li>
              ))}
            </ul>
          </section>

          <div className="grid gap-8">
            {guide.sections.map((section) => (
              <section key={section.heading} aria-labelledby={slugForHeading(section.heading)}>
                <h2 id={slugForHeading(section.heading)} className="text-2xl font-semibold text-slate-950">
                  {section.heading}
                </h2>
                <p className="mt-3 text-base leading-7 text-slate-700">{section.body}</p>
              </section>
            ))}
          </div>

          <section aria-labelledby="comparison" className="mt-10">
            <h2 id="comparison" className="text-2xl font-semibold text-slate-950">
              Quick Comparison
            </h2>
            <div className="mt-4 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] border-collapse text-left text-sm">
                  <thead className="bg-slate-950 text-white">
                    <tr>
                      {guide.comparison.columns.map((column) => (
                        <th key={column} scope="col" className="px-4 py-3 font-semibold">
                          {column}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {guide.comparison.rows.map((row) => (
                      <tr key={row.join('-')} className="border-t border-slate-200">
                        {row.map((cell, index) => (
                          <td key={`${cell}-${index}`} className="px-4 py-3 align-top text-slate-700">
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          <section aria-labelledby="calculator-use" className="mt-10 rounded-lg border border-emerald-200 bg-emerald-50 p-5">
            <h2 id="calculator-use" className="text-2xl font-semibold text-slate-950">
              How The Calculator Uses This
            </h2>
            <p className="mt-3 text-base leading-7 text-slate-700">{guide.calculatorUse}</p>
            <Link
              href="/"
              className="mt-5 inline-flex min-h-11 items-center rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-amber-400"
            >
              Start the California settlement calculator
            </Link>
          </section>

          <section aria-labelledby="faq" className="mt-10">
            <h2 id="faq" className="text-2xl font-semibold text-slate-950">
              Frequently Asked Questions
            </h2>
            <div className="mt-4 grid gap-4">
              {guide.faqs.map((faq) => (
                <section key={faq.question} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                  <h3 className="text-lg font-semibold text-slate-950">{faq.question}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-700">{faq.answer}</p>
                </section>
              ))}
            </div>
          </section>

          <section aria-labelledby="sources" className="mt-10">
            <h2 id="sources" className="text-2xl font-semibold text-slate-950">
              Sources
            </h2>
            <ul className="mt-4 grid gap-2 text-sm">
              {guide.sources.map((source) => (
                <li key={source.href}>
                  <a
                    href={source.href}
                    className="font-medium text-sky-700 underline-offset-4 hover:text-sky-900 hover:underline"
                    rel="noreferrer"
                    target="_blank"
                  >
                    {source.label}
                  </a>
                </li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="related-guides" className="mt-10 border-t border-slate-200 pt-8">
            <h2 id="related-guides" className="text-2xl font-semibold text-slate-950">
              Related Guides
            </h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {guide.related.map((relatedSlug) => {
                const related = SEO_GUIDE_BY_SLUG[relatedSlug];

                return (
                  <Link
                    key={related.slug}
                    href={`/${related.slug}`}
                    className="rounded-lg border border-slate-200 bg-white p-4 text-sm font-semibold text-slate-800 shadow-sm transition hover:border-amber-300 hover:text-slate-950"
                  >
                    {related.title}
                  </Link>
                );
              })}
            </div>
          </section>

          <p className="mt-10 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
            {SITE_NAME} provides educational information only. It is not a law firm, does not provide legal advice,
            does not recommend attorneys, and does not create an attorney-client relationship.
          </p>

        </article>
      </main>
      <Footer />
    </div>
  );
}

function slugForHeading(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function formatReviewDate(value: string): string {
  const date = new Date(`${value}T00:00:00-07:00`);

  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  }).format(date);
}
