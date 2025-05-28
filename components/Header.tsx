'use client'

import { Calculator, Menu, X } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="relative">
      {/* Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900"></div>
      
      {/* Animated Background Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-700/20 via-transparent to-transparent"></div>
      
      {/* Floating Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-4 -left-4 w-20 h-20 bg-amber-400/10 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute top-8 right-1/4 w-16 h-16 bg-blue-400/10 rounded-full blur-lg animate-pulse delay-1000"></div>
        <div className="absolute -top-2 right-1/3 w-12 h-12 bg-emerald-400/10 rounded-full blur-lg animate-pulse delay-2000"></div>
      </div>
      
      <div className="relative z-10 container mx-auto px-4 py-2">
        <div className="flex items-center justify-between min-h-[60px]">
          {/* Logo Section */}
          <Link href="/" className="group flex items-center space-x-2 hover:scale-105 transition-all duration-300">
            <Image
              src="/logo.png"
              alt="California Settlement Calculator Logo"
              width={96}
              height={96}
              className="w-24 h-24 object-contain group-hover:scale-110 transition-transform duration-300"
              priority
            />
            
            <div className="text-left">
              <h1 className="text-xl font-bold bg-gradient-to-r from-white via-blue-100 to-amber-100 bg-clip-text text-transparent group-hover:from-amber-200 group-hover:to-white transition-all duration-300">
                California Settlement Calculator
              </h1>
              <p className="text-xs text-blue-200 group-hover:text-amber-200 transition-colors flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span>
                Realistic Auto Injury Estimates
              </p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            {[
              { href: "/", label: "Calculator", icon: Calculator },
              { href: "/about", label: "About" },
              { href: "/privacy", label: "Privacy" },
              { href: "/terms", label: "Terms" },
              { href: "/contact", label: "Contact" }
            ].map((item, index) => (
              <Link
                key={item.href}
                href={item.href}
                className="group relative px-4 py-2 rounded-xl text-sm font-medium text-blue-100 hover:text-white transition-all duration-300 hover:scale-105"
              >
                {/* Hover Background */}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600/0 via-blue-500/0 to-amber-500/0 group-hover:from-blue-600/20 group-hover:via-blue-500/30 group-hover:to-amber-500/20 rounded-xl transition-all duration-300"></div>
                <div className="absolute inset-0 bg-white/0 group-hover:bg-white/5 rounded-xl transition-all duration-300"></div>
                
                {/* Content */}
                <span className="relative flex items-center gap-2">
                  {item.icon && <item.icon className="w-4 h-4" />}
                  {item.label}
                </span>
                
                {/* Underline Animation */}
                <div className="absolute bottom-0 left-1/2 w-0 h-0.5 bg-gradient-to-r from-amber-400 to-orange-500 group-hover:w-full group-hover:left-0 transition-all duration-300 rounded-full"></div>
              </Link>
            ))}
          </nav>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden relative p-2 text-white hover:text-amber-400 transition-colors"
            aria-label="Toggle menu"
          >
            <div className="relative w-6 h-6">
              <Menu className={`absolute inset-0 transition-all duration-300 ${isMenuOpen ? 'opacity-0 rotate-45' : 'opacity-100 rotate-0'}`} />
              <X className={`absolute inset-0 transition-all duration-300 ${isMenuOpen ? 'opacity-100 rotate-0' : 'opacity-0 -rotate-45'}`} />
            </div>
          </button>
        </div>

        {/* Mobile Navigation */}
        <div className={`md:hidden transition-all duration-300 ease-in-out ${isMenuOpen ? 'max-h-96 opacity-100 mt-6' : 'max-h-0 opacity-0 mt-0'} overflow-hidden`}>
          <nav className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-2xl p-4">
            <div className="space-y-2">
              {[
                { href: "/", label: "Calculator", icon: Calculator },
                { href: "/about", label: "About" },
                { href: "/privacy", label: "Privacy" },
                { href: "/terms", label: "Terms" },
                { href: "/contact", label: "Contact" }
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 text-white hover:text-amber-400 hover:bg-white/10 rounded-xl transition-all duration-200"
                >
                  {item.icon && <item.icon className="w-5 h-5" />}
                  <span className="font-medium">{item.label}</span>
                </Link>
              ))}
            </div>
          </nav>
        </div>
      </div>

      {/* Bottom Border */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent"></div>
    </header>
  );
}