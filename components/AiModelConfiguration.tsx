
import React from 'react';
import { AiModelConfig } from '../types';
import { AVAILABLE_MODELS } from '../constants';
import { SparklesIcon } from './Icons';

interface AiModelConfigurationProps {
  config: AiModelConfig;
  setConfig: (config: AiModelConfig) => void;
  apiKey: string;
  setApiKey: (key: string) => void;
}

const Slider: React.FC<{
    label: string;
    id: string;
    min: number;
    max: number;
    step: number;
    value: number;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    tooltip: string;
}> = ({ label, id, min, max, step, value, onChange, tooltip }) => (
    <div>
        <label htmlFor={id} className="block text-sm font-medium text-gray-400 mb-1" title={tooltip}>
            {label}: <span className="font-mono text-cyan-400">{value}</span>
        </label>
        <input
            id={id}
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={onChange}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
        />
    </div>
);


const AiModelConfiguration: React.FC<AiModelConfigurationProps> = ({ config, setConfig, apiKey, setApiKey }) => {
    
    const handleValueChange = (field: keyof AiModelConfig, value: string | number) => {
        setConfig({ ...config, [field]: typeof value === 'string' ? value : Number(value) });
    };

    return (
        <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700">
            <h2 className="text-xl font-bold mb-4 text-cyan-400 flex items-center gap-2">
                <SparklesIcon className="w-6 h-6" />
                AI Model Settings
            </h2>
            <div className="space-y-4">
                <div>
                    <label htmlFor="apiKey" className="block text-sm font-medium text-gray-400 mb-1">
                        Gemini API Key
                    </label>
                    <input
                        id="apiKey"
                        type="password"
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        className="w-full bg-gray-900 border border-gray-600 rounded-md px-3 py-2 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition"
                        placeholder="Enter your Gemini API Key"
                    />
                </div>

                <div>
                    <label htmlFor="model" className="block text-sm font-medium text-gray-400 mb-1">
                        Model
                    </label>
                    <select
                        id="model"
                        value={config.model}
                        onChange={(e) => handleValueChange('model', e.target.value)}
                        className="w-full bg-gray-900 border border-gray-600 rounded-md px-3 py-2 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition"
                    >
                        {AVAILABLE_MODELS.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                </div>

                <Slider
                    id="temperature"
                    label="Temperature"
                    min={0} max={1} step={0.1}
                    value={config.temperature}
                    onChange={(e) => handleValueChange('temperature', e.target.value)}
                    tooltip="Controls randomness. Lower values are more deterministic."
                />

                <Slider
                    id="topP"
                    label="Top-P"
                    min={0.1} max={1} step={0.1}
                    value={config.topP}
                    onChange={(e) => handleValueChange('topP', e.target.value)}
                    tooltip="Cumulative probability cutoff for token selection."
                />

                <Slider
                    id="topK"
                    label="Top-K"
                    min={1} max={128} step={1}
                    value={config.topK}
                    onChange={(e) => handleValueChange('topK', e.target.value)}
                    tooltip="Sample from the K most likely tokens."
                />
                
                {config.model === 'gemini-2.5-flash' && (
                    <Slider
                        id="thinkingBudget"
                        label="Thinking Budget"
                        min={0} max={500} step={10}
                        value={config.thinkingBudget || 0}
                        onChange={(e) => handleValueChange('thinkingBudget', e.target.value)}
                        tooltip="Allocates tokens for preliminary processing to improve response quality. 0 disables it."
                    />
                )}
            </div>
        </div>
    );
};

export default AiModelConfiguration;
