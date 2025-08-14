
import React, { useState, useCallback, useEffect } from 'react';
import { AuthConfig, Endpoint, AuthMethod, DatabaseType, AiModelConfig } from './types';
import { streamPhpClientCode } from './services/geminiService';
import Header from './components/Header';
import AuthSelector from './components/AuthSelector';
import EndpointEditor from './components/EndpointEditor';
import CodeDisplay from './components/CodeDisplay';
import Loader from './components/Loader';
import { GithubIcon, SparklesIcon, CogIcon } from './components/Icons';
import OpenApiImporter from './components/OpenApiImporter';
import AiConfigurator from './components/AiConfigurator';
import AiModelConfiguration from './components/AiModelConfiguration';
import PsrDisplay from './components/PsrDisplay';


const initialUserResponsePayload = `{
  "id": 1,
  "name": "Leanne Graham",
  "username": "Bret",
  "email": "Sincere@april.biz",
  "address": {
    "street": "Kulas Light",
    "suite": "Apt. 556",
    "city": "Gwenborough",
    "zipcode": "92998-3874",
    "geo": {
      "lat": "-37.3159",
      "lng": "81.1496"
    }
  },
  "phone": "1-770-736-8031 x56442",
  "website": "hildegard.org",
  "company": {
    "name": "Romaguera-Crona",
    "catchPhrase": "Multi-layered client-server neural-net",
    "bs": "harness real-time e-markets"
  }
}`;


