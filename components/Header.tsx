import { Scale } from 'lucide-react';

export default function Header() {
  return (
    <header className="bg-slate-900 text-white">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Scale className="w-8 h-8 text-amber-400" />
            <div>
              <h1 className="text-xl font-bold">California Settlement Calculator</h1>
              <p className="text-xs text-slate-300">Realistic Auto Injury Estimates</p>
            </div>
          </div>
          <nav className="hidden md:flex space-x-6 text-sm">
            <a href="#calculator" className="hover:text-amber-400 transition-colors">Calculator</a>
            <a href="#about" className="hover:text-amber-400 transition-colors">About</a>
            <a href="#factors" className="hover:text-amber-400 transition-colors">Settlement Factors</a>
            <a href="#contact" className="hover:text-amber-400 transition-colors">Contact</a>
          </nav>
        </div>
      </div>
    </header>
  );
}