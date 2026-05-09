import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-microsoft';
import type { OAuthUser } from './oauth.types';
import type { Profile } from 'passport';

@Injectable()
export class MicrosoftStrategy extends PassportStrategy(Strategy, 'microsoft') {
  constructor(config: ConfigService) {
    super({
      clientID: config.get<string>('OAUTH_MICROSOFT_CLIENT_ID') ?? '',
      clientSecret: config.get<string>('OAUTH_MICROSOFT_CLIENT_SECRET') ?? '',
      callbackURL: config.get<string>('OAUTH_MICROSOFT_CALLBACK_URL') ?? '',
      scope: ['user.read'],
      // passport-microsoft uses OAuth2 + Microsoft Graph profile fetch.
      // Setting "prompt" makes account selection more reliable.
      prompt: 'select_account',
    } as unknown as Record<string, unknown>);
  }

  validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: (err: unknown, user?: OAuthUser) => void,
  ) {
    const rawProfile = profile as unknown as {
      id?: string;
      displayName?: string;
      emails?: Array<{ value?: string }>;
      _json?: { mail?: string; userPrincipalName?: string; id?: string };
    };
    const email =
      rawProfile.emails?.[0]?.value || rawProfile._json?.mail || rawProfile._json?.userPrincipalName;
    const id = rawProfile.id || rawProfile._json?.id;
    if (!email || !id) {
      done(new Error('Microsoft account has no email'), undefined);
      return;
    }
    done(null, {
      provider: 'microsoft',
      providerId: String(id),
      email: String(email).toLowerCase(),
      displayName: rawProfile.displayName ? String(rawProfile.displayName) : undefined,
    });
  }
}

