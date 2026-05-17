"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EnterpriseSsoService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const client_1 = require("@prisma/client");
const crypto_1 = require("crypto");
const prisma_service_1 = require("../../prisma/prisma.service");
const auth_service_1 = require("../auth/auth.service");
let EnterpriseSsoService = class EnterpriseSsoService {
    constructor(prisma, jwt, auth) {
        this.prisma = prisma;
        this.jwt = jwt;
        this.auth = auth;
    }
    apiOrigin() {
        return (process.env.API_PUBLIC_URL ?? process.env.WEB_ORIGIN ?? 'http://localhost:4000').replace(/\/$/, '');
    }
    webOrigin() {
        return (process.env.WEB_ORIGIN ?? 'http://localhost:3000').replace(/\/$/, '');
    }
    async getPublicStatus(slug) {
        const org = await this.prisma.organization.findUnique({
            where: { slug },
            select: {
                id: true,
                name: true,
                ssoConfig: { select: { enabled: true, protocol: true } },
            },
        });
        if (!org?.ssoConfig?.enabled)
            return { enabled: false };
        return {
            enabled: true,
            organizationName: org.name,
            protocol: org.ssoConfig.protocol,
            loginUrl: `${this.apiOrigin()}/auth/enterprise/${slug}`,
        };
    }
    async getConfigForMember(orgId, requesterId) {
        await this.assertOrgManager(orgId, requesterId);
        const config = await this.prisma.organizationSsoConfig.findUnique({
            where: { organizationId: orgId },
            select: {
                id: true,
                protocol: true,
                enabled: true,
                issuerUrl: true,
                clientId: true,
                allowedEmailDomains: true,
                updatedAt: true,
            },
        });
        return config ?? null;
    }
    async upsertConfig(orgId, requesterId, dto) {
        await this.assertOrgOwner(orgId, requesterId);
        if (dto.protocol === client_1.EnterpriseSsoProtocol.SAML) {
            throw new common_1.BadRequestException('SAML is not yet supported; use OIDC');
        }
        const domains = (dto.allowedEmailDomains ?? []).map((d) => d.trim().toLowerCase()).filter(Boolean);
        if (!dto.clientSecret?.trim()) {
            const existing = await this.prisma.organizationSsoConfig.findUnique({
                where: { organizationId: orgId },
            });
            if (!existing)
                throw new common_1.BadRequestException('clientSecret is required for new SSO config');
        }
        const secretUpdate = dto.clientSecret?.trim()
            ? { clientSecret: dto.clientSecret.trim() }
            : {};
        return this.prisma.organizationSsoConfig.upsert({
            where: { organizationId: orgId },
            create: {
                organizationId: orgId,
                protocol: dto.protocol,
                enabled: dto.enabled,
                issuerUrl: dto.issuerUrl.replace(/\/$/, ''),
                clientId: dto.clientId,
                clientSecret: dto.clientSecret.trim(),
                allowedEmailDomains: domains,
            },
            update: {
                protocol: dto.protocol,
                enabled: dto.enabled,
                issuerUrl: dto.issuerUrl.replace(/\/$/, ''),
                clientId: dto.clientId,
                ...secretUpdate,
                allowedEmailDomains: domains,
            },
            select: {
                id: true,
                protocol: true,
                enabled: true,
                issuerUrl: true,
                clientId: true,
                allowedEmailDomains: true,
                updatedAt: true,
            },
        });
    }
    async deleteConfig(orgId, requesterId) {
        await this.assertOrgOwner(orgId, requesterId);
        await this.prisma.organizationSsoConfig.deleteMany({ where: { organizationId: orgId } });
        return { ok: true };
    }
    async startLogin(slug, next) {
        const org = await this.prisma.organization.findUnique({
            where: { slug },
            include: { ssoConfig: true },
        });
        if (!org?.ssoConfig?.enabled)
            throw new common_1.NotFoundException('Enterprise SSO not enabled');
        if (org.ssoConfig.protocol === client_1.EnterpriseSsoProtocol.SAML) {
            throw new common_1.BadRequestException('SAML SSO is not yet available');
        }
        const discovery = await this.discoverOidc(org.ssoConfig.issuerUrl);
        const state = await this.jwt.signAsync({
            orgId: org.id,
            slug: org.slug,
            nonce: (0, crypto_1.randomBytes)(16).toString('hex'),
            next: next?.startsWith('/') ? next : undefined,
        }, { expiresIn: '10m' });
        const redirectUri = `${this.apiOrigin()}/auth/enterprise/${slug}/callback`;
        const url = new URL(discovery.authorization_endpoint);
        url.searchParams.set('client_id', org.ssoConfig.clientId);
        url.searchParams.set('response_type', 'code');
        url.searchParams.set('redirect_uri', redirectUri);
        url.searchParams.set('scope', 'openid profile email');
        url.searchParams.set('state', state);
        return url.toString();
    }
    async handleCallback(slug, code, state) {
        const payload = await this.jwt.verifyAsync(state).catch(() => {
            throw new common_1.BadRequestException('Invalid or expired SSO state');
        });
        if (payload.slug !== slug)
            throw new common_1.BadRequestException('SSO state mismatch');
        const org = await this.prisma.organization.findUnique({
            where: { slug },
            include: { ssoConfig: true },
        });
        if (!org?.ssoConfig?.enabled)
            throw new common_1.NotFoundException('SSO not configured');
        const discovery = await this.discoverOidc(org.ssoConfig.issuerUrl);
        const redirectUri = `${this.apiOrigin()}/auth/enterprise/${slug}/callback`;
        const tokenRes = await fetch(discovery.token_endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                grant_type: 'authorization_code',
                code,
                redirect_uri: redirectUri,
                client_id: org.ssoConfig.clientId,
                client_secret: org.ssoConfig.clientSecret,
            }),
        });
        if (!tokenRes.ok) {
            throw new common_1.BadRequestException('OIDC token exchange failed');
        }
        const tokens = (await tokenRes.json());
        if (!tokens.access_token)
            throw new common_1.BadRequestException('OIDC access token missing');
        const email = await this.resolveEmailFromOidc(discovery, tokens.access_token);
        this.assertEmailDomain(email, org.ssoConfig.allowedEmailDomains);
        const session = await this.auth.loginWithOAuth({
            provider: 'microsoft',
            providerId: `enterprise:${org.id}:${(0, crypto_1.createHash)('sha256').update(email).digest('hex').slice(0, 24)}`,
            email,
        });
        await this.ensureOrgMembership(org.id, session.user.id);
        const webOrigin = this.webOrigin();
        const callbackUrl = new URL('/auth/callback', webOrigin);
        callbackUrl.searchParams.set('token', session.accessToken);
        if (payload.next)
            callbackUrl.searchParams.set('next', payload.next);
        return callbackUrl.toString();
    }
    async discoverOidc(issuerUrl) {
        const url = `${issuerUrl.replace(/\/$/, '')}/.well-known/openid-configuration`;
        const res = await fetch(url);
        if (!res.ok)
            throw new common_1.BadRequestException('OIDC discovery failed');
        const json = (await res.json());
        if (!json.authorization_endpoint || !json.token_endpoint) {
            throw new common_1.BadRequestException('Invalid OIDC discovery document');
        }
        return json;
    }
    async resolveEmailFromOidc(discovery, accessToken) {
        if (discovery.userinfo_endpoint) {
            const res = await fetch(discovery.userinfo_endpoint, {
                headers: { Authorization: `Bearer ${accessToken}` },
            });
            if (res.ok) {
                const profile = (await res.json());
                const email = profile.email ?? profile.preferred_username;
                if (email)
                    return email.toLowerCase();
            }
        }
        throw new common_1.BadRequestException('Could not resolve email from identity provider');
    }
    assertEmailDomain(email, allowedDomains) {
        if (allowedDomains.length === 0)
            return;
        const domain = email.split('@')[1]?.toLowerCase();
        if (!domain || !allowedDomains.map((d) => d.toLowerCase()).includes(domain)) {
            throw new common_1.ForbiddenException('Email domain not allowed for this organization');
        }
    }
    async ensureOrgMembership(orgId, userId) {
        await this.prisma.organizationMember.upsert({
            where: { organizationId_userId: { organizationId: orgId, userId } },
            create: { organizationId: orgId, userId, role: client_1.OrganizationMemberRole.MEMBER },
            update: {},
        });
    }
    async assertOrgManager(orgId, userId) {
        const member = await this.prisma.organizationMember.findFirst({
            where: { organizationId: orgId, userId },
        });
        if (!member)
            throw new common_1.ForbiddenException('Not a member');
        if (member.role !== client_1.OrganizationMemberRole.OWNER &&
            member.role !== client_1.OrganizationMemberRole.ADMIN) {
            throw new common_1.ForbiddenException('Org admin required');
        }
    }
    async assertOrgOwner(orgId, userId) {
        const member = await this.prisma.organizationMember.findFirst({
            where: { organizationId: orgId, userId },
        });
        if (!member || member.role !== client_1.OrganizationMemberRole.OWNER) {
            throw new common_1.ForbiddenException('Organization owner required');
        }
    }
};
exports.EnterpriseSsoService = EnterpriseSsoService;
exports.EnterpriseSsoService = EnterpriseSsoService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService,
        auth_service_1.AuthService])
], EnterpriseSsoService);
//# sourceMappingURL=enterprise-sso.service.js.map