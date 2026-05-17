import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  EnterpriseSsoProtocol,
  OrganizationMemberRole,
} from '@prisma/client';
import { createHash, randomBytes } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthService } from '../auth/auth.service';
import type { UpsertOrgSsoDto } from './dto/upsert-org-sso.dto';

type OidcDiscovery = {
  authorization_endpoint: string;
  token_endpoint: string;
  userinfo_endpoint?: string;
};

type SsoStatePayload = {
  orgId: string;
  slug: string;
  nonce: string;
};

@Injectable()
export class EnterpriseSsoService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly auth: AuthService,
  ) {}

  private apiOrigin() {
    return (process.env.API_PUBLIC_URL ?? process.env.WEB_ORIGIN ?? 'http://localhost:4000').replace(
      /\/$/,
      '',
    );
  }

  private webOrigin() {
    return (process.env.WEB_ORIGIN ?? 'http://localhost:3000').replace(/\/$/, '');
  }

  async getPublicStatus(slug: string) {
    const org = await this.prisma.organization.findUnique({
      where: { slug },
      select: {
        id: true,
        name: true,
        ssoConfig: { select: { enabled: true, protocol: true } },
      },
    });
    if (!org?.ssoConfig?.enabled) return { enabled: false as const };
    return {
      enabled: true as const,
      organizationName: org.name,
      protocol: org.ssoConfig.protocol,
      loginUrl: `${this.apiOrigin()}/auth/enterprise/${slug}`,
    };
  }

  async getConfigForMember(orgId: string, requesterId: string) {
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

  async upsertConfig(orgId: string, requesterId: string, dto: UpsertOrgSsoDto) {
    await this.assertOrgOwner(orgId, requesterId);
    if (dto.protocol === EnterpriseSsoProtocol.SAML) {
      throw new BadRequestException('SAML is not yet supported; use OIDC');
    }
    const domains = (dto.allowedEmailDomains ?? []).map((d) => d.trim().toLowerCase()).filter(Boolean);
    if (!dto.clientSecret?.trim()) {
      const existing = await this.prisma.organizationSsoConfig.findUnique({
        where: { organizationId: orgId },
      });
      if (!existing) throw new BadRequestException('clientSecret is required for new SSO config');
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
        clientSecret: dto.clientSecret!.trim(),
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

  async deleteConfig(orgId: string, requesterId: string) {
    await this.assertOrgOwner(orgId, requesterId);
    await this.prisma.organizationSsoConfig.deleteMany({ where: { organizationId: orgId } });
    return { ok: true };
  }

  async startLogin(slug: string, next?: string) {
    const org = await this.prisma.organization.findUnique({
      where: { slug },
      include: { ssoConfig: true },
    });
    if (!org?.ssoConfig?.enabled) throw new NotFoundException('Enterprise SSO not enabled');
    if (org.ssoConfig.protocol === EnterpriseSsoProtocol.SAML) {
      throw new BadRequestException('SAML SSO is not yet available');
    }

    const discovery = await this.discoverOidc(org.ssoConfig.issuerUrl);
    const state = await this.jwt.signAsync(
      {
        orgId: org.id,
        slug: org.slug,
        nonce: randomBytes(16).toString('hex'),
        next: next?.startsWith('/') ? next : undefined,
      } satisfies SsoStatePayload & { next?: string },
      { expiresIn: '10m' },
    );

    const redirectUri = `${this.apiOrigin()}/auth/enterprise/${slug}/callback`;
    const url = new URL(discovery.authorization_endpoint);
    url.searchParams.set('client_id', org.ssoConfig.clientId);
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('redirect_uri', redirectUri);
    url.searchParams.set('scope', 'openid profile email');
    url.searchParams.set('state', state);
    return url.toString();
  }

  async handleCallback(slug: string, code: string, state: string) {
    const payload = await this.jwt.verifyAsync<SsoStatePayload & { next?: string }>(state).catch(() => {
      throw new BadRequestException('Invalid or expired SSO state');
    });
    if (payload.slug !== slug) throw new BadRequestException('SSO state mismatch');

    const org = await this.prisma.organization.findUnique({
      where: { slug },
      include: { ssoConfig: true },
    });
    if (!org?.ssoConfig?.enabled) throw new NotFoundException('SSO not configured');

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
      throw new BadRequestException('OIDC token exchange failed');
    }
    const tokens = (await tokenRes.json()) as { access_token?: string };
    if (!tokens.access_token) throw new BadRequestException('OIDC access token missing');

    const email = await this.resolveEmailFromOidc(discovery, tokens.access_token);
    this.assertEmailDomain(email, org.ssoConfig.allowedEmailDomains);

    const session = await this.auth.loginWithOAuth({
      provider: 'microsoft',
      providerId: `enterprise:${org.id}:${createHash('sha256').update(email).digest('hex').slice(0, 24)}`,
      email,
    });

    await this.ensureOrgMembership(org.id, session.user.id);

    const webOrigin = this.webOrigin();
    const callbackUrl = new URL('/auth/callback', webOrigin);
    callbackUrl.searchParams.set('token', session.accessToken);
    if (payload.next) callbackUrl.searchParams.set('next', payload.next);
    return callbackUrl.toString();
  }

  private async discoverOidc(issuerUrl: string): Promise<OidcDiscovery> {
    const url = `${issuerUrl.replace(/\/$/, '')}/.well-known/openid-configuration`;
    const res = await fetch(url);
    if (!res.ok) throw new BadRequestException('OIDC discovery failed');
    const json = (await res.json()) as OidcDiscovery;
    if (!json.authorization_endpoint || !json.token_endpoint) {
      throw new BadRequestException('Invalid OIDC discovery document');
    }
    return json;
  }

  private async resolveEmailFromOidc(discovery: OidcDiscovery, accessToken: string) {
    if (discovery.userinfo_endpoint) {
      const res = await fetch(discovery.userinfo_endpoint, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) {
        const profile = (await res.json()) as { email?: string; preferred_username?: string };
        const email = profile.email ?? profile.preferred_username;
        if (email) return email.toLowerCase();
      }
    }
    throw new BadRequestException('Could not resolve email from identity provider');
  }

  private assertEmailDomain(email: string, allowedDomains: string[]) {
    if (allowedDomains.length === 0) return;
    const domain = email.split('@')[1]?.toLowerCase();
    if (!domain || !allowedDomains.map((d) => d.toLowerCase()).includes(domain)) {
      throw new ForbiddenException('Email domain not allowed for this organization');
    }
  }

  private async ensureOrgMembership(orgId: string, userId: string) {
    await this.prisma.organizationMember.upsert({
      where: { organizationId_userId: { organizationId: orgId, userId } },
      create: { organizationId: orgId, userId, role: OrganizationMemberRole.MEMBER },
      update: {},
    });
  }

  private async assertOrgManager(orgId: string, userId: string) {
    const member = await this.prisma.organizationMember.findFirst({
      where: { organizationId: orgId, userId },
    });
    if (!member) throw new ForbiddenException('Not a member');
    if (
      member.role !== OrganizationMemberRole.OWNER &&
      member.role !== OrganizationMemberRole.ADMIN
    ) {
      throw new ForbiddenException('Org admin required');
    }
  }

  private async assertOrgOwner(orgId: string, userId: string) {
    const member = await this.prisma.organizationMember.findFirst({
      where: { organizationId: orgId, userId },
    });
    if (!member || member.role !== OrganizationMemberRole.OWNER) {
      throw new ForbiddenException('Organization owner required');
    }
  }
}
