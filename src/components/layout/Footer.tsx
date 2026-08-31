import React from 'react';

export function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400 py-8 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-white text-lg font-bold font-urdu mb-4">Zwanan Jawkhela</h3>
            <p className="text-sm">
              Community welfare, mutual support, and local governance for the Jawkhela area (Buner, KPK).
            </p>
          </div>
          <div>
            <h4 className="text-white font-medium mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="/membership" className="hover:text-white transition-colors">Membership</a></li>
              <li><a href="/donations" className="hover:text-white transition-colors">Donations</a></li>
              <li><a href="/blood-bank" className="hover:text-white transition-colors">Blood Bank</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-medium mb-4">Contact</h4>
            <ul className="space-y-2 text-sm">
              <li>Jawkhela, Buner, KPK, Pakistan</li>
              <li>info@zwananjawkhela.org</li>
              <li>+92 300 1234567</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-800 mt-8 pt-8 text-sm text-center">
          <p>&copy; {new Date().getFullYear()} Zwanan Jawkhela. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
