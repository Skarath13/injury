export default function Footer() {
  return (
    <footer className="bg-slate-800 text-white mt-20">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="font-bold mb-3">About This Calculator</h3>
            <p className="text-sm text-slate-300">
              Created by an experienced litigation adjuster to provide realistic settlement estimates 
              based on actual insurance industry practices in California.
            </p>
          </div>
          <div>
            <h3 className="font-bold mb-3">Important Notes</h3>
            <ul className="text-sm text-slate-300 space-y-1">
              <li>• This is an estimate tool only</li>
              <li>• Actual settlements vary greatly</li>
              <li>• Consult an attorney for legal advice</li>
              <li>• California law specific</li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold mb-3">Settlement Reality</h3>
            <p className="text-sm text-slate-300">
              Most soft tissue injuries settle for $5,000-$25,000. Serious injuries with surgery 
              or permanent impairment can reach six figures, but million-dollar settlements are extremely rare.
            </p>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t border-slate-700 text-center text-sm text-slate-400">
          <p>© 2024 California Settlement Calculator. For educational purposes only.</p>
        </div>
      </div>
    </footer>
  );
}