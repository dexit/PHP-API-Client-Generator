
import React from 'react';
import { ShieldCheckIcon } from './Icons';

const PsrItem: React.FC<{ name: string, description: string }> = ({ name, description }) => (
    <div className="bg-gray-900/70 p-3 rounded-lg border border-gray-700/50">
        <h3 className="font-semibold text-cyan-400">{name}</h3>
        <p className="text-xs text-gray-400">{description}</p>
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
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <PsrItem name="PSR-18: HTTP Client" description="Defines how HTTP clients send requests and receive responses." />
        <PsrItem name="PSR-17: HTTP Factories" description="Standardizes how to create PSR-7 compliant objects." />
        <PsrItem name="PSR-7: HTTP Message Interface" description="Provides common interfaces for HTTP messages (requests/responses)." />
        <PsrItem name="PSR-3: Logger Interface" description="Describes a common interface for logging libraries." />
      </div>
    </div>
  );
};

export default PsrDisplay;
