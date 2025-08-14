import React, { useState, useRef } from 'react';
import { Endpoint, DbConfig, DatabaseType, HttpMethod } from '../types';
import { PlusIcon, TrashIcon, ChevronDownIcon, DatabaseIcon, GripVerticalIcon } from './Icons';
import { HTTP_METHODS, DATABASE_TYPE_OPTIONS } from '../constants';

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

    return (
        <div
            draggable
            onDragStart={() => onDragStart(index)}
            onDragEnter={() => onDragEnter(index)}
            onDragEnd={onDragEnd}
            onDragOver={(e) => e.preventDefault()}
            className={`
                bg-gray-900/50 rounded-lg border border-gray-700 transition-all duration-300
                ${isDragging ? 'opacity-30' : 'opacity-100'}
                ${isDragOver ? 'border-cyan-500 scale-105' : 'border-gray-700'}
            `}
        >
            <div className="flex items-center p-2 gap-2">
                <div className="cursor-grab text-gray-500 hover:text-white" title="Drag to reorder">
                    <GripVerticalIcon className="w-6 h-6" />
                </div>
                
                <select
                    value={endpoint.method}
                    onChange={(e) => onUpdate('method', e.target.value)}
                    className={`rounded-md px-2 py-1 focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 transition text-sm font-bold border-0 ${getMethodClass(endpoint.method)}`}
                >
                    {HTTP_METHODS.map(method => <option key={method} value={method}>{method}</option>)}
                </select>
                
                <input
                    type="text"
                    placeholder="Method Name (e.g., getUsers)"
                    value={endpoint.name}
                    onChange={(e) => onUpdate('name', e.target.value)}
                    className="bg-gray-700/80 border-transparent rounded-md px-3 py-1 focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 transition text-sm w-1/3 flex-grow"
                />
                <input
                    type="text"
                    placeholder="Path (e.g., /users/{id})"
                    value={endpoint.path}
                    onChange={(e) => onUpdate('path', e.target.value)}
                    className="bg-gray-700/80 border-transparent rounded-md px-3 py-1 focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 transition text-sm w-2/3 flex-grow"
                />

                <div className="flex items-center">
                     <button
                        onClick={() => setIsDetailsOpen(!isDetailsOpen)}
                        className="text-gray-400 hover:text-cyan-400 transition p-1.5 rounded-md hover:bg-cyan-500/10"
                        aria-label="Toggle details"
                    >
                        <ChevronDownIcon className={`w-5 h-5 transition-transform ${isDetailsOpen ? 'rotate-180' : ''}`} />
                    </button>
                    <button
                        onClick={onRemove}
                        className="text-gray-500 hover:text-red-500 transition p-1.5 rounded-md hover:bg-red-500/10"
                        aria-label="Remove endpoint"
                    >
                        <TrashIcon className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {isDetailsOpen && (
                 <div className="border-t border-gray-700/50 p-4 space-y-4 animate-fade-in">
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">
                            Response Payload (JSON Schema)
                        </label>
                        <textarea
                            placeholder="Paste a sample JSON response here to generate a typed DTO..."
                            value={endpoint.responsePayload}
                            onChange={(e) => onUpdate('responsePayload', e.target.value)}
                            rows={6}
                            className="bg-gray-800 border border-gray-600 rounded-md px-3 py-2 focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 transition text-sm w-full font-mono"
                        />
                    </div>
                    <div className="space-y-3 p-3 bg-gray-800/70 rounded-lg border border-gray-700/50">
                        <div className="flex items-center justify-between">
                            <label htmlFor={`db-enabled-${endpoint.id}`} className="flex items-center gap-2 text-sm font-medium text-gray-300">
                                <DatabaseIcon className="w-5 h-5 text-cyan-400"/>
                                Generate Database Persistence Method
                            </label>
                             <input
                                type="checkbox"
                                id={`db-enabled-${endpoint.id}`}
                                checked={endpoint.dbConfig.enabled}
                                onChange={(e) => handleDbConfigChange('enabled', e.target.checked)}
                                className="h-4 w-4 rounded border-gray-500 bg-gray-700 text-cyan-600 focus:ring-cyan-500"
                            />
                        </div>

                        {endpoint.dbConfig.enabled && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-gray-700/50">
                                <div>
                                    <label htmlFor={`db-type-${endpoint.id}`} className="block text-xs font-medium text-gray-400 mb-1">Database</label>
                                    <select
                                        id={`db-type-${endpoint.id}`}
                                        value={endpoint.dbConfig.dbType}
                                        onChange={(e) => handleDbConfigChange('dbType', e.target.value)}
                                        className="w-full bg-gray-700 border border-gray-600 rounded-md px-2 py-1 focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 transition text-sm"
                                    >
                                        {DATABASE_TYPE_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label htmlFor={`db-table-${endpoint.id}`} className="block text-xs font-medium text-gray-400 mb-1">Table Name</label>
                                    <input
                                        type="text"
                                        id={`db-table-${endpoint.id}`}
                                        placeholder="e.g., users"
                                        value={endpoint.dbConfig.tableName}
                                        onChange={(e) => handleDbConfigChange('tableName', e.target.value)}
                                        className="w-full bg-gray-700 border border-gray-600 rounded-md px-2 py-1 focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 transition text-sm"
                                    />
                                </div>
                            </div>
                        )}
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
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-cyan-400">API Endpoints</h2>
        <button
          onClick={addEndpoint}
          className="flex items-center gap-2 bg-cyan-600/50 hover:bg-cyan-600/80 text-white font-semibold py-1 px-3 rounded-md transition-all text-sm"
        >
          <PlusIcon className="w-4 h-4" />
          Add
        </button>
      </div>
      <div className="space-y-3">
        {endpoints.length === 0 && (
          <p className="text-gray-400 text-center py-4">No endpoints defined. Click 'Add' to start.</p>
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