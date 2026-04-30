import Link from 'next/link';
import { HOME_FAQS } from '@/lib/seo';
import { SEO_GUIDES } from '@/lib/seoGuides';

const factorCards = [
  {
    title: 'Injury and treatment',
    body: 'The estimate weighs selected injury areas, severity, treatment type, treatment status, and medical-specials context.'
  },
  {
    title: 'California fault and venue',
    body: 'Reported comparative fault and accident county help shape the range without overpowering the medical and liability facts.'
  },
  {
    title: 'Work and daily life',
    body: 'Wage-loss signals, sleep disruption, caregiving limits, and activity limits help explain the human impact of the injury.'
  }
];

export default function CalculatorSeoContent() {
  return (
    <section aria-labelledby="calculator-seo-heading" className="mt-12 border-t border-slate-200 pt-10">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-emerald-700">
            California settlement guidance
          </p>
          <h2 id="calculator-seo-heading" className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
            California Car Accident Settlement Calculator
          </h2>
          <p className="mt-4 max-w-3xl text-base leading-7 text-slate-700">
            This calculator helps organize the facts that commonly affect a California auto injury settlement estimate:
            fault, injury severity, treatment, medical specials, accident county, work disruption, daily-life impact,
            and insurance context. It is educational only and does not provide legal advice or guarantee a result.
          </p>
        </div>

        <div className="rounded-lg border border-amber-200 bg-amber-50 p-5">
          <h3 className="text-base font-semibold text-slate-950">Start with the claim facts</h3>
          <p className="mt-2 text-sm leading-6 text-slate-700">
            A useful settlement estimate should explain what moved the range, not just show a generic average.
          </p>
        </div>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {factorCards.map((card) => (
          <section key={card.title} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-950">{card.title}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-700">{card.body}</p>
          </section>
        ))}
      </div>

      <section aria-labelledby="calculator-guides-heading" className="mt-10">
        <h2 id="calculator-guides-heading" className="text-2xl font-semibold text-slate-950">
          California Settlement Guides
        </h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {SEO_GUIDES.map((guide) => (
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

      <section aria-labelledby="home-faq-heading" className="mt-10">
        <h2 id="home-faq-heading" className="text-2xl font-semibold text-slate-950">
          Settlement Calculator FAQ
        </h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {HOME_FAQS.map((faq) => (
            <section key={faq.question} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-base font-semibold text-slate-950">{faq.question}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-700">{faq.answer}</p>
            </section>
          ))}
        </div>
      </section>
    </section>
  );
}
