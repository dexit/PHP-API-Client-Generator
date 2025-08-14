
import React, { useState } from 'react';
import { parseOpenApiSpec } from '../services/openApiService';
import { Endpoint } from '../types';
import Loader from './Loader';
import { DocumentArrowUpIcon } from './Icons';

interface OpenApiImporterProps {
    onParse: (endpoints: Endpoint[], baseUri: string) => void;
    onClear: () => void;
    onError: (message: string | null) => void;
}

const placeholderSpec = `{
  "openapi": "3.0.0",
  "info": {
    "title": "Simple Pet Store API",
    "version": "1.0.0"
  },
  "servers": [
    {
      "url": "https://jsonplaceholder.typicode.com"
    }
  ],
  "paths": {
    "/users": {
      "get": {
        "summary": "Get all users",
        "operationId": "getUsers",
        "responses": {
          "200": {
            "description": "A list of users",
            "content": {
              "application/json": {
                "schema": {
                  "type": "array",
                  "items": {
                    "$ref": "#/components/schemas/User"
                  }
                }
              }
            }
          }
        }
      }
    }
  },
  "components": {
    "schemas": {
      "User": {
        "type": "object",
        "properties": {
          "id": {
            "type": "integer",
            "example": 1
          },
          "name": {
            "type": "string",
            "example": "John Doe"
          },
          "email": {
            "type": "string",
            "format": "email",
            "example": "john.doe@example.com"
          }
        }
      }
    }
  }
}`;


const OpenApiImporter: React.FC<OpenApiImporterProps> = ({ onParse, onClear, onError }) => {
    const [spec, setSpec] = useState('');
    const [isParsing, setIsParsing] = useState(false);

    const handleParse = async () => {
        if (!spec) {
            onError("Please paste an OpenAPI specification.");
            return;
        }
        setIsParsing(true);
        onError(null); // Clear previous errors
        try {
            const { endpoints, baseUri } = await parseOpenApiSpec(spec);
            if (endpoints.length === 0) {
                onError("No valid endpoints found in the specification.");
            } else {
                onParse(endpoints, baseUri);
            }
        } catch (err) {
            onError(err instanceof Error ? err.message : 'An unknown error occurred during parsing.');
        } finally {
            setIsParsing(false);
        }
    };

    const handleClear = () => {
        setSpec('');
        onClear();
    }

    return (
        <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700">
            <h2 className="text-xl font-bold mb-4 text-cyan-400">Import from OpenAPI/Swagger</h2>
            <div className="space-y-4">
                <div>
                    <label htmlFor="openapi-spec" className="block text-sm font-medium text-gray-400 mb-1">
                        Paste your OpenAPI (3.x) or Swagger (2.0) specification here (JSON or YAML)
                    </label>
                    <textarea
                        id="openapi-spec"
                        value={spec}
                        onChange={(e) => setSpec(e.target.value)}
                        rows={10}
                        className="w-full bg-gray-900 border border-gray-600 rounded-md px-3 py-2 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition font-mono text-sm"
                        placeholder={placeholderSpec}
                    />
                </div>
                <div className="flex items-center justify-end gap-4">
                     <button
                        onClick={handleClear}
                        className="text-gray-400 hover:text-white font-semibold py-2 px-4 rounded-lg transition-all text-sm"
                    >
                        Clear
                    </button>
                    <button
                        onClick={handleParse}
                        disabled={isParsing || !spec}
                        className="flex items-center justify-center gap-3 bg-cyan-600 hover:bg-cyan-700 disabled:bg-gray-600 disabled:text-gray-400 disabled:shadow-none text-white font-bold py-2 px-4 rounded-lg transition-all duration-200 shadow-md hover:shadow-cyan-500/30 disabled:cursor-not-allowed"
                    >
                        {isParsing ? (
                            <>
                                <Loader className="w-5 h-5" />
                                Parsing...
                            </>
                        ) : (
                             <>
                                <DocumentArrowUpIcon className="w-5 h-5" />
                                Parse & Populate Endpoints
                             </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default OpenApiImporter;
