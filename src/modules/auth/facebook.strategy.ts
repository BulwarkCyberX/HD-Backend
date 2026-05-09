import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-facebook';
import type { OAuthUser } from './oauth.types';
import type { Profile } from 'passport';

@Injectable()
export class FacebookStrategy extends PassportStrategy(Strategy, 'facebook') {
  constructor(config: ConfigService) {
    super({
      clientID: config.get<string>('OAUTH_FACEBOOK_APP_ID') ?? '',
      clientSecret: config.get<string>('OAUTH_FACEBOOK_APP_SECRET') ?? '',
      callbackURL: config.get<string>('OAUTH_FACEBOOK_CALLBACK_URL') ?? '',
      profileFields: ['id', 'displayName', 'emails'],
    });
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
      done(new Error('Facebook account has no email'), undefined);
      return;
    }
    done(null, {
      provider: 'facebook',
      providerId: String(id),
      email: String(email).toLowerCase(),
      displayName: rawProfile.displayName ? String(rawProfile.displayName) : undefined,
    });
  }
}

