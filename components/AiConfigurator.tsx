
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, Chat } from "@google/genai";
import { ConversationPart, configSystemInstruction } from '../services/geminiService';
import { AiModelConfig, Endpoint } from '../types';
import Loader from './Loader';
import { SparklesIcon, CheckIcon, ShieldCheckIcon, CogIcon } from './Icons';

interface AiConfiguratorProps {
    onConfigured: (config: any) => void;
    onError: (message: string | null) => void;
    modelConfig: AiModelConfig;
    useChromeAi: boolean;
    currentContext: {
      namespace: string;
      baseUri: string;
      endpoints: Endpoint[];
    };
}

const AiConfigurator: React.FC<AiConfiguratorProps> = ({ onConfigured, onError, modelConfig, useChromeAi, currentContext }) => {
    const [conversation, setConversation] = useState<ConversationPart[]>([]);
    const [userInput, setUserInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [statusMessage, setStatusMessage] = useState<string | null>(null);
    const [finalConfig, setFinalConfig] = useState<any | null>(null);
    const chatContainerRef = useRef<HTMLDivElement>(null);
    const chatRef = useRef<Chat | null>(null);
    const chromeAiSessionRef = useRef<any>(null);

    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [conversation, isLoading]);
    
    useEffect(() => {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const contextString = `LIVE PROJECT CONTEXT: 
        - NAMESPACE: ${currentContext.namespace}
        - BASE URI: ${currentContext.baseUri}
        - ENDPOINTS: ${currentContext.endpoints.length} defined.`;

        chatRef.current = ai.chats.create({
            model: modelConfig.model,
            config: {
                systemInstruction: configSystemInstruction + "\n\n" + contextString,
                temperature: modelConfig.temperature,
                topP: modelConfig.topP,
                topK: modelConfig.topK,
            },
        });
        
        const initChromeAi = async () => {
            if (useChromeAi && (window as any).ai) {
                try {
                    const capabilities = await (window as any).ai.languageModel.capabilities();
                    if (capabilities.available === 'readily') {
                        chromeAiSessionRef.current = await (window as any).ai.languageModel.create({
                            systemPrompt: "You are the Local Insight Agent. Your job is to pre-analyze developer requests for SDK changes and validate output. Keep critiques technical and concise."
                        });
                    }
                } catch (e) {
                    console.warn("Local AI Init Failed:", e);
                }
            }
        };

        initChromeAi();

        return () => {
            if (chromeAiSessionRef.current?.destroy) chromeAiSessionRef.current.destroy();
        };
    }, [modelConfig, useChromeAi, currentContext.namespace, currentContext.baseUri, currentContext.endpoints.length]);


    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userInput.trim() || isLoading) return;

        const newUserPart: ConversationPart = { role: 'user', parts: [{ text: userInput }] };
        setConversation(prev => [...prev, newUserPart]);
        
        const currentInput = userInput;
        setUserInput('');
        setIsLoading(true);
        setFinalConfig(null);
        onError(null);

        try {
            let enhancedInput = currentInput;
            
            // Phase 1: Local Analysis (Built-in AI)
            if (chromeAiSessionRef.current) {
                setStatusMessage("Local Insight: Analyzing requirements...");
                const localCritique = await chromeAiSessionRef.current.prompt(
                    `Critique this SDK request for technical clarity based on current context: ${currentInput}. 
                     Project uses PSR-18, PHP 8.2, and current namespace ${currentContext.namespace}.`
                );
                enhancedInput = `USER REQUEST: ${currentInput}\n\nLOCAL AI CRITIQUE/REFINEMENT: ${localCritique}`;
            }

            // Phase 2: Cloud Generation (Gemini)
            setStatusMessage("Gemini Cloud: Architecting solution...");
            let modelResponse = '';
            setConversation(prev => [...prev, { role: 'model', parts: [{ text: '' }] }]);

            if (chatRef.current) {
                const stream = await chatRef.current.sendMessageStream({ message: enhancedInput });
                for await (const chunk of stream) {
                    if (chunk.text) {
                        modelResponse += chunk.text;
                        setConversation(prev => {
                            const next = [...prev];
                            next[next.length - 1].parts[0].text = modelResponse;
                            return next;
                        });
                    }
                }
            }

            // Phase 3: Validation (Built-in AI)
            const jsonMatch = modelResponse.match(/```json\n([\s\S]*?)\n```/);
            if (jsonMatch && jsonMatch[1]) {
                const configData = JSON.parse(jsonMatch[1]);
                
                if (chromeAiSessionRef.current) {
                    setStatusMessage("Local Validator: Running compliance checks...");
                    const validationResult = await chromeAiSessionRef.current.prompt(
                        `Check this JSON SDK config for common PHP errors (e.g. invalid namespaces, missing method names, malformed paths): ${jsonMatch[1]}`
                    );
                    
                    if (validationResult.toLowerCase().includes("error") || validationResult.toLowerCase().includes("invalid")) {
                        setConversation(prev => [
                            ...prev, 
                            { role: 'model', parts: [{ text: `⚠️ **Local AI Alert:** ${validationResult}\n\nI recommend reviewing the proposed changes carefully before applying.` }] }
                        ]);
                    }
                }
                setFinalConfig(configData);
            }
            
            setStatusMessage(null);
        } catch (err: any) {
            onError(err.message || 'Collaborative reasoning failed.');
            setStatusMessage(null);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-gray-800 rounded-2xl shadow-2xl border border-gray-700 flex flex-col h-[75vh] min-h-[500px] overflow-hidden">
            {/* Multi-Agent Header */}
            <div className="bg-gray-950/50 px-4 py-3 border-b border-gray-700 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="flex -space-x-2">
                        <div className={`w-8 h-8 rounded-full bg-cyan-500/20 border border-cyan-500/50 flex items-center justify-center text-cyan-400 ${isLoading ? 'animate-pulse' : ''}`}>
                            <SparklesIcon className="w-4 h-4" />
                        </div>
                        {useChromeAi && (
                            <div className="w-8 h-8 rounded-full bg-purple-500/20 border border-purple-500/50 flex items-center justify-center text-purple-400">
                                <CogIcon className="w-4 h-4" />
                            </div>
                        )}
                    </div>
                    <div>
                        <h3 className="text-[10px] font-black text-gray-100 uppercase tracking-widest leading-none">Architectural Intelligence</h3>
                        <p className="text-[9px] text-gray-500 uppercase tracking-tighter mt-1">Collaborative Reasoning (Gemini + Built-in AI)</p>
                    </div>
                </div>
                {statusMessage && (
                    <div className="flex items-center gap-2 animate-fade-in">
                        <Loader className="w-3 h-3 text-cyan-400" />
                        <span className="text-[9px] font-bold text-cyan-400 uppercase tracking-widest">{statusMessage}</span>
                    </div>
                )}
            </div>

            <div ref={chatContainerRef} className="flex-grow p-6 space-y-6 overflow-y-auto scroll-smooth">
                {conversation.length === 0 && (
                    <div className="text-center p-10 text-gray-400 bg-gray-900/40 rounded-3xl border border-dashed border-gray-700 m-4 flex flex-col items-center">
                        <div className="p-4 bg-cyan-500/10 rounded-full mb-6 ring-4 ring-cyan-500/5">
                            <ShieldCheckIcon className="w-10 h-10 text-cyan-400 opacity-60"/>
                        </div>
                        <h3 className="font-black text-gray-100 text-lg uppercase tracking-wider mb-2">Architect Briefing</h3>
                        <p className="text-xs mb-8 max-w-xs leading-relaxed opacity-60">
                            Describe the high-level logic you need. Our collaborative AI system will refine your prompt locally before building the solution in the cloud.
                        </p>
                        
                        <div className="w-full space-y-3">
                          <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest text-left px-2">Production Scenarios</p>
                          <button onClick={() => setUserInput("Add an OAuth2 Client Credentials flow with caching for tokens.")} className="w-full text-left text-[11px] bg-gray-900/60 p-3 rounded-xl hover:bg-cyan-900/30 hover:text-cyan-200 border border-gray-800 hover:border-cyan-500/30 transition-all font-medium">"OAuth2 Client Credentials with caching..."</button>
                          <button onClick={() => setUserInput("Map all endpoints to return custom Exception objects on non-200 responses.")} className="w-full text-left text-[11px] bg-gray-900/60 p-3 rounded-xl hover:bg-cyan-900/30 hover:text-cyan-200 border border-gray-800 hover:border-cyan-500/30 transition-all font-medium">"Enhanced error handling & custom exceptions..."</button>
                        </div>
                    </div>
                )}
                {conversation.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
                        <div className={`max-w-[85%] px-5 py-3 rounded-2xl text-sm leading-relaxed shadow-lg ${msg.role === 'user' ? 'bg-cyan-600 text-white font-medium rounded-tr-none' : 'bg-gray-700 text-gray-200 border border-gray-600 rounded-tl-none'}`}>
                           {msg.parts[0].text}
                        </div>
                    </div>
                ))}
                
                {finalConfig && (
                    <div className="flex flex-col items-center gap-4 bg-cyan-900/20 p-6 rounded-2xl border border-cyan-500/30 animate-fade-in shadow-xl ring-1 ring-cyan-500/20">
                         <div className="flex items-center gap-3 text-cyan-400 font-black text-xs uppercase tracking-[0.2em]">
                             <CheckIcon className="w-5 h-5"/> Architectural Plan Verified
                         </div>
                         <button onClick={() => onConfigured(finalConfig)} className="w-full bg-cyan-500 hover:bg-cyan-400 text-gray-950 font-black py-4 px-8 rounded-xl text-sm transition-all shadow-xl shadow-cyan-500/20 active:scale-95 uppercase tracking-widest">
                            Apply Design Update
                        </button>
                    </div>
                )}
            </div>

            <form onSubmit={handleSendMessage} className="p-4 bg-gray-950/80 border-t border-gray-800">
                <div className="flex gap-3 bg-gray-900 p-2.5 rounded-2xl border border-gray-800 focus-within:border-cyan-500/50 transition-all shadow-inner">
                    <input
                        value={userInput}
                        onChange={(e) => setUserInput(e.target.value)}
                        placeholder="Discuss architecture with the AI team..."
                        className="flex-grow bg-transparent border-none focus:ring-0 px-3 py-1 text-sm text-gray-200 placeholder:text-gray-600"
                        disabled={isLoading}
                    />
                    <button type="submit" disabled={isLoading || !userInput.trim()} className="bg-cyan-500 hover:bg-cyan-400 text-gray-950 p-3 rounded-xl disabled:opacity-30 disabled:hover:bg-cyan-500 transition-all shadow-lg">
                        <SparklesIcon className="w-5 h-5"/>
                    </button>
                </div>
            </form>
        </div>
    );
};

export default AiConfigurator;
