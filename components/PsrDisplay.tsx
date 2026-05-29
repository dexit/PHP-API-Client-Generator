
import React from 'react';
import { ShieldCheckIcon } from './Icons';

const PsrItem: React.FC<{ name: string, description: string }> = ({ name, description }) => (
    <div className="bg-gray-900/70 p-3 rounded-lg border border-gray-700/50 hover:border-cyan-500/30 transition-colors">
        <h3 className="font-semibold text-cyan-400 text-sm">{name}</h3>
        <p className="text-[10px] leading-relaxed text-gray-400 mt-1">{description}</p>
    </div>
);

const PsrDisplay: React.FC = () => {
  return (
    <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700">
      <h2 className="text-xl font-bold mb-4 text-cyan-400 flex items-center gap-2">
          <ShieldCheckIcon className="w-6 h-6"/>
          Modern PHP Standards
      </h2>
      <p className="text-sm text-gray-400 mb-4">The generated client is fully interoperable and adheres to the latest PHP Standard Recommendations (PSR).</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <PsrItem name="PSR-18: HTTP Client" description="Interoperable HTTP clients for sending requests and receiving responses." />
        <PsrItem name="PSR-17: HTTP Factories" description="Standardized creation of PSR-7 compliant requests, streams, and URIs." />
        <PsrItem name="PSR-7: HTTP Message" description="Common interfaces for HTTP requests, responses, and URI components." />
        <PsrItem name="PSR-6 / PSR-16: Cache" description="Standardized caching interfaces for persisting auth tokens and results." />
        <PsrItem name="PSR-3: Logger" description="Universal logging interface for tracking requests, errors, and retries." />
        <PsrItem name="PSR-11: Container" description="Dependency Injection standards for injecting the client into your app." />
      </div>
    </div>
  );
};

export default PsrDisplay;
