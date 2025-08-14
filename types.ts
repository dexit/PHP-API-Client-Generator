
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

export interface DbConfig {
  enabled: boolean;
  dbType: DatabaseType;
  tableName: string;
}

export interface Endpoint {
  id: string;
  name: string;
  method: HttpMethod;
  path: string;
  responsePayload?: string;
  dbConfig: DbConfig;
}

export interface AuthConfig {
  method: AuthMethod;
  // Bearer
  tokenVariableName?: string;
  // Basic
  usernameVariableName?: string;
  passwordVariableName?: string;
  // Query
  queryKeyName?: string;
  queryValueName?: string;
  // Chained
  tokenEndpointPath?: string;
  tokenEndpointMethod?: HttpMethod;
  requestBody?: string;
  tokenPathInResponse?: string;
  schemeInHeader?: string;
}

export interface AiModelConfig {
  model: string;
  temperature: number;
  topP: number;
  topK: number;
  thinkingBudget?: number;
}
