export declare const API_SCOPES: readonly ["read", "write:reports"];
export type ApiScope = (typeof API_SCOPES)[number];
export declare function parseApiScopes(scopes?: string[]): ApiScope[];
export declare function requireApiScope(scopes: string[], required: ApiScope): void;
