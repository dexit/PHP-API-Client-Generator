
import React from 'react';
import { AuthConfig, AuthMethod, HttpMethod } from '../types';
import { AUTH_METHOD_OPTIONS, HTTP_METHODS } from '../constants';
import { LinkIcon } from './Icons';

interface AuthSelectorProps {
  authConfig: AuthConfig;
  setAuthConfig: (config: AuthConfig) => void;
}

const AuthSelector: React.FC<AuthSelectorProps> = ({ authConfig, setAuthConfig }) => {
  const handleMethodChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newMethod = e.target.value as AuthMethod;
    let newConfig: AuthConfig = { method: newMethod };

    // Set sensible defaults when switching
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
                requestBody: '{\n  "grant_type": "client_credentials",\n  "client_id": "YOUR_CLIENT_ID",\n  "client_secret": "YOUR_CLIENT_SECRET"\n}',
                tokenPathInResponse: 'access_token',
                schemeInHeader: 'Bearer',
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

  return (
    <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700">
      <h2 className="text-xl font-bold mb-4 text-cyan-400">Authentication</h2>
      <div className="space-y-4">
        <div>
          <label htmlFor="authMethod" className="block text-sm font-medium text-gray-400 mb-1">
            Method
          </label>
          <select
            id="authMethod"
            value={authConfig.method}
            onChange={handleMethodChange}
            className="w-full bg-gray-900 border border-gray-600 rounded-md px-3 py-2 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition"
          >
            {AUTH_METHOD_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Simple Auth Methods */}
        {authConfig.method === AuthMethod.BEARER && (
          <div>
            <label htmlFor="tokenVariableName" className="block text-sm font-medium text-gray-400 mb-1">Token Variable Name</label>
            <input type="text" id="tokenVariableName" name="tokenVariableName" value={authConfig.tokenVariableName} onChange={handleInputChange} className="w-full bg-gray-900 border border-gray-600 rounded-md px-3 py-2 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition" placeholder="e.g., $apiToken"/>
          </div>
        )}
        {authConfig.method === AuthMethod.BASIC && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="usernameVariableName" className="block text-sm font-medium text-gray-400 mb-1">Username Variable</label>
              <input type="text" id="usernameVariableName" name="usernameVariableName" value={authConfig.usernameVariableName} onChange={handleInputChange} className="w-full bg-gray-900 border border-gray-600 rounded-md px-3 py-2 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition" placeholder="e.g., $username"/>
            </div>
            <div>
              <label htmlFor="passwordVariableName" className="block text-sm font-medium text-gray-400 mb-1">Password Variable</label>
              <input type="text" id="passwordVariableName" name="passwordVariableName" value={authConfig.passwordVariableName} onChange={handleInputChange} className="w-full bg-gray-900 border border-gray-600 rounded-md px-3 py-2 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition" placeholder="e.g., $password"/>
            </div>
          </div>
        )}
        {authConfig.method === AuthMethod.QUERY && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="queryKeyName" className="block text-sm font-medium text-gray-400 mb-1">Query Key Name</label>
              <input type="text" id="queryKeyName" name="queryKeyName" value={authConfig.queryKeyName} onChange={handleInputChange} className="w-full bg-gray-900 border border-gray-600 rounded-md px-3 py-2 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition" placeholder="e.g., api_key"/>
            </div>
            <div>
              <label htmlFor="queryValueName" className="block text-sm font-medium text-gray-400 mb-1">Key Value Variable</label>
              <input type="text" id="queryValueName" name="queryValueName" value={authConfig.queryValueName} onChange={handleInputChange} className="w-full bg-gray-900 border border-gray-600 rounded-md px-3 py-2 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition" placeholder="e.g., $apiKey"/>
            </div>
          </div>
        )}

        {/* Chained Request Auth Method */}
        {authConfig.method === AuthMethod.CHAINED && (
          <div className="border-t border-cyan-500/20 pt-4 mt-4 space-y-4">
              <div className="flex items-center gap-2 text-cyan-400">
                  <LinkIcon className="w-5 h-5"/>
                  <h3 className="text-lg font-semibold">Token Request Configuration</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-[auto,1fr] gap-4">
                <div>
                  <label htmlFor="tokenEndpointMethod" className="block text-sm font-medium text-gray-400 mb-1">Method</label>
                  <select id="tokenEndpointMethod" name="tokenEndpointMethod" value={authConfig.tokenEndpointMethod} onChange={handleInputChange} className="bg-gray-900 border border-gray-600 rounded-md px-3 py-2 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition">
                      {HTTP_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label htmlFor="tokenEndpointPath" className="block text-sm font-medium text-gray-400 mb-1">Token Endpoint Path</label>
                  <input type="text" id="tokenEndpointPath" name="tokenEndpointPath" value={authConfig.tokenEndpointPath} onChange={handleInputChange} className="w-full bg-gray-900 border border-gray-600 rounded-md px-3 py-2 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition" placeholder="e.g., /oauth/token"/>
                </div>
              </div>
              <div>
                  <label htmlFor="requestBody" className="block text-sm font-medium text-gray-400 mb-1">Request Body (JSON)</label>
                  <textarea id="requestBody" name="requestBody" value={authConfig.requestBody} onChange={handleInputChange} rows={5} className="w-full bg-gray-900 border border-gray-600 rounded-md px-3 py-2 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition font-mono text-sm" placeholder='e.g., {"grant_type": "client_credentials"}' />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="tokenPathInResponse" className="block text-sm font-medium text-gray-400 mb-1">Token Path in Response</label>
                  <input type="text" id="tokenPathInResponse" name="tokenPathInResponse" value={authConfig.tokenPathInResponse} onChange={handleInputChange} className="w-full bg-gray-900 border border-gray-600 rounded-md px-3 py-2 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition" placeholder="e.g., access_token"/>
                  <p className="text-xs text-gray-500 mt-1">Use dot notation for nested keys, e.g., `data.token`</p>
                </div>
                <div>
                  <label htmlFor="schemeInHeader" className="block text-sm font-medium text-gray-400 mb-1">Auth Scheme for Header</label>
                  <input type="text" id="schemeInHeader" name="schemeInHeader" value={authConfig.schemeInHeader} onChange={handleInputChange} className="w-full bg-gray-900 border border-gray-600 rounded-md px-3 py-2 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition" placeholder="e.g., Bearer"/>
                </div>
              </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthSelector;
