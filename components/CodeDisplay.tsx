
import React, { useState, useEffect } from 'react';
import Loader from './Loader';
import { CopyIcon, CheckIcon } from './Icons';

interface CodeDisplayProps {
  code: string;
  isLoading: boolean;
  error: string | null;
}

const CodeDisplay: React.FC<CodeDisplayProps> = ({ code, isLoading, error }) => {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (copied) {
      const timer = setTimeout(() => setCopied(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [copied]);

  const handleCopy = () => {
    if (code) {
      navigator.clipboard.writeText(code);
      setCopied(true);
    }
  };

  const Placeholder = () => (
    <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-4 opacity-30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10 16l-4-4 4-4"/>
            <path d="M14 8l4 4-4 4"/>
            <path d="M2 12h20"/>
        </svg>
        <h3 className="text-lg font-semibold text-gray-400">Generated Code Will Appear Here</h3>
        <p className="max-w-xs">Configure your client on the left and click "Generate" to see the magic happen.</p>
    </div>
  );

  return (
    <div className="bg-gray-800 rounded-xl shadow-lg border border-gray-700 flex flex-col h-full min-h-[500px] lg:min-h-0">
      <div className="flex justify-between items-center p-4 border-b border-gray-700">
        <h2 className="text-xl font-bold text-cyan-400">Generated PHP Client</h2>
        {code && (
          <button
            onClick={handleCopy}
            disabled={isLoading}
            className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-gray-200 font-semibold py-1 px-3 rounded-md transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {copied ? <CheckIcon className="w-4 h-4 text-green-400" /> : <CopyIcon className="w-4 h-4" />}
            {copied ? 'Copied!' : 'Copy'}
          </button>
        )}
      </div>
      <div className="p-1 flex-grow relative overflow-hidden rounded-b-xl">
        <pre className="h-full w-full overflow-auto p-4 text-sm bg-gray-900 rounded-lg">
          <code className="language-php font-mono whitespace-pre-wrap break-all">
            {isLoading && !code ? (
               <div className="flex items-center justify-center h-full">
                 <Loader />
               </div>
            ) : error ? (
                <div className="text-red-400 p-4 rounded-lg bg-red-500/10 h-full flex flex-col justify-center items-center">
                    <p className='font-bold text-lg'>Generation Failed</p>
                    <p className='mt-2'>{error}</p>
                </div>
            ) : code ? (
              code
            ) : (
                <Placeholder />
            )}
          </code>
        </pre>
      </div>
    </div>
  );
};

export default CodeDisplay;
