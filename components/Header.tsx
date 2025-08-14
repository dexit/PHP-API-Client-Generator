
import React from 'react';
import { PhpIcon } from './Icons';

const Header: React.FC = () => {
  return (
    <header className="bg-gray-800/50 backdrop-blur-sm border-b border-gray-700 p-4 sticky top-0 z-10">
      <div className="max-w-7xl mx-auto flex items-center gap-4">
        <PhpIcon className="h-12 w-12 text-cyan-400" />
        <div>
            <h1 className="text-2xl font-bold text-white">PHP API Client Generator</h1>
            <p className="text-sm text-gray-400">Instantly create modern, PSR-compliant API clients using AI.</p>
        </div>
      </div>
    </header>
  );
};

export default Header;
