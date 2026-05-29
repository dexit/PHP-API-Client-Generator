
import React, { useState, useRef } from 'react';
import { Endpoint, DbConfig, DatabaseType, HttpMethod, HeaderPair, ContentType, ExtractionRule } from '../types';
import { PlusIcon, TrashIcon, ChevronDownIcon, DatabaseIcon, GripVerticalIcon, TagIcon, SparklesIcon } from './Icons';
import { HTTP_METHODS, DATABASE_TYPE_OPTIONS, CONTENT_TYPE_OPTIONS } from '../constants';
import HeaderEditor from './HeaderEditor';

const getMethodClass = (method: HttpMethod) => {
    switch (method) {
        case 'GET': return 'bg-sky-600/70 text-sky-100';
        case 'POST': return 'bg-green-600/70 text-green-100';
        case 'PUT': return 'bg-yellow-600/70 text-yellow-100';
        case 'PATCH': return 'bg-orange-600/70 text-orange-100';
        case 'DELETE': return 'bg-red-600/70 text-red-100';
        default: return 'bg-gray-600/70 text-gray-100';
    }
};

interface EndpointEntryProps {
    endpoint: Endpoint;
    index: number;
    onUpdate: (field: keyof Omit<Endpoint, 'id'>, value: any) => void;
    onRemove: () => void;
    onDragStart: (index: number) => void;
    onDragEnter: (index: number) => void;
    onDragEnd: () => void;
    isDragging: boolean;
    isDragOver: boolean;
}

