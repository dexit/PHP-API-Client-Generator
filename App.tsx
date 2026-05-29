
import React, { useState, useCallback, useEffect } from 'react';
import { AuthConfig, Endpoint, AuthMethod, DatabaseType, AiModelConfig, HeaderPair, ContentType, ResilienceConfig, DocConfig } from './types';
import { streamPhpClientCode } from './services/geminiService';
import Header from './components/Header';
import AuthSelector from './components/AuthSelector';
import EndpointEditor from './components/EndpointEditor';
import CodeDisplay from './components/CodeDisplay';
import Loader from './components/Loader';
import { GithubIcon, SparklesIcon, CogIcon, TagIcon, ShieldCheckIcon, DocumentArrowUpIcon, LinkIcon } from './components/Icons';
import OpenApiImporter from './components/OpenApiImporter';
import AiConfigurator from './components/AiConfigurator';
import AiModelConfiguration from './components/AiModelConfiguration';
import PsrDisplay from './components/PsrDisplay';
import HeaderEditor from './components/HeaderEditor';
import { CONTENT_TYPE_OPTIONS } from './constants';

const REVIEW_TEMPLATE: Endpoint[] = [
  {
    id: 't1', name: 'createReview', method: 'POST', path: '/reviews',
    responsePayload: `{"status": "success", "data": {"id": 101, "rating": 5, "comment": "Excellent!", "meta": {"ref": "SDK-99", "custom_fields": {"verified_purchase": true}}}}`,
    headers: [],
    extractionRules: [
      { id: 'e1', property: 'reviewId', path: 'data.id' },
      { id: 'e2', property: 'reference', path: 'data.meta.ref' },
      { id: 'e3', property: 'isVerified', path: 'data.meta.custom_fields.verified_purchase' }
    ],
    contentType: 'application/json',
    dbConfig: { enabled: true, dbType: DatabaseType.MARIADB, tableName: 'product_reviews' },
  },
  {
    id: 't2', name: 'getLatestTestimonial', method: 'GET', path: '/testimonials/latest',
    responsePayload: `{"id": 1, "text": "Highly recommended!", "client": "Global Tech", "rating": 5, "acf": {"display_order": 1, "featured": true}}`,
    headers: [],
    extractionRules: [
      { id: 'e4', property: 'clientName', path: 'client' },
      { id: 'e5', property: 'isFeatured', path: 'acf.featured' }
    ],
    dbConfig: { enabled: false, dbType: DatabaseType.MARIADB, tableName: 'testimonials' },
  }
];

const WP_CMS_TEMPLATE: Endpoint[] = [
  {
    id: 'wp1', name: 'getPostWithCustomFields', method: 'GET', path: '/wp/v2/posts/{id}',
    responsePayload: `{"id": 123, "title": {"rendered": "Advanced PHP Architecture"}, "acf": {"hero_image": "img_99.jpg", "author_bio": "Expert Dev", "price": 49.99}, "scf": {"security_token": "scf_abc_123"}}`,
    headers: [],
    extractionRules: [
      { id: 'we1', property: 'heroImage', path: 'acf.hero_image' },
      { id: 'we2', property: 'price', path: 'acf.price' },
      { id: 'we3', property: 'secureToken', path: 'scf.security_token' }
    ],
    dbConfig: { enabled: false, dbType: DatabaseType.MARIADB, tableName: 'wp_posts' },
  }
];

