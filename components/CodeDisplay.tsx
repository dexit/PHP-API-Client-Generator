
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

  const parsePackage = (raw: string) => {
    const files: { name: string, content: string }[] = [];
    const parts = raw.split(/--- START OF FILE (.*?) ---/);
    
    if (parts.length < 2) {
        return [{ name: 'GeneratedCode.php', content: raw }];
    }

    for (let i = 1; i < parts.length; i += 2) {
        files.push({
            name: parts[i].trim(),
            content: parts[i + 1]?.trim() || ''
        });
    }
    return files;
  };

  const renderContent = () => {
    if (isLoading && !code) {
        return (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-cyan-400">
                <Loader className="w-10 h-10" />
                <p className="text-sm animate-pulse font-bold tracking-widest">Architecting SDK Package...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-red-400 p-8 h-full flex flex-col justify-center items-center">
                <p className='font-bold text-xl mb-2'>Generation Halted</p>
                <p className='text-center text-sm opacity-80 max-w-sm'>{error}</p>
            </div>
        );
    }

    if (!code) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
                <h3 className="text-lg font-bold text-gray-300 mb-2">Ready to Bundle</h3>
                <p className="max-w-xs text-sm">Configure your project and click generate to receive a full PSR package.</p>
            </div>
        );
    }

    const files = parsePackage(code);

    return (
        <div className="space-y-6 pb-20">
            {files.map((file, idx) => (
                <div key={idx} className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden shadow-sm hover:border-cyan-500/20 transition-all">
                    <div className="bg-gray-800/80 px-4 py-2 border-b border-gray-800 flex justify-between items-center">
                        <span className="text-[10px] font-bold text-cyan-400 tracking-wider font-mono uppercase">{file.name}</span>
                        <div className="flex gap-1">
                            <div className="w-2 h-2 rounded-full bg-gray-700"></div>
                            <div className="w-2 h-2 rounded-full bg-gray-700"></div>
                            <div className="w-2 h-2 rounded-full bg-gray-700"></div>
                        </div>
                    </div>
                    <pre className="p-4 overflow-x-auto text-[11px] leading-relaxed selection:bg-cyan-500/30">
                        <code className="text-gray-300 whitespace-pre">
                            {file.content}
                        </code>
                    </pre>
                </div>
            ))}
        </div>
    );
  };

  return (
    <div className="bg-gray-800 rounded-xl shadow-2xl border border-gray-700 flex flex-col h-full min-h-[600px] overflow-hidden">
      <div className="flex justify-between items-center p-4 border-b border-gray-700 bg-gray-800/80 backdrop-blur-md sticky top-0 z-20">
        <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest">SDK Package Bundle</h2>
        {code && (
          <button
              onClick={handleCopy}
              className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-1.5 px-4 rounded-lg transition-all text-xs shadow-lg shadow-cyan-500/20"
          >
              {copied ? <CheckIcon className="w-4 h-4" /> : <CopyIcon className="w-4 h-4" />}
              {copied ? 'Copied Bundle' : 'Copy All Files'}
          </button>
        )}
      </div>
      <div className="flex-grow p-4 md:p-6 overflow-y-auto bg-gray-950 font-mono scrollbar-thin">
        {renderContent()}
      </div>
    </div>
  );
};

export default CodeDisplay;
