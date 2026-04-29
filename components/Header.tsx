'use client'

import { Calculator, Menu, X } from 'lucide-react';
import Link from 'next/link';
import { useState, type MouseEvent } from 'react';
import CaliforniaMark from '@/components/CaliforniaMark';

const navItems = [
  { href: '/', label: 'Calculator', icon: Calculator },
  { href: '/about', label: 'About' },
  { href: '/privacy', label: 'Privacy' },
  { href: '/terms', label: 'Terms' },
  { href: '/contact', label: 'Contact' }
];

const CALCULATOR_RESET_EVENT = 'injury-calculator:request-reset';

interface HeaderProps {
  enableCalculatorReset?: boolean;
}

export default function Header({ enableCalculatorReset = false }: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleBrandClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (!enableCalculatorReset) return;

    event.preventDefault();
    setIsMenuOpen(false);
    window.dispatchEvent(new Event(CALCULATOR_RESET_EVENT));
  };

  return (
    <header className="border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="flex min-h-[76px] items-center justify-between gap-4">
          <Link href="/" onClick={handleBrandClick} className="flex min-w-0 items-center gap-3">
            <CaliforniaMark className="h-12 w-12 flex-none" label="Custom California settlement mark" />
            <div className="min-w-0">
              <p className="truncate text-base font-semibold tracking-tight text-slate-950 sm:text-lg">
                California Settlement Calculator
              </p>
            </div>
          </Link>

          <nav className="hidden items-center gap-1 md:flex" aria-label="Main navigation">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="group rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-950"
              >
                <span className="flex items-center gap-2">
                  {item.icon && <item.icon className="h-4 w-4 text-emerald-700" />}
                  {item.label}
                </span>
              </Link>
            ))}
          </nav>

          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="flex h-11 w-11 items-center justify-center rounded-lg border border-slate-200 text-slate-700 transition hover:bg-slate-50 md:hidden"
            aria-label="Toggle menu"
            aria-expanded={isMenuOpen}
          >
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        <div className={`md:hidden ${isMenuOpen ? 'block pb-4' : 'hidden'}`}>
          <nav className="grid gap-1 rounded-lg border border-slate-200 bg-slate-50 p-2" aria-label="Mobile navigation">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMenuOpen(false)}
                className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-slate-700 transition hover:bg-white hover:text-slate-950"
              >
                {item.icon && <item.icon className="h-4 w-4 text-emerald-700" />}
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </header>
  );
}
