
import { AuthMethod, DatabaseType, HttpMethod } from './types';

export const AUTH_METHOD_OPTIONS = [
  { value: AuthMethod.NONE, label: 'No Authentication' },
  { value: AuthMethod.BEARER, label: 'Bearer Token' },
  { value: AuthMethod.BASIC, label: 'Basic Auth' },
  { value: AuthMethod.QUERY, label: 'API Key (Query Param)' },
  { value: AuthMethod.CHAINED, label: 'Chained Request (Token)' },
];

export const DATABASE_TYPE_OPTIONS = [
    { value: DatabaseType.MARIADB, label: 'MariaDB / MySQL' },
    { value: DatabaseType.POSTGRESQL, label: 'PostgreSQL' },
    { value: DatabaseType.SQLITE, label: 'SQLite' },
];

export const HTTP_METHODS: HttpMethod[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];

export const AVAILABLE_MODELS = [
    { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash' },
];
