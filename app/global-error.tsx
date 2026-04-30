'use client';

import { AlertCircle, RefreshCw } from 'lucide-react';
import Link from 'next/link';

export default function GlobalError({
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body>
        <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-16 font-sans text-slate-950">
          <section className="w-full max-w-xl rounded-lg border border-slate-200 bg-white p-6 text-center shadow-sm sm:p-8">
            <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-red-50 text-red-700 ring-1 ring-red-200">
              <AlertCircle aria-hidden="true" />
            </span>
            <h1 className="mt-5 text-3xl font-semibold tracking-tight">
              We hit a bigger snag than expected.
            </h1>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Sorry. Please try once more, and if it still refuses to cooperate, start a fresh estimate.
            </p>
            <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
              <button
                type="button"
                onClick={reset}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-emerald-700 px-5 text-sm font-semibold text-white transition hover:bg-emerald-600"
              >
                <RefreshCw className="size-4" aria-hidden="true" />
                Try again
              </button>
              <Link
                href="/estimate/start"
                className="inline-flex h-11 items-center justify-center rounded-lg border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Start fresh
              </Link>
            </div>
          </section>
        </main>
      </body>
    </html>
  );
}
