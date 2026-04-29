import Link from 'next/link'
import { getStaticPanelDisclosure } from '@/lib/attorneyRouting'

export default function Footer() {
  const currentYear = new Date().getFullYear()
  const panelDisclosure = getStaticPanelDisclosure()

  return (
    <footer className="mt-16 border-t border-slate-200 bg-slate-950 text-white">
      <div className="container mx-auto px-4 py-8 sm:px-6">
        <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
          <div>
            <h2 className="text-sm font-semibold">California Settlement Calculator</h2>
            <p className="mt-2 text-xs text-slate-400">Estimate only. Not legal advice. Deadlines apply.</p>
          </div>

          <nav aria-label="Footer" className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-300">
            <Link href="/privacy" className="transition-colors hover:text-amber-300">Privacy</Link>
            <Link href="/terms" className="transition-colors hover:text-amber-300">Terms</Link>
            <a href="#privacy-choices" className="transition-colors hover:text-amber-300">Your Privacy Choices</a>
            <Link href="/contact" className="transition-colors hover:text-amber-300">Contact</Link>
          </nav>
        </div>

        <div className="mt-6 border-t border-slate-800 pt-5 text-xs text-slate-500">
          <details>
            <summary className="cursor-pointer text-slate-400">Attorney advertiser disclosure</summary>
            <p className="mt-2 leading-5">{panelDisclosure}</p>
          </details>
          <p className="mt-4">© {currentYear} California Settlement Calculator.</p>
        </div>
      </div>
    </footer>
  );
}
