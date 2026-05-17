"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.API_SCOPES = void 0;
exports.parseApiScopes = parseApiScopes;
exports.requireApiScope = requireApiScope;
const common_1 = require("@nestjs/common");
exports.API_SCOPES = ['read', 'write:reports'];
function parseApiScopes(scopes) {
    const allowed = new Set(exports.API_SCOPES);
    const parsed = (scopes ?? ['read']).filter((s) => allowed.has(s));
    return parsed.length > 0 ? parsed : ['read'];
}
function requireApiScope(scopes, required) {
    if (scopes.includes(required) || scopes.includes('write'))
        return;
    throw new common_1.ForbiddenException(`API key missing scope: ${required}`);
}
//# sourceMappingURL=api-scopes.js.map