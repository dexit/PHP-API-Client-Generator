
import React from 'react';
import { PhpIcon, SparklesIcon } from './Icons';

interface HeaderProps {
  chromeAiAvailable?: boolean;
}

const Header: React.FC<HeaderProps> = ({ chromeAiAvailable }) => {
  return (
    <header className="bg-gray-800/50 backdrop-blur-sm border-b border-gray-700 p-4 sticky top-0 z-10">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-4">
          <PhpIcon className="h-12 w-12 text-cyan-400" />
          <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">PHP SDK Architect</h1>
              <p className="text-sm text-gray-400">Production-grade PSR-compliant client generator.</p>
          </div>
        </div>
        
        {chromeAiAvailable && (
          <div className="hidden md:flex items-center gap-2 bg-cyan-900/30 border border-cyan-500/30 px-3 py-1.5 rounded-full animate-fade-in">
             <SparklesIcon className="w-4 h-4 text-cyan-400" />
             <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest">Chrome Built-in AI Active</span>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
