
export enum AuthMethod {
  NONE = 'none',
  BEARER = 'bearer',
  BASIC = 'basic',
  QUERY = 'query',
  CHAINED = 'chained',
}

export enum DatabaseType {
  MARIADB = 'mariadb',
  POSTGRESQL = 'postgresql',
  SQLITE = 'sqlite',
}

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

export type ContentType = 'application/json' | 'application/x-www-form-urlencoded' | 'text/plain';

export interface HeaderPair {
  id: string;
  key: string;
  value: string;
}

export interface ExtractionRule {
  id: string;
  property: string; // The property name in the DTO or return variable
  path: string;     // The dot-notation path in the JSON response (e.g. data.user.id)
}

export interface DbConfig {
  enabled: boolean;
  dbType: DatabaseType;
  tableName: string;
}

export interface ResilienceConfig {
  maxRetries: number;
  baseDelay: number; // in milliseconds
  timeout: number; // in seconds
}

export interface DocConfig {
  generatePhpDoc: boolean;
  generateReadme: boolean;
  includeExamples: boolean;
  generateOpenApi: boolean;
  generateComposer: boolean;
  includeExtendedHelpers: boolean; 
  useChromeAi: boolean; 
  includeWpCustomFields: boolean; // Support for ACF/SCF mapping
}

export interface Endpoint {
  id: string;
  name: string;
  method: HttpMethod;
  path: string;
  responsePayload?: string;
  extractionRules: ExtractionRule[]; 
  dbConfig: DbConfig;
  headers: HeaderPair[];
  contentType?: ContentType;
}

export interface AuthConfig {
  method: AuthMethod;
  tokenVariableName?: string;
  usernameVariableName?: string;
  passwordVariableName?: string;
  queryKeyName?: string;
  queryValueName?: string;
  tokenEndpointPath?: string;
  tokenEndpointMethod?: HttpMethod;
  tokenRequestContentType?: 'application/json' | 'application/x-www-form-urlencoded';
  tokenRequestHeaders?: HeaderPair[];
  tokenRequestQueryParams?: HeaderPair[];
  tokenRequestScopes?: string[];
  requestBody?: string;
  tokenPathInResponse?: string;
  tokenExpiresInPath?: string; 
  schemeInHeader?: string;
  constructorArgs?: string[]; 
}

export interface AiModelConfig {
  model: string;
  temperature: number;
  topP: number;
  topK: number;
  thinkingBudget?: number;
}
