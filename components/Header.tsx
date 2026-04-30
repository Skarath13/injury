'use client'

import { Calculator, Menu, X } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from '@/components/motion/react';
import Link from 'next/link';
import { useState, type MouseEvent } from 'react';
import CaliforniaMark from '@/components/CaliforniaMark';
import { premiumEase, softSpring } from '@/components/motion/presets';

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
  const shouldReduceMotion = Boolean(useReducedMotion());

  const handleBrandClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (!enableCalculatorReset) return;

    event.preventDefault();
    setIsMenuOpen(false);
    window.dispatchEvent(new Event(CALCULATOR_RESET_EVENT));
  };

  return (
    <header className="ios-status-bar-shell">
      <div className="border-b border-slate-200 bg-white/95 backdrop-blur">
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

            <nav className="hidden items-center gap-1 lg:flex" aria-label="Main navigation">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="group relative rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-950"
                >
                  <span className="flex items-center gap-2">
                    {item.icon && <item.icon className="h-4 w-4 text-emerald-700" />}
                    {item.label}
                  </span>
                  <span className="pointer-events-none absolute inset-x-3 bottom-1 h-0.5 origin-left scale-x-0 rounded-full bg-amber-400 transition-transform duration-200 group-hover:scale-x-100" />
                </Link>
              ))}
            </nav>

            <motion.button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="flex h-11 w-11 items-center justify-center rounded-lg border border-slate-200 text-slate-700 transition hover:bg-slate-50 lg:hidden"
              aria-label="Toggle menu"
              aria-expanded={isMenuOpen}
              whileTap={shouldReduceMotion ? undefined : { scale: 0.96 }}
              transition={softSpring}
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={isMenuOpen ? 'close' : 'menu'}
                  initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, rotate: -18, scale: 0.85 }}
                  animate={{ opacity: 1, rotate: 0, scale: 1 }}
                  exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, rotate: 18, scale: 0.85 }}
                  transition={shouldReduceMotion ? { duration: 0.08 } : { duration: 0.18, ease: premiumEase }}
                >
                  {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </motion.span>
              </AnimatePresence>
            </motion.button>
          </div>

          <AnimatePresence initial={false}>
            {isMenuOpen && (
              <motion.div
                className="lg:hidden"
                initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, height: 0 }}
                transition={shouldReduceMotion ? { duration: 0.08 } : { duration: 0.22, ease: premiumEase }}
              >
                <motion.nav
                  className="grid gap-1 rounded-lg border border-slate-200 bg-slate-50 p-2 pb-2"
                  aria-label="Mobile navigation"
                  initial={shouldReduceMotion ? false : 'hidden'}
                  animate="visible"
                  variants={{
                    hidden: {},
                    visible: { transition: { staggerChildren: 0.035 } }
                  }}
                >
                  {navItems.map((item) => (
                    <motion.div
                      key={item.href}
                      variants={{
                        hidden: { opacity: 0, y: -4 },
                        visible: { opacity: 1, y: 0, transition: { duration: 0.18, ease: premiumEase } }
                      }}
                    >
                      <Link
                        href={item.href}
                        onClick={() => setIsMenuOpen(false)}
                        className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-slate-700 transition hover:bg-white hover:text-slate-950"
                      >
                        {item.icon && <item.icon className="h-4 w-4 text-emerald-700" />}
                        {item.label}
                      </Link>
                    </motion.div>
                  ))}
                </motion.nav>
                <div className="pb-4" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
