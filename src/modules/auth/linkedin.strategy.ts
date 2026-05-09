import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-linkedin-oauth2';
import type { OAuthUser } from './oauth.types';
import type { Profile } from 'passport';
import type { StrategyOption } from 'passport-linkedin-oauth2';

@Injectable()
export class LinkedInStrategy extends PassportStrategy(Strategy, 'linkedin') {
  constructor(config: ConfigService) {
    const options: StrategyOption = {
      clientID: config.get<string>('OAUTH_LINKEDIN_CLIENT_ID') ?? '',
      clientSecret: config.get<string>('OAUTH_LINKEDIN_CLIENT_SECRET') ?? '',
      callbackURL: config.get<string>('OAUTH_LINKEDIN_CALLBACK_URL') ?? '',
      scope: ['r_liteprofile', 'r_emailaddress'],
    };
    super(options);
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
    };
    const email = rawProfile.emails?.[0]?.value;
    const id = rawProfile.id;
    if (!email || !id) {
      done(new Error('LinkedIn account has no email'), undefined);
      return;
    }
    done(null, {
      provider: 'linkedin',
      providerId: String(id),
      email: String(email).toLowerCase(),
      displayName: rawProfile.displayName ? String(rawProfile.displayName) : undefined,
    });
  }
}

