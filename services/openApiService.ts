
import SwaggerParser from '@apidevtools/swagger-parser';
import * as yaml from 'js-yaml';
import { Endpoint, HttpMethod, DatabaseType } from '../types';

// Helper to generate a name if operationId is missing
const generateOperationName = (method: string, path: string): string => {
    const pathParts = path.toLowerCase().replace(/[\{\}]/g, '').split('/').filter(p => p);
    const name = method.toLowerCase() + pathParts.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join('');
    return name.replace(/[^a-zA-Z0-9]/g, '');
};

// Helper to generate a sample JSON payload from a schema
const generateSampleFromSchema = (schema: any): any => {
    if (!schema) return null;
    
    // Dereferencing should be handled by the parser, but this is a fallback
    if (schema.$ref) {
        return { note: `Could not resolve reference: ${schema.$ref}`};
    }

    if (schema.example) return schema.example;
    if (schema.default) return schema.default;

    const type = Array.isArray(schema.type) ? schema.type[0] : schema.type;

    switch (type) {
        case 'object':
            const obj: { [key: string]: any } = {};
            if (schema.properties) {
                for (const key in schema.properties) {
                    obj[key] = generateSampleFromSchema(schema.properties[key]);
                }
            }
            return obj;
        case 'array':
            // Generate an array with one sample item
            return schema.items ? [generateSampleFromSchema(schema.items)] : [];
        case 'string':
            if (schema.format === 'date-time') return new Date().toISOString();
            if (schema.format === 'date') return new Date().toISOString().split('T')[0];
            if (schema.format === 'email') return 'user@example.com';
            if (schema.format === 'uuid') return '00000000-0000-0000-0000-000000000000';
            return 'string';
        case 'number':
             return schema.format === 'float' || schema.format === 'double' ? 0.0 : 0;
        case 'integer':
            return 0;
        case 'boolean':
            return true;
        case 'null':
            return null;
        default:
            if (schema.properties) {
                return generateSampleFromSchema({ ...schema, type: 'object' });
            }
            if (schema.items) {
                 return generateSampleFromSchema({ ...schema, type: 'array' });
            }
            return {}; // Return empty object for unknown types
    }
};

export const parseOpenApiSpec = async (spec: string): Promise<{ endpoints: Endpoint[]; baseUri: string }> => {
    let apiObject: object;
    try {
        apiObject = JSON.parse(spec);
    } catch (jsonError) {
        try {
            const parsedYaml = yaml.load(spec);
            if (typeof parsedYaml === 'object' && parsedYaml !== null) {
                apiObject = parsedYaml as object;
            } else {
                 throw new Error("YAML did not parse to a valid object.");
            }
        } catch (yamlError) {
            throw new Error(`Could not parse input as JSON or YAML. ${yamlError.message}`);
        }
    }

    try {
        // Use bundle to resolve all internal/local $refs
        const api = await SwaggerParser.bundle(apiObject);

        const baseUri = (api.servers && api.servers[0]?.url) || '';
        const endpoints: Endpoint[] = [];

        for (const path in api.paths) {
            for (const method in api.paths[path]) {
                const httpMethod = method.toUpperCase() as HttpMethod;
                if (!['GET', 'POST', 'PUT', 'DELETE', 'PATCH'].includes(httpMethod)) {
                    continue;
                }

                const op = api.paths[path][method];
                if (!op) continue;
                
                // Find a success response (200, 201, 202, etc.)
                const successResponseKey = Object.keys(op.responses).find(key => key.startsWith('2'));
                let responsePayload = '';
                
                if (successResponseKey) {
                    const successResponse = op.responses[successResponseKey];
                    let schema = null;
                    
                    // OpenAPI 3.x
                    if (successResponse.content && successResponse.content['application/json']) {
                        schema = successResponse.content['application/json'].schema;
                    // OpenAPI 2.0 (Swagger)
                    } else if (successResponse.schema) {
                        schema = successResponse.schema;
                    }

                    if (schema) {
                        const sampleJson = generateSampleFromSchema(schema);
                        if(sampleJson) {
                           responsePayload = JSON.stringify(sampleJson, null, 2);
                        }
                    }
                }
                
                const endpoint: Endpoint = {
                    id: `${method}-${path}-${Date.now()}`, // Add timestamp for more unique ID
                    name: op.operationId || generateOperationName(method, path),
                    method: httpMethod,
                    path: path,
                    responsePayload: responsePayload,
                    dbConfig: {
                        enabled: false,
                        dbType: DatabaseType.MARIADB,
                        tableName: ''
                    }
                };
                endpoints.push(endpoint);
            }
        }
        return { endpoints, baseUri };
    } catch (err) {
        console.error("OpenAPI parsing error:", err);
        throw new Error(`Failed to parse OpenAPI specification. ${err.message}`);
    }
};