const EndpointEntry: React.FC<EndpointEntryProps> = ({ 
    endpoint, index, onUpdate, onRemove, 
    onDragStart, onDragEnter, onDragEnd, isDragging, isDragOver
}) => {
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);

    const handleDbConfigChange = (field: keyof DbConfig, value: any) => {
        onUpdate('dbConfig', { ...endpoint.dbConfig, [field]: value });
    };

    const addExtractionRule = () => {
        const rules = [...(endpoint.extractionRules || []), { id: Date.now().toString(), property: '', path: '' }];
        onUpdate('extractionRules', rules);
    };

    const removeExtractionRule = (id: string) => {
        onUpdate('extractionRules', endpoint.extractionRules.filter(r => r.id !== id));
    };

    const updateExtractionRule = (id: string, field: keyof ExtractionRule, value: string) => {
        onUpdate('extractionRules', endpoint.extractionRules.map(r => r.id === id ? { ...r, [field]: value } : r));
    };

    const isMutationMethod = ['POST', 'PUT', 'PATCH'].includes(endpoint.method);

    return (
        <div
            draggable
            onDragStart={() => onDragStart(index)}
            onDragEnter={() => onDragEnter(index)}
            onDragEnd={onDragEnd}
            onDragOver={(e) => e.preventDefault()}
            className={`
                bg-gray-800/40 rounded-xl border transition-all duration-300 group/item
                ${isDragging ? 'opacity-30' : 'opacity-100'}
                ${isDragOver ? 'border-cyan-500 scale-102 ring-4 ring-cyan-500/10' : 'border-gray-700/50 hover:border-gray-600'}
                ${isDetailsOpen ? 'bg-gray-800 ring-1 ring-gray-700' : ''}
            `}
        >
            <div className="flex items-center p-3 gap-3">
                <div className="cursor-grab text-gray-600 hover:text-cyan-400 transition-colors" title="Reorder">
                    <GripVerticalIcon className="w-5 h-5" />
                </div>
                
                <div className="flex flex-grow gap-2 items-center">
                    <select
                        value={endpoint.method}
                        onChange={(e) => onUpdate('method', e.target.value)}
                        className={`rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-cyan-500 outline-none transition text-[10px] font-black border-0 shadow-sm ${getMethodClass(endpoint.method)}`}
                    >
                        {HTTP_METHODS.map(method => <option key={method} value={method}>{method}</option>)}
                    </select>
                    
                    <input
                        type="text"
                        placeholder="Method Name"
                        value={endpoint.name}
                        onChange={(e) => onUpdate('name', e.target.value)}
                        className="bg-gray-950 border border-gray-700 rounded-lg px-3 py-2 text-xs text-white focus:border-cyan-500 outline-none transition-all w-48 font-semibold"
                    />
                    
                    <div className="relative flex-grow">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-[10px]">/</div>
                      <input
                          type="text"
                          placeholder="path/to/resource"
                          value={endpoint.path}
                          onChange={(e) => onUpdate('path', e.target.value)}
                          className="bg-gray-950 border border-gray-700 rounded-lg pl-6 pr-3 py-2 text-xs text-cyan-200 focus:border-cyan-500 outline-none transition-all w-full font-mono"
                      />
                    </div>
                </div>

                <div className="flex items-center gap-1">
                     <button
                        onClick={() => setIsDetailsOpen(!isDetailsOpen)}
                        className={`p-2 rounded-lg transition-all ${isDetailsOpen ? 'bg-cyan-500 text-white' : 'text-gray-500 hover:bg-gray-700 hover:text-cyan-400'}`}
                    >
                        <ChevronDownIcon className={`w-5 h-5 transition-transform ${isDetailsOpen ? 'rotate-180' : ''}`} />
                    </button>
                    <button
                        onClick={onRemove}
                        className="p-2 rounded-lg text-gray-600 hover:bg-red-500/10 hover:text-red-500 transition-all"
                    >
                        <TrashIcon className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {isDetailsOpen && (
                 <div className="border-t border-gray-700/50 p-6 space-y-6 animate-fade-in bg-gray-900/30 rounded-b-xl">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div className="space-y-6">
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">
                                      Sample JSON Response
                                  </label>
                                  <span className="text-[9px] text-gray-600 italic">Used for DTO generation</span>
                                </div>
                                <textarea
                                    placeholder='{"id": 1, "name": "..."}'
                                    value={endpoint.responsePayload}
                                    onChange={(e) => onUpdate('responsePayload', e.target.value)}
                                    rows={10}
                                    className="bg-gray-950 border border-gray-700 rounded-xl px-4 py-3 text-[11px] text-cyan-300 focus:border-cyan-500 outline-none transition-all w-full font-mono shadow-inner leading-relaxed"
                                />
                            </div>

                            <div className="p-4 bg-gray-950/50 rounded-xl border border-gray-700/50">
                                <div className="flex justify-between items-center mb-4">
                                  <div className="flex items-center gap-2">
                                    <SparklesIcon className="w-4 h-4 text-cyan-500"/>
                                    <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Dynamic Extraction Mapping</h4>
                                  </div>
                                  <button onClick={addExtractionRule} className="text-[9px] font-bold text-cyan-400 hover:text-white transition-colors bg-cyan-950/50 px-2 py-1 rounded border border-cyan-500/30">
                                    + Add Rule
                                  </button>
                                </div>
                                <div className="space-y-3">
                                  {(endpoint.extractionRules || []).map(rule => (
                                    <div key={rule.id} className="flex gap-2 items-center group/rule">
                                      <input 
                                        type="text" 
                                        placeholder="Var Name (e.g. userId)" 
                                        value={rule.property} 
                                        onChange={(e) => updateExtractionRule(rule.id, 'property', e.target.value)}
                                        className="bg-gray-900 border border-gray-700 rounded px-2 py-1 text-[10px] flex-1 text-white focus:border-cyan-500 outline-none"
                                      />
                                      <div className="text-gray-600">←</div>
                                      <input 
                                        type="text" 
                                        placeholder="Path (e.g. data.id)" 
                                        value={rule.path} 
                                        onChange={(e) => updateExtractionRule(rule.id, 'path', e.target.value)}
                                        className="bg-gray-900 border border-gray-700 rounded px-2 py-1 text-[10px] flex-1 text-cyan-400 focus:border-cyan-500 outline-none font-mono"
                                      />
                                      <button onClick={() => removeExtractionRule(rule.id)} className="text-gray-600 hover:text-red-500 transition-colors">
                                        <TrashIcon className="w-3.5 h-3.5"/>
                                      </button>
                                    </div>
                                  ))}
                                  {(!endpoint.extractionRules || endpoint.extractionRules.length === 0) && (
                                    <p className="text-[9px] text-gray-600 italic text-center py-2">No dynamic extractions configured. SDK will return the DTO or raw response.</p>
                                  )}
                                </div>
                            </div>
                        </div>
                        
                        <div className="space-y-6">
                            <HeaderEditor 
                                label="Endpoint Specific Headers"
                                headers={endpoint.headers || []}
                                onChange={(h) => onUpdate('headers', h)}
                            />

                            {isMutationMethod && (
                                <div className="p-4 bg-gray-950/50 rounded-xl border border-gray-700/50">
                                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">Payload Strategy</label>
                                    <select
                                        value={endpoint.contentType || ''}
                                        onChange={(e) => onUpdate('contentType', e.target.value || undefined)}
                                        className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-xs text-white focus:border-cyan-500 outline-none transition-all"
                                    >
                                        <option value="">Inherit Project Default</option>
                                        {CONTENT_TYPE_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                    </select>
                                </div>
                            )}
                            
                            <div className="p-4 bg-gray-950/50 rounded-xl border border-gray-700/50 space-y-4">
                                <div className="flex items-center justify-between">
                                    <label htmlFor={`db-enabled-${endpoint.id}`} className="flex items-center gap-3 text-xs font-bold text-gray-300 uppercase tracking-tighter cursor-pointer">
                                        <div className={`p-1.5 rounded bg-gray-900 border border-gray-700 transition-colors ${endpoint.dbConfig.enabled ? 'text-cyan-400 border-cyan-500/50' : 'text-gray-600'}`}>
                                          <DatabaseIcon className="w-4 h-4"/>
                                        </div>
                                        Persistence Bridge
                                    </label>
                                    <div className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            id={`db-enabled-${endpoint.id}`}
                                            checked={endpoint.dbConfig.enabled}
                                            onChange={(e) => handleDbConfigChange('enabled', e.target.checked)}
                                            className="sr-only peer"
                                        />
                                        <div className="w-9 h-5 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-cyan-600"></div>
                                    </div>
                                </div>

                                {endpoint.dbConfig.enabled && (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-gray-800 animate-fade-in">
                                        <div className="space-y-1">
                                            <label className="block text-[9px] font-bold text-gray-500 uppercase">Engine</label>
                                            <select
                                                value={endpoint.dbConfig.dbType}
                                                onChange={(e) => handleDbConfigChange('dbType', e.target.value)}
                                                className="w-full bg-gray-900 border border-gray-700 rounded px-2 py-1.5 text-xs text-white"
                                            >
                                                {DATABASE_TYPE_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                            </select>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="block text-[9px] font-bold text-gray-500 uppercase">Table</label>
                                            <input
                                                type="text"
                                                placeholder="Table name"
                                                value={endpoint.dbConfig.tableName}
                                                onChange={(e) => handleDbConfigChange('tableName', e.target.value)}
                                                className="w-full bg-gray-900 border border-gray-700 rounded px-2 py-1.5 text-xs text-cyan-400 font-mono"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

const EndpointEditor: React.FC<{ endpoints: Endpoint[]; setEndpoints: (endpoints: Endpoint[]) => void; }> = ({ endpoints, setEndpoints }) => {
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);
  const [draggingIndex, setDraggingIndex] = useState<number|null>(null);

  const addEndpoint = () => {
    setEndpoints([
      ...endpoints,
      { 
          id: Date.now().toString(), 
          name: '', 
          method: 'GET', 
          path: '', 
          responsePayload: '',
          extractionRules: [],
          headers: [],
          dbConfig: { enabled: false, dbType: DatabaseType.MARIADB, tableName: ''}
      },
    ]);
  };

  const removeEndpoint = (id: string) => {
    setEndpoints(endpoints.filter((ep) => ep.id !== id));
  };

  const updateEndpoint = (id: string, field: keyof Omit<Endpoint, 'id'>, value: any) => {
    setEndpoints(
      endpoints.map((ep) => (ep.id === id ? { ...ep, [field]: value } : ep))
    );
  };
  
  const handleDragStart = (index: number) => {
      dragItem.current = index;
      setDraggingIndex(index);
  };

  const handleDragEnter = (index: number) => {
      dragOverItem.current = index;
  };

  const handleDragEnd = () => {
    if (dragItem.current !== null && dragOverItem.current !== null && dragItem.current !== dragOverItem.current) {
        const newEndpoints = [...endpoints];
        const draggedItemContent = newEndpoints.splice(dragItem.current, 1)[0];
        newEndpoints.splice(dragOverItem.current, 0, draggedItemContent);
        setEndpoints(newEndpoints);
    }
    dragItem.current = null;
    dragOverItem.current = null;
    setDraggingIndex(null);
  };

  return (
    <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">API Interface</h2>
          <p className="text-xs text-gray-400">Describe your endpoints to map DTOs and Logic.</p>
        </div>
        <button
          onClick={addEndpoint}
          className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2 px-4 rounded-lg transition-all text-xs shadow-lg shadow-cyan-500/20"
        >
          <PlusIcon className="w-4 h-4" />
          Add Endpoint
        </button>
      </div>
      <div className="space-y-4">
        {endpoints.length === 0 && (
          <div className="text-center py-12 border-2 border-dashed border-gray-700 rounded-xl">
            <p className="text-gray-500 text-sm">No endpoints defined yet.</p>
          </div>
        )}
        {endpoints.map((endpoint, index) => (
            <EndpointEntry 
                key={endpoint.id}
                index={index}
                endpoint={endpoint}
                onUpdate={(field, value) => updateEndpoint(endpoint.id, field, value)}
                onRemove={() => removeEndpoint(endpoint.id)}
                onDragStart={handleDragStart}
                onDragEnter={handleDragEnter}
                onDragEnd={handleDragEnd}
                isDragging={draggingIndex === index}
                isDragOver={dragOverItem.current === index}
            />
        ))}
      </div>
    </div>
  );
};

export default EndpointEditor;