const App: React.FC = () => {
  const [authConfig, setAuthConfig] = useState<AuthConfig>({
    method: AuthMethod.BEARER,
    tokenVariableName: '$apiToken',
  });

  const [endpoints, setEndpoints] = useState<Endpoint[]>([
    {
      id: '1', name: 'getUserById', method: 'GET', path: '/users/{userId}',
      responsePayload: initialUserResponsePayload,
      dbConfig: { enabled: true, dbType: DatabaseType.MARIADB, tableName: 'users' },
    },
    {
      id: '2', name: 'getUsers', method: 'GET', path: '/users',
      responsePayload: `[${initialUserResponsePayload}]`,
      dbConfig: { enabled: false, dbType: DatabaseType.MARIADB, tableName: 'users' },
    },
    {
      id: '3', name: 'createUser', method: 'POST', path: '/users',
      responsePayload: initialUserResponsePayload,
      dbConfig: { enabled: false, dbType: DatabaseType.MARIADB, tableName: 'users' },
    },
  ]);

  const [baseUri, setBaseUri] = useState<string>('https://jsonplaceholder.typicode.com');
  const [namespace, setNamespace] = useState<string>('App\\Sdk\\MyApiClient');
  const [generatedCode, setGeneratedCode] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [apiKey, setApiKey] = useState<string>(process.env.API_KEY || '');
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'manual' | 'ai'>('manual');
  const [aiModelConfig, setAiModelConfig] = useState<AiModelConfig>({
      model: 'gemini-2.5-flash',
      temperature: 0.2,
      topP: 0.9,
      topK: 40,
      thinkingBudget: 100,
  });

  const handleGenerateCode = useCallback(async () => {
    setError(null);
    setIsLoading(true);
    setGeneratedCode('');

    if (!apiKey) {
        setError("API Key is not configured. Please add it in the AI Model Settings section.");
        setIsLoading(false);
        return;
    }

    if (endpoints.length === 0) {
      setError("Please add at least one API endpoint.");
      setIsLoading(false);
      return;
    }

    try {
      await streamPhpClientCode(
        { authConfig, endpoints, baseUri, namespace },
        aiModelConfig,
        apiKey,
        (chunk) => {
            setGeneratedCode(prev => prev + chunk);
        }
      );
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
       setGeneratedCode(currentCode => {
            let code = currentCode;
            if (code.startsWith('```php')) {
                code = code.substring(5).trimStart();
            } else if (code.startsWith('php')) {
                code = code.substring(3).trimStart();
            }
            if (code.endsWith('```')) {
                code = code.slice(0, -3).trim();
            }
            if (code && !code.startsWith('<?php')) {
                return '<?php\n\n' + code;
            }
            return code;
        });
    }
  }, [authConfig, endpoints, baseUri, namespace, aiModelConfig, apiKey]);

  const handleParseSpec = (parsedEndpoints: Endpoint[], parsedBaseUri: string) => {
    setEndpoints(parsedEndpoints);
    if (parsedBaseUri) {
      setBaseUri(parsedBaseUri.replace(/\/$/, ''));
    }
    setError(null);
  };

  const handleConfigGeneratedByAI = (config: any) => {
    if (config.namespace) setNamespace(config.namespace);
    if (config.baseUri) setBaseUri(config.baseUri);
    if (config.authConfig) setAuthConfig(config.authConfig);
    if (config.endpoints) {
       const newEndpoints = config.endpoints.map((ep: Omit<Endpoint, 'id'>, index: number) => ({
        ...ep,
        id: `${ep.name}-${index}-${Date.now()}`
       }));
       setEndpoints(newEndpoints);
    }
    setError(null);
    setGeneratedCode('');
    setActiveTab('manual'); // Switch to manual tab to see the result
  };


  const handleClearEndpoints = () => {
    setEndpoints([]);
  };
  
  const TabButton: React.FC<{
    tabName: 'manual' | 'ai';
    label: string;
    icon: React.ReactNode;
  }> = ({ tabName, label, icon }) => (
    <button
      onClick={() => setActiveTab(tabName)}
      className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-t-lg border-b-2 transition-all ${
        activeTab === tabName
          ? 'text-cyan-400 border-cyan-400'
          : 'text-gray-400 border-transparent hover:text-white hover:bg-gray-800/50'
      }`}
    >
      {icon}
      {label}
    </button>
  );

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 flex flex-col">
      <Header />
      <main className="flex-grow p-4 md:p-8 grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-7xl mx-auto w-full">
        {/* Left Column: Configuration */}
        <div className="flex flex-col gap-6">
            <div className="flex border-b border-gray-700">
                <TabButton tabName="manual" label="Manual / OpenAPI" icon={<CogIcon className="w-5 h-5"/>} />
                <TabButton tabName="ai" label="AI Assistant" icon={<SparklesIcon className="w-5 h-5"/>} />
            </div>

            {activeTab === 'manual' && (
                <div className="flex flex-col gap-8 animate-fade-in">
                    <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700">
                        <h2 className="text-xl font-bold mb-4 text-cyan-400">Project Configuration</h2>
                        <div className="space-y-4">
                        <div>
                            <label htmlFor="namespace" className="block text-sm font-medium text-gray-400 mb-1">PHP Namespace</label>
                            <input
                            id="namespace"
                            type="text"
                            value={namespace}
                            onChange={(e) => setNamespace(e.target.value)}
                            className="w-full bg-gray-900 border border-gray-600 rounded-md px-3 py-2 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition"
                            placeholder="e.g., Company\Library\ApiClient"
                            />
                        </div>
                        <div>
                            <label htmlFor="baseUri" className="block text-sm font-medium text-gray-400 mb-1">Base API URI</label>
                            <input
                            id="baseUri"
                            type="text"
                            value={baseUri}
                            onChange={(e) => setBaseUri(e.target.value)}
                            className="w-full bg-gray-900 border border-gray-600 rounded-md px-3 py-2 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition"
                            placeholder="e.g., https://api.example.com/v1"
                            />
                        </div>
                        </div>
                    </div>

                    <AiModelConfiguration
                        config={aiModelConfig}
                        setConfig={setAiModelConfig}
                        apiKey={apiKey}
                        setApiKey={setApiKey}
                    />

                    <PsrDisplay />

                    <OpenApiImporter
                        onParse={handleParseSpec}
                        onClear={handleClearEndpoints}
                        onError={setError}
                    />

                    <AuthSelector authConfig={authConfig} setAuthConfig={setAuthConfig} />
                    <EndpointEditor endpoints={endpoints} setEndpoints={setEndpoints} />
                </div>
            )}
            
            {activeTab === 'ai' && (
                <div className="animate-fade-in">
                    <AiConfigurator 
                      onConfigured={handleConfigGeneratedByAI} 
                      onError={setError}
                      modelConfig={aiModelConfig}
                      apiKey={apiKey}
                    />
                </div>
            )}

            <div className="mt-auto pt-4">
                <button
                onClick={handleGenerateCode}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-3 bg-cyan-600 hover:bg-cyan-700 disabled:bg-gray-600 text-white font-bold py-3 px-4 rounded-lg transition-all duration-200 shadow-md hover:shadow-cyan-500/30 disabled:cursor-not-allowed"
                >
                {isLoading ? (
                    <>
                    <Loader />
                    Generating Code...
                    </>
                ) : 'Generate PHP Client'}
                </button>
            </div>
        </div>

        {/* Right Column: Code Display */}
        <div className="flex flex-col">
           <CodeDisplay code={generatedCode} isLoading={isLoading} error={error} />
        </div>
      </main>
      <footer className="text-center p-4 text-gray-500 text-sm">
        <a href="https://github.com/google-gemini-v2/react-app-gen-ai" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 hover:text-cyan-400 transition-colors">
            <GithubIcon className="w-4 h-4" />
            Powered by Gemini API
        </a>
      </footer>
    </div>
  );
};

export default App;
