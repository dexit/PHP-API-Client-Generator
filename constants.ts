
import { AuthMethod, DatabaseType, HttpMethod, ContentType } from './types';

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

export const CONTENT_TYPE_OPTIONS: { value: ContentType, label: string }[] = [
    { value: 'application/json', label: 'JSON (application/json)' },
    { value: 'application/x-www-form-urlencoded', label: 'Form (x-www-form-urlencoded)' },
    { value: 'text/plain', label: 'Plain Text (text/plain)' },
];

export const HTTP_METHODS: HttpMethod[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];

export const AVAILABLE_MODELS = [
    { value: 'gemini-3-flash-preview', label: 'Gemini 3 Flash (Fast)' },
    { value: 'gemini-3-pro-preview', label: 'Gemini 3 Pro (High Quality)' },
];
