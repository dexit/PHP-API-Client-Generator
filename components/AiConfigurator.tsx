
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, Chat } from "@google/genai";
import { ConversationPart, configSystemInstruction } from '../services/geminiService';
import { AiModelConfig } from '../types';
import Loader from './Loader';
import { SparklesIcon } from './Icons';

interface AiConfiguratorProps {
    onConfigured: (config: any) => void;
    onError: (message: string | null) => void;
    modelConfig: AiModelConfig;
    apiKey: string;
}

const AiConfigurator: React.FC<AiConfiguratorProps> = ({ onConfigured, onError, modelConfig, apiKey }) => {
    const [conversation, setConversation] = useState<ConversationPart[]>([]);
    const [userInput, setUserInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [finalConfig, setFinalConfig] = useState<any | null>(null);
    const chatContainerRef = useRef<HTMLDivElement>(null);
    const chatRef = useRef<Chat | null>(null);

    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [conversation, isLoading]);
    
    useEffect(() => {
        if (!apiKey) {
            onError("API Key is not configured. Cannot initialize AI assistant.");
            return;
        }
        const ai = new GoogleGenAI({ apiKey });
        const generationConfig: any = {
            temperature: modelConfig.temperature,
            topP: modelConfig.topP,
            topK: modelConfig.topK,
        };
        if (modelConfig.model === 'gemini-2.5-flash' && modelConfig.thinkingBudget && modelConfig.thinkingBudget > 0) {
           generationConfig.thinkingConfig = { thinkingBudget: modelConfig.thinkingBudget };
        }
        
        chatRef.current = ai.chats.create({
            model: modelConfig.model,
            config: {
                systemInstruction: configSystemInstruction,
                ...generationConfig
            },
        });
        // Reset chat if model config changes
        setConversation([]);
        setFinalConfig(null);

    }, [modelConfig, onError, apiKey]);


    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userInput.trim() || isLoading || !chatRef.current) return;

        const newUserPart: ConversationPart = { role: 'user', parts: [{ text: userInput }] };
        setConversation(prev => [...prev, newUserPart]);
        
        const currentInput = userInput;
        setUserInput('');
        setIsLoading(true);
        onError(null);

        try {
            const stream = await chatRef.current.sendMessageStream({ message: currentInput });
            
            let modelResponse = '';
            setConversation(prev => [...prev, { role: 'model', parts: [{ text: '' }] }]);

            for await (const chunk of stream) {
                modelResponse += chunk.text;
                setConversation(prev => {
                    const newConversation = [...prev];
                    newConversation[newConversation.length - 1].parts[0].text = modelResponse;
                    return newConversation;
                });
            }

            const jsonMatch = modelResponse.match(/```json\n([\s\S]*?)\n```/);
            if (jsonMatch && jsonMatch[1]) {
                 try {
                    const config = JSON.parse(jsonMatch[1]);
                    setFinalConfig(config);
                 } catch (e) {
                     console.error("Failed to parse JSON config from AI", e);
                     const parseErrorMsg = "I tried to create the JSON configuration, but it seems to be invalid. Could you please confirm the details and I'll try again?";
                     setConversation(prev => {
                        const newConversation = [...prev];
                        newConversation[newConversation.length - 1].parts[0].text = parseErrorMsg;
                        return newConversation;
                    });
                 }
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
            onError(errorMessage);
             setConversation(prev => [...prev, { role: 'model', parts: [{ text: `Sorry, I ran into an error: ${errorMessage}` }] }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleApplyConfig = () => {
        if(finalConfig) {
            onConfigured(finalConfig);
            setFinalConfig(null);
        }
    };
    
    const WelcomeMessage = () => (
        <div className="text-center p-4 text-gray-400">
             <SparklesIcon className="w-12 h-12 mx-auto mb-4 text-cyan-400/50"/>
            <h3 className="font-bold text-lg text-gray-300">AI Configuration Assistant</h3>
            <p className="text-sm">Describe the API client you want to build. For example:</p>
            <p className="text-sm italic mt-2 bg-gray-900/50 p-2 rounded-md">"I need an API client for a blog. It should have methods to get all posts, get a single post by ID, and create a new post with a title and content. Use Bearer token auth."</p>
        </div>
    );

    return (
        <div className="bg-gray-800 rounded-xl shadow-lg border border-gray-700 flex flex-col h-[70vh] max-h-[1000px]">
            <div ref={chatContainerRef} className="flex-grow p-4 space-y-4 overflow-y-auto">
                {conversation.length === 0 && !isLoading && <WelcomeMessage />}
                {conversation.map((msg, index) => (
                    <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-xl lg:max-w-2xl px-4 py-2 rounded-xl whitespace-pre-wrap ${
                            msg.role === 'user' 
                            ? 'bg-cyan-600/80 text-white rounded-br-none' 
                            : 'bg-gray-700 text-gray-200 rounded-bl-none'
                        }`}>
                           {msg.parts[0].text}
                        </div>
                    </div>
                ))}
                {isLoading && conversation[conversation.length - 1]?.role !== 'model' && (
                     <div className="flex justify-start">
                        <div className="max-w-lg px-4 py-2 rounded-lg bg-gray-700 text-gray-200 flex items-center gap-2">
                            <Loader className="w-4 h-4" />
                            <span>Thinking...</span>
                        </div>
                    </div>
                )}
                {finalConfig && (
                    <div className="!mt-6 flex justify-center">
                         <button
                            onClick={handleApplyConfig}
                            className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-lg transition-all shadow-lg hover:shadow-green-500/30"
                        >
                            Apply Configuration
                        </button>
                    </div>
                )}
            </div>
            <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-700">
                <div className="flex items-center gap-3">
                    <textarea
                        value={userInput}
                        onChange={(e) => setUserInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSendMessage(e as any);
                            }
                        }}
                        rows={1}
                        placeholder={conversation.length === 0 ? "Describe your API client..." : "Type your answer..."}
                        className="w-full bg-gray-900 border border-gray-600 rounded-md px-3 py-2 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition resize-none"
                        disabled={isLoading || !!finalConfig}
                    />
                    <button
                        type="submit"
                        disabled={isLoading || !userInput.trim() || !!finalConfig}
                        className="bg-cyan-600 hover:bg-cyan-700 disabled:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg transition-all disabled:cursor-not-allowed"
                    >
                        Send
                    </button>
                </div>
            </form>
        </div>
    );
};

export default AiConfigurator;
