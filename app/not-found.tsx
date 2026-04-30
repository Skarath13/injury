import Link from 'next/link';
import { Home, Mail, MapPinned } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-slate-50 via-white to-emerald-50/40">
      <Header />
      <main className="container mx-auto flex flex-1 items-center px-4 py-16 sm:px-6">
        <section className="mx-auto max-w-2xl rounded-lg border border-slate-200 bg-white p-6 text-center shadow-sm sm:p-8">
          <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-amber-50 text-amber-700 ring-1 ring-amber-200">
            <MapPinned aria-hidden="true" />
          </span>
          <h1 className="mt-5 text-3xl font-semibold tracking-tight text-slate-950">
            We lost that page for a minute.
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Sorry about that. The page may have moved, or the link may have taken a wrong turn on the way to California.
          </p>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/estimate/start"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-emerald-700 px-5 text-sm font-semibold text-white transition hover:bg-emerald-600"
            >
              <Home className="size-4" aria-hidden="true" />
              Start the estimate
            </Link>
            <Link
              href="/contact"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              <Mail className="size-4" aria-hidden="true" />
              Contact us
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
