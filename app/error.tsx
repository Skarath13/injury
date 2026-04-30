'use client';

import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function Error({
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex min-h-[70vh] items-center justify-center bg-gradient-to-b from-slate-50 via-white to-red-50/40 px-4 py-16">
      <section className="w-full max-w-xl rounded-lg border border-slate-200 bg-white p-6 text-center shadow-sm sm:p-8">
        <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-red-50 text-red-700 ring-1 ring-red-200">
          <AlertTriangle aria-hidden="true" />
        </span>
        <h1 className="mt-5 text-3xl font-semibold tracking-tight text-slate-950">
          Something slipped while loading this page.
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Sorry about that. The calculator is still here, but this view needs a clean retry.
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-emerald-700 px-5 text-sm font-semibold text-white transition hover:bg-emerald-600"
        >
          <RefreshCw className="size-4" aria-hidden="true" />
          Try again
        </button>
      </section>
    </main>
  );
}
