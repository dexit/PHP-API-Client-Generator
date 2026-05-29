
import React from 'react';
import { HeaderPair } from '../types';
import { PlusIcon, TrashIcon } from './Icons';

interface HeaderEditorProps {
    headers: HeaderPair[];
    onChange: (headers: HeaderPair[]) => void;
    label?: string;
}

const HeaderEditor: React.FC<HeaderEditorProps> = ({ headers, onChange, label = "Headers" }) => {
    const addHeader = () => {
        onChange([...headers, { id: Math.random().toString(36).substr(2, 9), key: '', value: '' }]);
    };

    const updateHeader = (id: string, field: 'key' | 'value', value: string) => {
        onChange(headers.map(h => h.id === id ? { ...h, [field]: value } : h));
    };

    const removeHeader = (id: string) => {
        onChange(headers.filter(h => h.id !== id));
    };

    return (
        <div className="space-y-3 bg-gray-800/40 p-3 rounded-lg border border-gray-700/50">
            <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">{label}</label>
                <button 
                    onClick={addHeader}
                    className="text-cyan-400 hover:text-cyan-300 text-xs flex items-center gap-1 transition-colors font-semibold"
                >
                    <PlusIcon className="w-3.5 h-3.5" /> Add
                </button>
            </div>
            {headers.length === 0 ? (
                <p className="text-[10px] text-gray-600 italic">No custom headers defined.</p>
            ) : (
                <div className="space-y-2">
                    {headers.map((h) => (
                        <div key={h.id} className="flex gap-2 animate-fade-in group">
                            <input
                                type="text"
                                placeholder="Header Name"
                                value={h.key}
                                onChange={(e) => updateHeader(h.id, 'key', e.target.value)}
                                className="flex-1 bg-gray-900 border border-gray-700 rounded px-2.5 py-1.5 text-xs text-gray-200 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-all placeholder:text-gray-700"
                            />
                            <input
                                type="text"
                                placeholder="Value"
                                value={h.value}
                                onChange={(e) => updateHeader(h.id, 'value', e.target.value)}
                                className="flex-1 bg-gray-900 border border-gray-700 rounded px-2.5 py-1.5 text-xs text-gray-200 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-all placeholder:text-gray-700"
                            />
                            <button 
                                onClick={() => removeHeader(h.id)} 
                                className="text-gray-600 hover:text-red-500 p-1.5 rounded hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100"
                            >
                                <TrashIcon className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default HeaderEditor;