const App: React.FC = () => {
  const [authConfig, setAuthConfig] = useState<AuthConfig>({
    method: AuthMethod.BEARER,
    tokenVariableName: '$apiToken',
  });

  const [resilienceConfig, setResilienceConfig] = useState<ResilienceConfig>({
    maxRetries: 3,
    baseDelay: 500,
    timeout: 30,
  });

  const [docConfig, setDocConfig] = useState<DocConfig>({
    generatePhpDoc: true,
    generateReadme: true,
    includeExamples: true,
    generateOpenApi: true,
    generateComposer: true,
    includeExtendedHelpers: true, // Default: ON
    useChromeAi: true,            // Default: ON
    includeWpCustomFields: true,  // Default: ON
  });

  const [chromeAiAvailable, setChromeAiAvailable] = useState<boolean>(false);

  useEffect(() => {
    if (typeof (window as any).ai !== 'undefined') {
      setChromeAiAvailable(true);
    }
  }, []);

  const [endpoints, setEndpoints] = useState<Endpoint[]>([
    {
      id: '1', name: 'getUserById', method: 'GET', path: '/users/{userId}',
      responsePayload: `{"id": 1, "name": "Leanne Graham"}`,
      extractionRules: [],
      headers: [],
      dbConfig: { enabled: true, dbType: DatabaseType.MARIADB, tableName: 'users' },
    }
  ]);

  const [globalHeaders, setGlobalHeaders] = useState<HeaderPair[]>([]);
  const [baseUri, setBaseUri] = useState<string>('https://api.example.com/v1');
  const [namespace, setNamespace] = useState<string>('App\\Sdk\\MyApiClient');
  const [defaultContentType, setDefaultContentType] = useState<ContentType>('application/json');
  const [generatedCode, setGeneratedCode] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'manual' | 'ai'>('manual');
  const [aiModelConfig, setAiModelConfig] = useState<AiModelConfig>({
      model: 'gemini-3-flash-preview',
      temperature: 0.1,
      topP: 0.95,
      topK: 40,
      thinkingBudget: 0,
  });

  const loadReviewTemplate = () => {
    setEndpoints(REVIEW_TEMPLATE);
    setNamespace('App\\Sdk\\ReviewsPlugin');
    setBaseUri('https://api.review-manager.io/v1');
  };

  const loadWpTemplate = () => {
    setEndpoints(WP_CMS_TEMPLATE);
    setNamespace('App\\Sdk\\WpMetaClient');
    setBaseUri('https://cms.yoursite.com/wp-json');
  };

  const handleGenerateCode = useCallback(async () => {
    setError(null);
    setIsLoading(true);
    setGeneratedCode('');
    try {
      await streamPhpClientCode(
        { authConfig, endpoints, baseUri, namespace, globalHeaders, defaultContentType, resilienceConfig, docConfig },
        aiModelConfig,
        (chunk) => {
            setGeneratedCode(prev => prev + chunk);
        }
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  }, [authConfig, endpoints, baseUri, namespace, aiModelConfig, globalHeaders, defaultContentType, resilienceConfig, docConfig]);

  const handleConfigGeneratedByAI = (config: any) => {
    if (config.namespace) setNamespace(config.namespace);
    if (config.baseUri) setBaseUri(config.baseUri);
    if (config.authConfig) setAuthConfig(config.authConfig);
    if (config.endpoints) {
       setEndpoints(config.endpoints.map((ep: any, i: number) => ({
         ...ep, 
         id: `ai-${i}-${Date.now()}`,
         extractionRules: ep.extractionRules || []
       })));
    }
    setActiveTab('manual');
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 flex flex-col">
      <Header chromeAiAvailable={chromeAiAvailable} />
      <main className="flex-grow p-4 md:p-8 grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-7xl mx-auto w-full">
        <div className="flex flex-col gap-6">
            <div className="flex border-b border-gray-700 bg-gray-800/20 rounded-t-xl overflow-hidden">
                <button 
                  onClick={() => setActiveTab('manual')} 
                  className={`flex-1 py-4 text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'manual' ? 'text-cyan-400 bg-gray-800 border-b-2 border-cyan-400' : 'text-gray-500 hover:text-gray-300'}`}
                >
                    Manual Blueprint
                </button>
                <button 
                  onClick={() => setActiveTab('ai')} 
                  className={`flex-1 py-4 text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'ai' ? 'text-cyan-400 bg-gray-800 border-b-2 border-cyan-400' : 'text-gray-500 hover:text-gray-300'}`}
                >
                    AI Contextual Architect
                </button>
            </div>

            {activeTab === 'manual' && (
                <div className="flex flex-col gap-6 animate-fade-in">
                    <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-cyan-500"></div>
                        <div className="flex justify-between items-center mb-8">
                          <div>
                            <h2 className="text-xl font-bold text-white tracking-tight">Project Identity</h2>
                            <p className="text-xs text-gray-400">Configure core package and automation options.</p>
                          </div>
                          <div className="flex flex-col gap-2 items-end">
                            <button 
                              onClick={loadReviewTemplate} 
                              className="text-[10px] bg-cyan-600 hover:bg-cyan-500 text-white px-3 py-1.5 rounded-lg border border-cyan-400/50 transition-all flex items-center gap-2 uppercase tracking-tighter font-extrabold shadow-lg shadow-cyan-500/10"
                            >
                              <SparklesIcon className="w-4 h-4"/> Reviews & Testimonials Plugin
                            </button>
                            <button 
                              onClick={loadWpTemplate} 
                              className="text-[10px] bg-purple-600 hover:bg-purple-500 text-white px-3 py-1.5 rounded-lg border border-purple-400/50 transition-all flex items-center gap-2 uppercase tracking-tighter font-extrabold shadow-lg shadow-purple-500/10"
                            >
                              <SparklesIcon className="w-4 h-4"/> WordPress CMS (ACF/SCF) Plugin
                            </button>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            <div className="space-y-1">
                                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Package Namespace</label>
                                <input 
                                  type="text" 
                                  value={namespace} 
                                  onChange={(e) => setNamespace(e.target.value)} 
                                  className="w-full bg-gray-950 border border-gray-700 rounded-lg px-4 py-3 text-sm text-cyan-400 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-all font-mono" 
                                  placeholder="Vendor\Project\Client"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Service Base URI</label>
                                <input 
                                  type="text" 
                                  value={baseUri} 
                                  onChange={(e) => setBaseUri(e.target.value)} 
                                  className="w-full bg-gray-950 border border-gray-700 rounded-lg px-4 py-3 text-sm text-cyan-400 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-all font-mono" 
                                  placeholder="https://api.provider.com/v1"
                                />
                            </div>
                        </div>

                        <div className="p-6 bg-gray-900/50 rounded-xl border border-gray-700/50 space-y-6">
                            <div className="flex items-center gap-2 border-b border-gray-800 pb-3">
                              <DocumentArrowUpIcon className="w-5 h-5 text-cyan-500" />
                              <h3 className="text-xs font-black text-gray-300 uppercase tracking-widest">Architectural Presets & Automation</h3>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
                                {[
                                    { key: 'includeExtendedHelpers', label: 'Support\\Arr & Support\\Url Helpers' },
                                    { key: 'includeWpCustomFields', label: 'ACF / SCF Meta Field Mapping' },
                                    { key: 'generateReadme', label: 'High-Level Technical README' },
                                    { key: 'generateOpenApi', label: 'Exported OpenAPI Definition' },
                                    { key: 'useChromeAi', label: 'Accelerated Local AI (Window AI)', disabled: !chromeAiAvailable },
                                ].map(item => (
                                    <label key={item.key} className={`flex items-center gap-4 cursor-pointer group p-3 rounded-xl hover:bg-gray-800 transition-all border border-transparent hover:border-gray-700 ${item.disabled ? 'opacity-30 cursor-not-allowed' : ''}`}>
                                        <div className="relative flex items-center justify-center">
                                          <input 
                                              type="checkbox" 
                                              disabled={item.disabled}
                                              checked={(docConfig as any)[item.key]} 
                                              onChange={(e) => setDocConfig({...docConfig, [item.key]: e.target.checked})}
                                              className="w-5 h-5 rounded border-gray-700 bg-gray-950 text-cyan-500 focus:ring-cyan-500 cursor-pointer"
                                          />
                                        </div>
                                        <span className="text-xs font-bold text-gray-400 group-hover:text-cyan-300 transition-colors uppercase tracking-tight">{item.label}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>

                    <AuthSelector authConfig={authConfig} setAuthConfig={setAuthConfig} />
                    <EndpointEditor endpoints={endpoints} setEndpoints={setEndpoints} />
                    <PsrDisplay />
                </div>
            )}
            
            {activeTab === 'ai' && (
                <div className="animate-fade-in h-full">
                    <AiConfigurator 
                      onConfigured={handleConfigGeneratedByAI} 
                      onError={setError}
                      modelConfig={aiModelConfig}
                      useChromeAi={docConfig.useChromeAi}
                      currentContext={{ namespace, baseUri, endpoints }}
                    />
                </div>
            )}

            <div className="mt-auto py-6 bg-gray-900 sticky bottom-0 z-20">
                <button 
                  onClick={handleGenerateCode} 
                  disabled={isLoading} 
                  className="group relative w-full bg-cyan-600 hover:bg-cyan-500 disabled:bg-gray-800 disabled:text-gray-600 text-white font-black py-6 px-4 rounded-2xl transition-all shadow-2xl shadow-cyan-500/40 flex items-center justify-center gap-4 active:scale-[0.98] border border-cyan-400/30 overflow-hidden"
                >
                    {isLoading ? <Loader className="w-7 h-7" /> : <SparklesIcon className="w-7 h-7 group-hover:scale-110 group-hover:rotate-12 transition-transform"/>}
                    <span className="uppercase tracking-[0.2em] text-xl">
                      {isLoading ? 'Assembling Package...' : 'Assemble Full SDK Package'}
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                </button>
            </div>
        </div>

        <div className="flex flex-col gap-6">
          <CodeDisplay code={generatedCode} isLoading={isLoading} error={error} />
          <AiModelConfiguration config={aiModelConfig} setConfig={setAiModelConfig} />
        </div>
      </main>
    </div>
  );
};

export default App;
