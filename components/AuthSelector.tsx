
import React, { useState } from 'react';
import { AuthConfig, AuthMethod, HeaderPair } from '../types';
import { AUTH_METHOD_OPTIONS, HTTP_METHODS } from '../constants';
import { LinkIcon, TagIcon, PlusIcon, TrashIcon, SparklesIcon } from './Icons';
import HeaderEditor from './HeaderEditor';

interface AuthSelectorProps {
  authConfig: AuthConfig;
  setAuthConfig: (config: AuthConfig) => void;
}

const AuthSelector: React.FC<AuthSelectorProps> = ({ authConfig, setAuthConfig }) => {
  const [newScope, setNewScope] = useState('');
  const [newArg, setNewArg] = useState('');

  const handleMethodChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newMethod = e.target.value as AuthMethod;
    let newConfig: AuthConfig = { method: newMethod };

    switch (newMethod) {
        case AuthMethod.BEARER:
            newConfig = { ...newConfig, tokenVariableName: '$apiToken' };
            break;
        case AuthMethod.BASIC:
            newConfig = { ...newConfig, usernameVariableName: '$username', passwordVariableName: '$password' };
            break;
        case AuthMethod.QUERY:
            newConfig = { ...newConfig, queryKeyName: 'apiKey', queryValueName: '$apiKey' };
            break;
        case AuthMethod.CHAINED:
            newConfig = { 
                ...newConfig, 
                tokenEndpointPath: '/oauth/token',
                tokenEndpointMethod: 'POST',
                tokenRequestContentType: 'application/x-www-form-urlencoded',
                tokenRequestHeaders: [],
                tokenRequestQueryParams: [],
                tokenRequestScopes: ['openid', 'profile'],
                requestBody: 'grant_type=client_credentials&client_id={{clientId}}&client_secret={{clientSecret}}',
                tokenPathInResponse: 'access_token',
                tokenExpiresInPath: 'expires_in',
                schemeInHeader: 'Bearer',
                constructorArgs: ['clientId', 'clientSecret']
            };
            break;
    }
    setAuthConfig(newConfig);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setAuthConfig({
      ...authConfig,
      [e.target.name]: e.target.value,
    });
  };

  const updateChainedField = (field: keyof AuthConfig, value: any) => {
    setAuthConfig({ ...authConfig, [field]: value });
  };

  const addScope = () => {
    if (newScope.trim()) {
      const currentScopes = authConfig.tokenRequestScopes || [];
      if (!currentScopes.includes(newScope.trim())) {
        updateChainedField('tokenRequestScopes', [...currentScopes, newScope.trim()]);
      }
      setNewScope('');
    }
  };

  const removeScope = (scopeToRemove: string) => {
    const currentScopes = authConfig.tokenRequestScopes || [];
    updateChainedField('tokenRequestScopes', currentScopes.filter(s => s !== scopeToRemove));
  };

  const addArg = () => {
    if (newArg.trim()) {
        const currentArgs = authConfig.constructorArgs || [];
        if (!currentArgs.includes(newArg.trim())) {
            updateChainedField('constructorArgs', [...currentArgs, newArg.trim()]);
        }
        setNewArg('');
    }
  };

  const removeArg = (argToRemove: string) => {
    const currentArgs = authConfig.constructorArgs || [];
    updateChainedField('constructorArgs', currentArgs.filter(a => a !== argToRemove));
  };

  return (
    <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-cyan-400">Auth Strategy</h2>
        {authConfig.method === AuthMethod.CHAINED && (
          <span className="bg-cyan-900/40 text-cyan-400 text-[10px] uppercase font-bold px-2 py-0.5 rounded border border-cyan-500/30">
            Chained OAuth2
          </span>
        )}
      </div>
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Auth Mechanism</label>
          <select value={authConfig.method} onChange={handleMethodChange} className="w-full bg-gray-900 border border-gray-600 rounded-md px-3 py-2 text-sm">
            {AUTH_METHOD_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>

        {authConfig.method === AuthMethod.CHAINED && (
          <div className="space-y-4 animate-fade-in pt-4 border-t border-gray-700">
              <div className="bg-gray-900/40 p-3 rounded-lg border border-gray-700">
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-2">Required OAuth2 Scopes</label>
                  <div className="flex gap-2 mb-2">
                      <input type="text" value={newScope} onChange={(e) => setNewScope(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addScope()} className="flex-1 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-cyan-100" placeholder="e.g. read_reviews"/>
                      <button onClick={addScope} className="bg-cyan-600 p-1 rounded text-white"><PlusIcon className="w-4 h-4"/></button>
                  </div>
                  <div className="flex flex-wrap gap-1">
                      {(authConfig.tokenRequestScopes || []).map(s => (
                          <span key={s} className="bg-gray-700 text-cyan-300 text-[9px] px-2 py-0.5 rounded flex items-center gap-1">
                            {s} <button onClick={() => removeScope(s)} className="text-red-400">×</button>
                          </span>
                      ))}
                  </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Token Endpoint</label>
                <input type="text" name="tokenEndpointPath" value={authConfig.tokenEndpointPath} onChange={handleInputChange} className="w-full bg-gray-900 border border-gray-700 rounded-md px-3 py-1.5 text-xs font-mono" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                  <HeaderEditor label="Auth Headers" headers={authConfig.tokenRequestHeaders || []} onChange={(h) => updateChainedField('tokenRequestHeaders', h)} />
                  <HeaderEditor label="Auth Params" headers={authConfig.tokenRequestQueryParams || []} onChange={(q) => updateChainedField('tokenRequestQueryParams', q)} />
              </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthSelector;
