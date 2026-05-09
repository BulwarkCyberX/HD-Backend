import type { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleStrategy } from './google.strategy';
import { MicrosoftStrategy } from './microsoft.strategy';
import { FacebookStrategy } from './facebook.strategy';
import { LinkedInStrategy } from './linkedin.strategy';

/**
 * Passport OAuth strategies must not be constructed with empty client IDs (passport-oauth2 throws).
 * Register each strategy only when its env credentials are present so the API can start
 * (e.g. email/password auth) without OAuth configured in production.
 */
export const oauthStrategyProviders: Provider[] = [
  {
    provide: GoogleStrategy,
    useFactory: (config: ConfigService) => {
      const clientID = config.get<string>('OAUTH_GOOGLE_CLIENT_ID')?.trim();
      const clientSecret = config.get<string>('OAUTH_GOOGLE_CLIENT_SECRET')?.trim();
      if (!clientID || !clientSecret) return null;
      return new GoogleStrategy(config);
    },
    inject: [ConfigService],
  },
  {
    provide: MicrosoftStrategy,
    useFactory: (config: ConfigService) => {
      const clientID = config.get<string>('OAUTH_MICROSOFT_CLIENT_ID')?.trim();
      const clientSecret = config.get<string>('OAUTH_MICROSOFT_CLIENT_SECRET')?.trim();
      if (!clientID || !clientSecret) return null;
      return new MicrosoftStrategy(config);
    },
    inject: [ConfigService],
  },
  {
    provide: FacebookStrategy,
    useFactory: (config: ConfigService) => {
      const clientID = config.get<string>('OAUTH_FACEBOOK_APP_ID')?.trim();
      const clientSecret = config.get<string>('OAUTH_FACEBOOK_APP_SECRET')?.trim();
      if (!clientID || !clientSecret) return null;
      return new FacebookStrategy(config);
    },
    inject: [ConfigService],
  },
  {
    provide: LinkedInStrategy,
    useFactory: (config: ConfigService) => {
      const clientID = config.get<string>('OAUTH_LINKEDIN_CLIENT_ID')?.trim();
      const clientSecret = config.get<string>('OAUTH_LINKEDIN_CLIENT_SECRET')?.trim();
      if (!clientID || !clientSecret) return null;
      return new LinkedInStrategy(config);
    },
    inject: [ConfigService],
  },
];
