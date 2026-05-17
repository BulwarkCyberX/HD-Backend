import { ForbiddenException } from '@nestjs/common';

export const API_SCOPES = ['read', 'write:reports'] as const;
export type ApiScope = (typeof API_SCOPES)[number];

export function parseApiScopes(scopes?: string[]): ApiScope[] {
  const allowed = new Set<string>(API_SCOPES);
  const parsed = (scopes ?? ['read']).filter((s) => allowed.has(s)) as ApiScope[];
  return parsed.length > 0 ? parsed : ['read'];
}

export function requireApiScope(scopes: string[], required: ApiScope) {
  if (scopes.includes(required) || scopes.includes('write' as never)) return;
  throw new ForbiddenException(`API key missing scope: ${required}`);
}
